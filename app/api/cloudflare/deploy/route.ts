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
    // Step 1: Build manifest with SHA-256 hashes and prepare file buffers
    const manifest: Record<string, string> = {};
    const fileBuffers: { hash: string; buffer: Buffer; contentType: string }[] = [];

    for (const [path, content] of Object.entries(files)) {
        // Pages manifest expects paths WITHOUT leading slash or dot-slash
        const filename = path.replace(/^(\.\/|\/)+/, "");

        // Calculate SHA-256 hash
        const buffer = Buffer.from(content, "utf-8");
        const hash = createHash("sha256").update(buffer).digest("hex");

        // Add to manifest map: path -> hash
        manifest[filename] = hash;

        // Determine Content-Type
        let contentType = "application/octet-stream";
        if (filename.endsWith(".html")) contentType = "text/html";
        else if (filename.endsWith(".js")) contentType = "application/javascript";
        else if (filename.endsWith(".css")) contentType = "text/css";
        else if (filename.endsWith(".json")) contentType = "application/json";
        else if (filename.endsWith(".ts") || filename.endsWith(".tsx")) contentType = "application/javascript";
        else if (filename.endsWith(".png")) contentType = "image/png";
        else if (filename.endsWith(".jpg") || filename.endsWith(".jpeg")) contentType = "image/jpeg";
        else if (filename.endsWith(".svg")) contentType = "image/svg+xml";
        else if (filename.endsWith(".ico")) contentType = "image/x-icon";
        else if (filename.endsWith(".woff")) contentType = "font/woff";
        else if (filename.endsWith(".woff2")) contentType = "font/woff2";

        // Store buffer for later upload
        fileBuffers.push({ hash, buffer, contentType });

        console.log(`[Cloudflare Debug] File prepared: ${filename} -> hash=${hash.substring(0, 12)}..., size=${buffer.length} bytes`);
    }

    // Convert manifest to JSON string
    const manifestJson = JSON.stringify(manifest);
    console.log(`[Cloudflare Debug] Manifest created with ${Object.keys(manifest).length} files`);
    console.log(`[Cloudflare Debug] Manifest content:`, manifestJson);

    // Step 2: Create deployment with manifest to get upload_url
    // This is the FIRST API call - creates deployment and returns upload URL
    const deployUrl = `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`;
    console.log(`[Cloudflare Debug] Creating deployment at: ${deployUrl}`);

    const formDataForDeployment = new FormData();
    
    // CRITICAL: Manifest must be the FIRST part appended to FormData
    // It must have name="manifest", filename="manifest.json", and content-type="application/json"
    const manifestBuffer = Buffer.from(manifestJson, "utf-8");
    const manifestBlob = new Blob([manifestBuffer], { type: "application/json" });
    formDataForDeployment.append("manifest", manifestBlob, "manifest.json");

    // Append branch metadata (optional but recommended)
    formDataForDeployment.append("branch", "main");

    // Append all file blobs using their SHA-256 hash as the field name
    for (const { hash, buffer, contentType } of fileBuffers) {
        const fileBlob = new Blob([buffer], { type: contentType });
        formDataForDeployment.append(hash, fileBlob);
        console.log(`[Cloudflare Debug] Appended file blob: hash=${hash.substring(0, 12)}..., size=${buffer.length}, type=${contentType}`);
    }

    console.log(`[Cloudflare] Deploying ${Object.keys(files).length} files to ${projectName}`);

    // Send the deployment request with manifest + files in a single request
    const deployRes = await cloudflareApiCall(
        deployUrl,
        {
            method: "POST",
            body: formDataForDeployment,
            // Note: Don't set Content-Type header - fetch will set it automatically with boundary
        },
        apiToken
    );

    if (!deployRes.ok) {
        const err = await deployRes.text();
        console.error(`[Cloudflare Debug] Deployment Failed! Status: ${deployRes.status}`);
        console.error(`[Cloudflare Debug] Error Body: ${err}`);
        throw new Error(`Pages deployment failed (${deployRes.status}): ${err}`);
    }

    const responseData = await deployRes.json();
    console.log(`[Cloudflare Debug] Deployment Success! Response:`, JSON.stringify(responseData, null, 2));

    // Check if we got an upload_url (means we need to upload files separately)
    const uploadUrl = responseData.result?.upload_url;
    if (uploadUrl) {
        console.log(`[Cloudflare Debug] Received upload_url, uploading files separately...`);
        
        // Step 3: Upload files to the signed upload URL
        const uploadFormData = new FormData();
        
        for (const { hash, buffer, contentType } of fileBuffers) {
            const fileBlob = new Blob([buffer], { type: contentType });
            uploadFormData.append(hash, fileBlob);
        }

        // Upload to the signed URL (no Authorization header needed for signed URLs)
        const uploadRes = await fetch(uploadUrl, {
            method: "POST",
            body: uploadFormData,
        });

        if (!uploadRes.ok) {
            const uploadErr = await uploadRes.text();
            console.error(`[Cloudflare Debug] File upload failed! Status: ${uploadRes.status}`);
            console.error(`[Cloudflare Debug] Upload error: ${uploadErr}`);
            throw new Error(`File upload failed (${uploadRes.status}): ${uploadErr}`);
        }

        const uploadResponseData = await uploadRes.json();
        console.log(`[Cloudflare Debug] File upload success:`, JSON.stringify(uploadResponseData, null, 2));
        
        return uploadResponseData;
    }

    return responseData;
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
    console.log(`[Cloudflare Debug] Target Project Name: ${cfProjectName}`);

    // 4. Collect Pages from DB
    const pages = await db
      .collection("pages")
      .find({ projectId: new ObjectId(projectId) })
      .toArray();

    console.log(`[Cloudflare Debug] Found ${pages.length} pages in DB for project ${projectId}`);

    const files: Record<string, string> = {};
    let defaultContent = "";

    // 5. Build File Map
    if (pages.length === 0) {
        // Fallback content
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
            if (content.trim().startsWith("\`\`\`")) {
                 const match = content.match(/\`\`\`(?:typescript|js|jsx|tsx|html|css)?\s*([\s\S]*?)\`\`\`/);
                 if (match) {
                     content = match[1].trim();
                 }
            }

            const name = page.name;

            // Map filename
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
             if (!files["index.html"] && defaultContent) {
                  files["index.html"] = defaultContent;
             }
        }
    }

    // Add 404.html for SPA fallback
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
