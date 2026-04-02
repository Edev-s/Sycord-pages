"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Terminal, Copy, Check, ArrowLeft, Play, Loader2, ExternalLink, ShieldCheck, Server, Globe, Power, Lock } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"
import { toast } from "sonner"

export default function SetupPage() {
  const [copiedBash, setCopiedBash] = useState(false)
  const [copiedPython, setCopiedPython] = useState(false)

  // State for guided steps
  // 0: Init, 1: Auth, 2: Config, 3: Start, 4: Done
  const [currentStep, setCurrentStep] = useState(0)
  const [loadingStep, setLoadingStep] = useState<number | null>(null)
  const [authUrl, setAuthUrl] = useState<string | null>(null)
  const [tunnelId, setTunnelId] = useState<string | null>(null)

  // Defaulting to the requested Cloudflare Origin Certificate strings
  const [sslCert, setSslCert] = useState(`-----BEGIN CERTIFICATE-----
MIIEmzCCA4OgAwIBAgIUFFFkwBiYB39EexzlXOceu8W6qzkwDQYJKoZIhvcNAQEL
BQAwgYsxCzAJBgNVBAYTAlVTMRkwFwYDVQQKExBDbG91ZEZsYXJlLCBJbmMuMTQw
MgYDVQQLEytDbG91ZEZsYXJlIE9yaWdpbiBTU0wgQ2VydGlmaWNhdGUgQXV0aG9y
aXR5MRYwFAYDVQQHEw1TYW4gRnJhbmNpc2NvMRMwEQYDVQQIEwpDYWxpZm9ybmlh
MB4XDTI2MDQwMjE4NDgwMFoXDTQxMDMyOTE4NDgwMFowYjEZMBcGA1UEChMQQ2xv
dWRGbGFyZSwgSW5jLjEdMBsGA1UECxMUQ2xvdWRGbGFyZSBPcmlnaW4gQ0ExJjAk
BgNVBAMTHUNsb3VkRmxhcmUgT3JpZ2luIENlcnRpZmljYXRlMIIBIjANBgkqhkiG
9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5icHgOjHdEVSpb5l64tXR2vnSDZcgN9TBc3/
ZRfzVrOQXrvirs/lPKh93RPL9jw/aNSOc1QtBs0ED5Tdp3tHp5g8WuebYJkL7Kv7
wqUXXdBKOdgV+jQEyfIzqUhViPh/CeNAXzg71TFKcEVAnr7m9sbHmQMzsLaMNSdB
egumWHbPjtZ4MIdQQmAZic54W4VtZOxd1faClus5ihQIPnsBYvIs1a3fdzsIJW4w
pJmx1YY260+KsN9CGC84PdWJ1I123PeB+k3HGjWFnZOXuMy9ehX7HBC4LhyxcGIu
NX7uNt8sV81cuRokPQF//8g0e9OKklw+InIGHY+th3HyPxbQTQIDAQABo4IBHTCC
ARkwDgYDVR0PAQH/BAQDAgWgMB0GA1UdJQQWMBQGCCsGAQUFBwMCBggrBgEFBQcD
ATAMBgNVHRMBAf8EAjAAMB0GA1UdDgQWBBQfs4AHhVVQj4RATc9cdX3XKH/xqDAf
BgNVHSMEGDAWgBQk6FNXXXw0QIep65TbuuEWePwppDBABggrBgEFBQcBAQQ0MDIw
MAYIKwYBBQUHMAGGJGh0dHA6Ly9vY3NwLmNsb3VkZmxhcmUuY29tL29yaWdpbl9j
YTAeBgNVHREEFzAVghMqLnNlcnZlci5zeWNvcmQuY29tMDgGA1UdHwQxMC8wLaAr
oCmGJ2h0dHA6Ly9jcmwuY2xvdWRmbGFyZS5jb20vb3JpZ2luX2NhLmNybDANBgkq
hkiG9w0BAQsFAAOCAQEAJUQnl679OCYbs0ws0rOCVRVXdTlPj+cs5tWLAdakxuyU
db53pnTcwf6D/5F7ukvmh+6lBU/KD9FrKMaNBjilpEIT2tOVFY3oeMZKEjx0jXeA
xvp8xtENrSlfDHMeHyHIcNkKSZGNhruWcN9VoJp8pfZdCrCLHPP+4SWXf4YUmhJt
6SmyEf5Y4+YlUioNnmJICOIvw/VuBSEom97nvakCus6VekHpRAPsflJo/kr1Vu09
rQDhLZB4nBq/VInBr2dzehhfMMn7Yf4yOl2s9X1pIvRaxpR6sniZDV8Q6m4dysDw
d5gfMDaRRfB7Avb9uKU3m8kaDfg5RQQsFRG9f1HceA==
-----END CERTIFICATE-----`)

  const [sslKey, setSslKey] = useState(`-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDmJweA6Md0RVKl
vmXri1dHa+dINlyA31MFzf9lF/NWs5Beu+Kuz+U8qH3dE8v2PD9o1I5zVC0GzQQP
lN2ne0enmDxa55tgmQvsq/vCpRdd0Eo52BX6NATJ8jOpSFWI+H8J40BfODvVMUpw
RUCevub2xseZAzOwtow1J0F6C6ZYds+O1ngwh1BCYBmJznhbhW1k7F3V9oKW6zmK
FAg+ewFi8izVrd93OwglbjCkmbHVhjbrT4qw30IYLzg91YnUjXbc94H6TccaNYWd
k5e4zL16FfscELguHLFwYi41fu423yxXzVy5GiQ9AX//yDR704qSXD4icgYdj62H
cfI/FtBNAgMBAAECggEAH8HU7Dmyg92o6Mvb3mOMuIMwF6vAmdu25f8ltXpXjmga
jKfaQIrZM8SAEYhQxXpMuZdSzKEZ0W1qmQfOifSdz4dXFKgOrYaQuaiFhbcoAT7j
bxXc+nhBDOiJrlsXyl2XkfK0iC8HOoSho9o6b20iC30kP33MnR6jPBZdl4yR+HSx
cpLv4QXouUQ+T1Lo07seaaL4xQQ1HRA0Eh9I+VOCAvUXZDxrT9/CV3yViIW6cCnB
6WToaq9Xe5bSPMD5AFnYqFK9Dh57yt0XqGE2y7UBJOgOC9YHPW0BuT5N8mh1wfE1
9g2QGAsemrAeLHM9BjLSgj6MD3az9VQFhmnBt1cn1QKBgQD2XL/pdwCEg61Oh72R
xiwz0iur4j7TdxSsGERMSbnWvG23iyafw/TNqaTUi8BLLfG478ReXdGW8k00dCM7
R56v06XlD1uUVeRnqSxAVrWl4DVIgoct7Wxl6P6rpzs3D90amVBA6RFiEsP6K5Wp
k2TMG08pyk+m1HJas8Pb46+54wKBgQDvJ/FKMHWejvhVFZCZZPg7yc2e9Pa5l1J8
gaePjMohjM9MO8jaoNCRwPnwEPGMwwjP/XIKOS+FhusM4xy6Xv3At/mshSjH6wwO
XwxLROF6kpF9aO2johf1hLoS+BKfY7twzIPmEIt40kNi/hVXp+uYh2JIEJqIY8EK
LFYghG0kDwKBgHJDOk9R/k93sx3FH0tJGp8+Tzr9SB5UEKZw6txnJWZPJqQGSfe3
rwbkM6rQ1nMH8CDSM8WAxgC4iM5XPy/zW8o446yFnvgBjln1wKxmiwFQJ+Zlg8Tt
ZWUu109N1M0I8oevq+UvM/zEr1iMdnGcBxgTYngDeUXrKs6eqayGwa35AoGBAM+E
hi/M+tKZ1kvmCXHBFlCy3DQY9Vm3P4D/9AhwrxgLmfjZS4DB2BkRLQ8tdJuixKvN
jL3oPx8LIjwteckSEfe+6+vSI7/NacmymfVaEJkOQyZh/Qpm5YlKITfCgE5D+Op4
296u7obpVEW6mYRVFe5lU1ea6Kx+eou8SwOuRRHrAoGAP2tnXjIROwltrMKc/5Ya
xdf/XZMXanYejZD+vZgPhCuWBsQ+hFJ7aDonv6NhSw0YPJR9pw16OIR08iyNEBXx
1y9cd6hHBe8uQpCCCOhAdbZwMWAwMx8nklkNO0MLPZCGxnr0pl1UsmfThm7GyCSR
iNziWLvXEC6DMekAG70k9pE=
-----END PRIVATE KEY-----`)

  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const bashCommands = `cd ~
git clone https://github.com/MDavidka/server-sycord myapp
cd myapp`

  const pythonRunner = `from flask import Flask, request, jsonify, send_from_directory, abort
import os
import subprocess
import threading

app = Flask(__name__)

# Directory to save deployments
DEPLOY_DIR = os.path.join(os.path.expanduser("~"), "myapp", "deployments")
os.makedirs(DEPLOY_DIR, exist_ok=True)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def wildcard_router(path):
    host = request.headers.get('Host', '').split(':')[0]

    # Serve the runner index page if accessed via the exact main server domain
    if host == 'server.sycord.com':
        if path.startswith('api/deploy/'):
            return abort(405) # handled by POST below
        return """
        <html>
          <head>
            <title>Sycord VPS Runner</title>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; }
              .container { text-align: center; padding: 2rem; background: #141414; border: 1px solid #333; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); }
              h1 { margin-bottom: 0.5rem; color: #10b981; }
              p { color: #a1a1aa; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>VPS Runner is Online</h1>
              <p>Your Sycord deployment server is running successfully behind Cloudflare.</p>
              <p style="font-size: 0.8rem; margin-top: 1rem; color: #555;">Listening for deployments on /api/deploy/&lt;project_id&gt;</p>
            </div>
          </body>
        </html>
        """

    # Otherwise, it's a subdomain request. Try to extract subdomain and serve from deployments.
    # E.g. myproject.sycord.com -> subdomain 'myproject'
    subdomain = host.split('.')[0]
    project_path = os.path.join(DEPLOY_DIR, subdomain)

    if not os.path.exists(project_path):
        return jsonify({'error': f'Deployment not found for subdomain: {subdomain}'}), 404

    if not path:
        path = 'index.html'

    try:
        return send_from_directory(project_path, path)
    except FileNotFoundError:
        # Fallback to index for SPA routing
        try:
            return send_from_directory(project_path, 'index.html')
        except FileNotFoundError:
            return jsonify({'error': 'File not found'}), 404

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

        # Attempt to issue an automated Let's Encrypt SSL certificate for this specific deployed subdomain.
        # This will only succeed if traffic is routed directly to the VPS IP (DNS Proxied=false).
        domain_name = f'{subdomain}.sycord.com'
        try:
            certbot_cmd = [
                'certbot', 'certonly', '--standalone',
                '--non-interactive', '--agree-tos', '-m', 'admin@sycord.com',
                '-d', domain_name
            ]
            subprocess.Popen(certbot_cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        except Exception as cert_err:
            print(f"Auto-Certbot failed for {domain_name}: {cert_err}")

        return jsonify({
            'success': True,
            'message': f'Saved {files_saved} files. Auto-SSL (Certbot) initiated. If manual cert binding is needed, check the VPS Setup page.',
            'domain': domain_name
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    cert_path = 'cert.pem'
    key_path = 'privkey.pem'

    def run_http():
        print("Starting Flask on HTTP port 5000 (for Cloudflare Tunnel)...")
        app.run(host='127.0.0.1', port=5000)

    # If Cloudflare Origin Certs exist, run securely on port 443/8443 simultaneously for direct access
    if os.path.exists(cert_path) and os.path.exists(key_path):
        print("Certificates found. Starting dual HTTP/HTTPS mode.")
        # Start HTTP server in a background daemon thread
        threading.Thread(target=run_http, daemon=True).start()

        # Start HTTPS server on the main thread
        print("Starting Flask with SSL Context on port 443...")
        try:
            app.run(host='0.0.0.0', port=443, ssl_context=(cert_path, key_path))
        except PermissionError:
            print("Permission denied on port 443, falling back to 8443 with SSL...")
            app.run(host='0.0.0.0', port=8443, ssl_context=(cert_path, key_path))
    else:
        # Run standard HTTP on all interfaces if no certs are present
        print("No certificates found. Starting standard HTTP on port 5000...")
        app.run(host='0.0.0.0', port=5000)`

  const runStep = async (stepNumber: number, action: string) => {
    try {
      setLoadingStep(stepNumber)
      toast(`Running Step ${stepNumber + 1}...`)

      const body = action === "start_server"
        ? { action, pythonRunnerScript: pythonRunner, sslCert, sslKey }
        : { action }

      const res = await fetch("/api/vps/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Failed to execute step ${stepNumber + 1}.`)
      }

      if (action === "auth") {
        if (data.alreadyAuthorized) {
          toast.success(data.message)
          setCurrentStep(stepNumber + 1) // Advance to config step
        } else if (data.authUrl) {
          setAuthUrl(data.authUrl)
          toast.success(data.message)
        }
      } else {
        if (action === "config" && data.tunnelId) {
          setTunnelId(data.tunnelId)
        }
        toast.success(data.message)
        setCurrentStep(stepNumber + 1) // Advance step
      }

    } catch (error: any) {
      console.error(`VPS Setup Error (Step ${stepNumber + 1}):`, error)
      toast.error(error.message || "An error occurred during VPS setup.")
    } finally {
      setLoadingStep(null)
    }
  }

  // A helper function to advance to Step 2 manually after authorizing
  const handleAuthCompleted = () => {
     setCurrentStep(2)
  }

  // Automatically check if server is already running to bypass setup
  useEffect(() => {
     fetch("https://server.sycord.com")
       .then(res => {
         if(res.ok) {
           setCurrentStep(4) // Skip to done
         }
       })
       .catch(err => console.log("Runner not online yet, proceeding with setup."))
  }, [])

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
            <span className="text-lg font-semibold flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              VPS Automated Setup
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl space-y-8 animate-in fade-in duration-300">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Robust Runner Configuration</h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            This guided process securely connects to your Ubuntu VPS via SSH. We will download the necessary dependencies (Flask, Cloudflared), set up a robust tunnel to <code className="text-foreground">server.sycord.com</code>, and start the Flask webserver.
          </p>
        </div>

        {/* GUIDED STEPS */}
        <div className="space-y-4">

          {/* Step 1: Init */}
          <Card className={`transition-all duration-300 ${currentStep === 0 ? "border-primary shadow-[0_0_15px_rgba(255,255,255,0.05)]" : currentStep > 0 ? "opacity-60 border-border" : "opacity-40 pointer-events-none border-border"}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 0 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>1</span>
                  Initialize VPS Environment
                </CardTitle>
                <CardDescription>
                  Creates <code className="text-xs">~/myapp</code>, clones the repository, and installs Cloudflared and Flask dependencies.
                </CardDescription>
              </div>
              {currentStep > 0 && <Check className="h-5 w-5 text-green-500" />}
            </CardHeader>
            <CardContent>
              {currentStep === 0 && (
                <Button
                  onClick={() => runStep(0, "init")}
                  disabled={loadingStep === 0}
                  className="mt-4"
                >
                  {loadingStep === 0 ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</> : <><Play className="mr-2 h-4 w-4" /> Run Step 1</>}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Auth */}
          <Card className={`transition-all duration-300 ${currentStep === 1 ? "border-primary shadow-[0_0_15px_rgba(255,255,255,0.05)]" : currentStep > 1 ? "opacity-60 border-border" : "opacity-40 pointer-events-none border-border"}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 1 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>2</span>
                  Authorize Cloudflare Tunnel
                </CardTitle>
                <CardDescription>
                  Requests an authorization link from Cloudflare. You will need to open it in your browser to approve the tunnel for this server.
                </CardDescription>
              </div>
              {currentStep > 1 && <Check className="h-5 w-5 text-green-500" />}
            </CardHeader>
            <CardContent>
              {currentStep === 1 && !authUrl && (
                <Button
                  onClick={() => runStep(1, "auth")}
                  disabled={loadingStep === 1}
                  className="mt-4"
                >
                  {loadingStep === 1 ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Requesting Auth Link...</> : <><ShieldCheck className="mr-2 h-4 w-4" /> Get Auth Link</>}
                </Button>
              )}

              {currentStep === 1 && authUrl && (
                <div className="mt-4 p-4 border border-primary/50 bg-primary/5 rounded-lg space-y-4 animate-in fade-in zoom-in duration-300">
                  <p className="text-sm">Click the link below, select your domain (<code className="font-mono">sycord.com</code>), and authorize the tunnel. Once it says "Success" in your browser, click "I have authorized".</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <a
                      href={authUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
                    >
                      Open Authorization Link <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                    <Button variant="outline" onClick={handleAuthCompleted}>
                      I have authorized
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 3: Config */}
          <Card className={`transition-all duration-300 ${currentStep === 2 ? "border-primary shadow-[0_0_15px_rgba(255,255,255,0.05)]" : currentStep > 2 ? "opacity-60 border-border" : "opacity-40 pointer-events-none border-border"}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 2 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>3</span>
                  Configure Tunnel & DNS
                </CardTitle>
                <CardDescription>
                  Creates the <code className="text-xs">sycord-runner</code> tunnel, routes DNS to <code className="text-xs">server.sycord.com</code>, and generates the <code className="text-xs">config.yml</code> file.
                </CardDescription>
              </div>
              {currentStep > 2 && <Check className="h-5 w-5 text-green-500" />}
            </CardHeader>
            <CardContent>
               {currentStep === 2 && (
                <Button
                  onClick={() => runStep(2, "config")}
                  disabled={loadingStep === 2}
                  className="mt-4"
                >
                  {loadingStep === 2 ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Configuring...</> : <><Globe className="mr-2 h-4 w-4" /> Run Step 3</>}
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Step 4: Start Server */}
          <Card className={`transition-all duration-300 ${currentStep === 3 ? "border-primary shadow-[0_0_15px_rgba(255,255,255,0.05)]" : currentStep > 3 ? "opacity-60 border-border" : "opacity-40 pointer-events-none border-border"}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${currentStep >= 3 ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>4</span>
                  Write Runner & Start Server
                </CardTitle>
                <CardDescription>
                  Writes the Python Flask app, securely starts the webserver, and initiates the Cloudflare tunnel routing process.
                </CardDescription>
              </div>
              {currentStep > 3 && <Check className="h-5 w-5 text-green-500" />}
            </CardHeader>
            <CardContent>
               {currentStep === 3 && (
                 <div className="space-y-4 mt-4">
                   <div className="space-y-4 bg-accent/20 p-4 rounded-lg border border-border">
                     <div className="flex items-center gap-2">
                       <Lock className="h-4 w-4 text-muted-foreground" />
                       <h4 className="text-sm font-medium">Optional: Cloudflare Origin Certificate</h4>
                     </div>
                     <p className="text-xs text-muted-foreground">
                       If you are bypassing the tunnel and routing DNS directly to your VPS IP for full strict SSL control over second-level subdomains, paste your Cloudflare Origin Certificate and Private Key here. The runner will automatically bind them to port 443/8443. Leave blank if you are using standard Cloudflare Tunnels (which encrypts automatically).
                     </p>
                     <div className="grid gap-4 md:grid-cols-2">
                       <div className="space-y-2">
                         <label className="text-xs font-medium">Certificate (cert.pem)</label>
                         <Textarea
                           placeholder="-----BEGIN CERTIFICATE-----&#10;..."
                           className="font-mono text-xs h-32 resize-none"
                           value={sslCert}
                           onChange={e => setSslCert(e.target.value)}
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-xs font-medium">Private Key (privkey.pem)</label>
                         <Textarea
                           placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
                           className="font-mono text-xs h-32 resize-none"
                           value={sslKey}
                           onChange={e => setSslKey(e.target.value)}
                         />
                       </div>
                     </div>
                   </div>

                   <Button
                     onClick={() => runStep(3, "start_server")}
                     disabled={loadingStep === 3}
                     className="bg-green-600 hover:bg-green-700 text-white"
                   >
                     {loadingStep === 3 ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...</> : <><Power className="mr-2 h-4 w-4" /> Run Step 4 (Start Server)</>}
                   </Button>
                 </div>
              )}
            </CardContent>
          </Card>

        </div>

        {/* DONE STATE */}
        {currentStep === 4 && (
          <div className="p-6 border border-green-500/50 bg-green-500/10 rounded-lg flex flex-col items-center space-y-6 animate-in zoom-in duration-500">
             <div className="text-center space-y-2">
               <div className="mx-auto h-16 w-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                 <Check className="h-8 w-8 text-green-500" />
               </div>
               <h2 className="text-2xl font-bold text-foreground">VPS Setup Complete!</h2>
               <p className="text-muted-foreground mt-2 max-w-lg mx-auto">The Flask webserver is running robustly in the background and is exposed to the internet.</p>
             </div>

             <div className="w-full max-w-2xl bg-background border border-border rounded-xl p-6 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                   <Globe className="h-5 w-5 text-primary" />
                   DNS Configuration (Required for deployments)
                </h3>
                <p className="text-sm text-muted-foreground">
                   To ensure AI-generated websites can be deployed to their own subdomains, you must add a wildcard DNS record in your Cloudflare dashboard.
                </p>
                <div className="bg-accent/30 p-4 rounded-lg border border-border">
                   <p className="text-sm font-medium mb-2">Add the following CNAME record in Cloudflare:</p>
                   <ul className="text-sm space-y-2 font-mono text-zinc-300">
                      <li><span className="text-zinc-500 inline-block w-16">Type:</span> CNAME</li>
                      <li><span className="text-zinc-500 inline-block w-16">Name:</span> *</li>
                      <li>
                        <span className="text-zinc-500 inline-block w-16">Target:</span>
                        {tunnelId ? `${tunnelId}.cfargotunnel.com` : '<tunnel-uuid>.cfargotunnel.com'}
                      </li>
                   </ul>
                   <p className="text-xs text-muted-foreground mt-4">
                     <strong>Note on SSL:</strong> By routing deployments to <code className="font-mono text-primary">project.sycord.com</code> (a first-level subdomain), Cloudflare's Free Universal SSL will automatically secure your websites. If you were previously routing to <code>*.server.sycord.com</code>, Cloudflare Free SSL does not cover two levels deep, which causes SSL browser errors.
                     <br/><br/>
                     The system will automatically attempt to configure the required CNAME via the Cloudflare API during deployments if API keys are provided.
                   </p>
                </div>
             </div>

             <a
                href="https://server.sycord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center text-sm text-primary hover:underline"
             >
                Test Connection to server.sycord.com <ExternalLink className="ml-1 h-3 w-3" />
             </a>

             {/* CERTBOT INSTRUCTIONS */}
             <div className="w-full max-w-2xl bg-accent/20 border border-border/50 rounded-xl p-6 mt-4 space-y-4">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                   <ShieldCheck className="h-5 w-5 text-yellow-500" />
                   Troubleshooting SSL? (Auto-Certbot)
                </h3>
                <p className="text-sm text-muted-foreground">
                   If Cloudflare's Free Edge SSL is not issuing a certificate for your domain due to DNS proxy caching issues, you can disable the Tunnel and serve the website directly from your VPS IP using Let's Encrypt. The <code className="text-foreground">certbot</code> package is already installed on your server.
                </p>
                <div className="bg-background p-4 rounded-lg border border-border overflow-x-auto">
                   <pre className="text-xs text-zinc-300 font-mono">
{`# 1. SSH into the VPS and stop the tunnel
pkill -f cloudflared

# 2. Issue a free SSL certificate for your domain
sudo certbot certonly --standalone -d yourdomain.sycord.com

# 3. Update the runner.py app.run() to use the generated certificates
# app.run(host='0.0.0.0', port=443, ssl_context=('/etc/letsencrypt/live/yourdomain.sycord.com/fullchain.pem', '/etc/letsencrypt/live/yourdomain.sycord.com/privkey.pem'))`}
                   </pre>
                </div>
             </div>
          </div>
        )}

      </main>
    </div>
  )
}
