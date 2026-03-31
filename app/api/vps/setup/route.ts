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

    const { pythonRunnerScript } = await request.json()

    if (!pythonRunnerScript) {
      return NextResponse.json({ error: "Missing python runner script" }, { status: 400 })
    }

    const host = process.env.VPS_IP
    const username = process.env.VPS_USERNAME
    const password = process.env.VPS_PASSWORD

    if (!host || !username || !password) {
      return NextResponse.json({ error: "VPS credentials missing in environment variables" }, { status: 500 })
    }

    const ssh = new NodeSSH()

    console.log(`[VPS Setup] Connecting to ${host} as ${username}...`)

    await ssh.connect({
      host,
      username,
      password,
    })

    console.log(`[VPS Setup] Connected! Executing setup commands...`)

    // 1. Clone repository
    const cloneResult = await ssh.execCommand('git clone https://github.com/MDavidka/server-sycord myapp', { cwd: '/home/' + username })
    console.log(`[VPS Setup] Clone Output: ${cloneResult.stdout}`)
    if (cloneResult.stderr && !cloneResult.stderr.includes('Cloning into') && !cloneResult.stderr.includes('already exists')) {
      console.error(`[VPS Setup] Clone Error: ${cloneResult.stderr}`)
    }

    // 2. Write runner.py
    const runnerPath = `/home/${username}/myapp/runner.py`

    // Use cat to write the file, handling potential quotes in the script by passing via stdin
    await ssh.execCommand(`cat > ${runnerPath}`, {
        cwd: `/home/${username}/myapp`,
        stdin: pythonRunnerScript
    });

    console.log(`[VPS Setup] Wrote runner.py to ${runnerPath}`)

    // 3. Optional: setup requirements and run the runner.
    // Usually, we'd start it in the background or as a service (e.g., systemd or pm2).
    // For this simple setup, we'll try to install basic dependencies if they don't exist
    await ssh.execCommand('pip3 install flask', { cwd: `/home/${username}/myapp` })

    // Note: We don't block by running the script synchronously here, otherwise the HTTP request hangs.
    // We launch it with nohup in the background.
    const startResult = await ssh.execCommand('nohup python3 runner.py > runner.log 2>&1 &', { cwd: `/home/${username}/myapp` })
    console.log(`[VPS Setup] Start Runner Output: ${startResult.stdout}`)

    ssh.dispose()

    return NextResponse.json({ success: true, message: "VPS Setup completed successfully!" })
  } catch (error: any) {
    console.error("[VPS Setup] Error:", error)
    return NextResponse.json({ error: error.message || "Failed to setup VPS" }, { status: 500 })
  }
}
