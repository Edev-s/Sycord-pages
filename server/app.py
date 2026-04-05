"""
Sycord Pages – Flask VPS Server
================================
A lightweight Flask application that serves deployed websites via subdomain
detection.  The server is exposed to the internet through a Cloudflare Tunnel,
so every ``<project>.sycord.site`` request lands here and is resolved to
the correct project files stored on disk.

API surface
-----------
POST   /api/deploy/<project_id>        – upload / update project files
GET    /api/projects                    – list all deployed projects
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

# Load .env file if python-dotenv is installed
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # python-dotenv not installed, rely on system env vars

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
                logger.info(f"Build [{step}] stdout for project {project_id}:\n{result.stdout}")
                combined_output.append(result.stdout)
            if result.stderr:
                logger.warning(f"Build [{step}] stderr for project {project_id}:\n{result.stderr}")
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
    mongo_uri = os.environ.get("MONGO_URI")
    projects_list_html = ""

    if mongo_uri:
        try:
            from pymongo import MongoClient
            client = MongoClient(mongo_uri)
            db = client.get_default_database() or client["test"]
            users = db.users.find({"projects": {"$exists": True}})

            project_rows = []
            for user in users:
                username = user.get("name", "Unknown User")
                for project in user.get("projects", []):
                    # Check if there is a github URL or git connection
                    git_url = project.get("githubUrl")
                    if not git_url and "git_connection" in project:
                        git_url = project["git_connection"].get("git_url")

                    if git_url:
                        pid = str(project.get("_id", ""))
                        subdomain = project.get("subdomain", "")

                        project_rows.append(f'''
                        <div class="project-row">
                            <div class="project-info">
                                <strong>{username}</strong><br>
                                <span class="project-detail">ID: {pid}</span><br>
                                <span class="project-detail">Git: <a href="{git_url}" target="_blank">{git_url}</a></span>
                            </div>
                            <button onclick="fillForm('{pid}', '{subdomain}', '{git_url}')" class="fill-btn">Deploy</button>
                        </div>
                        ''')

            if project_rows:
                projects_list_html = f'''
                <div class="projects-list-container">
                    <h2>Available Projects</h2>
                    <div class="projects-list">
                        {''.join(project_rows)}
                    </div>
                </div>
                '''
        except Exception as e:
            logger.error("Failed to fetch projects from MongoDB: %s", str(e))

    html = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sycord VPS Runner - Manual Deploy</title>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; gap: 2rem; padding: 2rem; box-sizing: border-box; flex-wrap: wrap; }}
            .container {{ max-width: 400px; width: 100%; padding: 2rem; background: #141414; border: 1px solid #333; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }}
            h1 {{ margin-bottom: 1.5rem; font-size: 1.5rem; text-align: center; color: #10b981; }}
            label {{ display: block; margin-bottom: 0.5rem; color: #a1a1aa; font-size: 0.875rem; }}
            input {{ width: 100%; padding: 0.75rem; margin-bottom: 1.5rem; background: #1e1e1e; border: 1px solid #333; color: #fff; border-radius: 4px; box-sizing: border-box; }}
            button {{ width: 100%; padding: 0.75rem; background: #10b981; color: #fff; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; transition: background 0.2s; }}
            button:hover {{ background: #059669; }}
            button:disabled {{ background: #064e3b; cursor: not-allowed; }}
            #message {{ margin-top: 1rem; text-align: center; font-size: 0.875rem; }}
            .success {{ color: #10b981; }}
            .error {{ color: #ef4444; }}

            .projects-list-container {{ max-width: 400px; width: 100%; padding: 2rem; background: #141414; border: 1px solid #333; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); max-height: 600px; display: flex; flex-direction: column; }}
            .projects-list-container h2 {{ margin-top: 0; margin-bottom: 1.5rem; font-size: 1.25rem; color: #10b981; }}
            .projects-list {{ overflow-y: auto; flex-grow: 1; display: flex; flex-direction: column; gap: 1rem; padding-right: 0.5rem; }}
            .projects-list::-webkit-scrollbar {{ width: 6px; }}
            .projects-list::-webkit-scrollbar-thumb {{ background: #333; border-radius: 3px; }}
            .project-row {{ background: #1e1e1e; padding: 1rem; border-radius: 6px; border: 1px solid #333; display: flex; flex-direction: column; gap: 0.75rem; }}
            .project-info {{ font-size: 0.9rem; word-break: break-all; }}
            .project-detail {{ color: #a1a1aa; font-size: 0.8rem; }}
            .project-detail a {{ color: #60a5fa; text-decoration: none; }}
            .project-detail a:hover {{ text-decoration: underline; }}
            .fill-btn {{ padding: 0.5rem; font-size: 0.8rem; background: #3b82f6; }}
            .fill-btn:hover {{ background: #2563eb; }}
        </style>
    </head>
    <body>
        {projects_list_html}
        <div class="container">
            <h1>Deploy from GitHub</h1>
            <form id="deploy-form">
                <label for="project-id">Project ID</label>
                <input type="text" id="project-id" placeholder="e.g., project-123" required>

                <label for="subdomain">Subdomain (Optional)</label>
                <input type="text" id="subdomain" placeholder="e.g., my-awesome-site">

                <label for="github-url">GitHub Repository URL / ID</label>
                <input type="text" id="github-url" placeholder="e.g., https://github.com/user/repo" required>

                <button type="submit" id="deploy-btn">Deploy Application</button>
            </form>
            <div id="message"></div>
        </div>

        <script>
            function fillForm(projectId, subdomain, gitUrl) {{
                document.getElementById('project-id').value = projectId;
                document.getElementById('subdomain').value = subdomain;
                document.getElementById('github-url').value = gitUrl;
            }}

            document.getElementById('deploy-form').addEventListener('submit', async (e) => {{
                e.preventDefault();

                const projectId = document.getElementById('project-id').value.trim();
                const subdomain = document.getElementById('subdomain').value.trim();
                const githubUrl = document.getElementById('github-url').value.trim();

                const btn = document.getElementById('deploy-btn');
                const msg = document.getElementById('message');

                btn.disabled = true;
                btn.textContent = 'Deploying...';
                msg.textContent = '';
                msg.className = '';

                try {
                    const response = await fetch(`/api/deploy/github/${projectId}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            github_url: githubUrl,
                            subdomain: subdomain || undefined
                        })
                    });

                    const data = await response.json();

                    if (response.ok && data.success) {
                        msg.textContent = 'Deployment successful!';
                        msg.className = 'success';

                        if (data.domain) {
                            setTimeout(() => {
                                window.open(`https://${data.domain}`, '_blank');
                            }, 1500);
                        }
                    } else {
                        msg.textContent = data.error || 'Deployment failed';
                        msg.className = 'error';
                    }
                } catch (err) {
                    msg.textContent = 'Network error or server unreachable';
                    msg.className = 'error';
                } finally {
                    btn.disabled = false;
                    btn.textContent = 'Deploy Application';
                }
            }});
        </script>
    </body>
    </html>
    """
    return Response(html, content_type="text/html; charset=utf-8")


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


# ── API: GitHub Deploy ────────────────────────────────────────────────────

@app.route("/api/deploy/github/<project_id>", methods=["POST"])
def deploy_github(project_id: str):
    """Accept a JSON payload with ``github_url`` and optional ``subdomain``.

    Clones the repository and deploys it.
    """
    data = request.get_json(silent=True)
    if not data or "github_url" not in data:
        return jsonify(success=False, error="Request body must include 'github_url'"), 400

    github_url: str = data["github_url"]
    subdomain: str | None = data.get("subdomain")

    if subdomain:
        # Prevent directory traversal
        subdomain = os.path.basename(subdomain)

    # Clean up github url to handle "owner/repo" format as well
    if not github_url.startswith("http"):
        if "/" in github_url:
            github_url = f"https://github.com/{github_url}"
        else:
            return jsonify(success=False, error="Invalid GitHub URL or Repo ID"), 400

    # Ensure it ends with .git for cloning
    if not github_url.endswith(".git"):
        github_url += ".git"

    project_dir = _project_dir(project_id)

    import tempfile

    # Clean previous deployment
    if project_dir.exists():
        for item in project_dir.iterdir():
            if item.name == ".meta.json":
                continue
            if item.is_dir():
                shutil.rmtree(item)
            else:
                item.unlink()
    else:
        project_dir.mkdir(parents=True, exist_ok=True)

    # Clone the repository
    logger.info("Cloning repository %s for project %s", github_url, project_id)

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            # Clone into temporary directory
            subprocess.run(
                ["git", "clone", "--depth", "1", github_url, temp_dir],
                check=True,
                capture_output=True,
                text=True,
                timeout=60
            )
        except subprocess.CalledProcessError as e:
            logger.error("Git clone failed: %s", e.stderr)
            return jsonify(success=False, error=f"Git clone failed: {e.stderr}"), 500
        except subprocess.TimeoutExpired:
            logger.error("Git clone timed out")
            return jsonify(success=False, error="Git clone timed out"), 500
        except Exception as e:
            logger.error("Failed to clone repository: %s", str(e))
            return jsonify(success=False, error=f"Failed to clone repository: {str(e)}"), 500

        # Remove the .git folder so we just have the raw files
        git_dir = Path(temp_dir) / ".git"
        if git_dir.exists():
            shutil.rmtree(git_dir)

        # Move files to project_dir
        for item in Path(temp_dir).iterdir():
            dest = project_dir / item.name
            if dest.exists():
                if dest.is_dir():
                    shutil.rmtree(dest)
                else:
                    dest.unlink()
            shutil.move(str(item), str(project_dir))

    # Count files (excluding meta)
    written = sum(1 for p in project_dir.rglob("*") if p.is_file() and p.name != ".meta.json")

    # Symlink subdomain
    if subdomain:
        link = PROJECTS_DIR / subdomain
        if link.exists() or link.is_symlink():
            if link.is_symlink():
                link.unlink()
            elif link.resolve() != project_dir.resolve():
                shutil.rmtree(link)
        if not link.exists():
            link.symlink_to(project_dir)

    # Build step
    build_result: dict | None = None
    if _is_buildable_project(project_dir):
        logger.info("Detected buildable project %s – starting build", project_id)
        build_result = _build_project(project_id, project_dir)

    # Persist metadata
    domain = f"{subdomain}.sycord.site" if subdomain else None
    meta = _read_meta(project_id) or {}
    meta.update(
        {
            "project_id": project_id,
            "subdomain": subdomain,
            "domain": domain,
            "files_count": written,
            "github_url": github_url,
            "deployed_at": datetime.now(timezone.utc).isoformat(),
            "build": {
                "attempted": build_result is not None,
                "success": build_result["success"] if build_result else None,
                "error": build_result.get("error") if build_result else None,
            },
        },
    )
    _write_meta(project_id, meta)

    logger.info("Deployed project %s from GitHub (%d files, subdomain=%s, build=%s)",
                project_id, written, subdomain,
                build_result["success"] if build_result else "skipped")

    response: dict = {
        "success": True,
        "project_id": project_id,
        "domain": domain,
        "files_count": written,
        "source": "github"
    }
    if build_result:
        response["build"] = {
            "success": build_result["success"],
            "output": build_result["output"],
            "error": build_result.get("error"),
        }

    return jsonify(response)


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
    domain = f"{subdomain}.sycord.site" if subdomain else None
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


# ── API: List all projects ────────────────────────────────────────────────

@app.route("/api/projects", methods=["GET"])
def list_projects():
    """Return a list of all deployed projects with their metadata."""
    projects = []
    if PROJECTS_DIR.is_dir():
        for entry in sorted(PROJECTS_DIR.iterdir()):
            # Skip symlinks (subdomain aliases) to avoid duplicates
            if entry.is_symlink():
                continue
            if not entry.is_dir():
                continue
            meta = _read_meta(entry.name)
            projects.append({
                "project_id": entry.name,
                "subdomain": meta.get("subdomain") if meta else None,
                "domain": meta.get("domain") if meta else None,
                "deployed_at": meta.get("deployed_at") if meta else None,
                "files_count": meta.get("files_count", 0) if meta else 0,
                "build": meta.get("build") if meta else None,
            })
    return jsonify(success=True, projects=projects)


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
