import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import FormData from "form-data";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const BETA_WAITING_BRANCH = "beta-waiting";
const DEFAULT_WAITING_NAME = "Site";
const MARKDOWN_CODE_FENCE = "```";

interface DeployFile {
  path: string;
  content: string;
}

interface DeployResult {
  url: string;
  deploymentId: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Helper to make Cloudflare API requests
async function cloudflareRequest(
  endpoint: string,
  apiToken: string,
  options: RequestInit = {}
): Promise<{ data: any; status: number }> {
  const url = `${CLOUDFLARE_API_BASE}${endpoint}`;
  console.log(`[Cloudflare] API request: ${options.method || "GET"} ${endpoint}`);

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json();
  console.log(`[Cloudflare] Response status: ${response.status}`);

  if (!response.ok) {
    const errorMsg = data.errors?.[0]?.message || `HTTP ${response.status}`;
    console.error(`[Cloudflare] API error:`, data.errors || data);
    const error = new Error(`Cloudflare API error: ${errorMsg}`) as Error & { status: number };
    error.status = response.status;
    throw error;
  }

  return { data, status: response.status };
}

// Check if a Cloudflare Pages project exists
async function checkProjectExists(
  accountId: string,
  projectName: string,
  apiToken: string
): Promise<boolean> {
  try {
    await cloudflareRequest(
      `/accounts/${accountId}/pages/projects/${projectName}`,
      apiToken
    );
    console.log(`[Cloudflare] Project "${projectName}" exists`);
    return true;
  } catch (error: any) {
    // Check for 404 status (project not found) or Cloudflare's "not_found" error
    if (error.status === 404 || error.message.includes("not_found")) {
      console.log(`[Cloudflare] Project "${projectName}" does not exist`);
      return false;
    }
    throw error;
  }
}

// Create a new Cloudflare Pages project
async function createProject(
  accountId: string,
  projectName: string,
  branch: string,
  apiToken: string
): Promise<void> {
  console.log(`[Cloudflare] Creating project "${projectName}"...`);
  await cloudflareRequest(
    `/accounts/${accountId}/pages/projects`,
    apiToken,
    {
      method: "POST",
      body: JSON.stringify({
        name: projectName,
        production_branch: branch,
      }),
    }
  );
  console.log(`[Cloudflare] Project "${projectName}" created successfully`);
}

// Calculate SHA-256 hash of content (accepts string or Buffer for flexibility)
function calculateHash(content: string | Buffer): string {
  const buffer = typeof content === "string" ? Buffer.from(content, "utf-8") : content;
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

// Deploy files to Cloudflare Pages using Direct Upload API
// This uses the single-request approach where manifest and files are sent together
async function deployToCloudflarePages(
  accountId: string,
  projectName: string,
  branch: string,
  stage: "production" | "preview",
  files: DeployFile[],
  apiToken: string
): Promise<DeployResult> {
  console.log(`[Cloudflare] Starting deployment of ${files.length} files...`);
  console.log(`[Cloudflare] Branch: ${branch}, Stage: ${stage}`);

  // Calculate hashes for all files
  const fileHashes: Record<string, string> = {};
  const fileContents: Record<string, Buffer> = {};

  for (const file of files) {
    // Use Buffer for consistent binary handling
    const contentBuffer = Buffer.from(file.content, "utf-8");
    const hash = calculateHash(contentBuffer);
    fileHashes[file.path] = hash;
    fileContents[hash] = contentBuffer;
    console.log(`[Cloudflare] File: ${file.path} (${contentBuffer.length} bytes, hash: ${hash.substring(0, 12)}...)`);
  }

  // Create deployment with manifest AND files using multipart/form-data
  // Cloudflare Pages Direct Upload API accepts both in a single request
  console.log(`[Cloudflare] Creating deployment with manifest and uploading files...`);
  
  const manifestJson = JSON.stringify(fileHashes);
  
  // Use form-data package for proper multipart handling in Node.js
  const formData = new FormData();
  
  // Add manifest with proper content type
  formData.append("manifest", manifestJson, {
    contentType: "application/json",
  });
  
  // Add each file with its hash as the field name
  for (const [hash, contentBuffer] of Object.entries(fileContents)) {
    formData.append(hash, contentBuffer, {
      contentType: "application/octet-stream",
    });
  }

  const deployUrl = new URL(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`);
  deployUrl.searchParams.set("branch", encodeURIComponent(branch));
  deployUrl.searchParams.set("stage", encodeURIComponent(stage));
  console.log(`[Cloudflare] API request: POST /accounts/${accountId}/pages/projects/${projectName}/deployments?branch=${branch}&stage=${stage}`);
  console.log(`[Cloudflare] Uploading ${Object.keys(fileContents).length} unique files...`);
  
  // Get the form data as a buffer and headers
  const formDataBuffer = formData.getBuffer();
  const formDataHeaders = formData.getHeaders();
  
  const deployResponse = await fetch(deployUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...formDataHeaders,
      "Content-Length": String(formDataBuffer.length),
    },
    // Buffer is a valid body type in Node.js fetch but TypeScript's BodyInit type doesn't include it
    body: formDataBuffer as unknown as BodyInit,
    // The duplex option is required for Node.js fetch with streaming/buffer bodies
    // but isn't in TypeScript's RequestInit type definition yet
    // @ts-expect-error - See: https://github.com/nodejs/node/issues/46221
    duplex: "half",
  });

  const deployData = await deployResponse.json();
  console.log(`[Cloudflare] Response status: ${deployResponse.status}`);

  if (!deployResponse.ok) {
    const errorMsg = deployData.errors?.[0]?.message || `HTTP ${deployResponse.status}`;
    console.error(`[Cloudflare] API error:`, deployData.errors || deployData);
    throw new Error(`Cloudflare API error: ${errorMsg}`);
  }

  const deploymentId = deployData.result?.id;
  const deploymentUrl = deployData.result?.url;

  if (!deploymentId) {
    console.error(`[Cloudflare] Unexpected response structure:`, JSON.stringify(deployData, null, 2));
    throw new Error("No deployment ID received from Cloudflare. Deployment may have failed.");
  }

  console.log(`[Cloudflare] Deployment successful (ID: ${deploymentId})`);

  return {
    url: deploymentUrl || `https://${projectName}.pages.dev`,
    deploymentId,
  };
}

/**
 * POST /api/cloudflare/deploy
 * Deploys the project to Cloudflare Pages using Direct Upload API
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId, cloudflareProjectName, waitingPage } = await request.json();
    const isWaitingBuild = Boolean(waitingPage);

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

    const branch = isWaitingBuild ? BETA_WAITING_BRANCH : "main";
    const stage: "production" | "preview" = branch === "main" ? "production" : "preview";
    const safeWaitingTitle = escapeHtml(project.name || DEFAULT_WAITING_NAME);
    const safeProjectTitle = escapeHtml(project.name || "New Site");
    const safeAppTitle = escapeHtml(project.name || "App");

    const files: DeployFile[] = [];
    let hasIndexHtml = false;
    let indexTsLikeContent: string | null = null;

    // 4. Collect Pages from DB and build files in memory (or use waiting page for beta preview)
    if (isWaitingBuild) {
      const waitingContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeWaitingTitle} — Beta build</title>
  <style>
    :root { color-scheme: light dark; }
    body {
      margin:0;
      min-height:100vh;
      display:flex;
      align-items:center;
      justify-content:center;
      font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at 20% 20%, #e0f2fe, #f8fafc 40%),
        radial-gradient(circle at 80% 0%, #ffe4e6, #fff5f5 40%),
        #f1f5f9;
      color:#0f172a;
    }
    .card { background:rgba(255,255,255,0.9); border:1px solid #e2e8f0; border-radius:18px; padding:32px 28px; box-shadow:0 20px 60px rgba(15,23,42,0.12); max-width:420px; text-align:center; backdrop-filter: blur(10px); }
    .pill { display:inline-flex; align-items:center; gap:8px; background:#0f172a; color:white; padding:6px 12px; border-radius:999px; font-size:12px; letter-spacing:0.02em; text-transform:uppercase; }
    h1 { margin:18px 0 10px; font-size:28px; }
    p { margin:0; color:#475569; line-height:1.6; font-size:15px; }
    .spinner { margin:22px auto 0; width:26px; height:26px; border-radius:50%; border:3px solid #cbd5e1; border-top-color:#0ea5e9; animation:spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <main class="card">
    <div class="pill">Beta Preview | Waiting room</div>
    <h1>Deployment in progress</h1>
    <p>We're preparing your site on Cloudflare Pages. This temporary waiting page will disappear once the build completes.</p>
    <div class="spinner" aria-label="Loading"></div>
  </main>
</body>
</html>`;
      files.push({ path: "/index.html", content: waitingContent });
      hasIndexHtml = true;
    } else {
      const dbPages = await db
        .collection("pages")
        .find({ projectId: new ObjectId(projectId) })
        .toArray();

      if (dbPages.length === 0) {
        // Fallback content
        const defaultContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeProjectTitle}</title>
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
        <h1>${safeProjectTitle}</h1>
        <p>This site is successfully deployed to Cloudflare Pages.</p>
        <div class="badge">Pages Mode</div>
    </div>
</body>
</html>`;
        files.push({ path: "/index.html", content: defaultContent });
        hasIndexHtml = true;
      } else {
        for (const page of dbPages) {
          let content = page.content || "";
          // Clean content (remove markdown code blocks if present)
          if (content.trim().startsWith(MARKDOWN_CODE_FENCE)) {
            const codeFencePattern = new RegExp(`${MARKDOWN_CODE_FENCE}(?:typescript|js|jsx|tsx|html|css)?\\s*([\\s\\S]*?)${MARKDOWN_CODE_FENCE}`);
            const match = content.match(codeFencePattern);
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

          // Ensure path starts with /
          const filePath = filename.startsWith("/") ? filename : `/${filename}`;
          files.push({ path: filePath, content });

          // Handle index conventions
          if (name === "index" || name === "index.html") {
            hasIndexHtml = true;
          } else if (name === "index.ts" || name === "index.tsx") {
            indexTsLikeContent = content;
          }
        }

        // If no index.html but index.ts/tsx exists, create a wrapper with inlined content
        if (!hasIndexHtml && indexTsLikeContent) {
          // Escape closing script tags in the content to prevent breaking HTML structure
          const safeContent = indexTsLikeContent.replace(/<\/script>/gi, '<\\/script>');
          
          const wrapperContent = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeAppTitle}</title>
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
    <style>
      .error-container { padding: 20px; font-family: system-ui, sans-serif; }
      .error-title { color: #dc2626; font-size: 1.25rem; margin-bottom: 0.5rem; }
      .error-message { color: #374151; background: #f3f4f6; padding: 1rem; border-radius: 0.5rem; white-space: pre-wrap; font-family: monospace; font-size: 0.875rem; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel" data-type="module" data-presets="react,typescript">
${safeContent}
    </script>
    <script>
      // Helper function to safely escape HTML for display
      function clientEscapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
      }
      
      // Error handling for Babel transpilation failures
      window.addEventListener('error', function(e) {
          var root = document.getElementById('root');
          var errorMsg = e.message || e.error?.message || 'Unknown error occurred';
          if (root && root.innerHTML === '') {
            root.innerHTML = '<div class="error-container"><h1 class="error-title">Error loading application</h1><pre class="error-message">' + clientEscapeHtml(errorMsg) + '</pre></div>';
          }
        });
      // Fallback timeout to show error if nothing renders
      setTimeout(function() {
        var root = document.getElementById('root');
        if (root && root.innerHTML === '') {
          root.innerHTML = '<div class="error-container"><h1 class="error-title">Application failed to load</h1><p>The application code could not be executed. Please check the browser console for details.</p></div>';
        }
      }, 5000);
    </script>
</body>
</html>`;
          files.push({ path: "/index.html", content: wrapperContent });
          hasIndexHtml = true;
        }
      }
    }

    // Add 404.html for SPA fallback (copy index.html content)
    const indexFile = files.find(f => f.path === "/index.html");
    const has404 = files.some(f => f.path === "/404.html");
    if (indexFile && !has404) {
      files.push({ path: "/404.html", content: indexFile.content });
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files to deploy" },
        { status: 400 }
      );
    }

    console.log(`[Cloudflare] Preparing to deploy ${files.length} files to project "${cfProjectName}"`);

    // 5. Check/create Cloudflare Pages project
    const projectExists = await checkProjectExists(accountId, cfProjectName, apiToken);
    if (!projectExists) {
      await createProject(accountId, cfProjectName, "main", apiToken);
    }

    // 6. Deploy using Direct Upload API
    const { url: deploymentUrl, deploymentId } = await deployToCloudflarePages(
      accountId,
      cfProjectName,
      branch,
      stage,
      files,
      apiToken
    );

    // 7. Update DB
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          cloudflareProjectName: cfProjectName,
          cloudflareUrl: deploymentUrl,
          cloudflareDeployedAt: new Date(),
          cloudflareDeploymentId: deploymentId,
        },
      }
    );

    console.log(`[Cloudflare] Deployment successful: ${deploymentUrl}`);

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
      deploymentId,
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
