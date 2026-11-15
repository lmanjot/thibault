// La Vallée des Graines — the map: farm (centre-south), village (north), forest (west),
// lake (east, behind the river), mountain (north-east, behind the cliffs).
export const W = 64, H = 48;
export const SOLID = new Set(['t', 'T', 'w', 'f', 'F', 'c', 'x']);
export const TALL = new Set(['G', 'N']);
export const PLOT_ORIGIN = { x: 30, y: 31 }; // 6 columns × 3 rows
export const plotPos = (i) => ({ x: PLOT_ORIGIN.x + (i % 6), y: PLOT_ORIGIN.y + Math.floor(i / 6) });
export const START = { x: 24, y: 27, dir: 'down' };

function rng(seed) {
  return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export function zoneAt(x, y) {
  if (x <= 19) return 'foret';
  if (x >= 45 && y <= 23) return 'montagne';
  if (x >= 46) return 'lac';
  return 'ferme';
}

export function buildWorld() {
  const t = new Array(W * H).fill('g');
  const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) t[x + y * W] = c; };
  const get = (x, y) => t[x + y * W];
  const rect = (x0, y0, x1, y1, c) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) set(x, y, c); };
  const R = rng(1234);

  rect(0, 0, W - 1, H - 1, 't');
  rect(21, 3, 43, 44, 'g');

  // ---------- Forest (west) ----------
  rect(1, 1, 19, 46, 'T');
  rect(2, 28, 19, 28, 'p'); // main trail from the gate
  rect(10, 4, 10, 44, 'p'); // north-south trail
  rect(2, 2, 13, 8, 'd'); // secret clearing
  rect(3, 18, 8, 25, 'd'); rect(4, 19, 7, 23, 'G');
  rect(12, 17, 17, 23, 'd'); rect(13, 18, 16, 20, 'G');
  rect(12, 31, 18, 39, 'd'); rect(13, 34, 17, 38, 'G');
  rect(2, 35, 8, 44, 'd'); rect(3, 38, 6, 41, 'G');
  rect(8, 21, 12, 21, 'p'); rect(8, 36, 12, 36, 'p');
  rect(3, 29, 17, 30, 'd'); rect(3, 26, 17, 27, 'd');
  rect(9, 9, 11, 16, 'd'); rect(9, 40, 11, 44, 'd');
  for (let y = 2; y < 46; y++) for (let x = 2; x < 19; x++) {
    if (get(x, y) === 'T' && R() < 0.22) {
      const n = [get(x + 1, y), get(x - 1, y), get(x, y + 1), get(x, y - 1)];
      if (n.some((c) => c === 'p' || c === 'd')) set(x, y, 'd');
    }
  }
  for (let i = 0; i < 18; i++) { const x = 3 + Math.floor(R() * 10), y = 2 + Math.floor(R() * 6); if (get(x, y) === 'd' && R() < 0.6) set(x, y, 'o'); }
  rect(20, 1, 20, 46, 't'); set(20, 28, 'p'); // forest wall + gate

  // ---------- Village (north) ----------
  rect(21, 1, 43, 2, 't');
  rect(21, 12, 43, 12, 'p');
  rect(22, 18, 42, 18, 'p');
  rect(32, 4, 32, 29, 'p');
  rect(21, 28, 43, 28, 'p');
  for (const [x, y] of [[25, 11], [30, 8], [30, 9], [30, 10], [30, 11], [36, 11], [24, 13], [24, 14], [24, 27]]) set(x, y, 'p');
  for (const [x, y] of [[21, 4], [22, 4], [21, 5], [42, 4], [43, 4], [43, 5], [21, 21], [21, 22], [43, 21], [43, 22], [43, 23], [42, 23]]) set(x, y, 't');

  // ---------- Farm (centre-south) ----------
  rect(29, 30, 36, 30, 'f'); rect(29, 34, 36, 34, 'f');
  rect(29, 31, 29, 33, 'F'); rect(36, 31, 36, 33, 'F');
  set(32, 30, 'p'); set(33, 30, 'p');
  rect(30, 31, 35, 33, 'g');
  rect(38, 37, 42, 42, 'G'); rect(22, 38, 26, 42, 'G');
  rect(21, 45, 43, 46, 't');
  for (const [x, y] of [[22, 44], [23, 44], [43, 44], [42, 44], [43, 43]]) set(x, y, 't');

  // ---------- River & lake (east) ----------
  rect(44, 25, 45, 46, 'w'); set(44, 28, 'b'); set(45, 28, 'b');
  rect(46, 25, 62, 46, 'g');
  for (let y = 25; y <= 46; y++) for (let x = 46; x <= 62; x++) {
    const dx = (x - 55) / 6.3, dy = (y - 39) / 5.3, e = dx * dx + dy * dy;
    if (e <= 1) set(x, y, 'w'); else if (e <= 1.55) set(x, y, 's');
  }
  set(55, 33, 's'); set(55, 34, 'k'); set(55, 35, 'k'); set(55, 36, 'k');
  rect(46, 28, 62, 28, 'p'); rect(55, 29, 55, 32, 'p');
  rect(47, 25, 51, 27, 'G'); rect(47, 29, 51, 31, 'G'); rect(58, 25, 61, 27, 'G'); rect(58, 29, 61, 31, 'G');
  rect(46, 43, 49, 45, 'G');
  for (const [x, y] of [[62, 46], [61, 46], [46, 46], [62, 32], [62, 33]]) set(x, y, 't');

  // ---------- Mountain (north-east) ----------
  rect(44, 0, 63, 0, 'c'); rect(63, 0, 63, 24, 'c');
  rect(44, 1, 44, 24, 'c'); rect(44, 24, 62, 24, 'c');
  rect(45, 1, 62, 23, 'n');
  rect(44, 12, 50, 12, 'q'); rect(50, 4, 50, 12, 'q'); rect(50, 4, 59, 4, 'q');
  rect(50, 12, 56, 12, 'q'); rect(56, 12, 56, 18, 'q'); rect(56, 18, 61, 18, 'q');
  rect(46, 5, 48, 8, 'c'); rect(53, 7, 55, 10, 'c'); rect(58, 7, 61, 10, 'c'); rect(46, 15, 49, 16, 'c'); rect(52, 14, 54, 16, 'c'); rect(58, 20, 61, 22, 'c');
  rect(52, 1, 57, 2, 'N'); rect(46, 19, 51, 22, 'N'); rect(57, 13, 61, 16, 'N');
  for (const [x, y] of [[45, 1], [62, 6], [45, 22], [45, 23], [62, 12], [52, 20], [61, 1]]) set(x, y, 'x');

  // ---------- Objects ----------
  const objs = [];
  const add = (type, x, y, extra = {}) => { const o = { id: extra.id || `${type}@${x},${y}`, type, x, y, w: 1, h: 1, solid: true, ...extra }; objs.push(o); return o; };

  add('house', 23, 24, { w: 4, h: 3 });
  add('caisse', 26, 27);
  add('mailbox', 28, 27);
  add('npc', 29, 26, { id: 'mamie', npc: 'mamie' });
  add('chest', 22, 24, { id: 'chest:maison', chest: 'maison' });
  for (let i = 0; i < 18; i++) { const p = plotPos(i); add('plot', p.x, p.y, { id: 'plot' + i, plot: i, solid: false }); }
  add('sign', 33, 27, { text: 'Ferme de Thibault.\nLe potager est juste derrière la barrière.' });

  add('shop', 23, 8, { w: 5, h: 3, id: 'shop' });
  add('bld', 29, 4, { w: 3, h: 4, id: 'moulin', bld: 'moulin' });
  add('bld', 35, 8, { w: 4, h: 3, id: 'four', bld: 'four' });
  add('bld', 23, 15, { w: 4, h: 3, id: 'pressoir', bld: 'pressoir' });
  add('bld', 38, 31, { w: 4, h: 3, id: 'serre', bld: 'serre' });
  add('board', 34, 13, { w: 2, h: 1, id: 'board' });
  add('fountain', 37, 14, { w: 2, h: 2, id: 'fountain' });
  add('owl', 40, 13, { id: 'hibou' });
  add('npc', 28, 13, { id: 'lea', npc: 'lea' });
  add('npc', 35, 19, { id: 'tim', npc: 'tim' });
  add('sign', 31, 13, { text: 'Village de Bourgeon.\nBoutique · Moulin · Boulangerie · Pressoir' });

  add('bigrock', 20, 28, { id: 'bigrock' });
  add('sign', 21, 27, { text: '← Forêt des Murmures\nAttention aux créatures dans les hautes herbes !' });
  add('brokenbridge', 44, 28, { w: 2, h: 1, id: 'brokenbridge' });
  add('sign', 43, 27, { text: '→ Lac Miroir\nLe pont est cassé…' });
  add('guardian', 44, 12, { id: 'guardian' });
  add('sign', 43, 11, { text: '→ Mont Givré\nSeuls les grands calculateurs peuvent passer.' });

  // forest
  add('ancient', 5, 2, { w: 3, h: 3, id: 'ancient' });
  add('chest', 12, 3, { id: 'chest:secret', chest: 'secret' });
  add('chest', 4, 43, { id: 'chest:foret1', chest: 'foret1' });
  add('chest', 16, 22, { id: 'chest:foret2', chest: 'foret2' });
  for (const [x, y] of [[12, 27], [7, 29], [15, 29], [11, 14], [9, 33], [4, 26], [9, 41], [16, 26], [6, 30]]) { set(x, y, 'd'); add('tree', x, y); }
  for (const [x, y] of [[5, 27], [17, 30], [11, 24], [6, 36], [16, 39], [9, 11]]) { set(x, y, 'd'); add('rock', x, y); }
  for (const [x, y, k] of [[3, 22, 'champignon'], [15, 33, 'baies'], [11, 9, 'champignon'], [3, 30, 'baies'], [8, 42, 'champignon'], [17, 21, 'baies']]) { set(x, y, 'd'); add('forage', x, y, { kind: k }); }
  add('npc', 9, 27, { id: 'garde', npc: 'garde' });

  // lake
  add('fishspot', 55, 37, { id: 'fishspot' });
  add('npc', 54, 33, { id: 'pecheur', npc: 'pecheur' });
  add('chest', 61, 45, { id: 'chest:lac2', chest: 'lac2' });
  add('chest', 62, 26, { id: 'chest:lac1', chest: 'lac1' });
  for (const [x, y] of [[47, 34], [61, 36], [58, 45]]) { set(x, y, 'g'); add('tree', x, y); }
  for (const [x, y] of [[48, 37], [61, 42], [52, 45], [60, 29]]) { if (get(x, y) === 'w') continue; add('rock', x, y); }
  for (const [x, y] of [[49, 35], [60, 34], [62, 41]]) { set(x, y, 's'); add('forage', x, y, { kind: 'coquillage' }); }

  // mountain
  for (const [x, y] of [[48, 4], [56, 6], [61, 13], [53, 21], [60, 17], [47, 10]]) { set(x, y, 'n'); add('crystal', x, y); }
  for (const [x, y] of [[47, 13], [55, 21], [58, 3]]) { set(x, y, 'n'); add('rock', x, y); }
  add('chest', 46, 2, { id: 'chest:mont1', chest: 'mont1' });
  add('chest', 61, 2, { id: 'chest:mont2', chest: 'mont2' });
  add('npc', 58, 5, { id: 'sage', npc: 'sage' });

  return { tiles: t, objs };
}

export const NPCS = {
  mamie: { name: 'Mamie Rose', look: { hair: '#d8d8e0', shirt: '#9858c0', dress: true, bun: true, skin: '#f8d0a8' }, dir: 'left' },
  lea: { name: 'Léa', look: { hair: '#f0c040', shirt: '#f06080', dress: true }, dir: 'down' },
  tim: { name: 'Tim', look: { hat: '#38a048', hair: '#4a2a10', shirt: '#f0a020', pants: '#4a5a8a' }, dir: 'down' },
  garde: { name: 'Garde forestier', look: { hat: '#5a7a3a', hair: '#3a2a1a', shirt: '#6a8a4a', pants: '#4a3a2a', beard: '#4a3020' }, dir: 'down' },
  pecheur: { name: 'Tom le pêcheur', look: { hat: '#f0d040', hair: '#7a4a2a', shirt: '#3a8ac8', pants: '#3a3a4a', beard: '#8a6a4a' }, dir: 'down' },
  sage: { name: 'Sage du Mont', look: { hair: '#f0f0f8', shirt: '#4a5aa8', dress: true, beard: '#f0f0f8' }, dir: 'down' },
  guardian: { name: 'Gardien', look: { helmet: true, hair: '#3a2a1a', shirt: '#6a6a88', pants: '#3a3a4a' }, dir: 'left' },
};
