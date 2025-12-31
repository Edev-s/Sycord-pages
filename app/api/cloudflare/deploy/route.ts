import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { ensureRepo, pushFiles } from "@/lib/github";

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const BETA_WAITING_BRANCH = "beta-waiting";

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

// Get Cloudflare Pages project details
async function getProjectDetails(
  accountId: string,
  projectName: string,
  apiToken: string
): Promise<any | null> {
  try {
    const { data } = await cloudflareRequest(
      `/accounts/${accountId}/pages/projects/${projectName}`,
      apiToken
    );
    return data.result;
  } catch (error: any) {
    if (error.status === 404 || error.message.includes("not_found")) {
      return null;
    }
    throw error;
  }
}

// Create a new Cloudflare Pages project with GitHub source
async function createGithubProject(
  accountId: string,
  projectName: string,
  repoOwner: string,
  repoName: string,
  branch: string,
  apiToken: string
): Promise<void> {
  console.log(`[Cloudflare] Creating project "${projectName}" linked to GitHub ${repoOwner}/${repoName}...`);
  await cloudflareRequest(
    `/accounts/${accountId}/pages/projects`,
    apiToken,
    {
      method: "POST",
      body: JSON.stringify({
        name: projectName,
        production_branch: branch,
        source: {
          type: "github",
          config: {
            owner: repoOwner,
            repo_name: repoName,
            production_branch: branch,
            pr_comments_enabled: true,
            deployments_enabled: true
          }
        },
        build_config: {
          build_command: null,
          destination_dir: "",
          root_dir: "/"
        }
      }),
    }
  );
  console.log(`[Cloudflare] Project "${projectName}" created successfully`);
}

// Trigger a deployment
async function triggerDeployment(
  accountId: string,
  projectName: string,
  branch: string,
  apiToken: string
): Promise<{ url: string; deploymentId: string }> {
  console.log(`[Cloudflare] Triggering deployment for "${projectName}" on branch "${branch}"...`);
  const { data } = await cloudflareRequest(
    `/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    apiToken,
    {
      method: "POST",
      body: JSON.stringify({
        branch: branch
      })
    }
  );
  
  return {
    url: data.result.url,
    deploymentId: data.result.id
  };
}

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

    // GitHub Credentials
    const githubToken = process.env.GITHUB_API_KEY;
    const githubOwner = process.env.GITHUB_OWNER;

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
        { error: "No Cloudflare credentials found." },
        { status: 400 }
      );
    }

    if (!githubToken || !githubOwner) {
       return NextResponse.json(
        { error: "No GitHub credentials found (GITHUB_API_KEY, GITHUB_OWNER)." },
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

    // 3. Determine Cloudflare Pages Project Name and Repo Name
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

    // Repo name: ensure uniqueness and validity
    const repoName = `ltpd-${projectId}`;

    const branch = isWaitingBuild ? BETA_WAITING_BRANCH : "main";

    // 4. Fetch files from MongoDB 'pages' collection
    let files: { path: string; content: string }[] = [];

    const pages = await db.collection("pages").find({
      projectId: new ObjectId(projectId)
    }).toArray();

    if (pages.length > 0) {
      console.log(`[Deployment] Found ${pages.length} pages in database`);
      files = pages.map(page => {
        let path = page.name;
        if (!path.startsWith('/')) path = '/' + path;

        if (path.endsWith('.ts')) path = path.slice(0, -3) + '.html';
        else if (path.endsWith('.tsx')) path = path.slice(0, -4) + '.html';
        else if (path.endsWith('.js')) path = path.slice(0, -3) + '.html';
        else if (path.endsWith('.jsx')) path = path.slice(0, -4) + '.html';

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
      console.log(`[Deployment] No pages found in collection, using legacy aiGeneratedCode as index.html`);
      files.push({
        path: "/index.html",
        content: project.aiGeneratedCode
      });
    }

    if (files.length === 0) {
       return NextResponse.json(
        { error: "No files to deploy." },
        { status: 400 }
      );
    }

    // Add 404.html for SPA fallback
    const indexFile = files.find(f => f.path === "/index.html");
    const has404 = files.some(f => f.path === "/404.html");
    if (indexFile && !has404) {
      files.push({ path: "/404.html", content: indexFile.content });
    }

    // Prepare files for GitHub (remove leading slashes if any)
    const githubFiles = files.map(f => ({
        path: f.path.startsWith('/') ? f.path.slice(1) : f.path,
        content: f.content
    }));

    // 5. GitHub Operations
    console.log(`[Deployment] Starting GitHub operations for ${githubOwner}/${repoName}`);

    // Ensure Repo Exists
    await ensureRepo(githubToken, githubOwner, repoName, `Website for ${project.name}`);

    // Push Files
    await pushFiles(githubToken, githubOwner, repoName, branch, githubFiles, `Deploy ${new Date().toISOString()}`);

    // 6. Cloudflare Operations
    console.log(`[Deployment] Starting Cloudflare operations for ${cfProjectName}`);

    const existingProject = await getProjectDetails(accountId, cfProjectName, apiToken);

    if (!existingProject) {
        // Create new project connected to GitHub
        await createGithubProject(accountId, cfProjectName, githubOwner, repoName, branch, apiToken);
    } else {
        // Project exists.
        // Ideally we should check if it's connected to GitHub.
        // For now, we assume if it exists we just trigger deployment.
        // If the user wants to migrate a Direct Upload project to Git, they might need to delete it first manually
        // or we could try to update it, but updating source type is tricky via API.
        // Let's assume it's fine or log a warning if source.type is not github.
        if (existingProject.source?.type !== "github") {
             console.warn(`[Deployment] Warning: Project ${cfProjectName} source type is ${existingProject.source?.type}, expected 'github'. Deployment might fail or not be git-integrated.`);
             // We could attempt to update the project here, but let's just try to trigger deployment.
        }
    }

    // 7. Trigger Deployment
    // Even with Git integration, we can trigger a deployment manually to get the immediate status
    // although pushing to GitHub usually triggers one automatically.
    // Triggering it manually ensures we get a deployment ID and URL in the response.
    const { url: deploymentUrl, deploymentId } = await triggerDeployment(accountId, cfProjectName, branch, apiToken);

    // 8. Update DB
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          cloudflareProjectName: cfProjectName,
          cloudflareUrl: deploymentUrl,
          cloudflareDeployedAt: new Date(),
          cloudflareDeploymentId: deploymentId,
          githubRepo: `${githubOwner}/${repoName}`
        },
      }
    );

    console.log(`[Deployment] Success: ${deploymentUrl}`);

    return NextResponse.json({
      success: true,
      url: deploymentUrl,
      deploymentId,
      projectName: cfProjectName,
      githubRepo: `${githubOwner}/${repoName}`
    });

  } catch (error: any) {
    console.error("[Deployment] Error:", error);
    return NextResponse.json(
      { error: error.message || "Deployment failed" },
      { status: 500 }
    );
  }
}
