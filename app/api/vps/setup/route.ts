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

    const homeDir = username === 'root' ? '/root' : `/home/${username}`
    const cwd = `${homeDir}/myapp`

    // Helper to log errors but not necessarily throw, useful for checking if a command worked
    const run = async (cmd: string, dir: string = cwd) => {
        const res = await ssh.execCommand(cmd, { cwd: dir })
        if (res.stderr) {
            console.log(`[VPS Setup] Warn/Err running '${cmd}':`, res.stderr)
        }
        return res
    }

    // --- STEP 1: INIT ---
    if (action === "init") {
      console.log(`[VPS Setup] Running Step 1: Init...`)

      // Ensure absolute paths
      await run(`mkdir -p ${cwd}`, homeDir)

      // Clone if empty
      const lsRes = await run(`ls -A ${cwd}`)
      if (!lsRes.stdout) {
          await run(`git clone https://github.com/MDavidka/server-sycord ${cwd} || true`, homeDir)
      }

      console.log(`[VPS Setup] Installing Cloudflared locally...`)
      // Download cloudflared binary directly to the folder so we don't need sudo dpkg
      await run(`wget -q -O cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64`, cwd)
      await run(`chmod +x cloudflared`, cwd)

      console.log(`[VPS Setup] Installing Flask & deps via pip...`)
      // Install dependencies globally or locally for the user
      await ssh.execCommand('sudo apt-get update && sudo apt-get install -y python3-pip || true', { cwd })
      // Install dependencies locally for the user
      await run(`pip3 install --user flask`, cwd)

      ssh.dispose()
      return NextResponse.json({ success: true, message: "VPS Initialized! Repository cloned and dependencies installed." })
    }

    // --- STEP 2: AUTH ---
    if (action === "auth") {
      console.log(`[VPS Setup] Running Step 2: Auth...`)

      // Request login URL
      await run('rm -f cloudflared_login.log', cwd)

      // Run the binary directly, forcing stdout/stderr to log.
      // Cloudflared might refuse to output the URL if it detects no TTY,
      // but usually redirecting to a file works. Let's use `stdbuf` just in case to avoid buffering issues.
      await run('stdbuf -oL -eL ./cloudflared tunnel login > cloudflared_login.log 2>&1 &', cwd)

      // Poll log for the URL
      let authUrl = null
      let finalLog = ""
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 1000))
        const log = await run('cat cloudflared_login.log', cwd)
        finalLog = log.stdout + "\n" + log.stderr

        // Match the callback URL (often spans multiple lines or has slightly different formats)
        // cloudflared outputs ANSI codes and mixed newlines, so we clean it up and use a more permissive regex
        // to catch the full encoded url
        const cleanLog = finalLog.replace(/\x1b\[[0-9;]*m/g, '').replace(/\\n/g, '\n').trim()

        // Check if the server is already authorized
        if (cleanLog.includes("You have an existing certificate") || cleanLog.includes("cert.pem which login would overwrite")) {
          ssh.dispose()
          return NextResponse.json({
            success: true,
            alreadyAuthorized: true,
            message: "Cloudflare tunnel is already authorized on this server."
          })
        }

        // Find the URL specifically. It's usually `https://dash.cloudflare.com/argotunnel?callback=...`
        // We match until a space, newline, or a specific control character to avoid chopping off parts of the URL.
        const match = cleanLog.match(/(https:\/\/dash\.cloudflare\.com\/argotunnel\?callback=[^\s"'\n\r]+)/i)
        if (match) {
          authUrl = match[1] // capture group ensures we don't grab trailing random chars
          break
        }
      }

      ssh.dispose()

      if (authUrl) {
        return NextResponse.json({ success: true, authUrl, message: "Please authorize Cloudflare using the provided link." })
      } else {
        // Return the log output so the user can debug what actually happened (e.g. command not found, permissions)
        const safeLog = finalLog.substring(0, 500) // Truncate to avoid massive payloads
        return NextResponse.json({
            error: `Failed to generate Cloudflare auth link. Log snippet: \n${safeLog}`
        }, { status: 500 })
      }
    }

    // --- STEP 3: CONFIG ---
    if (action === "config") {
      console.log(`[VPS Setup] Running Step 3: Config...`)

      // Create Tunnel
      const createRes = await run('./cloudflared tunnel create sycord-runner', cwd)
      const uuidMatch = createRes.stdout.match(/id ([a-f0-9-]+)/i) || createRes.stderr.match(/id ([a-f0-9-]+)/i)

      let tunnelId = ""
      if (!uuidMatch) {
         const listRes = await run('./cloudflared tunnel list', cwd)
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
      await run(`./cloudflared tunnel route dns sycord-runner sycord.site || true`, cwd)
      // Attempt to route wildcard (may fail if zone doesn't support it directly via CLI, so we use || true)
      await run(`./cloudflared tunnel route dns sycord-runner "*.sycord.site" || true`, cwd)

      // Generate config.yml
      const configYml = `tunnel: ${tunnelId}
credentials-file: ${homeDir}/.cloudflared/${tunnelId}.json

ingress:
  - hostname: sycord.site
    service: http://127.0.0.1:5000
  - hostname: "*.sycord.site"
    service: http://127.0.0.1:5000
  - service: http_status:404`

      await ssh.execCommand(`cat > config.yml`, { cwd, stdin: configYml })

      ssh.dispose()
      return NextResponse.json({
        success: true,
        tunnelId: tunnelId,
        message: "Tunnel sycord-runner created! DNS routing attempted for sycord.site and *.sycord.site."
      })
    }

    // --- STEP 4: START SERVER ---
    if (action === "start_server") {
      console.log(`[VPS Setup] Running Step 4: Start Server...`)

      if (!pythonRunnerScript) {
        ssh.dispose()
        return NextResponse.json({ error: "Missing python runner script" }, { status: 400 })
      }

      // Write runner.py (force remove old one first)
      await run(`rm -f runner.py`, cwd)
      await ssh.execCommand(`cat > runner.py`, { cwd, stdin: pythonRunnerScript })

      // Kill existing processes forcefully
      await run('pkill -9 -f "runner\\.py" || true', cwd)
      await run('pkill -9 -f "cloudflared tunnel run" || true', cwd)

      // Force free port 5000 just in case pkill missed it
      await run('fuser -k 5000/tcp || true', cwd)

      // Start processes using absolute paths to avoid environment PATH issues inside nohup over SSH
      await run(`nohup python3 ${cwd}/runner.py > ${cwd}/runner.log 2>&1 &`, cwd)

      // Explicitly point to the config.yml so cloudflared knows where to route traffic
      await run(`nohup ${cwd}/cloudflared tunnel --config ${cwd}/config.yml run sycord-runner > ${cwd}/tunnel.log 2>&1 &`, cwd)

      // Wait 2 seconds to see if cloudflared crashes immediately
      await new Promise(r => setTimeout(r, 2000))

      const psResFlask = await run('pgrep -f "python3.*/runner.py"', cwd)
      if (!psResFlask.stdout) {
         console.warn("[VPS Setup] Flask server doesn't appear to be running after start.")
      }

      const psResTunnel = await run('pgrep -f "cloudflared tunnel.*sycord-runner"', cwd)
      if (!psResTunnel.stdout) {
         console.warn("[VPS Setup] Cloudflared tunnel crashed. Fetching log...")
         const logTail = await run(`tail -n 20 ${cwd}/tunnel.log`, cwd)
         ssh.dispose()
         return NextResponse.json({
           error: `Tunnel crashed immediately. Log output:\n${logTail.stdout || logTail.stderr || 'No log output found.'}`
         }, { status: 500 })
      }

      ssh.dispose()
      return NextResponse.json({ success: true, message: "VPS Setup Complete! Flask server and Tunnel are both running." })
    }

    ssh.dispose()
    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 })

  } catch (error: any) {
    console.error(`[VPS Setup] Error (${request.url}):`, error)
    return NextResponse.json({ error: error.message || "Failed to execute VPS action" }, { status: 500 })
  }
}
