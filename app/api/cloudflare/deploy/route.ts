import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";

/** Cloudflare API base */
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

/** Helper: Cloudflare API call with retries */
async function cloudflareApiCall(url: string, options: RequestInit, apiToken: string, retries = 3): Promise<Response> {
    const headers: Record<string, string> = { Authorization: `Bearer ${apiToken}` };
    if (options.headers) Object.assign(headers, options.headers);

    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            const res = await fetch(url, { ...options, headers });
            if (res.ok || res.status === 401 || res.status === 403 || (res.status < 500 && res.status !== 429)) return res;
            const text = await res.text();
            console.error(`[Cloudflare] API error (attempt ${i + 1}/${retries}):`, res.status, text);
            lastError = text;
            if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * 2 ** i));
        } catch (err) {
            console.error(`[Cloudflare] Request error (attempt ${i + 1}/${retries}):`, err);
            lastError = err;
            if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * 2 ** i));
        }
    }
    throw new Error(`Cloudflare API failed after ${retries} retries: ${lastError}`);
}

/** Create Pages project if not exists */
async function createPagesProject(accountId: string, projectName: string, apiToken: string) {
    console.log(`[Cloudflare] Checking if project exists: ${projectName}`);
    const getRes = await cloudflareApiCall(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}`, { method: "GET" }, apiToken);

    if (getRes.ok) {
        console.log(`[Cloudflare] Project already exists: ${projectName}`);
        return;
    }

    console.log(`[Cloudflare] Creating new Pages project: ${projectName}`);
    const createRes = await cloudflareApiCall(
        `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: projectName, production_branch: "main" }),
        },
        apiToken
    );

    if (!createRes.ok) {
        const err = await createRes.text();
        throw new Error(`Failed to create Pages project: ${err}`);
    }
}

/** Deploy files to Cloudflare Pages */
async function deployToPages(accountId: string, projectName: string, files: Record<string, string>, apiToken: string) {
    console.log(`[Cloudflare] Preparing deployment for ${Object.keys(files).length} files...`);
    const form = new FormData();
    const manifest: Record<string, string> = {};

    for (const [path, content] of Object.entries(files)) {
        const filename = path.startsWith("/") ? path.slice(1) : path;

        const buffer = Buffer.from(content);
        const hash = createHash("sha256").update(buffer).digest("hex");
        manifest[filename] = hash;

        let contentType = "text/plain";
        if (filename.endsWith(".html")) contentType = "text/html";
        else if (filename.endsWith(".js") || filename.endsWith(".ts")) contentType = "application/javascript";
        else if (filename.endsWith(".css")) contentType = "text/css";
        else if (filename.endsWith(".json")) contentType = "application/json";

        const blob = new Blob([buffer], { type: contentType });
        // Append file to FormData using its relative path (manifest key)
        form.append(filename, blob, filename);
    }

    // Append manifest LAST
    const manifestJson = JSON.stringify(manifest);
    form.append("manifest", new Blob([manifestJson], { type: "application/json" }));

    console.log(`[Cloudflare] Deployment manifest:`, manifest);

    const deployRes = await cloudflareApiCall(
        `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
        { method: "POST", body: form },
        apiToken
    );

    if (!deployRes.ok) {
        const err = await deployRes.text();
        throw new Error(`Pages deployment failed: ${err}`);
    }

    const result = await deployRes.json();
    console.log(`[Cloudflare] Deployment successful!`, result);
    return result;
}

/** Delete old worker script (optional) */
async function deleteWorkerScript(accountId: string, scriptName: string, apiToken: string) {
    const res = await cloudflareApiCall(`${CLOUDFLARE_API_BASE}/accounts/${accountId}/workers/scripts/${scriptName}`, { method: "DELETE" }, apiToken);
    if (!res.ok && res.status !== 404) console.warn(`[Cloudflare] Failed to delete old worker ${scriptName}`);
}

/** API Route: Deploy Cloudflare Pages */
export async function POST(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { projectId, cloudflareProjectName } = await request.json();
        if (!projectId) return NextResponse.json({ error: "Missing projectId" }, { status: 400 });
        if (!ObjectId.isValid(projectId)) return NextResponse.json({ error: "Invalid projectId format" }, { status: 400 });

        const client = await clientPromise;
        const db = client.db();

        // Get credentials
        let apiToken = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;
        let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

        if (!apiToken || !accountId) {
            const tokenDoc = await db.collection("cloudflare_tokens").findOne({ projectId: new ObjectId(projectId), userId: session.user.email });
            if (tokenDoc) {
                apiToken = tokenDoc.apiToken;
                accountId = tokenDoc.accountId;
            }
        }

        if (!apiToken || !accountId) return NextResponse.json({ error: "No Cloudflare credentials found." }, { status: 400 });

        // Get project data
        const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId), userId: session.user.id });
        if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

        // Determine CF project name
        let cfProjectName = cloudflareProjectName || project.cloudflareProjectName;
        if (!cfProjectName) {
            const baseName = project.name || project.businessName || `project-${projectId}`;
            cfProjectName = baseName.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-").replace(/^-|-$/g, "").substring(0, 58);
        }

        // Collect pages
        const pages = await db.collection("pages").find({ projectId: new ObjectId(projectId) }).toArray();
        const files: Record<string, string> = {};
        let defaultContent = "";

        if (pages.length === 0) {
            defaultContent = `<html><head><title>${project.name || "New Site"}</title></head><body><h1>Welcome to your new Pages site!</h1></body></html>`;
            files["index.html"] = defaultContent;
        } else {
            let hasIndexHtml = false;
            let indexTsPage = null;

            for (const page of pages) {
                let content = page.content || "";
                if (content.trim().startsWith("```")) {
                    const match = content.match(/```(?:typescript|js|jsx|tsx|html|css)?\s*([\s\S]*?)```/);
                    if (match) content = match[1].trim();
                }

                let filename = page.name;
                if (!filename.includes(".")) filename = `${filename}.html`;
                files[filename] = content;

                if (filename === "index.html") hasIndexHtml = true;
                else if (filename === "index.ts") indexTsPage = page;
            }

            if (!hasIndexHtml && indexTsPage) {
                const tsIndexContent = files["index.ts"];
                files["index.html"] = `<html><head><meta charset="UTF-8"><title>${project.name}</title></head><body><script type="module">${tsIndexContent}</script></body></html>`;
            }
        }

        // Ensure 404 fallback
        if (files["index.html"] && !files["404.html"]) files["404.html"] = files["index.html"];

        // Deploy
        console.log(`[Cloudflare] Creating/Updating Pages Project: ${cfProjectName}`);
        await createPagesProject(accountId, cfProjectName, apiToken);
        await deployToPages(accountId, cfProjectName, files, apiToken);

        const deploymentUrl = `https://${cfProjectName}.pages.dev`;

        // Delete old worker if needed
        if (project.cloudflareDeploymentId && project.cloudflareDeploymentId.startsWith("worker-")) {
            await deleteWorkerScript(accountId, cfProjectName, apiToken);
        }

        // Update DB
        await db.collection("projects").updateOne({ _id: new ObjectId(projectId) }, {
            $set: {
                cloudflareProjectName: cfProjectName,
                cloudflareUrl: deploymentUrl,
                cloudflareDeployedAt: new Date(),
                cloudflareDeploymentId: "pages-latest",
            },
        });

        return NextResponse.json({ success: true, url: deploymentUrl, projectName: cfProjectName });

    } catch (error: any) {
        console.error("[Cloudflare] Deployment Error:", error);
        return NextResponse.json({ error: error.message || "Deployment failed" }, { status: 500 });
    }
}