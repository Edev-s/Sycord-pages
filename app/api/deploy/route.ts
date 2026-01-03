import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

const GITHUB_API_BASE = "https://api.github.com"
const SYCORD_DEPLOY_API_BASE = "https://micro1.sycord.com"

// Initial delay after creating a repository before attempting file upload
const INITIAL_REPO_DELAY_MS = 1000
const MAX_REPO_INIT_RETRIES = 5

function getEnvGitHubCredentials() {
  const token = process.env.GITHUB_API_TOKEN || process.env.GITHUB_TOKEN
  const owner = process.env.GITHUB_OWNER || process.env.GITHUB_USERNAME
  
  if (token && owner) {
    return { token, owner }
  }
  return null
}

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
    console.error(`[Deploy] GitHub API error (${url}):`, errorMsg)
    const error = new Error(`GitHub API error: ${errorMsg}`) as Error & { status: number }
    error.status = response.status
    throw error
  }

  return { data, status: response.status }
}

async function checkRepoExists(owner: string, repo: string, token: string): Promise<boolean> {
  try {
    await githubRequest(`/repos/${owner}/${repo}`, token)
    return true
  } catch (error: any) {
    if (error.status === 404) return false
    throw error
  }
}

async function createRepo(owner: string, repo: string, token: string): Promise<any> {
  console.log(`[Deploy] Creating repository: ${owner}/${repo}`)
  const { data } = await githubRequest("/user/repos", token, {
    method: "POST",
    body: JSON.stringify({
      name: repo,
      description: "Website deployed from Sycord AI Builder",
      auto_init: true, // Important: Initialize so we have a main branch
      private: false,
    }),
  })
  return data
}

async function waitForRepoInitialization(owner: string, repo: string, token: string): Promise<void> {
  for (let attempt = 0; attempt < MAX_REPO_INIT_RETRIES; attempt++) {
    const delay = INITIAL_REPO_DELAY_MS * Math.pow(1.5, attempt)
    await new Promise(resolve => setTimeout(resolve, delay))
    
    try {
      await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/main`, token)
      console.log(`[Deploy] Repository initialized (attempt ${attempt + 1})`)
      return
    } catch (error: any) {
      if (attempt === MAX_REPO_INIT_RETRIES - 1) {
        console.warn(`[Deploy] Repo init timeout. Proceeding anyway.`)
        return
      }
    }
  }
}

/**
 * Deploy using Git Data API (Tree -> Commit -> Ref)
 * This is "atomic" and efficiently handles "clearing" old state by simply not including old files in the new tree.
 */
async function deployViaGitTree(
    owner: string,
    repo: string,
    files: { path: string, content: string }[],
    token: string
) {
    console.log(`[Deploy] Starting atomic deployment via Git Tree API...`)

    // 1. Get latest commit SHA (base_tree)
    let latestCommitSha = null
    try {
        const { data: refData } = await githubRequest(`/repos/${owner}/${repo}/git/ref/heads/main`, token)
        latestCommitSha = refData.object.sha
    } catch (e) {
        console.log(`[Deploy] No main branch found, assuming empty repo or first commit.`)
    }

    // 2. Create Blobs for files (to be safe with content encoding)
    // We construct the tree array. For text files we can put content directly, but blobs are safer for size.
    // Actually, passing 'content' directly in tree creation is limited.
    // Let's create blobs for all files to be robust.
    const treeItems = []

    for (const file of files) {
        const { data: blobData } = await githubRequest(`/repos/${owner}/${repo}/git/blobs`, token, {
            method: "POST",
            body: JSON.stringify({
                content: file.content,
                encoding: "utf-8"
            })
        })

        treeItems.push({
            path: file.path,
            mode: "100644", // standard file
            type: "blob",
            sha: blobData.sha
        })
    }

    // 3. Create Tree
    // We DO NOT include base_tree if we want to "clear" the repo (delete missing files).
    // If we wanted to keep existing files, we would pass 'base_tree': latestCommitSha.
    // The requirement is "clear all current state", so we omit base_tree.
    // This creates a snapshot containing ONLY our new files.
    const { data: treeData } = await githubRequest(`/repos/${owner}/${repo}/git/trees`, token, {
        method: "POST",
        body: JSON.stringify({
            tree: treeItems
        })
    })

    // 4. Create Commit
    const commitPayload: any = {
        message: "Deploy from Sycord AI Builder (Clean Re-deploy)",
        tree: treeData.sha,
    }
    if (latestCommitSha) {
        commitPayload.parents = [latestCommitSha] // Link to history, but the state is purely the new tree
    }

    const { data: commitData } = await githubRequest(`/repos/${owner}/${repo}/git/commits`, token, {
        method: "POST",
        body: JSON.stringify(commitPayload)
    })

    // 5. Update Reference (Force push effectively)
    await githubRequest(`/repos/${owner}/${repo}/git/refs/heads/main`, token, {
        method: "PATCH", // Update existing ref
        body: JSON.stringify({
            sha: commitData.sha,
            force: true
        })
    })

    console.log(`[Deploy] Atomic deployment complete. New commit: ${commitData.sha}`)
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { projectId } = await request.json()
    if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 })

    const client = await clientPromise
    const db = client.db()

    // 1. Credentials
    const envCredentials = getEnvGitHubCredentials()
    if (!envCredentials) {
      return NextResponse.json({ error: "GitHub credentials not configured." }, { status: 400 })
    }
    const { token, owner } = envCredentials

    // 2. Project Data
    const userDoc = await db.collection("users").findOne({ id: session.user.id })
    const project = userDoc?.projects?.find((p: any) => p._id.toString() === projectId)
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })

    // 3. Repo Name
    let repo = project.githubRepo || project.businessName?.toLowerCase().replace(/[^a-z0-9-]/g, "-") || `project-${projectId}`

    // 4. Ensure Repo Exists
    let repoId: number
    const repoExists = await checkRepoExists(owner, repo, token)
    if (!repoExists) {
      const repoData = await createRepo(owner, repo, token)
      repoId = repoData.id
      await waitForRepoInitialization(owner, repo, token)
    } else {
      const { data } = await githubRequest(`/repos/${owner}/${repo}`, token)
      repoId = data.id
    }

    // 5. Prepare Files
    const pages = project.pages || []
    const files: { path: string, content: string }[] = []

    // Helper to check if a file exists in the pages
    const hasFile = (filename: string) => pages.some((p: any) => p.name === filename || p.name === `/${filename}`)

    if (pages.length > 0) {
        for (const page of pages) {
            let path = page.name
            if (path.startsWith('/')) path = path.substring(1)
            files.push({ path, content: page.content })
        }
    } else if (project.aiGeneratedCode) {
        files.push({ path: "index.html", content: project.aiGeneratedCode })
    }

    // Auto-generate essential config files if missing
    if (!hasFile('package.json')) {
        const packageJson = {
            name: repo,
            version: "1.0.0",
            private: true,
            type: "module",
            scripts: {
                dev: "vite",
                build: "vite build",
                preview: "vite preview"
            },
            devDependencies: {
                typescript: "^5.0.0",
                vite: "^5.0.0"
            }
        }
        files.push({ path: "package.json", content: JSON.stringify(packageJson, null, 2) })
    }

    if (!hasFile('vite.config.ts')) {
        const viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  root: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  server: {
    port: 3000,
  },
})
`
        files.push({ path: "vite.config.ts", content: viteConfig })
    }

    if (files.length === 0) return NextResponse.json({ error: "No files to deploy." }, { status: 400 })

    // 6. Deploy using Git Tree Strategy (Atomic & Cleaner)
    await deployViaGitTree(owner, repo, files, token)

    // 7. Save Meta
    const gitUrl = `https://github.com/${owner}/${repo}`

    // Update User/Project DB
    await db.collection("users").updateOne(
        { id: session.user.id, "projects._id": new ObjectId(projectId) },
        {
            $set: {
                "projects.$.githubOwner": owner,
                "projects.$.githubRepo": repo,
                "projects.$.githubRepoId": repoId,
                "projects.$.githubUrl": gitUrl,
                "projects.$.deployedAt": new Date()
            }
        }
    )

    // Save Git Connection for Sycord Deployer
    await db.collection("users").updateOne({ id: session.user.id }, {
        $set: { [`git_connection.${repoId}`]: {
            username: owner,
            repo_id: repoId.toString(),
            git_url: gitUrl,
            git_token: token,
            repo_name: repo,
            project_id: projectId,
            deployed_at: new Date()
        }}
    })

    // 8. Trigger Sycord Cloudflare Deploy
    let cloudflareUrl = null
    let deployMessage = "Deployed to GitHub"

    try {
        // Trigger
        await fetch(`${SYCORD_DEPLOY_API_BASE}/api/deploy/${repoId}`, { method: "POST" })
        
        // Get Domain (Polling logic simplified for brevity, maybe frontend polls or we wait once)
        // We'll try once after a short delay
        await new Promise(r => setTimeout(r, 2000))
        const domainRes = await fetch(`${SYCORD_DEPLOY_API_BASE}/api/deploy/${repoId}/domain`)
        const domainData = await domainRes.json()
        
        if (domainData.success) {
            cloudflareUrl = domainData.domain
            deployMessage = "Deployed to Cloudflare Pages!"

            await db.collection("users").updateOne(
                { id: session.user.id, "projects._id": new ObjectId(projectId) },
                { $set: { "projects.$.cloudflareUrl": cloudflareUrl } }
            )
        }
    } catch (e) {
        console.error("Sycord Deploy Error:", e)
    }

    return NextResponse.json({
        success: true,
        url: cloudflareUrl || gitUrl,
        githubUrl: gitUrl,
        cloudflareUrl,
        filesCount: files.length,
        message: deployMessage
    })

  } catch (error: any) {
    console.error("[Deploy] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
