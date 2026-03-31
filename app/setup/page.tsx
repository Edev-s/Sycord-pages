"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Terminal, Copy, Check, ArrowLeft, Play, Loader2, ExternalLink } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SetupPage() {
  const [copiedBash, setCopiedBash] = useState(false)
  const [copiedPython, setCopiedPython] = useState(false)

  const [isDeploying, setIsDeploying] = useState(false)
  const [authUrl, setAuthUrl] = useState<string | null>(null)

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bashCommands = `cd ~
git clone https://github.com/MDavidka/server-sycord myapp
cd myapp`

  const pythonRunner = `from flask import Flask, request, jsonify
import os

app = Flask(__name__)

# Directory to save deployments
DEPLOY_DIR = os.path.join(os.path.expanduser("~"), "myapp", "deployments")
os.makedirs(DEPLOY_DIR, exist_ok=True)

@app.route('/api/deploy/<project_id>', methods=['POST'])
def deploy(project_id):
    try:
        data = request.json
        if not data or 'files' not in data:
            return jsonify({'error': 'No files provided'}), 400

        subdomain = data.get('subdomain', project_id)
        project_dir = os.path.join(DEPLOY_DIR, subdomain)
        os.makedirs(project_dir, exist_ok=True)

        files_saved = 0
        for file in data['files']:
            path = file.get('path')
            content = file.get('content')
            if not path or not content:
                continue

            file_path = os.path.join(project_dir, path)
            os.makedirs(os.path.dirname(file_path), exist_ok=True)

            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            files_saved += 1

        return jsonify({
            'success': True,
            'message': f'Saved {files_saved} files',
            'domain': f'{subdomain}.vps.sycord.com' # Replace with actual domain logic if needed
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Start Flask app on port 5000 (Cloudflared will route here)
    app.run(host='0.0.0.0', port=5000)`

  const handleStartSetup = async () => {
    try {
      setIsDeploying(true)
      toast("Starting Cloudflared configuration on VPS...")

      const res = await fetch("/api/vps/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to start Cloudflared login process.")
      }

      if (data.authUrl) {
        setAuthUrl(data.authUrl)
        toast.success("Please authorize the Cloudflare Tunnel.")
      }

    } catch (error: any) {
      console.error("VPS Setup Error:", error)
      toast.error(error.message || "An error occurred during VPS setup.")
    } finally {
      setIsDeploying(false)
    }
  }

  const handleCompleteSetup = async () => {
    try {
      setIsDeploying(true)
      toast("Finalizing tunnel and runner...")

      const res = await fetch("/api/vps/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", pythonRunnerScript: pythonRunner }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to complete VPS configuration.")
      }

      toast.success(data.message || "VPS is now configured and running!")
      setAuthUrl(null)
    } catch (error: any) {
      console.error("VPS Setup Error:", error)
      toast.error(error.message || "An error occurred finalizing the setup.")
    } finally {
      setIsDeploying(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild className="hidden md:flex">
              <Link href="/admin">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <span className="text-lg font-semibold">VPS Setup</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-in fade-in duration-300">
        <div className="space-y-2 flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">VPS Runner Configuration</h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">
              Follow these steps to set up a low-resource runner on your Ubuntu VPS. This runner will handle GitHub pulls,
              receive deployments from Sycord, and automatically connect to a Cloudflare Tunnel via <code className="text-foreground">server.sycord.com</code>.
            </p>
          </div>
        </div>

        {/* AUTOMATED SETUP SECTION */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Automated VPS Setup</CardTitle>
            <CardDescription>
              We will securely connect to your VPS, install dependencies, map <code className="text-foreground">server.sycord.com</code> to your local Flask app, and run it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!authUrl ? (
              <Button
                onClick={handleStartSetup}
                disabled={isDeploying}
                size="lg"
                className="w-full sm:w-auto"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Connecting & Preparing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4 fill-current" />
                    Start Automated Setup
                  </>
                )}
              </Button>
            ) : (
              <div className="space-y-6 animate-in fade-in zoom-in duration-300 border border-primary p-6 rounded-lg bg-background">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">1</span>
                    Action Required: Cloudflare Login
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Your VPS is requesting permission to create a Cloudflare Tunnel. Please click the link below to authorize it. Select your domain (`sycord.com`) when prompted.
                  </p>
                </div>

                <a
                  href={authUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 w-full sm:w-auto"
                >
                  Authorize Cloudflare <ExternalLink className="ml-2 h-4 w-4" />
                </a>

                <div className="space-y-2 pt-4 border-t border-border">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">2</span>
                    Complete Setup
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Once you have authorized the tunnel in your browser, click below to finish configuring the DNS records, writing the runner, and starting the background processes.
                  </p>
                  <Button
                    onClick={handleCompleteSetup}
                    disabled={isDeploying}
                    variant="secondary"
                    className="w-full sm:w-auto"
                  >
                    {isDeploying ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Finalizing Setup...
                      </>
                    ) : (
                      <>
                        Complete Setup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Or Set Up Manually</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <Card className="border-border opacity-70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Initialize the VPS Environment
            </CardTitle>
            <CardDescription>
              SSH into your Ubuntu VPS and run the following commands to clone the runner repository.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-accent/30 p-4 rounded-lg overflow-x-auto text-sm font-mono border border-border">
                {bashCommands}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-8 bg-background/50 backdrop-blur hover:bg-background"
                onClick={() => copyToClipboard(bashCommands, setCopiedBash)}
              >
                {copiedBash ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border opacity-70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Create the Runner Script
            </CardTitle>
            <CardDescription>
              Inside the `myapp` directory, save the following Python script as `runner.py`.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <pre className="bg-accent/30 p-4 rounded-lg overflow-x-auto text-xs sm:text-sm font-mono border border-border">
                {pythonRunner}
              </pre>
              <Button
                size="sm"
                variant="ghost"
                className="absolute top-2 right-2 h-8 bg-background/50 backdrop-blur hover:bg-background"
                onClick={() => copyToClipboard(pythonRunner, setCopiedPython)}
              >
                {copiedPython ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
