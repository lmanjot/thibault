// Fixes sprites whose background removal also erased enclosed white areas (e.g. Krilin's eyes):
// transparent pixels that can't be reached from the image border are filled with white.
//
//   node scripts/fill-sprite-holes.mjs public/assets/dbz/ready/krillin.png

import sharp from "sharp";

const file = process.argv[2];
if (!file) throw new Error("usage: node scripts/fill-sprite-holes.mjs <png>");

const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const A = (i) => data[i * 4 + 3];
const CLEAR = 40; // alpha below this counts as transparent

// Flood-fill the outside background from every border pixel.
const outside = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
  const i = stack.pop();
  if (outside[i] || A(i) >= CLEAR) continue;
  outside[i] = 1;
  const x = i % w;
  const y = (i - x) / w;
  if (x > 0) stack.push(i - 1);
  if (x < w - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - w);
  if (y < h - 1) stack.push(i + w);
}

// Enclosed transparent pixels become white (blended with what little alpha they had).
let filled = 0;
for (let i = 0; i < w * h; i++) {
  if (outside[i] || A(i) >= 250) continue;
  const a = A(i) / 255;
  for (let c = 0; c < 3; c++) data[i * 4 + c] = Math.round(data[i * 4 + c] * a + 255 * (1 - a));
  data[i * 4 + 3] = 255;
  filled++;
}

await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file + ".tmp.png");
const { renameSync } = await import("node:fs");
renameSync(file + ".tmp.png", file);
console.log(`${file}: ${filled} enclosed pixels filled`);
