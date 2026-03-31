import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "API Documentation – Sycord VPS",
  description: "Documentation for the Sycord VPS deployment API.",
}

const ENDPOINTS = [
  {
    method: "POST",
    path: "/api/deploy/<project_id>",
    description: "Deploy or update a project's files on the VPS.",
    body: `{
  "files": [
    { "path": "index.html", "content": "<html>…</html>" },
    { "path": "styles/main.css", "content": "body { … }" }
  ],
  "subdomain": "my-site"
}`,
    response: `{
  "success": true,
  "project_id": "abc123",
  "domain": "my-site.sycord.com",
  "files_count": 2
}`,
  },
  {
    method: "GET",
    path: "/api/projects/<project_id>",
    description:
      "Retrieve project metadata including deployed files list, subdomain and domain.",
    body: null,
    response: `{
  "success": true,
  "project_id": "abc123",
  "subdomain": "my-site",
  "domain": "my-site.sycord.com",
  "files_count": 2,
  "deployed_at": "2026-03-30T12:00:00Z",
  "files": ["index.html", "styles/main.css"]
}`,
  },
  {
    method: "GET",
    path: "/api/logs?project_id=<id>&limit=<n>",
    description:
      "Fetch recent server logs for a project. `limit` defaults to 200 (max 500).",
    body: null,
    response: `{
  "success": true,
  "project_id": "abc123",
  "logs": [
    "2026-03-30 12:00:01 [INFO] Deployed project abc123 (2 files, subdomain=my-site)"
  ]
}`,
  },
  {
    method: "DELETE",
    path: "/api/projects/<project_id>",
    description: "Delete a project and all associated files from the VPS.",
    body: null,
    response: `{
  "success": true,
  "message": "Project deleted successfully"
}`,
  },
] as const

function MethodBadge({ method }: { method: string }) {
  const colors: Record<string, string> = {
    GET: "bg-emerald-600/20 text-emerald-400 border-emerald-600/40",
    POST: "bg-blue-600/20 text-blue-400 border-blue-600/40",
    DELETE: "bg-red-600/20 text-red-400 border-red-600/40",
  }
  return (
    <span
      className={`inline-block px-2.5 py-0.5 text-xs font-semibold rounded border ${colors[method] ?? "bg-zinc-700 text-zinc-300 border-zinc-600"}`}
    >
      {method}
    </span>
  )
}

export default function ApiDocsPage() {
  return (
    <main className="min-h-screen bg-[#18191B] text-zinc-100">
      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header */}
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          VPS Deployment API
        </h1>
        <p className="text-zinc-400 mb-10 text-sm leading-relaxed">
          The Sycord VPS runs a Flask server exposed through a Cloudflare
          Tunnel. Each deployed site is served via subdomain detection –
          e.g.&nbsp;
          <code className="text-zinc-300 bg-zinc-800 px-1.5 py-0.5 rounded text-xs">
            my-site.sycord.com
          </code>
          .
        </p>

        {/* Info box */}
        <div className="rounded-xl border border-blue-600/30 bg-blue-950/20 p-5 mb-12">
          <h2 className="text-sm font-semibold text-blue-400 mb-1">
            ℹ️&ensp;How it works
          </h2>
          <ul className="list-disc list-inside text-sm text-zinc-300 space-y-1 leading-relaxed">
            <li>
              Files are uploaded directly to the VPS via the{" "}
              <strong>Deploy</strong> endpoint.
            </li>
            <li>
              The Flask server stores them on disk and creates a subdomain
              mapping so&nbsp;
              <code className="bg-zinc-800 px-1 py-0.5 rounded text-xs">
                &lt;subdomain&gt;.sycord.com
              </code>{" "}
              resolves to the correct content.
            </li>
            <li>
              Cloudflare Tunnel handles TLS and routes traffic to the VPS
              without exposing a public IP.
            </li>
            <li>
              Server logs are persisted and can be queried per-project via the{" "}
              <strong>Logs</strong> endpoint.
            </li>
          </ul>
        </div>

        {/* Endpoints */}
        <div className="space-y-10">
          {ENDPOINTS.map((ep) => (
            <section
              key={`${ep.method}-${ep.path}`}
              className="rounded-xl border border-zinc-700/60 bg-zinc-900/60 overflow-hidden"
            >
              {/* title bar */}
              <div className="flex items-center gap-3 px-5 py-3 border-b border-zinc-800">
                <MethodBadge method={ep.method} />
                <code className="text-sm text-zinc-200 font-mono">
                  {ep.path}
                </code>
              </div>

              <div className="px-5 py-4 space-y-4 text-sm">
                <p className="text-zinc-400">{ep.description}</p>

                {ep.body && (
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                      Request body
                    </h3>
                    <pre className="bg-zinc-950 rounded-lg p-3 text-xs leading-relaxed overflow-x-auto text-zinc-300">
                      {ep.body}
                    </pre>
                  </div>
                )}

                <div>
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">
                    Response
                  </h3>
                  <pre className="bg-zinc-950 rounded-lg p-3 text-xs leading-relaxed overflow-x-auto text-zinc-300">
                    {ep.response}
                  </pre>
                </div>
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
