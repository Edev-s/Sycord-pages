import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import FormData from "form-data";
import { createInflateRaw } from "zlib";
import { readFile } from "fs/promises";
import path from "path";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const BETA_WAITING_BRANCH = "beta-waiting";
// Local demo zip file path (replaces remote URL to fix white page issue)
const LOCAL_DEMO_ZIP_PATH = path.join(process.cwd(), "direct-upload-demo 2.zip");

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

// Helper function to find the end of compressed data by scanning for next header
// Used when the zip uses data descriptors (bit 3 of general purpose flag)
function findCompressedDataEnd(buffer: Buffer, dataStart: number): number {
  let scanOffset = dataStart;
  while (scanOffset < buffer.length - 4) {
    const sig = buffer.readUInt32LE(scanOffset);
    // Data descriptor signature (optional) or next local file header or central directory
    if (sig === 0x08074b50 || sig === 0x04034b50 || sig === 0x02014b50) {
      return scanOffset;
    }
    scanOffset++;
  }
  return buffer.length;
}

// Helper to parse ZIP file entries (minimal implementation for static files)
// Supports uncompressed (STORED) and DEFLATE compressed files
// Also supports data descriptors (bit 3 of general purpose flag)
async function parseZipEntries(zipBuffer: Buffer): Promise<DeployFile[]> {
  const files: DeployFile[] = [];
  let offset = 0;
  
  while (offset < zipBuffer.length - 4) {
    // Look for local file header signature (0x04034b50)
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break; // End of local file headers
    }
    
    const generalFlag = zipBuffer.readUInt16LE(offset + 6);
    const hasDataDescriptor = (generalFlag & 0x08) !== 0; // Bit 3 set
    const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
    let compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);
    
    const fileNameStart = offset + 30;
    const fileName = zipBuffer.toString("utf-8", fileNameStart, fileNameStart + fileNameLength);
    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
    
    // If using data descriptor and compressedSize is 0, we need to scan for the end
    let dataEnd: number;
    if (hasDataDescriptor && compressedSize === 0) {
      dataEnd = findCompressedDataEnd(zipBuffer, dataStart);
      compressedSize = dataEnd - dataStart;
    } else {
      dataEnd = dataStart + compressedSize;
    }
    
    // Skip directories (they end with /)
    if (!fileName.endsWith("/") && compressedSize > 0) {
      const compressedData = zipBuffer.subarray(dataStart, dataEnd);
      let content: string;
      
      if (compressionMethod === 0) {
        // STORED (no compression)
        content = compressedData.toString("utf-8");
      } else if (compressionMethod === 8) {
        // DEFLATE compression
        try {
          const inflated = await new Promise<Buffer>((resolve, reject) => {
            const inflater = createInflateRaw();
            const chunks: Buffer[] = [];
            inflater.on("data", (chunk) => chunks.push(chunk));
            inflater.on("end", () => resolve(Buffer.concat(chunks)));
            inflater.on("error", reject);
            inflater.end(compressedData);
          });
          content = inflated.toString("utf-8");
        } catch (error: any) {
          // If decompression fails, skip this file
          console.warn(`[Cloudflare] Decompression failed for file ${fileName}:`, error?.message);
          offset = dataEnd;
          if (hasDataDescriptor) offset += 12;
          continue;
        }
      } else {
        // Unsupported compression method, skip
        offset = dataEnd;
        if (hasDataDescriptor) offset += 12;
        continue;
      }
      
      // Normalize path to start with /
      const normalizedPath = fileName.startsWith("/") ? fileName : `/${fileName}`;
      files.push({ path: normalizedPath, content });
    }
    
    // Move to next entry
    offset = dataEnd;
    if (hasDataDescriptor) {
      // Check for data descriptor signature (optional)
      if (offset < zipBuffer.length - 4 && zipBuffer.readUInt32LE(offset) === 0x08074b50) {
        offset += 16; // signature + crc + compressedSize + uncompressedSize
      } else if (offset < zipBuffer.length - 12) {
        offset += 12; // crc + compressedSize + uncompressedSize (no signature)
      }
    }
  }
  
  return files;
}

// Read and extract demo files from the local zip file
// This replaces the remote URL fetch to fix the white page issue after direct upload
async function fetchDemoFiles(): Promise<DeployFile[]> {
  console.log(`[Cloudflare] Reading demo files from local zip: ${LOCAL_DEMO_ZIP_PATH}...`);
  
  let zipBuffer: Buffer;
  try {
    zipBuffer = await readFile(LOCAL_DEMO_ZIP_PATH);
  } catch (error: any) {
    const errorMsg = error?.code === "ENOENT"
      ? `Local demo zip file not found: ${LOCAL_DEMO_ZIP_PATH}`
      : `Failed to read local demo zip file: ${error?.message}`;
    throw new Error(errorMsg);
  }
  
  console.log(`[Cloudflare] Read local demo zip (${zipBuffer.length} bytes)`);
  
  const files = await parseZipEntries(zipBuffer);
  console.log(`[Cloudflare] Extracted ${files.length} files from demo zip`);
  
  for (const file of files) {
    console.log(`[Cloudflare]   - ${file.path} (${file.content.length} bytes)`);
  }
  
  return files;
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

    // 4. Fetch demo files from the local direct-upload-demo 2.zip
    // This replaces the previous remote URL fetch logic to fix the white page issue
    let files: DeployFile[];
    try {
      files = await fetchDemoFiles();
    } catch (fetchError: any) {
      console.error("[Cloudflare] Failed to fetch demo files:", fetchError);
      return NextResponse.json(
        { error: `Failed to fetch demo files: ${fetchError.message}` },
        { status: 500 }
      );
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
