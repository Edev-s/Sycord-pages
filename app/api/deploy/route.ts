import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const GITHUB_API_BASE = "https://api.github.com"
const SYCORD_DEPLOY_API_BASE = "https://micro1.sycord.com"

// Initial delay after creating a repository before attempting file upload
const INITIAL_REPO_DELAY_MS = 1000
// Maximum number of retries for repository initialization
const MAX_REPO_INIT_RETRIES = 3

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

interface GitHubFile {
  path: string
  content: string
}

/**
 * Make a GitHub API request with proper headers
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
      "Content-Type": "application/json",
      ...options.headers,
    },
  })

  const data = await response.json().catch(() => ({}))
  
  if (!response.ok) {
    const errorMsg = data.message || `HTTP ${response.status}`
    console.error(`[Deploy] GitHub API error:`, data)
    const error = new Error(`GitHub API error: ${errorMsg}`) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return { data, status: response.status }
}

/**
 * Check if a repository exists
 */
async function checkRepoExists(owner: string, repo: string, token: string): Promise<boolean> {
  try {
    await githubRequest(`/repos/${owner}/${repo}`, token)
    return true
  } catch (error: any) {
    if (error.status === 404) {
      return false
    }
    throw error
  }
}

/**
 * Create a new repository
 */
async function createRepo(owner: string, repo: string, token: string, isOrg: boolean = false): Promise<any> {
  console.log(`[Deploy] Creating repository: ${owner}/${repo}`)
  
  const endpoint = isOrg ? `/orgs/${owner}/repos` : "/user/repos"
  
  const { data } = await githubRequest(endpoint, token, {
    method: "POST",
    body: JSON.stringify({
      name: repo,
      description: "Website deployed from Sycord Pages",
      auto_init: true,
      private: false,
    }),
  })
  
  console.log(`[Deploy] Repository created: ${owner}/${repo}`)
  return data
}

/**
 * Wait for repository to be fully initialized with retry mechanism
 */
async function waitForRepoInitialization(owner: string, repo: string, token: string): Promise<void> {
  for (let attempt = 0; attempt < MAX_REPO_INIT_RETRIES; attempt++) {
    const delay = INITIAL_REPO_DELAY_MS * Math.pow(2, attempt) // Exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      // Try to get the default branch ref to verify repo is initialized
      await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/main`, token)
      console.log(`[Deploy] Repository initialized after ${attempt + 1} attempt(s)`)
      return
    } catch (error: any) {
      if (error.status === 404 && attempt < MAX_REPO_INIT_RETRIES - 1) {
        console.log(`[Deploy] Repository not ready, retrying (attempt ${attempt + 1}/${MAX_REPO_INIT_RETRIES})...`)
        continue
      }
      // If this is the last attempt or not a 404 error, throw
      if (attempt === MAX_REPO_INIT_RETRIES - 1) {
        console.log(`[Deploy] Repository initialization timeout, proceeding anyway...`)
        return // Proceed anyway, the file upload will fail if repo isn't ready
      }
      throw error
    }
  }
}

/**
 * Get the SHA of a file if it exists (needed for updates)
 */
async function getFileSha(owner: string, repo: string, path: string, token: string): Promise<string | null> {
  try {
    const { data } = await githubRequest(`/repos/${owner}/${repo}/contents/${path}`, token)
    return data.sha || null
  } catch (error: any) {
    if (error.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Create or update a file in the repository
 */
async function createOrUpdateFile(
  owner: string,
  repo: string,
  path: string,
  content: string,
  token: string,
  message: string = "Update from Sycord Pages"
): Promise<void> {
  const sha = await getFileSha(owner, repo, path, token)
  
  const body: any = {
    message,
    content: Buffer.from(content).toString("base64"),
  }
  
  if (sha) {
    body.sha = sha
  }

  await githubRequest(`/repos/${owner}/${repo}/contents/${path}`, token, {
    method: "PUT",
    body: JSON.stringify(body),
  })
}

/**
 * POST /api/deploy
 * Deploy project files to GitHub and save connection info to user database
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, repoName } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Missing projectId" }, { status: 400 })
    }

    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid projectId format" }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Get GitHub credentials from environment variables
    const envCredentials = getEnvGitHubCredentials()
    if (!envCredentials) {
      return NextResponse.json(
        { error: "GitHub credentials not configured. Please set GITHUB_API_TOKEN and GITHUB_OWNER environment variables." },
        { status: 400 }
      )
    }

    const { token, owner } = envCredentials
    console.log("[Deploy] Using environment credentials")

    // Get project from USER document
    const userDoc = await db.collection("users").findOne({ id: session.user.id });
    if (!userDoc || !userDoc.projects) {
        return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    const project = userDoc.projects.find((p: any) => p._id.toString() === projectId);

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Determine repository name
    let repo = repoName || (project.githubRepo as string | undefined)
    if (!repo) {
      const baseName = project.name || project.businessName || `sycord-project-${projectId}`
      repo = baseName
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/--+/g, "-")
        .replace(/^-|-$/g, "")
        .substring(0, 100)
    }

    console.log(`[Deploy] Deploying to repository: ${owner}/${repo}`)

    // Check if repo exists, create if not
    let repoId: number
    let repoData: any

    const repoExists = await checkRepoExists(owner, repo, token)
    if (!repoExists) {
      repoData = await createRepo(owner, repo, token)
      repoId = repoData.id
      // Wait for GitHub to fully initialize the repository with retry mechanism
      await waitForRepoInitialization(owner, repo, token)
    } else {
      // Fetch existing repo details
      const { data } = await githubRequest(`/repos/${owner}/${repo}`, token)
      repoData = data
      repoId = data.id
    }

    // Fetch pages from project object
    const pages = project.pages || [];

    const files: GitHubFile[] = []
    let hasIndexHtml = false

    if (pages.length > 0) {
      console.log(`[Deploy] Found ${pages.length} pages in project`)
      
      for (const page of pages) {
        let path = page.name
        // Ensure path doesn't start with /
        if (path.startsWith('/')) {
          path = path.substring(1)
        }

        // Force .html extension for TypeScript/JavaScript files
        if (path.endsWith('.ts') || path.endsWith('.tsx')) {
          path = path.replace(/\.(ts|tsx)$/, '.html')
        } else if (path.endsWith('.js') || path.endsWith('.jsx')) {
          path = path.replace(/\.(js|jsx)$/, '.html')
        }

        // Ensure .html extension for pages
        const hasExtension = path.includes('.') && path.lastIndexOf('.') > path.lastIndexOf('/')
        if (!hasExtension && !path.endsWith('/')) {
          path = path + '.html'
        }

        // Track if we have an index.html
        if (path === 'index.html' || path.toLowerCase() === 'index.html') {
          hasIndexHtml = true
        }

        files.push({ path, content: page.content })
        console.log(`[Deploy] Prepared file: ${page.name} -> ${path}`)
      }
    } else if (project.aiGeneratedCode) {
      // Fallback to project.aiGeneratedCode
      console.log(`[Deploy] Using legacy aiGeneratedCode as index.html`)
      files.push({ path: "index.html", content: project.aiGeneratedCode })
      hasIndexHtml = true
    }

    // If we have files but no index.html, create one from the first page
    if (files.length > 0 && !hasIndexHtml) {
      console.log(`[Deploy] No index.html found, creating from first page`)
      files.push({ path: "index.html", content: files[0].content })
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: "No files to deploy. Please generate or create pages first." },
        { status: 400 }
      )
    }

    // Upload files to GitHub
    console.log(`[Deploy] Uploading ${files.length} files...`)
    
    for (const file of files) {
      console.log(`[Deploy] Uploading: ${file.path}`)
      await createOrUpdateFile(
        owner,
        repo,
        file.path,
        file.content,
        token,
        `Deploy ${file.path} from Sycord Pages`
      )
    }

    const gitUrl = `https://github.com/${owner}/${repo}`

    // Update project with GitHub info (inside users collection)
    await db.collection("users").updateOne(
        {
            id: session.user.id,
            "projects._id": new ObjectId(projectId)
        },
        {
            $set: {
                "projects.$.githubOwner": owner,
                "projects.$.githubRepo": repo,
                "projects.$.githubRepoId": repoId,
                "projects.$.githubUrl": gitUrl,
                "projects.$.githubSavedAt": new Date(),
                "projects.$.deployedAt": new Date()
            }
        }
    )

    // Save to user's git_connection in the users collection
    // Note: git_token is required by the Sycord deployment API
    const gitConnectionData = {
      username: owner,
      repo_id: repoId.toString(),
      git_url: gitUrl,
      git_token: token,
      repo_name: repo,
      project_id: projectId,
      deployed_at: new Date(),
    }

    await db.collection("users").updateOne(
      { id: session.user.id },
      {
        $set: {
          [`git_connection.${repoId}`]: gitConnectionData
        }
      }
    )

    console.log(`[Deploy] Successfully deployed ${files.length} files to ${owner}/${repo} (ID: ${repoId})`)
    console.log(`[Deploy] Saved git_connection for user ${session.user.id}`)

    // Call external Sycord API to deploy to Cloudflare Pages
    let cloudflareUrl: string | null = null
    let cloudflareProjectName: string | null = null
    let deployMessage = `Successfully deployed ${files.length} file(s) to GitHub`
    
    // Timeout for Sycord API call (60 seconds to allow for deployment)
    const SYCORD_API_TIMEOUT_MS = 60000
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), SYCORD_API_TIMEOUT_MS)
    
    try {
      console.log(`[Deploy] Calling Sycord deployment API for repo_id: ${repoId}`)
      
      const sycordResponse = await fetch(`${SYCORD_DEPLOY_API_BASE}/api/deploy/${repoId}`, {
        method: "POST",
        headers: {
          "Accept": "application/json",
        },
        signal: controller.signal,
      })

      const sycordData = await sycordResponse.json()

      if (sycordResponse.ok && sycordData.success) {
        cloudflareUrl = sycordData.url
        cloudflareProjectName = sycordData.project_name
        deployMessage = sycordData.message || `Successfully deployed to Cloudflare Pages!`
        console.log(`[Deploy] Sycord deployment successful: ${cloudflareUrl}`)

        // Update project with Cloudflare deployment info
        await db.collection("users").updateOne(
          {
            id: session.user.id,
            "projects._id": new ObjectId(projectId)
          },
          {
            $set: {
              "projects.$.cloudflareUrl": cloudflareUrl,
              "projects.$.cloudflareProjectName": cloudflareProjectName,
              "projects.$.cloudflareDeployedAt": new Date()
            }
          }
        )
      } else {
        console.error(`[Deploy] Sycord deployment failed:`, sycordData)
        // Don't fail the entire request - GitHub deploy succeeded
        deployMessage = `Deployed to GitHub. Cloudflare deployment failed: ${sycordData.message || 'Unknown error'}`
      }
    } catch (sycordError: any) {
      console.error(`[Deploy] Sycord API error:`, sycordError)
      // Don't fail the entire request - GitHub deploy succeeded
      if (sycordError.name === 'AbortError') {
        deployMessage = `Deployed to GitHub. Cloudflare deployment timed out.`
      } else {
        deployMessage = `Deployed to GitHub. Cloudflare deployment unavailable.`
      }
    } finally {
      clearTimeout(timeoutId)
    }

    return NextResponse.json({
      success: true,
      owner,
      repo,
      repoId,
      url: cloudflareUrl || gitUrl,
      githubUrl: gitUrl,
      cloudflareUrl,
      cloudflareProjectName,
      filesCount: files.length,
      message: deployMessage
    })
  } catch (error: any) {
    console.error("[Deploy] Error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to deploy to GitHub" },
      { status: 500 }
    )
  }
}
