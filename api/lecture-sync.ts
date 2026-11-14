// Vercel Function for the live site (production serves public/ as plain files, plus this /api folder):
// Lecture Z's online save, shared between devices with a short code. See src/lecture/sync-server.ts.

import { handleGet, handlePost } from "../src/lecture/sync-server";

export const GET = (req: Request) => handleGet(req);
export const POST = (req: Request) => handlePost(req);
