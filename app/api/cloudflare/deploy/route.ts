import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import crypto from "crypto";
import FormData from "form-data";

const CF_API = "https://api.cloudflare.com/client/v4";

/* ----------------------------- helpers ----------------------------- */

async function cfFetch(
  url: string,
  options: RequestInit,
  token: string
) {
  return fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
}

async function ensurePagesProject(
  accountId: string,
  projectName: string,
  token: string
) {
  const get = await cfFetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}`,
    { method: "GET" },
    token
  );

  if (get.ok) return;

  const create = await cfFetch(
    `${CF_API}/accounts/${accountId}/pages/projects`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: projectName,
        production_branch: "main"
      })
    },
    token
  );

  if (!create.ok) {
    throw new Error(await create.text());
  }
}

function sha256(buf: Buffer) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

/* ----------------------------- deploy ----------------------------- */

async function deployPages(
  accountId: string,
  projectName: string,
  files: Record<string, string>,
  token: string
) {
  const form = new FormData();
  const manifest: Record<string, string> = {};

  const blobs: { hash: string; buf: Buffer; type: string }[] = [];

  for (const [path, content] of Object.entries(files)) {
    const cleanPath = path.replace(/^\/+/, "");
    const buf = Buffer.from(content);
    const hash = sha256(buf);

    manifest[cleanPath] = hash;

    let type = "application/octet-stream";
    if (cleanPath.endsWith(".html")) type = "text/html";
    if (cleanPath.endsWith(".css")) type = "text/css";
    if (cleanPath.endsWith(".js") || cleanPath.endsWith(".ts")) type = "application/javascript";
    if (cleanPath.endsWith(".json")) type = "application/json";

    blobs.push({ hash, buf, type });
  }

  // Append manifest as a string
  form.append("manifest", JSON.stringify(manifest));

  // Append files
  for (const f of blobs) {
    form.append(f.hash, f.buf, { contentType: f.type });
  }

  /* 🔴 FIX APPLIED HERE:
     When using the 'form-data' library with node-fetch/native fetch,
     you MUST merge form.getHeaders() to include the 'Content-Type' with the boundary.
  */
  const res = await fetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${projectName}/deployments`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        ...form.getHeaders(), 
      },
      body: form as any
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}

/* ----------------------------- route ----------------------------- */

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();

    /* credentials */
    let token = process.env.CLOUDFLARE_API_TOKEN;
    let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!token || !accountId) {
      const cred = await db.collection("cloudflare_tokens").findOne({
        projectId: new ObjectId(projectId),
        userId: session.user.email
      });
      if (cred) {
        token = cred.apiToken;
        accountId = cred.accountId;
      }
    }

    if (!token || !accountId) {
      return NextResponse.json({ error: "Missing Cloudflare credentials" }, { status: 400 });
    }

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      userId: session.user.id // Assuming user ID match logic is correct
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const projectName =
      project.cloudflareProjectName ||
      project.name.toLowerCase().replace(/[^a-z0-9-]/g, "-").slice(0, 58);

    const pages = await db.collection("pages").find({
      projectId: new ObjectId(projectId)
    }).toArray();

    const files: Record<string, string> = {};

    if (pages.length === 0) {
      files["index.html"] = `<h1>Deployed</h1>`;
    } else {
      for (const p of pages) {
        let name = p.name.includes(".") ? p.name : `${p.name}.html`;
        files[name] = p.content;
      }
    }

    if (!files["404.html"] && files["index.html"]) {
      files["404.html"] = files["index.html"];
    }

    await ensurePagesProject(accountId, projectName, token);
    await deployPages(accountId, projectName, files, token);

    const url = `https://${projectName}.pages.dev`;

    await db.collection("projects").updateOne(
      { _id: project._id },
      { $set: { cloudflareUrl: url, cloudflareDeployedAt: new Date() } }
    );

    return NextResponse.json({ success: true, url });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

