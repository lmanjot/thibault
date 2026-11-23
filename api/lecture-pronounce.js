// Vercel Function for the live site: scores a syllable read aloud (POST ?text=ra with a WAV body). Logic in ./_pronounce-core.js.

/* eslint-disable @typescript-eslint/no-require-imports */
const { handle } = require("./_pronounce-core");

function readBody(req) {
  if (Buffer.isBuffer(req.body)) return Promise.resolve(req.body);
  return new Promise((resolve) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", () => resolve(Buffer.alloc(0)));
  });
}

module.exports = async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-store");
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      return res.end(JSON.stringify({ error: "method" }));
    }
    const r = await handle(req.query && req.query.text, await readBody(req));
    res.statusCode = r.status;
    res.end(JSON.stringify(r.body));
  } catch (e) {
    console.error("lecture-pronounce", e);
    res.statusCode = 500;
    res.end(JSON.stringify({ error: "server" }));
  }
};
