// Lecture Z — tune and regenerate one of Goku's sentences from the parent space.
// Local development only: in production this route does not exist (404), so the deployed game
// never calls ElevenLabs. Regenerated clips are written to public/lecture/voice/ to be committed.

import { allClips } from "@/lecture/voice";
import { DEFAULT_LINE, generate, loadEnv, paths, readManifest, readTuning, writeTuning, type Tuning } from "@/lecture/voice-gen";

export const runtime = "nodejs";

const dev = process.env.NODE_ENV === "development";
const notFound = () => new Response("Not found", { status: 404 });

function setup() {
  const root = process.cwd();
  loadEnv(root);
  return { p: paths(root), key: process.env.ELEVENLABS_API_KEY, voice: process.env.ELEVENLABS_VOICE_ID };
}

/** The reusable sentences, with how each is currently said. */
export async function GET() {
  if (!dev) return notFound();
  const { p, key, voice } = setup();
  const m = readManifest(p, voice ?? "");
  const tuning = readTuning(p);
  const lines = allClips()
    .filter((c) => !c.short || c.word)
    .map((c) => ({ text: c.text, word: !!c.word, file: m.clips[c.text] ?? null, tuning: tuning[c.text] ?? {} }));
  return Response.json({ ready: !!(key && voice), defaults: DEFAULT_LINE, lines });
}

/** Save one sentence's settings and regenerate it. */
export async function POST(req: Request) {
  if (!dev) return notFound();
  if (req.headers.get("sec-fetch-site") && req.headers.get("sec-fetch-site") !== "same-origin") return new Response("forbidden", { status: 403 });
  const { p, key, voice } = setup();
  if (!key || !voice) return new Response("ELEVENLABS_API_KEY / ELEVENLABS_VOICE_ID missing in .env.local", { status: 503 });

  const body = (await req.json()) as { text?: string; tuning?: Tuning };
  const clip = allClips().find((c) => c.text === body.text && (!c.short || c.word));
  if (!clip) return new Response("unknown sentence", { status: 400 });

  // Keep only meaningful, bounded settings.
  const t: Tuning = {};
  const say = body.tuning?.say?.trim();
  if (say && say !== clip.text && say.length <= 200) t.say = say;
  if (typeof body.tuning?.expression === "number") t.expression = Math.min(1, Math.max(0, body.tuning.expression));
  if (typeof body.tuning?.speed === "number") t.speed = Math.min(1.15, Math.max(0.75, body.tuning.speed));

  const all = readTuning(p);
  if (Object.keys(t).length) all[clip.text] = t;
  else delete all[clip.text];
  writeTuning(p, all);

  try {
    const file = await generate(p, readManifest(p, voice), voice, key, clip, t);
    return Response.json({ file });
  } catch (e) {
    return new Response((e as Error).message, { status: 502 });
  }
}
