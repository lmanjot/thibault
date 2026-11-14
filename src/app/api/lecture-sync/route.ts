// Same endpoint as api/lecture-sync.ts, for local development with `npm run dev`
// (saves go to the git-ignored .lecture-sync/ folder when there is no Blob token).

import { handleGet, handlePost } from "@/lecture/sync-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (req: Request) => handleGet(req);
export const POST = (req: Request) => handlePost(req);
