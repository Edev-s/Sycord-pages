import { NextResponse } from "next/server"
import { NodeSSH } from "node-ssh"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

/**
 * GET /api/vps/status
 * Checks whether the Flask runner process is alive on the VPS, returns status,
 * uptime, port binding, and tunnel state.
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (session?.user?.email !== "dmarton336@gmail.com") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const host = process.env.VPS_IP
    const username = process.env.VPS_USERNAME
    const password = process.env.VPS_PASSWORD

    if (!host || !username || !password) {
      return NextResponse.json({
        online: false,
        runner: false,
        tunnel: false,
        error: "VPS credentials not configured",
      })
    }

    const ssh = new NodeSSH()
    try {
      await ssh.connect({ host, username, password, readyTimeout: 5000 })
    } catch {
      return NextResponse.json({
        online: false,
        runner: false,
        tunnel: false,
        error: "Cannot reach VPS via SSH",
      })
    }

    const homeDir = username === "root" ? "/root" : `/home/${username}`
    const cwd = `${homeDir}/myapp`

    const run = async (cmd: string) => {
      const res = await ssh.execCommand(cmd, { cwd })
      return res
    }

    // Check if runner.py process is alive
    const runnerPs = await run('pgrep -f "python3.*/runner.py" -a')
    const runnerRunning = !!runnerPs.stdout.trim()

    // Check if port 5000 is bound
    const portCheck = await run("ss -tlnp | grep :5000")
    const portBound = !!portCheck.stdout.trim()

    // Check if cloudflared tunnel is running
    const tunnelPs = await run('pgrep -f "cloudflared tunnel" -a')
    const tunnelRunning = !!tunnelPs.stdout.trim()

    // Get runner uptime (process start time)
    let uptime = ""
    if (runnerRunning) {
      const uptimeRes = await run(
        'ps -o etime= -p $(pgrep -f "python3.*/runner.py" | head -1) 2>/dev/null'
      )
      uptime = uptimeRes.stdout.trim()
    }

    // Quick health check via HTTP
    let httpOk = false
    if (portBound) {
      const healthRes = await run(
        "curl -s -o /dev/null -w '%{http_code}' --max-time 3 http://127.0.0.1:5000/"
      )
      httpOk = healthRes.stdout.trim() === "200"
    }

    // Check if required packages are installed
    const pipCheck = await run(
      'python3 -c "import flask; print(flask.__version__)" 2>&1'
    )
    const flaskInstalled = !pipCheck.stderr && !pipCheck.stdout.includes("No module")
    const flaskVersion = flaskInstalled ? pipCheck.stdout.trim() : null

    // Check npm/node availability
    const npmCheck = await run("npm --version 2>/dev/null")
    const npmInstalled = !!npmCheck.stdout.trim()
    const nodeCheck = await run("node --version 2>/dev/null")
    const nodeInstalled = !!nodeCheck.stdout.trim()

    // Check for missing dependencies
    const warnings: string[] = []
    if (!flaskInstalled) {
      warnings.push("Flask is not installed – runner.py cannot start")
    }
    if (!npmInstalled) {
      warnings.push("npm is not installed – project builds will fail")
    }
    if (!nodeInstalled) {
      warnings.push("node is not installed – project builds will fail")
    }

    // Check if config.yml exists for tunnel
    const configCheck = await run(`test -f ${cwd}/config.yml && echo "exists"`)
    if (!configCheck.stdout.includes("exists")) {
      warnings.push("config.yml not found – tunnel cannot start")
    }

    // Check if runner.py exists
    const runnerFileCheck = await run(`test -f ${cwd}/runner.py && echo "exists"`)
    if (!runnerFileCheck.stdout.includes("exists")) {
      warnings.push("runner.py not found on VPS")
    }

    // Check required env vars for deploy DNS
    const envChecks = ["CLOUDFLARE_API_KEY", "CLOUDFLARE_ZONE_ID"]
    for (const envVar of envChecks) {
      if (!process.env[envVar]) {
        warnings.push(`${envVar} not set – automated DNS for deployments will be skipped`)
      }
    }

    ssh.dispose()

    return NextResponse.json({
      online: true,
      runner: runnerRunning && portBound,
      tunnel: tunnelRunning,
      httpOk,
      uptime: uptime || null,
      flaskVersion,
      npmInstalled,
      nodeInstalled,
      warnings,
    })
  } catch (error: any) {
    console.error("[VPS Status] Error:", error)
    return NextResponse.json({
      online: false,
      runner: false,
      tunnel: false,
      error: error.message || "Failed to check VPS status",
    })
  }
}
