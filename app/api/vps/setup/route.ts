import { NextResponse } from "next/server"
import { NodeSSH } from "node-ssh"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Simple admin check: Ensure only authorized user can run this script
    if (session?.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pythonRunnerScript, action } = await request.json()

    const host = process.env.VPS_IP
    const username = process.env.VPS_USERNAME
    const password = process.env.VPS_PASSWORD

    if (!host || !username || !password) {
      return NextResponse.json({ error: "VPS credentials missing in environment variables" }, { status: 500 })
    }

    const ssh = new NodeSSH()
    await ssh.connect({ host, username, password })

    const cwd = `/home/${username}/myapp`

    // --- STEP 1: INITIALIZE AND GET AUTH LINK ---
    if (action === "start") {
      console.log(`[VPS Setup] Starting Phase 1...`)

      // 1. Create directory and clone
      await ssh.execCommand('mkdir -p ~/myapp')
      await ssh.execCommand('git clone https://github.com/MDavidka/server-sycord myapp || true', { cwd: `/home/${username}` })

      // 2. Install Cloudflared (Linux amd64 assumed for standard VPS)
      console.log(`[VPS Setup] Installing Cloudflared...`)
      await ssh.execCommand('wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb', { cwd })
      await ssh.execCommand('sudo dpkg -i cloudflared-linux-amd64.deb || true', { cwd })

      // 3. Install Flask
      await ssh.execCommand('pip3 install flask', { cwd })

      // 4. Start login process and extract the link
      console.log(`[VPS Setup] Requesting Cloudflared login link...`)

      // We run the login command, pipe stderr to stdout, and grep for the auth URL
      // Since it requires user interaction, we run it in the background and tail the output file.
      await ssh.execCommand('rm -f cloudflared_login.log', { cwd })
      await ssh.execCommand('nohup cloudflared tunnel login > cloudflared_login.log 2>&1 &', { cwd })

      // Poll the log file for the URL (max 10 seconds)
      let authUrl = null
      for (let i = 0; i < 10; i++) {
        await new Promise(r => setTimeout(r, 1000))
        const log = await ssh.execCommand('cat cloudflared_login.log', { cwd })
        const match = log.stdout.match(/https:\/\/dash\.cloudflare\.com\/argotunnel\?callback=[^\s]+/)
        if (match) {
          authUrl = match[0]
          break
        }
      }

      ssh.dispose()

      if (authUrl) {
        return NextResponse.json({ success: true, authUrl, message: "Please authorize Cloudflare using the provided link." })
      } else {
        return NextResponse.json({ error: "Failed to generate Cloudflare auth link. Ensure cloudflared is installed on the VPS." }, { status: 500 })
      }
    }

    // --- STEP 2: CREATE TUNNEL AND START RUNNER ---
    if (action === "complete") {
      console.log(`[VPS Setup] Starting Phase 2 (Complete)...`)

      if (!pythonRunnerScript) {
        ssh.dispose()
        return NextResponse.json({ error: "Missing python runner script" }, { status: 400 })
      }

      // 1. Create Tunnel
      console.log(`[VPS Setup] Creating Tunnel 'sycord-runner'...`)
      const createRes = await ssh.execCommand('cloudflared tunnel create sycord-runner', { cwd })

      // Extract UUID (typically looks like: Created tunnel sycord-runner with id xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
      const uuidMatch = createRes.stdout.match(/id ([a-f0-9-]+)/i) || createRes.stderr.match(/id ([a-f0-9-]+)/i)

      if (!uuidMatch) {
         // It might already exist, try to list it
         const listRes = await ssh.execCommand('cloudflared tunnel list', { cwd })
         const listMatch = listRes.stdout.match(/([a-f0-9-]+)\s+sycord-runner/i)
         if (!listMatch) {
             ssh.dispose()
             return NextResponse.json({ error: "Failed to create or find Cloudflare tunnel UUID." }, { status: 500 })
         }
         var tunnelId = listMatch[1]
      } else {
         var tunnelId = uuidMatch[1]
      }

      // 2. Route DNS to server.sycord.com
      console.log(`[VPS Setup] Routing DNS to server.sycord.com...`)
      await ssh.execCommand('cloudflared tunnel route dns sycord-runner server.sycord.com', { cwd })

      // 3. Generate config.yml
      console.log(`[VPS Setup] Creating config.yml...`)
      const configYml = `tunnel: ${tunnelId}
credentials-file: /home/${username}/.cloudflared/${tunnelId}.json

ingress:
  - hostname: server.sycord.com
    service: http://localhost:5000
  - service: http_status:404`

      await ssh.execCommand(`cat > config.yml`, { cwd, stdin: configYml })

      // 4. Write runner.py
      console.log(`[VPS Setup] Writing runner.py...`)
      await ssh.execCommand(`cat > runner.py`, { cwd, stdin: pythonRunnerScript })

      // 5. Start Flask and Tunnel
      console.log(`[VPS Setup] Starting services...`)
      await ssh.execCommand('pkill -f "python3 runner.py" || true', { cwd })
      await ssh.execCommand('pkill -f "cloudflared tunnel run" || true', { cwd })

      await ssh.execCommand('nohup python3 runner.py > runner.log 2>&1 &', { cwd })
      await ssh.execCommand(`nohup cloudflared tunnel run sycord-runner > tunnel.log 2>&1 &`, { cwd })

      ssh.dispose()

      return NextResponse.json({ success: true, message: "VPS configured and running on server.sycord.com!" })
    }

    ssh.dispose()
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })

  } catch (error: any) {
    console.error("[VPS Setup] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to setup VPS" }, { status: 500 })
  }
}
