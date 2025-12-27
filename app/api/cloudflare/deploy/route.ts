import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { spawn } from "child_process";
import fs from "fs/promises";
import path from "path";
import os from "os";

// Only for debugging if needed, though stdout capture is primary.
function getCloudflareCredentials(session: any, db: any, projectId: string) {
    // Logic extracted to helper
    return {
        apiToken: process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY,
        accountId: process.env.CLOUDFLARE_ACCOUNT_ID
    }
}

async function runWranglerDeploy(deployDir: string, projectName: string, branch: string, accountId: string, apiToken: string): Promise<string> {
    return new Promise((resolve, reject) => {
        // Use local wrangler binary directly to avoid npx cache/home dir issues
        const wranglerPath = path.resolve(process.cwd(), "node_modules", ".bin", "wrangler");

        // npx wrangler pages deploy <dir> --project-name <name> --branch <branch>
        const wranglerArgs = [
            "pages",
            "deploy",
            deployDir,
            "--project-name",
            projectName,
            "--branch",
            branch,
            "--commit-dirty=true"
        ];

        console.log(`[Cloudflare Wrangler] Executing: ${wranglerPath} ${wranglerArgs.join(" ")}`);

        // Set HOME to a temporary directory to avoid EACCES/ENOENT on restricted home dirs
        // Also set NPM_CONFIG_CACHE to ensure any internal npm usage by wrangler has a writeable cache
        const tempHome = path.join(os.tmpdir(), "wrangler-home");

        // We ensure the tempHome exists, though env vars usually just need to point to it
        // fs.mkdir(tempHome, { recursive: true }).catch(() => {});

        const child = spawn(wranglerPath, wranglerArgs, {
            env: {
                ...process.env,
                CLOUDFLARE_ACCOUNT_ID: accountId,
                CLOUDFLARE_API_TOKEN: apiToken,
                // Ensure no interactive prompts
                CI: "true",
                // Suppress update checks
                WRANGLER_SEND_METRICS: "false",
                // Redirect HOME and npm cache to tmp
                HOME: tempHome,
                NPM_CONFIG_CACHE: path.join(tempHome, ".npm"),
                XDG_CONFIG_HOME: path.join(tempHome, ".config"),
                XDG_CACHE_HOME: path.join(tempHome, ".cache")
            }
        });

        let stdout = "";
        let stderr = "";

        child.stdout.on("data", (data) => {
            const output = data.toString();
            stdout += output;
            // console.log(`[Wrangler stdout] ${output}`);
        });

        child.stderr.on("data", (data) => {
            const output = data.toString();
            stderr += output;
            // console.error(`[Wrangler stderr] ${output}`);
        });

        child.on("close", (code) => {
            if (code === 0) {
                // Parse stdout for the URL
                // Example success output:
                // ...
                // 🌍  Site is ready at https://project-name.pages.dev
                // ...
                // or just extracting the domain.

                console.log(`[Cloudflare Wrangler] Success! Output length: ${stdout.length}`);

                // Try to find the URL in the output
                // Matches "https://<something>.pages.dev"
                // Or specific "Visit your site at https://..."
                const urlMatch = stdout.match(/(https:\/\/[a-zA-Z0-9-]+\.pages\.dev)/);
                if (urlMatch) {
                    resolve(urlMatch[1]);
                } else {
                    // Fallback: construct it manually if successful
                    resolve(`https://${projectName}.pages.dev`);
                }
            } else {
                console.error(`[Cloudflare Wrangler] Failed with code ${code}`);
                console.error(`[Cloudflare Wrangler] Stderr: ${stderr}`);
                console.error(`[Cloudflare Wrangler] Stdout: ${stdout}`);
                reject(new Error(`Wrangler deployment failed (Exit Code: ${code}). Check logs for details.`));
            }
        });

        child.on("error", (err) => {
             reject(new Error(`Failed to spawn wrangler process: ${err.message}`));
        });
    });
}

/**
 * POST /api/cloudflare/deploy
 * Deploys the project to Cloudflare Pages using Wrangler CLI
 */
export async function POST(request: Request) {
  let tempDir = "";
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

    // 5. Create Temp Directory
    const tmpPrefix = path.join(os.tmpdir(), `deploy-${projectId}-`);
    tempDir = await fs.mkdtemp(tmpPrefix);
    console.log(`[Cloudflare Wrangler] Created temp dir: ${tempDir}`);

    // 6. Write Files
    let hasIndexHtml = false;
    let indexTsPage = null;
    let defaultContent = "";

    // Helper to write file safely
    const writeFile = async (filename: string, content: string) => {
        const filePath = path.join(tempDir, filename);
        // Ensure directory exists if filename has path separators
        await fs.mkdir(path.dirname(filePath), { recursive: true });
        await fs.writeFile(filePath, content);
    };

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
        await writeFile("index.html", defaultContent);
    } else {
        for (const page of pages) {
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

            await writeFile(filename, content);

            // Handle index conventions
            if (name === "index" || name === "index.html") {
                hasIndexHtml = true;
                defaultContent = content; // Keep reference
            } else if (name === "index.ts") {
                indexTsPage = page;
            }
        }

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
            await writeFile("index.html", defaultContent);
        } else {
             // Fallback if still no index
             if (!hasIndexHtml && defaultContent) {
                  await writeFile("index.html", defaultContent);
             }
        }
    }

    // Add 404.html for SPA fallback (copy index.html)
    // We check if 404.html exists first
    const files = await fs.readdir(tempDir);
    if (files.includes("index.html") && !files.includes("404.html")) {
        await fs.copyFile(path.join(tempDir, "index.html"), path.join(tempDir, "404.html"));
    }

    // 7. Deploy using Wrangler
    const deploymentUrl = await runWranglerDeploy(tempDir, cfProjectName, "main", accountId, apiToken);

    // 8. Cleanup
    await fs.rm(tempDir, { recursive: true, force: true });
    tempDir = ""; // Clear for finally block

    // 9. Update DB
    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          cloudflareProjectName: cfProjectName,
          cloudflareUrl: deploymentUrl,
          cloudflareDeployedAt: new Date(),
          cloudflareDeploymentId: "pages-wrangler-cli",
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
    if (tempDir) {
        try {
            await fs.rm(tempDir, { recursive: true, force: true });
        } catch (e) {
            console.error("Failed to clean up temp dir:", e);
        }
    }
    return NextResponse.json(
      { error: error.message || "Deployment failed" },
      { status: 500 }
    );
  }
}
