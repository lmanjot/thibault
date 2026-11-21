// Lecture Z — keeps the progress in step between devices with a short code (client side).
// The code lives on each device (localStorage); changes go online now and then (see pushSave), and the
// newest save is fetched when the game opens or comes back to the screen. The newest one wins.

import type { Save } from "./engine";

const KEY = "lecture-z-sync";
const API = "/api/lecture-sync";

export type SyncState = { code: string; at?: number; error?: boolean };

let state: SyncState | null = null;
const listeners = new Set<() => void>();

function read(): SyncState | null {
  if (state || typeof window === "undefined") return state;
  try {
    const raw = localStorage.getItem(KEY);
    state = raw ? (JSON.parse(raw) as SyncState) : null;
  } catch {
    state = null;
  }
  return state;
}

function set(next: SyncState | null) {
  state = next;
  try {
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
    else localStorage.removeItem(KEY);
  } catch {
    // private browsing: the code lasts until the page closes
  }
  listeners.forEach((l) => l());
}

export const syncState = () => read();

export function onSyncChange(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** "K7P4QX" → "K7P-4QX" */
export const formatCode = (c: string) => `${c.slice(0, 3)}-${c.slice(3)}`;

/** First device: create a code holding this device's progress. */
export async function createCode(save: Save): Promise<string> {
  const r = await fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ save }) });
  if (!r.ok) throw new Error(String(r.status));
  const { code, updatedAt } = (await r.json()) as { code: string; updatedAt: number };
  set({ code, at: updatedAt });
  return code;
}

/** Another device: fetch the progress saved under a code (null if the code is unknown). */
export async function fetchCode(code: string): Promise<Save | null> {
  const r = await fetch(`${API}?code=${encodeURIComponent(code)}`, { cache: "no-store" });
  if (r.status === 404 || r.status === 400) return null;
  if (!r.ok) throw new Error(String(r.status));
  return ((await r.json()) as { save: Save }).save;
}

/** Use this code on this device from now on. */
export function adoptCode(code: string, at?: number) {
  set({ code: code.toUpperCase().replace(/[^A-Z0-9]/g, ""), at });
}

export function stopSync() {
  set(null);
}

// Each send costs a paid storage operation (the free plan allows 2,000 a month), so a change only waits here:
// it goes online at the end of a training and back on the home screen (sendSaveNow, called by the app), and when
// the game is hidden or closed — never during a training. The device itself keeps every change at once (storeSave).
let pending: { save: Save; onNewer?: (s: Save) => void } | null = null;

/** Keep this save for the next online send (see above for when it goes). */
export function pushSave(save: Save, onNewer?: (s: Save) => void) {
  if (!read()) return;
  pending = { save, onNewer };
}
/** End of a training, or back on the home screen: what is waiting goes online now. */
export function sendSaveNow() {
  if (pending) void send(false);
}

async function send(closing: boolean) {
  const s = read();
  const job = pending;
  if (!s || !job) return;
  pending = null;
  const body = JSON.stringify({ code: s.code, save: job.save });
  try {
    const r = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: closing && body.length < 60000, // a closing page can only send a small body with keepalive
    });
    if (r.status === 409) {
      // Another device saved something newer meanwhile: take it.
      const newer = (await r.json()) as { save: Save; updatedAt: number };
      set({ code: s.code, at: newer.updatedAt });
      job.onNewer?.(newer.save);
      return;
    }
    set({ code: s.code, at: r.ok ? job.save.updatedAt : s.at, error: !r.ok });
    if (!r.ok) retry(job);
  } catch {
    set({ ...s, error: true });
    retry(job);
  }
}
/** Not sent (offline): keep it for the next send (end of a training, home screen, hidden), unless a newer one waits. */
function retry(job: { save: Save; onNewer?: (s: Save) => void }) {
  if (!pending) pending = job;
}
// Hidden (another app, screen off) or closed: what is waiting goes at once.
if (typeof window !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && pending) void send(true);
  });
  window.addEventListener("pagehide", () => {
    if (pending) void send(true);
  });
}

/** The online save, if it is newer than this device's. */
export async function pullNewer(local: Save): Promise<Save | null> {
  const s = read();
  if (!s) return null;
  try {
    const remote = await fetchCode(s.code);
    if (!remote) return null;
    set({ code: s.code, at: remote.updatedAt, error: false });
    return (remote.updatedAt ?? 0) > (local.updatedAt ?? 0) ? remote : null;
  } catch {
    set({ ...s, error: true });
    return null;
  }
}
