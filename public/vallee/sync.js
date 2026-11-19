// La Vallée des Graines — keeps the game in step between devices with a short code (client side),
// like Lecture Z. The code lives on each device (localStorage), with `at`: the version of the online save this
// device last saw (its updatedAt). Every change is sent a moment later (at once when the game is hidden or closed),
// saying which version it builds on; the server refuses it if another device saved in between (409), and the game
// then keeps whichever of the two has the most progress. A stale game can no longer overwrite newer progress.

const KEY = 'vallee-sync';
const API = '/api/vallee-sync';

let state = null;
let loaded = false;
const listeners = new Set();

function read() {
  if (loaded) return state;
  loaded = true;
  try { const raw = localStorage.getItem(KEY); state = raw ? JSON.parse(raw) : null; } catch { state = null; }
  return state;
}
function set(next) {
  state = next; loaded = true;
  try { if (next) localStorage.setItem(KEY, JSON.stringify(next)); else localStorage.removeItem(KEY); } catch { /* private mode */ }
  listeners.forEach((l) => l());
}

/** { code, at, error } or null when this device does not sync. */
export const syncState = () => read();
export function onSyncChange(l) { listeners.add(l); return () => listeners.delete(l); }

/** "K7P4QX" → "K7P-4QX" */
export const formatCode = (c) => `${c.slice(0, 3)}-${c.slice(3)}`;
export const cleanCode = (c) => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

/** First device: create a code holding this device's game. */
export async function createCode(save) {
  const r = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ save }) });
  if (!r.ok) throw new Error(String(r.status));
  const { code, updatedAt } = await r.json();
  set({ code, at: updatedAt });
  return code;
}

/** Another device: the game saved under a code (null if the code is unknown). */
export async function fetchCode(code) {
  const r = await fetch(`${API}?code=${encodeURIComponent(cleanCode(code))}`, { cache: 'no-store' });
  if (r.status === 404 || r.status === 400) return null;
  if (!r.ok) throw new Error(String(r.status));
  return (await r.json()).save;
}

/** Use this code on this device from now on. */
export function adoptCode(code, at) { set({ code: cleanCode(code), at }); }
export function stopSync() { set(null); }
/** This device now holds the online version saved at `at` (after taking it, or after deciding to replace it). */
export function markSynced(at) { const s = read(); if (s) set({ ...s, at, error: false }); }

let timer = 0, latest = null, onConflictCb = null, inFlight = false, again = false;
/**
 * Send this save a moment after the last change (several quick changes make one request), or at once (now = true,
 * when the game is hidden or closed). onConflict({ save, updatedAt }) is called with the online save when another
 * device saved since this device last synced.
 */
export function pushSave(save, onConflict, now = false) {
  if (!read()) return;
  latest = save; onConflictCb = onConflict;
  clearTimeout(timer);
  if (now) send(true); else timer = setTimeout(() => send(false), 2000);
}
/** Send what is waiting right away (the page is being hidden or closed). */
export function flushSave() { if (timer) { clearTimeout(timer); send(true); } }

async function send(closing) {
  timer = 0;
  const s = read();
  if (!s || !latest) return;
  if (inFlight) { again = true; return; } // one request at a time, so two sends never race each other
  inFlight = true;
  const body = JSON.stringify({ code: s.code, save: latest, base: s.at || 0 });
  const sentAt = latest.updatedAt;
  try {
    const r = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
      keepalive: closing && body.length < 60000, // a closing page can only send a small body with keepalive
    });
    if (r.status === 409) {
      const online = await r.json();
      set({ ...s, error: false });
      if (onConflictCb) onConflictCb(online);
    } else if (r.ok) {
      set({ code: s.code, at: sentAt, error: false });
    } else set({ ...s, error: true });
  } catch {
    set({ ...s, error: true }); // offline: sent with the next change
  }
  inFlight = false;
  if (again) { again = false; if (latest && latest.updatedAt !== (read() || {}).at) send(false); }
}

/** The online save { save, updatedAt } if it changed since this device last synced, else null. */
export async function pullRemote() {
  const s = read();
  if (!s) return null;
  try {
    const r = await fetch(`${API}?code=${encodeURIComponent(s.code)}`, { cache: 'no-store' });
    if (!r.ok) { set({ ...s, error: r.status !== 404 }); return null; }
    const online = await r.json();
    set({ ...read(), error: false });
    return online && online.save && online.updatedAt !== s.at ? online : null;
  } catch {
    set({ ...s, error: true });
    return null;
  }
}
