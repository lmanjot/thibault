// La Vallée des Graines — math problems for 7H-8H (ages 10-12), difficulty 1 (easy) to 5 (hard).
// A problem: { cat, q, a, u, ex, hint } with a numeric answer, or { choices, a } for multiple choice.
// In q, [3/4] is drawn as a stacked fraction and @ as the box to find.

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const r3 = (x) => Math.round(x * 1000) / 1000;
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** French number: 2,5 · 12 500 */
export function fmt(n) {
  const v = r3(n);
  const neg = v < 0;
  let [i, d] = String(Math.abs(v)).split('.');
  if (i.length > 4) i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return (neg ? '−' : '') + i + (d ? ',' + d : '');
}
/** Money: 3,50 · 12 */
export const chf = (n) => (Number.isInteger(r3(n)) ? fmt(n) : r3(n).toFixed(2).replace('.', ','));
const hm = (h, m) => `${h} h ${String(m).padStart(2, '0')}`;

export const CATS = {
  calc: 'Calcul', frac: 'Fractions', conv: 'Conversions', masse: 'Masses', contenance: 'Contenances',
  longueur: 'Longueurs', duree: 'Durées', recette: 'Proportions', argent: 'Argent', geo: 'Géométrie', animaux: 'Animaux', enigme: 'Énigmes',
};
export const MEASURE_CATS = ['conv', 'masse', 'contenance', 'longueur', 'duree', 'recette', 'argent', 'geo', 'animaux'];

const HINTS = {
  calc: 'Prends ton temps. Tu peux poser le calcul sur une feuille.',
  frac: 'Divise par le nombre du bas, puis multiplie par le nombre du haut.',
  conv: 'Rappelle-toi : 1 m = 100 cm · 1 kg = 1000 g · 1 L = 100 cL · 1 h = 60 min.',
  masse: '1 kg = 1000 g. Regarde bien l’unité demandée.',
  contenance: '1 L = 10 dL = 100 cL = 1000 mL.',
  longueur: '1 km = 1000 m · 1 m = 100 cm. Regarde bien l’unité demandée.',
  duree: '1 h = 60 min. Avance d’abord jusqu’à l’heure pile.',
  recette: 'Cherche par combien on multiplie… ou calcule d’abord pour 1.',
  argent: 'Calcule d’abord le prix total, puis la différence.',
  geo: 'Périmètre = le tour (on additionne les côtés). Aire = longueur × largeur.',
  animaux: 'Lis bien : combien pour UN animal, puis multiplie ou divise.',
  enigme: 'Lis l’énigme deux fois, et fais un petit dessin ou un calcul à la fois.',
};

function P(cat, q, a, u, ex, hint) {
  return { cat, q, a: r3(a), u: u || '', ex, hint: hint || HINTS[cat] };
}
function C(cat, q, right, wrongs, ex, hint) {
  const choices = shuffle([right, ...wrongs.filter((w) => w !== right).slice(0, 3)]);
  return { cat, q, a: right, choices, u: '', ex, hint: hint || HINTS[cat] };
}

// ---------- Calcul ----------
function add(d) {
  let a, b;
  if (d <= 1) { a = R(12, 68); b = R(11, 29); }
  else if (d === 2) { a = R(125, 689); b = R(112, 299); }
  else if (d === 3) { a = R(1250, 6800); b = R(340, 2900); }
  else if (d === 4) { a = R(105, 899) / 10; b = R(15, 399) / 10; }
  else { a = R(1005, 8999) / 100; b = R(105, 999) / 10; }
  return P('calc', `${fmt(a)} + ${fmt(b)} = @`, a + b, '', `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`,
    d >= 4 ? 'Aligne bien les virgules : les dixièmes sous les dixièmes.' : null);
}
function sub(d) {
  let a, b;
  if (d <= 1) { a = R(40, 99); b = R(11, a - 10); }
  else if (d === 2) { a = R(300, 999); b = R(105, a - 50); }
  else if (d === 3) { a = R(2000, 9999); b = R(305, a - 300); }
  else if (d === 4) { a = R(200, 999) / 10; b = R(15, Math.floor(a * 10) - 20) / 10; }
  else { a = R(50, 300); b = R(105, a * 10 - 50) / 10; if (Math.random() < 0.5) { a = R(1000, 4000) / 100; b = R(105, Math.floor(a * 10) - 30) / 10; } }
  return P('calc', `${fmt(a)} − ${fmt(b)} = @`, a - b, '', `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}`,
    d >= 4 ? 'Aligne bien les virgules. Tu peux ajouter un 0 à droite : 25 = 25,0.' : null);
}
function mul(d) {
  let a, b, ex = null;
  if (d <= 1) { a = pick([2, 3, 4, 5, 10]); b = R(2, 10); }
  else if (d === 2) { a = pick([3, 4, 6, 7, 8, 9, 6, 7, 8, 9]); b = R(3, 10); }
  else if (d === 3) {
    if (Math.random() < 0.75) {
      a = R(12, 48); b = R(3, 9);
      const t = Math.floor(a / 10) * 10, u = a % 10;
      ex = `${a} × ${b} = ${t} × ${b} + ${u} × ${b} = ${t * b} + ${u * b} = ${a * b}`;
    } else { a = R(12, 99); b = pick([10, 100]); }
  } else if (d === 4) {
    if (Math.random() < 0.5) { a = R(11, 25); b = R(11, 19); ex = `${a} × ${b} = ${a} × 10 + ${a} × ${b - 10} = ${a * 10} + ${a * (b - 10)} = ${a * b}`; }
    else { a = R(101, 999) / 100; b = pick([10, 100, 1000]); ex = `× ${b} : la virgule se déplace de ${String(b).length - 1} rang(s) vers la droite → ${fmt(a * b)}`; }
  } else {
    const k = R(1, 3);
    if (k === 1) { a = R(15, 45) / 10; b = R(3, 9); ex = `${fmt(a)} × ${b} = ${Math.round(a * 10)} × ${b} ÷ 10 = ${Math.round(a * 10) * b} ÷ 10 = ${fmt(a * b)}`; }
    else if (k === 2) { a = R(12, 35); b = R(12, 35); }
    else { a = pick([25, 125, 250]); b = R(3, 8) * (a === 25 ? 4 : 1); }
  }
  return P('calc', `${fmt(a)} × ${fmt(b)} = @`, a * b, '', ex || `${fmt(a)} × ${fmt(b)} = ${fmt(a * b)}`);
}
function div(d) {
  let b, q;
  if (d <= 1) { b = pick([2, 3, 4, 5, 10]); q = R(2, 10); }
  else if (d === 2) { b = R(3, 9); q = R(3, 10); }
  else if (d === 3) { b = R(3, 9); q = R(12, 40); }
  else if (d === 4) {
    if (Math.random() < 0.5) {
      const a = R(12, 99) * 10, k = pick([10, 100]);
      return P('calc', `${fmt(a)} ÷ ${k} = @`, a / k, '', `÷ ${k} : la virgule se déplace de ${String(k).length - 1} rang(s) vers la gauche → ${fmt(a / k)}`);
    }
    b = R(11, 15); q = R(3, 9);
  } else {
    if (Math.random() < 0.5) { b = R(3, 9); q = R(11, 99) / 10; }
    else { b = R(12, 25); q = R(11, 30); }
  }
  const a = r3(b * q);
  return P('calc', `${fmt(a)} ÷ ${fmt(b)} = @`, q, '', `${fmt(a)} ÷ ${fmt(b)} = ${fmt(q)}, car ${fmt(q)} × ${fmt(b)} = ${fmt(a)}`,
    'Cherche quel nombre multiplié par le diviseur donne le nombre de départ.');
}
function mental(d) {
  if (d <= 1) {
    if (Math.random() < 0.5) { const n = R(12, 45); return P('calc', `Le double de ${n} = @`, n * 2, '', `${n} + ${n} = ${n * 2}`); }
    const n = 2 * R(6, 49); return P('calc', `La moitié de ${n} = @`, n / 2, '', `${n} ÷ 2 = ${n / 2}`);
  }
  if (d === 2) { const n = R(11, 89); return P('calc', `${n} + @ = 100`, 100 - n, '', `100 − ${n} = ${100 - n}`); }
  if (d === 3) {
    if (Math.random() < 0.5) { const n = R(11, 95) * 10; return P('calc', `${n} + @ = 1000`, 1000 - n, '', `1000 − ${n} = ${1000 - n}`); }
    const n = R(12, 48); return P('calc', `${n} × 5 = @`, n * 5, '', `× 5, c’est × 10 puis ÷ 2 : ${n * 10} ÷ 2 = ${n * 5}`);
  }
  if (d === 4) {
    if (Math.random() < 0.5) { const n = R(3, 16); return P('calc', `${n} × 25 = @`, n * 25, '', `× 25, c’est × 100 puis ÷ 4 : ${n * 100} ÷ 4 = ${n * 25}`); }
    const n = 2 * R(50, 249) + 1; return P('calc', `La moitié de ${n} = @`, n / 2, '', `${n} ÷ 2 = ${fmt(n / 2)}`);
  }
  if (Math.random() < 0.5) { const n = R(5, 95) / 100; return P('calc', `${fmt(n)} + @ = 1`, 1 - n, '', `1 − ${fmt(n)} = ${fmt(1 - n)}`); }
  const n = 2 * R(12, 99); return P('calc', `${n} × 0,5 = @`, n / 2, '', `× 0,5, c’est prendre la moitié : ${n} ÷ 2 = ${n / 2}`);
}
const CALC_POOLS = {
  1: [add, sub, mul, mul, div, mental],
  2: [add, sub, mul, mul, div, mental],
  3: [add, sub, mul, div, mental],
  4: [add, sub, mul, div, mental],
  5: [add, sub, mul, div, mental],
};
export const genAdd = (d) => pick([add, sub])(d);
export const genMul = (d) => pick([mul, mul, div])(d);

// ---------- Fractions ----------
function frac(d) {
  if (d <= 1) {
    if (Math.random() < 0.5) { const n = 2 * R(5, 30); return P('frac', `La moitié de ${n} = @`, n / 2, '', `${n} ÷ 2 = ${n / 2}`); }
    const n = 4 * R(2, 10); return P('frac', `Le quart de ${n} = @`, n / 4, '', `Le quart, c’est diviser par 4 : ${n} ÷ 4 = ${n / 4}`);
  }
  if (d === 2) {
    const b = pick([2, 3, 4, 5, 10]), n = b * R(2, 12);
    return P('frac', `[1/${b}] de ${n} = @`, n / b, '', `[1/${b}] de ${n}, c’est ${n} ÷ ${b} = ${n / b}`);
  }
  if (d === 3) {
    const b = pick([3, 4, 5, 6, 8, 10]), a = R(2, b - 1), n = b * R(2, 12);
    return P('frac', `[${a}/${b}] de ${n} = @`, (n / b) * a, '', `${n} ÷ ${b} = ${n / b}, puis ${n / b} × ${a} = ${(n / b) * a}`);
  }
  if (d === 4) {
    const k = R(1, 3);
    if (k === 1) {
      const [a, b] = pick([[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [1, 10], [3, 10], [7, 10], [1, 100], [4, 5]]);
      return P('frac', `[${a}/${b}] = @ (en nombre à virgule)`, a / b, '', `${a} ÷ ${b} = ${fmt(a / b)}`, 'Une fraction, c’est une division : le haut ÷ le bas.');
    }
    if (k === 2) {
      const [a, b] = pick([[1, 2], [2, 3], [3, 4], [1, 3], [2, 5], [3, 5], [1, 4], [5, 6]]), m = R(2, 5);
      return P('frac', `[${a}/${b}] = [@/${b * m}]`, a * m, '', `${b} × ${m} = ${b * m}, donc on fait aussi ${a} × ${m} = ${a * m}`, 'On multiplie le haut et le bas par le même nombre.');
    }
    const [a, b] = pick([[1, 2], [1, 4], [3, 4], [1, 3], [2, 3], [1, 6], [5, 6], [1, 5]]);
    return P('frac', `[${a}/${b}] d’heure = @ min`, (60 / b) * a, 'min', `1 h = 60 min. 60 ÷ ${b} = ${60 / b}, puis × ${a} = ${(60 / b) * a} min`);
  }
  const k = R(1, 3);
  if (k === 1) {
    const [a, b] = pick([[3, 4], [1, 4], [2, 5], [3, 5], [1, 8], [3, 8], [7, 10]]), kg = R(1, 4);
    return P('frac', `[${a}/${b}] de ${kg} kg = @ g`, ((kg * 1000) / b) * a, 'g', `${kg} kg = ${kg * 1000} g. ${kg * 1000} ÷ ${b} = ${fmt((kg * 1000) / b)}, puis × ${a} = ${fmt(((kg * 1000) / b) * a)} g`);
  }
  if (k === 2) {
    const [a, b] = pick([[1, 4], [3, 4], [2, 5], [1, 5], [3, 10], [1, 2]]);
    return P('frac', `[${a}/${b}] de 1 L = @ mL`, (1000 / b) * a, 'mL', `1 L = 1000 mL. 1000 ÷ ${b} = ${1000 / b}, puis × ${a} = ${(1000 / b) * a} mL`);
  }
  const b = pick([4, 5, 6, 8]), a = R(1, b - 1), n = b * R(3, 9);
  return P('frac', `Tu as ${n} graines. Tu en plantes les [${a}/${b}]. Combien t’en reste-t-il ?`, n - (n / b) * a, 'graines',
    `[${a}/${b}] de ${n} = ${(n / b) * a}. Il reste ${n} − ${(n / b) * a} = ${n - (n / b) * a}`);
}

// ---------- Conversions ----------
const U = { km: 1000, m: 1, dm: 0.1, cm: 0.01, mm: 0.001, t: 1e6, kg: 1000, g: 1, L: 1, dL: 0.1, cL: 0.01, mL: 0.001 };
function convEx(v, from, to) {
  const f = r3(U[from] / U[to]);
  const res = r3(v * f);
  if (f >= 1) return `1 ${from} = ${fmt(f)} ${to}, donc ${fmt(v)} × ${fmt(f)} = ${fmt(res)} ${to}`;
  const g = r3(1 / f);
  return `1 ${to} = ${fmt(g)} ${from}, donc ${fmt(v)} ÷ ${fmt(g)} = ${fmt(res)} ${to}`;
}
function convQ(v, from, to) {
  return P('conv', `${fmt(v)} ${from} = @ ${to}`, v * (U[from] / U[to]), to, convEx(v, from, to));
}
function conv(d) {
  if (d <= 1) {
    if (Math.random() < 0.15) { const h = R(2, 5); return P('conv', `${h} h = @ min`, h * 60, 'min', `1 h = 60 min, donc ${h} × 60 = ${h * 60} min`); }
    const [f, t] = pick([['m', 'cm'], ['kg', 'g'], ['L', 'dL'], ['L', 'cL'], ['m', 'dm'], ['km', 'm'], ['cm', 'mm']]);
    return convQ(R(2, 9), f, t);
  }
  if (d === 2) {
    if (Math.random() < 0.15) { const h = R(2, 5); return P('conv', `${h * 60} min = @ h`, h, 'h', `60 min = 1 h, donc ${h * 60} ÷ 60 = ${h} h`); }
    const [f, t] = pick([['cm', 'm'], ['g', 'kg'], ['dL', 'L'], ['cL', 'L'], ['m', 'km'], ['mm', 'cm']]);
    const k = R(2, 9);
    return convQ(r3(k * (U[t] / U[f])), f, t);
  }
  if (d === 3) {
    if (Math.random() < 0.2) { const h = R(1, 3); return P('conv', `${h},5 h = @ min`, h * 60 + 30, 'min', `${h} h = ${h * 60} min et 0,5 h = 30 min, donc ${h * 60 + 30} min`); }
    const [f, t] = pick([['m', 'cm'], ['kg', 'g'], ['L', 'cL'], ['km', 'm'], ['L', 'dL']]);
    return convQ(R(11, 99) / 10, f, t);
  }
  if (d === 4) {
    if (Math.random() < 0.25) { const h = R(1, 3), m = R(1, 11) * 5; return P('conv', `${h} h ${m} min = @ min`, h * 60 + m, 'min', `${h} h = ${h * 60} min, puis ${h * 60} + ${m} = ${h * 60 + m} min`); }
    const [f, t] = pick([['cm', 'm'], ['g', 'kg'], ['cL', 'L'], ['m', 'km'], ['mL', 'L']]);
    const v = f === 'mL' || f === 'g' || f === 'm' ? R(11, 99) * 10 : R(11, 99) * (f === 'cm' || f === 'cL' ? 10 : 1);
    return convQ(v, f, t);
  }
  const k = R(1, 6);
  if (k === 1) { const a = R(1, 5), b = R(1, 19) * 50 - (Math.random() < 0.3 ? 25 : 0); return P('conv', `${a} kg ${b} g = @ g`, a * 1000 + b, 'g', `${a} kg = ${a * 1000} g, puis ${a * 1000} + ${b} = ${a * 1000 + b} g`); }
  if (k === 2) { const a = R(2, 9), b = R(1, 9) * (Math.random() < 0.5 ? 1 : 10); return P('conv', `${a} m ${b} cm = @ cm`, a * 100 + b, 'cm', `${a} m = ${a * 100} cm, puis ${a * 100} + ${b} = ${a * 100 + b} cm`); }
  if (k === 3) return convQ(pick([0.25, 0.75, 1.25, 1.5, 2.25, 0.33]), 'L', 'mL');
  if (k === 4) return convQ(R(11, 99) * 100, 'm', 'km');
  if (k === 5) return convQ(pick([1.5, 2.5, 0.5, 3.2, 0.8]), 't', 'kg');
  const h = R(1, 3), m = R(1, 11) * 5, tot = h * 60 + m;
  return P('conv', `${tot} min = ${h} h et @ min`, m, 'min', `${h} h = ${h * 60} min. ${tot} − ${h * 60} = ${m} min`);
}

// ---------- Word problems by theme ----------
const T = {};
T.masse = [
  [1, 2, (d) => { const a = d <= 1 ? R(2, 9) : R(12, 25), n = R(3, 9); return P('masse', `Le meunier porte ${n} sacs de blé. Chaque sac pèse ${a} kg. Combien de kg porte-t-il en tout ?`, n * a, 'kg', `${n} × ${a} = ${n * a} kg`); }],
  [1, 2, (d) => { const A = d <= 1 ? R(20, 60) : R(120, 400), b = R(5, Math.floor(A / 2)); return P('masse', `Mamie a ${A} kg de pommes de terre. Elle en donne ${b} kg à la voisine. Combien de kg lui reste-t-il ?`, A - b, 'kg', `${A} − ${b} = ${A - b} kg`); }],
  [2, 3, () => { const b = pick([2, 4, 5, 6, 8, 10, 25]), q = R(3, 12); return P('masse', `Le meunier a ${b * q} kg de farine. Il la verse dans des sacs de ${b} kg. Combien de sacs remplit-il ?`, q, 'sacs', `${b * q} ÷ ${b} = ${q} sacs`); }],
  [2, 4, () => { const p = R(2, 5) * 50, n = R(3, 6), m = R(12, 20) * 10; return P('masse', `Un panier vide pèse ${p} g. Tu y mets ${n} pommes de ${m} g chacune. Combien pèse le panier plein ?`, p + n * m, 'g', `${n} × ${m} = ${n * m} g, puis ${n * m} + ${p} = ${p + n * m} g`); }],
  [3, 4, () => { const K = R(1, 3), g = R(2, 15) * 50; return P('masse', `Tu as ${K} kg de farine. Tu en utilises ${g} g pour une recette. Combien de grammes te reste-t-il ?`, K * 1000 - g, 'g', `${K} kg = ${K * 1000} g. ${K * 1000} − ${g} = ${K * 1000 - g} g`); }],
  [4, 5, () => { const a = R(15, 45) / 10, n = R(3, 8); return P('masse', `Un sac de graines pèse ${fmt(a)} kg. Combien pèsent ${n} sacs ?`, a * n, 'kg', `${fmt(a)} × ${n} = ${fmt(a * n)} kg`); }],
  [5, 5, () => { const n = R(6, 12), m = pick([250, 500, 750]), c = pick([1, 1.5, 2]); return P('masse', `Une caisse vide pèse ${fmt(c)} kg. On y met ${n} pots de confiture de ${m} g. Combien pèse la caisse pleine, en kg ?`, c + (n * m) / 1000, 'kg', `${n} × ${m} = ${n * m} g = ${fmt((n * m) / 1000)} kg, puis + ${fmt(c)} = ${fmt(c + (n * m) / 1000)} kg`); }],
  [5, 5, () => { const t = R(1, 4), s = pick([25, 50]); return P('masse', `Un camion transporte ${t} tonne${t > 1 ? 's' : ''} de blé. Combien de sacs de ${s} kg peut-on remplir ?`, (t * 1000) / s, 'sacs', `${t} t = ${t * 1000} kg. ${t * 1000} ÷ ${s} = ${(t * 1000) / s} sacs`); }],
];
T.contenance = [
  [1, 2, (d) => { const c = d <= 1 ? pick([10, 20, 50]) : pick([25, 33, 75, 20]), n = R(2, 9); return P('contenance', `Une bouteille contient ${c} cL. Combien de cL y a-t-il dans ${n} bouteilles ?`, c * n, 'cL', `${n} × ${c} = ${c * n} cL`); }],
  [1, 2, () => { const A = R(6, 15), b = R(2, A - 1); return P('contenance', `L’arrosoir contient ${A} L d’eau. Tu en verses ${b} L sur les radis. Combien de litres reste-t-il ?`, A - b, 'L', `${A} − ${b} = ${A - b} L`); }],
  [2, 3, () => { const v = pick([20, 25, 50]), L = R(1, 5); return P('contenance', `Avec ${L} L de jus, combien de verres de ${v} cL peux-tu remplir ?`, (L * 100) / v, 'verres', `${L} L = ${L * 100} cL. ${L * 100} ÷ ${v} = ${(L * 100) / v} verres`); }],
  [2, 3, () => { const b = pick([2, 3, 5]), q = R(4, 12); return P('contenance', `Un tonneau contient ${b * q} L de jus. Tu le verses dans des bidons de ${b} L. Combien de bidons remplis-tu ?`, q, 'bidons', `${b * q} ÷ ${b} = ${q} bidons`); }],
  [3, 4, () => { const C = pick([1, 1.5, 2]), v = pick([20, 25]), n = R(2, Math.floor((C * 100) / v) - 1); return P('contenance', `Une carafe contient ${fmt(C)} L de jus. Tu sers ${n} verres de ${v} cL. Combien de cL reste-t-il dans la carafe ?`, C * 100 - n * v, 'cL', `${fmt(C)} L = ${C * 100} cL. ${n} × ${v} = ${n * v} cL. ${C * 100} − ${n * v} = ${C * 100 - n * v} cL`); }],
  [4, 5, () => { const a = pick([2.5, 1.5, 3.5, 4.5]), h = R(2, 6); return P('contenance', `Le pressoir fait ${fmt(a)} L de jus par heure. Combien de litres fait-il en ${h} heures ?`, a * h, 'L', `${fmt(a)} × ${h} = ${fmt(a * h)} L`); }],
  [5, 5, () => { const L = R(5, 12), v = 75; return P('contenance', `Un seau contient ${L} L de jus. Combien de bouteilles de 75 cL peux-tu remplir complètement ?`, Math.floor((L * 100) / v), 'bouteilles', `${L} L = ${L * 100} cL. ${L * 100} ÷ 75 = ${Math.floor((L * 100) / v)} et il reste ${(L * 100) % v} cL : ${Math.floor((L * 100) / v)} bouteilles pleines`, 'Convertis en cL, divise, et ne compte que les bouteilles pleines.'); }],
  [5, 5, () => { const n = R(4, 12), v = pick([25, 50, 75]); return P('contenance', `Tu remplis ${n} bouteilles de ${v} cL. Combien de litres de jus as-tu utilisés ?`, (n * v) / 100, 'L', `${n} × ${v} = ${n * v} cL = ${fmt((n * v) / 100)} L`); }],
];
T.duree = [
  [1, 2, () => { const a = R(15, 45), b = R(10, 30); return P('duree', `La tarte cuit ${a} minutes, puis refroidit ${b} minutes. Combien de minutes en tout ?`, a + b, 'min', `${a} + ${b} = ${a + b} min`); }],
  [1, 2, () => { const n = R(20, 35), k = R(5, n - 5); return P('duree', `Les carottes poussent en ${n} jours. Tu les as semées il y a ${k} jours. Dans combien de jours pourras-tu les récolter ?`, n - k, 'jours', `${n} − ${k} = ${n - k} jours`); }],
  [2, 4, () => {
    const h = R(8, 16), m = R(2, 10) * 5, c = R(4, 11) * 5;
    const tot = h * 60 + m + c, right = hm(Math.floor(tot / 60), tot % 60);
    const w1 = hm(h, m + c <= 99 ? m + c : (m + c) % 100), w2 = hm(Math.floor((tot + 10) / 60), (tot + 10) % 60), w3 = hm(Math.floor((tot - 10) / 60), (tot - 10) % 60), w4 = hm(Math.floor(tot / 60) + 1, tot % 60);
    return C('duree', `Le pain entre au four à ${hm(h, m)}. Il cuit ${c} minutes. À quelle heure sort-il ?`, right, [w1, w2, w3, w4].filter((w, i, a) => a.indexOf(w) === i), `${hm(h, m)} + ${c} min = ${right}`);
  }],
  [3, 4, () => { const h = R(1, 2), m = R(1, 11) * 5, c = R(20, 50); return P('duree', `La pâte repose ${h} h ${m} min, puis cuit ${c} min. Combien de minutes en tout ?`, h * 60 + m + c, 'min', `${h} h ${m} min = ${h * 60 + m} min. ${h * 60 + m} + ${c} = ${h * 60 + m + c} min`); }],
  [3, 5, () => { const h1 = R(7, 9), m1 = pick([0, 15, 30, 45]), h2 = R(11, 13), m2 = pick([0, 15, 30, 45]); const t = h2 * 60 + m2 - (h1 * 60 + m1); return P('duree', `Le marché ouvre à ${hm(h1, m1)} et ferme à ${hm(h2, m2)}. Combien de minutes est-il ouvert ?`, t, 'min', `De ${hm(h1, m1)} à ${hm(h2, m2)} : ${Math.floor(t / 60)} h ${t % 60} min = ${t} min`); }],
  [5, 5, () => { const n = pick([4, 6, 5]), c = pick([20, 25, 30]), k = R(2, 4); return P('duree', `Le four cuit ${n} pains en ${c} minutes. Combien de minutes faut-il pour cuire ${n * k} pains ?`, c * k, 'min', `${n * k} pains, c’est ${k} fournées de ${n}. ${k} × ${c} = ${c * k} min`); }],
];
T.recette = [
  [1, 2, () => { const a = R(3, 8), n = R(2, 6); return P('recette', `Pour 1 tarte, il faut ${a} fraises. Combien de fraises pour ${n} tartes ?`, a * n, 'fraises', `${n} × ${a} = ${a * n} fraises`); }],
  [1, 2, () => { const a = R(2, 9), n = R(2, 5); return P('recette', `Pour ${n} pains, il faut ${a * n} cuillères de sel. Combien de cuillères pour 1 pain ?`, a, 'cuillères', `${a * n} ÷ ${n} = ${a}`); }],
  [3, 3, () => { const n = R(2, 6), q = R(2, 5) * 50, k = R(2, 4); return P('recette', `Pour ${n} crêpes, il faut ${q} g de farine. Combien de farine pour ${n * k} crêpes ?`, q * k, 'g', `${n * k} crêpes, c’est ${k} fois plus. ${q} × ${k} = ${q * k} g`); }],
  [4, 4, () => { const p = pick([4, 6, 8]), q = (p / 2) * R(2, 8) * 10, p2 = p + p / 2; return P('recette', `Pour ${p} personnes, il faut ${q} g de pâtes. Combien en faut-il pour ${p2} personnes ?`, (q / p) * p2, 'g', `Pour 1 personne : ${q} ÷ ${p} = ${fmt(q / p)} g. Pour ${p2} : ${fmt(q / p)} × ${p2} = ${fmt((q / p) * p2)} g`); }],
  [4, 5, () => { const kg = R(2, 5), p = R(2, 6), k = R(2, 4); return P('recette', `${kg} kg de pommes coûtent ${kg * p} CHF. Combien coûtent ${kg * k} kg ?`, kg * p * k, 'CHF', `1 kg coûte ${kg * p} ÷ ${kg} = ${p} CHF. ${kg * k} × ${p} = ${kg * p * k} CHF`); }],
  [5, 5, () => { const a = pick([1.2, 1.5, 0.8, 2.4]), n = 4, n2 = pick([6, 10, 12]); return P('recette', `Pour ${n} pots de confiture, il faut ${fmt(a)} kg de fraises. Combien de kg pour ${n2} pots ?`, (a / n) * n2, 'kg', `Pour 1 pot : ${fmt(a)} ÷ ${n} = ${fmt(a / n)} kg. Pour ${n2} pots : ${fmt(a / n)} × ${n2} = ${fmt((a / n) * n2)} kg`); }],
];
T.argent = [
  [1, 1, () => { const p = R(2, 9), n = R(2, 9); return P('argent', `Un paquet de graines coûte ${p} CHF. Tu en achètes ${n}. Combien paies-tu ?`, p * n, 'CHF', `${n} × ${p} = ${p * n} CHF`); }],
  [1, 2, () => { const A = R(30, 99), p = R(12, A - 5); return P('argent', `Tu as ${A} CHF. Tu achètes un arrosoir à ${p} CHF. Combien te reste-t-il ?`, A - p, 'CHF', `${A} − ${p} = ${A - p} CHF`); }],
  [3, 3, () => { const n = R(2, 6), p = R(2, 8), B = n * p < 20 ? 20 : n * p < 50 ? 50 : 100; return P('argent', `Tu achètes ${n} kg de pommes à ${p} CHF le kilo. Tu paies avec un billet de ${B} CHF. Combien te rend-on ?`, B - n * p, 'CHF', `${n} × ${p} = ${n * p} CHF. ${B} − ${n * p} = ${B - n * p} CHF`); }],
  [4, 4, () => { const p = pick([3.5, 2.5, 4.5, 1.5, 2.2, 3.4]), n = R(2, 6); return P('argent', `Un pain coûte ${chf(p)} CHF. Combien coûtent ${n} pains ?`, p * n, 'CHF', `${n} × ${chf(p)} = ${chf(p * n)} CHF`); }],
  [5, 5, () => { const kg = 3, p = pick([7.5, 9, 4.5, 6]), k = pick([5, 2, 4]); return P('argent', `${kg} kg de cerises coûtent ${chf(p)} CHF. Combien coûtent ${k} kg ?`, (p / kg) * k, 'CHF', `1 kg : ${chf(p)} ÷ ${kg} = ${chf(p / kg)} CHF. ${k} kg : ${chf(p / kg)} × ${k} = ${chf((p / kg) * k)} CHF`); }],
  [5, 5, () => { const a = pick([3.4, 2.8, 4.2]), t = pick([12.8, 9.6, 14.5]), tot = 2 * a + t; return P('argent', `Tu achètes 2 pains à ${chf(a)} CHF et une tarte à ${chf(t)} CHF. Tu paies avec 50 CHF. Combien te rend-on ?`, 50 - tot, 'CHF', `2 × ${chf(a)} + ${chf(t)} = ${chf(tot)} CHF. 50 − ${chf(tot)} = ${chf(50 - tot)} CHF`); }],
];
T.geo = [
  [1, 2, () => { const c = R(3, 12); return P('geo', `Un potager carré mesure ${c} m de côté. Combien de mètres de clôture faut-il pour en faire le tour ?`, 4 * c, 'm', `Un carré a 4 côtés égaux : 4 × ${c} = ${4 * c} m`); }],
  [2, 3, () => { const L = R(6, 20), l = R(3, L - 1); return P('geo', `Un champ rectangulaire mesure ${L} m sur ${l} m. Quel est son périmètre ?`, 2 * (L + l), 'm', `(${L} + ${l}) × 2 = ${2 * (L + l)} m`); }],
  [3, 4, () => { const L = R(5, 15), l = R(3, 9); return P('geo', `Un champ rectangulaire mesure ${L} m sur ${l} m. Quelle est son aire ?`, L * l, 'm²', `${L} × ${l} = ${L * l} m²`); }],
  [4, 5, () => { const L = R(8, 20), l = R(3, L - 2), Pm = 2 * (L + l); return P('geo', `Un rectangle a un périmètre de ${Pm} m. Sa longueur mesure ${L} m. Combien mesure sa largeur ?`, l, 'm', `${Pm} ÷ 2 = ${L + l} m (une longueur + une largeur). ${L + l} − ${L} = ${l} m`); }],
  [5, 5, () => { const L = R(4, 9), l = R(2, 6), k = R(3, 6); return P('geo', `Une parcelle mesure ${L} m sur ${l} m. On sème ${k} graines par m². Combien de graines faut-il ?`, L * l * k, 'graines', `Aire : ${L} × ${l} = ${L * l} m². ${L * l} × ${k} = ${L * l * k} graines`); }],
  [5, 5, () => { const c = R(4, 12); return P('geo', `Un carré a un périmètre de ${4 * c} m. Quelle est son aire ?`, c * c, 'm²', `Côté : ${4 * c} ÷ 4 = ${c} m. Aire : ${c} × ${c} = ${c * c} m²`); }],
];
T.longueur = [
  [1, 2, () => { const a = R(200, 900), b = R(50, a - 50); return P('longueur', `Le chemin jusqu’au lac mesure ${a} m. Tu as déjà marché ${b} m. Combien de mètres te reste-t-il ?`, a - b, 'm', `${a} − ${b} = ${a - b} m`); }],
  [2, 3, () => { const n = R(2, 6), q = R(12, 40); return P('longueur', `Une planche mesure ${n * q} cm. Tu la coupes en ${n} morceaux égaux. Combien mesure chaque morceau ?`, q, 'cm', `${n * q} ÷ ${n} = ${q} cm`); }],
  [3, 4, () => { const M = R(4, 12), w = pick([20, 25, 50]); return P('longueur', `Le pont mesure ${M} m de long. Chaque planche fait ${w} cm de large. Combien de planches faut-il ?`, (M * 100) / w, 'planches', `${M} m = ${M * 100} cm. ${M * 100} ÷ ${w} = ${(M * 100) / w} planches`); }],
  [4, 5, () => { const a = R(15, 45) / 10, b = R(25, 95); return P('longueur', `Tu as une corde de ${fmt(a)} m. Tu en coupes ${b} cm. Combien de cm reste-t-il ?`, a * 100 - b, 'cm', `${fmt(a)} m = ${fmt(a * 100)} cm. ${fmt(a * 100)} − ${b} = ${fmt(a * 100 - b)} cm`); }],
  [5, 5, () => { const L = R(8, 15) * 10, l = R(4, 7) * 10, n = R(2, 4), d = 2 * (L + l) * n; return P('longueur', `Tu fais ${n} fois le tour d’un champ de ${L} m sur ${l} m. Combien de km parcours-tu ?`, d / 1000, 'km', `Un tour : (${L} + ${l}) × 2 = ${2 * (L + l)} m. × ${n} = ${d} m = ${fmt(d / 1000)} km`); }],
];

T.animaux = [
  [1, 2, (d) => { const a = R(2, d <= 1 ? 6 : 12), b = R(1, d <= 1 ? 4 : 9); return P('animaux', `Dans le pré, il y a ${a} poules et ${b} vaches. Combien de pattes en tout ?`, 2 * a + 4 * b, 'pattes', `Poules : ${a} × 2 = ${2 * a}. Vaches : ${b} × 4 = ${4 * b}. ${2 * a} + ${4 * b} = ${2 * a + 4 * b} pattes`, 'Une poule a 2 pattes, une vache en a 4.'); }],
  [1, 2, () => { const n = R(3, 7), k = R(2, 6); return P('animaux', `Une poule pond ${n} œufs par semaine. Combien d’œufs pond-elle en ${k} semaines ?`, n * k, 'œufs', `${k} × ${n} = ${n * k} œufs`); }],
  [2, 3, () => { const q = R(3, 12); return P('animaux', `Tu as ramassé ${q * 6} œufs. Tu les ranges dans des boîtes de 6. Combien de boîtes remplis-tu ?`, q, 'boîtes', `${q * 6} ÷ 6 = ${q} boîtes`); }],
  [3, 3, () => { const e = R(20, 70), b = pick([6, 10, 12]); return P('animaux', `Tu as ${e} œufs et des boîtes de ${b}. Combien de boîtes peux-tu remplir complètement ?`, Math.floor(e / b), 'boîtes', `${e} ÷ ${b} = ${Math.floor(e / b)} et il reste ${e % b} œufs : ${Math.floor(e / b)} boîtes pleines`, 'Divise, et ne compte que les boîtes pleines.'); }],
  [3, 4, () => { const L = R(8, 25), j = pick([7, 5, 10]); return P('animaux', `Ta vache donne ${L} L de lait par jour. Combien de litres en ${j} jours ?`, L * j, 'L', `${L} × ${j} = ${L * j} L`); }],
  [4, 4, () => { const L = pick([12.5, 8.5, 15.5, 9.5]), j = R(2, 6); return P('animaux', `Ta vache donne ${fmt(L)} L de lait par jour. Combien de litres en ${j} jours ?`, L * j, 'L', `${fmt(L)} × ${j} = ${fmt(L * j)} L`); }],
  [4, 5, () => { const kg = pick([1.5, 2.5, 0.5]), n = R(2, 6), j = R(2, 5); return P('animaux', `Un mouton mange ${fmt(kg)} kg de foin par jour. Combien de kg faut-il pour ${n} moutons pendant ${j} jours ?`, kg * n * j, 'kg', `Par jour : ${fmt(kg)} × ${n} = ${fmt(kg * n)} kg. En ${j} jours : ${fmt(kg * n)} × ${j} = ${fmt(kg * n * j)} kg`); }],
  [5, 5, () => { const L = R(2, 9) * 10; return P('animaux', `Il faut 10 L de lait pour faire 1 kg de fromage. Combien de kg de fromage fais-tu avec ${L} L ?`, L / 10, 'kg', `${L} ÷ 10 = ${L / 10} kg`); }],
  [5, 5, () => { const kg = R(2, 6), p = pick([250, 500]); return P('animaux', `Les abeilles ont fait ${kg} kg de miel. Tu remplis des pots de ${p} g. Combien de pots ?`, (kg * 1000) / p, 'pots', `${kg} kg = ${kg * 1000} g. ${kg * 1000} ÷ ${p} = ${(kg * 1000) / p} pots`); }],
  [5, 5, () => { const e = pick([12, 18, 15]), j = 3, k = pick([5, 7, 10]); return P('animaux', `Tes poules pondent ${e} œufs en ${j} jours. Combien en ${k} jours ?`, (e / j) * k, 'œufs', `Par jour : ${e} ÷ ${j} = ${e / j}. En ${k} jours : ${e / j} × ${k} = ${(e / j) * k} œufs`); }],
];

// Énigmes: small problems in several steps (budget, logic, sequences, "I think of a number"…)
const KIDS = ['Léa', 'Tom', 'Zoé', 'Noé', 'Mia', 'Hugo', 'Lina', 'Sami'];
const FRUITS = [['pommes', 'pomme'], ['bananes', 'banane'], ['kiwis', 'kiwi'], ['poires', 'poire'], ['oranges', 'orange'], ['prunes', 'prune']];
T.enigme = [
  // two steps: buy then change
  [1, 2, (d) => {
    const k = pick(KIDS), n = R(2, 5), p = R(2, d <= 1 ? 4 : 8), A = n * p + R(2, 12);
    return P('enigme', `${k} a ${A} CHF. ${k} achète ${n} cahiers à ${p} CHF chacun. Combien lui reste-t-il ?`, A - n * p, 'CHF', `${n} × ${p} = ${n * p} CHF. ${A} − ${n * p} = ${A - n * p} CHF`);
  }],
  [1, 2, () => {
    const k = pick(KIDS), b = R(3, 6), per = R(4, 9), g = R(2, b * per - 2);
    return P('enigme', `${k} a ${b} sacs de ${per} billes. ${k} en donne ${g} à un copain. Combien de billes lui reste-t-il ?`, b * per - g, 'billes', `${b} × ${per} = ${b * per}. ${b * per} − ${g} = ${b * per - g} billes`);
  }],
  [1, 3, (d) => {
    const st = R(1, 9), step = R(2, d <= 1 ? 5 : 12), seq = [0, 1, 2, 3].map((i) => st + i * step);
    return P('enigme', `Trouve le nombre suivant : ${seq.join(', ')}, @`, st + 4 * step, '', `On ajoute ${step} à chaque fois : ${seq[3]} + ${step} = ${st + 4 * step}`, 'Regarde de combien on avance entre deux nombres.');
  }],
  [2, 3, () => {
    const s = R(4, 9), plus = R(2, 6), mult = 2;
    return P('enigme', `J’ai le double de l’âge de ma sœur. Elle a ${s} ans. Quel âge aurai-je dans ${plus} ans ?`, s * mult + plus, 'ans', `Moi : ${s} × 2 = ${s * 2} ans. Dans ${plus} ans : ${s * 2} + ${plus} = ${s * 2 + plus} ans`);
  }],
  [2, 3, () => {
    const a = R(9, 15), c = R(5, 8), na = R(1, 2), nc = R(2, 4);
    return P('enigme', `Au cinéma, une place adulte coûte ${a} CHF et une place enfant ${c} CHF. Combien paie une famille de ${na} adulte${na > 1 ? 's' : ''} et ${nc} enfants ?`, na * a + nc * c, 'CHF', `Adultes : ${na} × ${a} = ${na * a}. Enfants : ${nc} × ${c} = ${nc * c}. Total : ${na * a + nc * c} CHF`);
  }],
  [2, 3, () => {
    const kids = R(3, 6), each = R(3, 8), rest = R(1, kids - 1), tot = kids * each + rest;
    return P('enigme', `On partage ${tot} bonbons entre ${kids} enfants, chacun la même chose. Combien de bonbons reste-t-il à la fin ?`, rest, 'bonbons', `${tot} ÷ ${kids} = ${each}, reste ${rest}`, 'Divise, puis regarde ce qui reste.');
  }],
  // the fruit budget: buy the cheapest first to get the most fruits
  [3, 4, () => {
    const pickF = [...FRUITS].sort(() => Math.random() - 0.5).slice(0, 3);
    const items = pickF.map((f, i) => ({ f, price: [1, 2, 3][i] + (Math.random() < 0.5 ? 0 : [0, 1, 1][i]), max: R(1, 4) }));
    items.sort((x, y) => x.price - y.price);
    const all = items.reduce((t, it) => t + it.price * it.max, 0);
    const money = R(Math.max(4, Math.floor(all / 2)), all - 1);
    let left = money, count = 0; const steps = [];
    for (const it of items) { const n = Math.min(it.max, Math.floor(left / it.price)); if (n) steps.push(`${n} ${n > 1 ? it.f[0] : it.f[1]} (${n * it.price} CHF)`); left -= n * it.price; count += n; }
    const k = pick(KIDS);
    const list = items.map((it) => `${it.max} ${it.max > 1 ? it.f[0] : it.f[1]} à ${it.price} CHF`).join(', ');
    return P('enigme', `${k} a ${money} CHF. Au marché, il reste : ${list} (prix pour chaque fruit). Combien de fruits ${k} peut acheter au maximum ?`, count, 'fruits',
      `Pour en avoir le plus, on prend d’abord les moins chers : ${steps.join(' + ')}. Total : ${count} fruits`, 'Pour avoir le plus de fruits, commence par les moins chers.');
  }],
  [3, 4, () => {
    const x = R(3, 12), m = R(2, 5), a = R(2, 15), res = x * m + a;
    return P('enigme', `Je pense à un nombre. Je le multiplie par ${m}, puis j’ajoute ${a}. J’obtiens ${res}. Quel est mon nombre ?`, x, '', `On fait à l’envers : ${res} − ${a} = ${res - a}, puis ${res - a} ÷ ${m} = ${x}`, 'Fais le chemin à l’envers : enlève, puis divise.');
  }],
  [3, 4, () => {
    const e = R(13, 50), b = pick([6, 10, 12]);
    return P('enigme', `Tu as ${e} œufs et des boîtes de ${b}. Combien de boîtes faut-il pour ranger TOUS les œufs ?`, Math.ceil(e / b), 'boîtes', `${e} ÷ ${b} = ${Math.floor(e / b)} reste ${e % b} : il faut une boîte de plus pour le reste, donc ${Math.ceil(e / b)}`, 'S’il reste des œufs, il faut une boîte en plus.');
  }],
  [3, 5, () => {
    const has = R(2, 12), w = R(3, 8), price = has + w * R(3, 8) - R(0, w - 1);
    const weeks = Math.ceil((price - has) / w);
    return P('enigme', `Tu reçois ${w} CHF par semaine. Tu as déjà ${has} CHF. Un jeu coûte ${price} CHF. Dans combien de semaines peux-tu l’acheter ?`, weeks, 'semaines', `Il manque ${price} − ${has} = ${price - has} CHF. ${price - has} ÷ ${w} → ${weeks} semaines (on arrondit au-dessus)`);
  }],
  [4, 5, () => {
    const st = R(1, 4), r = pick([2, 3]), seq = [0, 1, 2, 3].map((i) => st * r ** i);
    return P('enigme', `Trouve le nombre suivant : ${seq.join(', ')}, @`, st * r ** 4, '', `On multiplie par ${r} à chaque fois : ${seq[3]} × ${r} = ${st * r ** 4}`, 'Ici on ne fait pas +, on fait ×.');
  }],
  [4, 5, () => {
    const L = R(3, 8) * pick([2, 3, 4, 5]), gap = pick([2, 3, 4, 5]);
    const len = Math.floor(L / gap) * gap;
    return P('enigme', `Une clôture droite mesure ${len} m. On plante un piquet tous les ${gap} m, et aussi un à chaque bout. Combien de piquets faut-il ?`, len / gap + 1, 'piquets', `${len} ÷ ${gap} = ${len / gap} espaces, donc ${len / gap} + 1 = ${len / gap + 1} piquets`, 'Dessine-la ! Il y a toujours un piquet de plus que d’espaces.');
  }],
  [4, 5, () => {
    const lap = R(2, 9), pou = R(2, 9), tetes = lap + pou, pattes = lap * 4 + pou * 2;
    return P('enigme', `Dans la ferme, il y a des poules et des lapins : ${tetes} têtes et ${pattes} pattes. Combien de lapins ?`, lap, 'lapins', `Si tous étaient des poules : ${tetes} × 2 = ${tetes * 2} pattes. Il y a ${pattes - tetes * 2} pattes en plus, 2 par lapin : ${pattes - tetes * 2} ÷ 2 = ${lap} lapins`, 'Imagine que ce sont toutes des poules, puis compte les pattes en trop.');
  }],
  [4, 5, () => {
    const st = 8, gap = pick([10, 15, 20, 30]), end = pick([10, 11, 12]);
    const n = ((end - st) * 60) / gap;
    return P('enigme', `Le bus passe toutes les ${gap} minutes, à partir de 8 h 00. Combien de bus passent avant ${end} h 00 (sans compter celui de ${end} h) ?`, n, 'bus', `De 8 h à ${end} h : ${(end - st) * 60} min. ${(end - st) * 60} ÷ ${gap} = ${n} bus`);
  }],
  [5, 5, () => {
    const son = R(4, 10), x = R(2, 8), dad = 3 * (son + x) - x;
    return P('enigme', `Papa a ${dad} ans et son fils ${son} ans. Dans combien d’années Papa aura-t-il exactement 3 fois l’âge de son fils ?`, x, 'ans', `Dans ${x} ans : Papa ${dad + x}, fils ${son + x}, et ${son + x} × 3 = ${dad + x}`, 'Essaie : dans 1 an, dans 2 ans… et vérifie à chaque fois.');
  }],
  [5, 5, () => {
    const p1 = pick([2.5, 3.5, 1.5]), n1 = R(2, 4), p2 = pick([4.2, 2.8, 5.5]), A = 20;
    const tot = n1 * p1 + p2;
    return P('enigme', `Avec un billet de ${A} CHF, tu achètes ${n1} glaces à ${chf(p1)} CHF et un livre à ${chf(p2)} CHF. Combien te rend-on ?`, A - tot, 'CHF', `${n1} × ${chf(p1)} = ${chf(n1 * p1)}. + ${chf(p2)} = ${chf(tot)}. ${A} − ${chf(tot)} = ${chf(A - tot)} CHF`);
  }],
];

function theme(name, d) {
  const list = T[name].filter(([a, b]) => d >= a && d <= b);
  const all = list.length ? list : T[name];
  return pick(all)[2](d);
}

/** Make one problem of a category at difficulty d (1-5). */
export function makeProblem(cat, d) {
  d = Math.max(1, Math.min(5, Math.round(d)));
  if (cat === 'calc') return pick(CALC_POOLS[d])(d);
  if (cat === 'add') return genAdd(d);
  if (cat === 'mul') return genMul(d);
  if (cat === 'frac') return frac(d);
  if (cat === 'conv') return conv(d);
  if (T[cat]) return theme(cat, d);
  return pick(CALC_POOLS[d])(d);
}

/** True if the typed answer matches. */
export function checkAnswer(p, input) {
  if (p.choices) return input === p.a;
  const v = Number(String(input).replace(/\s| /g, '').replace(',', '.'));
  return Number.isFinite(v) && Math.abs(v - p.a) < 0.001;
}

/** Problem text → HTML: stacked fractions and the @ box. */
export function renderQ(text) {
  const esc = String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return esc
    .replace(/\[([\d@]+)\/([\d@]+)\]/g, (_, a, b) => `<span class="frac"><span>${a === '@' ? '<b class="qbox">?</b>' : a}</span><span>${b}</span></span>`)
    .replace(/@/g, '<b class="qbox">?</b>');
}
