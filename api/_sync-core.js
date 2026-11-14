// Lecture Z — online save, shared between devices with a short code (server side).
// Plain CommonJS so the live Vercel Function runs it as is (the project is not an ES module package);
// used by api/lecture-sync.js (live site) and src/app/api/lecture-sync/route.ts (local development).
//
// Each save is stored in Vercel Blob as lecture-z/<CODE>/<updatedAt>.json (a new name per save, so
// reads are never stale); older copies are deleted. Without a Blob token (local development) the
// saves go to the git-ignored .lecture-sync/ folder instead.

/* eslint-disable @typescript-eslint/no-require-imports */
const { del, list, put } = require("@vercel/blob");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O, 1/I: easy to read and type
const CODE = /^[A-HJ-NP-Z2-9]{6}$/;
const MAX_BYTES = 200000;

const normalize = (code) => (typeof code === "string" ? code.toUpperCase().replace(/[^A-Z0-9]/g, "") : "");

function newCode() {
  return Array.from(crypto.randomBytes(6), (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// ——— Storage: Vercel Blob on the live site, a local folder in development ———

const onBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const localDir = (code) => path.join(process.cwd(), ".lecture-sync", code);

async function readLatest(code) {
  if (onBlob()) {
    const { blobs } = await list({ prefix: `lecture-z/${code}/`, limit: 50 });
    if (!blobs.length) return null;
    const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const r = await fetch(newest.url, { cache: "no-store" });
    return r.ok ? r.json() : null;
  }
  try {
    const files = fs.readdirSync(localDir(code)).sort();
    return files.length ? JSON.parse(fs.readFileSync(path.join(localDir(code), files[files.length - 1]), "utf8")) : null;
  } catch {
    return null;
  }
}

async function write(code, data) {
  const name = `${data.updatedAt}.json`;
  const body = JSON.stringify(data);
  if (onBlob()) {
    await put(`lecture-z/${code}/${name}`, body, { access: "public", addRandomSuffix: false, contentType: "application/json" });
    const { blobs } = await list({ prefix: `lecture-z/${code}/`, limit: 50 });
    const old = blobs.filter((b) => !b.pathname.endsWith(`/${name}`)).map((b) => b.url);
    if (old.length) await del(old).catch(() => {});
    return;
  }
  fs.mkdirSync(localDir(code), { recursive: true });
  for (const f of fs.readdirSync(localDir(code))) fs.rmSync(path.join(localDir(code), f));
  fs.writeFileSync(path.join(localDir(code), name), body);
}

// ——— Requests ———

/**
 * GET  ?code=ABC123      → { save, updatedAt } (404 if unknown)
 * POST { save }          → creates a code for this save → { code, updatedAt }
 * POST { code, save }    → stores it, unless a newer save is already there (409 with the newer one)
 * Returns { status, body }.
 */
async function handle(method, code, bodyText) {
  if (method === "GET") {
    const c = normalize(code);
    if (!CODE.test(c)) return { status: 400, body: { error: "code" } };
    const data = await readLatest(c);
    return data ? { status: 200, body: data } : { status: 404, body: { error: "unknown" } };
  }
  if (method !== "POST") return { status: 405, body: { error: "method" } };
  if (!bodyText || bodyText.length > MAX_BYTES) return { status: 413, body: { error: "size" } };
  let body;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return { status: 400, body: { error: "json" } };
  }
  const save = body && body.save;
  if (!save || typeof save !== "object" || save.v !== 1) return { status: 400, body: { error: "save" } };
  const updatedAt = Number(save.updatedAt) || Date.now();

  if (!body.code) {
    let c = newCode();
    for (let i = 0; i < 5 && (await readLatest(c)); i++) c = newCode();
    await write(c, { save, updatedAt });
    return { status: 200, body: { code: c, updatedAt } };
  }
  const c = normalize(body.code);
  if (!CODE.test(c)) return { status: 400, body: { error: "code" } };
  const current = await readLatest(c);
  if (!current) return { status: 404, body: { error: "unknown" } };
  if (current.updatedAt > updatedAt) return { status: 409, body: current };
  await write(c, { save, updatedAt });
  return { status: 200, body: { code: c, updatedAt } };
}

module.exports = { handle };
