import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";

/**
 * Cloudflare API Configuration
 */
const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";

/**
 * Helper to make Cloudflare API calls with retry logic
 */
async function cloudflareApiCall(
  url: string,
  options: RequestInit,
  apiToken: string,
  retries = 3
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
    ...(options.headers || {}),
  };

  let lastError: any;

  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, { ...options, headers });

      if (res.ok || res.status < 500) return res;

      lastError = await res.text();
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    } catch (e) {
      lastError = e;
    }
  }

  throw new Error(`Cloudflare API failed: ${lastError}`);
}

async function createPagesProject(
  accountId: string,
  projectName: string,
  apiToken: string
) {
  const check = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}`,
    { method: "GET" },
    apiToken
  );

  if (check.ok) return;

  const create = await cloudflareApiCall(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        production_branch: "main",
      }),
    },
    apiToken
  );

  if (!create.ok) {
    throw new Error(await create.text());
  }
}

async function deployToPages(
  accountId: string,
  projectName: string,
  files: Record<string, string>,
  apiToken: string
) {
  const formData = new FormData();
  const manifest: Record<string, string> = {};
  const uploads: { hash: string; file: File }[] = [];

  for (const [path, content] of Object.entries(files)) {
    const filename = path.replace(/^(\.\/|\/)+/, "");
    const buffer = Buffer.from(content);
    const hash = createHash("sha256").update(buffer).digest("hex");

    manifest[filename] = hash;

    let type = "application/octet-stream";
    if (filename.endsWith(".html")) type = "text/html";
    if (filename.endsWith(".css")) type = "text/css";
    if (filename.endsWith(".js")) type = "application/javascript";

    uploads.push({
      hash,
      file: new File([buffer], filename, { type }),
    });
  }

  const manifestFile = new File(
    [JSON.stringify(manifest)],
    "manifest.json",
    { type: "application/json" }
  );

  formData.append("manifest", manifestFile);

  for (const u of uploads) {
    formData.append(u.hash, u.file);
  }

  const res = await fetch(
    `${CLOUDFLARE_API_BASE}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
      body: formData,
    }
  );

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(txt);
  }

  return res.json();
}

/**
 * POST /api/cloudflare/deploy
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await request.json();
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const apiToken = process.env.CLOUDFLARE_API_TOKEN!;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID!;
    if (!apiToken || !accountId) {
      return NextResponse.json({ error: "Missing Cloudflare credentials" }, { status: 500 });
    }

    const projectName = (project.name || "site")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .slice(0, 58);

    const pages = await db
      .collection("pages")
      .find({ projectId: new ObjectId(projectId) })
      .toArray();

    const files: Record<string, string> = {};

    if (pages.length === 0) {
      files["index.html"] = "<h1>Hello from Cloudflare Pages</h1>";
    } else {
      for (const p of pages) {
        files[`${p.name}.html`] = p.content;
      }
    }

    if (!files["404.html"]) {
      files["404.html"] = files["index.html"];
    }

    await createPagesProject(accountId, projectName, apiToken);
    await deployToPages(accountId, projectName, files, apiToken);

    return NextResponse.json({
      success: true,
      url: `https://${projectName}.pages.dev`,
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}