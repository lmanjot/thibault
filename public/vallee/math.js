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

function P(cat, q, a, u, ex, hint, lesson) {
  const p = { cat, q, a: r3(a), u: u || '', ex, hint: hint || HINTS[cat] };
  if (lesson) p.lesson = lesson; // a lesson other than the theme's (decimal additions → decimals)
  return p;
}
function C(cat, q, right, wrongs, ex, hint) {
  const choices = shuffle([right, ...wrongs.filter((w) => w !== right).slice(0, 3)]);
  return { cat, q, a: right, choices, u: '', ex, hint: hint || HINTS[cat] };
}

// ---------- Calcul ----------
// Additions: 1 two digits + one digit (23 + 5) · 2 with a carry (27 + 8) · 3 two digits, no carry (63 + 21)
// 4 two digits with a carry (38 + 45) · 5 three digits · 6 four digits · 7 bigger
function add(d) {
  let a, b;
  if (d <= -1) { a = R(1, 8); b = R(1, 10 - a); } // within 10: 4 + 3
  else if (d === 0) { if (Math.random() < 0.5) { a = R(11, 17); b = R(1, 9 - (a % 10)); } else { a = R(4, 9); b = R(10 - a + 1, 9); } } // within 20: 12 + 5, 8 + 6
  else if (d <= 1) { a = R(1, 9) * 10 + R(0, 7); b = R(1, 9 - (a % 10)); }
  else if (d === 2) { const au = R(2, 9); a = R(1, 8) * 10 + au; b = R(10 - au, 9); }
  else if (d === 3) { const at = R(1, 7), au = R(0, 8), bt = R(1, 8 - at), bu = R(1, 9 - au); a = at * 10 + au; b = bt * 10 + bu; }
  else if (d === 4) { const au = R(3, 9), bu = R(10 - au, 9); a = R(1, 5) * 10 + au; b = R(1, 3) * 10 + bu; }
  else if (d === 5) { a = R(125, 689); b = R(112, 299); }
  else if (d === 6) { a = R(1250, 6800); b = R(340, 2900); }
  else { a = R(2500, 8999); b = R(1250, 9999); }
  return P('calc', `${fmt(a)} + ${fmt(b)} = @`, a + b, '', `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`);
}
// Subtractions: 1 two digits − one digit (27 − 5) · 2 with borrowing (23 − 8) · 3 two digits, no borrowing (58 − 23)
// 4 two digits with borrowing (72 − 38) · 5 three digits, no borrowing · 6 three digits with borrowing · 7 four digits
function sub(d) {
  let a, b;
  if (d <= -1) { a = R(3, 10); b = R(1, a - 1); } // within 10: 8 − 3
  else if (d === 0) { if (Math.random() < 0.5) { a = R(12, 19); b = R(1, a % 10); } else { a = R(11, 17); b = R((a % 10) + 1, 9); } } // within 20: 15 − 4, 12 − 5
  else if (d <= 1) { a = R(1, 9) * 10 + R(1, 9); b = R(1, a % 10); }
  else if (d === 2) { a = R(2, 9) * 10 + R(0, 7); b = R((a % 10) + 1, 9); }
  else if (d === 3) { const at = R(3, 9), au = R(2, 9), bt = R(1, at - 1), bu = R(0, au); a = at * 10 + au; b = bt * 10 + bu; }
  else if (d === 4) { const at = R(3, 9), au = R(0, 7), bt = R(1, at - 1), bu = R(au + 1, 9); a = at * 10 + au; b = bt * 10 + bu; }
  else if (d === 5) { const ah = R(3, 9), at = R(1, 9), au = R(1, 9); a = ah * 100 + at * 10 + au; b = R(1, ah - 1) * 100 + R(0, at) * 10 + R(0, au); }
  else if (d === 6) { do { a = R(300, 999); b = R(105, a - 50); } while (a % 10 >= b % 10 && Math.floor(a / 10) % 10 >= Math.floor(b / 10) % 10); }
  else { a = R(2000, 9999); b = R(305, a - 300); }
  return P('calc', `${fmt(a)} − ${fmt(b)} = @`, a - b, '', `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}`,
    d === 2 || d === 4 || d >= 6 ? 'Si le chiffre du haut est trop petit, il gagne 10, et la colonne suivante enlève 1 de plus (la retenue).' : null);
}
// Decimal additions and subtractions (the « Nombres à virgule » notion): k 1 or 2
function addDec(k) {
  const a = k <= 1 ? R(105, 899) / 10 : R(1005, 8999) / 100, b = k <= 1 ? R(15, 399) / 10 : R(105, 999) / 10;
  return P('decimaux', `${fmt(a)} + ${fmt(b)} = @`, a + b, '', `${fmt(a)} + ${fmt(b)} = ${fmt(a + b)}`, 'Aligne bien les virgules : les dixièmes sous les dixièmes.');
}
function subDec(k) {
  let a, b;
  if (k <= 1) { a = R(200, 999) / 10; b = R(15, Math.floor(a * 10) - 20) / 10; }
  else if (Math.random() < 0.5) { a = R(50, 300); b = R(105, a * 10 - 50) / 10; }
  else { a = R(1000, 4000) / 100; b = R(105, Math.floor(a * 10) - 30) / 10; }
  return P('decimaux', `${fmt(a)} − ${fmt(b)} = @`, a - b, '', `${fmt(a)} − ${fmt(b)} = ${fmt(a - b)}`, 'Aligne bien les virgules. Tu peux ajouter un 0 à droite : 25 = 25,0.');
}
function mul(d) {
  let a, b, ex = null;
  if (d <= -1) { a = pick([2, 10]); b = R(1, 5); }
  else if (d === 0) { a = pick([2, 5, 10]); b = R(1, 10); }
  else if (d <= 1) { a = pick([2, 3, 4, 5, 10]); b = R(2, 10); }
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
// Divisions: 1 tables of 2, 5, 10 · 2 all the tables · 3 two digits ÷ 2 to 5 (48 ÷ 3)
// 4 bigger quotients (296 ÷ 8) · 5 ÷ 10 / ÷ 100 and divisors 11 to 15
function div(d) {
  let b, q;
  if (d <= -1) { b = 2; q = R(1, 5); }
  else if (d === 0) { b = pick([2, 10]); q = R(1, 10); }
  else if (d <= 1) { b = pick([2, 5, 10]); q = R(2, 10); }
  else if (d === 2) { b = R(3, 9); q = R(2, 10); }
  else if (d === 3) { b = R(2, 5); q = R(11, b === 2 ? 45 : b === 3 ? 30 : 20); }
  else if (d === 4) { b = R(3, 9); q = R(12, 40); }
  else {
    if (Math.random() < 0.5) {
      const a = R(12, 99) * 10, k = pick([10, 100]);
      return P('calc', `${fmt(a)} ÷ ${k} = @`, a / k, '', `÷ ${k} : la virgule se déplace de ${String(k).length - 1} rang(s) vers la gauche → ${fmt(a / k)}`);
    }
    b = R(11, 15); q = R(3, 9);
  }
  const a = r3(b * q);
  return P('calc', `${fmt(a)} ÷ ${fmt(b)} = @`, q, '', `${fmt(a)} ÷ ${fmt(b)} = ${fmt(q)}, car ${fmt(q)} × ${fmt(b)} = ${fmt(a)}`,
    'Cherche quel nombre multiplié par le diviseur donne le nombre de départ.');
}
function mental(d) {
  if (d <= 0) {
    const big = d === 0 ? 15 : 9;
    if (Math.random() < 0.5) { const n = R(1, big); return P('calc', `Le double de ${n} = @`, n * 2, '', `${n} + ${n} = ${n * 2}`); }
    const n = 2 * R(1, big); return P('calc', `La moitié de ${n} = @`, n / 2, '', `${n} ÷ 2 = ${n / 2}`, 'La moitié, c’est partager en 2 parts égales.');
  }
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
  if (d <= 0) { const n = 2 * R(1, d === 0 ? 10 : 5); return P('frac', `La moitié de ${n} = @`, n / 2, '', `${n} ÷ 2 = ${n / 2}`, 'La moitié, c’est partager en 2 parts égales.'); }
  if (d <= 1) {
    if (Math.random() < 0.5) { const n = 2 * R(5, 30); return P('frac', `La moitié de ${n} = @`, n / 2, '', `${n} ÷ 2 = ${n / 2}`); }
    const n = 4 * R(2, 10); return P('frac', `Le quart de ${n} = @`, n / 4, '', `Le quart, c’est diviser par 4 : ${n} ÷ 4 = ${n / 4}`);
  }
  if (d === 2) {
    // unit fractions of small numbers: 1/3 de 15
    const b = pick([2, 3, 4, 5, 10]), n = b * R(2, b === 10 ? 6 : 9);
    return P('frac', `[1/${b}] de ${n} = @`, n / b, '', `[1/${b}] de ${n}, c’est ${n} ÷ ${b} = ${n / b}`);
  }
  if (d === 3) {
    // simple fractions with small denominators: 2/3 de 12, 3/4 de 20
    const b = pick([3, 4, 5]), a = R(2, b - 1), n = b * R(2, 8);
    return P('frac', `[${a}/${b}] de ${n} = @`, (n / b) * a, '', `${n} ÷ ${b} = ${n / b}, puis ${n / b} × ${a} = ${(n / b) * a}`);
  }
  if (d === 4) {
    const k = R(0, 3);
    if (k === 0) {
      const b = pick([6, 8, 10]), a = R(2, b - 1), n = b * R(2, 10);
      return P('frac', `[${a}/${b}] de ${n} = @`, (n / b) * a, '', `${n} ÷ ${b} = ${n / b}, puis ${n / b} × ${a} = ${(n / b) * a}`);
    }
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
  if (d <= 0) {
    // the basic facts (1 m = 100 cm), then small whole numbers of them
    const [f, t] = pick([['m', 'cm'], ['kg', 'g'], ['L', 'dL'], ['km', 'm']]);
    if (Math.random() < 0.2) { const hh = d === 0 ? R(2, 3) : 1; return P('conv', `${hh} h = @ min`, hh * 60, 'min', `1 h = 60 min${hh > 1 ? `, donc ${hh} × 60 = ${hh * 60} min` : ''}`); }
    return convQ(d === 0 ? R(2, 5) : 1, f, t);
  }
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
  [1, 3, (d) => { const A = d <= 2 ? R(20, d <= 1 ? 60 : 99) : R(120, 400), b = d <= 1 ? R(2, 9) : R(5, Math.floor(A / 2)); return P('masse', `Mamie a ${A} kg de pommes de terre. Elle en donne ${b} kg à la voisine. Combien de kg lui reste-t-il ?`, A - b, 'kg', `${A} − ${b} = ${A - b} kg`); }],
  [2, 3, () => { const b = pick([2, 4, 5, 6, 8, 10, 25]), q = R(3, 12); return P('masse', `Le meunier a ${b * q} kg de farine. Il la verse dans des sacs de ${b} kg. Combien de sacs remplit-il ?`, q, 'sacs', `${b * q} ÷ ${b} = ${q} sacs`); }],
  [2, 4, () => { const p = R(2, 5) * 50, n = R(3, 6), m = R(12, 20) * 10; return P('masse', `Un panier vide pèse ${p} g. Tu y mets ${n} pommes de ${m} g chacune. Combien pèse le panier plein ?`, p + n * m, 'g', `${n} × ${m} = ${n * m} g, puis ${n * m} + ${p} = ${p + n * m} g`); }],
  [3, 4, () => { const K = R(1, 3), g = R(2, 15) * 50; return P('masse', `Tu as ${K} kg de farine. Tu en utilises ${g} g pour une recette. Combien de grammes te reste-t-il ?`, K * 1000 - g, 'g', `${K} kg = ${K * 1000} g. ${K * 1000} − ${g} = ${K * 1000 - g} g`); }],
  [4, 5, () => { const a = R(15, 45) / 10, n = R(3, 8); return P('masse', `Un sac de graines pèse ${fmt(a)} kg. Combien pèsent ${n} sacs ?`, a * n, 'kg', `${fmt(a)} × ${n} = ${fmt(a * n)} kg`); }],
  [5, 5, () => { const n = R(6, 12), m = pick([250, 500, 750]), c = pick([1, 1.5, 2]); return P('masse', `Une caisse vide pèse ${fmt(c)} kg. On y met ${n} pots de confiture de ${m} g. Combien pèse la caisse pleine, en kg ?`, c + (n * m) / 1000, 'kg', `${n} × ${m} = ${n * m} g = ${fmt((n * m) / 1000)} kg, puis + ${fmt(c)} = ${fmt(c + (n * m) / 1000)} kg`); }],
  [5, 5, () => { const t = R(1, 4), s = pick([25, 50]); return P('masse', `Un camion transporte ${t} tonne${t > 1 ? 's' : ''} de blé. Combien de sacs de ${s} kg peut-on remplir ?`, (t * 1000) / s, 'sacs', `${t} t = ${t * 1000} kg. ${t * 1000} ÷ ${s} = ${(t * 1000) / s} sacs`); }],
];
T.contenance = [
  [1, 2, (d) => { const c = d <= 1 ? pick([10, 20, 50]) : pick([25, 33, 75, 20]), n = R(2, 9); return P('contenance', `Une bouteille contient ${c} cL. Combien de cL y a-t-il dans ${n} bouteilles ?`, c * n, 'cL', `${n} × ${c} = ${c * n} cL`); }],
  [1, 2, () => { const A = R(6, 15), b = R(2, Math.min(9, A - 1)); return P('contenance', `L’arrosoir contient ${A} L d’eau. Tu en verses ${b} L sur les radis. Combien de litres reste-t-il ?`, A - b, 'L', `${A} − ${b} = ${A - b} L`); }],
  [2, 3, () => { const v = pick([20, 25, 50]), L = R(1, 5); return P('contenance', `Avec ${L} L de jus, combien de verres de ${v} cL peux-tu remplir ?`, (L * 100) / v, 'verres', `${L} L = ${L * 100} cL. ${L * 100} ÷ ${v} = ${(L * 100) / v} verres`); }],
  [2, 3, () => { const b = pick([2, 3, 5]), q = R(4, 12); return P('contenance', `Un tonneau contient ${b * q} L de jus. Tu le verses dans des bidons de ${b} L. Combien de bidons remplis-tu ?`, q, 'bidons', `${b * q} ÷ ${b} = ${q} bidons`); }],
  [3, 4, () => { const C = pick([1, 1.5, 2]), v = pick([20, 25]), n = R(2, Math.floor((C * 100) / v) - 1); return P('contenance', `Une carafe contient ${fmt(C)} L de jus. Tu sers ${n} verres de ${v} cL. Combien de cL reste-t-il dans la carafe ?`, C * 100 - n * v, 'cL', `${fmt(C)} L = ${C * 100} cL. ${n} × ${v} = ${n * v} cL. ${C * 100} − ${n * v} = ${C * 100 - n * v} cL`); }],
  [4, 5, () => { const a = pick([2.5, 1.5, 3.5, 4.5]), h = R(2, 6); return P('contenance', `Le pressoir fait ${fmt(a)} L de jus par heure. Combien de litres fait-il en ${h} heures ?`, a * h, 'L', `${fmt(a)} × ${h} = ${fmt(a * h)} L`); }],
  [5, 5, () => { const L = R(5, 12), v = 75; return P('contenance', `Un seau contient ${L} L de jus. Combien de bouteilles de 75 cL peux-tu remplir complètement ?`, Math.floor((L * 100) / v), 'bouteilles', `${L} L = ${L * 100} cL. ${L * 100} ÷ 75 = ${Math.floor((L * 100) / v)} et il reste ${(L * 100) % v} cL : ${Math.floor((L * 100) / v)} bouteilles pleines`, 'Convertis en cL, divise, et ne compte que les bouteilles pleines.'); }],
  [5, 5, () => { const n = R(4, 12), v = pick([25, 50, 75]); return P('contenance', `Tu remplis ${n} bouteilles de ${v} cL. Combien de litres de jus as-tu utilisés ?`, (n * v) / 100, 'L', `${n} × ${v} = ${n * v} cL = ${fmt((n * v) / 100)} L`); }],
];
T.duree = [
  [1, 2, () => { const a = R(15, 45), b = R(10, 30); return P('duree', `La tarte cuit ${a} minutes, puis refroidit ${b} minutes. Combien de minutes en tout ?`, a + b, 'min', `${a} + ${b} = ${a + b} min`); }],
  [1, 2, (d) => { const n = d <= 1 ? R(12, 20) : R(20, 35), k = d <= 1 ? R(2, 9) : R(5, n - 5); return P('duree', `Les carottes poussent en ${n} jours. Tu les as semées il y a ${k} jours. Dans combien de jours pourras-tu les récolter ?`, n - k, 'jours', `${n} − ${k} = ${n - k} jours`); }],
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
  [1, 2, (d) => { const A = d <= 1 ? R(15, 40) : R(30, 99), p = d <= 1 ? R(3, 9) : R(12, A - 5); return P('argent', `Tu as ${A} CHF. Tu achètes un arrosoir à ${p} CHF. Combien te reste-t-il ?`, A - p, 'CHF', `${A} − ${p} = ${A - p} CHF`); }],
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
  [1, 3, (d) => { const a = d <= 1 ? R(4, 9) * 10 + R(5, 9) : d === 2 ? R(4, 9) * 10 + R(0, 4) : R(200, 900), b = d <= 1 ? R(2, 9) : d === 2 ? R(1, Math.floor(a / 10) - 1) * 10 + R(a % 10 + 1, 9) : R(50, a - 50); return P('longueur', `Le chemin jusqu’au lac mesure ${a} m. Tu as déjà marché ${b} m. Combien de mètres te reste-t-il ?`, a - b, 'm', `${a} − ${b} = ${a - b} m`); }],
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
    const k = pick(KIDS), n = d <= 1 ? R(2, 3) : R(2, 5), p = R(2, d <= 1 ? 3 : 8), A = n * p + R(2, 12);
    return P('enigme', `${k} a ${A} CHF. ${k} achète ${n} cahiers à ${p} CHF chacun. Combien lui reste-t-il ?`, A - n * p, 'CHF', `${n} × ${p} = ${n * p} CHF. ${A} − ${n * p} = ${A - n * p} CHF`);
  }],
  [1, 2, (d) => {
    const k = pick(KIDS), b = R(3, 6), per = R(4, 9), g = d <= 1 ? R(2, 9) : R(2, b * per - 2);
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

// ---------- 8H notions: unlocked one at a time once the basics are mastered (levels 1 to 3) ----------
const NC = {};
NC.arrondi = (d) => {
  if (d <= 1) {
    const n = R(12, 989), r = Math.round(n / 10) * 10, u = n % 10;
    return P('arrondi', `Arrondis ${n} à la dizaine : @`, r, '', `Le chiffre des unités est ${u} : ${u >= 5 ? 'on monte' : 'on garde'} → ${fmt(r)}`);
  }
  if (d === 2) {
    if (Math.random() < 0.5) { const n = R(1010, 9989), r = Math.round(n / 100) * 100, c = Math.floor(n / 10) % 10; return P('arrondi', `Arrondis ${fmt(n)} à la centaine : @`, r, '', `Le chiffre des dizaines est ${c} : ${c >= 5 ? 'on monte' : 'on garde'} → ${fmt(r)}`); }
    const n = R(1100, 49900), r = Math.round(n / 1000) * 1000, c = Math.floor(n / 100) % 10;
    return P('arrondi', `Arrondis ${fmt(n)} au millier : @`, r, '', `Le chiffre des centaines est ${c} : ${c >= 5 ? 'on monte' : 'on garde'} → ${fmt(r)}`);
  }
  if (Math.random() < 0.5) { const t = R(105, 999), n = t / 10, r = Math.round(n), c = t % 10; return P('arrondi', `Arrondis ${fmt(n)} à l’unité : @`, r, '', `Le chiffre des dixièmes est ${c} : ${c >= 5 ? 'on monte' : 'on garde'} → ${r}`); }
  const t = R(1005, 9999), n = t / 100, r = Math.round(t / 10) / 10, c = t % 10;
  return P('arrondi', `Arrondis ${fmt(n)} au dixième : @`, r, '', `Le chiffre des centièmes est ${c} : ${c >= 5 ? 'on monte' : 'on garde'} → ${fmt(r)}`);
};
NC.decimaux = (d) => {
  if (d <= 1) return pick([addDec, subDec])(1);
  if (d === 2) {
    if (Math.random() < 0.5) { const a = R(101, 999) / 100, b = pick([10, 100]); return P('decimaux', `${fmt(a)} × ${b} = @`, a * b, '', `× ${b} : la virgule avance de ${String(b).length - 1} rang(s) vers la droite → ${fmt(a * b)}`, 'Multiplier par 10, c’est avancer la virgule d’un rang vers la droite.'); }
    const i = R(2, 9), a = R(5, 9);
    const s = (x) => fmt(r3(x));
    const right = s(i + a / 10), w = [s(i + ((a - 1) * 100 + R(1, 9) * 10 + R(1, 9)) / 1000), s(i + (a - 1) / 10 + R(1, 9) / 100), s(i - 1 + 0.9 + R(1, 9) / 100)];
    return C('decimaux', 'Quel est le plus grand nombre ?', right, w, `${right} : les unités sont pareilles (${i}), et ${a} dixièmes, c’est le plus`, 'Compare les unités, puis les dixièmes, puis les centièmes. Ce n’est pas le plus long qui gagne !');
  }
  if (Math.random() < 0.34) { const a = R(15, 45) / 10, b = R(3, 9); return P('decimaux', `${fmt(a)} × ${b} = @`, a * b, '', `${fmt(a)} × ${b} = ${Math.round(a * 10)} × ${b} ÷ 10 = ${Math.round(a * 10) * b} ÷ 10 = ${fmt(a * b)}`, 'Calcule sans la virgule, puis remets-la : un chiffre après la virgule.'); }
  return pick([addDec, subDec])(2);
};
NC.priorites = (d) => {
  if (d <= 1) {
    const a = R(2, 20), b = R(2, 9), c = R(2, 9);
    if (Math.random() < 0.5) return P('priorites', `${a} + ${b} × ${c} = @`, a + b * c, '', `D’abord ${b} × ${c} = ${b * c}, puis ${a} + ${b * c} = ${a + b * c}`);
    const big = b * c, s = R(1, Math.min(20, big - 1));
    return P('priorites', `${b} × ${c} − ${s} = @`, big - s, '', `D’abord ${b} × ${c} = ${big}, puis ${big} − ${s} = ${big - s}`);
  }
  if (d === 2) {
    const a = R(2, 9), b = R(2, 9), c = R(2, 6), e = R(2, 6);
    if (Math.random() < 0.5) return P('priorites', `(${a} + ${b}) × ${c} = @`, (a + b) * c, '', `D’abord la parenthèse : ${a} + ${b} = ${a + b}, puis ${a + b} × ${c} = ${(a + b) * c}`);
    return P('priorites', `${a} × ${c} + ${b} × ${e} = @`, a * c + b * e, '', `${a} × ${c} = ${a * c} et ${b} × ${e} = ${b * e}, puis ${a * c} + ${b * e} = ${a * c + b * e}`);
  }
  const a = R(2, 9), b = R(5, 12), c = R(1, b - 2), e = R(2, 6), f = R(2, 9), v = a * (b - c) + f;
  return P('priorites', `${a} × (${b} − ${c}) + ${e * f} ÷ ${e} = @`, v, '', `Parenthèse : ${b} − ${c} = ${b - c}. Puis ${a} × ${b - c} = ${a * (b - c)} et ${e * f} ÷ ${e} = ${f}. Enfin ${a * (b - c)} + ${f} = ${v}`);
};
NC.fracplus = (d) => {
  if (d <= 1) {
    const b = R(5, 12), a1 = R(1, b - 2), a2 = R(1, b - 1 - a1);
    if (Math.random() < 0.6) return P('fracplus', `[${a1}/${b}] + [${a2}/${b}] = [@/${b}]`, a1 + a2, '', `Même nombre en bas : on additionne le haut. ${a1} + ${a2} = ${a1 + a2}, donc [${a1 + a2}/${b}]`);
    return P('fracplus', `[${a1 + a2}/${b}] − [${a1}/${b}] = [@/${b}]`, a2, '', `Même nombre en bas : on soustrait le haut. ${a1 + a2} − ${a1} = ${a2}, donc [${a2}/${b}]`);
  }
  if (d === 2) {
    const [a, b] = pick([[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [2, 5], [3, 5], [4, 5], [5, 6], [3, 8], [5, 8], [7, 10]]), m = R(2, 5);
    return P('fracplus', `Simplifie : [${a * m}/${b * m}] = [@/${b}]`, a, '', `${b * m} ÷ ${m} = ${b}, donc on fait aussi ${a * m} ÷ ${m} = ${a}`, 'On divise le haut et le bas par le même nombre.');
  }
  const b = pick([2, 3, 4, 5]), k = pick([2, 3]), B = b * k, a1 = R(1, b - 1), a2 = R(1, Math.max(1, B - a1 * k - 1));
  return P('fracplus', `[${a1}/${b}] + [${a2}/${B}] = [@/${B}]`, a1 * k + a2, '', `[${a1}/${b}] = [${a1 * k}/${B}] (× ${k} en haut et en bas). Puis ${a1 * k} + ${a2} = ${a1 * k + a2}`, `Change d’abord [${a1}/${b}] pour avoir ${B} en bas.`);
};
NC.pourcent = (d) => {
  if (d <= 1) {
    const k = R(1, 3);
    if (k === 1) { const n = 2 * R(5, 60); return P('pourcent', `50 % de ${n} = @`, n / 2, '', `50 %, c’est la moitié : ${n} ÷ 2 = ${n / 2}`); }
    if (k === 2) { const n = 10 * R(2, 40); return P('pourcent', `10 % de ${n} = @`, n / 10, '', `10 %, c’est diviser par 10 : ${n} ÷ 10 = ${n / 10}`); }
    const n = 4 * R(3, 40); return P('pourcent', `25 % de ${n} = @`, n / 4, '', `25 %, c’est le quart : ${n} ÷ 4 = ${n / 4}`);
  }
  if (d === 2) {
    const k = R(1, 3);
    if (k === 1) { const p = pick([20, 30, 40, 60, 70]), n = 10 * R(2, 30); return P('pourcent', `${p} % de ${n} = @`, (n / 10) * (p / 10), '', `10 % de ${n} = ${n / 10}, donc ${p} % = ${n / 10} × ${p / 10} = ${(n / 10) * (p / 10)}`); }
    if (k === 2) { const n = 4 * R(3, 30); return P('pourcent', `75 % de ${n} = @`, (n / 4) * 3, '', `25 % = ${n} ÷ 4 = ${n / 4}, donc 75 % = ${n / 4} × 3 = ${(n / 4) * 3}`); }
    const n = 20 * R(2, 20); return P('pourcent', `5 % de ${n} = @`, n / 20, '', `10 % = ${n / 10}, et 5 %, c’est la moitié : ${n / 20}`);
  }
  if (Math.random() < 0.5) {
    const [thing, price, pr] = pick([['Un vélo', 20 * R(6, 20), 'il'], ['Un ballon', 4 * R(5, 15), 'il'], ['Une trottinette', 20 * R(4, 12), 'elle'], ['Un jeu', 4 * R(10, 20), 'il']]);
    const p = price % 20 === 0 ? pick([10, 20, 25, 50]) : pick([25, 50]), off = (price * p) / 100;
    return P('pourcent', `${thing} coûte ${price} CHF. C’est les soldes : −${p} %. Combien coûte-t-${pr} maintenant ?`, price - off, 'CHF', `${p} % de ${price} = ${off} CHF. ${price} − ${off} = ${price - off} CHF`, 'Calcule d’abord la réduction, puis enlève-la du prix.');
  }
  const n = pick([20, 25, 30, 40]), p = n === 25 ? pick([20, 40, 60]) : pick([10, 20, 30, 50]);
  return P('pourcent', `Dans une classe de ${n} élèves, ${p} % viennent à vélo. Combien d’élèves viennent à vélo ?`, (n * p) / 100, 'élèves', `${p} % de ${n} = ${n} × ${p} ÷ 100 = ${(n * p) / 100} élèves`);
};
NC.moyenne = (d) => {
  if (d <= 1) {
    const m = R(5, 15), x = R(1, 4), vals = shuffle([m - x, m, m + x]);
    return P('moyenne', `Les poules ont pondu ${vals.join(', ')} œufs en 3 jours. Combien d’œufs par jour en moyenne ?`, m, 'œufs', `${vals.join(' + ')} = ${3 * m}, puis ${3 * m} ÷ 3 = ${m}`);
  }
  if (d === 2) {
    if (Math.random() < 0.5) {
      const notes = Array.from({ length: 4 }, () => R(3, 6)), s = notes.reduce((a, b) => a + b, 0);
      return P('moyenne', `${pick(KIDS)} a eu ces notes : ${notes.join(', ')}. Quelle est sa moyenne ?`, s / 4, '', `${notes.join(' + ')} = ${s}, puis ${s} ÷ 4 = ${fmt(s / 4)}`);
    }
    const m = R(10, 30), x = R(1, 5), y = R(1, 5), vals = shuffle([m - x, m + x, m - y, m + y, m]);
    return P('moyenne', `En 5 jours, le marché a vendu ${vals.join(', ')} pains. Combien de pains par jour en moyenne ?`, m, 'pains', `${vals.join(' + ')} = ${5 * m}, puis ${5 * m} ÷ 5 = ${m}`);
  }
  const k = pick(KIDS), m = R(13, 18), known = [R(m - 3, m + 4), R(m - 3, m + 4), R(m - 3, m + 4)], s = known.reduce((a, b) => a + b, 0), need = 4 * m - s;
  return P('moyenne', `${k} a fait ${known.join(', ')} points en 3 parties. Combien de points doit faire ${k} à la 4e partie pour avoir ${m} points de moyenne ?`, need, 'points', `Il faut 4 × ${m} = ${4 * m} points en tout. ${4 * m} − ${s} = ${need}`, 'Moyenne × nombre de parties = le total qu’il faut.');
};
NC.aires = (d) => {
  if (d <= 1) {
    const a = 2 * R(2, 8), b = R(3, 10);
    return P('aires', `Un potager a la forme d’un triangle rectangle. Les deux côtés de l’angle droit mesurent ${a} m et ${b} m. Quelle est son aire ?`, (a * b) / 2, 'm²', `C’est la moitié d’un rectangle de ${a} m sur ${b} m : ${a * b} ÷ 2 = ${(a * b) / 2} m²`);
  }
  if (d === 2) {
    const b = 2 * R(4, 15), hh = R(3, 14);
    if (Math.random() < 0.6) return P('aires', `Un triangle a une base de ${b} m et une hauteur de ${hh} m. Quelle est son aire ?`, (b * hh) / 2, 'm²', `${b} × ${hh} = ${b * hh}, puis ${b * hh} ÷ 2 = ${(b * hh) / 2} m²`);
    return P('aires', `Un triangle a une aire de ${(b * hh) / 2} m² et une base de ${b} m. Quelle est sa hauteur ?`, hh, 'm', `${(b * hh) / 2} × 2 = ${b * hh}, puis ${b * hh} ÷ ${b} = ${hh} m`, 'Aire × 2 = base × hauteur.');
  }
  const L = 2 * R(3, 6), l = R(3, 8), hh = R(2, 5);
  return P('aires', `Le mur d’une cabane est un rectangle de ${L} m sur ${l} m, avec un toit en triangle de ${L} m de base et ${hh} m de haut. Quelle est l’aire totale du mur ?`, L * l + (L * hh) / 2, 'm²', `Rectangle : ${L} × ${l} = ${L * l}. Triangle : ${L} × ${hh} ÷ 2 = ${(L * hh) / 2}. Total : ${L * l + (L * hh) / 2} m²`);
};
NC.diviseurs = (d) => {
  if (d <= 1) {
    const k = R(3, 9), right = k * R(3, 12);
    const wr = [right + 1, right - 1, right + (k > 3 ? 2 : 4), right + k + 1].filter((x) => x % k !== 0 && x > 0);
    return C('diviseurs', `Lequel de ces nombres est un multiple de ${k} ?`, String(right), wr.map(String), `${right} = ${k} × ${right / k} : il est dans la table de ${k}`, `Cherche le nombre qui est dans la table de ${k}.`);
  }
  if (d === 2) {
    const k = pick([3, 3, 9]), right = k * R(Math.ceil(110 / k), Math.floor(990 / k));
    const wr = new Set(); while (wr.size < 3) { const x = R(110, 990); if (x % k) wr.add(x); }
    const ds = String(right).split('').map(Number);
    return C('diviseurs', `Lequel de ces nombres est divisible par ${k} ?`, String(right), [...wr].map(String), `${ds.join(' + ')} = ${ds.reduce((a, b) => a + b, 0)}, qui est dans la table de ${k}`, `Additionne les chiffres : si la somme est dans la table de ${k}, c’est divisible par ${k}.`);
  }
  const [a, b, l] = pick([[4, 6, 12], [6, 8, 24], [4, 10, 20], [6, 9, 18], [10, 15, 30], [8, 12, 24], [6, 10, 30]]);
  return P('diviseurs', `Un bus passe toutes les ${a} minutes et un autre toutes les ${b} minutes. Ils partent ensemble à 8 h 00. Dans combien de minutes repartent-ils ensemble ?`, l, 'min', `Table de ${a} : ${[1, 2, 3, 4, 5].map((i) => a * i).join(', ')}… Table de ${b} : ${[1, 2, 3].map((i) => b * i).join(', ')}… Le premier nombre commun : ${l}`, `Écris la table de ${a} et la table de ${b}, et cherche le premier nombre commun.`);
};
NC.volume = (d) => {
  if (d <= 1) {
    const a = R(2, 5), b = R(2, 4), c = R(2, 4);
    return P('volume', `Une boîte est remplie de petits cubes : ${a} cubes de long, ${b} de large et ${c} de haut. Combien de cubes en tout ?`, a * b * c, 'cubes', `${a} × ${b} = ${a * b} cubes par étage, × ${c} étages = ${a * b * c} cubes`);
  }
  if (d === 2) {
    if (Math.random() < 0.35) { const c = R(2, 6); return P('volume', `Un cube a des côtés de ${c} cm. Quel est son volume ?`, c ** 3, 'cm³', `${c} × ${c} × ${c} = ${c ** 3} cm³`); }
    const a = R(4, 12), b = R(2, 6), c = R(2, 5);
    return P('volume', `Une caisse mesure ${a} cm de long, ${b} cm de large et ${c} cm de haut. Quel est son volume ?`, a * b * c, 'cm³', `${a} × ${b} × ${c} = ${a * b * c} cm³`);
  }
  if (Math.random() < 0.5) { const a = R(3, 8), b = R(2, 5), c = R(2, 4); return P('volume', `Un bac à eau mesure ${a} dm × ${b} dm × ${c} dm. Combien de litres d’eau peut-il contenir ?`, a * b * c, 'L', `${a} × ${b} × ${c} = ${a * b * c} dm³, et 1 dm³ = 1 L : ${a * b * c} L`); }
  const a = 10 * R(3, 8), b = 10 * R(2, 4), c = 10 * R(2, 4);
  return P('volume', `Un aquarium mesure ${a} cm × ${b} cm × ${c} cm. Combien de litres d’eau contient-il ?`, (a * b * c) / 1000, 'L', `${a} × ${b} × ${c} = ${fmt(a * b * c)} cm³. 1 L = 1000 cm³, donc ${fmt(a * b * c)} ÷ 1000 = ${(a * b * c) / 1000} L`);
};
NC.echelle = (d) => {
  if (d <= 1) {
    const [u, unit] = pick([[100, 'm'], [50, 'm'], [200, 'm'], [2, 'km'], [5, 'km']]), n = R(2, 9);
    return P('echelle', `Sur la carte, 1 cm représente ${u} ${unit}. Le chemin mesure ${n} cm sur la carte. Quelle est sa vraie longueur ?`, n * u, unit, `${n} × ${u} = ${n * u} ${unit}`);
  }
  if (d === 2) {
    if (Math.random() < 0.5) { const u = pick([50, 100, 200]), n = R(2, 9); return P('echelle', `Sur le plan, 1 cm représente ${u} m. Un champ mesure ${n * u} m en vrai. Combien de cm sur le plan ?`, n, 'cm', `${n * u} ÷ ${u} = ${n} cm`); }
    const sc = pick([100, 1000]), n = R(2, 9);
    return P('echelle', `Un plan est à l’échelle 1 : ${fmt(sc)}. Une maison mesure ${n} cm sur le plan. Combien de mètres en vrai ?`, (n * sc) / 100, 'm', `${n} × ${fmt(sc)} = ${fmt(n * sc)} cm = ${fmt((n * sc) / 100)} m`, `1 cm sur le plan = ${fmt(sc)} cm en vrai. Puis convertis en m (÷ 100).`);
  }
  const v = pick([12, 18, 24, 30, 36]), hh = R(1, 3), m = pick([20, 30, 40]);
  return P('echelle', `Un cycliste roule à ${v} km/h. Quelle distance parcourt-il en ${hh} h ${m} min ?`, v * hh + (v * m) / 60, 'km', `En ${hh} h : ${v} × ${hh} = ${v * hh} km. En ${m} min : ${v} × ${m} ÷ 60 = ${(v * m) / 60} km. Total : ${v * hh + (v * m) / 60} km`, `${v} km/h = ${v} km en 60 min. Calcule pour les heures, puis pour les minutes.`);
};
/** 8H notions, in the order they unlock. */
export const NEW_CONCEPTS = {
  arrondi: 'Arrondir', decimaux: 'Nombres à virgule', priorites: 'Priorités de calcul', fracplus: 'Fractions (suite)', pourcent: 'Pourcentages',
  moyenne: 'Moyennes', aires: 'Aires de triangles', diviseurs: 'Multiples et diviseurs', volume: 'Volumes', echelle: 'Échelles et vitesses',
};
Object.assign(CATS, NEW_CONCEPTS);
Object.assign(HINTS, {
  arrondi: 'Regarde le chiffre juste à droite : de 0 à 4 on garde, de 5 à 9 on monte.',
  decimaux: 'Aligne bien les virgules. Tu peux ajouter des 0 : 2,5 = 2,50.',
  priorites: 'D’abord les parenthèses, puis × et ÷, puis + et −.',
  fracplus: 'Avec le même nombre en bas, on calcule seulement avec les nombres du haut.',
  pourcent: '50 % = la moitié, 25 % = le quart, 10 % = diviser par 10.',
  moyenne: 'Additionne tout, puis divise par le nombre de valeurs.',
  aires: 'Aire du triangle = base × hauteur ÷ 2.',
  diviseurs: 'Un multiple de 6 est dans la table de 6.',
  volume: 'Volume = longueur × largeur × hauteur. 1 dm³ = 1 L.',
  echelle: '1 cm sur la carte vaut toujours la même longueur en vrai : multiplie.',
});
MEASURE_CATS.push('aires', 'volume', 'echelle');

/** Short lessons: what the notion is, how to do it, a worked example. Keys: "calc:add"… or the theme. */
export const LESSONS = {
  'calc:add': { title: 'L’addition posée', lines: ['On écrit les nombres l’un sous l’autre : unités sous unités, dizaines sous dizaines.', 'On commence à droite, par les unités.', 'Si ça fait 10 ou plus, on écrit les unités et on garde 1 en retenue pour la colonne d’à côté.'], ex: ['478 + 256', 'Unités : 8 + 6 = 14 → j’écris 4, je retiens 1', 'Dizaines : 7 + 5 + 1 = 13 → j’écris 3, je retiens 1', 'Centaines : 4 + 2 + 1 = 7 → 734'] },
  'calc:sub': { title: 'La soustraction posée', lines: ['Le grand nombre en haut, unités sous unités.', 'On commence par les unités. Si le chiffre du haut est trop petit, il gagne 10, et on ajoute 1 en bas dans la colonne suivante (la retenue).', 'Pour vérifier : réponse + nombre enlevé = nombre de départ.'], ex: ['532 − 187', 'Unités : 2 − 7, impossible → 12 − 7 = 5, retenue 1', 'Dizaines : 3 − (8 + 1), impossible → 13 − 9 = 4, retenue 1', 'Centaines : 5 − (1 + 1) = 3 → 345', 'Vérification : 345 + 187 = 532'] },
  'calc:mul': { title: 'La multiplication', lines: ['Multiplier, c’est ajouter plusieurs fois le même nombre : 4 × 3 = 4 + 4 + 4.', 'Pour un grand nombre, coupe-le en dizaines et unités, multiplie chaque morceau, puis additionne.', '× 10 : on ajoute un 0 à la fin (ou la virgule avance d’un rang).'], ex: ['36 × 7 = 30 × 7 + 6 × 7', '= 210 + 42 = 252'] },
  'calc:div': { title: 'La division', lines: ['Diviser, c’est partager en parts égales.', 'Pour 56 ÷ 8, cherche dans la table de 8 : 8 × ? = 56.', 'Pour un grand nombre, coupe-le en morceaux faciles à partager.'], ex: ['56 ÷ 8 = 7, car 7 × 8 = 56', '96 ÷ 4 = 80 ÷ 4 + 16 ÷ 4 = 20 + 4 = 24'] },
  'calc:mental': { title: 'Le calcul de tête', lines: ['Le double = × 2. La moitié = ÷ 2.', 'Pour aller à 100 : va d’abord à la dizaine, puis à 100.', '× 5 = × 10 puis ÷ 2. × 25 = × 100 puis ÷ 4.'], ex: ['37 + ? = 100 : 37 → 40 (+3), 40 → 100 (+60). Réponse : 63', '18 × 5 = 180 ÷ 2 = 90'] },
  frac: { title: 'Les fractions', lines: ['Dans [3/4], le nombre du bas dit en combien de parts on coupe, celui du haut combien de parts on prend.', 'Pour calculer [3/4] de 20 : on divise par le bas, puis on multiplie par le haut.'], ex: ['[3/4] de 20 : 20 ÷ 4 = 5, puis 5 × 3 = 15'] },
  conv: { title: 'Les conversions', lines: ['km → m : × 1000 · m → cm : × 100 · cm → mm : × 10', 'kg → g : × 1000 · L → dL : × 10 · L → cL : × 100 · L → mL : × 1000', 'Vers une unité plus petite, le nombre grandit (×). Vers une plus grande, il rapetisse (÷).', '1 h = 60 min'], ex: ['3,5 m = 3,5 × 100 = 350 cm', '2400 g = 2400 ÷ 1000 = 2,4 kg'] },
  masse: { title: 'Les masses', lines: ['1 t = 1000 kg · 1 kg = 1000 g', 'Avant de calculer, mets toutes les masses dans la même unité.', 'Regarde bien l’unité demandée dans la question.'], ex: ['2 kg − 350 g = 2000 g − 350 g = 1650 g'] },
  contenance: { title: 'Les contenances', lines: ['1 L = 10 dL = 100 cL = 1000 mL', 'Une bouteille de 75 cL, c’est 0,75 L.'], ex: ['1,5 L moins 2 verres de 25 cL : 150 cL − 50 cL = 100 cL'] },
  longueur: { title: 'Les longueurs', lines: ['1 km = 1000 m · 1 m = 100 cm · 1 cm = 10 mm', 'Mets tout dans la même unité avant de calculer.'], ex: ['2,4 m − 65 cm = 240 cm − 65 cm = 175 cm'] },
  duree: { title: 'Les durées', lines: ['1 h = 60 min (et pas 100 !).', 'Pour ajouter des minutes à une heure, avance d’abord jusqu’à l’heure pile, puis ajoute le reste.'], ex: ['9 h 45 + 30 min : 9 h 45 → 10 h 00 (15 min), il reste 15 min → 10 h 15'] },
  recette: { title: 'La proportionnalité', lines: ['Deux fois plus de gâteaux, c’est deux fois plus de chaque ingrédient.', 'Astuce : calcule d’abord pour 1, puis multiplie.'], ex: ['4 crêpes : 100 g de farine. 1 crêpe : 100 ÷ 4 = 25 g. 6 crêpes : 25 × 6 = 150 g'] },
  argent: { title: 'L’argent', lines: ['1 franc = 100 centimes : 3,50 CHF = 3 francs et 50 centimes.', 'Monnaie rendue : calcule d’abord le total, puis fais billet − total.'], ex: ['2 pains à 3,50 CHF : 7 CHF. Avec 20 CHF, on te rend 20 − 7 = 13 CHF'] },
  geo: { title: 'Périmètre et aire', lines: ['Le périmètre, c’est le tour : on additionne tous les côtés (en m).', 'L’aire, c’est la surface : longueur × largeur (en m²).', 'Rectangle : périmètre = (longueur + largeur) × 2.'], ex: ['Rectangle de 6 m sur 4 m : périmètre (6 + 4) × 2 = 20 m, aire 6 × 4 = 24 m²'] },
  animaux: { title: 'Les problèmes de la ferme', lines: ['Cherche d’abord combien pour UN animal (ou UN jour).', 'Puis multiplie pour plusieurs, ou divise pour partager.'], ex: ['Une poule pond 5 œufs par semaine. 3 poules : 5 × 3 = 15 œufs'] },
  enigme: { title: 'Résoudre une énigme', lines: ['1. Lis l’énigme deux fois.', '2. Cherche ce qu’on te demande.', '3. Une étape à la fois (un petit dessin aide souvent).', '4. Vérifie que ta réponse a du sens.'], ex: ['Tom a 20 CHF et achète 3 cahiers à 4 CHF : 3 × 4 = 12, puis 20 − 12 = 8 CHF'] },
  arrondi: { title: 'Arrondir un nombre', lines: ['Arrondir, c’est remplacer un nombre par un nombre « rond » tout proche.', 'Regarde le chiffre juste à droite de celui qu’on arrondit : de 0 à 4, on garde ; de 5 à 9, on monte.'], ex: ['347 à la dizaine : le 7 fait monter → 350', '1249 à la centaine : le 4 garde → 1200', '6,8 à l’unité : le 8 fait monter → 7'] },
  decimaux: { title: 'Les nombres à virgule', lines: ['Après la virgule : les dixièmes, puis les centièmes. 2,5 = 2,50.', 'Pour additionner ou soustraire, on aligne les virgules (on peut ajouter des 0).', 'Pour comparer : les unités d’abord, puis les dixièmes, puis les centièmes.'], ex: ['3,7 + 1,45 = 3,70 + 1,45 = 5,15', '2,5 est plus grand que 2,45 : 5 dixièmes, c’est plus que 4 dixièmes'] },
  priorites: { title: 'Les priorités de calcul', lines: ['1. D’abord ce qui est entre parenthèses.', '2. Puis les × et les ÷.', '3. Enfin les + et les −, de gauche à droite.'], ex: ['3 + 4 × 5 = 3 + 20 = 23 (et pas 35 !)', '(3 + 4) × 5 = 7 × 5 = 35'] },
  fracplus: { title: 'Calculer avec les fractions', lines: ['Même nombre en bas ? On additionne seulement les nombres du haut : [2/7] + [3/7] = [5/7].', 'Simplifier : on divise le haut et le bas par le même nombre : [6/8] = [3/4].', 'Bas différents : on change une fraction pour avoir le même bas : [1/2] = [2/4].'], ex: ['[1/2] + [1/4] = [2/4] + [1/4] = [3/4]'] },
  pourcent: { title: 'Les pourcentages', lines: ['% veut dire « sur 100 » : 30 % = [30/100].', '50 % = la moitié · 25 % = le quart · 10 % = diviser par 10.', 'Pour 30 % : calcule 10 %, puis multiplie par 3.'], ex: ['30 % de 70 : 10 % = 7, donc 30 % = 7 × 3 = 21', 'Soldes −25 % sur 80 CHF : 80 ÷ 4 = 20, puis 80 − 20 = 60 CHF'] },
  moyenne: { title: 'La moyenne', lines: ['Additionne toutes les valeurs, puis divise par le nombre de valeurs.', 'Pour trouver une valeur qui manque : moyenne × nombre de valeurs = le total qu’il faut.'], ex: ['4, 6 et 8 : 4 + 6 + 8 = 18, puis 18 ÷ 3 = 6'] },
  aires: { title: 'L’aire du triangle', lines: ['Un triangle, c’est la moitié d’un rectangle.', 'Aire du triangle = base × hauteur ÷ 2.', 'La hauteur part du sommet et tombe tout droit sur la base.'], ex: ['Base 6 m, hauteur 4 m : 6 × 4 = 24, puis 24 ÷ 2 = 12 m²'] },
  diviseurs: { title: 'Multiples et diviseurs', lines: ['Les multiples de 6 sont dans la table de 6 : 6, 12, 18, 24…', 'Divisible par 2 : finit par 0, 2, 4, 6 ou 8. Par 5 : finit par 0 ou 5.', 'Divisible par 3 : la somme des chiffres est dans la table de 3 (par 9 : dans la table de 9).'], ex: ['471 : 4 + 7 + 1 = 12, dans la table de 3 → 471 est divisible par 3'] },
  volume: { title: 'Les volumes', lines: ['Le volume, c’est la place que prend un objet. On compte en petits cubes : cm³, dm³.', 'Pavé (une boîte) : longueur × largeur × hauteur.', '1 dm³ = 1 L = 1000 cm³'], ex: ['Boîte de 4 cm × 3 cm × 2 cm = 24 cm³', 'Bac de 5 dm × 4 dm × 3 dm = 60 dm³ = 60 L'] },
  echelle: { title: 'Échelles et vitesses', lines: ['Sur une carte, l’échelle dit ce que vaut 1 cm en vrai.', 'Échelle 1 : 1000 → 1 cm sur le plan = 1000 cm = 10 m en vrai.', 'Vitesse : 60 km/h veut dire 60 km en 1 heure, donc 30 km en 30 min.'], ex: ['1 cm = 50 m, donc 4 cm = 4 × 50 = 200 m', '18 km/h pendant 1 h 20 : 18 + 6 = 24 km'] },
};

function theme(name, d) {
  const list = T[name].filter(([a, b]) => d >= a && d <= b);
  const all = list.length ? list : T[name];
  return pick(all)[2](d);
}

/** Make one problem of a category at difficulty d (1-5). */
const OPS = { add, sub, mul, div, mental };
export const OP_NAMES = { add: 'additions', sub: 'soustractions', mul: 'multiplications', div: 'divisions', mental: 'calculs de tête' };
/**
 * opAdj: easier/harder steps per operation for calculations, e.g. { sub: -1 } (the "too hard" button).
 * op: force one operation (to ask an easier problem of the same kind). Calculation problems get p.op.
 */
export function makeProblem(cat, d, opAdj = {}, op = null) {
  d = Math.max(-1, Math.min(7, Math.round(d)));
  const p = makeOne(cat, d, opAdj, op);
  if (d <= 0) p.aid = d; // levels 0 and −1: the hint is shown from the start (and the first step at −1)
  return p;
}
function makeOne(cat, d, opAdj, op) {
  if (cat === 'calc' || cat === 'add' || cat === 'mul' || !cat) {
    const pool = cat === 'add' ? [add, sub] : cat === 'mul' ? [mul, mul, div] : CALC_POOLS[Math.max(1, Math.min(5, d))];
    const fn = pick(pool);
    const name = op && OPS[op] ? op : Object.keys(OPS).find((k) => OPS[k] === fn);
    const dd = Math.max(-1, Math.min(name === 'add' || name === 'sub' ? 7 : 5, Math.round(d + (opAdj[name] || 0))));
    const p = OPS[name](dd);
    p.op = name;
    return p;
  }
  d = Math.min(5, d);
  if (cat === 'frac') return frac(d);
  if (cat === 'conv') return conv(d);
  if (NC[cat]) return NC[cat](Math.min(3, Math.max(1, d)));
  if (T[cat]) return theme(cat, Math.max(1, d));
  return pick(CALC_POOLS[Math.max(1, d)])(d);
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
