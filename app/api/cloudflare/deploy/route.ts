import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";

/**
 * Cloudflare API Configuration
 */
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

/**
 * Helper to make Cloudflare API calls with retry logic
 */
async function cloudflareApiCall(
  url: string,
  options: RequestInit,
  apiToken: string,
  retries = 3
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
  };

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { ...options, headers });

      if (response.status === 401 || response.status === 403) {
        console.error(`[Cloudflare] Auth error: ${response.status}`);
        return response;
      }

      if (response.ok) {
        return response;
      }

      if (response.status < 500 && response.status !== 429) {
          return response;
      }

      const errorText = await response.text();
      console.error(`[Cloudflare] API call failed (attempt ${i + 1}/${retries}):`, {
        url,
        status: response.status,
        error: errorText,
      });

      lastError = errorText;

      if (i < retries - 1) {
        const waitTime = 1000 * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    } catch (error) {
      console.error(`[Cloudflare] Request error (attempt ${i + 1}/${retries}):`, error);
      lastError = error;

      if (i < retries - 1) {
        const waitTime = 1000 * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  throw new Error(`API call failed after ${retries} retries: ${lastError}`);
}

async function createPagesProject(accountId: string, projectName: string, apiToken: string) {
    // Check if exists
    const getRes = await cloudflareApiCall(
        `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}`,
        { method: "GET" },
        apiToken
    );

    if (getRes.ok) {
        return; // Exists
    }

    // Create
    const createRes = await cloudflareApiCall(
        `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: projectName,
                production_branch: "main",
            })
        },
        apiToken
    );

    if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Failed to create Pages project: ${err}`);
    }
}

async function deployToPages(accountId: string, projectName: string, files: Record<string, string>, apiToken: string) {
    const form = new FormData();
    const manifest: Record<string, string> = {};
    const fileParts: { hash: string; blob: Blob }[] = [];

    // 1. Calculate Hashes and Prepare Blobs
    for (const [path, content] of Object.entries(files)) {
        // Pages manifest expects paths starting with /
        const filename = path.startsWith('/') ? path : `/${path}`;

        // Calculate SHA-256 hash
        const buffer = Buffer.from(content);
        const hash = createHash('sha256').update(buffer).digest('hex');

        manifest[filename] = hash;

        let contentType = "text/plain";
        if (filename.endsWith(".html")) contentType = "text/html";
        else if (filename.endsWith(".js")) contentType = "application/javascript";
        else if (filename.endsWith(".css")) contentType = "text/css";
        else if (filename.endsWith(".ts")) contentType = "application/javascript"; // Serve TS as JS mime for Babel

        const blob = new Blob([buffer], { type: contentType });
        fileParts.push({ hash, blob });
    }

    // 2. Append Manifest FIRST
    const manifestJson = JSON.stringify(manifest);
    console.log(`[Cloudflare] Manifest: ${manifestJson}`);

    // Append as a Blob with explicit JSON type and filename, just to be safe and explicit
    form.append("manifest", new Blob([manifestJson], { type: "application/json" }), "manifest.json");

    // 3. Append Files
    for (const { hash, blob } of fileParts) {
        // Append using hash as key. Do NOT pass filename in 3rd arg to avoid confusion,
        // as the key itself identifies the file in the manifest.
        form.append(hash, blob);
    }

    console.log(`[Cloudflare] Deploying ${Object.keys(files).length} files to ${projectName}`);

    const deployRes = await cloudflareApiCall(
        `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
        {
            method: "POST",
            body: form,
        },
        apiToken
    );

    if (!deployRes.ok) {
        const err = await deployRes.text();
        throw new Error(`Pages deployment failed: ${err}`);
    }

    return deployRes.json();
}

async function deleteWorkerScript(accountId: string, scriptName: string, apiToken: string) {
    const res = await cloudflareApiCall(
        `${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}`,
        { method: "DELETE" },
        apiToken
    );
    if (!res.ok && res.status !== 404) {
        console.warn(`[Cloudflare] Failed to delete old worker ${scriptName}`);
    }
}

/**
 * POST /api/cloudflare/deploy
 * Deploys the project to Cloudflare Pages (Direct Upload)
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, cloudflareProjectName } = await request.json();

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
    }

    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid projectId format" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    // 1. Get Credentials
    let apiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;
    let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiToken || !accountId) {
        const tokenDoc = await db.collection("cloudflare_tokens").findOne({
          projectId: new ObjectId(projectId),
          userId: session.user.email,
        });

        if (tokenDoc) {
            apiToken = tokenDoc.apiToken;
            accountId = tokenDoc.accountId;
        }
    }

    if (!apiToken || !accountId) {
      return NextResponse.json(
        { error: "No Cloudflare credentials found. Please configure env vars or authenticate." },
        { status: 400 }
      );
    }

    // 2. Get Project
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 3. Determine Cloudflare Pages Project Name
    let cfProjectName = cloudflareProjectName || project.cloudflareProjectName;
    if (!cfProjectName) {
      const baseName = project.name || project.businessName || `project-${projectId}`;
      cfProjectName = baseName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 58);
    }

    // 4. Collect Pages from DB
    const pages = await db
      .collection("pages")
      .find({ projectId: new ObjectId(projectId) })
      .toArray();

    const files: Record<string, string> = {};
    let defaultContent = "";

    // 5. Build File Map
    if (pages.length === 0) {
        // Fallback "Start Imagining"
        defaultContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name || "New Site"}</title>
    <style>
        body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f0f9ff; color: #0f172a; }
        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; max-width: 400px; border: 1px solid #e2e8f0; }
        h1 { margin: 0 0 1rem; color: #0284c7; }
        p { color: #64748b; line-height: 1.5; }
        .badge { background: #e0f2fe; color: #0369a1; padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.875rem; font-weight: 500; margin-top: 1rem; display: inline-block; }
    </style>
</head>
<body>
    <div class="card">
        <h1>${project.name || "New Site"}</h1>
        <p>This site is successfully deployed to Cloudflare Pages.</p>
        <div class="badge">Pages Mode</div>
    </div>
</body>
</html>`;
        files["index.html"] = defaultContent;
    } else {
        let hasIndexHtml = false;
        let indexTsPage = null;

        pages.forEach(page => {
            let content = page.content || "";
            // Clean content (remove markdown code blocks if present)
            if (content.trim().startsWith("```")) {
                 const match = content.match(/```(?:typescript|js|jsx|tsx|html|css)?\s*([\s\S]*?)```/);
                 if (match) {
                     content = match[1].trim();
                 }
            }

            const name = page.name;

            // If name has no extension, map to .html for direct serving, or keep as is?
            // Pages serves /foo from /foo.html automatically.
            let filename = name;
            if (!filename.includes(".")) {
                filename = `${filename}.html`;
            }

            files[filename] = content;

            // Handle index conventions
            if (name === "index" || name === "index.html") {
                hasIndexHtml = true;
                defaultContent = content; // Keep reference
            } else if (name === "index.ts") {
                indexTsPage = page;
            }
        });

        // If no index.html but index.ts exists, create a wrapper
        if (!hasIndexHtml && indexTsPage) {
            defaultContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${project.name || "App"}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script type="importmap">
    {
      "imports": {
        "react": "https://esm.sh/react@18",
        "react-dom/client": "https://esm.sh/react-dom@18/client",
        "lucide-react": "https://esm.sh/lucide-react",
        "framer-motion": "https://esm.sh/framer-motion",
        "clsx": "https://esm.sh/clsx",
        "tailwind-merge": "https://esm.sh/tailwind-merge"
      }
    }
    </script>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-type="module" data-presets="react,typescript" src="/index.ts"></script>
</body>
</html>`;
            files["index.html"] = defaultContent;
        } else {
            // Ensure we have an index.html if we didn't find one
             if (!files["index.html"] && defaultContent) {
                  files["index.html"] = defaultContent;
             }
        }
    }

    // Add 404.html for SPA fallback (using index.html content)
    if (files["index.html"] && !files["404.html"]) {
        files["404.html"] = files["index.html"];
    }

    // 6. Deploy to Cloudflare Pages
    console.log(`[Cloudflare] Creating/Updating Pages Project: ${cfProjectName}`);
    await createPagesProject(accountId, cfProjectName, apiToken);

    console.log(`[Cloudflare] Uploading files...`);
    await deployToPages(accountId, cfProjectName, files, apiToken);

    // 7. Construct URL (Pages uses project-name.pages.dev)
    const deploymentUrl = `https://${cfProjectName}.pages.dev`;
    console.log(`[Cloudflare] Success! Pages URL: ${deploymentUrl}`);

    // 8. Delete Old Worker (if applicable)
    // We check if previous deploymentId started with "worker-" or just try to delete
    if (project.cloudflareDeploymentId && project.cloudflareDeploymentId.startsWith("worker-")) {
        console.log(`[Cloudflare] Deleting old worker script: ${cfProjectName}`);
        await deleteWorkerScript(accountId, cfProjectName, apiToken);
    }

    // 9. Update DB
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          cloudflareProjectName: cfProjectName,
          cloudflareUrl: deploymentUrl,
          cloudflareDeployedAt: new Date(),
          cloudflareDeploymentId: "pages-latest",
        },
      }
    );

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
      projectName: cfProjectName,
    });

  } catch (error: any) {
    console.error("[Cloudflare] Deployment Error:", error);
    return NextResponse.json(
      { error: error.message || "Deployment failed" },
      { status: 500 }
    );
  }
}
