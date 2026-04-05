import { NextResponse } from "next/server"
import { NodeSSH } from "node-ssh"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { readFileSync } from "fs"
import { join } from "path"

/**
 * Helper: Ensure a proxied CNAME record exists for the given hostname.
 *
 * Strategy: delete-all-then-create.  A CNAME record cannot coexist with
 * A or AAAA records at the same name (RFC 1034).  If the hostname already
 * has one or more A/AAAA/CNAME records (possibly left over from an old
 * tunnel or manual setup), we must remove **all** of them before creating
 * the new CNAME.  Simply PUTting over one record doesn't help when there
 * are multiple conflicting records.
 *
 * Returns true on success, or a string error message on failure.
 */
async function upsertCfCname(
  apiKey: string,
  zoneId: string,
  hostname: string,
  target: string,
): Promise<true | string> {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  }

  const payload = {
    type: "CNAME",
    name: hostname,
    content: target,
    proxied: true,
    ttl: 1,
  }

  /**
   * Find ALL existing A, AAAA, and CNAME records for the hostname.
   * Uses two strategies (exact-name query, then broad per-type scan) to
   * handle edge cases with API-token scoping, wildcard encoding, etc.
   */
  async function findAllExistingRecords(): Promise<Array<{ id: string; type: string }>> {
    const found = new Map<string, { id: string; type: string }>()

    // 1. Exact-name query (catches all types at once)
    try {
      const res = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${encodeURIComponent(hostname)}&per_page=50`,
        { headers },
      )
      const data = await res.json()
      if (data.success && data.result?.length > 0) {
        for (const r of data.result) {
          if (["A", "AAAA", "CNAME"].includes(r.type)) {
            found.set(r.id, { id: r.id, type: r.type })
          }
        }
      }
    } catch { /* ignore – we have the fallback below */ }

    // 2. Broad fallback – query by type and match client-side
    for (const recType of ["CNAME", "A", "AAAA"]) {
      try {
        const res = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?type=${recType}&per_page=100`,
          { headers },
        )
        const data = await res.json()
        if (data.success && data.result?.length > 0) {
          for (const r of data.result) {
            if (r.name === hostname) {
              found.set(r.id, { id: r.id, type: r.type })
            }
          }
        }
      } catch { /* continue with next type */ }
    }

    return Array.from(found.values())
  }

  try {
    // --- Step 1: Find all existing conflicting records ---
    const existing = await findAllExistingRecords()

    // If there is exactly one CNAME already pointing to the right target,
    // skip the delete+create cycle entirely.
    if (
      existing.length === 1 &&
      existing[0].type === "CNAME"
    ) {
      // Quick-check: is it already pointing to the correct target?
      try {
        const getRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existing[0].id}`,
          { headers },
        )
        const getData = await getRes.json()
        if (getData.success && getData.result?.content === target) {
          return true // already correct – nothing to do
        }
      } catch { /* fall through and recreate */ }
    }

    // --- Step 2: Delete ALL conflicting records ---
    for (const rec of existing) {
      const delRes = await fetch(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${rec.id}`,
        { method: "DELETE", headers },
      )
      const delData = await delRes.json()
      if (!delData.success) {
        console.warn(`[DNS] Failed to delete ${rec.type} record ${rec.id} for ${hostname}: ${JSON.stringify(delData.errors)}`)
        // Non-fatal: continue and try creating anyway
      }
    }

    // --- Step 3: Create the CNAME record ---
    const postRes = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      { method: "POST", headers, body: JSON.stringify(payload) },
    )
    const postData = await postRes.json()

    if (!postData.success) {
      // Last resort: if we STILL get 81053, try a brute-force scan of the
      // entire zone, delete every matching record, and create again.
      const hasConflict = postData.errors?.some((e: any) => e.code === 81053)
      if (hasConflict) {
        const allRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=500`,
          { headers },
        )
        const allData = await allRes.json()
        if (allData.success && allData.result?.length > 0) {
          const matches = allData.result.filter(
            (r: any) => r.name === hostname && ["A", "AAAA", "CNAME"].includes(r.type),
          )
          for (const m of matches) {
            await fetch(
              `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${m.id}`,
              { method: "DELETE", headers },
            )
          }
        }
        // Retry create
        const retryRes = await fetch(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
          { method: "POST", headers, body: JSON.stringify(payload) },
        )
        const retryData = await retryRes.json()
        if (retryData.success) return true
        return `Failed to create DNS for ${hostname} after deleting conflicts: ${JSON.stringify(retryData.errors)}`
      }
      return `Failed to create DNS for ${hostname}: ${JSON.stringify(postData.errors)}`
    }

    return true
  } catch (err: any) {
    return `DNS API error for ${hostname}: ${err.message}`
  }
}

/**
 * Read the Flask server code from `server/app.py` in the repository.
 * Used as the default `runner.py` when no custom script is provided.
 */
function readDefaultFlaskApp(): string {
  const appPyPath = join(process.cwd(), "server", "app.py")
  return readFileSync(appPyPath, "utf-8")
}

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
      // Install system packages needed for Python and Node.js for Vite builds
      await ssh.execCommand(`echo "${password}" | sudo -S -E bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -' && echo "${password}" | sudo -S apt-get install -y nodejs python3-pip python3-venv git curl wget || true`, { cwd })

      // On modern Ubuntu (23.04+), PEP 668 marks the system Python as
      // "externally-managed", which causes `pip3 install --user` to fail.
      // We first try a virtual-env install (preferred), then fall back to
      // --break-system-packages so Flask is definitely available.
      const venvRes = await run(`python3 -m venv ${cwd}/venv && ${cwd}/venv/bin/pip install flask gunicorn python-dotenv psutil pymongo`, cwd)
      if (venvRes.stderr && venvRes.stderr.includes('Error')) {
        console.log(`[VPS Setup] venv install failed, falling back to --break-system-packages`)
        await run(`pip3 install --user --break-system-packages flask gunicorn python-dotenv psutil pymongo || pip3 install --user flask gunicorn python-dotenv psutil pymongo`, cwd)
      }

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

      // Delete any existing tunnel with the same name to ensure fresh credentials
      // This avoids the "credentials file doesn't exist" error when a tunnel was
      // previously created but its JSON credentials file was lost.
      const listRes = await run('./cloudflared tunnel list', cwd)
      if (listRes.stdout.includes('sycord-runner')) {
        console.log(`[VPS Setup] Existing tunnel found, deleting to recreate with fresh credentials...`)
        await run('./cloudflared tunnel cleanup sycord-runner || true', cwd)
        await run('./cloudflared tunnel delete sycord-runner || true', cwd)
        // Allow Cloudflare backend to finish tunnel deletion before recreating
        await new Promise(r => setTimeout(r, 1000))
      }

      // Create Tunnel (fresh, so credentials JSON is guaranteed to be generated)
      const createRes = await run('./cloudflared tunnel create sycord-runner', cwd)
      const uuidMatch = createRes.stdout.match(/id ([a-f0-9-]+)/i) || createRes.stderr.match(/id ([a-f0-9-]+)/i)

      let tunnelId = ""
      if (!uuidMatch) {
         // Fallback: list tunnels to find UUID
         const listRes2 = await run('./cloudflared tunnel list', cwd)
         const listMatch = listRes2.stdout.match(/([a-f0-9-]+)\s+sycord-runner/i)
         if (!listMatch) {
             ssh.dispose()
             return NextResponse.json({ error: "Failed to create or find Cloudflare tunnel UUID." }, { status: 500 })
         }
         tunnelId = listMatch[1]
      } else {
         tunnelId = uuidMatch[1]
      }

      // Validate tunnelId is a proper UUID (alphanumeric + hyphens only)
      if (!/^[a-f0-9-]+$/i.test(tunnelId)) {
        ssh.dispose()
        return NextResponse.json({ error: "Invalid tunnel ID format returned by cloudflared." }, { status: 500 })
      }

      // Verify the credentials file exists at the expected location
      const defaultCredsPath = `${homeDir}/.cloudflared/${tunnelId}.json`
      const credsCheck = await run(`test -f ${defaultCredsPath} && echo EXISTS || echo MISSING`, cwd)

      let credsFilePath = defaultCredsPath
      if (credsCheck.stdout.trim() !== 'EXISTS') {
        // Search for the credentials file in common locations
        console.log(`[VPS Setup] Credentials not at default path, searching...`)
        const findRes = await run(`find ${homeDir} -name "${tunnelId}.json" -type f 2>/dev/null | head -1`, cwd)
        if (findRes.stdout.trim()) {
          credsFilePath = findRes.stdout.trim()
          console.log(`[VPS Setup] Found credentials at: ${credsFilePath}`)
          // Copy to expected location so future runs also work
          await run(`mkdir -p ${homeDir}/.cloudflared && cp "${credsFilePath}" "${defaultCredsPath}"`, cwd)
        } else {
          ssh.dispose()
          return NextResponse.json({
            error: `Tunnel created (${tunnelId}) but credentials file not found. Try deleting the tunnel manually and re-running this step.`
          }, { status: 500 })
        }
      }

      // Route DNS – prefer the Cloudflare API so we can reliably update records
      // that already exist (pointing at the old deleted tunnel UUID).
      const cfApiKey = process.env.CLOUDFLARE_API_KEY
      const cfZoneId = process.env.CLOUDFLARE_ZONE_ID
      const tunnelTarget = `${tunnelId}.cfargotunnel.com`
      const dnsWarnings: string[] = []

      if (cfApiKey && cfZoneId) {
        console.log(`[VPS Setup] Updating DNS via Cloudflare API → ${tunnelTarget}`)
        const hostnames = ["sycord.site", "server.sycord.site", "*.sycord.site"]
        for (const h of hostnames) {
          const result = await upsertCfCname(cfApiKey, cfZoneId, h, tunnelTarget)
          if (result !== true) {
            console.warn(`[VPS Setup] DNS warning: ${result}`)
            dnsWarnings.push(result)
          }
        }
      } else {
        // Fallback to cloudflared CLI (may fail if records already exist for a different tunnel)
        console.warn("[VPS Setup] No CLOUDFLARE_API_KEY/ZONE_ID – falling back to cloudflared route dns")
        const dnsHostnames = ["sycord.site", "server.sycord.site"]
        for (const h of dnsHostnames) {
          const routeRes = await run(`./cloudflared tunnel route dns sycord-runner ${h}`, cwd)
          if (routeRes.stderr && !routeRes.stderr.includes("already exists")) {
            dnsWarnings.push(`route dns ${h}: ${routeRes.stderr.substring(0, 200)}`)
          }
        }
        // Wildcard may not be supported via CLI on all plans
        await run(`./cloudflared tunnel route dns sycord-runner "*.sycord.site" || true`, cwd)
      }

      // Generate config.yml with sycord.site as the primary hostname
      const configYml = `tunnel: ${tunnelId}
credentials-file: ${defaultCredsPath}

ingress:
  - hostname: sycord.site
    service: http://127.0.0.1:5000
  - hostname: server.sycord.site
    service: http://127.0.0.1:5000
  - hostname: "*.sycord.site"
    service: http://127.0.0.1:5000
  - service: http_status:404`

      await ssh.execCommand(`cat > config.yml`, { cwd, stdin: configYml })

      ssh.dispose()
      const warnText = dnsWarnings.length > 0
        ? ` DNS warnings: ${dnsWarnings.join("; ")}`
        : ""
      return NextResponse.json({
        success: true,
        tunnelId: tunnelId,
        message: `Tunnel sycord-runner created! DNS routing configured for sycord.site, server.sycord.site, and *.sycord.site.${warnText}`
      })
    }

    // --- STEP 4: START SERVER ---
    if (action === "start_server") {
      console.log(`[VPS Setup] Running Step 4: Start Server...`)

      // Ensure Node.js and NPM are installed for Vite builds
      console.log(`[VPS Setup] Verifying Node.js and NPM installation...`)
      await run(`if ! command -v npm &> /dev/null; then echo "${password}" | sudo -S -E bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -' && echo "${password}" | sudo -S apt-get install -y nodejs; fi`, cwd)

      // Use provided script or fall back to the repo's server/app.py
      let script = pythonRunnerScript
      if (!script) {
        try {
          script = readDefaultFlaskApp()
          console.log(`[VPS Setup] No custom runner script provided, using server/app.py from repo (${script.length} bytes)`)
        } catch (readErr: any) {
          ssh.dispose()
          return NextResponse.json({ error: `Missing python runner script and failed to read server/app.py: ${readErr.message}` }, { status: 400 })
        }
      }

      // Write optional SSL Certs if provided
      const { sslCert, sslKey } = body
      if (sslCert && sslKey) {
          console.log(`[VPS Setup] Writing custom SSL Origin Certificates...`)
          await ssh.execCommand(`cat > cert.pem`, { cwd, stdin: sslCert.trim() })
          await ssh.execCommand(`cat > privkey.pem`, { cwd, stdin: sslKey.trim() })
      } else {
          // Remove old certs if user is running without them
          await run(`rm -f cert.pem privkey.pem`, cwd)
      }

      // Write runner.py (force remove old one first)
      await run(`rm -f runner.py`, cwd)
      await ssh.execCommand(`cat > runner.py`, { cwd, stdin: script })

      // Kill existing processes forcefully
      await run('pkill -9 -f "runner\\.py" || true', cwd)
      await run('pkill -9 -f "cloudflared tunnel run" || true', cwd)

      // Force free port 5000 just in case pkill missed it
      await run('fuser -k 5000/tcp || true', cwd)

      // Use venv python if the virtual-env exists, otherwise fall back to system python3
      const venvCheck = await run(`test -f ${cwd}/venv/bin/python3 && echo EXISTS || echo MISSING`, cwd)
      const pythonBin = venvCheck.stdout.trim() === 'EXISTS' ? `${cwd}/venv/bin/python3` : 'python3'

      // Start processes using absolute paths to avoid environment PATH issues inside nohup over SSH
      await run(`nohup ${pythonBin} ${cwd}/runner.py > ${cwd}/runner.log 2>&1 &`, cwd)

      // Explicitly point to the config.yml so cloudflared knows where to route traffic
      await run(`nohup ${cwd}/cloudflared tunnel --config ${cwd}/config.yml run sycord-runner > ${cwd}/tunnel.log 2>&1 &`, cwd)

      // Wait 2 seconds to see if processes crash immediately
      await new Promise(r => setTimeout(r, 2000))

      const psResFlask = await run('pgrep -f "runner\\.py" || true', cwd)
      if (!psResFlask.stdout.trim()) {
         console.warn("[VPS Setup] Flask server doesn't appear to be running after start.")
         const flaskLog = await run(`tail -n 30 ${cwd}/runner.log`, cwd)
         ssh.dispose()
         return NextResponse.json({
           error: `Flask server crashed on startup. Log output:\n${flaskLog.stdout || flaskLog.stderr || 'No log output found.'}`
         }, { status: 500 })
      }

      const psResTunnel = await run('pgrep -f "cloudflared.*tunnel" || true', cwd)
      if (!psResTunnel.stdout.trim()) {
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

    // --- STATUS CHECK ---
    if (action === "status") {
      // Use multiple detection strategies for the Flask process:
      // 1. pgrep with broader pattern (handles venv python paths)
      // 2. Check if port 5000 is in use (most reliable)
      const flaskPgrep = await run('pgrep -f "runner\\.py" || true', cwd)
      const portCheck = await run('ss -tlnp 2>/dev/null | grep ":5000 " || lsof -i :5000 -t 2>/dev/null || true', cwd)
      const tunnelPid = await run('pgrep -f "cloudflared.*tunnel" || true', cwd)
      const tunnelLog = await run(`tail -n 10 ${cwd}/tunnel.log 2>/dev/null`, cwd)
      const runnerLog = await run(`tail -n 10 ${cwd}/runner.log 2>/dev/null`, cwd)

      const flaskPidStr = flaskPgrep.stdout.trim()
      const portInUse = !!portCheck.stdout.trim()
      const flaskRunning = !!flaskPidStr || portInUse
      const tunnelPidStr = tunnelPid.stdout.trim()

      ssh.dispose()
      // Return flat keys so the admin UI can read them directly
      return NextResponse.json({
        success: true,
        flask_running: flaskRunning,
        flask_pid: flaskPidStr || (portInUse ? "(port 5000 active)" : null),
        tunnel_running: !!tunnelPidStr,
        tunnel_pid: tunnelPidStr || null,
        flask_log: runnerLog.stdout || null,
        tunnel_log: tunnelLog.stdout || null,
      })
    }

    // --- RESTART (quick restart without reconfiguring) ---
    if (action === "restart") {
      console.log(`[VPS Setup] Restarting Flask and Tunnel...`)

      // Ensure Node.js and NPM are installed for Vite builds
      console.log(`[VPS Setup] Verifying Node.js and NPM installation...`)
      await run(`if ! command -v npm &> /dev/null; then echo "${password}" | sudo -S -E bash -c 'curl -fsSL https://deb.nodesource.com/setup_20.x | bash -' && echo "${password}" | sudo -S apt-get install -y nodejs; fi`, cwd)

      // Kill existing
      await run('pkill -9 -f "runner\\.py" || true', cwd)
      await run('pkill -9 -f "cloudflared tunnel run" || true', cwd)
      await run('fuser -k 5000/tcp || true', cwd)

      // Verify config.yml exists
      const cfgCheck = await run(`test -f ${cwd}/config.yml && echo EXISTS || echo MISSING`, cwd)
      if (cfgCheck.stdout.trim() !== 'EXISTS') {
        ssh.dispose()
        return NextResponse.json({ error: "config.yml not found. Run the Config step (Step 3) first." }, { status: 400 })
      }

      // Always update runner.py with the latest server/app.py so subdomain
      // serving, .env loading and new API endpoints are available.
      try {
        const latestApp = readDefaultFlaskApp()
        await run(`rm -f runner.py`, cwd)
        await ssh.execCommand(`cat > runner.py`, { cwd, stdin: latestApp })
        console.log(`[VPS Setup] Updated runner.py with latest server/app.py (${latestApp.length} bytes)`)
      } catch (readErr: any) {
        // Fall back to existing runner.py if we can't read the repo file
        console.warn(`[VPS Setup] Could not update runner.py from repo: ${readErr.message}`)
        const runnerCheck = await run(`test -f ${cwd}/runner.py && echo EXISTS || echo MISSING`, cwd)
        if (runnerCheck.stdout.trim() !== 'EXISTS') {
          ssh.dispose()
          return NextResponse.json({ error: "runner.py not found and could not read server/app.py from repo." }, { status: 400 })
        }
      }

      // Use venv python if the virtual-env exists, otherwise fall back to system python3
      const restartVenvCheck = await run(`test -f ${cwd}/venv/bin/python3 && echo EXISTS || echo MISSING`, cwd)
      const restartPythonBin = restartVenvCheck.stdout.trim() === 'EXISTS' ? `${cwd}/venv/bin/python3` : 'python3'

      // Start
      await run(`nohup ${restartPythonBin} ${cwd}/runner.py > ${cwd}/runner.log 2>&1 &`, cwd)
      await run(`nohup ${cwd}/cloudflared tunnel --config ${cwd}/config.yml run sycord-runner > ${cwd}/tunnel.log 2>&1 &`, cwd)

      await new Promise(r => setTimeout(r, 3000))

      const flaskUp = await run('pgrep -f "runner\\.py" || true', cwd)
      const tunnelUp = await run('pgrep -f "cloudflared.*tunnel" || true', cwd)

      if (!flaskUp.stdout.trim()) {
        const flaskLog = await run(`tail -n 30 ${cwd}/runner.log`, cwd)
        ssh.dispose()
        return NextResponse.json({
          error: `Flask crashed after restart. Log:\n${flaskLog.stdout || flaskLog.stderr || 'No output'}`
        }, { status: 500 })
      }

      if (!tunnelUp.stdout.trim()) {
        const logTail = await run(`tail -n 20 ${cwd}/tunnel.log`, cwd)
        ssh.dispose()
        return NextResponse.json({
          error: `Tunnel crashed after restart. Log:\n${logTail.stdout || logTail.stderr || 'No output'}`
        }, { status: 500 })
      }

      ssh.dispose()
      return NextResponse.json({
        success: true,
        message: `Restarted! Flask: running, Tunnel: running.`
      })
    }

    // --- WRITE ENV FILE ---
    if (action === "write_env") {
      const { envVars } = body
      if (!envVars || typeof envVars !== "object") {
        ssh.dispose()
        return NextResponse.json({ error: "envVars object is required" }, { status: 400 })
      }

      // Build .env content from key-value pairs
      const envContent = Object.entries(envVars)
        .filter(([, v]) => v !== undefined && v !== null && v !== "")
        .map(([k, v]) => `${k}=${v}`)
        .join("\n")

      await ssh.execCommand(`cat > .env`, { cwd, stdin: envContent + "\n" })

      ssh.dispose()
      return NextResponse.json({
        success: true,
        message: `.env file written with ${Object.keys(envVars).length} variables.`
      })
    }

    ssh.dispose()
    return NextResponse.json({ error: "Invalid action parameter" }, { status: 400 })

  } catch (error: any) {
    console.error(`[VPS Setup] Error (${request.url}):`, error)
    return NextResponse.json({ error: error.message || "Failed to execute VPS action" }, { status: 500 })
  }
}
