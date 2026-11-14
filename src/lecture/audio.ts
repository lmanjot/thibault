// Lecture Z — speech and sound effects.
// Speech plays, in order of preference: the parent's own recording (for sounds), the stored
// Goku clip (public/lecture/voice, generated once by scripts/gen-voice.mts), the device voice.

import { WORDS } from "./content";
import { LETTER_NAME, soundSay, sylSay } from "./voice";

/** A piece of speech: a catalog line, or a sound/syllable that a parent recording can replace. */
export type Part = string | { rec: string; fallback: string };

// ——— Parent recordings (IndexedDB) ———

const DB = "lecture-z";
const STORE = "rec";
const recUrls = new Map<string, string>();

function openDb(): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}

export async function loadRecordings(): Promise<string[]> {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readonly");
    const store = tx.objectStore(STORE);
    const keys: string[] = await new Promise((res) => {
      const r = store.getAllKeys();
      r.onsuccess = () => res(r.result as string[]);
      r.onerror = () => res([]);
    });
    for (const k of keys) {
      const blob: Blob | undefined = await new Promise((res) => {
        const r = store.get(k);
        r.onsuccess = () => res(r.result);
        r.onerror = () => res(undefined);
      });
      if (blob) {
        const old = recUrls.get(k);
        if (old) URL.revokeObjectURL(old);
        recUrls.set(k, URL.createObjectURL(blob));
      }
    }
    return keys;
  } catch {
    return [];
  }
}

export async function saveRecording(key: string, blob: Blob | null) {
  const db = await openDb();
  await new Promise<void>((res, rej) => {
    const tx = db.transaction(STORE, "readwrite");
    if (blob) tx.objectStore(STORE).put(blob, key);
    else tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
  const old = recUrls.get(key);
  if (old) URL.revokeObjectURL(old);
  if (blob) recUrls.set(key, URL.createObjectURL(blob));
  else recUrls.delete(key);
}

export const hasRecording = (key: string) => recUrls.has(key);

// ——— Stored Goku clips ———

let manifest: Record<string, string> | null = null;
let manifestLoad: Promise<void> | null = null;
const audioCache = new Map<string, HTMLAudioElement>();

// Like an app: every clip is downloaded once and kept in memory, so a sentence made of several
// pieces plays without waiting for the network between them (phones ignore audio preloading).
const memory = new Map<string, string>(); // clip URL → in-memory (blob:) URL
const pending = new Map<string, Promise<string | null>>();

/** Download a clip into memory (once). Resolves to its in-memory URL, or null if it failed. */
function keep(url: string): Promise<string | null> {
  if (url.startsWith("blob:")) return Promise.resolve(url);
  const have = memory.get(url);
  if (have) return Promise.resolve(have);
  let p = pending.get(url);
  if (!p) {
    p = fetch(url)
      .then((r) => (r.ok ? r.blob() : null))
      .then((b) => {
        if (!b) return null;
        const m = URL.createObjectURL(b);
        memory.set(url, m);
        audioCache.delete(url); // next play uses the in-memory copy
        return m;
      })
      .catch(() => null)
      .finally(() => pending.delete(url));
    pending.set(url, p);
  }
  return p;
}

let preloading = false;

/** Download every clip in the background, a few at a time (about 5 MB, kept by the browser). */
function preloadAll() {
  if (preloading || !manifest) return;
  preloading = true;
  const urls = [...new Set(Object.values(manifest))].map((f) => `/lecture/voice/${f}`);
  let i = 0;
  const next = (): Promise<void> => (i < urls.length ? keep(urls[i++]).then(next) : Promise.resolve());
  setTimeout(() => Promise.all([next(), next(), next(), next()]), 1500); // after the screen has loaded
}

/** Picture words are said quickly by the voice: they play a little slower to match the sentences. */
const WORD_RATE = 0.82;
const wordTexts = new Set(WORDS.map((w) => w.w));

/** Re-read the clip list (after a sentence was regenerated from the parent space). */
export function reloadVoice(): Promise<void> {
  manifestLoad = null;
  return loadVoice(true);
}

export function loadVoice(fresh = false): Promise<void> {
  if (!manifestLoad && typeof window !== "undefined") {
    manifestLoad = fetch("/lecture/voice/manifest.json", fresh ? { cache: "no-store" } : undefined)
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        manifest = m?.clips ?? {};
        preloadAll();
      })
      .catch(() => {
        manifest = {};
      });
  }
  return manifestLoad ?? Promise.resolve();
}

function clipUrl(text: string): string | null {
  const file = manifest?.[text];
  return file ? `/lecture/voice/${file}` : null;
}

function audioFor(url: string): HTMLAudioElement {
  let a = audioCache.get(url);
  if (!a) {
    a = new Audio(memory.get(url) ?? url);
    a.preload = "auto";
    audioCache.set(url, a);
  }
  return a;
}

const textOf = (p: Part) => (typeof p === "string" ? p : p.fallback);

/** Start downloading the clips of lines that will be said soon. */
export function prefetch(parts: Part[]) {
  loadVoice().then(() => {
    for (const p of parts) {
      const url = (typeof p !== "string" && recUrls.get(p.rec)) || clipUrl(textOf(p));
      if (url) keep(url);
    }
  });
}

// ——— Device voice (last resort) ———

let voice: SpeechSynthesisVoice | null = null;

function pickVoice() {
  if (typeof speechSynthesis === "undefined") return;
  const fr = speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("fr"));
  // Neural voices first (Edge/Windows "Online (Natural)", Apple premium/enhanced), then decent classic ones.
  const prefer = ["Henri", "Remy", "Denise", "Vivienne", "Natural", "Online", "Premium", "Enhanced", "Thomas", "Amélie", "Audrey", "Google"];
  const ff = fr.filter((v) => v.lang === "fr-FR");
  voice = prefer.map((p) => ff.find((v) => v.name.includes(p))).find(Boolean) ?? ff[0] ?? fr[0] ?? null;
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  pickVoice();
  speechSynthesis.addEventListener?.("voiceschanged", pickVoice);
}

function sayText(text: string): Promise<void> {
  return new Promise((res) => {
    if (typeof speechSynthesis === "undefined") return res();
    const u = new SpeechSynthesisUtterance(text.replace(/…/g, ""));
    u.lang = "fr-FR";
    if (voice) u.voice = voice;
    u.rate = 0.85;
    u.pitch = 1.05;
    let done = false;
    const finish = () => {
      if (!done) {
        done = true;
        res();
      }
    };
    u.onend = finish;
    u.onerror = finish;
    setTimeout(finish, 600 + text.length * 140); // some browsers never fire onend
    speechSynthesis.speak(u);
  });
}

// ——— Playback ———

let current: HTMLAudioElement | null = null;

/** Plays a clip; resolves false if it could not be played (missing file, decode error). */
function playUrl(url: string, rate = 1, volume = 1): Promise<boolean> {
  // Never wait here (phones only allow sound right after a tap): play the in-memory copy if it is
  // there, else straight from the network while it is being kept for next time.
  if (!memory.has(url)) keep(url);
  return new Promise((res) => {
    const a = audioFor(url);
    a.preservesPitch = true; // slower, not deeper
    a.playbackRate = rate;
    a.volume = volume;
    current = a;
    let done = false;
    const finish = (ok: boolean) => {
      if (!done) {
        done = true;
        clearTimeout(guard);
        if (!ok) audioCache.delete(url); // don't keep a broken element around
        res(ok);
      }
    };
    // Safety net: never let a clip that doesn't report "ended" freeze the game.
    const guard = setTimeout(() => finish(true), Number.isFinite(a.duration) && a.duration > 0 ? (a.duration / rate) * 1000 + 800 : 6000);
    a.currentTime = 0;
    a.onended = () => finish(true);
    a.onerror = () => finish(false);
    a.play().catch((e: DOMException) => finish(e?.name === "NotAllowedError")); // autoplay blocked ≠ missing clip
  });
}

let token = 0;

export function stopSpeech() {
  token++;
  if (typeof speechSynthesis !== "undefined") speechSynthesis.cancel();
  current?.pause();
  current = null;
}

/** Say parts one after the other; a new call interrupts the previous one. */
export async function speak(parts: Part[]): Promise<void> {
  stopSpeech();
  const my = token;
  await loadVoice();
  for (const [i, p] of parts.entries()) {
    if (my !== token) return;
    const rec = typeof p !== "string" ? recUrls.get(p.rec) : undefined;
    const url = rec ?? clipUrl(textOf(p));
    // If a clip can't be played (e.g. replaced since the page loaded), say it with the device voice
    // rather than skipping a word.
    const rate = !rec && wordTexts.has(textOf(p)) ? WORD_RATE : 1;
    if (!url || !(await playUrl(url, rate))) await sayText(textOf(p));
    // A short breath between the pieces of an assembled sentence.
    if (i < parts.length - 1) await new Promise((r) => setTimeout(r, 120));
  }
}

// ——— The real Kamehameha (boss finisher) ———

const KAME_URL = "/lecture/sfx/kamehameha.mp3";
/** How long the clip lasts; the finishing blast lands at its end. */
export const KAME_SECONDS = 6.5;

export function prefetchKamehameha() {
  if (typeof window !== "undefined") keep(KAME_URL);
}

/** Plays Goku's Kamehameha cry; resolves false if it could not be played. */
/** The recorded cry is much louder than the voice: played at 40% so it doesn't blast. */
const KAME_VOLUME = 0.4;

export function playKamehameha(): Promise<boolean> {
  stopSpeech();
  return playUrl(KAME_URL, 1, KAME_VOLUME);
}

// ——— What to say for each item ———

export const soundPart = (g: string): Part => ({ rec: `g:${g}`, fallback: soundSay(g) });

/** The letter's name ("esse"), or its sound when it has no name of its own (vowels, ou, ch…). */
export const namePart = (g: string): Part => LETTER_NAME[g] ?? soundPart(g);

export const sylPart = (c: string, v: string): Part => ({ rec: `s:${c}|${v}`, fallback: sylSay(c, v) });

// ——— Sound effects (Web Audio, no files) ———

let ctx: AudioContext | null = null;

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!C) return null;
    ctx = new C();
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", vol = 0.18, slideTo?: number) {
  const c = ac();
  if (!c) return;
  const t = c.currentTime + start;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

let noiseBuf: AudioBuffer | null = null;

/** Filtered white noise (whoosh, blast), the filter sweeping from `f0` to `f1` Hz. */
function noise(start: number, dur: number, vol: number, f0: number, f1: number) {
  const c = ac();
  if (!c) return;
  if (!noiseBuf) {
    noiseBuf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  const t = c.currentTime + start;
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const filter = c.createBiquadFilter();
  filter.type = "bandpass";
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(f0, t);
  filter.frequency.exponentialRampToValueAtTime(f1, t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + Math.min(0.08, dur / 3));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(filter).connect(g).connect(c.destination);
  src.start(t);
  src.stop(t + dur + 0.05);
}

export const sfx = {
  good() {
    tone(660, 0, 0.14, "triangle");
    tone(990, 0.1, 0.22, "triangle");
  },
  bad() {
    tone(220, 0, 0.25, "sine", 0.12, 160);
  },
  /** Kamehameha: a rising charge, then a rushing blast and a deep boom on impact. */
  beam(big = false) {
    const k = big ? 1.6 : 1;
    // Charge: shimmering rise.
    tone(220, 0, 0.32 * k, "sine", 0.07, 660);
    tone(440, 0.02, 0.3 * k, "triangle", 0.04, 1320);
    noise(0, 0.3 * k, 0.05, 900, 3200);
    // Blast: wide rushing noise.
    noise(0.3 * k, 0.55 * k, big ? 0.22 : 0.16, 2400, 500);
    tone(140, 0.3 * k, 0.45 * k, "sawtooth", 0.035, 90);
    // Impact: deep boom.
    tone(90, 0.62 * k, 0.5 * k, "sine", big ? 0.3 : 0.22, 38);
    noise(0.62 * k, 0.35 * k, big ? 0.18 : 0.12, 600, 120);
  },
  /** Deep explosion when the final blast lands. */
  boom() {
    tone(80, 0, 0.9, "sine", 0.16, 30);
    noise(0, 0.8, 0.1, 900, 90);
  },
  hit() {
    tone(120, 0, 0.3, "square", 0.1, 50);
  },
  power() {
    [0, 0.12, 0.24, 0.36, 0.5].forEach((t, i) => tone(330 + i * 110, t, 0.3, "triangle", 0.12));
    tone(110, 0, 1.4, "sawtooth", 0.05, 440);
  },
  tap() {
    tone(880, 0, 0.05, "sine", 0.06);
  },
  unlock() {
    ac();
  },
};
