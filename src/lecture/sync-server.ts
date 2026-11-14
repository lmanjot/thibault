// Lecture Z — online save, shared between devices with a short code (server side).
// Each save is stored in Vercel Blob as lecture-z/<CODE>/<updatedAt>.json (a new name per save, so
// reads are never stale); older copies are deleted. Without a Blob token (local development) the
// saves go to the git-ignored .lecture-sync/ folder instead.

import { del, list, put } from "@vercel/blob";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I: easy to read and type
const CODE = /^[A-HJ-NP-Z2-9]{6}$/;
const MAX_BYTES = 200_000;

type Stored = { save: { v: 1; updatedAt?: number }; updatedAt: number };

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const normalize = (code: unknown) => (typeof code === "string" ? code.toUpperCase().replace(/[^A-Z0-9]/g, "") : "");

function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// ——— Storage: Vercel Blob in production, a local folder in development ———

const onBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const localDir = (code: string) => path.join(process.cwd(), ".lecture-sync", code);

async function readLatest(code: string): Promise<Stored | null> {
  if (onBlob()) {
    const { blobs } = await list({ prefix: `lecture-z/${code}/`, limit: 50 });
    if (!blobs.length) return null;
    const newest = blobs.sort((a, b) => +new Date(b.uploadedAt) - +new Date(a.uploadedAt))[0];
    const r = await fetch(newest.url, { cache: "no-store" });
    return r.ok ? ((await r.json()) as Stored) : null;
  }
  try {
    const files = readdirSync(localDir(code)).sort();
    return files.length ? JSON.parse(readFileSync(path.join(localDir(code), files[files.length - 1]), "utf8")) : null;
  } catch {
    return null;
  }
}

async function write(code: string, data: Stored) {
  const name = `${data.updatedAt}.json`;
  const body = JSON.stringify(data);
  if (onBlob()) {
    await put(`lecture-z/${code}/${name}`, body, { access: "public", addRandomSuffix: false, contentType: "application/json" });
    const { blobs } = await list({ prefix: `lecture-z/${code}/`, limit: 50 });
    const old = blobs.filter((b) => !b.pathname.endsWith(`/${name}`)).map((b) => b.url);
    if (old.length) await del(old).catch(() => {});
    return;
  }
  mkdirSync(localDir(code), { recursive: true });
  for (const f of readdirSync(localDir(code))) rmSync(path.join(localDir(code), f));
  writeFileSync(path.join(localDir(code), name), body);
}

// ——— Handlers ———

/** GET ?code=ABC123 → the latest save for that code. */
export async function handleGet(req: Request): Promise<Response> {
  const code = normalize(new URL(req.url).searchParams.get("code"));
  if (!CODE.test(code)) return json({ error: "code" }, 400);
  const data = await readLatest(code);
  return data ? json(data) : json({ error: "unknown" }, 404);
}

/**
 * POST { save } → creates a code for this save.
 * POST { code, save } → stores the save under that code, unless a newer one is already there
 * (then 409 with the newer one, so the device can take it).
 */
export async function handlePost(req: Request): Promise<Response> {
  const text = await req.text();
  if (text.length > MAX_BYTES) return json({ error: "too big" }, 413);
  let body: { code?: string; save?: Stored["save"] };
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: "json" }, 400);
  }
  const save = body.save;
  if (!save || typeof save !== "object" || save.v !== 1) return json({ error: "save" }, 400);
  const updatedAt = Number(save.updatedAt) || Date.now();

  if (!body.code) {
    let code = newCode();
    for (let i = 0; i < 5 && (await readLatest(code)); i++) code = newCode();
    await write(code, { save, updatedAt });
    return json({ code, updatedAt });
  }

  const code = normalize(body.code);
  if (!CODE.test(code)) return json({ error: "code" }, 400);
  const current = await readLatest(code);
  if (!current) return json({ error: "unknown" }, 404);
  if (current.updatedAt > updatedAt) return json(current, 409);
  await write(code, { save, updatedAt });
  return json({ code, updatedAt });
}
