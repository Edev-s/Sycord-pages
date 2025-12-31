import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import FormData from "form-data";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const BETA_WAITING_BRANCH = "beta-waiting";
const cryptoSubtle = globalThis.crypto?.subtle;
const textEncoder = new TextEncoder();

if (!cryptoSubtle) {
  throw new Error("Web Crypto API is not available in this environment");
}

// Directory index constants for folder/index.html semantic
const DIRECTORY_INDEX_SUFFIX = "/index.html";
const DIRECTORY_INDEX_SUFFIX_LOWER = DIRECTORY_INDEX_SUFFIX.toLowerCase();
const DIRECTORY_INDEX_SUFFIX_LENGTH = DIRECTORY_INDEX_SUFFIX.length;

// Check if a path ends with /index.html (case-insensitive)
function endsWithDirectoryIndex(pathname: string): boolean {
  return pathname.toLowerCase().endsWith(DIRECTORY_INDEX_SUFFIX_LOWER);
}

// Strip /index.html from the path to get the directory path
function stripDirectoryIndex(pathname: string): string {
  if (!endsWithDirectoryIndex(pathname)) return pathname;
  const trimmed = pathname.slice(0, -DIRECTORY_INDEX_SUFFIX_LENGTH);
  return trimmed || "/";
}

interface DeployFile {
  path: string;
  content: string;
}

interface DeployResult {
  url: string;
  deploymentId: string;
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

// Calculate SHA-256 hash of content (supports string or binary data)
type HashInput = string | ArrayBuffer | ArrayBufferView;

async function calculateHash(content: HashInput): Promise<string> {
  let data: Uint8Array;

  if (typeof content === "string") {
    data = textEncoder.encode(content);
  } else if (content instanceof ArrayBuffer) {
    data = new Uint8Array(content);
  } else if (ArrayBuffer.isView(content)) {
    data = new Uint8Array(content.buffer, content.byteOffset, content.byteLength);
  } else {
    throw new Error("Unsupported content type for hashing");
  }

  const hashBuffer = await cryptoSubtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
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

  const preparedFiles = await Promise.all(
    files.map(async (file) => {
      const contentBytes = textEncoder.encode(file.content);
      const hash = await calculateHash(contentBytes);
      return { file, contentBytes, hash };
    })
  );

  for (const { file, contentBytes, hash } of preparedFiles) {
    const contentBuffer = Buffer.from(contentBytes.buffer, contentBytes.byteOffset, contentBytes.byteLength);
    fileHashes[file.path] = hash;
    fileContents[hash] = contentBuffer;
    
    // Add directory index mappings for folder/index.html semantic
    // This allows /folder/index.html to be accessed as /folder and /folder/
    if (endsWithDirectoryIndex(file.path)) {
      const basePath = stripDirectoryIndex(file.path);
      fileHashes[basePath] = hash;
      // Add trailing slash variant (e.g., /folder/) for all directories except root
      // Root path (/) already handles both / and /index.html
      const addedTrailingSlash = basePath !== "/" && !basePath.endsWith("/");
      if (addedTrailingSlash) {
        fileHashes[`${basePath}/`] = hash;
      }
      const mappedPaths = addedTrailingSlash ? `${basePath} and ${basePath}/` : basePath;
      console.log(`[Cloudflare] File: ${file.path} (${contentBuffer.length} bytes, hash: ${hash.substring(0, 12)}...) -> also mapped to ${mappedPaths}`);
    } else {
      console.log(`[Cloudflare] File: ${file.path} (${contentBuffer.length} bytes, hash: ${hash.substring(0, 12)}...)`);
    }
  }

  console.log(`[Cloudflare] Total manifest entries: ${Object.keys(fileHashes).length} (including directory index mappings)`);

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

  // Add _routes.json to serve all routes as static assets
  // This prevents Cloudflare from treating the deployment as Functions unintentionally
  // which can cause 500 errors on the deployed site
  // For a static-only deployment, we include all routes as static assets
  const routesJson = JSON.stringify({
    version: 1,
    include: ["/*"],
    exclude: []
  });
  formData.append("_routes.json", Buffer.from(routesJson, "utf-8"), {
    filename: "_routes.json",
    contentType: "application/json",
  });
  console.log(`[Cloudflare] Added _routes.json to serve all routes as static assets`);

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

    // 4. Fetch files from MongoDB 'pages' collection
    // This replaces the previous demo zip fetch to deploy actual user content
    let files: DeployFile[] = [];

    const pages = await db.collection("pages").find({
      projectId: new ObjectId(projectId)
    }).toArray();

    if (pages.length > 0) {
      console.log(`[Cloudflare] Found ${pages.length} pages in database`);
      files = pages.map(page => {
        let path = page.name;
        // Ensure path starts with /
        if (!path.startsWith('/')) {
          path = '/' + path;
        }

        // Force .html extension for TypeScript files so they are served as pages
        // The content is expected to be HTML-compatible (or wrapped)
        if (path.endsWith('.ts')) {
            path = path.slice(0, -3) + '.html';
        } else if (path.endsWith('.tsx')) {
            path = path.slice(0, -4) + '.html';
        } else if (path.endsWith('.js')) {
            path = path.slice(0, -3) + '.html';
        } else if (path.endsWith('.jsx')) {
            path = path.slice(0, -4) + '.html';
        }

        // Ensure .html extension for pages (unless it's a known file type or already has it)
        // Cloudflare Pages serves /about.html as /about
        // The pages collection typically stores 'index', 'about' (no extension)
        const hasExtension = path.includes('.') && path.lastIndexOf('.') > path.lastIndexOf('/');
        if (!hasExtension && !path.endsWith('/')) {
             path = path + '.html';
        }
        return {
          path: path,
          content: page.content
        };
      });
    } else if (project.aiGeneratedCode) {
      // Fallback to project.aiGeneratedCode if no pages found
      console.log(`[Cloudflare] No pages found in collection, using legacy aiGeneratedCode as index.html`);
      files.push({
        path: "/index.html",
        content: project.aiGeneratedCode
      });
    }

    if (files.length === 0) {
       return NextResponse.json(
        { error: "No files to deploy. Please generate or create pages first." },
        { status: 400 }
      );
    }

    // Add 404.html for SPA fallback (copy index.html content)
    const indexFile = files.find(f => f.path === "/index.html");
    const has404 = files.some(f => f.path === "/404.html");
    if (indexFile && !has404) {
      console.log(`[Cloudflare] Creating 404.html from index.html for SPA fallback`);
      files.push({ path: "/404.html", content: indexFile.content });
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
