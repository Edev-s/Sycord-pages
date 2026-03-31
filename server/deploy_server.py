#!/usr/bin/env python3
"""Sycord VPS Deploy Server – receives GitHub webhooks and redeploys."""

from __future__ import annotations

import hashlib
import hmac
import os
import re
import subprocess
import sys

from flask import Flask, jsonify, request

app = Flask(__name__)

WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")
REPO_DIR = os.environ.get("REPO_DIR", "/var/sycord/sycord-pages")
SERVICE_NAME = os.environ.get("SERVICE_NAME", "sycord-server")

# Validate env vars to prevent command injection
_SAFE_RE = re.compile(r"^[a-zA-Z0-9_./-]+$")
if not _SAFE_RE.match(REPO_DIR):
    raise SystemExit(f"Invalid REPO_DIR: {REPO_DIR!r}")
if not _SAFE_RE.match(SERVICE_NAME):
    raise SystemExit(f"Invalid SERVICE_NAME: {SERVICE_NAME!r}")


def _verify(payload: bytes, sig: str | None) -> bool:
    """Verify the GitHub webhook HMAC-SHA256 signature."""
    if not WEBHOOK_SECRET:
        return True  # no secret configured – skip verification
    mac = hmac.new(WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={mac}", sig or "")


@app.route("/webhook", methods=["POST"])
def webhook():
    if not _verify(request.data, request.headers.get("X-Hub-Signature-256")):
        return jsonify(error="Invalid signature"), 401

    subprocess.Popen(
        ["bash", "-c", f"cd {REPO_DIR} && git pull && sudo systemctl restart {SERVICE_NAME}"]
    )
    return jsonify(success=True)


@app.route("/health")
def health():
    return jsonify(status="ok")
