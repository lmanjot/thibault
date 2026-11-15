// Usage: npx tsx scripts/check-voice.mts <out.json>  (needs ELEVENLABS_API_KEY in .env.local)
// Transcribe every short clip (sounds, letter names, syllables, words) and flag the ones where the
// voice added something (several words, or much longer than the text). Writes the list to a file.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { allClips } from "../src/lecture/voice";
import { loadEnv, paths, readManifest, readTuning } from "../src/lecture/voice-gen";
const root = process.cwd();
loadEnv(root);
const key = process.env.ELEVENLABS_API_KEY!;
const p = paths(root);
const m = readManifest(p, process.env.ELEVENLABS_VOICE_ID!);
const tuning = readTuning(p);
const shorts = allClips().filter((c) => c.short);
const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z ]/g, "").trim();
async function stt(file: string) {
  const fd = new FormData();
  fd.append("model_id", "scribe_v1");
  fd.append("language_code", "fra");
  fd.append("file", new Blob([readFileSync(path.join(p.out, file))], { type: "audio/mpeg" }), file);
  for (let k = 0; k < 3; k++) {
    const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: fd });
    if (r.ok) return ((await r.json()) as { text?: string }).text ?? "";
    await new Promise((res) => setTimeout(res, 1500));
  }
  return "?";
}
const flagged: { text: string; heard: string; why: string }[] = [];
let done = 0;
async function check(c: (typeof shorts)[number]) {
  const file = m.clips[c.text];
  if (!file) return;
  const heard = await stt(file);
  const h = norm(heard.replace(/\[.*?\]/g, ""));
  const said = norm(tuning[c.text]?.say ?? c.text);
  const words = h.split(/\s+/).filter(Boolean).length;
  const expectWords = said.split(/\s+/).filter(Boolean).length;
  let why = "";
  if (!h) why = "silence/noise";
  else if (words > expectWords) why = `${words} words`;
  else if (h.replace(/ /g, "").length > said.replace(/ /g, "").length + 3) why = "longer";
  if (why) flagged.push({ text: c.text, heard, why });
  if (++done % 40 === 0) console.log(`${done}/${shorts.length}`);
}
const queue = [...shorts];
await Promise.all(Array.from({ length: 4 }, async () => { while (queue.length) await check(queue.shift()!); }));
writeFileSync(process.argv[2], JSON.stringify(flagged, null, 1));
console.log(`checked ${done}, flagged ${flagged.length}`);
for (const f of flagged) console.log(`${f.text}\t→ ${JSON.stringify(f.heard)}\t(${f.why})`);
