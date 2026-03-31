"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Terminal, Copy, Check, ArrowLeft, Play, Loader2 } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function SetupPage() {
  const [copiedBash, setCopiedBash] = useState(false)
  const [copiedPython, setCopiedPython] = useState(false)
  const [isDeploying, setIsDeploying] = useState(false)

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
import subprocess
import threading
import time

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

def start_cloudflared():
    print("Starting Cloudflared tunnel...")
    # Cloudflared requires the port the Flask app is running on
    cmd = ["cloudflared", "tunnel", "--url", "http://localhost:5000"]
    try:
        process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True
        )
        for line in iter(process.stdout.readline, ''):
            print(line, end='')
            if "https://trycloudflare.com" in line or "auth" in line.lower():
                # The auth link will be printed here
                pass
    except FileNotFoundError:
        print("Error: 'cloudflared' not found. Please install it.")
    except Exception as e:
        print(f"Cloudflared error: {e}")

if __name__ == '__main__':
    # Start Cloudflared in a background thread
    threading.Thread(target=start_cloudflared, daemon=True).start()

    # Start Flask app
    app.run(host='0.0.0.0', port=5000)`

  const handleAutomatedSetup = async () => {
    try {
      setIsDeploying(true)
      toast("Initiating automated VPS setup...")

      const res = await fetch("/api/vps/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pythonRunnerScript: pythonRunner }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to setup VPS automatically.")
      }

      toast.success(data.message || "VPS configured successfully!")
    } catch (error: any) {
      console.error("VPS Setup Error:", error)
      toast.error(error.message || "An error occurred during VPS setup.")
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
              receive deployments from Sycord, and automatically connect to a Cloudflare Tunnel.
            </p>
          </div>
          <Button
            onClick={handleAutomatedSetup}
            disabled={isDeploying}
            className="shrink-0"
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up VPS...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4 fill-current" />
                Run Automated Setup
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-4 my-8">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs uppercase text-muted-foreground font-semibold tracking-wider">Or Set Up Manually</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">1</span>
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

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-sm font-bold">2</span>
              Create the Runner Script
            </CardTitle>
            <CardDescription>
              Inside the `myapp` directory, save the following Python script as `runner.py`. This script starts a Flask server to receive deployments and automatically sets up a Cloudflare Tunnel. Check the console output for the Cloudflare authentication link.
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
