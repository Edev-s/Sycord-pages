import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createHash } from "crypto";

/* =======================
   Cloudflare constants
======================= */

const CF_API = "https://api.cloudflare.com/client/v4";

/* =======================
   Helper: Cloudflare fetch
======================= */

async function cfFetch(
  url: string,
  options: RequestInit,
  token: string
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });

  return res;
}

/* =======================
   Create Pages project
======================= */

async function ensurePagesProject(
  accountId: string,
  name: string,
  token: string
) {
  const check = await cfFetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${name}`,
    { method: "GET" },
    token
  );

  if (check.ok) return;

  const create = await cfFetch(
    `${CF_API}/accounts/${accountId}/pages/projects`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        production_branch: "main",
      }),
    },
    token
  );

  if (!create.ok) {
    throw new Error(await create.text());
  }
}

/* =======================
   Deploy to Pages (FIXED)
======================= */

async function deployPages(
  accountId: string,
  project: string,
  files: Record<string, string>,
  token: string
) {
  const form = new FormData();
  const manifest: Record<string, string> = {};
  const uploads: { hash: string; file: File }[] = [];

  for (const [path, content] of Object.entries(files)) {
    const cleanPath = path.replace(/^\/+/, "");
    const buffer = Buffer.from(content);
    const hash = createHash("sha256").update(buffer).digest("hex");

    manifest[cleanPath] = hash;

    uploads.push({
      hash,
      file: new File([buffer], cleanPath, {
        type: cleanPath.endsWith(".html")
          ? "text/html"
          : "application/octet-stream",
      }),
    });
  }

  form.append(
    "manifest",
    new File([JSON.stringify(manifest)], "manifest.json", {
      type: "application/json",
    })
  );

  for (const u of uploads) {
    form.append(u.hash, u.file);
  }

  const res = await cfFetch(
    `${CF_API}/accounts/${accountId}/pages/projects/${project}/deployments`,
    { method: "POST", body: form },
    token
  );

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
}

/* =======================
   API ROUTE
======================= */

export async function POST(req: Request) {
  try {
    /* ---------- AUTH ---------- */
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { projectId } = await req.json();
    if (!ObjectId.isValid(projectId)) {
      return NextResponse.json({ error: "Invalid projectId" }, { status: 400 });
    }

    /* ---------- DB ---------- */
    const client = await clientPromise;
    const db = client.db();

    const project = await db.collection("projects").findOne({
      _id: new ObjectId(projectId),
      userId: session.user.id,
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    /* ---------- CREDENTIALS ---------- */
    let apiToken =
      process.env.CLOUDFLARE_API_TOKEN ||
      process.env.CLOUDFLARE_API_KEY;

    let accountId = process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiToken || !accountId) {
      const cred = await db.collection("cloudflare_tokens").findOne({
        projectId: new ObjectId(projectId),
        userId: session.user.email,
      });

      if (cred) {
        apiToken = cred.apiToken;
        accountId = cred.accountId;
      }
    }

    if (!apiToken || !accountId) {
      return NextResponse.json(
        { error: "Missing Cloudflare credentials" },
        { status: 400 }
      );
    }

    /* ---------- PROJECT NAME ---------- */
    const cfName = (project.cloudflareProjectName ||
      project.name ||
      "site")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 58);

    /* ---------- PAGES ---------- */
    const pages = await db
      .collection("pages")
      .find({ projectId: new ObjectId(projectId) })
      .toArray();

    const files: Record<string, string> = {};

    if (pages.length === 0) {
      files["index.html"] = `
<!DOCTYPE html>
<html>
<head><title>${project.name}</title></head>
<body><h1>${project.name}</h1></body>
</html>`;
    } else {
      for (const p of pages) {
        const name = p.name.endsWith(".html")
          ? p.name
          : `${p.name}.html`;
        files[name] = p.content;
      }
    }

    files["404.html"] ||= files["index.html"];

    /* ---------- DEPLOY ---------- */
    await ensurePagesProject(accountId, cfName, apiToken);
    await deployPages(accountId, cfName, files, apiToken);

    const url = `https://${cfName}.pages.dev`;

    await db.collection("projects").updateOne(
      { _id: new ObjectId(projectId) },
      {
        $set: {
          cloudflareProjectName: cfName,
          cloudflareUrl: url,
          cloudflareDeployedAt: new Date(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (err: any) {
    console.error("[CF DEPLOY ERROR]", err);
    return NextResponse.json(
      { error: err.message || "Deploy failed" },
      { status: 500 }
    );
  }
}