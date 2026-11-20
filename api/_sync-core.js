// Online saves shared between devices with a short code (server side), for Lecture Z and La Vallée des Graines.
// Plain CommonJS so the live Vercel Function runs it as is (the project is not an ES module package);
// used by api/lecture-sync.js and api/vallee-sync.js (live site) and the matching src/app/api/*/route.ts (local development).
// Each game has its own namespace ("lecture-z", "vallee"), so a code only opens saves of its own game.
//
// Each save is one Vercel Blob file, <namespace>/<CODE>.json, overwritten on each save. That keeps the
// Blob "advanced operations" (put, list: 2,000 a month on the free plan) to one per save and none per
// read: a read asks head() (a simple operation) for the current version, then fetches that version.
// Saves from before (<namespace>/<CODE>/<updatedAt>.json, found with list) move to the new file the
// first time they are read. Without a Blob token (local development) the saves go to the git-ignored
// .lecture-sync/ (or .vallee-sync/) folder instead.

/* eslint-disable @typescript-eslint/no-require-imports */
const { BlobNotFoundError, del, head, list, put } = require("@vercel/blob");
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

const blobPath = (code, ns) => `${ns}/${code}.json`;
const PUT_OPTIONS = { access: "public", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 60, contentType: "application/json" };

/** The save under a code, or null. legacy: also look for a save in the old format (costs a list). */
async function readLatest(code, ns, legacy = true) {
  if (onBlob()) {
    let meta = null;
    try {
      meta = await head(blobPath(code, ns));
    } catch (e) {
      if (!(e instanceof BlobNotFoundError)) throw e;
    }
    if (meta) {
      // The version in the address, so a cached copy of an older version is never used.
      const r = await fetch(`${meta.url}?v=${new Date(meta.uploadedAt).getTime()}`, { cache: "no-store" });
      return r.ok ? r.json() : null;
    }
    if (!legacy) return null;
    const { blobs } = await list({ prefix: `${ns}/${code}/`, limit: 50 });
    if (!blobs.length) return null;
    const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const r = await fetch(newest.url, { cache: "no-store" });
    const data = r.ok ? await r.json() : null;
    if (data) {
      // Move it to the new file once, then drop the old copies.
      await put(blobPath(code, ns), JSON.stringify(data), PUT_OPTIONS);
      await del(blobs.map((b) => b.url)).catch(() => {});
    }
    return data;
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
    await put(blobPath(code, ns), body, PUT_OPTIONS);
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
 * POST { code, save, base } → stores it only if the online save is still the one this device saw (updatedAt = base),
 *                         otherwise 409 with the online one (La Vallée des Graines)
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
    for (let i = 0; i < 5 && (await readLatest(c, ns, false)); i++) c = newCode();
    await write(c, { save, updatedAt }, ns);
    return { status: 200, body: { code: c, updatedAt } };
  }
  const c = normalize(body.code);
  if (!CODE.test(c)) return { status: 400, body: { error: "code" } };
  const current = await readLatest(c, ns);
  if (!current) return { status: 404, body: { error: "unknown" } };
  // base: the version this device last saw online. If another device saved since, this device has not seen it:
  // refuse (409 with the online one) so the device can choose, instead of a stale game overwriting newer progress.
  // Without base (Lecture Z), the newer timestamp wins as before.
  if ("base" in body ? current.updatedAt !== Number(body.base) : current.updatedAt > updatedAt) return { status: 409, body: current };
  await write(c, { save, updatedAt }, ns);
  return { status: 200, body: { code: c, updatedAt } };
}

module.exports = { handle };
