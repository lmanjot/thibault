// Usage: npx tsx scripts/fix-voice.mts <clip text> [<clip text>…]  (needs ELEVENLABS_API_KEY in .env.local)
// Regenerate the given short clips until the transcription is one clean word/syllable (5 tries max).
import { readFileSync } from "node:fs";
import path from "node:path";
import { allClips } from "../src/lecture/voice";
import { generate, loadEnv, paths, readManifest, readTuning } from "../src/lecture/voice-gen";
const root = process.cwd();
loadEnv(root);
const key = process.env.ELEVENLABS_API_KEY!;
const voice = process.env.ELEVENLABS_VOICE_ID!;
const p = paths(root);
const m = readManifest(p, voice);
const tuning = readTuning(p);
const clips = new Map(allClips().map((c) => [c.text, c]));
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, "").trim();
const ARTICLES = /^(un|une|le|la|les|l|il|elle|des|du)\s/;
async function stt(file: string) {
  const fd = new FormData();
  fd.append("model_id", "scribe_v1");
  fd.append("language_code", "fra");
  fd.append("file", new Blob([readFileSync(path.join(p.out, file))], { type: "audio/mpeg" }), file);
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: fd });
  return ((await r.json()) as { text?: string }).text ?? "";
}
const still: string[] = [];
for (const text of process.argv.slice(2)) {
  const clip = clips.get(text);
  if (!clip) { console.log(`${text}: not in catalog`); continue; }
  const said = norm(tuning[text]?.say ?? text);
  let ok = false, heard = "";
  for (let i = 1; i <= 5 && !ok; i++) {
    const file = await generate(p, m, voice, key, clip, tuning[text]);
    heard = await stt(file);
    const h = norm(heard.replace(/\[.*?\]/g, ""));
    const words = h.split(/\s+/).filter(Boolean).length;
    ok = !!h && words <= said.split(/\s+/).length && !ARTICLES.test(h + " ") && h.replace(/ /g, "").length <= said.replace(/ /g, "").length + 3;
    console.log(`${text} try ${i}: ${JSON.stringify(heard)}${ok ? "  ✓" : ""}`);
  }
  if (!ok) still.push(`${text} → ${heard}`);
}
console.log(still.length ? `\nStill doubtful:\n${still.join("\n")}` : "\nAll clean.");
