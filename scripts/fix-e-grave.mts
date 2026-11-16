// Usage: npx tsx scripts/fix-e-grave.mts  (needs ELEVENLABS_API_KEY in .env.local)
// « è » syllables: the voice says a bare « lè » as « lé », so each one is said through a word that
// sounds the same (« lait »). Tries each word until the transcription is that word (accents kept),
// then records it in voice-tuning.json. Prints the syllables that never came out right.
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { generate, loadEnv, paths, readManifest, readTuning } from "../src/lecture/voice-gen";
const root = process.cwd();
loadEnv(root);
const key = process.env.ELEVENLABS_API_KEY!;
const voice = process.env.ELEVENLABS_VOICE_ID!;
const p = paths(root);
const m = readManifest(p, voice);
const tuning = readTuning(p);

// Syllable → words that sound like it, and what a correct transcription may be.
const CANDIDATES: Record<string, { say: string[]; ok: string[] }> = {
  lè: { say: ["laie", "lès", "lait"], ok: ["laie", "lait", "laid", "lès", "lai"] },
  rè: { say: ["raie", "rai"], ok: ["raie", "rai", "rais", "rait"] },
  mè: { say: ["mais", "mai"], ok: ["mais", "mai", "met", "mets"] },
  sè: { say: ["c'est", "sept", "cesse"], ok: ["c'est", "s'est", "sait", "sais"] },
  fè: { say: ["fait", "fais"], ok: ["fait", "fais"] },
  chè: { say: ["chai", "chais"], ok: ["chai", "chais"] },
  vè: { say: ["vê", "vais.", "vaie"], ok: ["vais", "vait", "vê", "vaie"] },
  nè: { say: ["n'est", "naie", "nè"], ok: ["naît", "nait", "nais", "n'est", "nè"] },
  jè: { say: ["jet", "geai"], ok: ["jet", "geai"] },
  zè: { say: ["zèe", "zai"], ok: ["zai", "zè", "zèe"] },
  pè: { say: ["paix", "pet"], ok: ["paix", "pet", "pai"] },
  tè: { say: ["t'es", "tais", "taie"], ok: ["taie", "tait", "tais", "t'es", "t'est"] },
  dè: { say: ["dès", "dais"], ok: ["dès", "dais"] },
  bè: { say: ["bê", "baie.", "bêê"], ok: ["baie", "bai", "bais", "bê", "bêê"] },
};

const norm = (s: string) => s.toLowerCase().replace(/\[.*?\]/g, "").replace(/[^a-zàâçéèêëîïôûùüœ' ]/g, "").trim();
async function stt(file: string) {
  const fd = new FormData();
  fd.append("model_id", "scribe_v1");
  fd.append("language_code", "fra");
  fd.append("file", new Blob([readFileSync(path.join(p.out, file))], { type: "audio/mpeg" }), file);
  const r = await fetch("https://api.elevenlabs.io/v1/speech-to-text", { method: "POST", headers: { "xi-api-key": key }, body: fd });
  return ((await r.json()) as { text?: string }).text ?? "";
}

const only = process.argv.slice(2);
const failed: string[] = [];
for (const [syl, c] of Object.entries(CANDIDATES)) {
  if (only.length && !only.includes(syl)) continue;
  let done = false;
  for (const say of c.say) {
    for (let i = 1; i <= 3 && !done; i++) {
      const t = { say, word: true };
      const file = await generate(p, m, voice, key, { text: syl, short: true }, t);
      const heard = await stt(file);
      done = c.ok.includes(norm(heard));
      console.log(`${syl} as « ${say} » try ${i}: ${JSON.stringify(heard)}${done ? "  ✓" : ""}`);
      if (done) tuning[syl] = t;
    }
    if (done) break;
  }
  if (!done) failed.push(syl);
}
writeFileSync(path.join(root, "src/lecture/voice-tuning.json"), JSON.stringify(tuning, null, 2) + "\n");
console.log(failed.length ? `\nNever right: ${failed.join(" ")}` : "\nAll right.");
