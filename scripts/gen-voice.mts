// Generates Lecture Z's voice clips with ElevenLabs and stores them in public/lecture/voice/.
// Only clips that are missing, or whose settings changed (see src/lecture/voice-tuning.json),
// are generated, so re-running costs nothing. Clips the game no longer says are removed.
//
//   npx tsx scripts/gen-voice.mts --dry-run     # list what would be generated, call nothing
//   npx tsx scripts/gen-voice.mts               # generate
//
// Needs ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env.local.
// Single sentences can also be tuned and regenerated from the game's parent space (local dev only).

import path from "node:path";
import { request, generate, loadEnv, outdated, paths, prune, readManifest, readTuning, signature, writeManifest } from "../src/lecture/voice-gen";

const ROOT = path.resolve(import.meta.dirname, "..");
loadEnv(ROOT);
const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID;
const args = new Set(process.argv.slice(2));

async function main() {
  if (!KEY || !VOICE) throw new Error("ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID must be set in .env.local");
  const p = paths(ROOT);
  const m = readManifest(p, VOICE);
  const tuning = readTuning(p);

  if (m.voice !== VOICE) {
    console.log(`Voice changed (${m.voice} → ${VOICE}): regenerating everything.`);
    Object.assign(m, { voice: VOICE, clips: {}, sig: {} });
  }

  // One-time migration from the older manifest: clips said clearly (sounds, syllables, words)
  // were already made with today's settings, so record their signature instead of paying again.
  const legacy = (m as { style?: Record<string, string> }).style;
  if (legacy) {
    for (const [text, style] of Object.entries(legacy)) {
      if (style === "short" && m.clips[text] && !m.sig![text]) m.sig![text] = signature(VOICE, request({ text, short: true }, tuning[text]));
    }
    delete (m as { style?: unknown }).style;
  }

  prune(p, m);
  writeManifest(p, m);

  const todo = outdated(VOICE, m, tuning);
  const chars = todo.reduce((n, c) => n + (tuning[c.text]?.say ?? c.text).length, 0);
  console.log(`${todo.length} clips to generate, ${chars} characters.`);
  if (args.has("--dry-run")) {
    todo.slice(0, 40).forEach((c) => console.log("  ·", c.text));
    return;
  }

  let done = 0;
  for (const c of todo) {
    try {
      await generate(p, m, VOICE, KEY, c, tuning[c.text]);
    } catch (e) {
      console.error(`\nStopped at "${c.text}": ${(e as Error).message}`);
      break; // keep what was made; re-run continues from here
    }
    process.stdout.write(`\r${++done}/${todo.length}`);
  }
  console.log(`\nDone: ${Object.keys(m.clips).length} clips in public/lecture/voice/.`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
