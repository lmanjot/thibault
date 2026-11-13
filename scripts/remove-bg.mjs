// Removes a white or fake-checkerboard background from a cartoon image (black-outlined art):
// starting from the image border, erases neutral light pixels (white, light grey) connected to it.
// White areas inside the character (eyes, logos) are enclosed by outlines, so they stay.
// The result is trimmed to the character and saved as a transparent PNG.
//
//   node scripts/remove-bg.mjs <input> <output.png>

import sharp from "sharp";

const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error("usage: node scripts/remove-bg.mjs <input> <output.png>");

const { data, info } = await sharp(input).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width: w, height: h } = info;

/** Light and colourless: white or the grey squares of a fake checkerboard. */
const isBg = (i) => {
  const r = data[i * 4];
  const g = data[i * 4 + 1];
  const b = data[i * 4 + 2];
  return Math.min(r, g, b) > 185 && Math.max(r, g, b) - Math.min(r, g, b) < 22;
};

// Small images have hairline breaks in their outlines, through which the background would leak
// into an eye. Search the background with the outlines thickened by 1 px (sealing those breaks)…
const wall = new Uint8Array(w * h);
for (let i = 0; i < w * h; i++) {
  if (isBg(i)) continue;
  const x = i % w;
  for (let dy = -1; dy <= 1; dy++)
    for (let dx = -1; dx <= 1; dx++) {
      const j = i + dy * w + dx;
      if (x + dx >= 0 && x + dx < w && j >= 0 && j < w * h) wall[j] = 1;
    }
}
const bg = new Uint8Array(w * h);
const stack = [];
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
  const i = stack.pop();
  if (bg[i] || wall[i] || !isBg(i)) continue;
  bg[i] = 1;
  const x = i % w;
  const y = (i - x) / w;
  if (x > 0) stack.push(i - 1);
  if (x < w - 1) stack.push(i + 1);
  if (y > 0) stack.push(i - w);
  if (y < h - 1) stack.push(i + w);
}
// …then let it reach back to the real outline (one pixel).
const grow = [];
for (let i = 0; i < w * h; i++) {
  if (bg[i] || !isBg(i)) continue;
  const x = i % w;
  if ((x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (i >= w && bg[i - w]) || (i < w * (h - 1) && bg[i + w])) grow.push(i);
}
for (const i of grow) bg[i] = 1;

// Background also shows through gaps the character encloses (between an arm and the body).
// Those light regions go too when they look like background: a fake checkerboard (white and
// grey squares mixed), or clearly bigger than an eye. Small pure-white areas (eyes) stay.
const seen = new Uint8Array(w * h);
// On a fake checkerboard, gaps are recognised by their squares alone; the size rule is only
// for plain white backgrounds (otherwise a big eye white could be taken for background).
let bgWhite = 0;
let bgGrey = 0;
for (let i = 0; i < w * h; i++) if (bg[i]) data[i * 4] >= 248 ? bgWhite++ : bgGrey++;
const checkerImage = bgGrey > (bgWhite + bgGrey) * 0.2;
const minGap = checkerImage ? Infinity : w * h * 0.004;
for (let start = 0; start < w * h; start++) {
  if (bg[start] || seen[start] || !isBg(start)) continue;
  const region = [];
  let white = 0;
  let grey = 0;
  const st = [start];
  seen[start] = 1;
  while (st.length) {
    const i = st.pop();
    region.push(i);
    if (data[i * 4] >= 248) white++;
    else grey++;
    const x = i % w;
    for (const j of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, i - w, i + w]) {
      if (j >= 0 && j < w * h && !seen[j] && !bg[j] && isBg(j)) {
        seen[j] = 1;
        st.push(j);
      }
    }
  }
  // Real checkerboard is about half white, half grey; an eye is mostly white with grey only at its edge.
  const checker = white > 50 && grey > 50 && Math.min(white, grey) / region.length > 0.28;
  if (process.env.DEBUG && (checker || region.length > minGap)) console.log("gap", region.length, "at", region[0] % w, Math.floor(region[0] / w), "white", white, "grey", grey, checker ? "checker" : "big");
  if (checker || region.length > minGap) for (const i of region) bg[i] = 1;
}

for (let i = 0; i < w * h; i++) {
  if (bg[i]) {
    data[i * 4 + 3] = 0;
    continue;
  }
  // Soften the edge: light pixels touching the background become partly transparent.
  const x = i % w;
  const touches = (x > 0 && bg[i - 1]) || (x < w - 1 && bg[i + 1]) || (i >= w && bg[i - w]) || (i < w * (h - 1) && bg[i + w]);
  if (touches) {
    const light = Math.min(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    if (light > 150) data[i * 4 + 3] = Math.round(255 * Math.min(1, (255 - light) / 90));
  }
}

await sharp(data, { raw: { width: w, height: h, channels: 4 } })
  .trim({ threshold: 1 })
  .png()
  .toFile(output);
console.log(`${output} written`);
