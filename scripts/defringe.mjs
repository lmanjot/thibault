// Removes the light halo left around cut-out cartoon sprites (white or checkerboard leftovers
// along the outline), then softens the edge so it blends into any background.
// Only light, colourless pixels on the outer edge are removed: black outlines stay.
//
//   node scripts/defringe.mjs <png> [--measure]     # --measure: report the fringe, change nothing

import sharp from "sharp";

const [file, flag] = process.argv.slice(2);
if (!file) throw new Error("usage: node scripts/defringe.mjs <png> [--measure]");

const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;
const A = (i) => data[i * 4 + 3];
const light = (i) => {
  const r = data[i * 4], g = data[i * 4 + 1], b = data[i * 4 + 2];
  return Math.min(r, g, b) > 165 && Math.max(r, g, b) - Math.min(r, g, b) < 45;
};
const edge = (i) => {
  if (A(i) < 16) return false;
  const x = i % w;
  return (x > 0 && A(i - 1) < 16) || (x < w - 1 && A(i + 1) < 16) || (i >= w && A(i - w) < 16) || (i < w * (h - 1) && A(i + w) < 16);
};

// How much of the outer edge is light (a halo)?
let edges = 0;
let lightEdges = 0;
for (let i = 0; i < w * h; i++) if (edge(i)) { edges++; if (light(i)) lightEdges++; }
const ratio = edges ? lightEdges / edges : 0;
if (flag === "--measure") {
  console.log(`${file.split(/[\\/]/).pop()}: ${Math.round(ratio * 100)}% of the edge is light`);
  process.exit(0);
}

// Peel light edge pixels, a few layers deep (stops at the dark outline).
let peeled = 0;
for (let pass = 0; pass < 3; pass++) {
  const kill = [];
  for (let i = 0; i < w * h; i++) if (edge(i) && light(i)) kill.push(i);
  for (const i of kill) data[i * 4 + 3] = 0;
  peeled += kill.length;
  if (!kill.length) break;
}

// Soften: edge pixels get the average alpha of their 3×3 neighbourhood (a light feather).
const alpha = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) alpha[i] = A(i);
for (let i = 0; i < w * h; i++) {
  if (!edge(i)) continue;
  const x = i % w;
  let sum = 0;
  let n = 0;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx;
      const j = i + dy * w + dx;
      if (xx < 0 || xx >= w || j < 0 || j >= w * h) continue;
      sum += alpha[j];
      n++;
    }
  data[i * 4 + 3] = Math.min(alpha[i], Math.round(sum / n + 40));
}

await sharp(data, { raw: { width: w, height: h, channels: 4 } }).png().toFile(file + ".tmp.png");
const { renameSync } = await import("node:fs");
renameSync(file + ".tmp.png", file);
console.log(`${file.split(/[\\/]/).pop()}: ${Math.round(ratio * 100)}% light edge, ${peeled} halo pixels removed`);
