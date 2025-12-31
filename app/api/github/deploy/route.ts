import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import FormData from "form-data"

const GITHUB_API_BASE = "https://api.github.com"
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4"

// File extensions that can be deployed to Cloudflare Pages
const DEPLOYABLE_EXTENSIONS = [
  ".html", ".htm", ".css", ".js", ".json", ".txt", ".xml", 
  ".svg", ".ico", ".png", ".jpg", ".jpeg", ".gif", ".webp", 
  ".woff", ".woff2", ".ttf", ".eot"
]

/**
 * Get GitHub credentials from environment variables
 */
function getEnvGitHubCredentials(): { token: string; owner: string } | null {
  const token = process.env.GITHUB_API_TOKEN || process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER || process.env.GITHUB_USERNAME
  
  if (token && owner) {
    return { token, owner }
  }
  return null
}

interface DeployFile {
  path: string
  content: string
}

// Directory index constants for folder/index.html semantic
const DIRECTORY_INDEX_SUFFIX = "/index.html"
const DIRECTORY_INDEX_SUFFIX_LOWER = DIRECTORY_INDEX_SUFFIX.toLowerCase()
const DIRECTORY_INDEX_SUFFIX_LENGTH = DIRECTORY_INDEX_SUFFIX.length

function endsWithDirectoryIndex(pathname: string): boolean {
  return pathname.toLowerCase().endsWith(DIRECTORY_INDEX_SUFFIX_LOWER)
}

function stripDirectoryIndex(pathname: string): string {
  if (!endsWithDirectoryIndex(pathname)) return pathname
  const trimmed = pathname.slice(0, -DIRECTORY_INDEX_SUFFIX_LENGTH)
  return trimmed || "/"
}

const webCrypto = globalThis.crypto
const cryptoSubtle = webCrypto.subtle
const textEncoder = new TextEncoder()

/**
 * Calculate SHA-256 hash of content
 */
async function calculateHash(content: string | Buffer): Promise<string> {
  const data = typeof content === "string" 
    ? textEncoder.encode(content) 
    : new Uint8Array(content)
  
  const hashBuffer = await cryptoSubtle.digest("SHA-256", data)
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Make a GitHub API request
 */
async function githubRequest(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<{ data: any; status: number }> {
  const url = endpoint.startsWith("http") ? endpoint : `${GITHUB_API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  
  if (!response.ok) {
    const errorMsg = data.message || `HTTP ${response.status}`
    const error = new Error(`GitHub API error: ${errorMsg}`) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return { data, status: response.status }
}

/**
 * Get all files from a GitHub repository
 */
async function getRepoFiles(owner: string, repo: string, token: string): Promise<DeployFile[]> {
  console.log(`[GitHub] Fetching files from ${owner}/${repo}`)
  
  // Get the default branch
  const { data: repoData } = await githubRequest(`/repos/${owner}/${repo}`, token)
  const defaultBranch = repoData.default_branch || "main"
  
  // Get the tree recursively
  const { data: treeData } = await githubRequest(
    `/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
    token
  )
  
  const files: DeployFile[] = []
  const blobs = treeData.tree.filter((item: any) => item.type === "blob")
  
  for (const blob of blobs) {
    const ext = blob.path.includes(".") ? "." + blob.path.split(".").pop()?.toLowerCase() : ""
    
    // Skip non-deployable files and hidden files
    if (!DEPLOYABLE_EXTENSIONS.includes(ext) || blob.path.startsWith(".")) {
      continue
    }
    
    try {
      // Fetch file content
      const { data: fileData } = await githubRequest(
        `/repos/${owner}/${repo}/contents/${blob.path}`,
        token
      )
      
      let content: string
      if (fileData.encoding === "base64") {
        content = Buffer.from(fileData.content, "base64").toString("utf-8")
      } else {
        content = fileData.content
      }
      
      // Ensure path starts with /
      const path = blob.path.startsWith("/") ? blob.path : `/${blob.path}`
      
      files.push({ path, content })
      console.log(`[GitHub] Fetched: ${path} (${content.length} bytes)`)
    } catch (error) {
      console.warn(`[GitHub] Failed to fetch ${blob.path}:`, error)
    }
  }
  
  return files
}

/**
 * Make a Cloudflare API request
 */
async function cloudflareRequest(
  endpoint: string,
  apiToken: string,
  options: RequestInit = {}
): Promise<{ data: any; status: number }> {
  const url = `${CLOUDFLARE_API_BASE}${endpoint}`
  
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiToken}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const data = await response.json()
  
  if (!response.ok) {
    const errorMsg = data.errors?.[0]?.message || `HTTP ${response.status}`
    const error = new Error(`Cloudflare API error: ${errorMsg}`) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return { data, status: response.status }
}

/**
 * Check if Cloudflare Pages project exists
 */
async function checkCloudflareProjectExists(
  accountId: string,
  projectName: string,
  apiToken: string
): Promise<boolean> {
  try {
    await cloudflareRequest(
      `/accounts/${accountId}/pages/projects/${projectName}`,
      apiToken
    )
    return true
  } catch (error: any) {
    if (error.status === 404) {
      return false
    }
    throw error
  }
}

/**
 * Create a Cloudflare Pages project
 */
async function createCloudflareProject(
  accountId: string,
  projectName: string,
  apiToken: string
): Promise<void> {
  console.log(`[Cloudflare] Creating project: ${projectName}`)
  
  await cloudflareRequest(
    `/accounts/${accountId}/pages/projects`,
    apiToken,
    {
      method: "POST",
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
      }),
    }
  )
}

/**
 * Deploy files to Cloudflare Pages
 */
async function deployToCloudflarePages(
  accountId: string,
  projectName: string,
  files: DeployFile[],
  apiToken: string
): Promise<{ url: string; deploymentId: string }> {
  console.log(`[Cloudflare] Deploying ${files.length} files...`)
  
  // Calculate hashes for all files
  const fileHashes: Record<string, string> = {}
  const fileContents: Record<string, Buffer> = {}
  let rootIndexHash: string | null = null

  for (const file of files) {
    const contentBuffer = Buffer.from(file.content, "utf-8")
    const hash = await calculateHash(contentBuffer)
    
    fileHashes[file.path] = hash
    fileContents[hash] = contentBuffer
    
    // Track root index.html
    if (file.path === "/index.html" || file.path === "index.html") {
      rootIndexHash = hash
    }
    
    // Add directory index mappings
    if (endsWithDirectoryIndex(file.path)) {
      const basePath = stripDirectoryIndex(file.path)
      fileHashes[basePath] = hash
      if (basePath !== "/" && !basePath.endsWith("/")) {
        fileHashes[`${basePath}/`] = hash
      }
    }
    
    console.log(`[Cloudflare] File: ${file.path} (${contentBuffer.length} bytes, hash: ${hash.substring(0, 12)}...)`)
  }

  // Ensure root path "/" is mapped to index.html
  if (rootIndexHash && !fileHashes["/"]) {
    fileHashes["/"] = rootIndexHash
    console.log(`[Cloudflare] Added root mapping "/" -> index.html`)
  }
  }

  // Build multipart form data
  const formData = new FormData()
  
  formData.append("manifest", JSON.stringify(fileHashes), {
    contentType: "application/json",
  })
  
  for (const [hash, contentBuffer] of Object.entries(fileContents)) {
    formData.append(hash, contentBuffer, {
      contentType: "application/octet-stream",
    })
  }

  // Add _routes.json
  const routesJson = JSON.stringify({
    version: 1,
    include: ["/*"],
    exclude: []
  })
  formData.append("_routes.json", Buffer.from(routesJson, "utf-8"), {
    filename: "_routes.json",
    contentType: "application/json",
  })

  const deployUrl = new URL(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`)
  deployUrl.searchParams.set("branch", "main")
  deployUrl.searchParams.set("stage", "production")
  
  const formDataBuffer = formData.getBuffer()
  const formDataHeaders = formData.getHeaders()
  
  const deployResponse = await fetch(deployUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiToken}`,
      ...formDataHeaders,
      "Content-Length": String(formDataBuffer.length),
    },
    body: formDataBuffer as unknown as BodyInit,
    // The 'duplex' option is required for Node.js fetch with streaming/buffer bodies,
    // but TypeScript's RequestInit type definition doesn't include it yet.
    // See: https://github.com/nodejs/node/issues/46221
    // @ts-expect-error - duplex is a valid option for Node.js fetch but not in TypeScript types
    duplex: "half",
  })

  const deployData = await deployResponse.json()
  
  if (!deployResponse.ok) {
    const errorMsg = deployData.errors?.[0]?.message || `HTTP ${deployResponse.status}`
    throw new Error(`Cloudflare API error: ${errorMsg}`)
  }

  const deploymentId = deployData.result?.id
  const deploymentUrl = deployData.result?.url

  if (!deploymentId) {
    throw new Error("No deployment ID received from Cloudflare")
  }

  console.log(`[Cloudflare] Deployment successful (ID: ${deploymentId})`)

  return {
    url: deploymentUrl || `https://${projectName}.pages.dev`,
    deploymentId,
  }
}

/**
 * POST /api/github/deploy
 * Deploy from GitHub repository to Cloudflare Pages
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, cloudflareProjectName } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid projectId format" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Get project first
    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      userId: session.user.id,
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Get GitHub credentials - first try environment variables
    let ghToken: string
    let owner: string
    let repo: string | null = project.githubRepo
    
    const envCredentials = getEnvGitHubCredentials()
    if (envCredentials) {
      ghToken = envCredentials.token
      owner = envCredentials.owner
      console.log("[GitHub Deploy] Using environment credentials")
    } else {
      const githubToken = await db.collection("github_tokens").findOne({
        projectId: new ObjectId(projectId),
        userId: session.user.email,
      })

      if (!githubToken?.token) {
        return NextResponse.json(
          { error: "GitHub credentials not found. Please configure GITHUB_API_TOKEN and GITHUB_OWNER environment variables." },
          { status: 400 }
        )
      }
      ghToken = githubToken.token
      owner = githubToken.owner || githubToken.username
      repo = githubToken.repo || project.githubRepo
    }

    if (!repo) {
      return NextResponse.json(
        { error: "GitHub repository not configured. Please save to GitHub first." },
        { status: 400 }
      )
    }

    // Get Cloudflare credentials
    let cfApiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY
    let cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID

    if (!cfApiToken || !cfAccountId) {
      const cfTokenDoc = await db.collection("cloudflare_tokens").findOne({
        projectId: new ObjectId(projectId),
        userId: session.user.email,
      })

      if (cfTokenDoc) {
        cfApiToken = cfTokenDoc.apiToken
        cfAccountId = cfTokenDoc.accountId
      }
    }

    if (!cfApiToken || !cfAccountId) {
      return NextResponse.json(
        { error: "Cloudflare credentials not found. Please configure Cloudflare first." },
        { status: 400 }
      )
    }

    console.log(`[GitHub Deploy] Starting deployment from ${owner}/${repo}`)

    // Step 1: Fetch files from GitHub
    const files = await getRepoFiles(owner, repo, ghToken)

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No deployable files found in GitHub repository" },
        { status: 400 }
      )
    }

    // Step 2: Determine Cloudflare project name
    let cfProjectName = cloudflareProjectName || project.cloudflareProjectName
    if (!cfProjectName) {
      cfProjectName = repo
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 58)
    }

    // Step 3: Check/create Cloudflare project
    const projectExists = await checkCloudflareProjectExists(cfAccountId, cfProjectName, cfApiToken)
    if (!projectExists) {
      await createCloudflareProject(cfAccountId, cfProjectName, cfApiToken)
    }

    // Step 4: Deploy to Cloudflare
    const { url: deploymentUrl, deploymentId } = await deployToCloudflarePages(
      cfAccountId,
      cfProjectName,
      files,
      cfApiToken
    )

    // Step 5: Update project record
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          cloudflareProjectName: cfProjectName,
          cloudflareUrl: deploymentUrl,
          cloudflareDeployedAt: new Date(),
          cloudflareDeploymentId: deploymentId,
          githubDeployed: true,
          githubDeployedAt: new Date(),
        },
      }
    )

    console.log(`[GitHub Deploy] Deployment successful: ${deploymentUrl}`)

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
      deploymentId,
      projectName: cfProjectName,
      source: {
        owner,
        repo,
        filesCount: files.length,
      },
    })
  } catch (error: any) {
    console.error("[GitHub Deploy] Error:", error)
    return NextResponse.json(
      { error: error.message || "Deployment failed" },
      { status: 500 }
    )
  }
}
