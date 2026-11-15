// Lecture Z — generating Goku's voice clips with ElevenLabs (server/script only, never in the browser).
// Used by scripts/gen-voice.mts (whole catalog) and by the local-only /api/lecture-voice route
// (one sentence at a time from the parent space).

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { allClips, type Clip } from "./voice";

export const MODEL = "eleven_multilingual_v2";
const FORMAT = "mp3_44100_64";

/** How one sentence is said. Everything is optional; defaults below. */
export interface Tuning {
  say?: string; // exact text sent to the voice (to fix a word or the rhythm)
  expression?: number; // 0 calm … 1 very lively
  speed?: number; // 0.8 slow … 1.1 fast
}

export const DEFAULT_LINE = { expression: 0.7, speed: 0.95 };

export interface Manifest {
  voice: string;
  model: string;
  clips: Record<string, string>; // text → file
  sig?: Record<string, string>; // text → signature of how it was generated
}

export interface Paths {
  root: string;
  out: string;
  manifest: string;
  tuning: string;
}

export function paths(root: string): Paths {
  const out = path.join(root, "public", "lecture", "voice");
  return { root, out, manifest: path.join(out, "manifest.json"), tuning: path.join(root, "src", "lecture", "voice-tuning.json") };
}

/** Read ELEVENLABS_* from .env.local when not already in the environment. */
export function loadEnv(root: string) {
  const f = path.join(root, ".env.local");
  if (!existsSync(f)) return;
  for (const line of readFileSync(f, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

export function readTuning(p: Paths): Record<string, Tuning> {
  return existsSync(p.tuning) ? JSON.parse(readFileSync(p.tuning, "utf8")) : {};
}

export function writeTuning(p: Paths, t: Record<string, Tuning>) {
  writeFileSync(p.tuning, JSON.stringify(t, null, 2) + "\n");
}

export function readManifest(p: Paths, voice: string): Manifest {
  const m: Manifest = existsSync(p.manifest) ? JSON.parse(readFileSync(p.manifest, "utf8")) : { voice, model: MODEL, clips: {} };
  m.sig ??= {};
  return m;
}

export function writeManifest(p: Paths, m: Manifest) {
  mkdirSync(p.out, { recursive: true });
  writeFileSync(p.manifest, JSON.stringify(m, null, 1));
}

/** The voice runs sentences together: add real pauses after punctuation (not at the very end). */
function withPauses(text: string): string {
  return text
    .replace(/…(?=\s*\S)/g, '… <break time="0.45s" />')
    .replace(/([.!?])\s+(?=\S)/g, '$1 <break time="0.35s" /> ')
    .replace(/,\s+/g, ', <break time="0.2s" /> ');
}

/**
 * The request for a clip. Every clip must end naturally: telling the voice that more follows
 * (next_text) makes it stop dead, cutting the last ~0.3 s, so it is never used.
 * - Words: said on their own after "Voici le mot.", with a full stop (silent letters stay silent).
 * - Sentences that lead into a sound or word end on a comma: a suspended tone, without the
 *   dragged last word ("le sooon") that a trailing "…" gave.
 */
export function request(clip: Clip, tuning: Tuning = {}) {
  if (clip.short) {
    const text = tuning.say ?? clip.text;
    return {
      text: clip.word && !/[.!?]$/.test(text) ? `${text}.` : text,
      model_id: MODEL,
      language_code: "fr",
      // Words follow a complete sentence: after "Regarde, c'est un" the voice sometimes added the
      // article (« une mouche », « un vélo ») or something else (« main » → « maintenant »).
      previous_text: clip.word ? "Voici le mot." : "Écoute bien, je vais le dire clairement :",
      // Picture words are said a little slower: at the end of a sentence the voice rushes them,
      // and they came out ~60% faster than the instructions around them.
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true, speed: tuning.speed ?? (clip.word ? 0.78 : 0.92) },
    };
  }
  const expression = tuning.expression ?? DEFAULT_LINE.expression;
  const say = (tuning.say ?? clip.text).replace(/\s*…\s*$/, ",");
  return {
    text: withPauses(say),
    model_id: MODEL,
    language_code: "fr",
    voice_settings: {
      stability: Math.round((0.55 - 0.32 * expression) * 100) / 100,
      similarity_boost: 0.8,
      style: expression,
      use_speaker_boost: true,
      speed: tuning.speed ?? DEFAULT_LINE.speed,
    },
  };
}

export const signature = (voice: string, body: object) =>
  createHash("sha1").update(voice + JSON.stringify(body)).digest("hex").slice(0, 10);

export async function tts(voice: string, key: string, body: object): Promise<Buffer> {
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=${FORMAT}`, {
    method: "POST",
    headers: { "xi-api-key": key, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Generate one clip, store it (a new file name each time, so browsers never play a stale copy). */
export async function generate(p: Paths, m: Manifest, voice: string, key: string, clip: Clip, tuning?: Tuning): Promise<string> {
  const body = request(clip, tuning);
  const sig = signature(voice, body);
  // Unique per take, so a redo with the same settings still reaches the browser (no stale cache).
  const file = `${createHash("sha1").update(clip.text + sig + Date.now() + Math.random()).digest("hex").slice(0, 12)}.mp3`;
  mkdirSync(p.out, { recursive: true });
  writeFileSync(path.join(p.out, file), await tts(voice, key, body));
  const old = m.clips[clip.text];
  m.clips[clip.text] = file;
  m.sig![clip.text] = sig;
  if (old && old !== file && !Object.values(m.clips).includes(old)) rmSync(path.join(p.out, old), { force: true });
  writeManifest(p, m);
  return file;
}

/** Remove clips the game no longer says. */
export function prune(p: Paths, m: Manifest) {
  const wanted = new Set(allClips().map((c) => c.text));
  for (const [text, file] of Object.entries(m.clips)) {
    if (wanted.has(text)) continue;
    delete m.clips[text];
    delete m.sig![text];
    if (!Object.values(m.clips).includes(file)) rmSync(path.join(p.out, file), { force: true });
  }
}

/** Clips that are missing or were made with other settings than the current ones. */
export function outdated(voice: string, m: Manifest, tuning: Record<string, Tuning>): Clip[] {
  return allClips().filter((c) => !m.clips[c.text] || m.sig![c.text] !== signature(voice, request(c, tuning[c.text])));
}
