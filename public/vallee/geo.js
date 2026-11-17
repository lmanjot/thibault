// La Vallée des Graines — geometry drawn on screen: repérage, symétrie, angles, figures et solides.
// A problem can carry p.fig (an SVG picture shown with the question) and/or p.grid (a grid the child taps).
// Grid answers are the tapped squares (or points) as "x,y" keys, sorted and joined by spaces.

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

export const GEO_CATS = { coord: 'Repérage', sym: 'Symétrie', angles: 'Angles', figures: 'Figures et solides' };
export const GEO_HINTS = {
  coord: 'La lettre se lit en bas (la colonne), le nombre à gauche (la ligne).',
  sym: 'Chaque case a sa jumelle de l’autre côté de la ligne rouge, à la même distance.',
  angles: 'Un angle droit, c’est le coin d’une feuille : 90°. Plus fermé : aigu. Plus ouvert : obtus.',
  figures: 'Regarde les côtés (égaux ?) et les angles (droits ?).',
};
export const GEO_LESSONS = {
  coord: { title: 'Se repérer sur une grille', lines: ['Une case se nomme avec sa colonne (la lettre, en bas) puis sa ligne (le nombre, à gauche) : C4.', 'Sur un repère, un point se nomme (x ; y) : d’abord on avance vers la droite (x), puis on monte (y).'], ex: ['La case C4 : colonne C, ligne 4', 'Le point (3 ; 5) : 3 vers la droite, puis 5 vers le haut'] },
  sym: { title: 'La symétrie', lines: ['Une figure symétrique, c’est comme une image dans un miroir posé sur la ligne (l’axe).', 'Chaque case a sa jumelle de l’autre côté, exactement à la même distance de l’axe.', 'Si on pliait la feuille sur l’axe, les deux côtés se superposeraient.'], ex: ['Une case 2 carreaux à gauche de l’axe → sa jumelle est 2 carreaux à droite, sur la même ligne'] },
  angles: { title: 'Les angles', lines: ['Angle droit : 90°, comme le coin d’une feuille (on le vérifie avec l’équerre).', 'Angle aigu : plus petit qu’un angle droit. Angle obtus : plus grand (mais moins que 180°).', 'Avec le rapporteur, on met le centre sur le sommet et le 0 sur un côté, puis on lit où passe l’autre côté.', 'Les 3 angles d’un triangle font toujours 180° ensemble.'], ex: ['Un triangle avec 50° et 70° : 180 − 50 − 70 = 60°'] },
  figures: { title: 'Figures et solides', lines: ['Carré : 4 côtés égaux et 4 angles droits. Rectangle : 4 angles droits. Losange : 4 côtés égaux.', 'Parallélogramme : côtés opposés parallèles. Trapèze : seulement 2 côtés parallèles.', 'Triangle équilatéral : 3 côtés égaux. Isocèle : 2 côtés égaux. Rectangle : un angle droit.', 'Un cube a 6 faces, 12 arêtes et 8 sommets.'], ex: ['Les petits traits sur les côtés montrent les côtés égaux, le petit carré montre un angle droit'] },
};

function P(cat, q, a, u, ex, hint) { return { cat, q, a, u: u || '', ex, hint: hint || GEO_HINTS[cat] }; }
function C(cat, q, right, wrongs, ex, hint) {
  const choices = shuffle([right, ...[...new Set(wrongs)].filter((w) => w !== right).slice(0, 3)]);
  return { cat, q, a: right, choices, u: '', ex, hint: hint || GEO_HINTS[cat] };
}
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const keyOf = (x, y) => `${x},${y}`;
export const gridKey = (cells) => [...cells].sort().join(' ');

// ---------- drawing ----------
const INK = '#2a3550', FILL = '#dfe8f8', BLUE = '#5a82d8', GOLDC = '#f0b030', RED = '#e04848', GREEN = '#48a848';
const svg = (w, h, body, cls = 'gfig') => `<svg class="${cls}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
const poly = (pts, fill = FILL) => `<polygon points="${pts.map((p) => p.join(',')).join(' ')}" fill="${fill}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
const line = (x1, y1, x2, y2, w = 3, extra = '') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" ${extra}/>`;
const text = (x, y, s, size = 16, extra = '') => `<text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="middle" fill="${INK}" font-family="Andika, sans-serif" ${extra}>${s}</text>`;
/** Little square marking a right angle at corner c, between the directions to a and b. */
function rightMark(c, a, b, s = 12) {
  const u = (p) => { const dx = p[0] - c[0], dy = p[1] - c[1], l = Math.hypot(dx, dy); return [dx / l, dy / l]; };
  const [ux, uy] = u(a), [vx, vy] = u(b);
  const p1 = [c[0] + ux * s, c[1] + uy * s], p2 = [c[0] + (ux + vx) * s, c[1] + (uy + vy) * s], p3 = [c[0] + vx * s, c[1] + vy * s];
  return `<polyline points="${p1.join(',')} ${p2.join(',')} ${p3.join(',')}" fill="none" stroke="${INK}" stroke-width="2"/>`;
}
/** Tick marks across the middle of a side (n ticks = sides with the same number are equal). */
function ticks(a, b, n = 1) {
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
  const ux = dx / l, uy = dy / l, nx = -uy * 7, ny = ux * 7;
  let s = '';
  for (let i = 0; i < n; i++) { const o = (i - (n - 1) / 2) * 6; s += line(mx + ux * o - nx, my + uy * o - ny, mx + ux * o + nx, my + uy * o + ny, 2); }
  return s;
}

const ICONS = {
  coffre: (x, y, s) => `<rect x="${x - s / 2}" y="${y - s / 3}" width="${s}" height="${(s * 2) / 3}" rx="3" fill="#a0642c" stroke="${INK}" stroke-width="2"/><line x1="${x - s / 2}" y1="${y - s / 12}" x2="${x + s / 2}" y2="${y - s / 12}" stroke="${INK}" stroke-width="2"/><rect x="${x - 3}" y="${y - s / 12 - 2}" width="6" height="7" fill="${GOLDC}"/>`,
  arbre: (x, y, s) => `<rect x="${x - 3}" y="${y}" width="6" height="${s / 2}" fill="#8a5a2a"/><circle cx="${x}" cy="${y - s / 8}" r="${s / 2.6}" fill="#4caa48" stroke="${INK}" stroke-width="2"/>`,
  puits: (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s / 2.4}" fill="#9aa0b0" stroke="${INK}" stroke-width="2"/><circle cx="${x}" cy="${y}" r="${s / 4.5}" fill="#4a90e0"/>`,
  maison: (x, y, s) => `<rect x="${x - s / 3}" y="${y - s / 10}" width="${(s * 2) / 3}" height="${s / 2.4}" fill="#f4e0b0" stroke="${INK}" stroke-width="2"/><polygon points="${x - s / 2},${y - s / 10} ${x},${y - s / 2} ${x + s / 2},${y - s / 10}" fill="#d84838" stroke="${INK}" stroke-width="2"/>`,
  fleur: (x, y, s) => [0, 72, 144, 216, 288].map((a) => `<circle cx="${x + Math.cos((a * Math.PI) / 180) * s / 4.2}" cy="${y + Math.sin((a * Math.PI) / 180) * s / 4.2}" r="${s / 6}" fill="#f080b0"/>`).join('') + `<circle cx="${x}" cy="${y}" r="${s / 7}" fill="${GOLDC}"/>`,
  ruche: (x, y, s) => `<ellipse cx="${x}" cy="${y}" rx="${s / 2.6}" ry="${s / 2.3}" fill="#f0c040" stroke="${INK}" stroke-width="2"/><line x1="${x - s / 3}" y1="${y - s / 8}" x2="${x + s / 3}" y2="${y - s / 8}" stroke="${INK}" stroke-width="2"/><line x1="${x - s / 3}" y1="${y + s / 8}" x2="${x + s / 3}" y2="${y + s / 8}" stroke="${INK}" stroke-width="2"/>`,
  depart: (x, y, s) => `<circle cx="${x}" cy="${y}" r="${s / 3}" fill="${RED}" stroke="#fff" stroke-width="2"/>`,
};
const PLACES = [['coffre', 'le coffre'], ['arbre', 'le grand arbre'], ['puits', 'le puits'], ['maison', 'la maison'], ['fleur', 'la fleur'], ['ruche', 'la ruche']];
const LET = 'ABCDEFGHIJ';
const cellName = (x, y) => `${LET[x]}${y + 1}`;

/**
 * The grid as SVG. st: { sel, bad, sol } sets of "x,y" keys. Squares (or points) the child can tap carry data-k.
 * g: { kind: 'cells' | 'points', cols, rows, fill: [keys], icons: [{ x, y, icon, label }], axis: { dir: 'v' | 'h', at }, paint: { x0, x1, y0, y1 }, mode }
 */
export function gridSVG(g, st = {}) {
  const sel = st.sel || new Set(), bad = st.bad || new Set(), sol = st.sol || new Set();
  const fill = new Set(g.fill || []);
  const cs = 34, L = 28, T = 10, B = 26, Rm = 10;
  const tap = g.mode && g.mode !== 'none';
  const inPaint = (x, y) => !g.paint || (x >= g.paint.x0 && x <= g.paint.x1 && y >= g.paint.y0 && y <= g.paint.y1);
  let s = '';
  if (g.kind === 'points') {
    const W = L + g.cols * cs + Rm + 8, H = T + 8 + g.rows * cs + B;
    const X = (x) => L + x * cs, Y = (y) => T + 8 + (g.rows - y) * cs;
    for (let x = 0; x <= g.cols; x++) s += `<line x1="${X(x)}" y1="${Y(0)}" x2="${X(x)}" y2="${Y(g.rows)}" stroke="#b8c4dc" stroke-width="1.5"/>` + text(X(x), Y(0) + 15, x, 13);
    for (let y = 0; y <= g.rows; y++) s += `<line x1="${X(0)}" y1="${Y(y)}" x2="${X(g.cols)}" y2="${Y(y)}" stroke="#b8c4dc" stroke-width="1.5"/>` + (y ? text(X(0) - 13, Y(y), y, 13) : '');
    s += line(X(0), Y(0), X(g.cols) + 6, Y(0), 2.5) + line(X(0), Y(0), X(0), Y(g.rows) - 6, 2.5);
    for (const m of g.icons || []) s += `<circle cx="${X(m.x)}" cy="${Y(m.y)}" r="6" fill="${BLUE}" stroke="${INK}" stroke-width="2"/>` + (m.label ? text(X(m.x) + 12, Y(m.y) - 12, m.label, 15, 'font-weight="bold"') : '');
    for (let x = 0; x <= g.cols; x++) for (let y = 0; y <= g.rows; y++) {
      const k = keyOf(x, y);
      if (sol.has(k)) s += `<circle cx="${X(x)}" cy="${Y(y)}" r="9" fill="${GREEN}" stroke="#fff" stroke-width="2"/>`;
      else if (bad.has(k)) s += `<circle cx="${X(x)}" cy="${Y(y)}" r="9" fill="${RED}" stroke="#fff" stroke-width="2"/>`;
      else if (sel.has(k)) s += `<circle cx="${X(x)}" cy="${Y(y)}" r="9" fill="${GOLDC}" stroke="${INK}" stroke-width="2"/>`;
      if (tap) s += `<circle data-k="${k}" cx="${X(x)}" cy="${Y(y)}" r="${cs / 2.2}" fill="transparent" style="cursor:pointer"/>`;
    }
    return svg(W, H, s, 'gfig ggrid');
  }
  const W = L + g.cols * cs + Rm, H = T + g.rows * cs + B;
  const X = (x) => L + x * cs, Y = (y) => T + (g.rows - 1 - y) * cs;
  for (let x = 0; x < g.cols; x++) for (let y = 0; y < g.rows; y++) {
    const k = keyOf(x, y);
    const col = sol.has(k) ? GREEN : bad.has(k) ? RED : fill.has(k) ? BLUE : sel.has(k) ? GOLDC : inPaint(x, y) && g.paint ? '#fffdf4' : '#fff';
    s += `<rect ${tap && inPaint(x, y) && !fill.has(k) ? `data-k="${k}" style="cursor:pointer"` : ''} x="${X(x)}" y="${Y(y)}" width="${cs}" height="${cs}" fill="${col}" stroke="#9aa8c4" stroke-width="1.5"/>`;
  }
  if (g.labels !== false) {
    for (let x = 0; x < g.cols; x++) s += text(X(x) + cs / 2, Y(0) + cs + 14, LET[x], 14, 'font-weight="bold"');
    for (let y = 0; y < g.rows; y++) s += text(L - 13, Y(y) + cs / 2, y + 1, 14, 'font-weight="bold"');
  }
  for (const m of g.icons || []) s += `<g pointer-events="none">${ICONS[m.icon](X(m.x) + cs / 2, Y(m.y) + cs / 2, cs * 0.8)}</g>`;
  if (g.axis) {
    const a = g.axis;
    s += a.dir === 'v'
      ? `<line x1="${X(a.at)}" y1="${T - 6}" x2="${X(a.at)}" y2="${T + g.rows * cs + 6}" stroke="${RED}" stroke-width="4" stroke-dasharray="8 5" pointer-events="none"/>`
      : `<line x1="${L - 6}" y1="${Y(a.at - 1)}" x2="${L + g.cols * cs + 6}" y2="${Y(a.at - 1)}" stroke="${RED}" stroke-width="4" stroke-dasharray="8 5" pointer-events="none"/>`;
  }
  return svg(W, H, s, 'gfig ggrid');
}

// ---------- Repérage ----------
function placeIcons(cols, rows, n) {
  const used = new Set(), out = [];
  for (const [icon, name] of shuffle([...PLACES]).slice(0, n)) {
    let x, y; do { x = R(0, cols - 1); y = R(0, rows - 1); } while (used.has(keyOf(x, y)));
    used.add(keyOf(x, y)); out.push({ x, y, icon, name });
  }
  return out;
}
function coord(d) {
  if (d <= 2) {
    const cols = d <= 1 ? 5 : 7, rows = d <= 1 ? 5 : 6;
    const icons = placeIcons(cols, rows, d <= 1 ? 1 : 3), t = icons[0];
    if (Math.random() < 0.5) {
      const near = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1]].map(([dx, dy]) => [t.x + dx, t.y + dy]).filter(([x, y]) => x >= 0 && y >= 0 && x < cols && y < rows);
      const swapped = t.y < cols && t.x < rows ? [[t.y, t.x]] : [];
      const wr = shuffle([...swapped, ...shuffle(near)]).map(([x, y]) => cellName(x, y));
      const p = C('coord', `Dans quelle case est ${t.name} ?`, cellName(t.x, t.y), wr, `Colonne ${LET[t.x]} (en bas), ligne ${t.y + 1} (à gauche) : ${cellName(t.x, t.y)}`);
      p.grid = { kind: 'cells', cols, rows, icons, mode: 'none' };
      return p;
    }
    let x, y; do { x = R(0, cols - 1); y = R(0, rows - 1); } while (icons.some((m) => m.x === x && m.y === y));
    const p = P('coord', `Touche la case ${cellName(x, y)}.`, keyOf(x, y), '', `Colonne ${LET[x]} en bas, puis on monte jusqu’à la ligne ${y + 1} : c’est la case ${cellName(x, y)}`);
    p.grid = { kind: 'cells', cols, rows, icons, mode: 'one' };
    return p;
  }
  if (d === 3) {
    const cols = 7, rows = 6, dx = R(-3, 3) || 2, dy = R(-3, 3) || -2;
    const x0 = R(Math.max(0, -dx), Math.min(cols - 1, cols - 1 - dx)), y0 = R(Math.max(0, -dy), Math.min(rows - 1, rows - 1 - dy));
    const dir = (n, a, b) => `${Math.abs(n)} case${Math.abs(n) > 1 ? 's' : ''} vers ${n > 0 ? a : b}`;
    const p = P('coord', `Pars de la case ${cellName(x0, y0)} (le point rouge). Va de ${dir(dx, 'la droite', 'la gauche')} puis de ${dir(dy, 'le haut', 'le bas')}. Touche la case d’arrivée.`, keyOf(x0 + dx, y0 + dy), '',
      `${cellName(x0, y0)} → ${dir(dx, 'la droite', 'la gauche')} → colonne ${LET[x0 + dx]}, puis ${dir(dy, 'le haut', 'le bas')} → ligne ${y0 + dy + 1} : ${cellName(x0 + dx, y0 + dy)}`, 'Avance une case à la fois avec ton doigt.');
    p.grid = { kind: 'cells', cols, rows, icons: [{ x: x0, y: y0, icon: 'depart' }], mode: 'one' };
    return p;
  }
  const N = 6;
  if (d === 4) {
    const x = R(1, N), y = R(1, N);
    if (Math.random() < 0.5 || x === y) {
      const p = P('coord', `Touche le point (${x} ; ${y}).`, keyOf(x, y), '', `D’abord ${x} vers la droite, puis ${y} vers le haut : le point (${x} ; ${y})`, 'Le premier nombre : vers la droite. Le deuxième : vers le haut.');
      p.grid = { kind: 'points', cols: N, rows: N, icons: [], mode: 'one' };
      return p;
    }
    const p = C('coord', 'Quelles sont les coordonnées du point A ?', `(${x} ; ${y})`, [`(${y} ; ${x})`, `(${x + 1} ; ${y})`, `(${x} ; ${y - 1})`, `(${x - 1} ; ${y + 1})`], `A est à ${x} vers la droite et ${y} vers le haut : (${x} ; ${y})`, 'Le premier nombre : vers la droite. Le deuxième : vers le haut.');
    p.grid = { kind: 'points', cols: N, rows: N, icons: [{ x, y, label: 'A' }], mode: 'none' };
    return p;
  }
  if (Math.random() < 0.5) {
    const x1 = R(0, 2), x2 = R(x1 + 2, N), y1 = R(0, 2), y2 = R(y1 + 2, N);
    const pts = shuffle([[x1, y1], [x2, y1], [x2, y2], [x1, y2]]), miss = pts.pop();
    const p = P('coord', 'A, B et C sont trois coins d’un rectangle. Touche le quatrième coin.', keyOf(miss[0], miss[1]), '', `Le 4e coin est sur la même ligne et la même colonne que les autres : (${miss[0]} ; ${miss[1]})`, 'Un rectangle : les côtés suivent les lignes du quadrillage.');
    p.grid = { kind: 'points', cols: N, rows: N, icons: pts.map(([x, y], i) => ({ x, y, label: 'ABC'[i] })), mode: 'one' };
    return p;
  }
  const ax = R(0, 3), ay = R(0, 3), dx = R(1, N - ax), dy = R(1, N - ay);
  const p = P('coord', `Le trésor est ${dx} vers la droite et ${dy} vers le haut du point A (${ax} ; ${ay}). Touche le trésor.`, keyOf(ax + dx, ay + dy), '', `${ax} + ${dx} = ${ax + dx} et ${ay} + ${dy} = ${ay + dy} : le trésor est en (${ax + dx} ; ${ay + dy})`);
  p.grid = { kind: 'points', cols: N, rows: N, icons: [{ x: ax, y: ay, label: 'A' }], mode: 'one' };
  return p;
}

// ---------- Symétrie ----------
/** A connected little shape of n squares on one side of the axis, touching it or close to it. */
function blob(n, w, h, touch) {
  const cells = new Set(), list = [];
  const start = [touch ? w - 1 : R(0, w - 1), R(0, h - 1)];
  cells.add(keyOf(...start)); list.push(start);
  while (list.length < n) {
    const [x, y] = pick(list), [dx, dy] = pick([[1, 0], [-1, 0], [0, 1], [0, -1]]), nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h || cells.has(keyOf(nx, ny))) continue;
    cells.add(keyOf(nx, ny)); list.push([nx, ny]);
  }
  return list;
}
const SHAPE_AXES = [['un carré', 4], ['un rectangle', 2], ['un triangle équilatéral', 3], ['un losange', 2], ['un triangle isocèle', 1], ['un parallélogramme', 0], ['un hexagone régulier', 6], ['un trapèze isocèle', 1]];
function sym(d) {
  if (d === 4 && Math.random() < 0.5) {
    const [name, n] = pick(SHAPE_AXES);
    const p = P('sym', `Combien d’axes de symétrie a ${name} ?`, n, 'axes', `${cap(name)} a ${n} axe${n > 1 ? 's' : ''} de symétrie (des lignes où on peut le plier en deux parties pareilles)`, 'Imagine où tu peux plier la figure pour que les deux moitiés se superposent.');
    p.fig = shapeFig(name);
    return p;
  }
  const horiz = d === 3 || (d >= 5 && Math.random() < 0.5);
  const half = d <= 1 ? 3 : d === 2 ? 4 : d === 3 ? 4 : 4, other = d <= 1 ? 5 : d <= 3 ? 6 : 7;
  const n = d <= 1 ? R(3, 4) : d === 2 ? R(5, 6) : d === 3 ? R(4, 6) : R(7, 10);
  const shape = blob(Math.min(n, half * other - 2), half, other, d <= 2);
  let g, target;
  if (!horiz) {
    const cols = half * 2, rows = other;
    g = { kind: 'cells', cols, rows, fill: shape.map(([x, y]) => keyOf(x, y)), axis: { dir: 'v', at: half }, paint: { x0: half, x1: cols - 1, y0: 0, y1: rows - 1 }, mode: 'many', labels: false };
    target = shape.map(([x, y]) => keyOf(2 * half - 1 - x, y));
  } else {
    const cols = other, rows = half * 2;
    // the given shape is in the top half
    g = { kind: 'cells', cols, rows, fill: shape.map(([x, y]) => keyOf(y % cols, rows - 1 - x)), axis: { dir: 'h', at: half }, paint: { x0: 0, x1: cols - 1, y0: 0, y1: half - 1 }, mode: 'many', labels: false };
    target = shape.map(([x, y]) => keyOf(y % cols, 2 * half - 1 - (rows - 1 - x)));
  }
  const p = P('sym', 'Colorie les cases pour que le dessin soit symétrique par rapport à la ligne rouge, puis valide.', gridKey(new Set(target)), '',
    `Chaque case bleue a sa jumelle de l’autre côté de la ligne rouge, à la même distance (en vert : les ${target.length} cases à colorier)`);
  p.grid = g;
  return p;
}

// ---------- Angles ----------
function angleFig(deg, rot = 0, mark = false) {
  const cx = 120, cy = 110, L = 95, r = (a) => ((a + rot) * Math.PI) / 180;
  const p1 = [cx + L * Math.cos(r(0)), cy - L * Math.sin(r(0))], p2 = [cx + L * Math.cos(r(deg)), cy - L * Math.sin(r(deg))];
  const a1 = [cx + 28 * Math.cos(r(0)), cy - 28 * Math.sin(r(0))], a2 = [cx + 28 * Math.cos(r(deg)), cy - 28 * Math.sin(r(deg))];
  const arc = deg === 90 && mark ? rightMark([cx, cy], p1, p2, 18) : `<path d="M${a1.join(',')} A28,28 0 0 0 ${a2.join(',')}" fill="none" stroke="${GOLDC}" stroke-width="3"/>`;
  return svg(240, 220, line(cx, cy, ...p1, 4) + line(cx, cy, ...p2, 4) + arc + `<circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>`);
}
function protractorFig(deg) {
  const cx = 150, cy = 150, Rr = 120;
  let s = `<path d="M${cx - Rr},${cy} A${Rr},${Rr} 0 0 1 ${cx + Rr},${cy} Z" fill="#fff6d8" fill-opacity="0.85" stroke="#c8a040" stroke-width="2"/>`;
  let labels = '';
  for (let a = 0; a <= 180; a += 10) {
    const t = (a * Math.PI) / 180, long = a % 30 === 0, i = long ? Rr - 16 : Rr - 9;
    s += `<line x1="${cx + Rr * Math.cos(t)}" y1="${cy - Rr * Math.sin(t)}" x2="${cx + i * Math.cos(t)}" y2="${cy - i * Math.sin(t)}" stroke="#a07820" stroke-width="${long ? 2 : 1.2}"/>`;
    if (long) labels += text(cx + (Rr - 30) * Math.cos(t), cy - (Rr - 30) * Math.sin(t), a, 12, 'fill="#a07820" stroke="#fff6d8" stroke-width="4" paint-order="stroke" font-weight="bold"');
  }
  const t = (deg * Math.PI) / 180;
  s += line(cx, cy, cx + Rr + 20, cy, 4) + line(cx, cy, cx + (Rr + 20) * Math.cos(t), cy - (Rr + 20) * Math.sin(t), 4) + `<circle cx="${cx}" cy="${cy}" r="4" fill="${INK}"/>` + labels;
  return svg(300, 170, s);
}
function angles(d) {
  if (d <= 1) {
    const kind = pick(['droit', 'aigu', 'obtus']), deg = kind === 'droit' ? 90 : kind === 'aigu' ? R(25, 70) : R(110, 160);
    const p = C('angles', 'Cet angle est…', kind, ['droit', 'aigu', 'obtus'], `${kind === 'droit' ? 'Il fait 90°, comme le coin d’une feuille : droit' : kind === 'aigu' ? 'Il est plus fermé qu’un coin de feuille : aigu' : 'Il est plus ouvert qu’un coin de feuille : obtus'}`);
    p.fig = angleFig(deg, R(0, 3) * 90 + R(-20, 20));
    return p;
  }
  if (d === 2) {
    if (Math.random() < 0.5) {
      const [name, n, fig] = pick(RIGHT_ANGLE_SHAPES)();
      const p = P('angles', `Combien d’angles droits a ${name} ?`, n, 'angles droits', `${cap(name)} a ${n} angle${n > 1 ? 's' : ''} droit${n > 1 ? 's' : ''}`, 'Cherche les coins pareils à un coin de feuille.');
      p.fig = fig;
      return p;
    }
    const degs = shuffle([R(20, 50), R(60, 100), R(110, 160)]), big = degs.indexOf(Math.max(...degs));
    const p = C('angles', 'Quel angle est le plus grand ?', 'ABC'[big], ['A', 'B', 'C'], `L’angle ${'ABC'[big]} est le plus ouvert`, 'Le plus grand angle est le plus ouvert, pas celui qui a les plus longs côtés.');
    p.choices.sort();
    p.fig = svg(330, 120, degs.map((dg, i) => { const cx = 25 + i * 110, cy = 95, Lr = 30 + R(0, 40); const t = (dg * Math.PI) / 180; return line(cx, cy, cx + Lr + 20, cy, 3) + line(cx, cy, cx + Lr * Math.cos(t), cy - Lr * Math.sin(t), 3) + text(cx + 40, cy + 16, 'ABC'[i], 15, 'font-weight="bold"'); }).join(''));
    return p;
  }
  if (d === 3) {
    const all = [30, 45, 60, 90, 120, 135, 150], deg = pick(all);
    const wr = shuffle(all.filter((a) => Math.abs(a - deg) >= 30)).map((a) => `${a}°`);
    const p = C('angles', 'Environ combien mesure cet angle ?', `${deg}°`, wr, `${deg === 90 ? 'C’est un angle droit : 90°' : deg < 90 ? `Il est plus petit qu’un angle droit (90°) : environ ${deg}°` : `Il est plus grand qu’un angle droit (90°) : environ ${deg}°`}`, 'Compare avec un angle droit (90°) : plus petit ou plus grand ? De combien ?');
    p.fig = angleFig(deg, R(-15, 15), true);
    return p;
  }
  if (d === 4) {
    const deg = 10 * R(2, 17);
    const p = P('angles', 'Lis l’angle avec le rapporteur. Combien mesure-t-il ?', deg, '°', `Le côté du bas passe par 0, l’autre côté passe par ${deg} : ${deg}°`, 'Pars du 0 (à droite) et compte les graduations jusqu’à l’autre côté.');
    p.fig = protractorFig(deg);
    return p;
  }
  const k = R(1, 3);
  if (k === 1) {
    const a = 5 * R(6, 16), b = 5 * R(6, Math.min(16, 33 - a / 5)), c = 180 - a - b;
    const p = P('angles', `Un triangle a deux angles de ${a}° et ${b}°. Combien mesure le troisième angle ?`, c, '°', `Les 3 angles d’un triangle font 180°. 180 − ${a} − ${b} = ${c}°`, 'Les 3 angles d’un triangle font toujours 180° ensemble.');
    p.fig = svg(240, 150, poly([[20, 130], [220, 130], [90, 25]]) + text(52, 115, `${a}°`, 14) + text(185, 115, `${b}°`, 14) + text(92, 55, '?', 18, 'font-weight="bold"'));
    return p;
  }
  if (k === 2) { const a = 5 * R(3, 15); return P('angles', `Un angle droit est coupé en deux angles. L’un mesure ${a}°. Combien mesure l’autre ?`, 90 - a, '°', `Un angle droit fait 90°. 90 − ${a} = ${90 - a}°`); }
  const a = 5 * R(7, 30);
  return P('angles', `Sur une ligne droite, deux angles sont côte à côte. L’un mesure ${a}°. Combien mesure l’autre ?`, 180 - a, '°', `Une ligne droite fait un angle de 180°. 180 − ${a} = ${180 - a}°`, 'Une ligne droite, c’est un angle de 180° (deux angles droits).');
}
const RIGHT_ANGLE_SHAPES = [
  () => ['un rectangle', 4, svg(240, 150, poly([[30, 25], [210, 25], [210, 125], [30, 125]]))],
  () => ['un carré', 4, svg(240, 150, poly([[70, 25], [170, 25], [170, 125], [70, 125]]))],
  () => ['ce triangle', 1, svg(240, 150, poly([[40, 130], [200, 130], [40, 25]]))],
  () => ['ce trapèze', 2, svg(240, 150, poly([[40, 25], [140, 25], [210, 125], [40, 125]]))],
  () => ['ce losange', 0, svg(240, 150, poly([[120, 15], [195, 75], [120, 135], [45, 75]]))],
  () => ['ce parallélogramme', 0, svg(240, 150, poly([[70, 30], [220, 30], [170, 125], [20, 125]]))],
  () => ['cette maison', 2, svg(240, 160, poly([[50, 70], [120, 15], [190, 70], [190, 145], [50, 145]]))],
];

// ---------- Figures et solides ----------
function shapeFig(name) {
  const S = {
    'un carré': () => poly([[70, 20], [170, 20], [170, 120], [70, 120]]) + rightMark([70, 120], [70, 20], [170, 120]) + ticks([70, 20], [170, 20]) + ticks([170, 20], [170, 120]) + ticks([170, 120], [70, 120]) + ticks([70, 120], [70, 20]),
    'un rectangle': () => poly([[30, 30], [210, 30], [210, 115], [30, 115]]) + rightMark([30, 115], [30, 30], [210, 115]) + rightMark([210, 30], [30, 30], [210, 115]),
    'un triangle équilatéral': () => poly([[50, 125], [190, 125], [120, 4]]) + ticks([50, 125], [190, 125]) + ticks([190, 125], [120, 4]) + ticks([120, 4], [50, 125]),
    'un losange': () => poly([[120, 8], [200, 70], [120, 132], [40, 70]]) + ticks([120, 8], [200, 70]) + ticks([200, 70], [120, 132]) + ticks([120, 132], [40, 70]) + ticks([40, 70], [120, 8]),
    'un triangle isocèle': () => poly([[70, 128], [170, 128], [120, 8]]) + ticks([170, 128], [120, 8]) + ticks([120, 8], [70, 128]),
    'un parallélogramme': () => poly([[80, 30], [220, 30], [160, 115], [20, 115]]),
    'un hexagone régulier': () => poly([0, 60, 120, 180, 240, 300].map((a) => [120 + 62 * Math.cos((a * Math.PI) / 180), 70 + 62 * Math.sin((a * Math.PI) / 180)])),
    'un trapèze isocèle': () => poly([[80, 30], [160, 30], [210, 115], [30, 115]]) + ticks([30, 115], [80, 30]) + ticks([160, 30], [210, 115]),
    'un trapèze': () => poly([[40, 30], [150, 30], [215, 115], [25, 115]]),
    'un triangle rectangle': () => poly([[50, 125], [200, 125], [50, 15]]) + rightMark([50, 125], [50, 15], [200, 125]),
    'un triangle quelconque': () => poly([[30, 120], [210, 105], [85, 15]]),
    'un cercle': () => `<circle cx="120" cy="70" r="58" fill="${FILL}" stroke="${INK}" stroke-width="3"/>`,
    'un triangle': () => poly([[45, 125], [205, 115], [100, 15]]),
    'un pentagone': () => poly([0, 72, 144, 216, 288].map((a) => [120 + 62 * Math.cos(((a - 90) * Math.PI) / 180), 75 + 62 * Math.sin(((a - 90) * Math.PI) / 180)])),
    'un octogone': () => poly([0, 45, 90, 135, 180, 225, 270, 315].map((a) => [120 + 62 * Math.cos(((a + 22.5) * Math.PI) / 180), 70 + 62 * Math.sin(((a + 22.5) * Math.PI) / 180)])),
  };
  return svg(240, 140, S[name]());
}
const nameOf = (n) => n.replace(/^un /, '');
/** Simple solids in oblique view; hidden edges dashed. */
function solidFig(kind) {
  const dash = 'stroke-dasharray="6 5"';
  const L = (a, b, hidden) => line(a[0], a[1], b[0], b[1], 2.5, hidden ? dash : '');
  if (kind === 'cube' || kind === 'pavé') {
    const w = kind === 'cube' ? 90 : 140, hh = 90, ox = 40, oy = 40;
    const A = [40, 140], B = [40 + w, 140], Cc = [40 + w, 140 - hh], D = [40, 140 - hh];
    const s = (p) => [p[0] + ox, p[1] - oy];
    return svg(240, 160, `<polygon points="${[A, B, Cc, D].map((p) => p.join(',')).join(' ')}" fill="${FILL}"/>` + L(A, B) + L(B, Cc) + L(Cc, D) + L(D, A) + L(D, s(D)) + L(Cc, s(Cc)) + L(B, s(B)) + L(s(D), s(Cc)) + L(s(Cc), s(B)) + L(A, s(A), true) + L(s(A), s(B), true) + L(s(A), s(D), true));
  }
  if (kind === 'pyramide') {
    const A = [40, 135], B = [170, 135], Cc = [210, 100], D = [80, 100], T = [125, 15];
    return svg(240, 150, L(A, B) + L(B, Cc) + L(Cc, D, true) + L(D, A, true) + L(A, T) + L(B, T) + L(Cc, T) + L(D, T, true));
  }
  const A = [40, 130], B = [130, 130], Cc = [85, 50], o = [80, -25], s = (p) => [p[0] + o[0], p[1] + o[1]];
  return svg(240, 150, `<polygon points="${[A, B, Cc].map((p) => p.join(',')).join(' ')}" fill="${FILL}"/>` + L(A, B) + L(B, Cc) + L(Cc, A) + L(B, s(B)) + L(Cc, s(Cc)) + L(s(B), s(Cc)) + L(A, s(A), true) + L(s(A), s(B), true) + L(s(A), s(Cc), true));
}
const SOLIDS = { cube: ['un cube', 6, 12, 8], 'pavé': ['un pavé', 6, 12, 8], pyramide: ['une pyramide à base carrée', 5, 8, 5], prisme: ['un prisme à base triangulaire', 5, 9, 6] };
// Cube nets on a small grid: valid ones (1-4-1, 2-2-2 stairs, 3-3) and look-alikes that do not fold into a cube
const VALID_NETS = [
  ...[[0, 0], [1, 1], [2, 2], [3, 3], [0, 3], [1, 2], [0, 1], [1, 3]].map(([i, j]) => [[i, 0], [0, 1], [1, 1], [2, 1], [3, 1], [j, 2]]),
  [[0, 0], [1, 0], [1, 1], [2, 1], [2, 2], [3, 2]],
  [[0, 0], [1, 0], [2, 0], [2, 1], [3, 1], [4, 1]],
];
const BAD_NETS = [
  [[0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [3, 1]], [[0, 0], [3, 0], [0, 1], [1, 1], [2, 1], [3, 1]], [[1, 0], [2, 0], [0, 1], [1, 1], [2, 1], [3, 1]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [2, 1]], [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]], [[0, 2], [1, 2], [2, 2], [3, 2], [1, 1], [1, 0]],
  [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0]],
];
function netsFig(nets) {
  // 2 × 2: each net centred in its own slot, its letter underneath
  const c = 16;
  return svg(230, 196, nets.map((net, i) => {
    const sx = 8 + (i % 2) * 114, sy = 4 + Math.floor(i / 2) * 98;
    const w = Math.max(...net.map(([x]) => x)) + 1, hh = Math.max(...net.map(([, y]) => y)) + 1;
    const ox = sx + (100 - w * c) / 2, oy = sy + (66 - hh * c) / 2;
    return net.map(([x, y]) => `<rect x="${ox + x * c}" y="${oy + y * c}" width="${c}" height="${c}" fill="${FILL}" stroke="${INK}" stroke-width="2"/>`).join('') + text(sx + 50, sy + 80, 'ABCD'[i], 17, 'font-weight="bold"');
  }).join(''), 'gfig gbig');
}
function figures(d) {
  if (d <= 1) {
    const names = ['un carré', 'un rectangle', 'un triangle', 'un cercle'], n = pick(names);
    const p = C('figures', 'Quelle est cette figure ?', nameOf(n), names.map(nameOf), `C’est ${n}`);
    p.fig = shapeFig(n);
    return p;
  }
  if (d === 2) {
    const names = ['un carré', 'un rectangle', 'un losange', 'un parallélogramme', 'un trapèze'], n = pick(names);
    const why = { 'un carré': '4 côtés égaux et 4 angles droits', 'un rectangle': '4 angles droits', 'un losange': '4 côtés égaux, sans angle droit', 'un parallélogramme': 'les côtés opposés sont parallèles', 'un trapèze': 'seulement 2 côtés parallèles' }[n];
    const p = C('figures', 'Quel est ce quadrilatère ?', nameOf(n), names.map(nameOf), `C’est ${n} : ${why}`, 'Les petits traits montrent les côtés égaux, le petit carré un angle droit.');
    p.fig = shapeFig(n);
    return p;
  }
  if (d === 3) {
    if (Math.random() < 0.5) {
      const names = ['un triangle équilatéral', 'un triangle isocèle', 'un triangle rectangle', 'un triangle quelconque'], n = pick(names);
      const p = C('figures', 'Quel est ce triangle ?', nameOf(n).replace('triangle ', ''), names.map((x) => nameOf(x).replace('triangle ', '')), `C’est ${n}`, 'Les petits traits montrent les côtés égaux, le petit carré un angle droit.');
      p.fig = shapeFig(n);
      return p;
    }
    const [n, k] = pick([['un pentagone', 5], ['un hexagone régulier', 6], ['un octogone', 8]]);
    const p = P('figures', 'Combien de côtés a ce polygone ?', k, 'côtés', `C’est ${n} : il a ${k} côtés`, 'Compte les côtés en faisant le tour avec ton doigt.');
    p.fig = shapeFig(n);
    return p;
  }
  if (d === 4) {
    const kind = pick(Object.keys(SOLIDS)), [name, f, a, s] = SOLIDS[kind];
    const [what, n] = pick([['faces', f], ['arêtes', a], ['sommets', s]]);
    const p = P('figures', `Combien de ${what} a ${name} ?`, n, what, `${cap(name)} a ${f} faces, ${a} arêtes et ${s} sommets`, 'Faces : les surfaces plates. Arêtes : les bords. Sommets : les coins. N’oublie pas ceux qu’on ne voit pas (en pointillés).');
    p.fig = solidFig(kind);
    return p;
  }
  const good = pick(VALID_NETS), bads = shuffle([...BAD_NETS]).slice(0, 3), nets = shuffle([good, ...bads]), letter = 'ABCD'[nets.indexOf(good)];
  const p = C('figures', 'Lequel de ces patrons peut se plier pour faire un cube ?', letter, ['A', 'B', 'C', 'D'], `Le patron ${letter} : en pliant, chaque carré devient une face différente du cube. Pour les autres, deux carrés se retrouvent sur la même face`, 'Imagine le pliage : il faut 4 faces autour, une dessus et une dessous, sans que deux se chevauchent.');
  p.choices.sort(); // the letters name the pictures: keep them in order
  p.fig = netsFig(nets);
  return p;
}

export const GEO = { coord, sym, angles, figures };
