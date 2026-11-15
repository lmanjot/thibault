// Online saves shared between devices with a short code (server side), for Lecture Z and La Vallée des Graines.
// Plain CommonJS so the live Vercel Function runs it as is (the project is not an ES module package);
// used by api/lecture-sync.js and api/vallee-sync.js (live site) and the matching src/app/api/*/route.ts (local development).
// Each game has its own namespace ("lecture-z", "vallee"), so a code only opens saves of its own game.
//
// Each save is stored in Vercel Blob as <namespace>/<CODE>/<updatedAt>.json (a new name per save, so
// reads are never stale); older copies are deleted. Without a Blob token (local development) the
// saves go to the git-ignored .lecture-sync/ (or .vallee-sync/) folder instead.

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
const localDir = (code, ns) => path.join(process.cwd(), ns === "lecture-z" ? ".lecture-sync" : `.${ns}-sync`, code);

async function readLatest(code, ns) {
  if (onBlob()) {
    const { blobs } = await list({ prefix: `${ns}/${code}/`, limit: 50 });
    if (!blobs.length) return null;
    const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const r = await fetch(newest.url, { cache: "no-store" });
    return r.ok ? r.json() : null;
  }
  try {
    const files = fs.readdirSync(localDir(code, ns)).sort();
    return files.length ? JSON.parse(fs.readFileSync(path.join(localDir(code, ns), files[files.length - 1]), "utf8")) : null;
  } catch {
    return null;
  }
}

async function write(code, data, ns) {
  const name = `${data.updatedAt}.json`;
  const body = JSON.stringify(data);
  if (onBlob()) {
    await put(`${ns}/${code}/${name}`, body, { access: "public", addRandomSuffix: false, contentType: "application/json" });
    const { blobs } = await list({ prefix: `${ns}/${code}/`, limit: 50 });
    const old = blobs.filter((b) => !b.pathname.endsWith(`/${name}`)).map((b) => b.url);
    if (old.length) await del(old).catch(() => {});
    return;
  }
  fs.mkdirSync(localDir(code, ns), { recursive: true });
  for (const f of fs.readdirSync(localDir(code, ns))) fs.rmSync(path.join(localDir(code, ns), f));
  fs.writeFileSync(path.join(localDir(code, ns), name), body);
}

// ——— Requests ———

/**
 * GET  ?code=ABC123      → { save, updatedAt } (404 if unknown)
 * POST { save }          → creates a code for this save → { code, updatedAt }
 * POST { code, save }    → stores it, unless a newer save is already there (409 with the newer one)
 * Returns { status, body }.
 */
async function handle(method, code, bodyText, ns = "lecture-z") {
  if (method === "GET") {
    const c = normalize(code);
    if (!CODE.test(c)) return { status: 400, body: { error: "code" } };
    const data = await readLatest(c, ns);
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
    for (let i = 0; i < 5 && (await readLatest(c, ns)); i++) c = newCode();
    await write(c, { save, updatedAt }, ns);
    return { status: 200, body: { code: c, updatedAt } };
  }
  const c = normalize(body.code);
  if (!CODE.test(c)) return { status: 400, body: { error: "code" } };
  const current = await readLatest(c, ns);
  if (!current) return { status: 404, body: { error: "unknown" } };
  if (current.updatedAt > updatedAt) return { status: 409, body: current };
  await write(c, { save, updatedAt }, ns);
  return { status: 200, body: { code: c, updatedAt } };
}

module.exports = { handle };
