import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";
import FormData from "form-data";

/**
 * Cloudflare API
 */
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

async function cloudflareApiCall(url: string, options: any, apiToken: string, retries = 3) {
  const headers = { Authorization: `Bearer ${apiToken}`, ...(options.headers || {}) };

  let lastError: any;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options, headers });
      if (res.ok) return res;
      const text = await res.text();
      lastError = text;
    } catch (err) {
      lastError = err;
    }
    await new Promise(r => setTimeout(r, 1000 * Math.pow(2, i)));
  }
  throw new Error(`API call failed: ${lastError}`);
}

async function createPagesProject(accountId: string, projectName: string, apiToken: string) {
  const getRes = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}`,
    { method: "GET" },
    apiToken
  );

  if (getRes.ok) return; // exists

  const createRes = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: projectName, production_branch: "main" })
    },
    apiToken
  );

  if (!createRes.ok) throw new Error(await createRes.text());
}

async function deployToPages(accountId: string, projectName: string, files: Record<string, string>, apiToken: string) {
  const form = new FormData();
  const manifest: Record<string, string> = {};

  for (const [filename, content] of Object.entries(files)) {
    const hash = createHash("sha256").update(content).digest("hex");
    manifest[filename] = hash;
    form.append(filename, content, { filename });
  }

  form.append("manifest", JSON.stringify(manifest));

  const res = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    { method: "POST", body: form },
    apiToken
  );

  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { projectId, cloudflareProjectName } = await request.json();
    if (!ObjectId.isValid(projectId)) return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });

    const client = await clientPromise;
    const db = client.db();
    const project = await db.collection("projects").findOne({ _id: new ObjectId(projectId), userId: session.user.id });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

    const apiToken = process.env.CLOUDFLARE_API_TOKEN!;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    if (!apiToken || !accountId) return NextResponse.json({ error: "No Cloudflare credentials" }, { status: 400 });

    const cfProjectName = cloudflareProjectName || project.cloudflareProjectName || project.name!.toLowerCase().replace(/[^a-z0-9-]/g, "-");

    const pages = await db.collection("pages").find({ projectId: new ObjectId(projectId) }).toArray();
    const files: Record<string, string> = {};

    if (pages.length === 0) {
      files["index.html"] = `<html><body><h1>${project.name || "New Site"}</h1></body></html>`;
    } else {
      pages.forEach(p => {
        let name = p.name;
        if (!name.includes(".")) name = `${name}.html`;
        files[name] = p.content || "";
      });
    }

    await createPagesProject(accountId, cfProjectName, apiToken);
    const deployResult = await deployToPages(accountId, cfProjectName, files, apiToken);

    const url = `https://${cfProjectName}.pages.dev`;
    await db.collection("projects").updateOne({ _id: new ObjectId(projectId) }, { $set: { cloudflareProjectName: cfProjectName, cloudflareUrl: url, cloudflareDeployedAt: new Date() } });

    return NextResponse.json({ success: true, url, deployResult });

  } catch (error: any) {
    console.error("Deployment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}