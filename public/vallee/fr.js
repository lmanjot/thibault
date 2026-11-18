// La Vallée des Graines — French for 7H-8H (PER L1 26, fonctionnement de la langue).
// Five modules the parents switch on: agreement in the noun group, subject-verb agreement, é / er,
// grammatical homophones, and an error hunt in long sentences (where agreement mistakes slip in).
// A problem is multiple choice { cat, q, a, choices, ex, hint } (@ in q is the gap),
// or a tap-the-word problem { cat, q, words, a } where a is the index of the misspelled word.
// Difficulty −1 (shortest, with the help shown) to 5 (long sentences, 8H cases).

import { FR2_CATS, FR2_HINTS, FR2_LESSONS, FR2 } from './fr2.js';

const R = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uniq = (a) => [...new Set(a)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const chance = (p) => Math.random() < p;

export const FR_CATS = {
  'fr:gn': 'Accords du groupe nominal', 'fr:sv': 'Accord sujet-verbe', 'fr:eer': 'é ou er ?',
  'fr:homo': 'Homophones', 'fr:relire': 'Chasse aux fautes', ...FR2_CATS,
};
/** The modules in the parents' space, by family. */
export const FR_GROUPS = [['Accords et homophones', ['fr:gn', 'fr:sv', 'fr:eer', 'fr:homo', 'fr:relire']],
  ['Conjugaison et grammaire', ['fr:conj', 'fr:nature', 'fr:fonc']], ['Orthographe et vocabulaire', ['fr:ortho', 'fr:voc']]];
export const FR_SKILLS = Object.keys(FR_CATS);
export const FR_HINTS = {
  'fr:gn': 'Trouve le nom chef du groupe : masculin ou féminin ? un seul ou plusieurs ? Tout le groupe s’accorde avec lui.',
  'fr:sv': 'Qui est-ce qui fait l’action ? C’est le sujet. Remplace-le par il ou ils : avec ils, le verbe prend -nt.',
  'fr:eer': 'Remplace le verbe par « mordre » ou « mordu » : lequel sonne juste ?',
  'fr:homo': 'Remplace le mot : « avait », « était », « étaient », « il »… Si ça marche, tu tiens la bonne écriture.',
  'fr:relire': 'Pour chaque verbe, cherche son sujet. Pour chaque nom, regarde son déterminant (les, des, ces → -s).',
  ...FR2_HINTS,
};
export const FR_LESSONS = {
  'fr:gn': { title: 'Les accords dans le groupe nominal', lines: [
    'Dans un groupe nominal, le nom est le chef. Il donne son genre (masculin ou féminin) et son nombre (singulier ou pluriel) aux autres mots du groupe.',
    'Le déterminant te le dit : les, des, ces, mes, deux, trois… → plusieurs. Alors le nom ET les adjectifs prennent la marque du pluriel (souvent -s, parfois -x).',
    'Au féminin, l’adjectif prend souvent un -e : petit → petite, gris → grise.',
    'Dans une longue phrase, relie chaque adjectif à son nom, comme avec une flèche.'],
    ex: ['les petites poules rousses : poules est féminin pluriel → petites, rousses', 'Les poules de la fermière sont contentes : c’est les poules qui sont contentes, pas la fermière'] },
  'fr:sv': { title: 'L’accord du verbe avec le sujet', lines: [
    'Pour trouver le sujet, pose la question « Qui est-ce qui… ? » devant le verbe.',
    'Remplace le sujet par il ou ils. Avec ils (plusieurs), le verbe se termine par -nt : ils mangent.',
    'Attention aux mots qui se glissent entre le sujet et le verbe (de la forêt, chaque matin, les, le…) : ils ne changent rien !',
    'Parfois le sujet est après le verbe : « Dans le pré jouent les enfants ».'],
    ex: ['Les renards de la forêt mangent des baies. Qui est-ce qui mange ? les renards → ils mangent', 'Le chat des voisins les attrape. Qui attrape ? le chat (un seul) → il attrape'] },
  'fr:eer': { title: 'é ou er ?', lines: [
    'Le truc : remplace le verbe par « mordre » (ou « vendre »).',
    'Si tu dis « mordre » → c’est l’infinitif : -er. Il va manger → il va mordre.',
    'Si tu dis « mordu » → c’est le participe passé : -é. Il a mangé → il a mordu.',
    'Après à, de, pour, sans : toujours l’infinitif (-er). Avec vous : -ez. Au passé, il… : -ait.',
    'Avec être, le participe passé s’accorde avec le sujet : elles sont arrivées.'],
    ex: ['Léa va arroser les fleurs → va mordre → arroser', 'Léa a arrosé les fleurs → a mordu → arrosé', 'Les poules sont rentrées → les poules : féminin pluriel → -ées'] },
  'fr:homo': { title: 'Les homophones', lines: [
    'a / à : si tu peux dire « avait », écris a. Sinon : à.',
    'et / est : « était » → est. « et puis » → et.',
    'son / sont : « étaient » → sont. « mon » → son.',
    'on / ont : « il » → on. « avaient » → ont.',
    'ses / ces : ses = les siens, à lui. ces = ceux-là, qu’on montre.',
    'ou / où : « ou bien » → ou. Un lieu → où.',
    'se / ce : devant un verbe (il se lave → je me lave) → se. Devant un nom → ce.',
    'leur / leurs : devant un verbe, leur ne prend jamais de s. Devant un nom au pluriel : leurs.'],
    ex: ['Thibault a (avait) faim → a', 'Il va à (avait ? non) la ferme → à', 'Les poules sont (étaient) dehors → sont'] },
  'fr:relire': { title: 'Relire comme un détective', lines: [
    'Une phrase longue cache souvent une faute d’accord. Relis-la mot par mot.',
    '1. Trouve chaque verbe, puis son sujet : sont-ils d’accord ?',
    '2. Pour chaque nom, regarde son déterminant : les, des, ces → -s.',
    '3. Relie chaque adjectif à son nom.',
    '4. Un verbe qui se termine par le son [é] : é ou er ? Fais le truc de « mordre ».'],
    ex: ['Les lapins du fermier mange des carottes. → Qui mange ? les lapins → mangent', 'Les petites poule rousses picorent. → les petites … → poules'] },
  ...FR2_LESSONS,
};

// ---------- words ----------
const AD = {};
function ad(m, f, mp, fp, o = {}) { AD[m] = { m, f, mp, fp, ...o }; }
ad('petit', 'petite', 'petits', 'petites', { pre: 1 }); ad('grand', 'grande', 'grands', 'grandes', { pre: 1 });
ad('gros', 'grosse', 'gros', 'grosses', { pre: 1 }); ad('joli', 'jolie', 'jolis', 'jolies', { pre: 1 });
ad('beau', 'belle', 'beaux', 'belles', { pre: 1, mv: 'bel' }); ad('vieux', 'vieille', 'vieux', 'vieilles', { pre: 1, mv: 'vieil' });
ad('jeune', 'jeune', 'jeunes', 'jeunes', { pre: 1 });
ad('roux', 'rousse', 'roux', 'rousses'); ad('gris', 'grise', 'gris', 'grises'); ad('noir', 'noire', 'noirs', 'noires');
ad('blanc', 'blanche', 'blancs', 'blanches'); ad('brun', 'brune', 'bruns', 'brunes'); ad('vert', 'verte', 'verts', 'vertes');
ad('bleu', 'bleue', 'bleus', 'bleues'); ad('curieux', 'curieuse', 'curieux', 'curieuses'); ad('gourmand', 'gourmande', 'gourmands', 'gourmandes');
ad('affamé', 'affamée', 'affamés', 'affamées'); ad('fatigué', 'fatiguée', 'fatigués', 'fatiguées'); ad('content', 'contente', 'contents', 'contentes');
ad('rusé', 'rusée', 'rusés', 'rusées'); ad('mûr', 'mûre', 'mûrs', 'mûres'); ad('sec', 'sèche', 'secs', 'sèches');
ad('lourd', 'lourde', 'lourds', 'lourdes'); ad('doré', 'dorée', 'dorés', 'dorées'); ad('plein', 'pleine', 'pleins', 'pleines');
ad('délicieux', 'délicieuse', 'délicieux', 'délicieuses'); ad('parfumé', 'parfumée', 'parfumés', 'parfumées');
ad('gentil', 'gentille', 'gentils', 'gentilles'); ad('rapide', 'rapide', 'rapides', 'rapides'); ad('timide', 'timide', 'timides', 'timides');
ad('jaune', 'jaune', 'jaunes', 'jaunes'); ad('rouge', 'rouge', 'rouges', 'rouges');
const form = (a, g, n) => AD[a][g === 'f' ? (n ? 'fp' : 'f') : (n ? 'mp' : 'm')];
const forms = (a) => uniq([AD[a].m, AD[a].f, AD[a].mp, AD[a].fp]);
const varied = (a) => forms(a).length >= 3; // the gender and the number can be seen

const NO = {};
const PRE_ANIM = ['petit', 'grand', 'gros', 'joli', 'beau', 'vieux'], PRE_HUM = ['petit', 'grand', 'vieux', 'jeune'], PRE_THING = ['petit', 'gros', 'grand', 'joli', 'beau'];
function no(id, s, p, g, o = {}) { NO[id] = { id, s, p, g, pre: o.h ? PRE_HUM : o.a ? PRE_ANIM : PRE_THING, ...o }; }
no('renard', 'renard', 'renards', 'm', { a: 1, adj: ['roux', 'rusé', 'affamé', 'curieux'] });
no('lapin', 'lapin', 'lapins', 'm', { a: 1, adj: ['gris', 'blanc', 'brun', 'affamé', 'timide'] });
no('ecureuil', 'écureuil', 'écureuils', 'm', { a: 1, v: 1, adj: ['roux', 'curieux', 'gourmand'] });
no('oiseau', 'oiseau', 'oiseaux', 'm', { a: 1, v: 1, adj: ['bleu', 'noir', 'curieux', 'fatigué'] });
no('chat', 'chat', 'chats', 'm', { a: 1, adj: ['noir', 'gris', 'roux', 'blanc', 'curieux', 'gourmand'] });
no('chien', 'chien', 'chiens', 'm', { a: 1, adj: ['noir', 'brun', 'blanc', 'content', 'gourmand'] });
no('cheval', 'cheval', 'chevaux', 'm', { a: 1, adj: ['brun', 'blanc', 'noir', 'fatigué'] });
no('hibou', 'hibou', 'hiboux', 'm', { a: 1, adj: ['gris', 'brun', 'curieux'] });
no('poule', 'poule', 'poules', 'f', { a: 1, adj: ['roux', 'blanc', 'noir', 'gourmand', 'affamé'] });
no('vache', 'vache', 'vaches', 'f', { a: 1, adj: ['brun', 'blanc', 'noir', 'content'] });
no('chevre', 'chèvre', 'chèvres', 'f', { a: 1, adj: ['blanc', 'brun', 'curieux', 'gourmand'] });
no('abeille', 'abeille', 'abeilles', 'f', { a: 1, v: 1, adj: ['doré', 'curieux', 'fatigué'] });
no('grenouille', 'grenouille', 'grenouilles', 'f', { a: 1, adj: ['vert', 'curieux', 'gourmand'] });
no('souris', 'souris', 'souris', 'f', { a: 1, adj: ['gris', 'blanc', 'curieux', 'gourmand'] });
no('tortue', 'tortue', 'tortues', 'f', { a: 1, adj: ['vert', 'brun', 'fatigué'] });
no('enfant', 'enfant', 'enfants', 'm', { h: 1, v: 1, pre: ['petit', 'grand', 'jeune'], adj: ['content', 'fatigué', 'curieux', 'affamé'] });
no('fermier', 'fermier', 'fermiers', 'm', { h: 1, adj: ['content', 'fatigué', 'curieux'] });
no('fermiere', 'fermière', 'fermières', 'f', { h: 1, adj: ['content', 'fatigué', 'curieux'] });
no('voisin', 'voisin', 'voisins', 'm', { h: 1, adj: ['curieux', 'content', 'fatigué'] });
no('voisine', 'voisine', 'voisines', 'f', { h: 1, adj: ['curieux', 'content', 'fatigué'] });
no('cousin', 'cousin', 'cousins', 'm', { h: 1, my: 1, adj: ['curieux', 'gourmand', 'fatigué'] });
no('cousine', 'cousine', 'cousines', 'f', { h: 1, my: 1, adj: ['curieux', 'gourmand', 'fatigué'] });
const ANIM = Object.keys(NO).filter((k) => NO[k].a), HUM = Object.keys(NO).filter((k) => NO[k].h), ALL = [...ANIM, ...HUM];
const but = (list, ...out) => list.filter((k) => !out.includes(k));

// Verbs. 1st group: forms built from the stem. Others: present [il, ils, tu, nous, vous], imparfait, futur.
const V1 = (inf, who, c, o = {}) => ({ inf, g1: true, stem: inf.slice(0, -2), who, c, ...o });
const V3 = (inf, pres, imp, fut, who, c, o = {}) => ({ inf, pres, imp, fut, who, c, ...o });
const VERBS = [
  V1('manger', but(ALL, 'abeille', 'fermier', 'fermiere', 'voisin', 'voisine'), ['des baies', 'des noisettes', 'des pommes', 'des graines']),
  V1('chercher', ALL, ['des noisettes', 'un abri', 'de la nourriture', 'un coin tranquille']),
  V1('regarder', ALL, ['les nuages', 'la lune', 'le lac', 'les étoiles']),
  V1('écouter', but(ALL, 'oiseau'), ['le vent', 'la pluie', 'le chant des oiseaux']),
  V1('traverser', but(ALL, 'oiseau', 'abeille', 'hibou'), ['le pont', 'la rivière', 'le champ', 'le chemin']),
  V1('jouer', [...HUM, 'chat', 'chien', 'renard', 'lapin', 'ecureuil'], ['dans le pré', 'près de la rivière', 'sous le vieux chêne'], { inv: ['Dans le pré', 'Au bord de la rivière'] }),
  V1('sauter', ['lapin', 'grenouille', 'chat', 'chien', 'chevre', 'ecureuil', 'enfant', 'cousin', 'cousine'], ['dans les flaques', 'par-dessus la barrière', 'sur le rocher']),
  V1('grimper', ['ecureuil', 'chat', 'chevre', 'souris', 'enfant', 'cousin', 'cousine'], ['dans le vieux chêne', 'sur le toit de la grange', 'sur le rocher']),
  V1('chanter', ['oiseau', 'enfant', 'fermier', 'fermiere', 'voisin', 'voisine', 'cousin', 'cousine'], ['au lever du soleil', 'dans le jardin', 'sous la pluie']),
  V1('creuser', ['lapin', 'renard', 'chien', 'fermier', 'fermiere'], ['un trou', 'un terrier', 'dans la terre']),
  V1('ramasser', HUM, ['des pommes', 'des champignons', 'des œufs', 'des feuilles mortes']),
  V1('arroser', HUM, ['les tomates', 'les fleurs', 'le potager']),
  V1('attraper', ['chat', 'chien', 'renard', 'grenouille', 'oiseau', 'enfant', 'cousin', 'cousine'], ['une mouche', 'le ballon', 'une feuille']),
  V1('voler', ['oiseau', 'abeille', 'hibou'], ['au-dessus du lac', 'vers la forêt', 'dans le ciel']),
  V1('nager', ['grenouille', 'tortue', 'chien', 'enfant', 'cousin', 'cousine'], ['dans le lac', 'près du ponton'], { inv: ['Dans le lac'] }),
  V3('dormir', ['dort', 'dorment', 'dors', 'dormons', 'dormez'], ['dormait', 'dormaient'], ['dormira', 'dormiront'], ALL, ['sous le vieux chêne', 'dans la grange', 'au soleil'], { inv: ['Sous le vieux chêne', 'Dans la grange'] }),
  V3('courir', ['court', 'courent', 'cours', 'courons', 'courez'], ['courait', 'couraient'], ['courra', 'courront'], but(ALL, 'oiseau', 'abeille', 'tortue', 'hibou'), ['dans le pré', 'vers la ferme', 'autour de la mare'], { inv: ['Dans le pré', 'Autour de la mare'] }),
  V3('boire', ['boit', 'boivent', 'bois', 'buvons', 'buvez'], ['buvait', 'buvaient'], ['boira', 'boiront'], ALL, ['l’eau de la rivière', 'l’eau de la mare']),
  V3('vivre', ['vit', 'vivent', 'vis', 'vivons', 'vivez'], ['vivait', 'vivaient'], ['vivra', 'vivront'], ALL, ['dans la forêt', 'près du lac', 'à la ferme'], { inv: ['Au fond de la forêt', 'Près du lac'] }),
];
const VB = Object.fromEntries(VERBS.map((v) => [v.inf, v]));
/** The forms of a verb in a tense: s (il), p (ils), t2 (tu), x (a look-alike: infinitive or participle), nous, vous. */
function vforms(V, tense) {
  if (V.g1) {
    const st = V.stem, ge = /g$/.test(st) ? 'e' : '';
    if (tense === 'imp') return { s: st + ge + 'ait', p: st + ge + 'aient', t2: st + ge + 'ais', x: st + 'é' };
    if (tense === 'fut') return { s: V.inf + 'a', p: V.inf + 'ont', t2: V.inf + 'as', x: V.inf };
    return { s: st + 'e', p: st + 'ent', t2: st + 'es', x: V.inf, nous: st + ge + 'ons', vous: st + 'ez' };
  }
  if (tense === 'imp') return { s: V.imp[0], p: V.imp[1], t2: V.imp[0].slice(0, -1) + 's', x: V.inf };
  if (tense === 'fut') return { s: V.fut[0], p: V.fut[1], t2: V.fut[0] + 's', x: V.inf };
  return { s: V.pres[0], p: V.pres[1], t2: V.pres[2], x: V.inf, nous: V.pres[3], vous: V.pres[4] };
}

// ---------- tokens: { w, e (elided l’ in front), p (punctuation after), alt (wrong forms), why, kind } ----------
const show = (t, w = t.w) => (t.e || '') + w + (t.p || '');
const plain = (s) => s.split(' ').filter(Boolean).map((w) => ({ w }));
/** Sentence text from tokens, the token at index gap shown as @. */
function textOf(toks, gap = -1) { return toks.map((t, i) => (i === gap ? (t.e || '') + '@' + (t.p || '') : show(t))).join(' '); }
function capFirst(toks) { const t = toks[0]; if (t.e) t.e = cap(t.e); else t.w = cap(t.w); return toks; }
function endWith(toks, mark) { const t = toks[toks.length - 1]; t.p = (t.p || '') + mark; return toks; }
/** Split a ready sentence into tokens, keeping « ? ! : ; » on the word before them. */
function tokensOf(s) {
  const out = [];
  for (const w of s.split(' ').filter(Boolean)) {
    if (/^[?!:;]$/.test(w) && out.length) out[out.length - 1].p = (out[out.length - 1].p || '') + ' ' + w;
    else {
      const mm = /^(.*?)([.,]+)$/.exec(w);
      const t = mm && mm[1] ? { w: mm[1], p: mm[2] } : { w };
      const el = /^(d’|l’|j’|n’|qu’|s’|c’)(.+)$/i.exec(t.w); // « d’arroser »: the verb is the word, d’ sits in front
      if (el) { t.e = el[1]; t.w = el[2]; }
      out.push(t);
    }
  }
  return out;
}

function det(kind, g, n, vow) {
  if (n) return { def: 'les', ind: 'des', dem: 'ces', pos: 'mes', num: pick(['deux', 'trois', 'quatre', 'cinq']) }[kind];
  if (kind === 'def') return vow ? 'l’' : g === 'f' ? 'la' : 'le';
  if (kind === 'dem') return g === 'f' ? 'cette' : vow ? 'cet' : 'ce';
  if (kind === 'pos') return g === 'f' && !vow ? 'ma' : 'mon';
  return g === 'f' ? 'une' : 'un';
}
const plWhy = (d, n) => (n ? `« ${d} » montre qu’il y en a plusieurs : le nom est au pluriel` : `« ${d} » montre qu’il y en a un seul : le nom est au singulier`);
/**
 * A noun group: determiner, adjective before (pre), noun, adjective after (post).
 * Returns { toks, n, g, N, d, text, head } — each word that can be misspelled carries alt and why.
 */
function makeGN(id, n, o = {}) {
  const N = NO[id];
  let kind = o.det || 'def';
  if (kind === 'num' && !n) kind = 'ind';
  if (N.my && !n && kind === 'def') kind = 'pos'; // « mon cousin » rather than « le cousin »
  if (n && kind === 'ind' && o.pre) kind = 'def'; // « les petits lapins » rather than « des petits lapins »
  const nounW = n ? N.p : N.s;
  const preW = o.pre ? (N.g === 'm' && !n && N.v && AD[o.pre].mv ? AD[o.pre].mv : form(o.pre, N.g, n)) : null;
  const d = det(kind, N.g, n, o.pre ? false : !!N.v);
  const toks = [];
  const elide = d.endsWith('’');
  if (!elide) toks.push({ w: d, kind: 'det' });
  const desc = `${N.g === 'f' ? 'féminin' : 'masculin'} ${n ? 'pluriel' : 'singulier'}`;
  const adjTok = (a, w) => ({ w, kind: 'adj', alt: adjAlts(a, N.g, n, w), why: `« ${w} » va avec « ${nounW} », ${desc}.`, adj: a });
  if (o.pre) toks.push(adjTok(o.pre, preW));
  const nt = { w: nounW, kind: 'noun', alt: N.s === N.p ? [] : [n ? N.s : N.p], why: `${plWhy(d, n)} → « ${nounW} ».`, noun: id };
  if (elide) nt.e = d;
  toks.push(nt);
  if (o.post) toks.push(adjTok(o.post, form(o.post, N.g, n)));
  const text = toks.map((t) => show(t)).join(' ');
  // the head: the determiner, the adjective before and the noun (« le petit oiseau »)
  return { toks, n, g: N.g, N, d, text, head: toks.slice(0, toks.indexOf(nt) + 1).map((t) => show(t)).join(' ') };
}
/** Wrong forms of an adjective, the most likely slip first (the plural forgotten, then the feminine). */
function adjAlts(a, g, n, right) {
  const og = g === 'f' ? 'm' : 'f';
  return uniq([form(a, g, n ? 0 : 1), form(a, og, n), form(a, og, n ? 0 : 1)]).filter((w) => w !== right);
}
const pron = (g, n) => (n ? (g === 'f' ? 'elles' : 'ils') : (g === 'f' ? 'elle' : 'il'));
const pickPost = (N, needVaried) => { const l = N.adj.filter((a) => !needVaried || varied(a)); return l.length ? pick(l) : null; };

// ---------- the scene builder (subject + verb + complement), shared by « sujet-verbe » and the error hunt ----------
const CN = [['de la forêt', 0], ['du village', 0], ['de la ferme', 0], ['du lac', 0], ['du vieux moulin', 0], ['de Mamie Rose', 0], ['du voisin', 0], ['de ma cousine', 0],
  ['des voisins', 1], ['de mes cousins', 1], ['des collines', 1], ['des enfants', 1], ['des fermiers', 1]];
const CN_HUM = [['du village', 0], ['de Léa', 0], ['de Mamie Rose', 0], ['de Tim', 0], ['des voisins', 1], ['des collines', 1]];
const INCISES = ['chaque matin', 'sans faire de bruit', 'tout à coup', 'après la pluie', 'comme tous les jours'];
const ECRAN = [
  { ctx: 'Les pommes sont mûres.', pro: 'les', v: 'ramasser', who: HUM, obj: 'les pommes', tail: 'une à une' },
  { ctx: 'Les étoiles brillent.', pro: 'les', v: 'regarder', who: ALL, obj: 'les étoiles', tail: 'en silence' },
  { ctx: 'Les noisettes sont cachées sous les feuilles.', pro: 'les', v: 'chercher', who: ['ecureuil', 'souris', 'enfant', 'cousin', 'cousine'], obj: 'les noisettes', tail: 'partout' },
  { ctx: 'Les fleurs ont soif.', pro: 'les', v: 'arroser', who: HUM, obj: 'les fleurs', tail: 'avec soin' },
  { ctx: 'Les oiseaux chantent.', pro: 'les', v: 'écouter', who: but(ALL, 'oiseau'), obj: 'les oiseaux', tail: 'en silence' },
  { ctx: 'Les mouches tournent autour de la ferme.', pro: 'les', v: 'attraper', who: ['chat', 'grenouille', 'oiseau'], obj: 'les mouches', tail: 'une par une' },
  { ctx: 'Le ballon est tombé dans la rivière.', pro: 'le', v: 'chercher', who: [...HUM, 'chien'], obj: 'le ballon', tail: 'partout' },
  { ctx: 'La lune est toute ronde.', pro: 'la', v: 'regarder', who: ALL, obj: 'la lune', tail: 'longtemps' },
];
const NOUS = [['Léa et moi', 'enfant'], ['Tim et moi', 'enfant'], ['Ma cousine et moi', 'cousine'], ['Mon chien et moi', 'chien']];

function adjOpts(N, lv) {
  const o = {};
  if (lv >= 2 && chance(0.6)) o.pre = pick(N.pre);
  if (lv >= 1 && chance(lv >= 2 ? 0.7 : 0.5)) o.post = pickPost(N);
  return o;
}
/**
 * One sentence with a subject and its verb, harder with the level:
 * −1 a pronoun · 0-1 a noun group · 2 with adjectives · 3 a complement of the noun or words between subject and verb ·
 * 4 a pronoun before the verb, two subjects, imparfait / futur · 5 the subject after the verb, « qui », « nous ».
 * Returns { toks, vi (index of the verb), right, wrongs, ex, hint }.
 */
function svScene(lv, only) {
  let mode = 'gn';
  if (lv <= -1) mode = 'pro';
  else if (lv === 3) mode = pick(['cn', 'cn', 'incise', 'gn']);
  else if (lv === 4) mode = pick(['ecran', 'ecran', 'et', 'cn', 'incise']);
  else if (lv >= 5) mode = pick(['inv', 'inv', 'qui', 'nous', 'ecran', 'cn', 'et']);
  if (only) mode = only;
  let tense = lv >= 4 && ['gn', 'cn', 'et'].includes(mode) && chance(0.45) ? pick(['imp', 'fut']) : 'pres';
  let V, toks = [], n, g = 'm', core, note = '', tail = null;
  const lead = !['gn', 'cn', 'et', 'pro'].includes(mode) ? null : tense === 'imp' ? pick(['Autrefois,', 'Chaque été,']) : tense === 'fut' ? pick(['Demain,', 'Bientôt,']) : lv >= 3 && chance(0.3) ? pick(['Ce matin,', 'Chaque soir,']) : null;
  if (lead) toks.push(...plain(lead));
  if (mode === 'pro') {
    V = pick(VERBS); n = chance(0.6) ? 1 : 0; g = pick(['m', 'f']);
    core = pron(g, n); toks.push({ w: core });
  } else if (mode === 'ecran') {
    const E = pick(ECRAN); V = VB[E.v];
    n = E.pro === 'les' ? (chance(0.8) ? 0 : 1) : (chance(0.8) ? 1 : 0);
    const id = pick(E.who); const G = makeGN(id, n, { det: pick(['def', 'pos']), ...adjOpts(NO[id], 2) });
    toks = [...tokensOf(E.ctx), ...capFirst(G.toks), { w: E.pro }];
    g = G.g; core = G.head; note = ` « ${E.pro} » (= ${E.obj}) est collé au verbe, mais ce n’est pas le sujet !`;
    tail = E.tail;
  } else if (mode === 'et') {
    V = pick(VERBS.filter((v) => v.who.length > 2));
    const [a, b] = shuffle([...V.who]).slice(0, 2);
    const A1 = makeGN(a, 0, { det: pick(['def', 'pos']) }), B1 = makeGN(b, 0, { det: pick(['def', 'pos']) });
    toks.push(...A1.toks, { w: 'et' }, ...B1.toks);
    n = 1; g = A1.g === 'f' && B1.g === 'f' ? 'f' : 'm'; core = `${A1.text} et ${B1.text}`; note = ' Deux sujets reliés par « et » : c’est plusieurs → pluriel.';
  } else if (mode === 'nous') {
    const [s, id] = pick(NOUS); V = pick(VERBS.filter((v) => v.who.includes(id) && v.who.includes('enfant')));
    toks.push(...plain(s)); n = 2; core = s; note = ` « ${s} », c’est « nous » → -ons.`;
  } else if (mode === 'inv') {
    V = pick(VERBS.filter((v) => v.inv));
    n = chance(0.75) ? 1 : 0;
    const id = pick(V.who); const G = makeGN(id, n, { det: pick(['def', 'num', 'def']), ...adjOpts(NO[id], 2) });
    const vt = verbTok(V, 'pres', n, g, G.head);
    toks = [...plain(pick(V.inv)), vt, ...G.toks];
    g = G.g; core = G.head;
    if (chance(0.4)) { const c = pick((NO[id].h ? CN_HUM : CN).filter(([s]) => !s.includes(NO[id].s))); toks.push(...plain(c[0])); }
    capFirst(toks); endWith(toks, '.');
    const f = vforms(V, 'pres');
    return finish(toks, toks.indexOf(vt), n ? f.p : f.s, [f.s, f.p, f.t2, f.x], n, g, core, V, 'pres', ' Ici, le sujet est placé après le verbe !');
  } else if (mode === 'qui') {
    V = pick(VERBS); n = chance(0.75) ? 1 : 0;
    const id = pick(V.who); const G = makeGN(id, n, { det: pick(['def', 'dem', 'num']), ...adjOpts(NO[id], 2) });
    toks.push({ w: 'Regarde' }, ...G.toks, { w: 'qui' });
    g = G.g; core = G.head; note = ` « qui » remplace « ${G.text} ».`;
    const vt = verbTok(V, 'pres', n, g, core); toks.push(vt, ...plain(pick(V.c)));
    endWith(toks, ' !');
    const f = vforms(V, 'pres');
    return finish(toks, toks.indexOf(vt), n ? f.p : f.s, [f.s, f.p, f.t2, f.x], n, g, core, V, 'pres', note);
  } else {
    V = pick(VERBS); n = chance(lv <= 0 ? 0.65 : 0.7) ? 1 : 0;
    const id = pick(mode === 'cn' ? V.who.filter((k) => !NO[k].my) : V.who), N = NO[id]; // not « mon cousin de Léa »
    const G = makeGN(id, n, { det: lv <= 0 ? pick(['def', 'def', 'num']) : mode === 'cn' ? pick(['def', 'def', 'dem', 'num']) : pick(['def', 'def', 'dem', 'pos', 'num']), ...(lv >= 1 ? adjOpts(N, lv) : {}) });
    toks.push(...G.toks); g = G.g; core = G.head;
    if (mode === 'cn') {
      const list = (N.h ? CN_HUM : CN).filter(([s, cn]) => cn !== n && !s.includes(N.s));
      const c = pick(list.length ? list : CN);
      toks.push(...plain(c[0])); note = ` « ${c[0]} » complète le nom : ce n’est pas le sujet.`;
    } else if (mode === 'incise') {
      tense = 'pres';
      endWith(toks, ','); const inc = plain(pick(INCISES)); endWith(inc, ','); toks.push(...inc);
      note = ' Les mots entre les virgules ne changent rien à l’accord.';
    }
  }
  const vt = verbTok(V, tense, n, g, core);
  toks.push(vt);
  toks.push(...plain(tail || pick(V.c)));
  capFirst(toks); endWith(toks, '.');
  const f = vforms(V, tense);
  const right = n === 2 ? f.nous : n ? f.p : f.s;
  const wrongs = n === 2 ? [f.p, f.s, f.vous] : lv <= 1 ? [f.s, f.p, f.t2] : [f.s, f.p, f.t2, f.x];
  return finish(toks, toks.indexOf(vt), right, wrongs, n, g, core, V, tense, note);
}
function verbTok(V, tense, n, g, core) {
  const f = vforms(V, tense);
  const right = n === 2 ? f.nous : n ? f.p : f.s;
  const slip = n === 2 ? f.p : n ? f.s : f.p; // the plural forgotten (or added)
  return { w: right, kind: 'verb', alt: [slip], why: `Le sujet est « ${core} » (${n === 2 ? 'nous' : n ? 'plusieurs → ils' : 'un seul → il'}) → « ${right} ».` };
}
function finish(toks, vi, right, wrongs, n, g, core, V, tense, note) {
  const f = vforms(V, tense);
  const q3 = f.s;
  const ex = `Qui est-ce qui ${q3} ? ${cap(core)} → ${n === 2 ? 'nous' : pron(g, n)} : « ${right} ».${note}`;
  const hint = `Qui est-ce qui ${q3} ? Trouve le sujet, puis remplace-le par il, ils (ou nous).`;
  return { toks, vi, right, wrongs, ex, hint, n };
}
function gapQ(cat, toks, gi, right, wrongs, ex, hint, lead) {
  const q = (lead ? lead + ' ' : '') + textOf(toks, gi);
  const choices = shuffle(uniq([right, ...wrongs]).slice(0, 5));
  return { cat, q, a: right, choices, u: '', ex, hint };
}

// ---------- Accord sujet-verbe ----------
function sujetVerbe(d) {
  const s = svScene(d);
  return gapQ('fr:sv', s.toks, s.vi, s.right, s.wrongs, s.ex, s.hint);
}

// ---------- Accords dans le groupe nominal ----------
const GN_FRAMES = ['Thibault regarde @ dans le pré.', 'Léa dessine @.', 'Mamie Rose nourrit @.', 'J’aperçois @ près du lac.', 'Tim photographie @.'];
// 8H: irregular plurals and feminines, in a sentence
const PLURALS = [
  ['Thibault ramasse des @ au bord de la rivière.', 'caillou', 'cailloux', 'caillous'], ['Mamie Rose range ses @ dans une boîte.', 'bijou', 'bijoux', 'bijous'],
  ['Deux @ hululent dans la forêt.', 'hibou', 'hiboux', 'hibous'], ['La fermière plante des @ dans le potager.', 'chou', 'choux', 'chous'],
  ['Tim est tombé sur les deux @.', 'genou', 'genoux', 'genous'], ['Trois @ glissent sur le lac.', 'bateau', 'bateaux', 'bateaus'],
  ['Les @ galopent dans le pré.', 'cheval', 'chevaux', 'chevals'], ['Les @ de la ferme ont faim.', 'animal', 'animaux', 'animals'],
  ['Le facteur apporte les @ du matin.', 'journal', 'journaux', 'journals'], ['Les @ du pont sont finis.', 'travail', 'travaux', 'travails'],
  ['Léa brosse ses longs @.', 'cheveu', 'cheveux', 'cheveus'], ['Les enfants inventent des @.', 'jeu', 'jeux', 'jeus'],
  ['Les @ du tracteur sont crevés.', 'pneu', 'pneus', 'pneux'], ['Le menuisier plante des @ dans la planche.', 'clou', 'clous', 'cloux'],
  ['Le lapin creuse des @ dans le jardin.', 'trou', 'trous', 'troux'], ['Les @ chantent dans le cerisier.', 'oiseau', 'oiseaux', 'oiseaus'],
];
const PLURAL_WHY = { caillou: 'Sept mots en -ou prennent un x : bijou, caillou, chou, genou, hibou, joujou, pou.', bijou: 'Sept mots en -ou prennent un x : bijou, caillou, chou, genou, hibou, joujou, pou.', hibou: 'Sept mots en -ou prennent un x : bijou, caillou, chou, genou, hibou, joujou, pou.', chou: 'Sept mots en -ou prennent un x : bijou, caillou, chou, genou, hibou, joujou, pou.', genou: 'Sept mots en -ou prennent un x : bijou, caillou, chou, genou, hibou, joujou, pou.', clou: 'Les autres mots en -ou prennent un s : des clous, des trous.', trou: 'Les autres mots en -ou prennent un s : des clous, des trous.', bateau: 'Les mots en -eau prennent un x : des bateaux, des oiseaux.', oiseau: 'Les mots en -eau prennent un x : des bateaux, des oiseaux.', cheval: 'Les mots en -al deviennent -aux : un cheval, des chevaux.', animal: 'Les mots en -al deviennent -aux : un animal, des animaux.', journal: 'Les mots en -al deviennent -aux : un journal, des journaux.', travail: 'Travail fait travaux (mais un détail, des détails).', cheveu: 'Les mots en -eu prennent un x : des cheveux, des jeux.', jeu: 'Les mots en -eu prennent un x : des cheveux, des jeux.', pneu: 'Attention, exception : un pneu, des pneus (avec un s).' };
const FEMS = [
  ['Une poule @ picore dans la cour.', 'blanc', 'blanche', ['blance', 'blancs']], ['Une @ chèvre dort dans l’étable.', 'vieux', 'vieille', ['vieuse', 'vieil']],
  ['Une souris @ sort de son trou.', 'curieux', 'curieuse', ['curieuxe', 'curieuses']], ['Mamie Rose cueille une salade bien @.', 'frais', 'fraîche', ['fraise', 'fraisse']],
  ['Une feuille @ tombe de l’arbre.', 'sec', 'sèche', ['sece', 'secs']], ['Léa a planté une @ fleur.', 'beau', 'belle', ['beaue', 'bel']],
  ['Ma voisine est très @.', 'gentil', 'gentille', ['gentile', 'gentils']], ['La chatte de Tim est @.', 'roux', 'rousse', ['rouxe', 'rousses']],
  ['Cette tarte est @ !', 'délicieux', 'délicieuse', ['délicieuxe', 'délicieuses']], ['La laine du mouton est @.', 'doux', 'douce', ['douxe', 'douse']],
];
const ATTR_CN = [['du fermier', 'm', 0], ['de la fermière', 'f', 0], ['des voisins', 'm', 1], ['des voisines', 'f', 1], ['de ma cousine', 'f', 0], ['de mon cousin', 'm', 0], ['de Léa', 'f', 0], ['de Tim', 'm', 0], ['des enfants', 'm', 1]];
function accordGN(d) {
  const cat = 'fr:gn';
  if (d <= 0) {
    // the noun alone, after a determiner that shows the number
    const id = pick(but(ANIM, 'souris')), N = NO[id], n = chance(0.65) ? 1 : 0;
    const G = makeGN(id, n, { det: pick(['def', 'num', 'dem']) });
    const ni = G.toks.findIndex((t) => t.kind === 'noun');
    const V = pick(VERBS.filter((v) => v.who.includes(id)));
    const toks = d < 0 ? [...plain('Thibault voit'), ...G.toks] : [...capFirst(G.toks), verbTok(V, 'pres', n, N.g, G.head), ...plain(pick(V.c))];
    endWith(toks, '.');
    return gapQ(cat, toks, ni + (d < 0 ? 2 : 0), n ? N.p : N.s, [N.s, N.p], `${plWhy(G.d, n)} → « ${n ? N.p : N.s} ».`, `Regarde le petit mot devant le nom : « ${G.d} ».`);
  }
  if (d <= 2) {
    // one adjective (d 1) or two (d 2), feminine nouns more often at d 2
    const gg = d === 2 ? (chance(0.6) ? 'f' : 'm') : (chance(0.7) ? 'm' : 'f');
    const id = pick(ANIM.filter((k) => NO[k].g === gg)), N = NO[id], n = chance(0.7) ? 1 : 0;
    const o = d === 1 ? (chance(0.5) ? { pre: pick(N.pre.filter(varied)) } : { post: pickPost(N, true) }) : { pre: pick(N.pre), post: pickPost(N, true) };
    if (!o.pre && !o.post) o.pre = 'petit';
    const G = makeGN(id, n, { det: pick(['def', 'dem', 'pos', 'num']), ...o });
    const V = pick(VERBS.filter((v) => v.who.includes(id)));
    const toks = [...capFirst(G.toks), verbTok(V, 'pres', n, N.g, G.head), ...plain(pick(V.c))];
    endWith(toks, '.');
    const cands = G.toks.map((t, i) => (t.kind === 'adj' && varied(t.adj) ? i : -1)).filter((i) => i >= 0);
    if (d === 2 && N.s !== N.p && chance(0.25)) cands.push(G.toks.findIndex((t) => t.kind === 'noun'));
    const gi = pick(cands.length ? cands : [G.toks.findIndex((t) => t.kind === 'noun')]);
    const t = toks[gi];
    const wrongs = t.kind === 'adj' ? forms(t.adj) : [N.s, N.p];
    return gapQ(cat, toks, gi, t.w, wrongs, t.kind === 'adj' ? `${t.why} Le chef du groupe est « ${n ? N.p : N.s} ».` : t.why, `Le chef du groupe est le nom « ${N.s} ». Masculin ou féminin ? Un seul ou plusieurs ?`);
  }
  if (d === 3) {
    // the whole group: which one is well written?
    const id = pick(ANIM.filter((k) => NO[k].s !== NO[k].p)), N = NO[id], n = chance(0.7) ? 1 : 0;
    const G = makeGN(id, n, { det: pick(['def', 'dem', 'pos']), pre: pick(N.pre.filter(varied)), post: pickPost(N, true) || 'petit' });
    const variants = G.toks.filter((t) => t.alt && t.alt.length).map((t) => G.toks.map((u) => (u === t ? show(u, u.alt[0]) : show(u))).join(' '));
    const frame = pick(GN_FRAMES);
    return { cat, q: `Quel groupe est bien écrit ? ${frame}`, a: G.text, choices: shuffle(uniq([G.text, ...variants]).slice(0, 4)), u: '',
      ex: `${G.text} : le chef est « ${n ? N.p : N.s} », ${N.g === 'f' ? 'féminin' : 'masculin'} ${n ? 'pluriel' : 'singulier'}. Tous les mots du groupe s’accordent avec lui.`, hint: FR_HINTS[cat] };
  }
  if (d === 4) {
    // the attribute after « est / sont », with a complement of another gender or number in between
    const id = pick(ANIM.filter((k) => NO[k].adj.some(varied))), N = NO[id], n = chance(0.6) ? 1 : 0;
    const a = pick(N.adj.filter(varied));
    const cn = pick(ATTR_CN.filter(([, g2, n2]) => g2 !== N.g || n2 !== n));
    const G = makeGN(id, n, { det: 'def' });
    const toks = [...capFirst(G.toks), ...plain(cn[0]), { w: n ? 'sont' : 'est' }, { w: 'très' }, { w: form(a, N.g, n), p: '.' }];
    return gapQ(cat, toks, toks.length - 1, form(a, N.g, n), forms(a),
      `Qui est ${a} ? ${cap(G.head)}, pas « ${cn[0].replace(/^d(e la|u|es|e) /, '')} ». « ${G.head} » est ${N.g === 'f' ? 'féminin' : 'masculin'} ${n ? 'pluriel' : 'singulier'} → « ${form(a, N.g, n)} ».`,
      'Qui est-ce qui est… ? Cherche le sujet du verbe être : l’adjectif s’accorde avec lui.');
  }
  // d 5: irregular plurals and feminines
  if (chance(0.55)) {
    const [s, sg, right, wrong] = pick(PLURALS);
    return { cat, q: s, a: right, choices: shuffle([right, wrong, sg]), u: '', ex: `Un ${sg}, des ${right}. ${PLURAL_WHY[sg]}`, hint: 'Attention aux pluriels en -x : -eau, -eu, -al… et les sept mots en -ou.' };
  }
  const [s, m, f, w] = pick(FEMS);
  return { cat, q: s, a: f, choices: shuffle(uniq([f, m, ...w])), u: '', ex: `Au féminin, « ${m} » devient « ${f} ».`, hint: 'Le nom est féminin : comment l’adjectif change-t-il au féminin ?' };
}

// ---------- é ou er ? ----------
const EV = [['ramasser', 'des pommes'], ['arroser', 'les fleurs'], ['traverser', 'le pont'], ['chercher', 'des champignons'], ['regarder', 'les étoiles'],
  ['préparer', 'le goûter'], ['réparer', 'la barrière'], ['donner', 'du foin aux vaches'], ['trouver', 'un trésor'], ['laver', 'le tracteur'],
  ['dessiner', 'un renard'], ['planter', 'des tomates'], ['manger', 'une tarte aux pommes'], ['nettoyer', 'l’étable'], ['ranger', 'les outils'], ['écouter', 'le chant des oiseaux']];
const ES = [['Thibault', 0], ['Léa', 0], ['Tim', 0], ['Mamie Rose', 0], ['le fermier', 0], ['la fermière', 0], ['mon cousin', 0], ['ma cousine', 0],
  ['les enfants', 1], ['mes cousins', 1], ['Léa et Tim', 1], ['les fermiers', 1]];
const ES_SHORT = [['il', 0], ['elle', 0], ['ils', 1], ['elles', 1]];
const INF_FRAMES = [
  (S, n) => [`${S} ${n ? 'vont' : 'va'} @`, n ? 'vont' : 'va'], (S, n) => [`${S} ${n ? 'aiment' : 'aime'} @`, n ? 'aiment' : 'aime'],
  (S, n) => [`${S} ${n ? 'veulent' : 'veut'} @`, n ? 'veulent' : 'veut'], (S, n) => [`${S} ${n ? 'doivent' : 'doit'} @`, n ? 'doivent' : 'doit'],
  () => ['Il faut @', 'il faut'], (S, n) => [`${S} ${n ? 'commencent' : 'commence'} à @`, 'à'],
];
const INF_LONG = [(S, n, C) => [`Pour @ ${C}, ${S} ${n ? 'ont' : 'a'} besoin d’aide`, 'pour', true], (S, n) => [`Avant la nuit, ${S} ${n ? 'doivent' : 'doit'} encore @`, n ? 'doivent' : 'doit'],
  (S, n) => [`${S} ${n ? 'ont' : 'a'} oublié de @`, 'de'], (S, n) => [`${S} ${n ? 'partent' : 'part'} sans @`, 'sans']];
const PP_FRAMES = [(S, n) => [`${S} ${n ? 'ont' : 'a'} @`, n ? 'ont' : 'a'], (S, n) => [`Hier, ${S} ${n ? 'ont' : 'a'} @`, n ? 'ont' : 'a'], (S, n) => [`${S} ${n ? 'ont' : 'a'} déjà @`, n ? 'ont' : 'a']];
const PP_LONG = [(S, n) => [`${S} n’${n ? 'ont' : 'a'} pas encore @`, n ? 'ont' : 'a'], (S, n) => [`Ce matin, avant l’école, ${S} ${n ? 'ont' : 'a'} @`, n ? 'ont' : 'a']];
const ETRE_V = [['arriver', 'à la ferme'], ['tomber', 'dans la boue'], ['rentrer', 'à la maison'], ['monter', 'au grenier'], ['entrer', 'dans la grange'], ['rester', 'près du feu'], ['retourner', 'au village']];
const ETRE_S = [['Léa', 'f', 0], ['Tim', 'm', 0], ['Mamie Rose', 'f', 0], ['le chat', 'm', 0], ['la chèvre', 'f', 0], ['les poules', 'f', 1], ['les enfants', 'm', 1],
  ['mes cousines', 'f', 1], ['les vaches', 'f', 1], ['les lapins', 'm', 1], ['ma cousine', 'f', 0], ['mon cousin', 'm', 0]];
const PP_ADJ = [['Léa ramasse une pomme @ sous l’arbre.', 'oublier', 'f', 0, 'une pomme'], ['L’écureuil retrouve les noisettes @ sous les feuilles.', 'cacher', 'f', 1, 'les noisettes'],
  ['Tim répare la barrière @ par le vent.', 'casser', 'f', 0, 'la barrière'], ['Les fermiers rentrent les vaches @ par la chaleur.', 'fatiguer', 'f', 1, 'les vaches'],
  ['Thibault adore les tartes @ par Mamie Rose.', 'préparer', 'f', 1, 'les tartes'], ['On entend les chiens @ près de la grange.', 'attacher', 'm', 1, 'les chiens'],
  ['Le renard rôde autour du poulailler @.', 'fermer', 'm', 0, 'le poulailler'], ['Les enfants @ par la pluie rentrent vite.', 'mouiller', 'm', 1, 'les enfants']];
const ppAgree = (st, g, n) => st + 'é' + (g === 'f' ? 'e' : '') + (n ? 's' : '');
/** Returns { toks, gi, right, wrongs, ex, hint } — one verb ending in the [é] sound. */
function eerScene(lv) {
  let type;
  if (lv <= 1) type = pick(['inf', 'pp']);
  else if (lv === 2) type = pick(['inf', 'pp', 'inf', 'pp', 'ez']);
  else if (lv === 3) type = pick(['inf', 'pp', 'ez', 'ait']);
  else if (lv === 4) type = pick(['etre', 'etre', 'inf', 'pp', 'ait']);
  else type = pick(['adj', 'adj', 'etre', 'inf', 'pp', 'ait']);
  if (type === 'etre') {
    const [inf, C] = pick(ETRE_V), [S, g, n] = pick(ETRE_S), st = inf.slice(0, -2);
    const lead = pick(['', 'Hier soir, ', 'Ce matin, ']);
    const right = ppAgree(st, g, n);
    const toks = capFirst(tokensOf(`${lead}${S} ${n ? 'sont' : 'est'} ${right} ${C}.`));
    const gi = toks.findIndex((t) => t.w === right);
    return { toks, gi, right, wrongs: [st + 'é', st + 'ée', st + 'és', st + 'ées', inf], slip: n || g === 'f' ? st + 'é' : inf,
      ex: `Avec « ${n ? 'sont' : 'est'} » (le verbe être), le participe passé s’accorde avec le sujet « ${S} » : ${g === 'f' ? 'féminin' : 'masculin'} ${n ? 'pluriel' : 'singulier'} → « ${right} ».`,
      hint: `Avec être, le participe s’accorde avec le sujet. Qui est-ce qui est ${st}é ? Masculin ou féminin ? Un ou plusieurs ?` };
  }
  if (type === 'adj') {
    const [s, inf, g, n, noun] = pick(PP_ADJ), st = inf.slice(0, -2), right = ppAgree(st, g, n);
    const toks = tokensOf(s.replace('@', right)), gi = toks.findIndex((t) => t.w === right);
    return { toks, gi, right, wrongs: [st + 'é', st + 'ée', st + 'és', st + 'ées', inf], slip: n || g === 'f' ? st + 'é' : inf,
      ex: `« ${right} » décrit ${noun}, comme un adjectif : il s’accorde (${g === 'f' ? 'féminin' : 'masculin'} ${n ? 'pluriel' : 'singulier'}).`,
      hint: `Ce mot décrit un nom, comme un adjectif. Lequel ? Il s’accorde avec lui.` };
  }
  const [inf, C0] = pick(EV), st = inf.slice(0, -2), ge = /g$/.test(st) ? 'e' : '';
  const F = { pp: st + 'é', inf, ez: st + 'ez', ait: st + ge + 'ait', aient: st + ge + 'aient' };
  const short = lv <= 0;
  let [S, n] = short ? pick(ES_SHORT) : pick(ES);
  let sentence, right, ex, trig;
  if (type === 'ez') {
    sentence = pick([`Vous @ ${C0}.`, `Ce matin, vous @ ${C0}.`, `Léa et toi, vous @ ${C0}.`]);
    right = F.ez; ex = `Avec « vous », le verbe se termine par -ez : vous mordez → « ${F.ez} ».`;
  } else if (type === 'ait') {
    sentence = `Autrefois, ${S} @ ${C0} chaque jour.`; right = n ? F.aient : F.ait;
    ex = `C’est l’imparfait (autrefois, chaque jour) : ${n ? 'ils mordaient' : 'il mordait'} → « ${right} ».`;
  } else {
    const long = lv >= 3 && chance(0.5);
    const fr = pick(type === 'inf' ? (long ? INF_LONG : INF_FRAMES) : (long ? PP_LONG : PP_FRAMES));
    const [head, t, hasC] = fr(S, n, C0);
    trig = t;
    sentence = (hasC ? `${head}.` : `${head} ${C0}.`).replace(' de @', /^[aeiouéèh]/.test(inf) ? ' d’@' : ' de @');
    right = type === 'inf' ? F.inf : F.pp;
    ex = type === 'inf' ? `Après « ${trig} », le verbe reste à l’infinitif : on pourrait dire « ${trig} mordre » → « ${F.inf} ».`
      : `Avec « ${trig} » (le verbe avoir), c’est le participe passé : on dirait « ${trig} mordu » → « ${F.pp} ».`;
  }
  const toks = capFirst(tokensOf(sentence.replace('@', right)));
  const gi = toks.findIndex((t) => t.w === right);
  const wrongs = lv <= 1 ? [F.pp, F.inf] : lv === 2 ? [F.pp, F.inf, F.ez, F.ait] : [F.pp, F.inf, F.ez, n ? F.aient : F.ait];
  return { toks, gi, right, wrongs, slip: right === F.pp ? F.inf : right === F.inf ? F.pp : F.pp, ex, hint: FR_HINTS['fr:eer'] };
}
function eer(d) {
  const s = eerScene(d);
  return gapQ('fr:eer', s.toks, s.gi, s.right, s.wrongs, s.ex, s.hint);
}

// ---------- Homophones ----------
const WHY = {
  a: 'On peut dire « avait » : c’est le verbe avoir → a.', à: 'On ne peut pas dire « avait » : c’est le petit mot à, avec un accent.',
  est: 'On peut dire « était » : c’est le verbe être → est.', et: 'On peut dire « et puis » → et.',
  sont: 'On peut dire « étaient » : c’est le verbe être → sont.', son: 'On peut dire « mon » : c’est à lui ou à elle → son.',
  ont: 'On peut dire « avaient » : c’est le verbe avoir → ont.', on: 'On peut dire « il » → on.',
  ses: 'Ce sont les siens, à lui ou à elle → ses.', ces: 'On les montre : ces…-là → ces.',
  où: 'Ça parle d’un lieu → où, avec un accent.', ou: 'On peut dire « ou bien » → ou.',
  se: 'Devant un verbe, on peut dire « je me… » → se.', ce: 'Devant un nom, on peut dire « ce…-là » → ce.',
  leur: 'Devant un verbe (leur donne), ou pour un seul objet, leur ne prend pas de s.', leurs: 'Devant un nom au pluriel (ils en ont plusieurs) → leurs.',
};
const TRICK = { 'a/à': 'Essaie de dire « avait ».', 'et/est': 'Essaie de dire « était ».', 'son/sont': 'Essaie de dire « étaient ».', 'on/ont': 'Essaie de dire « avaient »… ou « il ».',
  'ces/ses': 'À lui (les siens) ? Ou qu’on montre (ceux-là) ?', 'ou/où': 'Essaie de dire « ou bien ».', 'ce/se': 'Devant un verbe ou devant un nom ?', 'leur/leurs': 'Devant un verbe ou devant un nom ? Un seul objet ou plusieurs ?' };
const HOMO = {
  'a/à': [['Thibault @ planté des tomates.', 'a'], ['Léa va @ la boutique.', 'à'], ['Le renard @ faim ce soir.', 'a'], ['Nous irons au lac @ vélo.', 'à'],
    ['Le lapin court @ toute vitesse.', 'à'], ['Tim @ oublié son panier.', 'a'], ['Il y @ des champignons dans la forêt.', 'a'], ['La poule rentre @ la ferme.', 'à'], ['Mamie Rose @ cueilli des fraises.', 'a']],
  'et/est': [['La vache @ dans le pré.', 'est'], ['Léa @ Tim jouent ensemble.', 'et'], ['Le ciel @ tout gris ce matin.', 'est'], ['J’aime les pommes @ les poires.', 'et'],
    ['Le renard @ très rusé.', 'est'], ['Il prend sa pelle @ son seau.', 'et'], ['La soupe @ prête !', 'est'], ['Le chien saute @ aboie.', 'et']],
  'son/sont': [['Les poules @ dans le poulailler.', 'sont'], ['Thibault arrose @ potager.', 'son'], ['Le hibou ouvre @ bec.', 'son'], ['Les pommes @ mûres.', 'sont'],
    ['Léa cherche @ chat partout.', 'son'], ['Les enfants @ fatigués.', 'sont']],
  'on/ont': [['Les lapins @ creusé un terrier.', 'ont'], ['@ va au marché demain.', 'on'], ['Les vaches @ faim.', 'ont'], ['Le soir, @ regarde les étoiles.', 'on'],
    ['Mes cousins @ trouvé un trésor.', 'ont'], ['Quand il pleut, @ reste à la maison.', 'on']],
  'ces/ses': [['Thibault range @ outils dans la grange.', 'ses'], ['Regarde @ nuages, ils sont tout noirs !', 'ces'], ['L’écureuil cache @ noisettes.', 'ses'],
    ['@ fleurs-là sentent bon.', 'ces'], ['Mamie Rose cherche @ lunettes.', 'ses'], ['Qui a planté @ arbres ?', 'ces']],
  'ou/où': [['@ est passé le chat ?', 'où'], ['Tu veux une pomme @ une poire ?', 'ou'], ['La forêt @ vit le renard est sombre.', 'où'],
    ['Qui est le plus rapide : le lapin @ l’écureuil ?', 'ou'], ['Je ne sais pas @ j’ai mis mon panier.', 'où'], ['Demain @ après-demain, nous irons au lac.', 'ou']],
  'ce/se': [['Le chat @ lave avec sa langue.', 'se'], ['@ panier est très lourd.', 'ce'], ['Les enfants @ cachent derrière la grange.', 'se'], ['Regarde @ joli papillon !', 'ce'],
    ['Le renard @ promène la nuit.', 'se'], ['Tim aime bien @ chemin.', 'ce']],
  'leur/leurs': [['Les enfants cherchent @ chien.', 'leur'], ['Les poules protègent @ poussins.', 'leurs'], ['Mamie Rose @ donne des biscuits.', 'leur'],
    ['Les oiseaux construisent @ nids.', 'leurs'], ['Léa @ raconte une histoire.', 'leur'], ['Les fermiers rentrent @ vaches.', 'leurs']],
};
const DOUBLES = [['Mamie Rose @ une maison @ côté du lac.', ['a', 'à'], ['a/à', 'a/à']], ['Le chat @ noir @ blanc.', ['est', 'et'], ['et/est', 'et/est']],
  ['Thibault @ faim @ midi.', ['a', 'à'], ['a/à', 'a/à']], ['Les poules @ dans @ poulailler.', ['sont', 'leur'], ['son/sont', 'leur/leurs']],
  ['@ a vu les lapins : ils @ creusé un terrier.', ['on', 'ont'], ['on/ont', 'on/ont']], ['Le renard @ allé @ la ferme.', ['est', 'à'], ['et/est', 'a/à']],
  ['Léa range @ crayons @ ses livres.', ['ses', 'et'], ['ces/ses', 'et/est']], ['@ vas-tu : au lac @ à la forêt ?', ['où', 'ou'], ['ou/où', 'ou/où']],
  ['Le chat @ cache sous @ vieux banc.', ['se', 'ce'], ['ce/se', 'ce/se']], ['Mes cousins @ perdu @ ballon.', ['ont', 'leur'], ['on/ont', 'leur/leurs']]];
const PAIRS_AT = (lv) => (lv <= 1 ? ['a/à', 'et/est'] : lv === 2 ? ['a/à', 'et/est', 'son/sont', 'on/ont'] : lv === 3 ? ['son/sont', 'on/ont', 'ces/ses', 'ou/où', 'a/à', 'et/est'] : Object.keys(HOMO));
const other = (pair, f) => pair.split('/').find((x) => x !== f);
/** One sentence with one homophone: { toks, gi, right, wrongs, ex, hint }. */
function homoScene(lv) {
  const pair = pick(PAIRS_AT(lv)), [s, right] = pick(HOMO[pair]);
  const start = s.startsWith('@');
  const fix = (w) => (start ? cap(w) : w);
  const toks = tokensOf(s.replace('@', ''));
  const gi = toks.findIndex((t) => t.w === '');
  toks[gi].w = fix(right);
  return { toks, gi, right: fix(right), wrongs: pair.split('/').map(fix), slip: fix(other(pair, right)), ex: WHY[right], hint: TRICK[pair] };
}
function homophones(d) {
  if (d >= 4 && chance(0.35)) {
    const [s, ans, pairs] = pick(DOUBLES);
    const start = s.startsWith('@');
    const f0 = (w) => (start ? cap(w) : w);
    const combos = [];
    for (const x of pairs[0].split('/')) for (const y of pairs[1].split('/')) combos.push(`${f0(x)} … ${y}`);
    const right = `${f0(ans[0])} … ${ans[1]}`;
    return { cat: 'fr:homo', q: s, a: right, choices: shuffle(uniq(combos)), u: '', ex: `${WHY[ans[0]]} ${WHY[ans[1]]}`, hint: `${TRICK[pairs[0]]} ${pairs[1] !== pairs[0] ? TRICK[pairs[1]] : ''}`.trim() };
  }
  const h = homoScene(d);
  return gapQ('fr:homo', h.toks, h.gi, h.right, h.wrongs, h.ex, h.hint);
}

// ---------- Chasse aux fautes: one word is misspelled, tap it ----------
function twoClauses() {
  const V = pick(VERBS.filter((v) => v.who.length > 3)), id = pick(V.who), N = NO[id], n = chance(0.75) ? 1 : 0;
  const G = makeGN(id, n, { det: pick(['def', 'dem', 'pos']), ...adjOpts(N, 3) });
  const V2 = pick(VERBS.filter((v) => v !== V && v.who.includes(id)));
  const p = pron(N.g, n);
  const toks = [...capFirst(G.toks), verbTok(V, 'pres', n, N.g, G.head), ...plain(pick(V.c)), { w: 'et' }, { w: p }, verbTok(V2, 'pres', n, N.g, `${p} (= ${G.head})`), ...plain(pick(V2.c))];
  return endWith(toks, '.');
}
function relire(d) {
  let toks;
  const r = Math.random();
  if (d <= 0) {
    // the shortest: a noun group and its verb
    const V = pick(VERBS), id = pick(but(V.who, 'souris')), N = NO[id], n = chance(0.8) ? 1 : 0;
    const G = makeGN(id, n, { det: pick(['def', 'num']) });
    toks = [...capFirst(G.toks), verbTok(V, 'pres', n, N.g, G.head)];
    if (d === 0) toks.push(...plain(pick(V.c)));
    endWith(toks, '.');
    toks.forEach((t) => { if (t.kind === 'verb') t.alt = []; }); // the mistake is on the noun
  } else if (d <= 2 || (d === 3 && r < 0.65) || (d === 4 && r < 0.5)) {
    toks = svScene(d).toks;
  } else if (d === 3 || (d === 4 && r < 0.8) || (d >= 5 && r < 0.25)) {
    const s = eerScene(d); toks = s.toks; Object.assign(toks[s.gi], { alt: [s.slip], why: s.ex, kind: 'eer' });
  } else if (d === 4 || r < 0.5) {
    const s = homoScene(d); toks = s.toks; Object.assign(toks[s.gi], { alt: [s.slip], why: s.ex, kind: 'homo' });
  } else toks = chance(0.5) ? twoClauses() : svScene(5).toks;
  const cands = toks.map((t, i) => (t.alt && t.alt.length ? i : -1)).filter((i) => i >= 0);
  if (!cands.length) return relire(d);
  // the slips he makes: the plural forgotten on a noun or a verb, the adjective not agreed, é / er mixed up
  const wt = (t) => (t.kind === 'verb' || t.kind === 'noun' ? 3 : t.kind === 'adj' ? 2 : 3);
  let r2 = Math.random() * cands.reduce((s, i) => s + wt(toks[i]), 0), wi = cands[0];
  for (const i of cands) { r2 -= wt(toks[i]); if (r2 < 0) { wi = i; break; } }
  const t = toks[wi];
  const wrong = t.alt[t.kind === 'adj' && chance(0.3) ? Math.floor(Math.random() * t.alt.length) : 0];
  const right = show(t);
  const words = toks.map((u, i) => (i === wi ? show(u, wrong) : show(u)));
  const fixed = toks.map((u) => show(u)).join(' ');
  return { cat: 'fr:relire', q: 'Une faute s’est cachée dans cette phrase. Touche le mot mal écrit !', words, a: String(wi), u: '',
    ex: `Il fallait écrire « ${right.replace(/[.,!? ]+$/, '')} ». ${t.why} Phrase juste : ${fixed}`,
    hint: d <= 0 ? 'Regarde le petit mot devant le nom : les, des, trois → plusieurs.' : FR_HINTS['fr:relire'] };
}

export const FR = { 'fr:gn': accordGN, 'fr:sv': sujetVerbe, 'fr:eer': eer, 'fr:homo': homophones, 'fr:relire': relire, ...FR2 };
