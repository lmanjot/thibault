// La Vallée des Graines — keeps the game in step between devices with a short code (client side),
// like Lecture Z. The code lives on each device (localStorage); every change is sent a moment later,
// and the newest save is fetched when the game opens or comes back to the screen. The newest one wins.

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

let timer;
/** Send this save a moment after the last change (several quick changes make one request). */
export function pushSave(save, onNewer) {
  const s = read();
  if (!s) return;
  clearTimeout(timer);
  timer = setTimeout(async () => {
    try {
      const r = await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: s.code, save }), keepalive: true,
      });
      if (r.status === 409) {
        // Another device saved something newer meanwhile: take it.
        const newer = await r.json();
        set({ code: s.code, at: newer.updatedAt });
        if (onNewer) onNewer(newer.save);
        return;
      }
      set({ code: s.code, at: r.ok ? save.updatedAt : s.at, error: !r.ok });
    } catch {
      set({ ...s, error: true }); // offline: sent with the next change
    }
  }, 2000);
}

/** The online save, if it is newer than this device's. */
export async function pullNewer(local) {
  const s = read();
  if (!s) return null;
  try {
    const remote = await fetchCode(s.code);
    if (!remote) return null;
    set({ code: s.code, at: remote.updatedAt, error: false });
    return (remote.updatedAt || 0) > ((local && local.updatedAt) || 0) ? remote : null;
  } catch {
    set({ ...s, error: true });
    return null;
  }
}
