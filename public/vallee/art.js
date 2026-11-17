// La Vallée des Graines — pixel art drawn in code: tiles, buildings, people, items, creatures, badges.
import { ITEMS, CREATURES } from './data.js';

export const TS = 16;
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const cache = new Map();
export function cached(key, w, h, fn) {
  let c = cache.get(key);
  if (!c) { c = canvas(w, h); const g = c.getContext('2d'); fn(g); cache.set(key, c); }
  return c;
}
export function hash(x, y, s = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
export function rect(g, x, y, w, h, c) { g.fillStyle = c; g.fillRect(x, y, w, h); }
export function disc(g, cx, cy, r, c) {
  g.fillStyle = c;
  for (let y = -r; y <= r; y++) { const w = Math.floor(Math.sqrt(Math.max(0, r * r + r * 0.6 - y * y))); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
}
export function ellipse(g, cx, cy, rx, ry, c) {
  g.fillStyle = c;
  for (let y = -ry; y <= ry; y++) { const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + 0.6)))); g.fillRect(cx - w, cy + y, w * 2 + 1, 1); }
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
  const f = (v) => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k)));
  return '#' + ((1 << 24) | (f(r) << 16) | (f(gg) << 8) | f(b)).toString(16).slice(1);
}
export { shade };

export const PAL = {
  grass: '#8ed46e', grassD: '#62ad4a', grassL: '#b4e98e',
  tall: '#5cb446', tallD: '#3a8a34', tallL: '#8ad866',
  path: '#e6cf96', pathD: '#cdb072', pathL: '#f4e2b4',
  water: '#5a94ec', waterD: '#4278d8', waterL: '#a6ccff',
  treeD: '#22583a', tree: '#368a3e', treeM: '#4aa246', treeL: '#76c458', trunk: '#7a4e2c',
  sand: '#f2e2a6', sandD: '#dcc480',
  cliff: '#a88e6c', cliffD: '#7c6448', cliffL: '#cbb48e',
  snow: '#eef5ff', snowD: '#cddcf0',
  stone: '#c4c4cc', stoneD: '#9a9aa8',
  forest: '#76bc5c', forestD: '#559a48', forestL: '#9ad67a',
  wood: '#c8945a', woodD: '#8a5a30', woodL: '#e0b078',
  ink: '#2c2c38',
};

// ---------------- Tiles ----------------
function tGrass(g, v, base = PAL.grass, dk = PAL.grassD, lt = PAL.grassL) {
  rect(g, 0, 0, 16, 16, base);
  for (let i = 0; i < 5; i++) {
    const x = 1 + Math.floor(hash(v, i, 11) * 12), y = 3 + Math.floor(hash(v, i, 12) * 11);
    rect(g, x, y, 1, 2, dk); rect(g, x + 1, y - 1, 1, 2, dk); rect(g, x + 2, y, 1, 2, dk);
  }
  for (let i = 0; i < 3; i++) rect(g, Math.floor(hash(v, i, 13) * 16), Math.floor(hash(v, i, 14) * 16), 1, 1, lt);
}
function tTall(g, base = PAL.tall, dk = PAL.tallD, lt = PAL.tallL) {
  rect(g, 0, 0, 16, 16, base);
  for (const [x, y] of [[0, 0], [8, 0], [4, 8], [12, 8], [-4, 8]]) {
    rect(g, x + 1, y + 3, 1, 5, dk); rect(g, x + 2, y + 1, 1, 7, dk); rect(g, x + 4, y, 1, 8, dk); rect(g, x + 6, y + 2, 1, 6, dk);
    rect(g, x + 3, y + 2, 1, 6, lt); rect(g, x + 5, y + 3, 1, 5, lt);
    rect(g, x, y + 7, 8, 1, dk);
  }
}
function tPath(g, v) {
  rect(g, 0, 0, 16, 16, PAL.path);
  for (let i = 0; i < 4; i++) {
    const x = Math.floor(hash(v, i, 21) * 14), y = Math.floor(hash(v, i, 22) * 14);
    rect(g, x, y, 2, 1, PAL.pathD); rect(g, x, y + 1, 1, 1, PAL.pathD);
  }
  for (let i = 0; i < 3; i++) rect(g, Math.floor(hash(v, i, 23) * 16), Math.floor(hash(v, i, 24) * 16), 1, 1, PAL.pathL);
}
function tWater(g, f) {
  rect(g, 0, 0, 16, 16, PAL.water);
  for (let k = 0; k < 3; k++) {
    const x = (k * 6 + f * 2) % 16, y = 2 + k * 5;
    rect(g, x, y, 4, 1, PAL.waterL); rect(g, (x + 4) % 16, y + 1, 2, 1, PAL.waterL);
    rect(g, (x + 9) % 16, y + 3, 2, 1, PAL.waterD);
  }
}
export function drawTreeOn(g, x, y, v = 0, base = 'grass') {
  if (base === 'snow') rect(g, x, y, 16, 16, PAL.snow);
  rect(g, x + 6, y + 11, 4, 5, PAL.trunk); rect(g, x + 7, y + 11, 1, 5, '#966438');
  rect(g, x + 2, y + 14, 12, 2, 'rgba(0,0,0,0.12)');
  disc(g, x + 8, y + 7, 7, PAL.treeD);
  disc(g, x + 8, y + 6, 6, PAL.tree);
  disc(g, x + 7, y + 5, 4, PAL.treeM);
  rect(g, x + 4, y + 3, 3, 2, PAL.treeL); rect(g, x + 3, y + 5, 1, 2, PAL.treeL);
  rect(g, x + 9 + Math.floor(v * 3), y + 4, 2, 1, PAL.treeL);
  if (base === 'snow') { rect(g, x + 4, y + 1, 8, 2, '#ffffff'); rect(g, x + 3, y + 3, 3, 1, '#ffffff'); }
}
function tTree(g, v, forest) {
  if (forest) tGrass(g, v, PAL.forest, PAL.forestD, PAL.forestL); else tGrass(g, v);
  drawTreeOn(g, 0, 0, hash(v, 1, 31));
}
function tFlower(g, v) {
  tGrass(g, v);
  const cols = ['#f05050', '#f8e048', '#ffffff', '#f890d0', '#8098f8'];
  for (let i = 0; i < 3; i++) {
    const x = 2 + Math.floor(hash(v, i, 41) * 11), y = 2 + Math.floor(hash(v, i, 42) * 11);
    const c = cols[Math.floor(hash(v, i, 43) * cols.length)];
    rect(g, x, y - 1, 1, 1, c); rect(g, x - 1, y, 3, 1, c); rect(g, x, y + 1, 1, 1, c); rect(g, x, y, 1, 1, '#f8c020');
    rect(g, x, y + 2, 1, 2, PAL.grassD);
  }
}
function tFence(g, v, vertical) {
  tGrass(g, v);
  if (vertical) {
    rect(g, 6, 0, 4, 16, PAL.woodD); rect(g, 7, 0, 2, 16, PAL.wood); rect(g, 7, 0, 1, 16, PAL.woodL);
    rect(g, 5, 3, 6, 3, PAL.woodD); rect(g, 6, 3, 4, 2, PAL.wood);
    rect(g, 5, 11, 6, 3, PAL.woodD); rect(g, 6, 11, 4, 2, PAL.wood);
  } else {
    rect(g, 0, 5, 16, 3, PAL.woodD); rect(g, 0, 5, 16, 2, PAL.wood);
    rect(g, 0, 10, 16, 3, PAL.woodD); rect(g, 0, 10, 16, 2, PAL.wood);
    for (const x of [1, 11]) { rect(g, x, 3, 4, 12, PAL.woodD); rect(g, x + 1, 3, 2, 11, PAL.wood); rect(g, x + 1, 3, 1, 11, PAL.woodL); }
  }
}
function tSand(g, v) {
  rect(g, 0, 0, 16, 16, PAL.sand);
  for (let i = 0; i < 6; i++) rect(g, Math.floor(hash(v, i, 51) * 16), Math.floor(hash(v, i, 52) * 16), 1, 1, PAL.sandD);
}
function tBridge(g, vertical) {
  rect(g, 0, 0, 16, 16, PAL.water);
  rect(g, vertical ? 1 : 0, vertical ? 0 : 1, vertical ? 14 : 16, vertical ? 16 : 14, PAL.wood);
  for (let i = 0; i < 4; i++) {
    if (vertical) rect(g, 1, i * 4 + 3, 14, 1, PAL.woodD); else rect(g, i * 4 + 3, 1, 1, 14, PAL.woodD);
  }
  if (vertical) { rect(g, 0, 0, 2, 16, PAL.woodD); rect(g, 14, 0, 2, 16, PAL.woodD); }
  else { rect(g, 0, 0, 16, 2, PAL.woodD); rect(g, 0, 14, 16, 2, PAL.woodD); }
}
function tCliff(g, v) {
  rect(g, 0, 0, 16, 16, PAL.cliffD);
  const off = Math.floor(hash(v, 1, 61) * 3);
  for (const [x, y, r] of [[4, 4, 4], [12, 3, 3], [8, 10, 5], [15, 12, 3], [1, 13, 3]]) {
    disc(g, x + off - 1, y, r, PAL.cliff);
    disc(g, x + off - 2, y - 1, Math.max(1, r - 2), PAL.cliffL);
  }
  rect(g, 0, 15, 16, 1, 'rgba(0,0,0,0.18)');
}
function tSnow(g, v) {
  rect(g, 0, 0, 16, 16, PAL.snow);
  for (let i = 0; i < 5; i++) rect(g, Math.floor(hash(v, i, 71) * 15), Math.floor(hash(v, i, 72) * 15), 2, 1, PAL.snowD);
}
function tStone(g, v) {
  rect(g, 0, 0, 16, 16, PAL.stoneD);
  const s = [[1, 1, 6, 6], [9, 1, 6, 5], [1, 9, 5, 6], [8, 8, 7, 7]];
  for (const [x, y, w, h] of s) { rect(g, x, y, w, h, PAL.stone); rect(g, x, y, w, 1, '#dcdce4'); }
  if (hash(v, 1, 81) < 0.5) rect(g, 3, 3, 1, 1, PAL.stoneD);
}

const TILE_FN = {
  g: (g, v) => tGrass(g, v),
  G: (g) => tTall(g),
  p: (g, v) => tPath(g, v),
  t: (g, v) => tTree(g, v, false),
  T: (g, v) => tTree(g, v, true),
  o: (g, v) => tFlower(g, v),
  f: (g, v) => tFence(g, v, false),
  F: (g, v) => tFence(g, v, true),
  s: (g, v) => tSand(g, v),
  b: (g) => tBridge(g, false),
  k: (g) => tBridge(g, true),
  c: (g, v) => tCliff(g, v),
  n: (g, v) => tSnow(g, v),
  N: (g) => tTall(g, '#d8ecf0', '#78a8b0', '#ffffff'),
  q: (g, v) => tStone(g, v),
  d: (g, v) => tGrass(g, v, PAL.forest, PAL.forestD, PAL.forestL),
  x: (g, v) => { tSnow(g, v); drawTreeOn(g, 0, 0, hash(v, 2, 33), 'snow'); },
};
export function tile(ch, v, frame) {
  if (ch === 'w') return cached('w' + frame, 16, 16, (g) => tWater(g, frame));
  const vv = ch === 'G' || ch === 'N' || ch === 'b' || ch === 'k' ? 0 : v;
  return cached(ch + vv, 16, 16, (g) => (TILE_FN[ch] || TILE_FN.g)(g, vv));
}

// ---------------- Buildings & objects (drawn at world pixel x, y) ----------------
function building(g, x, y, w, h, o) {
  const W = w * 16, H = h * 16, rh = Math.floor(H * 0.5);
  rect(g, x + 2, y + H - 2, W - 2, 3, 'rgba(0,0,0,0.18)');
  rect(g, x + 1, y + rh - 1, W - 2, H - rh, o.wallD);
  rect(g, x + 2, y + rh - 1, W - 4, H - rh - 2, o.wall);
  for (let c = 0; c < w; c++) {
    if (c === o.door) continue;
    const wx = x + c * 16 + 4, wy = y + rh + 3;
    rect(g, wx - 1, wy - 1, 10, 8, o.wallD); rect(g, wx, wy, 8, 6, '#8cc8f0'); rect(g, wx, wy, 3, 2, '#d0ecff'); rect(g, wx + 4, wy, 1, 6, o.wallD);
  }
  const dx = x + o.door * 16 + 3;
  rect(g, dx - 1, y + H - 14, 12, 14, '#3a2414'); rect(g, dx, y + H - 13, 10, 13, o.doorC || '#8a5a30'); rect(g, dx + 1, y + H - 12, 8, 1, '#a87040'); rect(g, dx + 7, y + H - 7, 2, 2, '#f0d060');
  // roof
  rect(g, x - 2, y + rh - 4, W + 4, 5, o.roofD);
  for (let r = 0; r < rh - 3; r++) {
    const inset = Math.max(0, Math.floor((rh - 3 - r) * 0.18));
    rect(g, x - 1 + inset, y + r, W + 2 - inset * 2, 1, r % 4 === 3 ? o.roofD : o.roof);
  }
  rect(g, x + 3, y + 1, W - 6, 1, shade(o.roof, 0.35));
}
export function drawHouse(g, x, y) {
  rect(g, x + 44, y - 4, 7, 12, '#8a6050'); rect(g, x + 43, y - 5, 9, 2, '#6a4838');
  building(g, x, y, 4, 3, { roof: '#d84838', roofD: '#a02c24', wall: '#f8ecd0', wallD: '#c8b08a', door: 1 });
}
export function drawShop(g, x, y, t) {
  building(g, x, y, 5, 3, { roof: '#3c7ce0', roofD: '#2654a8', wall: '#fff4dc', wallD: '#c8b08a', door: 2, doorC: '#4a70b0' });
  for (let i = 0; i < 10; i++) rect(g, x + i * 8, y + 22, 8, 5, i % 2 ? '#ffffff' : '#e84848');
  rect(g, x, y + 27, 80, 1, '#a83030');
  rect(g, x + 50, y + 30, 22, 12, '#7a4e2c'); rect(g, x + 51, y + 31, 20, 10, '#f8e8b8');
  g.drawImage(itemIcon('graine:radis'), x + 53, y + 28);
  rect(g, x + 63, y + 33, 6, 6, '#f8c830'); rect(g, x + 64, y + 34, 4, 4, '#ffe070');
}
function siteBase(g, x, y, w, h, t) {
  const W = w * 16, H = h * 16;
  rect(g, x + 1, y + 4, W - 2, H - 5, '#c8a870');
  for (let i = 0; i < 6; i++) rect(g, x + 2 + Math.floor(hash(i, w, 91) * (W - 6)), y + 6 + Math.floor(hash(i, h, 92) * (H - 10)), 3, 1, '#a88850');
  for (const px of [x + 2, x + W - 5]) { rect(g, px, y + 2, 3, H - 4, PAL.woodD); rect(g, px + 1, y + 2, 1, H - 4, PAL.wood); }
  rect(g, x + 2, y + 6, W - 4, 2, PAL.wood); rect(g, x + 2, y + H - 10, W - 4, 2, PAL.wood);
  rect(g, x + 8, y + H - 9, 14, 3, '#b07840'); rect(g, x + 10, y + H - 12, 12, 3, '#c88a50');
  rect(g, x + W - 22, y + H - 10, 6, 6, '#9a9aa8'); rect(g, x + W - 17, y + H - 8, 5, 4, '#b4b4c0');
  // sign
  const sx = x + W / 2 - 7, sy = y + 10 + Math.round(Math.sin(t * 3) * 1);
  rect(g, sx + 6, sy + 10, 2, 8, PAL.woodD); rect(g, sx, sy, 14, 11, PAL.woodD); rect(g, sx + 1, sy + 1, 12, 9, '#f8e0a8');
  rect(g, sx + 6, sy + 2, 2, 4, '#c03030'); rect(g, sx + 6, sy + 7, 2, 2, '#c03030');
}
export function drawSite(g, x, y, w, h, t) { siteBase(g, x, y, w, h, t); }
export function drawMill(g, x, y, t) {
  // 3x4 tiles: stone tower with rotating sails
  const cx = x + 24, cy = y + 20;
  rect(g, x + 6, y + 60, 38, 4, 'rgba(0,0,0,0.18)');
  for (let r = 0; r < 44; r++) {
    const half = 11 + Math.floor(r * 0.16);
    rect(g, cx - half, y + 18 + r, half * 2, 1, r % 6 === 5 ? '#a89a88' : '#d8ccb8');
  }
  for (let r = 0; r < 44; r += 6) for (let k = 0; k < 3; k++) rect(g, cx - 10 + ((r / 6) % 2) * 4 + k * 8, y + 18 + r, 1, 6, '#b8aa96');
  for (let r = 0; r < 14; r++) rect(g, cx - Math.floor(r * 0.95) - 1, y + 6 + r, Math.floor(r * 1.9) + 2, 1, r % 3 === 2 ? '#8a3a2a' : '#b44c34');
  rect(g, cx - 5, y + 50, 10, 14, '#3a2414'); rect(g, cx - 4, y + 51, 8, 13, '#8a5a30');
  rect(g, cx - 3, y + 30, 6, 6, '#3a2414'); rect(g, cx - 2, y + 31, 4, 4, '#8cc8f0');
  const a0 = t * 1.4;
  for (let b = 0; b < 4; b++) {
    const a = a0 + (b * Math.PI) / 2, ca = Math.cos(a), sa = Math.sin(a);
    for (let s = 3; s <= 22; s++) {
      const px = Math.round(cx + ca * s), py = Math.round(cy + sa * s);
      rect(g, px, py, 1, 1, '#6a4a2a');
      if (s > 6) { const ox = Math.round(-sa * 4), oy = Math.round(ca * 4); rect(g, Math.round(cx + ca * s - sa * 2), Math.round(cy + sa * s + ca * 2), 2, 2, (s % 3 ? '#f4ecdc' : '#d8ccb4')); rect(g, px + ox, py + oy, 1, 1, '#c8b898'); }
    }
  }
  disc(g, cx, cy, 2, '#5a3a20');
}
export function drawBakery(g, x, y, t) {
  rect(g, x + 46, y - 6, 8, 14, '#9a5a44'); rect(g, x + 45, y - 7, 10, 2, '#6a3a2a');
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.6 + i / 3) % 1;
    disc(g, Math.round(x + 50 + Math.sin(p * 6 + i) * 3), Math.round(y - 10 - p * 18), Math.max(1, Math.round(3 - p * 1.5)), `rgba(240,240,240,${0.75 - p * 0.7})`);
  }
  building(g, x, y, 4, 3, { roof: '#9a6034', roofD: '#6a3e20', wall: '#fbe4c0', wallD: '#c89a68', door: 1, doorC: '#a85a30' });
  rect(g, x + 36, y + 28, 22, 12, '#7a4e2c'); rect(g, x + 37, y + 29, 20, 10, '#f8e8b8');
  g.drawImage(itemIcon('pain'), x + 39, y + 26);
}
export function drawPress(g, x, y) {
  building(g, x, y, 4, 3, { roof: '#7a3a6a', roofD: '#52244a', wall: '#f4e4d4', wallD: '#b8a088', door: 1, doorC: '#6a3a5a' });
  rect(g, x + 38, y + 30, 16, 16, '#6a4020'); rect(g, x + 39, y + 31, 14, 14, '#a86a38');
  rect(g, x + 38, y + 34, 16, 2, '#4a4a50'); rect(g, x + 38, y + 41, 16, 2, '#4a4a50');
  g.drawImage(itemIcon('jusPomme'), x + 52, y + 26);
}
export function drawGreenhouse(g, x, y, t) {
  const W = 64, H = 48;
  rect(g, x + 2, y + H - 2, W - 2, 3, 'rgba(0,0,0,0.18)');
  rect(g, x + 1, y + 10, W - 2, H - 10, '#c8ecf8');
  for (let i = 0; i < 4; i++) rect(g, x + 1 + i * 16, y + 10, 1, H - 10, '#f8ffff');
  for (let i = 0; i < 5; i++) { disc(g, x + 8 + i * 12, y + H - 10, 4, '#3a9a3a'); disc(g, x + 8 + i * 12, y + H - 12, 2, i % 2 ? '#f05080' : '#f8d030'); }
  for (let r = 0; r < 12; r++) rect(g, x + 6 - Math.floor(r / 2) + 6, y + r, W - 24 + r, 1, r % 4 === 3 ? '#88c8e8' : '#b8e4f8');
  rect(g, x, y + 10, W, 2, '#88b8c8'); rect(g, x, y + H - 2, W, 2, '#88b8c8');
  rect(g, x + 26, y + H - 16, 12, 16, '#5a8aa0'); rect(g, x + 27, y + H - 15, 10, 15, '#a8dcf0');
  const sp = Math.floor(t * 4) % 4;
  rect(g, x + 10 + sp * 12, y + 14, 1, 3, '#ffffff'); rect(g, x + 9 + sp * 12, y + 15, 3, 1, '#ffffff');
}
export function drawRock(g, x, y, small) {
  if (small) { rect(g, x + 4, y + 10, 8, 4, '#9a9aa8'); rect(g, x + 5, y + 10, 4, 1, '#c8c8d0'); return; }
  ellipse(g, x + 8, y + 13, 7, 2, 'rgba(0,0,0,0.15)');
  ellipse(g, x + 8, y + 9, 7, 6, '#6e6e7c');
  ellipse(g, x + 8, y + 8, 6, 5, '#a2a2b0');
  ellipse(g, x + 6, y + 6, 3, 2, '#c8c8d4');
  rect(g, x + 9, y + 9, 3, 1, '#6e6e7c'); rect(g, x + 11, y + 10, 1, 2, '#6e6e7c');
}
export function drawBigRock(g, x, y) {
  ellipse(g, x + 8, y + 14, 9, 2, 'rgba(0,0,0,0.2)');
  ellipse(g, x + 8, y + 7, 9, 8, '#5e5a64');
  ellipse(g, x + 8, y + 6, 8, 7, '#8e8a96');
  ellipse(g, x + 5, y + 3, 4, 2, '#b8b4c0');
  rect(g, x + 8, y + 5, 1, 6, '#5e5a64'); rect(g, x + 9, y + 9, 3, 1, '#5e5a64');
}
export function drawChopTree(g, x, y, stump) {
  if (stump) {
    rect(g, x + 4, y + 9, 8, 6, PAL.trunk); rect(g, x + 4, y + 8, 8, 2, '#c8a068'); rect(g, x + 6, y + 8, 4, 1, '#a07848');
    return;
  }
  rect(g, x + 6, y + 10, 4, 6, PAL.trunk); rect(g, x + 7, y + 10, 1, 6, '#966438');
  disc(g, x + 8, y + 6, 6, '#2e7a3a');
  disc(g, x + 8, y + 5, 5, '#58b048');
  rect(g, x + 5, y + 2, 3, 2, '#90d870');
  rect(g, x + 10, y + 12, 3, 1, '#e8d8a8');
}
export function drawChest(g, x, y, open) {
  rect(g, x + 2, y + 13, 12, 2, 'rgba(0,0,0,0.18)');
  rect(g, x + 2, y + 6, 12, 8, '#7a4420'); rect(g, x + 3, y + 7, 10, 6, '#b8742c');
  if (open) { rect(g, x + 2, y + 2, 12, 4, '#7a4420'); rect(g, x + 3, y + 3, 10, 2, '#3a2010'); }
  else { rect(g, x + 2, y + 3, 12, 4, '#7a4420'); rect(g, x + 3, y + 4, 10, 2, '#c8843c'); rect(g, x + 7, y + 6, 2, 3, '#f8d040'); }
  rect(g, x + 2, y + 9, 12, 1, '#f8d040');
}
export function drawSign(g, x, y) {
  rect(g, x + 7, y + 8, 2, 7, PAL.woodD);
  rect(g, x + 2, y + 2, 12, 8, PAL.woodD); rect(g, x + 3, y + 3, 10, 6, PAL.wood);
  rect(g, x + 4, y + 4, 8, 1, PAL.woodD); rect(g, x + 4, y + 6, 6, 1, PAL.woodD);
}
export function drawMailbox(g, x, y, flag) {
  rect(g, x + 7, y + 8, 2, 7, '#6a4a30');
  rect(g, x + 3, y + 3, 10, 6, '#3a68c8'); rect(g, x + 3, y + 3, 10, 1, '#6a98f0'); rect(g, x + 4, y + 5, 2, 2, '#1a3888');
  if (flag) { rect(g, x + 12, y, 1, 5, '#a02020'); rect(g, x + 12, y, 3, 2, '#f03030'); }
}
export function drawCrate(g, x, y) {
  rect(g, x + 1, y + 13, 14, 2, 'rgba(0,0,0,0.18)');
  rect(g, x + 1, y + 4, 14, 10, '#7a4e2c'); rect(g, x + 2, y + 5, 12, 8, '#c8945a');
  rect(g, x + 2, y + 8, 12, 1, '#8a5a30'); rect(g, x + 7, y + 5, 2, 8, '#8a5a30');
  rect(g, x + 4, y + 1, 8, 4, '#e8406a'); rect(g, x + 5, y + 2, 2, 1, '#fff0f0');
}
export function drawBoard(g, x, y) {
  for (const px of [x + 3, x + 27]) rect(g, px, y + 6, 2, 10, PAL.woodD);
  rect(g, x + 1, y - 2, 30, 13, PAL.woodD); rect(g, x + 2, y - 1, 28, 11, '#d8b07a');
  const cols = ['#ffffff', '#fff2a8', '#d8f0ff'];
  for (let i = 0; i < 3; i++) { rect(g, x + 4 + i * 9, y + 1, 7, 7, cols[i]); rect(g, x + 5 + i * 9, y + 3, 5, 1, '#9a8a7a'); rect(g, x + 5 + i * 9, y + 5, 4, 1, '#9a8a7a'); rect(g, x + 7 + i * 9, y, 1, 1, '#d03030'); }
}
export function drawFountain(g, x, y, t) {
  ellipse(g, x + 16, y + 20, 15, 9, '#8a8a98');
  ellipse(g, x + 16, y + 19, 13, 7, PAL.water);
  rect(g, x + 14, y + 8, 4, 12, '#a8a8b4');
  ellipse(g, x + 16, y + 8, 5, 2, '#c8c8d4');
  for (let i = 0; i < 4; i++) {
    const p = (t * 1.2 + i / 4) % 1;
    const dx = Math.round((i % 2 ? -1 : 1) * p * 9), dy = Math.round(-6 * Math.sin(p * Math.PI));
    rect(g, x + 16 + dx, y + 8 + dy, 1, 2, PAL.waterL);
  }
  rect(g, x + 8 + (Math.floor(t * 3) % 6) * 2, y + 19, 3, 1, PAL.waterL);
}
export function drawBush(g, x, y, kind, empty) {
  ellipse(g, x + 8, y + 13, 7, 2, 'rgba(0,0,0,0.15)');
  if (kind === 'coquillage') {
    if (!empty) { g.drawImage(itemIcon('coquillage'), x, y + 1); }
    else rect(g, x + 6, y + 10, 3, 1, PAL.sandD);
    return;
  }
  disc(g, x + 8, y + 9, 6, '#2e7a3a'); disc(g, x + 8, y + 8, 5, '#4aa246');
  rect(g, x + 5, y + 5, 2, 1, '#76c458');
  if (empty) return;
  if (kind === 'champignon') { disc(g, x + 5, y + 11, 2, '#d83830'); rect(g, x + 4, y + 10, 1, 1, '#fff'); disc(g, x + 11, y + 12, 2, '#d83830'); rect(g, x + 11, y + 11, 1, 1, '#fff'); }
  else { for (const [a, b] of [[5, 7], [10, 6], [8, 10], [11, 10], [5, 11]]) { rect(g, x + a, y + b, 2, 2, '#6048c8'); rect(g, x + a, y + b, 1, 1, '#a898f8'); } }
}
export function drawCrystal(g, x, y, t, empty) {
  ellipse(g, x + 8, y + 13, 7, 2, 'rgba(0,0,0,0.15)');
  ellipse(g, x + 8, y + 11, 7, 4, '#8a8496');
  if (empty) return;
  const cs = [[5, 3, '#78d8f8'], [10, 5, '#c088f8'], [8, 1, '#a8ecff']];
  for (const [cx, top, c] of cs) {
    for (let r = 0; r < 10 - (top - 1); r++) { const w = Math.min(2, Math.floor(r / 2) + 1); rect(g, x + cx - w + 1, y + top + r, w * 2 - 1 + 1, 1, c); }
    rect(g, x + cx, y + top + 1, 1, 4, '#ffffff');
  }
  if (Math.floor(t * 2) % 3 === 0) { rect(g, x + 13, y + 1, 1, 3, '#ffffff'); rect(g, x + 12, y + 2, 3, 1, '#ffffff'); }
}
export function drawBrokenBridge(g, x, y) {
  rect(g, x, y + 1, 9, 14, PAL.wood); rect(g, x, y + 1, 9, 2, PAL.woodD); rect(g, x, y + 13, 9, 2, PAL.woodD);
  for (let i = 0; i < 2; i++) rect(g, x + 3 + i * 4, y + 1, 1, 14, PAL.woodD);
  rect(g, x + 9, y + 4, 2, 3, PAL.wood); rect(g, x + 8, y + 10, 3, 3, PAL.wood);
  rect(g, x + 24, y + 1, 8, 14, PAL.wood); rect(g, x + 24, y + 1, 8, 2, PAL.woodD); rect(g, x + 24, y + 13, 8, 2, PAL.woodD);
  rect(g, x + 27, y + 1, 1, 14, PAL.woodD);
  rect(g, x + 15, y + 6, 4, 2, PAL.woodL);
}
export function drawAncient(g, x, y, t, awake) {
  // 3x3 tiles
  ellipse(g, x + 24, y + 44, 18, 4, 'rgba(0,0,0,0.2)');
  rect(g, x + 17, y + 24, 14, 22, '#6a4426'); rect(g, x + 19, y + 24, 3, 22, '#8a5e36');
  rect(g, x + 12, y + 42, 8, 4, '#6a4426'); rect(g, x + 28, y + 42, 8, 4, '#6a4426');
  disc(g, x + 24, y + 16, 17, '#1e5030'); disc(g, x + 24, y + 14, 15, '#2e7040'); disc(g, x + 20, y + 11, 9, '#3e8a48');
  for (let i = 0; i < 6; i++) rect(g, x + 10 + Math.floor(hash(i, 3, 5) * 28), y + 4 + Math.floor(hash(i, 4, 5) * 20), 2, 2, '#6ab858');
  // face
  if (awake) { rect(g, x + 20, y + 30, 2, 2, '#f8e070'); rect(g, x + 26, y + 30, 2, 2, '#f8e070'); rect(g, x + 22, y + 36, 4, 1, '#3a2010'); }
  else { rect(g, x + 19, y + 31, 4, 1, '#3a2010'); rect(g, x + 25, y + 31, 4, 1, '#3a2010'); }
  for (let i = 0; i < 4; i++) {
    const p = (t * 0.3 + i / 4) % 1;
    rect(g, Math.round(x + 8 + i * 10 + Math.sin(p * 6) * 3), Math.round(y + 30 - p * 30), 1, 1, awake ? '#fff8a0' : '#c8f0c0');
  }
}
export function drawFishSpot(g, x, y, t) {
  const r = 3 + Math.floor((t * 2) % 3);
  g.strokeStyle = 'rgba(220,240,255,0.8)'; g.lineWidth = 1;
  g.strokeRect(x + 8 - r, y + 8 - Math.floor(r / 2), r * 2, r);
  const bob = Math.round(Math.sin(t * 4));
  rect(g, x + 7, y + 5 + bob, 3, 3, '#f03030'); rect(g, x + 7, y + 7 + bob, 3, 2, '#ffffff');
}
export function drawPerch(g, x, y) {
  rect(g, x + 7, y + 6, 2, 10, PAL.woodD);
  rect(g, x + 2, y + 9, 12, 2, PAL.woodD); rect(g, x + 3, y + 9, 10, 1, PAL.wood);
}
export function drawOwl(g, x, y, t) {
  drawPerch(g, x, y + 4);
  const bob = Math.round(Math.sin(t * 2)) * 0;
  const yy = y - 4 + bob;
  ellipse(g, x + 8, yy + 8, 6, 7, '#8a5a34');
  ellipse(g, x + 8, yy + 10, 4, 4, '#e8d0a0');
  rect(g, x + 3, yy, 2, 3, '#8a5a34'); rect(g, x + 11, yy, 2, 3, '#8a5a34');
  const blink = Math.floor(t * 0.7) % 5 === 0 && (t % 1.4285) < 0.15;
  for (const ex of [5, 10]) {
    disc(g, x + ex, yy + 6, 2, '#ffffff');
    if (!blink) rect(g, x + ex, yy + 6, 1, 1, '#202020'); else rect(g, x + ex - 1, yy + 6, 3, 1, '#202020');
  }
  rect(g, x + 7, yy + 8, 2, 2, '#f0a020');
  // graduation cap
  rect(g, x + 3, yy - 2, 10, 2, '#303040'); rect(g, x + 6, yy - 4, 4, 2, '#303040'); rect(g, x + 12, yy - 2, 1, 4, '#f8d030');
}

// ---------------- Garden plots ----------------
function sprout(g, x, y, c = '#58b848') { rect(g, x, y, 1, 3, c); rect(g, x - 2, y, 2, 1, c); rect(g, x + 1, y - 1, 2, 1, c); }
export function drawPlot(g, x, y, p, prog, t, unlocked) {
  if (!unlocked) {
    rect(g, x + 2, y + 2, 12, 12, 'rgba(60,110,40,0.35)');
    for (const [a, b] of [[2, 2], [13, 2], [2, 13], [13, 13]]) rect(g, x + a, y + b, 1, 1, PAL.woodD);
    return;
  }
  const wet = p.wet && Date.now() - p.wet < 20000;
  rect(g, x + 1, y + 1, 14, 14, wet ? '#6a4224' : '#8c5c34');
  rect(g, x + 1, y + 1, 14, 1, wet ? '#7c5030' : '#a87448');
  for (const r of [4, 8, 12]) rect(g, x + 2, y + r, 12, 1, wet ? '#553418' : '#74482a');
  if (wet) { rect(g, x + 4, y + 6, 1, 1, '#a6ccff'); rect(g, x + 10, y + 10, 1, 1, '#a6ccff'); }
  if (!p.crop) return;
  if (p.fert) rect(g, x + 12, y + 2, 2, 2, '#f8e070');
  if (prog < 0.2) { rect(g, x + 4, y + 7, 2, 1, '#d8b078'); rect(g, x + 9, y + 9, 2, 1, '#d8b078'); rect(g, x + 7, y + 11, 2, 1, '#d8b078'); return; }
  if (prog < 0.5) { sprout(g, x + 5, y + 6); sprout(g, x + 10, y + 9); return; }
  if (prog < 1) {
    disc(g, x + 8, y + 8, 4, '#3a8a34'); disc(g, x + 8, y + 7, 3, '#58b848');
    rect(g, x + 6, y + 5, 1, 1, '#8ad866');
    const bar = Math.round(prog * 10);
    rect(g, x + 3, y + 14, 10, 1, 'rgba(0,0,0,0.35)'); rect(g, x + 3, y + 14, bar, 1, '#f8e048');
    return;
  }
  disc(g, x + 8, y + 10, 4, '#3a8a34');
  const bob = Math.round(Math.sin(t * 4 + x) * 1);
  g.drawImage(itemIcon(p.crop), x, y - 5 + bob);
  if (Math.floor(t * 3 + x) % 4 === 0) { rect(g, x + 14, y - 4, 1, 3, '#ffffff'); rect(g, x + 13, y - 3, 3, 1, '#ffffff'); }
}

// ---------------- People ----------------
// Character fills a 16x16 tile, head pokes 3px above. dir: down|up|left|right. frame 0 idle, 1/2 walking.
export function drawPerson(g, x, y, dir, frame, look) {
  const top = y - 3;
  const P = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a, top + b, w, h); };
  const skin = look.skin || '#f8c898', hair = look.hair || '#6a3a1a', shirt = look.shirt || '#3870d8', pants = look.pants || '#384868', shoe = '#3a2a2a';
  const hat = look.hat, hatD = hat ? shade(hat, -0.3) : null;
  g.fillStyle = 'rgba(0,0,0,0.22)'; g.fillRect(x + 3, y + 14, 10, 2); g.fillRect(x + 4, y + 13, 8, 1);
  const bob = frame ? 1 : 0;
  const lf = frame === 1, rf = frame === 2;
  // legs / dress
  if (look.dress) { P(4, 14, 8, 3, shade(shirt, -0.15)); P(5, 17, 2, 1, shoe); P(9, 17, 2, 1, shoe); }
  else if (dir === 'left' || dir === 'right') {
    P(6, 14, 4, 2, pants);
    P(lf ? 5 : 6, 16, 2, 1, pants); P(rf ? 9 : 8, 16, 2, 1, pants);
    P(lf ? 4 : 6, 17, 3, 1, shoe); P(rf ? 9 : 8, 17, 3, 1, shoe);
  } else {
    P(5, 14, 6, 2, pants);
    P(5, 16, 2, lf ? 0 : 1, pants); P(9, 16, 2, rf ? 0 : 1, pants);
    P(5, lf ? 16 : 17, 3, 1, shoe); P(8, rf ? 16 : 17, 3, 1, shoe);
  }
  const by = bob ? 1 : 0;
  // body
  if (dir === 'left' || dir === 'right') {
    P(5, 9 + by, 6, 5, shirt); P(5, 13 + by, 6, 1, shade(shirt, -0.25));
    const sw = frame === 1 ? -1 : frame === 2 ? 1 : 0;
    P(7 + sw, 10 + by, 2, 3, shade(shirt, -0.15)); P(7 + sw, 13 + by, 2, 1, skin);
    if (look.pack) P(dir === 'left' ? 10 : 4, 9 + by, 2, 4, look.pack);
  } else {
    P(4, 9 + by, 8, 5, shirt); P(4, 13 + by, 8, 1, shade(shirt, -0.25));
    P(3, 10 + by, 1, 3, shirt); P(12, 10 + by, 1, 3, shirt); P(3, 13 + by, 1, 1, skin); P(12, 13 + by, 1, 1, skin);
    if (dir === 'up' && look.pack) { P(5, 9 + by, 6, 5, look.pack); P(6, 10 + by, 4, 1, shade(look.pack, 0.3)); }
    if (dir === 'down' && look.apron) P(5, 10 + by, 6, 4, look.apron);
  }
  // head
  const hy = by;
  if (dir === 'up') {
    P(4, 3 + hy, 8, 6, hair); P(4, 8 + hy, 8, 1, shade(hair, -0.2));
  } else if (dir === 'down') {
    P(4, 3 + hy, 8, 3, hair); P(5, 5 + hy, 6, 4, skin); P(4, 5 + hy, 1, 3, hair); P(11, 5 + hy, 1, 3, hair);
    P(6, 6 + hy, 1, 2, '#282830'); P(9, 6 + hy, 1, 2, '#282830');
    P(5, 8 + hy, 1, 1, '#f8a0a0'); P(10, 8 + hy, 1, 1, '#f8a0a0');
    if (look.beard) P(5, 8 + hy, 6, 2, look.beard);
  } else {
    const L = dir === 'left';
    P(5, 3 + hy, 6, 6, skin); P(L ? 9 : 5, 3 + hy, 2, 5, hair); P(5, 3 + hy, 6, 2, hair);
    P(L ? 6 : 9, 6 + hy, 1, 2, '#282830'); P(L ? 4 : 11, 6 + hy, 1, 2, skin);
    if (look.beard) P(L ? 5 : 7, 8 + hy, 4, 2, look.beard);
  }
  if (look.bun) { P(6, 0 + hy, 4, 3, hair); P(7, 0 + hy, 2, 1, shade(hair, 0.3)); }
  if (hat) {
    P(4, 1 + hy, 8, 3, hat); P(6, 1 + hy, 3, 1, shade(hat, 0.35));
    if (dir === 'down') P(3, 4 + hy, 10, 1, hatD);
    else if (dir === 'left') P(2, 4 + hy, 7, 1, hatD);
    else if (dir === 'right') P(7, 4 + hy, 7, 1, hatD);
    else P(4, 4 + hy, 8, 1, hatD);
    if (look.hatBand) P(4, 3 + hy, 8, 1, look.hatBand);
  }
  if (look.helmet) { P(4, 1 + hy, 8, 3, '#a8a8b8'); P(5, 1 + hy, 3, 1, '#d8d8e4'); P(7, 0 + hy, 2, 1, '#e04040'); }
}

// ---------------- Items (16x16 icons) ----------------
function drawTool(g, id) {
  const k = id.slice(5);
  if (k.startsWith('arrosoir')) {
    const c = { arrosoir: '#6aa0d8', arrosoir1: '#d07a40', arrosoir2: '#c8d0dc', arrosoir3: '#f8c830', arrosoir4: '#8ae8ff' }[k] || '#6aa0d8';
    const d = shade(c, -0.35);
    rect(g, 3, 7, 8, 7, d); rect(g, 4, 8, 6, 5, c); rect(g, 4, 8, 2, 4, shade(c, 0.4));
    for (let i = 0; i < 4; i++) rect(g, 11 + i, 9 - i, 1, 2, d);
    rect(g, 14, 4, 2, 2, d); rect(g, 5, 3, 4, 1, d); rect(g, 4, 4, 1, 3, d); rect(g, 9, 4, 1, 3, d);
    if (k === 'arrosoir3' || k === 'arrosoir4') { rect(g, 1, 2, 1, 3, '#fff8b0'); rect(g, 0, 3, 3, 1, '#fff8b0'); }
    return;
  }
  switch (k) {
    case 'hache': for (let i = 0; i < 11; i++) rect(g, 3 + i, 14 - i, 2, 1, '#8a5a30'); rect(g, 9, 2, 5, 6, '#7a7a88'); rect(g, 10, 3, 4, 4, '#c8c8d4'); rect(g, 13, 2, 1, 6, '#ffffff'); break;
    case 'pioche': for (let i = 0; i < 11; i++) rect(g, 4 + i * 0.6, 4 + i, 2, 1, '#8a5a30'); for (let i = 0; i < 12; i++) rect(g, 2 + i, 4 - Math.round(Math.sin((i / 11) * Math.PI) * 3), 1, 2, '#9a9aa8'); break;
    case 'bottes': for (const x of [2, 9]) { rect(g, x, 3, 4, 9, '#c03828'); rect(g, x, 11, 6, 3, '#c03828'); rect(g, x, 13, 6, 1, '#5a2a1a'); rect(g, x + 1, 4, 1, 6, '#f07060'); } break;
    case 'panier': ellipse(g, 8, 11, 7, 4, '#8a5a30'); ellipse(g, 8, 10, 6, 3, '#c8945a'); for (let i = 3; i < 14; i += 3) rect(g, i, 8, 1, 6, '#8a5a30'); rect(g, 3, 4, 1, 5, '#8a5a30'); rect(g, 12, 4, 1, 5, '#8a5a30'); rect(g, 4, 3, 8, 1, '#8a5a30'); rect(g, 6, 7, 2, 2, '#e8406a'); rect(g, 9, 6, 2, 2, '#f08a24'); break;
    case 'epouvantail': rect(g, 7, 4, 2, 12, '#8a5a30'); rect(g, 2, 7, 12, 2, '#8a5a30'); disc(g, 8, 4, 3, '#f0d890'); rect(g, 6, 3, 1, 1, '#202020'); rect(g, 9, 3, 1, 1, '#202020'); rect(g, 4, 1, 8, 2, '#a83a28'); rect(g, 6, 0, 4, 1, '#a83a28'); rect(g, 5, 9, 6, 4, '#3a70c8'); break;
    case 'arroseur': rect(g, 7, 8, 2, 7, '#7a7a88'); rect(g, 4, 14, 8, 2, '#5a5a68'); rect(g, 5, 6, 6, 2, '#9a9aa8'); for (const [x, y] of [[2, 2], [5, 1], [10, 1], [13, 2], [1, 5], [14, 5]]) rect(g, x, y, 1, 2, '#78b8f8'); break;
    case 'etable': rect(g, 2, 7, 12, 8, '#b83a2c'); for (let r = 0; r < 6; r++) rect(g, 1 + r, 6 - r, 14 - r * 2, 1, '#8a6a58'); rect(g, 5, 9, 6, 6, '#f8f0e0'); rect(g, 6, 10, 4, 5, '#9a3024'); break;
    case 'plots': rect(g, 1, 3, 14, 12, '#6a4224'); rect(g, 2, 4, 12, 10, '#8c5c34'); for (const r of [7, 11]) rect(g, 2, r, 12, 1, '#74482a'); rect(g, 7, 2, 1, 5, '#3a9a34'); rect(g, 5, 2, 2, 2, '#58c048'); rect(g, 8, 1, 2, 2, '#58c048'); break;
    default: disc(g, 8, 8, 5, '#888');
  }
}
function drawItemShape(g, id) {
  if (id.startsWith('tool:')) return drawTool(g, id);
  const it = ITEMS[id] || { shape: 'stone', c1: '#888', c2: '#ccc' };
  const c1 = it.c1, c2 = it.c2, d1 = c1 ? shade(c1, -0.3) : '#555';
  const leaf = (x, y) => { rect(g, x, y, 1, 4, '#3a9a34'); rect(g, x - 2, y, 2, 2, '#58c048'); rect(g, x + 1, y - 1, 2, 2, '#58c048'); rect(g, x - 1, y - 2, 1, 2, '#3a9a34'); };
  switch (it.shape) {
    case 'root': disc(g, 8, 10, 4, d1); disc(g, 8, 10, 3, c1); rect(g, 6, 8, 2, 2, c2); rect(g, 8, 14, 1, 2, '#f8e0e0'); leaf(8, 3); break;
    case 'carrot':
      for (let r = 0; r < 10; r++) { const w = Math.max(1, 6 - Math.floor(r / 1.7)); rect(g, 8 - Math.floor(w / 2), 5 + r, w, 1, r % 3 === 1 ? d1 : c1); }
      rect(g, 6, 5, 1, 4, c2); leaf(8, 1); rect(g, 10, 1, 1, 3, '#58c048'); break;
    case 'grain':
      for (const sx of [5, 8, 11]) { rect(g, sx, 7, 1, 9, '#b89040'); for (let k = 0; k < 4; k++) { rect(g, sx - 1, 1 + k * 2 + (sx === 8 ? -1 : 0), 1, 2, c1); rect(g, sx + 1, 1 + k * 2 + (sx === 8 ? -1 : 0), 1, 2, c2); } }
      rect(g, 4, 11, 9, 1, '#d84040'); break;
    case 'round': disc(g, 8, 9, 6, d1); disc(g, 8, 9, 5, c1); rect(g, 5, 6, 2, 2, c2); rect(g, 7, 2, 3, 2, '#3a9a34'); rect(g, 6, 3, 5, 1, '#58c048'); break;
    case 'apple': disc(g, 8, 9, 6, d1); disc(g, 8, 9, 5, c1); rect(g, 5, 6, 2, 2, c2); rect(g, 8, 1, 1, 4, '#6a4020'); rect(g, 9, 2, 3, 2, '#58c048'); break;
    case 'berry': {
      const ws = [8, 10, 10, 10, 8, 8, 6, 4, 2];
      ws.forEach((w, r) => rect(g, 8 - w / 2, 5 + r, w, 1, r > 6 ? d1 : c1));
      for (const [a, b] of [[5, 7], [9, 7], [7, 9], [11, 9], [6, 11], [9, 11], [8, 13]]) rect(g, a, b, 1, 1, c2);
      rect(g, 4, 3, 8, 2, '#3a9a34'); rect(g, 7, 1, 2, 2, '#58c048'); break;
    }
    case 'cob':
      ellipse(g, 8, 8, 3, 6, d1); ellipse(g, 8, 8, 2, 5, c1);
      for (let r = 3; r < 14; r += 2) rect(g, 6, r, 5, 1, shade(c1, -0.12));
      rect(g, 3, 9, 3, 6, '#58b038'); rect(g, 10, 9, 3, 6, '#58b038'); rect(g, 4, 8, 1, 2, '#78c848'); break;
    case 'flower':
      for (let k = 0; k < 8; k++) { const a = (k * Math.PI) / 4; disc(g, Math.round(8 + Math.cos(a) * 5), Math.round(8 + Math.sin(a) * 5), 2, c1); }
      disc(g, 8, 8, 3, c2); rect(g, 7, 7, 1, 1, shade(c2, 0.3)); break;
    case 'pumpkin':
      ellipse(g, 8, 10, 7, 5, d1); ellipse(g, 8, 10, 6, 4, c1);
      rect(g, 5, 7, 1, 7, c2); rect(g, 10, 7, 1, 7, c2); rect(g, 7, 2, 2, 4, '#6a4020'); rect(g, 9, 3, 3, 1, '#58c048'); break;
    case 'melon': {
      disc(g, 8, 9, 6, '#2a6a2a');
      const rb = ['#f05050', '#f8a030', '#f8e040', '#58c858', '#5898f8', '#a060e0'];
      for (let i = 0; i < 6; i++) rect(g, 3 + i * 2, 5, 2, 9, rb[i]);
      disc(g, 6, 6, 1, '#ffffff'); break;
    }
    case 'golden':
      disc(g, 8, 9, 6, '#c89810'); disc(g, 8, 9, 5, c1); disc(g, 6, 7, 2, c2);
      rect(g, 1, 2, 1, 3, '#fff8b0'); rect(g, 0, 3, 3, 1, '#fff8b0'); rect(g, 14, 12, 1, 3, '#fff8b0'); rect(g, 13, 13, 3, 1, '#fff8b0'); break;
    case 'sack':
      rect(g, 4, 5, 8, 10, '#a08060'); rect(g, 5, 4, 6, 11, c1); rect(g, 3, 7, 10, 7, c1); rect(g, 3, 13, 10, 2, c2);
      rect(g, 6, 2, 4, 2, c2); rect(g, 7, 1, 2, 1, '#a08060'); rect(g, 6, 8, 4, 3, '#e8d8b8'); rect(g, 7, 9, 2, 1, c2); break;
    case 'loaf':
      ellipse(g, 8, 10, 7, 4, '#8a5020'); ellipse(g, 8, 9, 6, 4, c1);
      for (const sx of [4, 7, 10]) { rect(g, sx, 7, 2, 1, c2); rect(g, sx + 1, 8, 2, 1, c2); } break;
    case 'pie':
      ellipse(g, 8, 10, 7, 4, '#b07838'); ellipse(g, 8, 9, 7, 4, c2); ellipse(g, 8, 9, 5, 3, c1);
      rect(g, 5, 8, 2, 1, shade(c1, 0.35)); rect(g, 10, 10, 2, 1, shade(c1, -0.25)); break;
    case 'pizza':
      disc(g, 8, 8, 7, '#d8a040'); disc(g, 8, 8, 6, c2); disc(g, 8, 8, 5, c1);
      for (const [a, b] of [[6, 6], [10, 7], [7, 10], [10, 11]]) disc(g, a, b, 1, '#a02010');
      rect(g, 5, 9, 1, 1, '#58c048'); rect(g, 11, 5, 1, 1, '#58c048'); break;
    case 'bottle':
      rect(g, 7, 1, 2, 2, '#8a5a30'); rect(g, 7, 3, 2, 3, c2); rect(g, 5, 6, 6, 9, '#a8c8c8'); rect(g, 5, 8, 6, 7, c1);
      rect(g, 6, 7, 1, 6, '#ffffff'); rect(g, 5, 10, 6, 2, '#ffffff'); break;
    case 'jar':
      rect(g, 4, 2, 8, 3, '#ffffff'); for (let i = 0; i < 4; i++) rect(g, 4 + i * 2, 2 + (i % 2), 1, 1, '#e03030');
      rect(g, 3, 5, 10, 10, shade(c1, -0.3)); rect(g, 4, 5, 8, 9, c1); rect(g, 4, 8, 8, 3, c2); rect(g, 5, 6, 1, 2, '#ffffff'); break;
    case 'log':
      rect(g, 2, 5, 11, 7, '#7a4420'); rect(g, 2, 6, 11, 5, c1); rect(g, 3, 7, 8, 1, '#7a4420');
      disc(g, 12, 8, 3, '#7a4420'); disc(g, 12, 8, 2, c2); rect(g, 12, 8, 1, 1, '#a86a38'); break;
    case 'stone': ellipse(g, 8, 10, 6, 4, '#6e6e7c'); ellipse(g, 8, 9, 5, 4, c1); rect(g, 5, 7, 3, 1, c2); break;
    case 'crystal':
      for (let r = 0; r < 12; r++) { const w = r < 4 ? r + 1 : Math.max(1, 6 - Math.floor((r - 4) / 1.3)); rect(g, 8 - w, 2 + r, w, 1, c1); rect(g, 8, 2 + r, w, 1, c2); }
      rect(g, 6, 5, 1, 4, '#ffffff'); break;
    case 'fish':
      ellipse(g, 7, 8, 5, 3, shade(c1, -0.3)); ellipse(g, 7, 8, 4, 2, c1); rect(g, 3, 9, 8, 1, c2);
      rect(g, 12, 6, 2, 5, shade(c1, -0.2)); rect(g, 14, 5, 1, 7, shade(c1, -0.2)); rect(g, 4, 7, 1, 1, '#202020'); break;
    case 'mushroom':
      rect(g, 6, 9, 4, 6, c2); rect(g, 6, 13, 4, 2, '#d8c8b0');
      ellipse(g, 8, 7, 6, 4, shade(c1, -0.3)); ellipse(g, 8, 6, 6, 3, c1); rect(g, 5, 5, 2, 1, '#ffffff'); rect(g, 10, 6, 2, 1, '#ffffff'); rect(g, 8, 4, 1, 1, '#ffffff'); break;
    case 'berries':
      for (const [a, b] of [[6, 8], [10, 8], [8, 11], [5, 12], [11, 12]]) { disc(g, a, b, 2, c1); rect(g, a - 1, b - 1, 1, 1, c2); }
      rect(g, 8, 3, 1, 4, '#3a9a34'); rect(g, 9, 3, 3, 2, '#58c048'); break;
    case 'shell':
      for (let r = 0; r < 8; r++) { const w = 2 + r; rect(g, 8 - w / 2, 4 + r, w, 1, r % 2 ? c1 : c2); }
      rect(g, 6, 12, 4, 2, shade(c1, -0.2)); for (const sx of [5, 8, 11]) rect(g, sx, 7, 1, 5, shade(c1, -0.15)); break;
    case 'bag':
      rect(g, 3, 4, 10, 11, c2); rect(g, 4, 5, 8, 9, '#b08a60'); rect(g, 5, 2, 6, 2, c2);
      rect(g, 5, 7, 6, 4, c1); rect(g, 7, 6, 2, 1, c1); rect(g, 6, 8, 1, 1, '#a8f080'); break;
    case 'packet': {
      rect(g, 3, 2, 10, 13, '#a08050'); rect(g, 4, 3, 8, 11, '#f4e6c4'); rect(g, 4, 3, 8, 3, c1); rect(g, 4, 6, 8, 1, shade(c1, -0.3));
      disc(g, 8, 10, 2, c1); rect(g, 7, 9, 1, 1, c2); rect(g, 5, 13, 2, 1, '#8a6038'); rect(g, 9, 13, 2, 1, '#8a6038');
      if (ITEMS[id] && ITEMS[ITEMS[id].crop] && ITEMS[ITEMS[id].crop].rare) { rect(g, 12, 1, 1, 3, '#fff8b0'); rect(g, 11, 2, 3, 1, '#fff8b0'); }
      break;
    }
    case 'egg':
      ellipse(g, 8, 9, 5, 6, c2); ellipse(g, 8, 9, 4, 5, c1); rect(g, 6, 5, 2, 2, '#ffffff'); break;
    case 'milk':
      rect(g, 6, 1, 4, 2, c2); rect(g, 6, 3, 4, 2, '#d8e4f0'); rect(g, 4, 5, 8, 10, '#c8d4e0'); rect(g, 5, 5, 6, 9, c1);
      rect(g, 5, 9, 6, 3, c2); rect(g, 6, 6, 1, 2, '#ffffff'); break;
    case 'wool':
      for (const [a, b] of [[5, 7], [10, 7], [8, 5], [5, 11], [10, 11], [8, 9]]) { disc(g, a, b, 3, c2); disc(g, a, b - 1, 2, c1); }
      rect(g, 11, 12, 3, 1, '#c8a878'); rect(g, 13, 13, 2, 1, '#c8a878'); break;
    case 'truffle':
      disc(g, 8, 9, 5, c1); disc(g, 7, 8, 3, c2); for (const [a, b] of [[5, 10], [10, 7], [9, 11], [11, 10]]) rect(g, a, b, 1, 1, '#2a1a12');
      rect(g, 2, 2, 1, 3, '#fff8b0'); rect(g, 1, 3, 3, 1, '#fff8b0'); break;
    case 'cheese':
      for (let r = 0; r < 8; r++) rect(g, 2, 5 + r, 4 + Math.min(10, r * 2 + 2), 1, r === 0 ? shade(c1, 0.3) : c1);
      rect(g, 2, 13, 14, 2, c2); for (const [a, b, rr] of [[5, 9, 1], [9, 11, 1], [12, 12, 0]]) disc(g, a, b, rr, c2); break;
    case 'icecream':
      for (let r = 0; r < 7; r++) rect(g, 5 + Math.floor(r / 2), 8 + r, 6 - Math.floor(r / 2) * 2, 1, r % 2 ? c2 : shade(c2, -0.15));
      disc(g, 8, 6, 4, c1); disc(g, 7, 5, 1, '#ffffff'); rect(g, 8, 1, 2, 2, '#e02838'); break;
    case 'crepe':
      ellipse(g, 8, 11, 7, 3, c2); ellipse(g, 8, 10, 7, 3, c1); ellipse(g, 8, 8, 6, 2, shade(c1, 0.15)); ellipse(g, 8, 6, 5, 2, shade(c1, 0.25));
      rect(g, 5, 5, 6, 1, '#7a4020'); break;
    case 'cake':
      rect(g, 2, 8, 12, 7, c2); rect(g, 2, 8, 12, 3, c1); rect(g, 2, 11, 12, 1, shade(c2, -0.2)); rect(g, 2, 14, 12, 1, shade(c2, -0.25));
      for (const x of [4, 8, 12]) { rect(g, x - 1, 10, 1, 2, c1); }
      rect(g, 7, 3, 2, 5, '#78b8f8'); rect(g, 7, 1, 2, 2, '#f8d030'); break;
    case 'omelette':
      ellipse(g, 8, 10, 7, 4, '#d8b020'); ellipse(g, 8, 9, 6, 3, c1); for (const [a, b] of [[5, 9], [9, 8], [11, 10]]) rect(g, a, b, 2, 1, c2); break;
    default: disc(g, 8, 8, 5, c1 || '#888');
  }
}
export function itemIcon(id) { return cached('it:' + id, 16, 16, (g) => drawItemShape(g, id)); }
const urlCache = new Map();
export function iconURL(id, scale = 3) {
  const k = id + '@' + scale;
  if (!urlCache.has(k)) {
    const c = canvas(16 * scale, 16 * scale), g = c.getContext('2d');
    g.imageSmoothingEnabled = false; g.drawImage(itemIcon(id), 0, 0, 16 * scale, 16 * scale);
    urlCache.set(k, c.toDataURL());
  }
  return urlCache.get(k);
}
export function coinURL() {
  if (!urlCache.has('coin')) {
    const c = canvas(48, 48), g = c.getContext('2d');
    g.scale(3, 3); disc(g, 8, 8, 6, '#b88a10'); disc(g, 8, 8, 5, '#f8c830'); disc(g, 8, 8, 3, '#ffe070'); rect(g, 7, 5, 2, 6, '#c89818'); rect(g, 5, 5, 1, 2, '#fff8c0');
    urlCache.set('coin', c.toDataURL());
  }
  return urlCache.get('coin');
}

// ---------------- Creatures (40x40) ----------------
export function drawCreature(g, id, t = 0) {
  const c = CREATURES[id];
  const body = c.body, dark = shade(body, -0.35), light = shade(body, 0.4);
  const bob = Math.round(Math.sin(t * 3) * 1);
  const cx = 20, cy = 24 + bob;
  ellipse(g, 20, 36, 12, 3, 'rgba(0,0,0,0.2)');
  const eyes = (y = cy - 2, gap = 5, big = 3) => {
    for (const s of [-1, 1]) { disc(g, cx + s * gap, y, big, '#ffffff'); rect(g, cx + s * gap - 1, y - 1, 2, 3, '#202028'); rect(g, cx + s * gap - 1, y - 1, 1, 1, '#ffffff'); }
    rect(g, cx - gap - 4, y + 3, 2, 1, '#f8a0b0'); rect(g, cx + gap + 3, y + 3, 2, 1, '#f8a0b0');
  };
  const mouth = (y = cy + 3) => { rect(g, cx - 1, y, 3, 1, '#702030'); };
  const feet = () => { ellipse(g, cx - 6, cy + 9, 3, 2, dark); ellipse(g, cx + 6, cy + 9, 3, 2, dark); };
  const blob = (rx = 10, ry = 9) => { ellipse(g, cx, cy, rx + 1, ry + 1, dark); ellipse(g, cx, cy, rx, ry, body); ellipse(g, cx - 3, cy - 4, 3, 2, light); };
  switch (c.acc) {
    case 'bunny':
      for (const s of [-1, 1]) { ellipse(g, cx + s * 5, cy - 14, 3, 8, dark); ellipse(g, cx + s * 5, cy - 14, 2, 7, body); ellipse(g, cx + s * 5, cy - 13, 1, 5, '#f8b0c0'); }
      feet(); blob(); eyes(); rect(g, cx, cy + 1, 1, 1, '#f080a0'); mouth(cy + 3); break;
    case 'ladybug':
      feet(); blob(10, 8);
      rect(g, cx, cy - 8, 1, 17, '#202020');
      for (const [a, b] of [[-5, -3], [5, -3], [-6, 3], [6, 3], [-2, 5], [3, 6]]) disc(g, cx + a, cy + b, 1, '#202020');
      ellipse(g, cx, cy - 9, 6, 4, '#202020'); rect(g, cx - 4, cy - 16, 1, 4, '#202020'); rect(g, cx + 4, cy - 16, 1, 4, '#202020');
      disc(g, cx - 4, cy - 17, 1, '#202020'); disc(g, cx + 4, cy - 17, 1, '#202020');
      for (const s of [-1, 1]) { disc(g, cx + s * 3, cy - 9, 1, '#ffffff'); } break;
    case 'acorn':
      feet(); blob(9, 9); eyes(cy, 4, 2); mouth(cy + 5);
      ellipse(g, cx, cy - 8, 11, 5, '#6a4020'); ellipse(g, cx, cy - 9, 10, 4, '#8a5a30');
      for (let i = -8; i <= 8; i += 3) rect(g, cx + i, cy - 12, 1, 6, '#6a4020');
      rect(g, cx - 1, cy - 16, 2, 4, '#5a3a18'); break;
    case 'mushroom':
      feet(); ellipse(g, cx, cy + 2, 8, 7, dark); ellipse(g, cx, cy + 2, 7, 6, body); eyes(cy + 2, 4, 2); mouth(cy + 6);
      ellipse(g, cx, cy - 7, 14, 7, '#9a2020'); ellipse(g, cx, cy - 8, 13, 6, '#d83830');
      for (const [a, b, r] of [[-7, -9, 2], [3, -11, 2], [8, -6, 1], [-2, -6, 1]]) disc(g, cx + a, cy + b, r, '#ffffff'); break;
    case 'leaf':
      feet(); blob(9, 9); eyes(); mouth();
      for (let r = 0; r < 12; r++) { const w = Math.round(Math.sin((r / 12) * Math.PI) * 6); rect(g, cx - w + r - 6, cy - 12 - r, w * 2 + 1, 1, r % 4 ? '#58b838' : '#3a8a2a'); }
      rect(g, cx, cy - 12, 1, 4, '#3a8a2a'); break;
    case 'frog':
      ellipse(g, cx, cy + 2, 12, 8, dark); ellipse(g, cx, cy + 2, 11, 7, body); ellipse(g, cx, cy + 5, 7, 3, '#d8f0a8');
      for (const s of [-1, 1]) { disc(g, cx + s * 6, cy - 6, 4, dark); disc(g, cx + s * 6, cy - 6, 3, body); disc(g, cx + s * 6, cy - 6, 2, '#ffffff'); rect(g, cx + s * 6, cy - 7, 1, 2, '#202028'); }
      rect(g, cx - 5, cy + 1, 10, 1, '#2a6a2a'); rect(g, cx - 6, cy, 1, 1, '#2a6a2a'); rect(g, cx + 5, cy, 1, 1, '#2a6a2a');
      ellipse(g, cx - 9, cy + 9, 4, 2, dark); ellipse(g, cx + 9, cy + 9, 4, 2, dark); break;
    case 'wings': {
      const fl = Math.sin(t * 18) > 0 ? 1 : 0;
      g.fillStyle = 'rgba(200,236,255,0.75)';
      for (const s of [-1, 1]) { ellipse(g, cx + s * 11, cy - 6 - fl, 8, 4, 'rgba(200,236,255,0.75)'); ellipse(g, cx + s * 10, cy + 2 + fl, 7, 3, 'rgba(220,244,255,0.7)'); }
      blob(8, 8); eyes(cy - 1, 4, 3); mouth(cy + 4);
      rect(g, cx - 4, cy - 12, 1, 4, dark); rect(g, cx + 4, cy - 12, 1, 4, dark); break;
    }
    case 'crab':
      for (const s of [-1, 1]) { disc(g, cx + s * 14, cy - 4, 4, dark); disc(g, cx + s * 14, cy - 4, 3, '#e86040'); rect(g, cx + s * 14 - 1, cy - 8, 2, 3, '#f8f0f0'); rect(g, cx + s * 10, cy, 3, 2, dark); }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) rect(g, cx + s * (6 + k * 2), cy + 7, 1, 3, dark);
      blob(11, 7); eyes(cy - 1, 5, 2); mouth(cy + 3);
      for (let i = -6; i <= 6; i += 4) rect(g, cx + i, cy - 6, 2, 1, light); break;
    case 'rock':
      feet();
      g.fillStyle = dark; g.beginPath(); g.moveTo(cx - 12, cy + 7); g.lineTo(cx - 9, cy - 8); g.lineTo(cx + 2, cy - 12); g.lineTo(cx + 11, cy - 5); g.lineTo(cx + 12, cy + 7); g.closePath(); g.fill();
      g.fillStyle = body; g.beginPath(); g.moveTo(cx - 10, cy + 6); g.lineTo(cx - 8, cy - 7); g.lineTo(cx + 2, cy - 10); g.lineTo(cx + 10, cy - 4); g.lineTo(cx + 10, cy + 6); g.closePath(); g.fill();
      rect(g, cx - 6, cy - 11, 9, 3, '#58a048'); rect(g, cx - 4, cy - 12, 5, 1, '#78c858');
      rect(g, cx + 5, cy + 1, 1, 4, dark); rect(g, cx + 6, cy + 4, 2, 1, dark);
      eyes(cy - 2, 4, 2); rect(g, cx - 5, cy - 6, 3, 1, dark); rect(g, cx + 3, cy - 6, 3, 1, dark); mouth(cy + 3); break;
    case 'fox':
      ellipse(g, cx + 12, cy + 4, 6, 3, dark); ellipse(g, cx + 12, cy + 4, 5, 2, body); rect(g, cx + 15, cy + 3, 2, 2, '#c8e0f8');
      for (const s of [-1, 1]) { for (let r = 0; r < 8; r++) rect(g, cx + s * 6 - Math.floor((8 - r) / 3), cy - 15 + r, Math.floor((8 - r) / 1.5) + 1, 1, r < 2 ? '#a8c8f0' : body); }
      feet(); blob(10, 8); eyes(cy - 2, 4, 2); rect(g, cx, cy + 1, 1, 1, '#405070'); mouth(cy + 3);
      rect(g, cx - 3, cy + 5, 6, 2, '#ffffff'); break;
    case 'crystal':
      for (const [dx, h, cc] of [[-6, 10, '#c088f8'], [0, 14, '#a8ecff'], [6, 10, '#78d8f8']]) {
        for (let r = 0; r < h; r++) { const w = r < 3 ? r : 3; rect(g, cx + dx - w, cy - 8 - h + r, w * 2 + 1, 1, cc); }
      }
      blob(10, 9); eyes(); mouth();
      if (Math.floor(t * 3) % 2) { rect(g, cx + 12, cy - 16, 1, 5, '#ffffff'); rect(g, cx + 10, cy - 14, 5, 1, '#ffffff'); } break;
    default: feet(); blob(); eyes(); mouth();
  }
}
export function creatureURL(id, scale = 3, silhouette = false) {
  const k = 'cr:' + id + scale + (silhouette ? 's' : '');
  if (!urlCache.has(k)) {
    const base = canvas(40, 40), bg = base.getContext('2d'); drawCreature(bg, id, 0);
    const c = canvas(40 * scale, 40 * scale), g = c.getContext('2d');
    g.imageSmoothingEnabled = false; g.drawImage(base, 0, 0, 40 * scale, 40 * scale);
    if (silhouette) { g.globalCompositeOperation = 'source-in'; g.fillStyle = '#6a7080'; g.fillRect(0, 0, c.width, c.height); }
    urlCache.set(k, c.toDataURL());
  }
  return urlCache.get(k);
}

// ---------------- Badges ----------------
export function badgeURL(i, color, earned) {
  const k = 'bd' + i + earned;
  if (!urlCache.has(k)) {
    const c = canvas(48, 48), g = c.getContext('2d');
    g.scale(3, 3);
    const col = earned ? color : '#b8b8c0', dk = shade(col, -0.35), lt = shade(col, 0.5);
    const shapes = [
      () => { disc(g, 8, 8, 6, dk); disc(g, 8, 8, 5, col); rect(g, 7, 3, 2, 10, dk); rect(g, 4, 6, 3, 2, lt); },
      () => { for (let r = 0; r < 12; r++) { const w = r < 6 ? r + 1 : 12 - r; rect(g, 8 - w, 2 + r, w * 2, 1, r < 6 ? col : dk); } },
      () => { rect(g, 2, 3, 12, 10, dk); rect(g, 3, 4, 10, 8, col); rect(g, 3, 4, 10, 2, lt); },
      () => { for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5; disc(g, Math.round(8 + Math.cos(a) * 4), Math.round(8 + Math.sin(a) * 4), 2, col); } disc(g, 8, 8, 2, lt); },
      () => { const pts = [[9, 1], [4, 9], [8, 9], [6, 15], [12, 6], [8, 6]]; g.fillStyle = col; g.beginPath(); pts.forEach(([a, b], j) => (j ? g.lineTo(a, b) : g.moveTo(a, b))); g.closePath(); g.fill(); },
      () => { disc(g, 6, 7, 3, col); disc(g, 10, 7, 3, col); for (let r = 0; r < 6; r++) rect(g, 3 + r, 8 + r, 10 - r * 2, 1, col); rect(g, 5, 5, 2, 1, lt); },
      () => { ellipse(g, 8, 9, 6, 5, dk); ellipse(g, 8, 9, 5, 4, col); rect(g, 3, 3, 10, 3, col); rect(g, 6, 2, 4, 2, lt); },
      () => { for (let r = 0; r < 4; r++) rect(g, 2 + r, 10 - r * 2, 12 - r * 2, 2, r % 2 ? dk : col); rect(g, 3, 11, 10, 3, col); rect(g, 2, 4, 2, 3, col); rect(g, 7, 2, 2, 3, col); rect(g, 12, 4, 2, 3, col); },
    ];
    shapes[i % shapes.length]();
    urlCache.set(k, c.toDataURL());
  }
  return urlCache.get(k);
}

// ---------------- Farm animals (16x16, side view; facing right unless flip) ----------------
export function drawAnimal(g, x, y, kind, flip, frame, t) {
  g.save();
  if (flip) { g.translate(x * 2 + 16, 0); g.scale(-1, 1); }
  const P = (a, b, w, h, c) => { g.fillStyle = c; g.fillRect(x + a, y + b, w, h); };
  const step = frame % 2;
  g.fillStyle = 'rgba(0,0,0,0.2)'; g.fillRect(x + 3, y + 14, 10, 2);
  switch (kind) {
    case 'poule': {
      const bob = step;
      ellipse(g, x + 7, y + 9 + bob, 5, 4, '#d8d0c8'); ellipse(g, x + 7, y + 8 + bob, 5, 3, '#ffffff');
      P(2, 5 + bob, 2, 3, '#ffffff'); P(1, 4 + bob, 2, 2, '#f0ece4');
      disc(g, x + 12, y + 5 + bob, 2, '#ffffff'); P(11, 1 + bob, 3, 2, '#e83030'); P(14, 5 + bob, 2, 1, '#f0a020'); P(12, 7 + bob, 1, 2, '#e83030');
      P(12, 4 + bob, 1, 1, '#202020'); P(5, 8 + bob, 4, 1, '#d8d0c8');
      P(6, 13, 1, 2 - bob, '#f0a020'); P(9, 13, 1, 1 + bob, '#f0a020'); break;
    }
    case 'vache': case 'chevre': {
      const cow = kind === 'vache';
      const body = cow ? '#fbfbf6' : '#e2dccf', dk = cow ? '#2a2a2a' : '#9a8e7e';
      P(2, 5, 10, 6, body); P(2, 10, 10, 1, shade(body, -0.15));
      if (cow) { P(4, 5, 3, 3, dk); P(8, 7, 3, 2, dk); P(3, 9, 2, 1, dk); } else { P(3, 5, 8, 1, '#c8c0b0'); }
      P(1, 5, 1, 4, dk);
      P(11, 2, 4, 6, body); P(13, 6, 3, 3, cow ? '#f8b0b8' : body); P(13, 3, 1, 1, '#202020');
      if (cow) { P(11, 1, 1, 2, '#e8dcc0'); P(14, 1, 1, 2, '#e8dcc0'); P(10, 3, 1, 2, dk); }
      else { P(11, 0, 1, 3, '#7a6a58'); P(12, -1, 1, 2, '#7a6a58'); P(14, 9, 2, 2, '#c8c0b0'); }
      const lg = cow ? '#d8d0c8' : '#7a6a58';
      P(3, 11, 2, 3 - step, lg); P(6, 11, 2, 2 + step, lg); P(9, 11, 2, 3 - step, lg); P(11, 11, 1, 2 + step, lg);
      P(3, 13 - step, 2, 1, '#3a3030'); P(9, 13 - step, 2, 1, '#3a3030'); break;
    }
    case 'mouton': {
      for (const [a, b] of [[4, 7], [7, 6], [10, 7], [5, 10], [9, 10], [3, 9], [11, 9]]) disc(g, x + a, y + b, 2, '#e8e4dc');
      for (const [a, b] of [[4, 6], [7, 5], [10, 6], [6, 9], [9, 9]]) disc(g, x + a, y + b, 2, '#fbfaf6');
      P(12, 4, 3, 5, '#2e2a2a'); P(11, 4, 1, 2, '#2e2a2a'); P(13, 5, 1, 1, '#ffffff');
      P(4, 12, 1, 3 - step, '#2e2a2a'); P(6, 12, 1, 2 + step, '#2e2a2a'); P(9, 12, 1, 3 - step, '#2e2a2a'); P(11, 12, 1, 2 + step, '#2e2a2a'); break;
    }
    case 'cochon': {
      ellipse(g, x + 7, y + 9, 6, 4, '#e88a9a'); ellipse(g, x + 7, y + 8, 6, 3, '#f8b0bc');
      P(12, 6, 3, 5, '#f8b0bc'); P(14, 7, 2, 3, '#e87888'); P(15, 8, 1, 1, '#a04858'); P(13, 6, 1, 1, '#202020');
      P(11, 4, 2, 2, '#e88a9a'); P(1, 6, 1, 1, '#e88a9a'); P(0, 5, 1, 1, '#e88a9a');
      P(3, 12, 2, 2 - step, '#e88a9a'); P(6, 12, 2, 1 + step, '#e88a9a'); P(9, 12, 2, 2 - step, '#e88a9a'); P(11, 12, 1, 1 + step, '#e88a9a'); break;
    }
    case 'abeilles': {
      // a straw hive (skep) with bees around
      g.restore(); g.save();
      ellipse(g, x + 8, y + 14, 6, 2, 'rgba(0,0,0,0.2)');
      for (let r = 0; r < 11; r++) { const w = Math.round(2 + Math.sqrt(r) * 2.2); P(8 - w, 3 + r, w * 2, 1, r % 3 === 2 ? '#b07818' : '#e8b030'); }
      P(7, 11, 3, 3, '#4a2a10');
      for (let i = 0; i < 3; i++) {
        const a = t * 3 + i * 2.1, bx = Math.round(x + 8 + Math.cos(a) * 7), by = Math.round(y + 6 + Math.sin(a * 1.3) * 4);
        g.fillStyle = '#202020'; g.fillRect(bx, by, 2, 1); g.fillStyle = '#f8d030'; g.fillRect(bx, by - 1, 1, 1);
      }
      break;
    }
    default: disc(g, x + 8, y + 9, 5, '#c8a878');
  }
  g.restore();
}
export function drawBarn(g, x, y) {
  // 3x3 tiles red barn with a big white-crossed door
  const W = 48, H = 48;
  rect(g, x + 2, y + H - 2, W - 2, 3, 'rgba(0,0,0,0.18)');
  rect(g, x + 2, y + 18, W - 4, H - 18, '#b83a2c'); rect(g, x + 2, y + 18, W - 4, 2, '#8a2a20');
  for (let i = 0; i < 6; i++) rect(g, x + 4 + i * 7, y + 20, 1, H - 22, '#9a3024');
  for (let r = 0; r < 18; r++) { const inset = Math.max(0, Math.round((18 - r) * 0.9)); rect(g, x + inset, y + r, W - inset * 2, 1, r % 4 === 3 ? '#6a4a3a' : '#8a6a58'); }
  rect(g, x + 20, y + 6, 8, 8, '#f8f0e0'); rect(g, x + 21, y + 7, 6, 6, '#3a2a20'); rect(g, x + 23, y + 7, 2, 6, '#f8f0e0'); rect(g, x + 21, y + 9, 6, 2, '#f8f0e0');
  rect(g, x + 14, y + 28, 20, 20, '#f8f0e0'); rect(g, x + 16, y + 30, 16, 18, '#9a3024');
  for (let i = 0; i < 16; i++) { rect(g, x + 16 + i, y + 30 + i, 2, 2, '#f8f0e0'); rect(g, x + 30 - i, y + 30 + i, 2, 2, '#f8f0e0'); }
  rect(g, x + 2, y + H - 2, W - 4, 2, '#6a2a20');
}
export function drawDairy(g, x, y, t) {
  building(g, x, y, 4, 3, { roof: '#5a8ad8', roofD: '#3a62a8', wall: '#fbfaf2', wallD: '#c0c4cc', door: 1, doorC: '#5a8ad8' });
  rect(g, x + 36, y + 28, 22, 12, '#7a4e2c'); rect(g, x + 37, y + 29, 20, 10, '#f8e8b8');
  g.drawImage(itemIcon('fromage'), x + 39, y + 26);
  // milk can by the door
  rect(g, x + 4, y + 36, 8, 12, '#9aa4b0'); rect(g, x + 5, y + 36, 6, 10, '#c8d0dc'); rect(g, x + 6, y + 33, 4, 3, '#9aa4b0');
}
