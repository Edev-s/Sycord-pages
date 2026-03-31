import { NextResponse } from "next/server"
import { Client } from "ssh2"

/** Resolve VPS credentials from environment. */
function getVpsCreds() {
  const host = process.env.VPS_IP
  const username = process.env.VPS_USERNAME
  const password = process.env.VPS_PASSWORD
  if (!host || !username || !password) {
    throw new Error("VPS_IP, VPS_USERNAME, and VPS_PASSWORD must be set in environment variables.")
  }
  return { host, username, password }
}

/** Open an SSH connection and return the connected client. */
function sshConnect(creds: { host: string; username: string; password: string }): Promise<Client> {
  return new Promise((resolve, reject) => {
    const conn = new Client()
    const timer = setTimeout(() => {
      conn.end()
      reject(new Error("SSH connection timed out"))
    }, 15_000)

    conn.on("ready", () => {
      clearTimeout(timer)
      resolve(conn)
    })
    conn.on("error", (err) => {
      clearTimeout(timer)
      reject(err)
    })
    conn.connect({ host: creds.host, port: 22, username: creds.username, password: creds.password })
  })
}

/** Execute a command over an open SSH connection. */
function sshExec(
  conn: Client,
  cmd: string,
  timeoutMs = 60_000,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    conn.exec(cmd, (err, stream) => {
      if (err) return reject(err)
      let stdout = ""
      let stderr = ""
      const timer = setTimeout(() => {
        stream.close()
        resolve({ stdout, stderr, code: -1 })
      }, timeoutMs)

      stream.on("data", (data: Buffer) => { stdout += data.toString() })
      stream.stderr.on("data", (data: Buffer) => { stderr += data.toString() })
      stream.on("close", (code: number) => {
        clearTimeout(timer)
        resolve({ stdout, stderr, code: code ?? 0 })
      })
    })
  })
}

// ---------------------------------------------------------------------------
// Embedded lightweight deploy-webhook server (written to VPS via SSH)
// ---------------------------------------------------------------------------
const DEPLOY_SERVER_SCRIPT = `#!/usr/bin/env python3
"""Sycord VPS Deploy Server - receives GitHub webhooks and redeploys."""
import os, hmac, hashlib, subprocess, sys
from flask import Flask, request, jsonify

app = Flask(__name__)
WEBHOOK_SECRET = os.environ.get("WEBHOOK_SECRET", "")
REPO_DIR = os.environ.get("REPO_DIR", "/var/sycord/sycord-pages")
RESTART_CMD = os.environ.get("RESTART_CMD", "systemctl restart sycord-server")

if not WEBHOOK_SECRET:
    print("ERROR: WEBHOOK_SECRET environment variable is required", file=sys.stderr)
    sys.exit(1)

def _verify(payload, sig):
    mac = hmac.new(WEBHOOK_SECRET.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"sha256={mac}", sig or "")

@app.route("/webhook", methods=["POST"])
def webhook():
    if not _verify(request.data, request.headers.get("X-Hub-Signature-256", "")):
        return jsonify(error="Invalid signature"), 401
    repo = os.path.basename(REPO_DIR)
    restart = os.path.basename(RESTART_CMD.split()[0])
    subprocess.Popen(["bash", "-c", f"cd /var/sycord/{repo} && git pull && systemctl restart {restart}"])
    return jsonify(success=True)

@app.route("/health")
def health():
    return jsonify(status="ok")
`

const DEPLOY_SERVICE = `[Unit]
Description=Sycord Deploy Server
After=network.target

[Service]
ExecStart=/usr/bin/gunicorn --bind 0.0.0.0:8080 --workers 1 deploy-server:app
WorkingDirectory=/var/sycord
Restart=always
Environment=REPO_DIR=/var/sycord/sycord-pages
Environment=RESTART_CMD=sycord-server

[Install]
WantedBy=multi-user.target
`

// ---------------------------------------------------------------------------
// GET /api/admin/vps  – check VPS reachability and service status
// ---------------------------------------------------------------------------
export async function GET() {
  let creds: ReturnType<typeof getVpsCreds>
  try {
    creds = getVpsCreds()
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  let conn: Client | null = null
  try {
    conn = await sshConnect(creds)

    const [serverStatus, cloudflaredStatus] = await Promise.all([
      sshExec(conn, "systemctl is-active sycord-deploy 2>/dev/null || echo 'not-installed'"),
      sshExec(conn, "systemctl is-active cloudflared 2>/dev/null || echo 'not-installed'"),
    ])

    const tunnelInfo = await sshExec(conn, "cloudflared tunnel list 2>/dev/null | grep sycord-server || echo ''")

    return NextResponse.json({
      connected: true,
      vpsIp: creds.host,
      deployServer: serverStatus.stdout.trim(),
      cloudflared: cloudflaredStatus.stdout.trim(),
      tunnelInfo: tunnelInfo.stdout.trim(),
    })
  } catch (e: any) {
    return NextResponse.json({ connected: false, error: e.message }, { status: 200 })
  } finally {
    conn?.end()
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/vps  – run a setup step
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  let creds: ReturnType<typeof getVpsCreds>
  try {
    creds = getVpsCreds()
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }

  const { step } = await request.json()

  let conn: Client | null = null
  try {
    conn = await sshConnect(creds)

    switch (step) {
      // ── Step 1: verify SSH ────────────────────────────────────────────────
      case "connect": {
        const info = await sshExec(conn, "uname -a && uptime")
        return NextResponse.json({ success: true, output: info.stdout.trim() })
      }

      // ── Step 2: install lightweight deploy webhook server ─────────────────
      case "install-server": {
        const cmds = [
          "mkdir -p /var/sycord/sycord-pages",
          `cat > /var/sycord/deploy-server.py << 'PYEOF'\n${DEPLOY_SERVER_SCRIPT}\nPYEOF`,
          "chmod 700 /var/sycord/deploy-server.py",
          `cat > /etc/systemd/system/sycord-deploy.service << 'SVCEOF'\n${DEPLOY_SERVICE}\nSVCEOF`,
          "pip3 install flask gunicorn --quiet 2>&1 | tail -3 || apt-get install -y python3-flask gunicorn -qq",
          "systemctl daemon-reload",
          "systemctl enable sycord-deploy",
          "systemctl restart sycord-deploy",
          "sleep 2 && systemctl is-active sycord-deploy",
        ]
        const results: string[] = []
        for (const cmd of cmds) {
          const r = await sshExec(conn, cmd, 90_000)
          results.push(r.stdout.trim() || r.stderr.trim())
        }
        return NextResponse.json({ success: true, output: results.join("\n").trim() })
      }

      // ── Step 3: install cloudflared ───────────────────────────────────────
      case "install-cloudflared": {
        const installCmd = [
          "curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | gpg --dearmor -o /usr/share/keyrings/cloudflare-main.gpg 2>&1",
          `echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/ focal main' | tee /etc/apt/sources.list.d/cloudflare-main.list`,
          "apt-get update -qq && apt-get install -y cloudflared -qq",
          "cloudflared --version",
        ].join(" && ")

        const r = await sshExec(conn, installCmd, 120_000)
        const success = r.code === 0
        return NextResponse.json({ success, output: (r.stdout + r.stderr).trim() })
      }

      // ── Step 4: get Cloudflare tunnel auth URL ────────────────────────────
      case "get-tunnel-url": {
        // Run login in background; it prints the URL to stdout and then waits.
        // We capture output for a few seconds to extract the URL.
        const r = await sshExec(
          conn,
          "timeout 10 cloudflared tunnel login 2>&1 || true",
          15_000,
        )
        const combined = r.stdout + r.stderr
        const urlMatch = combined.match(/https:\/\/dash\.cloudflare\.com\/argotunnel[^\s]+/)
        if (urlMatch) {
          return NextResponse.json({ success: true, authUrl: urlMatch[0], output: combined.trim() })
        }
        // Check if already authenticated
        const certCheck = await sshExec(conn, "ls ~/.cloudflared/cert.pem 2>/dev/null && echo 'exists' || echo 'missing'")
        if (certCheck.stdout.includes("exists")) {
          return NextResponse.json({ success: true, authUrl: null, alreadyAuthenticated: true, output: "Already authenticated with Cloudflare." })
        }
        return NextResponse.json({ success: false, output: combined.trim(), error: "Could not extract auth URL. Try again." })
      }

      // ── Step 5: create tunnel & route DNS ────────────────────────────────
      case "create-tunnel": {
        const tunnelName = "sycord-server"
        const cmds = [
          `cloudflared tunnel list 2>&1 | grep -q '${tunnelName}' && echo 'exists' || cloudflared tunnel create ${tunnelName} 2>&1`,
          `cloudflared tunnel route dns ${tunnelName} server.sycord.com 2>&1 || true`,
          `cloudflared tunnel list 2>&1 | grep '${tunnelName}'`,
        ]
        const results: string[] = []
        for (const cmd of cmds) {
          const r = await sshExec(conn, cmd, 30_000)
          results.push(r.stdout.trim() + r.stderr.trim())
        }
        return NextResponse.json({ success: true, output: results.join("\n").trim() })
      }

      // ── Step 6: create cloudflared config + start as service ─────────────
      case "start-tunnel": {
        const tunnelName = "sycord-server"
        const cfConfig = `
tunnel: ${tunnelName}
credentials-file: /root/.cloudflared/${tunnelName}.json
ingress:
  - hostname: server.sycord.com
    service: http://localhost:5000
  - service: http_status:404
`
        const cmds = [
          `mkdir -p /root/.cloudflared`,
          `cat > /root/.cloudflared/config.yml << 'CFEOF'\n${cfConfig}\nCFEOF`,
          `cloudflared service install 2>&1 || true`,
          `systemctl daemon-reload`,
          `systemctl enable cloudflared`,
          `systemctl restart cloudflared`,
          `sleep 2 && systemctl is-active cloudflared`,
        ]
        const results: string[] = []
        for (const cmd of cmds) {
          const r = await sshExec(conn, cmd, 30_000)
          results.push(r.stdout.trim() || r.stderr.trim())
        }
        return NextResponse.json({ success: true, output: results.join("\n").trim() })
      }

      default:
        return NextResponse.json({ error: "Unknown step" }, { status: 400 })
    }
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  } finally {
    conn?.end()
  }
}
