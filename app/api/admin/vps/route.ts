import { NextResponse } from "next/server"
import { Client } from "ssh2"

const GITHUB_REPO = "https://github.com/Edev-s/Sycord-pages.git"

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

/** Build the git clone URL, embedding a token when GITHUB_TOKEN is set. */
function getRepoUrl(): string {
  const token = process.env.GITHUB_TOKEN
  if (token) {
    return GITHUB_REPO.replace("https://", `https://${token}@`)
  }
  return GITHUB_REPO
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
// Systemd service templates
// ---------------------------------------------------------------------------

// Main Flask application server (port 5000)
const MAIN_SERVER_SERVICE = `[Unit]
Description=Sycord Pages Server
After=network.target

[Service]
ExecStart=/usr/bin/gunicorn --bind 0.0.0.0:5000 --workers 2 app:app
WorkingDirectory=/var/sycord/sycord-pages/server
Restart=always
Environment=SYCORD_DATA_DIR=/var/sycord/data

[Install]
WantedBy=multi-user.target
`

// Deploy webhook receiver (port 8080)
const DEPLOY_SERVICE = `[Unit]
Description=Sycord Deploy Server
After=network.target

[Service]
ExecStart=/usr/bin/gunicorn --bind 0.0.0.0:8080 --workers 1 deploy_server:app
WorkingDirectory=/var/sycord/sycord-pages/server
Restart=always
Environment=REPO_DIR=/var/sycord/sycord-pages
Environment=SERVICE_NAME=sycord-server

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

      // ── Step 2: install server via git clone from GitHub ───────────────
      case "install-server": {
        const repoUrl = getRepoUrl()
        const cmds = [
          "sudo apt-get update -qq",
          "sudo apt-get install -y git python3 python3-pip -qq",
          "sudo mkdir -p /var/sycord",
          `if [ -d /var/sycord/sycord-pages/.git ]; then cd /var/sycord/sycord-pages && git pull; else git clone ${repoUrl} /var/sycord/sycord-pages; fi`,
          "sudo pip3 install -r /var/sycord/sycord-pages/server/requirements.txt --quiet 2>&1 | tail -5",
          `sudo tee /etc/systemd/system/sycord-server.service > /dev/null << 'SVCEOF'\n${MAIN_SERVER_SERVICE}SVCEOF`,
          `sudo tee /etc/systemd/system/sycord-deploy.service > /dev/null << 'SVCEOF'\n${DEPLOY_SERVICE}SVCEOF`,
          "sudo systemctl daemon-reload",
          "sudo systemctl enable sycord-server sycord-deploy",
          "sudo systemctl restart sycord-server sycord-deploy",
          "sleep 2 && systemctl is-active sycord-server && systemctl is-active sycord-deploy",
        ]
        const results: string[] = []
        for (const cmd of cmds) {
          const r = await sshExec(conn, cmd, 90_000)
          results.push(r.stdout.trim() || r.stderr.trim())
        }
        return NextResponse.json({ success: true, output: results.join("\n").trim() })
      }

      // ── Step 3: install cloudflared via .deb package (Ubuntu) ──────────
      case "install-cloudflared": {
        const installCmd = [
          "curl -L --output /tmp/cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb",
          "sudo dpkg -i /tmp/cloudflared.deb",
          "rm -f /tmp/cloudflared.deb",
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
          `sudo mkdir -p /root/.cloudflared`,
          `sudo tee /root/.cloudflared/config.yml > /dev/null << 'CFEOF'\n${cfConfig}CFEOF`,
          `sudo cloudflared service install 2>&1 || true`,
          `sudo systemctl daemon-reload`,
          `sudo systemctl enable cloudflared`,
          `sudo systemctl restart cloudflared`,
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
