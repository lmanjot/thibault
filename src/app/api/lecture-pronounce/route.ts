// Same endpoint as api/lecture-pronounce.js, for local development with `npm run dev`
// (put AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env.local to try it locally).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handle } = require("../../../../api/_pronounce-core.js") as {
  handle: (text: string | null, audio: Buffer) => Promise<{ status: number; body: unknown }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = async (req: Request) => {
  const r = await handle(new URL(req.url).searchParams.get("text"), Buffer.from(await req.arrayBuffer()));
  return new Response(JSON.stringify(r.body), { status: r.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
};
