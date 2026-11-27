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
  // A code the store doesn't know (the store was recreated empty in November 2026): the device that holds the
  // game uploads it again under its own code, so every device refills the new store with its next save.
  if (!current) {
    await write(c, { save, updatedAt }, ns);
    return { status: 200, body: { code: c, updatedAt } };
  }
  // base: the version this device last saw online. If another device saved since, this device has not seen it:
  // refuse (409 with the online one) so the device can choose, instead of a stale game overwriting newer progress.
  // Without base (Lecture Z), the newer timestamp wins as before.
  if ("base" in body) {
    if (current.updatedAt !== Number(body.base)) return { status: 409, body: current };
  } else if (ns === "lecture-z" && current.save) {
    // Lecture Z: a device that missed the other's saves (left open since yesterday, an older tablet) must not
    // erase what was read meanwhile. The two are merged, progress kept from both; when the result differs from
    // what this device sent, it is stored as a newer save and sent back (409) so the device takes it.
    const incomingNewer = updatedAt >= current.updatedAt;
    const merged = mergeLecture(incomingNewer ? save : current.save, incomingNewer ? current.save : save);
    if (JSON.stringify(merged.progress) === JSON.stringify(save.progress)) {
      if (!incomingNewer) return { status: 409, body: current };
    } else {
      if (!incomingNewer && JSON.stringify(merged.progress) === JSON.stringify(current.save.progress)) return { status: 409, body: current };
      const at = Math.max(updatedAt, current.updatedAt) + 1;
      merged.updatedAt = at;
      const data = { save: merged, updatedAt: at };
      await write(c, data, ns);
      return { status: 409, body: data };
    }
  } else if (current.updatedAt > updatedAt) return { status: 409, body: current };
  await write(c, { save, updatedAt }, ns);
  return { status: 200, body: { code: c, updatedAt } };
}

// ——— Lecture Z: two saves of the same game, merged without losing progress ———

const union = (a, b) => (a || b ? [...(a || []), ...(b || []).filter((x) => !(a || []).includes(x))] : undefined);
const ballsOf = (p) => ((p.wishes || 0) + (p.porunga || 0)) * 7 + (p.letterBalls || 0);

/**
 * newer: the save with the latest timestamp (its settings, zénis, equipment, fights are kept);
 * older: the other one, whose progress is added: letters read later, days played, things owned, album,
 * dragon balls. Exported for the tests.
 */
function mergeLecture(newer, older) {
  const out = JSON.parse(JSON.stringify(newer));
  const p = out.progress;
  const o = (older && older.progress) || {};
  if (!p) return out;
  p.items = p.items || {};
  for (const [k, it] of Object.entries(o.items || {})) {
    const mine = p.items[k];
    if (!mine || String(it.last || "") > String(mine.last || "")) p.items[k] = it;
  }
  p.playDays = (union(p.playDays, o.playDays) || []).sort();
  for (const k of ["cleared", "owned", "beaten", "albumDefi", "albumNew"]) {
    const u = union(p[k], o[k]);
    if (u) p[k] = u;
  }
  p.bosses = Math.max(p.bosses || 0, o.bosses || 0);
  for (const k of ["form", "formSeen", "wishSeen"]) if (p[k] != null || o[k] != null) p[k] = Math.max(p[k] || 0, o[k] || 0);
  if (o.levels) {
    p.levels = p.levels || {};
    for (const [g, l] of Object.entries(o.levels)) p.levels[g] = Math.max(p.levels[g] || 0, l || 0);
  }
  if (o.album) {
    p.album = p.album || {};
    for (const [letter, rounds] of Object.entries(o.album)) {
      const mine = p.album[letter] || [];
      p.album[letter] = rounds.map((r, i) => mine[i] || r).concat(mine.slice(rounds.length));
    }
  }
  if (ballsOf(o) > ballsOf(p)) for (const k of ["letterBalls", "wishes", "porunga", "porungaLeft"]) if (o[k] != null) p[k] = o[k];
  return out;
}

module.exports = { handle, mergeLecture };
