// Usage: npx tsx scripts/check-clips.mts word1 word2 …  (needs ELEVENLABS_API_KEY in .env.local)
// Transcribes the generated clips of these texts, to check the voice said them right.
import { readFileSync } from "node:fs";
import path from "node:path";
import { loadEnv, paths, readManifest } from "../src/lecture/voice-gen";
const root = process.cwd();
loadEnv(root);
const key = process.env.ELEVENLABS_API_KEY!;
const p = paths(root);
const m = readManifest(p, process.env.ELEVENLABS_VOICE_ID!);
const clips = m.clips as Record<string, string>;

for (const text of process.argv.slice(2)) {
  const file = clips[text];
  if (!file) {
    console.log(`${text}: no clip`);
    continue;
  }
  const fd = new FormData();
  fd.append("model_id", "scribe_v1");
  fd.append("language_code", "fra");
  fd.append("file", new Blob([readFileSync(path.join(p.out, file))], { type: "audio/mpeg" }), file);
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: fd });
  const heard = ((await r.json()) as { text?: string }).text ?? "";
  console.log(`${text} → ${JSON.stringify(heard)}`);
}
