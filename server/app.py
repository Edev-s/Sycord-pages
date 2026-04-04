"""
Sycord Pages – Flask VPS Server
================================
A lightweight Flask application that serves deployed websites via subdomain
detection.  The server is exposed to the internet through a Cloudflare Tunnel,
so every ``<project>.yourdomain.com`` request lands here and is resolved to
the correct project files stored on disk.

API surface
-----------
POST   /api/deploy/<project_id>        – upload / update project files
GET    /api/projects/<project_id>       – project metadata
GET    /api/logs?project_id=…&limit=…   – recent server logs
DELETE /api/projects/<project_id>       – remove a project and its files

The root path ``/`` returns a simple health-check page.
"""

from __future__ import annotations

import json
import logging
import os
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path

from flask import Flask, Response, abort, jsonify, request, send_from_directory

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = Path(os.environ.get("SYCORD_DATA_DIR", "/var/sycord/data"))
PROJECTS_DIR = BASE_DIR / "projects"
LOG_FILE = BASE_DIR / "server.log"

# Ensure directories exist
PROJECTS_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE.parent.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
file_handler = logging.FileHandler(str(LOG_FILE))
file_handler.setFormatter(
    logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
)

logger = logging.getLogger("sycord")
logger.setLevel(logging.INFO)
logger.addHandler(file_handler)
logger.addHandler(logging.StreamHandler())

# ---------------------------------------------------------------------------
# Flask App
# ---------------------------------------------------------------------------
app = Flask(__name__)


# ── helpers ────────────────────────────────────────────────────────────────

def _project_dir(project_id: str) -> Path:
    """Return the on-disk directory for *project_id*."""
    # Prevent directory traversal
    safe_id = os.path.basename(project_id)
    return PROJECTS_DIR / safe_id


def _meta_path(project_id: str) -> Path:
    return _project_dir(project_id) / ".meta.json"


def _read_meta(project_id: str) -> dict | None:
    meta = _meta_path(project_id)
    if meta.exists():
        return json.loads(meta.read_text())
    return None


def _write_meta(project_id: str, data: dict) -> None:
    _meta_path(project_id).write_text(json.dumps(data, default=str))


def _extract_subdomain() -> str | None:
    """Return the first subdomain segment from the ``Host`` header, or *None*
    when the request targets the bare domain / localhost."""
    host = request.host.split(":")[0]  # strip port
    parts = host.split(".")
    # e.g. "mysite.example.com" → ["mysite", "example", "com"]
    if len(parts) > 2:
        return parts[0]
    return None


def _is_buildable_project(project_dir: Path) -> bool:
    """Return *True* when the project contains a ``package.json`` with a
    ``build`` script – indicating it is a Vite (or similar) project that
    must be compiled before serving."""
    pkg_json = project_dir / "package.json"
    if not pkg_json.exists():
        return False
    try:
        pkg = json.loads(pkg_json.read_text())
        return bool(pkg.get("scripts", {}).get("build"))
    except (json.JSONDecodeError, OSError):
        return False


def _build_project(project_id: str, project_dir: Path) -> dict:
    """Run ``npm install`` followed by ``npm run build`` inside *project_dir*.

    Returns a dict with ``success``, ``output``, and ``error`` keys.
    """
    env = {**os.environ, "NODE_ENV": "production", "CI": "true"}
    combined_output: list[str] = []
    build_timeout = int(os.environ.get("SYCORD_BUILD_TIMEOUT", "300"))

    for step, cmd in [("install", ["npm", "install", "--no-fund", "--no-audit"]),
                      ("build", ["npm", "run", "build"])]:
        logger.info("Build [%s] project %s – running: %s", step, project_id, " ".join(cmd))
        try:
            result = subprocess.run(
                cmd,
                cwd=str(project_dir),
                capture_output=True,
                text=True,
                timeout=build_timeout,
                env=env,
            )
            combined_output.append(f"--- {step} (exit {result.returncode}) ---")
            if result.stdout:
                combined_output.append(result.stdout)
            if result.stderr:
                combined_output.append(result.stderr)

            if result.returncode != 0:
                logger.error("Build [%s] failed for project %s (exit %d)",
                             step, project_id, result.returncode)
                return {
                    "success": False,
                    "step": step,
                    "output": "\n".join(combined_output),
                    "error": f"{step} exited with code {result.returncode}",
                }
        except subprocess.TimeoutExpired:
            msg = f"{step} timed out after {build_timeout} s"
            logger.error("Build [%s] timeout for project %s", step, project_id)
            combined_output.append(msg)
            return {"success": False, "step": step, "output": "\n".join(combined_output), "error": msg}
        except FileNotFoundError:
            msg = "npm is not installed on the server"
            logger.error(msg)
            combined_output.append(msg)
            return {"success": False, "step": step, "output": "\n".join(combined_output), "error": msg}

    logger.info("Build succeeded for project %s", project_id)
    return {"success": True, "output": "\n".join(combined_output), "error": None}


def _serve_root(project_dir: Path) -> Path:
    """Return the directory that should be served for a project.

    If the project was built (has a ``dist/`` or ``build/`` folder with an
    ``index.html``), serve from there; otherwise fall back to the project root
    (plain HTML sites).
    """
    for candidate in ("dist", "build"):
        out = project_dir / candidate
        if out.is_dir() and (out / "index.html").is_file():
            return out
    return project_dir


# ── Subdomain-based content serving ───────────────────────────────────────

@app.before_request
def serve_subdomain_content():
    """If the request arrives on a subdomain that maps to a deployed project,
    serve the static files from that project's directory."""
    subdomain = _extract_subdomain()
    if subdomain is None:
        return  # fall through to normal routes

    # Skip API routes even on subdomains
    if request.path.startswith("/api/"):
        return

    project_dir = PROJECTS_DIR / subdomain
    if not project_dir.is_dir():
        return  # no matching project – fall through

    # Serve from dist/ when a build has been produced, otherwise project root
    serve_dir = _serve_root(project_dir)

    # Resolve requested path (default to index.html)
    rel_path = request.path.lstrip("/") or "index.html"
    target = serve_dir / rel_path

    # Prevent directory traversal
    try:
        target.resolve().relative_to(serve_dir.resolve())
    except ValueError:
        abort(403)

    if target.is_file():
        # Vite hashed assets (e.g. /assets/index-abc123.js) are immutable;
        # set long cache headers so browsers don't re-fetch them.
        resp = send_from_directory(str(serve_dir), rel_path)
        if rel_path.startswith("assets/"):
            resp.headers["Cache-Control"] = "public, max-age=31536000, immutable"
        return resp

    # Try appending index.html for directory-style URLs
    if (serve_dir / rel_path / "index.html").is_file():
        return send_from_directory(str(serve_dir / rel_path), "index.html")

    # SPA fallback: if the serve directory has an index.html, serve it for
    # any path that does not match a real file (client-side routing).
    spa_index = serve_dir / "index.html"
    if spa_index.is_file():
        return send_from_directory(str(serve_dir), "index.html")

    abort(404)


# ── Health-check landing page ─────────────────────────────────────────────

@app.route("/")
def index():
    return Response(
        "flask is working on server",
        content_type="text/plain; charset=utf-8",
    )


@app.route("/api/health", methods=["GET"])
def health():
    """Health-check endpoint used by the keep-alive cron to ensure the runner
    stays warm 24/7.  When ``?detailed=true`` is passed, the response also
    includes system-resource metrics (CPU, RAM, disk) that the admin Runner
    tab consumes."""
    data: dict = {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "service": "sycord-runner",
    }

    if request.args.get("detailed") == "true":
        try:
            import psutil  # type: ignore[import-untyped]

            mem = psutil.virtual_memory()
            disk = psutil.disk_usage("/")
            data["resources"] = {
                "cpu_percent": psutil.cpu_percent(interval=0.5),
                "ram_total_mb": round(mem.total / 1024 / 1024),
                "ram_used_mb": round(mem.used / 1024 / 1024),
                "ram_percent": mem.percent,
                "disk_total_gb": round(disk.total / 1024 / 1024 / 1024, 1),
                "disk_used_gb": round(disk.used / 1024 / 1024 / 1024, 1),
                "disk_percent": disk.percent,
            }
        except ImportError:
            # psutil is not installed – return basic info instead
            data["resources"] = None
            data["resources_error"] = "psutil not installed on server"

    return jsonify(data)


# ── API: Deploy ───────────────────────────────────────────────────────────

@app.route("/api/deploy/<project_id>", methods=["POST"])
def deploy(project_id: str):
    """Accept a JSON payload with a ``files`` array and optional ``subdomain``.

    Each file entry must have ``path`` (relative) and ``content`` (string).
    """
    data = request.get_json(silent=True)
    if not data or "files" not in data:
        return jsonify(success=False, error="Request body must include 'files'"), 400

    files: list[dict] = data["files"]
    subdomain: str | None = data.get("subdomain")

    if not files:
        return jsonify(success=False, error="No files provided"), 400

    project_dir = _project_dir(project_id)

    # Clean previous deployment
    if project_dir.exists():
        # Remove all files except meta
        for item in project_dir.iterdir():
            if item.name == ".meta.json":
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
    else:
        project_dir.mkdir(parents=True, exist_ok=True)

    # Write files
    written = 0
    for f in files:
        rel_path = f.get("path", "")
        content = f.get("content", "")
        if not rel_path:
            continue

        # Prevent directory traversal
        safe_path = os.path.normpath(rel_path).lstrip(os.sep)
        if safe_path.startswith(".."):
            continue

        dest = project_dir / safe_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content, encoding="utf-8")
        written += 1

    # If a subdomain is provided, create a symlink so the subdomain resolver
    # can find the project by subdomain name as well as by project_id.
    if subdomain:
        link = PROJECTS_DIR / subdomain
        if link.exists() or link.is_symlink():
            if link.is_symlink():
                link.unlink()
            elif link.resolve() != project_dir.resolve():
                shutil.rmtree(link)
        if not link.exists():
            link.symlink_to(project_dir)

    # ── Build step (Vite / npm projects) ─────────────────────────────────
    build_result: dict | None = None
    if _is_buildable_project(project_dir):
        logger.info("Detected buildable project %s – starting build", project_id)
        build_result = _build_project(project_id, project_dir)

    # Persist metadata
    domain = f"{subdomain}.sycord.com" if subdomain else None
    meta = _read_meta(project_id) or {}
    meta.update(
        {
            "project_id": project_id,
            "subdomain": subdomain,
            "domain": domain,
            "files_count": written,
            "deployed_at": datetime.now(timezone.utc).isoformat(),
            "build": {
                "attempted": build_result is not None,
                "success": build_result["success"] if build_result else None,
                "error": build_result.get("error") if build_result else None,
            },
        },
    )
    _write_meta(project_id, meta)

    logger.info("Deployed project %s (%d files, subdomain=%s, build=%s)",
                project_id, written, subdomain,
                build_result["success"] if build_result else "skipped")

    response: dict = {
        "success": True,
        "project_id": project_id,
        "domain": domain,
        "files_count": written,
    }
    if build_result:
        response["build"] = {
            "success": build_result["success"],
            "output": build_result["output"],
            "error": build_result.get("error"),
        }

    return jsonify(response)


# ── API: Project info ─────────────────────────────────────────────────────

@app.route("/api/projects/<project_id>", methods=["GET"])
def project_info(project_id: str):
    meta = _read_meta(project_id)
    if meta is None:
        return jsonify(success=False, error="Project not found"), 404

    # Include file listing
    project_dir = _project_dir(project_id)
    file_list = []
    if project_dir.is_dir():
        for p in sorted(project_dir.rglob("*")):
            if p.is_file() and p.name != ".meta.json":
                file_list.append(str(p.relative_to(project_dir)))

    meta["files"] = file_list
    meta["success"] = True
    return jsonify(meta)


# ── API: Logs ──────────────────────────────────────────────────────────────

@app.route("/api/logs", methods=["GET"])
def logs():
    project_id = request.args.get("project_id")
    limit = min(int(request.args.get("limit", 200)), 500)

    if not project_id:
        return jsonify(success=False, error="project_id is required"), 400

    lines: list[str] = []
    if LOG_FILE.exists():
        all_lines = LOG_FILE.read_text().splitlines()
        # Filter lines relevant to this project when possible
        relevant = [ln for ln in all_lines if project_id in ln]
        if relevant:
            lines = relevant[-limit:]
        else:
            lines = all_lines[-limit:]

    return jsonify(success=True, project_id=project_id, logs=lines)


# ── API: Delete project ───────────────────────────────────────────────────

@app.route("/api/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id: str):
    project_dir = _project_dir(project_id)

    if not project_dir.exists():
        return jsonify(success=False, error="Project not found"), 404

    # Remove subdomain symlink if it exists
    meta = _read_meta(project_id)
    if meta and meta.get("subdomain"):
        link = PROJECTS_DIR / meta["subdomain"]
        if link.is_symlink():
            link.unlink()

    shutil.rmtree(project_dir)
    logger.info("Deleted project %s", project_id)

    return jsonify(success=True, message="Project deleted successfully")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    logger.info("Starting Sycord Pages server on port %d", port)
    app.run(host="0.0.0.0", port=port, debug=debug)
