// Same endpoint as api/vallee-sync.js, for local development with `npm run dev`
// (saves go to the git-ignored .vallee-sync/ folder when there is no Blob token).

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { handle } = require("../../../../api/_sync-core.js") as {
  handle: (method: string, code: string | null, body: string, ns?: string) => Promise<{ status: number; body: unknown }>;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const reply = (r: { status: number; body: unknown }) =>
  new Response(JSON.stringify(r.body), { status: r.status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

export const GET = async (req: Request) => reply(await handle("GET", new URL(req.url).searchParams.get("code"), "", "vallee"));
export const POST = async (req: Request) => reply(await handle("POST", null, await req.text(), "vallee"));
