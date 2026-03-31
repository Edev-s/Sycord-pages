import { NextResponse } from "next/server"
import { NodeSSH } from "node-ssh"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    // Simple admin check
    if (session?.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { action, pythonRunnerScript } = body

    const host = process.env.VPS_IP
    const username = process.env.VPS_USERNAME
    const password = process.env.VPS_PASSWORD

    if (!host || !username || !password) {
      return NextResponse.json({ error: "VPS credentials missing in environment variables" }, { status: 500 })
    }

    const ssh = new NodeSSH()
    await ssh.connect({ host, username, password })

    const cwd = `/home/${username}/myapp`

    // --- STEP 1: INIT ---
    if (action === "init") {
      console.log(`[VPS Setup] Running Step 1: Init...`)
      await ssh.execCommand('mkdir -p ~/myapp')
      await ssh.execCommand('git clone https://github.com/MDavidka/server-sycord myapp || true', { cwd: `/home/${username}` })

      console.log(`[VPS Setup] Installing Cloudflared...`)
      await ssh.execCommand('wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb', { cwd })
      await ssh.execCommand('sudo dpkg -i cloudflared-linux-amd64.deb || true', { cwd })

      console.log(`[VPS Setup] Installing Flask & deps...`)
      // Install dependencies globally or locally for the user
      await ssh.execCommand('sudo apt-get update && sudo apt-get install -y python3-pip', { cwd })
      await ssh.execCommand('pip3 install flask', { cwd })

      ssh.dispose()
      return NextResponse.json({ success: true, message: "VPS Initialized! Repository cloned and dependencies installed." })
    }

    // --- STEP 2: AUTH ---
    if (action === "auth") {
      console.log(`[VPS Setup] Running Step 2: Auth...`)

      // Request login URL
      await ssh.execCommand('rm -f cloudflared_login.log', { cwd })
      await ssh.execCommand('nohup cloudflared tunnel login > cloudflared_login.log 2>&1 &', { cwd })

      // Poll log for the URL
      let authUrl = null
      for (let i = 0; i < 12; i++) {
        await new Promise(r => setTimeout(r, 1000))
        const log = await ssh.execCommand('cat cloudflared_login.log', { cwd })

        // Example URL: https://dash.cloudflare.com/argotunnel?callback=https%3A%2F%2Flogin.cloudflareaccess.org%2F...
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
        return NextResponse.json({ error: "Failed to generate Cloudflare auth link. Check if cloudflared is installed." }, { status: 500 })
      }
    }

    // --- STEP 3: CONFIG ---
    if (action === "config") {
      console.log(`[VPS Setup] Running Step 3: Config...`)

      // Create Tunnel
      const createRes = await ssh.execCommand('cloudflared tunnel create sycord-runner', { cwd })
      const uuidMatch = createRes.stdout.match(/id ([a-f0-9-]+)/i) || createRes.stderr.match(/id ([a-f0-9-]+)/i)

      let tunnelId = ""
      if (!uuidMatch) {
         const listRes = await ssh.execCommand('cloudflared tunnel list', { cwd })
         const listMatch = listRes.stdout.match(/([a-f0-9-]+)\s+sycord-runner/i)
         if (!listMatch) {
             ssh.dispose()
             return NextResponse.json({ error: "Failed to create or find Cloudflare tunnel UUID." }, { status: 500 })
         }
         tunnelId = listMatch[1]
      } else {
         tunnelId = uuidMatch[1]
      }

      // Route DNS
      await ssh.execCommand('cloudflared tunnel route dns sycord-runner server.sycord.com || true', { cwd })

      // Generate config.yml
      const configYml = `tunnel: ${tunnelId}
credentials-file: /home/${username}/.cloudflared/${tunnelId}.json

ingress:
  - hostname: server.sycord.com
    service: http://localhost:5000
  - service: http_status:404`

      await ssh.execCommand(`cat > config.yml`, { cwd, stdin: configYml })

      ssh.dispose()
      return NextResponse.json({ success: true, message: "Tunnel sycord-runner created and routed to server.sycord.com!" })
    }

    // --- STEP 4: START SERVER ---
    if (action === "start_server") {
      console.log(`[VPS Setup] Running Step 4: Start Server...`)

      if (!pythonRunnerScript) {
        ssh.dispose()
        return NextResponse.json({ error: "Missing python runner script" }, { status: 400 })
      }

      // Write runner.py
      await ssh.execCommand(`cat > runner.py`, { cwd, stdin: pythonRunnerScript })

      // Kill existing processes
      await ssh.execCommand('pkill -f "python3 runner.py" || true', { cwd })
      await ssh.execCommand('pkill -f "cloudflared tunnel run" || true', { cwd })

      // Start processes
      await ssh.execCommand('nohup python3 runner.py > runner.log 2>&1 &', { cwd })
      await ssh.execCommand(`nohup cloudflared tunnel run sycord-runner > tunnel.log 2>&1 &`, { cwd })

      ssh.dispose()
      return NextResponse.json({ success: true, message: "VPS Setup Complete! Flask server is running and exposed via Cloudflare." })
    }

    ssh.dispose()
    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 })

  } catch (error: any) {
    console.error(`[VPS Setup] Error (${request.url}):`, error)
    return NextResponse.json({ error: error.message || "Failed to execute VPS action" }, { status: 500 })
  }
}
