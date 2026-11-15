// Vercel Function for the live site (production serves public/ as plain files, plus this /api folder):
// La Vallée des Graines' online save, shared between devices with a short code. Logic in ./_sync-core.js.

/* eslint-disable @typescript-eslint/no-require-imports */
const { handle } = require("./_sync-core");

function readBody(req) {
  if (typeof req.body === "string") return Promise.resolve(req.body);
  if (req.body && typeof req.body === "object") return Promise.resolve(JSON.stringify(req.body));
  return new Promise((resolve) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", () => resolve(""));
  });
}

module.exports = async (req, res) => {
  try {
    const code = req.query && req.query.code;
    const body = req.method === "POST" ? await readBody(req) : "";
    const r = await handle(req.method, code, body, "vallee");
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Cache-Control", "no-store");
    res.statusCode = r.status;
    res.end(JSON.stringify(r.body));
  } catch (e) {
    console.error("vallee-sync", e);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "server" }));
  }
};
