// La Vallée des Graines — more French for 7H-8H (PER L1 26 and L1 28): conjugaison, nature des mots,
// fonctions dans la phrase, orthographe des mots, vocabulaire. Off until the parents switch them on.
// Same problem format as fr.js: multiple choice { q, a, choices } (@ is the gap), or tap { q, words, a, ok }
// where ok lists every right index (« Touche un nom » can have several answers).

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const uniq = (a) => [...new Set(a)];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const chance = (p) => Math.random() < p;
const elide = (w) => /^[aeiouyéèêâîôûh]/i.test(w);
const deQ = (w) => (elide(w) ? `d’« ${w} »` : `de « ${w} »`), queQ = (w) => (elide(w) ? `qu’« ${w} »` : `que « ${w} »`);
const lvOf = (d) => Math.max(-1, Math.min(5, d));
/** A multiple-choice problem with the right answer and up to n − 1 wrong ones. */
function mc(cat, q, right, wrongs, ex, hint, n = 4) {
  const w = uniq(wrongs.filter((x) => x != null && x !== right)).slice(0, n - 1);
  return { cat, q, a: right, choices: shuffle([right, ...w]), u: '', ex, hint };
}

export const FR2_CATS = {
  'fr:conj': 'Conjugaison', 'fr:nature': 'Nature des mots', 'fr:fonc': 'Fonctions dans la phrase',
  'fr:ortho': 'Orthographe des mots', 'fr:voc': 'Vocabulaire',
};
export const FR2_HINTS = {
  'fr:conj': 'Qui fait l’action (je, tu, il, nous, vous, ils) ? Et quand (hier, aujourd’hui, demain) ? Les deux choisissent la terminaison.',
  'fr:nature': 'Nom : on peut mettre « le » devant. Verbe : il change avec hier / demain. Adjectif : on peut dire « très » devant.',
  'fr:fonc': 'Sujet : « Qui est-ce qui… ? ». Complément de phrase : on peut le déplacer ou l’effacer. Complément du verbe : il reste collé au verbe.',
  'fr:ortho': 'Dis le mot à voix basse, et pense à la règle : m devant m, b, p ; un s entre deux voyelles fait [z]…',
  'fr:voc': 'Lis chaque réponse dans la phrase : laquelle garde le sens ?',
};
export const FR2_LESSONS = {
  'fr:conj': { title: 'La conjugaison', lines: [
    'Le verbe change selon la personne (je, tu, il, nous, vous, ils) et selon le moment (hier, aujourd’hui, demain).',
    'Présent des verbes en -er : -e, -es, -e, -ons, -ez, -ent. Verbes comme finir : -is, -is, -it, -issons, -issez, -issent.',
    'Imparfait (autrefois) : -ais, -ais, -ait, -ions, -iez, -aient.',
    'Futur (demain) : l’infinitif + -ai, -as, -a, -ons, -ez, -ont. Quelques radicaux spéciaux : ir- (aller), ser- (être), aur- (avoir), fer- (faire).',
    'Passé composé (hier) : avoir ou être au présent + le participe passé. Avec être, le participe s’accorde : elles sont parties.',
    'Conditionnel : le radical du futur + les terminaisons de l’imparfait. Je mangerai (demain, c’est sûr) / je mangerais (si…).'],
    ex: ['Demain, nous mangerons → futur, nous → -ons', 'Autrefois, ils jouaient → imparfait, ils → -aient', 'Hier, elle est partie → passé composé avec être → -e'] },
  'fr:nature': { title: 'La nature des mots', lines: [
    'Le nom : on peut mettre le, la, un devant (un renard, Léa).',
    'Le déterminant : le petit mot devant le nom (le, la, les, un, des, ce, mon, deux…).',
    'L’adjectif : il dit comment est le nom. On peut dire « très » devant (très petit).',
    'Le verbe : il change si on dit hier ou demain (il dort → il dormait).',
    'Le pronom : il remplace un nom (il, elle, ils, elles, le, la, les quand ils sont collés au verbe).',
    'L’adverbe (vite, souvent, très…) et la préposition (dans, sous, sur, avec…) ne changent jamais.',
    'La conjonction relie deux phrases : mais, ou, et, donc, or, ni, car.'],
    ex: ['Le petit renard court vite. → le : déterminant, petit : adjectif, renard : nom, court : verbe, vite : adverbe', 'Tim cherche le ballon et le trouve. → le ballon : déterminant ; le trouve : pronom (= le ballon)'] },
  'fr:fonc': { title: 'Les fonctions dans la phrase', lines: [
    'Le sujet : pose la question « Qui est-ce qui… ? » devant le verbe. Il peut être long : les lapins du fermier.',
    'Le verbe conjugué : il change avec hier / demain.',
    'Le complément du verbe : il complète le verbe et reste collé à lui. On ne peut ni le déplacer ni l’effacer.',
    'Le complément de phrase : il dit où, quand, comment. On peut le déplacer et l’effacer (Ce matin, …).',
    'L’attribut du sujet : il vient après être, sembler, paraître, devenir, rester, et dit comment est le sujet.',
    'Types de phrases : déclarative (.), interrogative (?), exclamative (!), impérative (un ordre, sans sujet).'],
    ex: ['Ce matin, les lapins du fermier mangent des carottes.', '→ sujet : les lapins du fermier · verbe : mangent · complément du verbe : des carottes · complément de phrase : ce matin'] },
  'fr:ortho': { title: 'L’orthographe des mots', lines: [
    'Devant m, b, p, on écrit m au lieu de n : une lampe, une jambe, le temps (sauf bonbon).',
    'Entre deux voyelles, un seul s fait [z] (une rose). Pour entendre [s], on double : ss (un poisson).',
    'Devant a, o, u, le c a besoin d’une cédille pour faire [s] : un garçon. Devant e, i : pas besoin (une cerise).',
    'Pour [j] devant a ou o, on ajoute un e : un pigeon. Pour [g] devant e ou i, on ajoute un u : une guêpe.',
    'Masculin : -ail, -eil, -euil (le soleil). Féminin : -aille, -eille, -euille (une abeille).',
    'Une lettre muette à la fin ? Cherche un mot de la même famille : chat → chaton, donc un chat.'],
    ex: ['une la_pe → devant p → m : une lampe', 'un gar_on → devant o, pour [s] → ç : un garçon'] },
  'fr:voc': { title: 'Le vocabulaire', lines: [
    'Synonymes : des mots qui veulent dire presque la même chose (content, joyeux).',
    'Contraires : des mots de sens opposé (monter, descendre). Un préfixe peut faire un contraire : possible → impossible.',
    'Famille de mots : des mots construits sur le même radical (terre, terrier, enterrer).',
    'Préfixe au début (re-faire = faire encore), suffixe à la fin (chat-on = petit chat).',
    'Dans le dictionnaire, les mots sont rangés dans l’ordre alphabétique : si la 1re lettre est la même, regarde la 2e, puis la 3e…'],
    ex: ['ca-rotte vient avant ca-stor : r vient avant s', 'possible → impossible (im- devant p)'] },
};

// =============================== Conjugaison ===============================
const PRO = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];
const vowel = (s) => /^[aeiouyéèêâîôûh]/i.test(s);
const IMP_E = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'], FUT_E = ['ai', 'as', 'a', 'ons', 'ez', 'ont'], SUBJ_E = ['e', 'es', 'e', 'ions', 'iez', 'ent'];
const VB = {};
const g1 = (inf, c, o = {}) => { VB[inf] = { inf, g: 1, c, ...o }; };
const g2 = (inf, c, o = {}) => { VB[inf] = { inf, g: 2, c, ...o }; };
const g3 = (inf, pres, fs, pp, ps, c, o = {}) => { VB[inf] = { inf, g: 3, pres: pres.split(' '), fs, pp, ps, c, ...o }; };
g1('chanter', ['une chanson', 'avec Léa']); g1('jouer', ['au ballon', 'aux cartes']); g1('regarder', ['les étoiles', 'le lac'], { noImper: 1 });
g1('manger', ['une pomme', 'des fraises']); g1('ranger', ['les outils', 'la grange']); g1('nager', ['dans le lac']);
g1('commencer', ['le travail', 'un dessin']); g1('lancer', ['le ballon']); g1('écouter', ['la pluie', 'une histoire']);
g1('aimer', ['les crêpes', 'la neige'], { noImper: 1, noFa: 1 }); g1('dessiner', ['un renard', 'une carte']); g1('préparer', ['le goûter']);
g1('trouver', ['un trésor', 'une plume'], { noImper: 1 }); g1('arroser', ['les fleurs']); g1('ramasser', ['des champignons', 'des pommes']);
g1('arriver', ['au village', 'à la ferme'], { etre: 1, noImper: 1 }); g1('tomber', ['dans la boue', 'du vélo'], { etre: 1, noImper: 1 });
g1('rester', ['à la maison', 'près du feu'], { etre: 1 }); g1('rentrer', ['à la maison'], { etre: 1 });
g2('finir', ['le puzzle', 'les devoirs']); g2('choisir', ['une graine', 'un livre']); g2('grandir', ['vite'], { noFa: 1 });
g2('remplir', ['le seau', 'l’arrosoir']); g2('nourrir', ['les poules', 'les lapins']); g2('réussir', ['l’exercice', 'le gâteau']); g2('bâtir', ['une cabane']);
g3('être', 'suis es est sommes êtes sont', 'ser', 'été', ['fut', 'furent'], ['au jardin', 'à la ferme', 'à l’heure'],
  { noImper: 1, noFa: 1, imp: 'ét', subj: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'] });
g3('avoir', 'ai as a avons avez ont', 'aur', 'eu', ['eut', 'eurent'], ['faim', 'un chien', 'de la chance'],
  { noImper: 1, noFa: 1, subj: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'] });
g3('aller', 'vais vas va allons allez vont', 'ir', 'allé', ['alla', 'allèrent'], ['au lac', 'au marché', 'à la ferme'], { etre: 1, imper: ['va', 'allons', 'allez'], subjSt: 'aill' });
g3('faire', 'fais fais fait faisons faites font', 'fer', 'fait', ['fit', 'firent'], ['un gâteau', 'du vélo', 'une cabane'], { subjAll: 'fass' });
g3('dire', 'dis dis dit disons dites disent', 'dir', 'dit', ['dit', 'dirent'], ['bonjour', 'merci', 'la vérité']);
g3('venir', 'viens viens vient venons venez viennent', 'viendr', 'venu', ['vint', 'vinrent'], ['à la fête', 'au marché'], { etre: 1 });
g3('prendre', 'prends prends prend prenons prenez prennent', 'prendr', 'pris', ['prit', 'prirent'], ['le bus', 'une pomme', 'le chemin du lac']);
g3('pouvoir', 'peux peux peut pouvons pouvez peuvent', 'pourr', 'pu', ['put', 'purent'], ['jouer dehors', 'nager'], { noImper: 1, noFa: 1, subjAll: 'puiss' });
g3('vouloir', 'veux veux veut voulons voulez veulent', 'voudr', 'voulu', ['voulut', 'voulurent'], ['une glace', 'un chiot'], { noImper: 1, noFa: 1, noSubj: 1 });
g3('voir', 'vois vois voit voyons voyez voient', 'verr', 'vu', ['vit', 'virent'], ['un renard', 'la mer'], { noImper: 1 });
g3('partir', 'pars pars part partons partez partent', 'partir', 'parti', ['partit', 'partirent'], ['en vacances', 'à la montagne'], { etre: 1 });
g3('mettre', 'mets mets met mettons mettez mettent', 'mettr', 'mis', ['mit', 'mirent'], ['la table', 'un pull']);
g3('lire', 'lis lis lit lisons lisez lisent', 'lir', 'lu', ['lut', 'lurent'], ['un livre', 'une histoire']);
g3('écrire', 'écris écris écrit écrivons écrivez écrivent', 'écrir', 'écrit', ['écrivit', 'écrivirent'], ['une lettre', 'un poème']);
const VERBS = Object.values(VB);

/** The six forms of a verb in a tense (null where the tense has no such person). g: gender of il / ils (agreement with être). */
function conjugate(V, t, g = 'm') {
  const st = V.inf.slice(0, -2), soft = st.endsWith('g') ? st + 'e' : st.endsWith('c') ? st.slice(0, -1) + 'ç' : st;
  const pres = V.g === 1 ? [st + 'e', st + 'es', st + 'e', soft + 'ons', st + 'ez', st + 'ent'] : V.g === 2 ? ['is', 'is', 'it', 'issons', 'issez', 'issent'].map((e) => st + e) : V.pres;
  if (t === 'pres') return pres;
  if (t === 'imp') { const ns = V.imp || pres[3].slice(0, -3), hard = V.imp || (V.g === 1 ? st : ns); return IMP_E.map((e) => (e[0] === 'a' ? ns : hard) + e); }
  const fs = V.fs || V.inf;
  if (t === 'fut') return FUT_E.map((e) => fs + e);
  if (t === 'cond') return IMP_E.map((e) => fs + e);
  if (t === 'ps') { const ps = V.ps || (V.g === 1 ? [soft + 'a', st + 'èrent'] : [st + 'it', st + 'irent']); return [null, null, ps[0], null, null, ps[1]]; }
  if (t === 'imper') { if (V.noImper) return null; const im = V.imper || (V.g === 1 ? [st + 'e', pres[3], pres[4]] : [pres[1], pres[3], pres[4]]); return [null, im[0], null, im[1], im[2], null]; }
  if (t === 'subj') {
    if (V.noSubj) return null;
    if (V.subj) return V.subj;
    if (V.subjAll) return SUBJ_E.map((e) => V.subjAll + e);
    const imp = conjugate(V, 'imp'), s = V.subjSt || pres[5].slice(0, -3);
    return [s + 'e', s + 'es', s + 'e', imp[3], imp[4], s + 'ent'];
  }
  const auxT = { pc: 'pres', pqp: 'imp', fa: 'fut' }[t];
  const aux = conjugate(V.etre ? VB['être'] : VB.avoir, auxT);
  const pp = V.pp || (V.g === 1 ? st + 'é' : st + 'i');
  return aux.map((a, i) => a + ' ' + pp + (V.etre ? ((i === 2 || i === 5) && g === 'f' ? 'e' : '') + (i >= 3 ? 's' : '') : ''));
}
const TN = { pres: 'présent', imp: 'imparfait', fut: 'futur', cond: 'conditionnel présent', pc: 'passé composé', imper: 'impératif présent', pqp: 'plus-que-parfait', fa: 'futur antérieur', ps: 'passé simple', subj: 'subjonctif présent' };
const AU = (t) => (t === 'imp' || t === 'imper' ? 'à l’' : 'au ') + TN[t];
const RULE = {
  pres: (V) => (V.g === 1 ? 'Verbes en -er au présent : -e, -es, -e, -ons, -ez, -ent.' : V.g === 2 ? 'Verbes comme finir (2e groupe) : -is, -is, -it, -issons, -issez, -issent.' : `« ${V.inf} » est un verbe irrégulier : il faut connaître ses formes.`),
  imp: () => 'Imparfait : -ais, -ais, -ait, -ions, -iez, -aient.',
  fut: (V) => `Futur : ${V.fs ? `le radical « ${V.fs} »` : 'l’infinitif'} + -ai, -as, -a, -ons, -ez, -ont.`,
  cond: (V) => `Conditionnel : ${V.fs ? `le radical « ${V.fs} »` : 'l’infinitif'} (comme au futur) + -ais, -ais, -ait, -ions, -iez, -aient.`,
  pc: (V) => `Passé composé : ${V.etre ? 'être' : 'avoir'} au présent + le participe passé « ${V.pp || conjugate(V, 'pc')[0].split(' ')[1]} »${V.etre ? ' ; avec être, il s’accorde avec le sujet' : ''}.`,
  pqp: (V) => `Plus-que-parfait : ${V.etre ? 'être' : 'avoir'} à l’imparfait + le participe passé.`,
  fa: (V) => `Futur antérieur : ${V.etre ? 'être' : 'avoir'} au futur + le participe passé. L’action sera finie avant l’autre.`,
  ps: (V) => (V.g === 1 ? 'Passé simple des verbes en -er : il -a, ils -èrent.' : 'Passé simple : il …, ils …-rent.'),
  imper: () => 'Impératif : un ordre, sans sujet. Pour les verbes en -er, pas de s avec tu : mange !',
  subj: () => 'Subjonctif (après « il faut que ») : -e, -es, -e, -ions, -iez, -ent.',
};
const subjWord = (i, g) => (i === 2 ? (g === 'f' ? 'elle' : 'il') : i === 5 ? (g === 'f' ? 'elles' : 'ils') : PRO[i]);
const withSubj = (i, g, f, que) => {
  let s = subjWord(i, g);
  if (i === 0 && vowel(f)) return (que ? 'que ' : '') + 'j’' + f;
  if (que) s = vowel(s) ? 'qu’' + s : 'que ' + s;
  return s + ' ' + f;
};
function conjLine(V, t, g) {
  const f = conjugate(V, t, g);
  if (t === 'imper') return `${f[1]}, ${f[3]}, ${f[4]}`;
  return f.map((x, i) => (x == null ? null : withSubj(i, g, x, t === 'subj'))).filter(Boolean).join(', ');
}
const CONF = [[1, 2, 5], [0, 2, 4], [5, 0, 1], [4, 5, 2], [3, 5, 1], [2, 3, 4]];
const NEIGH = { pres: ['imp', 'fut'], imp: ['cond', 'pres'], fut: ['cond', 'pres'], cond: ['fut', 'imp'], pc: ['pqp', 'pres'], pqp: ['pc', 'imp'], fa: ['fut', 'pc'], ps: ['imp', 'pres'], subj: ['pres', 'imp'], imper: ['pres'] };
const TENSES_AT = { '-1': ['pres'], 0: ['pres'], 1: ['imp', 'imp', 'pres'], 2: ['fut', 'fut', 'imp'], 3: ['pc', 'pc', 'cond', 'fut'],
  4: ['pres', 'imp', 'fut', 'pc', 'cond', 'imper'], 5: ['pqp', 'fa', 'ps', 'subj', 'pqp', 'fa', 'ps', 'subj', 'imp', 'fut', 'pc', 'cond'] };
const MARK = { pres: ['Aujourd’hui,', 'En ce moment,', ''], imp: ['Autrefois,', 'Il y a longtemps,'], fut: ['Demain,', 'Bientôt,', 'L’été prochain,'],
  pc: ['Hier,', 'Ce matin,', 'La semaine dernière,'], cond: ['Si c’était possible,', 'Si tout allait bien,'], pqp: ['Avant la pluie,', 'La veille,'], ps: ['Ce jour-là,', 'Soudain,', 'Le lendemain,'] };

function conjTense(lv) {
  for (let tries = 0; tries < 40; tries++) {
    const t = pick(TENSES_AT[lv]);
    const pool = VERBS.filter((V) => (lv > -1 || V.g === 1 || V.inf === 'être' || V.inf === 'avoir') && !(t === 'fa' && V.noFa) && conjugate(V, t));
    const V = pick(pool), g = chance(0.4) ? 'f' : 'm';
    const all = conjugate(V, t, g);
    const persons = all.map((x, i) => (x == null ? -1 : i)).filter((i) => i >= 0);
    const i = pick(persons), right = all[i];
    if (i === 0 && vowel(right) && t !== 'imper') continue; // « j’ » would give the answer away
    const C = pick(V.c);
    let s;
    if (t === 'imper') s = i === 1 ? `${pick(['Thibault', 'Tim', 'Léa'])}, @ ${C} !` : i === 3 ? `Allez, @ ${C} !` : `Les enfants, @ ${C} !`;
    else if (t === 'subj') s = `Il faut ${i === 0 ? 'que je' : withSubj(i, g, '', true).trim()} @ ${C}.`;
    else if (t === 'fa') s = `Quand ${subjWord(i, g)} @ ${C}, ${subjWord(i, g)} ${conjugate(VB.pouvoir, 'fut')[i]} goûter.`;
    else { const m = pick(MARK[t]); s = `${m ? m + ' ' : ''}${subjWord(i, g)} @ ${C}.`; }
    s = cap(s);
    const named = lv <= 3 || chance(0.5);
    const q = named ? `Conjugue « ${V.inf} » ${AU(t)} : ${s}` : `${s} (${V.inf})`;
    // wrong answers: the slip he makes, another person, the same person in a neighbouring tense
    const slips = [];
    if (t === 'imper' && V.g === 1 && i === 1) slips.push(right + 's');
    if (t === 'pc' && V.g === 1 && !V.etre) slips.push(right.replace(/é$/, 'er'));
    if (V.etre && ['pc', 'pqp', 'fa'].includes(t) && i >= 2) {
      // agreement slips, only where the subject tells the gender (je / tu can be a girl or a boy, vous a lady)
      const bare = conjugate(V, t, 'm')[i].replace(/s$/, '');
      slips.push(...(i === 3 ? [bare, bare + 'e'] : i === 4 ? [bare] : [bare, bare + 'e', bare + 's']));
    }
    if (/gea|geo|ça|ço/.test(right)) slips.push(right.replace('gea', 'ga').replace('geo', 'go').replace('ça', 'ca').replace('ço', 'co'));
    if (t === 'fut' && i === 0) slips.push(right + 's');
    if (t === 'cond' && i === 0) slips.push(right.replace(/s$/, ''));
    if (t === 'pres' && /d$/.test(right)) slips.push(right.replace(/d$/, 't'));
    const others = (t === 'imper' ? [1, 3, 4].filter((j) => j !== i) : CONF[i]).map((j) => all[j]).filter(Boolean);
    const otherT = NEIGH[t].map((t2) => (conjugate(V, t2, g) || [])[i]).filter(Boolean);
    const wrongs = uniq([...slips, ...(lv <= 1 ? others : [others[0], ...otherT, ...others.slice(1)])]).filter((w) => w !== right);
    if (wrongs.length < 2) continue;
    return mc('fr:conj', q, right, wrongs.slice(0, 3),
      `${cap(TN[t])} ${deQ(V.inf)} : ${conjLine(V, t, g)}. ${RULE[t](V)}`,
      t === 'imper' ? 'L’impératif donne un ordre, sans sujet : à qui parle-t-on ? (tu, nous ou vous)' : `Qui fait l’action ? « ${subjWord(i, g)} ». Quand ? ${named ? TN[t] : 'Regarde le petit mot du début.'}`);
  }
  return conjTense(0);
}
const ENDS = ['oir', 'er', 'ir', 're'];
function infQ() {
  const V = pick(VERBS), t = pick(['pres', 'pres', 'imp']), all = conjugate(V, t), i = pick([2, 3, 5, 1]);
  const shown = withSubj(i, 'm', all[i]);
  const end = ENDS.find((e) => V.inf.endsWith(e)) || 'er';
  const root = V.inf.slice(0, -end.length);
  const fstem = all[i].replace(/(aient|ions|iez|ais|ait|ons|ont|ent|ez|es|as|ai|a|e|s|t|x)$/, '');
  const wrongs = shuffle([...ENDS.filter((e) => e !== end).map((e) => root + e), fstem + 'er', fstem + 'ir']).filter((w) => w !== V.inf && !VB[w]);
  return mc('fr:conj', `Quel est l’infinitif du verbe dans « ${shown} » ?`, V.inf, wrongs,
    `« ${shown} » vient du verbe « ${V.inf} ». L’infinitif, c’est le nom du verbe, celui qu’on trouve dans le dictionnaire : il finit par -er, -ir, -re ou -oir.`,
    'Essaie de dire « il faut … » ou « il va … » avec ce verbe.');
}
function groupQ() {
  const V = pick(VERBS.filter((v) => v.g !== 3 || ['aller', 'partir', 'venir', 'prendre', 'faire', 'dire', 'voir'].includes(v.inf)));
  const names = ['1er groupe', '2e groupe', '3e groupe'];
  const why = V.g === 1 ? 'Il finit par -er (et ce n’est pas « aller »).' : V.g === 2 ? `Il finit par -ir et fait « nous ${conjugate(V, 'pres')[3]} » : -issons.` : V.inf === 'aller' ? '« Aller » finit par -er, mais c’est l’exception : il est du 3e groupe.' : V.inf.endsWith('ir') ? `Il finit par -ir, mais fait « nous ${conjugate(V, 'pres')[3]} » (pas -issons).` : 'Il ne finit pas par -er, et ce n’est pas un verbe comme finir.';
  return { cat: 'fr:conj', q: `« ${V.inf} » est un verbe du…`, a: names[V.g - 1], choices: names, u: '', ex: `« ${V.inf} » : ${names[V.g - 1]}. ${why}`,
    hint: '1er groupe : -er (sauf aller). 2e groupe : -ir avec « nous …issons ». 3e groupe : tous les autres.' };
}
function tenseQ(lv) {
  const set = lv >= 5 ? ['pres', 'imp', 'fut', 'pc', 'cond', 'pqp', 'fa', 'ps', 'subj'] : lv >= 4 ? ['pres', 'imp', 'fut', 'pc', 'cond', 'imper'] : ['pres', 'imp', 'fut', 'pc', 'cond'];
  for (let tries = 0; tries < 40; tries++) {
    const t = pick(set.slice(lv >= 5 ? 5 : 0).concat(set)), V = pick(VERBS.filter((v) => conjugate(v, t))), all = conjugate(V, t);
    const i = pick(all.map((x, j) => (x == null ? -1 : j)).filter((j) => j >= 0));
    const show = (t2) => { const f = (conjugate(V, t2) || [])[i]; return f ? (t2 === 'imper' ? f + ' !' : withSubj(i, 'm', f, t2 === 'subj')) : null; };
    const shown = show(t);
    if (set.some((t2) => t2 !== t && show(t2) === shown)) continue; // the same form in two tenses (il finit)
    const wrongs = shuffle(set.filter((t2) => t2 !== t)).map((t2) => TN[t2]);
    return mc('fr:conj', `« ${shown} » : à quel temps est ce verbe ?`, TN[t], wrongs, `« ${shown} » est ${AU(t)}. ${RULE[t](V)}`,
      'Regarde la terminaison, et s’il y a un petit verbe (avoir, être) devant.');
  }
  return conjTense(3);
}
function conj(d) {
  const lv = lvOf(d), r = Math.random();
  if (lv >= 0 && lv <= 2 && r < 0.15) return infQ();
  if (lv >= 0 && lv <= 2 && r < 0.27) return groupQ();
  if (lv >= 3 && r < 0.22) return tenseQ(lv);
  return conjTense(lv);
}

// =============================== Nature des mots ===============================
const NAT = { N: 'nom', V: 'verbe', D: 'déterminant', A: 'adjectif', Pro: 'pronom', R: 'adverbe', P: 'préposition', C: 'conjonction' };
const LE = { N: 'le nom', V: 'le verbe', D: 'le déterminant', A: 'l’adjectif', Pro: 'le pronom', R: 'l’adverbe', P: 'la préposition', C: 'la conjonction' };
const UN = { N: 'un nom', V: 'un verbe', D: 'un déterminant', A: 'un adjectif', Pro: 'un pronom', R: 'un adverbe', P: 'une préposition', C: 'une conjonction' };
const NAT_WHY = {
  N: 'On peut mettre « le » ou « un » devant.', V: 'Il change si on dit hier ou demain.',
  D: 'C’est le petit mot devant le nom.', A: 'Il dit comment est le nom ; on peut dire « très » devant.',
  Pro: 'Il remplace un nom.', R: 'Il ne change jamais et précise le verbe (comment ? quand ?).',
  P: 'C’est un petit mot invariable devant un groupe (dans, sous, sur, avec…).', C: 'Il relie deux parties de la phrase (mais, ou, et, donc, or, ni, car).',
};
const NAT_AT = { '-1': ['V', 'N'], 0: ['V', 'N', 'D'], 1: ['V', 'N', 'D', 'A'], 2: ['V', 'N', 'D', 'A', 'Pro'], 3: ['V', 'N', 'D', 'A', 'Pro', 'R', 'P'], 4: ['V', 'N', 'D', 'A', 'Pro', 'R', 'P', 'C'], 5: ['V', 'N', 'D', 'A', 'Pro', 'R', 'P', 'C'] };
const NEW_AT = { '-1': ['V', 'N'], 0: ['D'], 1: ['A'], 2: ['Pro'], 3: ['R', 'P'], 4: ['C'], 5: ['Pro', 'C', 'R'] };
// animals: [singular, plural, gender, can run and jump]
const NN = [['renard', 'renards', 'm', 1], ['lapin', 'lapins', 'm', 1], ['chat', 'chats', 'm', 1], ['chien', 'chiens', 'm', 1], ['cheval', 'chevaux', 'm', 1], ['hibou', 'hiboux', 'm', 0],
  ['poule', 'poules', 'f', 0], ['vache', 'vaches', 'f', 0], ['chèvre', 'chèvres', 'f', 1], ['tortue', 'tortues', 'f', 0], ['grenouille', 'grenouilles', 'f', 1]];
const NADJ = { petit: ['petit', 'petite', 'petits', 'petites', 1], gros: ['gros', 'grosse', 'gros', 'grosses', 1], joli: ['joli', 'jolie', 'jolis', 'jolies', 1],
  gris: ['gris', 'grise', 'gris', 'grises'], noir: ['noir', 'noire', 'noirs', 'noires'], blanc: ['blanc', 'blanche', 'blancs', 'blanches'], curieux: ['curieux', 'curieuse', 'curieux', 'curieuses'], gourmand: ['gourmand', 'gourmande', 'gourmands', 'gourmandes'] };
const nadj = (a, g, n) => NADJ[a][(g === 'f' ? 1 : 0) + (n ? 2 : 0)];
// verbs: [il, ils, needs a running animal, its objects (always there for regarder / chercher)]
const EAT = ['une/D pomme/N', 'des/D graines/N', 'une/D noisette/N', 'une/D grosse/A pomme/N', 'des/D fraises/N', 'une/D carotte/N'];
const NV = [['dort', 'dorment'], ['mange', 'mangent', 0, EAT], ['joue', 'jouent'], ['regarde', 'regardent', 0, ['la/D lune/N', 'les/D nuages/N', 'les/D étoiles/N', 'la/D pluie/N', 'les/D gros/A nuages/N'], 1],
  ['cherche', 'cherchent', 0, ['une/D noisette/N', 'des/D graines/N', 'un/D abri/N', 'une/D grosse/A pomme/N', 'un/D coin/N tranquille/A'], 1], ['court', 'courent', 1], ['saute', 'sautent', 1]];
const NADV = ['vite', 'souvent', 'lentement', 'toujours', 'beaucoup', 'tranquillement', 'encore'];
const NPP = ['dans/P le/D pré/N', 'sous/P le/D vieux/A chêne/N', 'sur/P le/D rocher/N', 'derrière/P la/D grange/N', 'devant/P la/D ferme/N', 'dans/P la/D forêt/N', 'sur/P la/D colline/N', 'vers/P la/D rivière/N'];
// a second clause: conjunction, verb (il, ils), the rest
const NCL = [['mais', 'tombe', 'tombent'], ['et', 'dort', 'dorment', 'ensuite/R'], ['car', 'a', 'ont', 'faim/N'], ['mais', 'rate', 'ratent', 'son/D coup/N', 'leur/D coup/N'], ['et', 'rentre', 'rentrent', 'vite/R'], ['puis', '']];
// 8H traps: the same word, two natures (le ballon / le trouve)
const NHAND = ['Tim/N cherche/V le/D ballon/N et/C le/Pro trouve/V vite/R .', 'Léa/N cueille/V une/D rose/N et/C la/Pro sent/V .', 'Les/D poules/N voient/V les/D graines/N et/C les/Pro avalent/V .',
  'Le/D fermier/N est/V très/R content/A .', 'Le/D chat/N noir/A dort/V bien/R .', 'Mamie/N Rose/N prépare/V une/D tarte/N mais/C Tim/N la/Pro mange/V !', 'Le/D vent/N souffle/V fort/R sur/P la/D colline/N .',
  'Ce/D petit/A lapin/N mange/V lentement/R une/D carotte/N .', 'Thibault/N ramasse/V des/D pommes/N et/C les/Pro range/V .', 'Elle/Pro arrose/V ses/D fleurs/N car/C il/Pro fait/V chaud/A .'];
const tagged = (s) => s.split(' ').filter(Boolean).map((x) => { const k = x.lastIndexOf('/'); return k < 0 ? { w: x, t: '' } : { w: x.slice(0, k), t: x.slice(k + 1) }; });
function natSentence(lv) {
  if (lv >= 5 && chance(0.45)) return tagged(pick(NHAND));
  const [s, p, g, runs] = pick(NN), n = chance(0.5) ? 1 : 0;
  const verbs = NV.filter((v) => !v[2] || runs);
  const V = pick(verbs);
  const toks = [];
  const usePro = lv >= 2 && chance(0.3);
  if (usePro) toks.push({ w: n ? (g === 'f' ? 'elles' : 'ils') : (g === 'f' ? 'elle' : 'il'), t: 'Pro' });
  else {
    const pre = lv >= 1 && chance(0.35);
    let d = n ? pick(['les', 'des', 'ces', 'mes', 'deux']) : g === 'f' ? pick(['la', 'une', 'cette', 'ma']) : pick(['le', 'un', 'ce', 'mon']);
    if (pre && d === 'des') d = 'les'; // « de jolies poules » in writing: keep it simple
    toks.push({ w: d, t: 'D' });
    if (pre) toks.push({ w: nadj(pick(['petit', 'gros', 'joli']), g, n), t: 'A' });
    toks.push({ w: n ? p : s, t: 'N' });
    if (lv >= 1 && chance(0.45)) toks.push({ w: nadj(pick(['gris', 'noir', 'blanc', 'curieux', 'gourmand']), g, n), t: 'A' });
  }
  toks.push({ w: n ? V[1] : V[0], t: 'V' });
  if (lv >= 3 && chance(0.5)) toks.push({ w: pick(NADV.filter((a) => V[0] !== 'dort' || !['vite', 'lentement'].includes(a))), t: 'R' });
  if (V[3] && (V[4] || (lv >= 0 && chance(0.6)))) toks.push(...tagged(pick(V[3].filter((o) => lv >= 1 || !o.includes('/A')))));
  if (lv >= 3 && chance(0.5)) toks.push(...tagged(pick(NPP)));
  if (lv >= 4 && chance(0.6)) {
    const c = pick(NCL.filter((x) => x[1]));
    toks.push({ w: c[0], t: 'C' }, { w: n ? (g === 'f' ? 'elles' : 'ils') : (g === 'f' ? 'elle' : 'il'), t: 'Pro' }, { w: n ? c[2] : c[1], t: 'V' });
    const rest = n && c[4] ? c[4] : c[3];
    if (rest) toks.push(...tagged(rest));
  }
  toks.push({ w: '.', t: '' });
  return toks;
}
/** Words to tap: punctuation sticks to the word before it. */
function natWords(toks) {
  const out = [];
  toks.forEach((t) => { if (!t.t && out.length) out[out.length - 1].w += (t.w === '.' ? '' : ' ') + t.w; else out.push({ ...t }); });
  out[0].w = cap(out[0].w);
  return out;
}
function nature(d) {
  const lv = lvOf(d);
  for (let tries = 0; tries < 30; tries++) {
    const words = natWords(natSentence(lv));
    const present = NAT_AT[lv].filter((c) => words.some((w) => w.t === c));
    if (!present.length) continue;
    const fresh = present.filter((c) => NEW_AT[lv].includes(c));
    const c = fresh.length && chance(0.6) ? pick(fresh) : pick(present);
    const ok = words.map((w, i) => (w.t === c ? String(i) : null)).filter((x) => x != null);
    const bare = (w) => w.w.replace(/[ .!?]+$/, '');
    const sentence = words.map((w) => w.w).join(' ');
    if (lv >= 5 && chance(0.4)) {
      // which nature is this word? (only words that appear once)
      const cands = words.filter((w) => NAT_AT[lv].includes(w.t) && words.filter((u) => bare(u).toLowerCase() === bare(w).toLowerCase()).length === 1);
      if (cands.length) {
        const w = pick(cands);
        const near = { D: ['Pro', 'A'], Pro: ['D', 'N'], A: ['R', 'V'], R: ['A', 'P'], P: ['C', 'R'], C: ['P', 'R'], N: ['V', 'A'], V: ['N', 'A'] }[w.t];
        const wq = w.t === 'N' && /^[A-Z]/.test(w.w) && w !== words[0] ? bare(w) : /^(Tim|Léa|Thibault|Mamie|Rose)$/.test(bare(w)) ? bare(w) : bare(w).toLowerCase();
        return mc('fr:nature', `Quelle est la nature du mot « ${wq} » dans : ${sentence}`, NAT[w.t], [...near.map((x) => NAT[x]), ...shuffle(Object.values(NAT))],
          `« ${wq} » est ${UN[w.t]}. ${NAT_WHY[w.t]}`, FR2_HINTS['fr:nature']);
      }
    }
    const list = ok.map((i) => `« ${bare(words[i])} »`).join(', ');
    return { cat: 'fr:nature', q: ok.length === 1 ? `Touche ${LE[c]}.` : `Touche ${UN[c]}.`, words: words.map((w) => w.w), a: ok[0], ok, u: '',
      sol: ok.length === 1 ? `C’était ${list}.` : `Les bonnes réponses : ${list}.`,
      ex: `${ok.length === 1 ? `« ${bare(words[ok[0]])} » est ${UN[c]}.` : `Ici, ${list} sont des ${NAT[c] === 'nom' ? 'noms' : NAT[c] + 's'}.`} ${NAT_WHY[c]}`, hint: FR2_HINTS['fr:nature'] };
  }
  return nature(0);
}

// =============================== Fonctions dans la phrase ===============================
// subjects: [text, plural, gender, complement of the noun inside]
const FS = [['le renard', 0, 'm'], ['les renards', 1, 'm'], ['la poule', 0, 'f'], ['les poules', 1, 'f'], ['Léa', 0, 'f'], ['Tim', 0, 'm'], ['mon cousin', 0, 'm'], ['les enfants', 1, 'm'],
  ['Léa et Tim', 1, 'm'], ['le petit écureuil', 0, 'm'], ['ma cousine', 0, 'f'],
  ['le chat de Léa', 0, 'm', 'de Léa'], ['les lapins du fermier', 1, 'm', 'du fermier'], ['la vache de Mamie Rose', 0, 'f', 'de Mamie Rose'], ['les poules de la ferme', 1, 'f', 'de la ferme'], ['les chèvres du voisin', 1, 'f', 'du voisin']];
const FS_PRO = [['il', 0, 'm'], ['elles', 1, 'f'], ['ils', 1, 'm'], ['elle', 0, 'f']];
const FVT = [['regarde', 'regardent', ['les nuages', 'la lune', 'les étoiles']], ['cherche', 'cherchent', ['un abri', 'de la nourriture']], ['mange', 'mangent', ['une pomme', 'des graines']], ['écoute', 'écoutent', ['la pluie', 'le vent']]];
const FVI = [['dort', 'dorment'], ['joue', 'jouent'], ['court', 'courent']];
const CP_START = ['Ce matin,', 'Chaque soir,', 'Après la pluie,', 'Dans le pré,', 'Sous le vieux chêne,', 'Au bord du lac,', 'En automne,'];
const CP_END = ['ce matin', 'chaque soir', 'dans le pré', 'sous le vieux chêne', 'au bord du lac', 'en automne', 'après la pluie'];
const CP_INV = ['Dans le pré', 'Sous le vieux chêne', 'Au bord du lac', 'Derrière la grange'];
const FAT = [['content', 'contente', 'contents', 'contentes'], ['fatigué', 'fatiguée', 'fatigués', 'fatiguées'], ['curieux', 'curieuse', 'curieux', 'curieuses'], ['calme', 'calme', 'calmes', 'calmes'], ['affamé', 'affamée', 'affamés', 'affamées']];
const FAT_V = [['est', 'sont'], ['semble', 'semblent'], ['paraît', 'paraissent'], ['reste', 'restent'], ['devient', 'deviennent']];
const FN = { S: 'sujet', V: 'verbe conjugué', CV: 'complément du verbe', CP: 'complément de phrase', AT: 'attribut du sujet', CN: 'complément du nom' };
const FQ = { V: 'Touche le verbe conjugué.', CV: 'Touche le complément du verbe.', CP: 'Touche le complément de phrase.', AT: 'Touche l’attribut du sujet.' };
/** A sentence in chunks { w, f } and what can be asked about it. */
function foncSentence(lv) {
  const pool = lv <= 0 ? FS.filter((s) => !s[3]) : lv >= 2 && chance(0.2) ? FS_PRO : FS;
  const S = pick(pool), n = S[1], ch = [];
  let verb, sing;
  if (lv >= 3 && chance(0.35)) {
    // the attribute: Les poules semblent fatiguées.
    const v = pick(FAT_V), a = pick(FAT);
    verb = n ? v[1] : v[0]; sing = v[0];
    ch.push({ w: S[0], f: 'S', cn: S[3] }, { w: verb, f: 'V' }, { w: a[(S[2] === 'f' ? 1 : 0) + (n ? 2 : 0)], f: 'AT' });
    if (chance(0.3)) ch.push({ w: pick(CP_END), f: 'CP' });
  } else if (lv >= 3 && chance(0.25) && S[0] !== 'il' && !FS_PRO.includes(S)) {
    // the subject after the verb: Dans le pré jouent les enfants.
    const v = pick(FVI); verb = n ? v[1] : v[0]; sing = v[0];
    ch.push({ w: pick(CP_INV), f: 'CP' }, { w: verb, f: 'V' }, { w: S[0], f: 'S', cn: S[3] });
  } else {
    const v = pick(FVT); verb = n ? v[1] : v[0]; sing = v[0];
    const start = lv >= 0 && chance(lv >= 2 ? 0.45 : 0.35), end = !start && lv >= 1 && chance(0.5);
    const cv = pick(v[2]), noun = cv.split(' ').pop(); // not « Après la pluie, … écoutent la pluie »
    if (start) ch.push({ w: pick(CP_START.filter((c) => !c.includes(noun))), f: 'CP' });
    ch.push({ w: S[0], f: 'S', cn: S[3] }, { w: verb, f: 'V' }, { w: cv, f: 'CV' });
    if (end) ch.push({ w: pick(CP_END.filter((c) => !c.includes(noun))), f: 'CP' });
  }
  ch[0].w = cap(ch[0].w);
  ch[ch.length - 1].w += '.';
  return { ch, verb, sing, S };
}
const TYPES = [['Le renard mange des baies.', 'déclarative'], ['Est-ce que le renard mange des baies ?', 'interrogative'], ['Comme ce renard est rusé !', 'exclamative'], ['Mange tes baies !', 'impérative'],
  ['Où vas-tu ?', 'interrogative'], ['Range tes outils, s’il te plaît.', 'impérative'], ['Quelle belle journée !', 'exclamative'], ['Les poules dorment dans le poulailler.', 'déclarative'],
  ['Viens vite au lac !', 'impérative'], ['Que tu es grand !', 'exclamative'], ['Pourquoi le ciel est-il bleu ?', 'interrogative'], ['Il pleut depuis ce matin.', 'déclarative'],
  ['Ne touche pas au feu.', 'impérative'], ['Quel beau renard !', 'exclamative'], ['As-tu arrosé les tomates ?', 'interrogative'], ['Léa a planté des tulipes hier.', 'déclarative'], ['Fermez la barrière !', 'impérative']];
const TYPE_WHY = { déclarative: 'Elle raconte ou donne une information. Elle finit par un point.', interrogative: 'Elle pose une question. Elle finit par un point d’interrogation.',
  exclamative: 'Elle montre un sentiment fort (joie, surprise…) sans donner d’ordre. Elle finit par un point d’exclamation.', impérative: 'Elle donne un ordre ou un conseil. Le verbe n’a pas de sujet.' };
const FORMES = [['Le renard ne mange pas de baies.', 'négative'], ['Tim n’aime pas les épinards.', 'négative'], ['Léa ne joue jamais dehors le soir.', 'négative'], ['Les poules ne sortent plus.', 'négative'],
  ['Le chat dort sur le toit.', 'affirmative'], ['Les enfants jouent encore dehors.', 'affirmative'], ['Il n’y a rien dans le panier.', 'négative'], ['Mamie Rose prépare toujours une tarte.', 'affirmative']];
const NEGS = [['Tim aime les épinards.', 'Tim n’aime pas les épinards.', ['Tim aime pas les épinards.', 'Tim ne aime pas les épinards.', 'Tim n’aime les épinards pas.']],
  ['Le chat dort.', 'Le chat ne dort pas.', ['Le chat dort pas.', 'Le chat ne pas dort.', 'Le chat pas ne dort.']],
  ['Léa a faim.', 'Léa n’a pas faim.', ['Léa a pas faim.', 'Léa ne a pas faim.', 'Léa n’a faim pas.']],
  ['Les poules sortent.', 'Les poules ne sortent pas.', ['Les poules sortent pas.', 'Les poules ne pas sortent.', 'Les poules pas sortent.']],
  ['Il est content.', 'Il n’est pas content.', ['Il est pas content.', 'Il ne est pas content.', 'Il n’est content pas.']],
  ['Nous allons au lac.', 'Nous n’allons pas au lac.', ['Nous allons pas au lac.', 'Nous ne allons pas au lac.', 'Nous n’allons au lac pas.']]];
function fonc(d) {
  const lv = lvOf(d);
  if (lv >= 4 && chance(0.4)) {
    const r = Math.random();
    if (r < 0.5) { const [s, t] = pick(TYPES); return mc('fr:fonc', `De quel type est cette phrase ? ${s}`, t, ['déclarative', 'interrogative', 'exclamative', 'impérative'], `Phrase ${t}. ${TYPE_WHY[t]}`, 'Raconte ? Question ? Sentiment fort ? Ordre ?'); }
    if (r < 0.75 || lv < 5) { const [s, f] = pick(FORMES); return mc('fr:fonc', `Cette phrase est-elle affirmative ou négative ? ${s}`, f, ['affirmative', 'négative'], f === 'négative' ? 'Elle est négative : il y a « ne … pas », « ne … jamais », « ne … plus » ou « ne … rien ».' : 'Elle est affirmative : il n’y a pas de « ne … pas ».', 'Cherche « ne … pas », « ne … jamais », « ne … plus ».'); }
    const [s, right, wrongs] = pick(NEGS);
    return mc('fr:fonc', `Quelle est la bonne phrase négative ? ${s}`, right, wrongs, `${right} La négation entoure le verbe : ne (ou n’ devant une voyelle) … pas. À l’oral, on oublie souvent le « ne », mais à l’écrit il faut l’écrire.`, 'Ne … pas entoure le verbe.');
  }
  const { ch, verb, sing } = foncSentence(lv);
  const fs = ch.map((c) => c.f);
  const sentence = ch.map((c) => c.w).join(' ');
  if (lv >= 5 && chance(0.5)) {
    // which function is this group?
    const opts = ch.filter((c) => c.f !== 'V').map((c) => ({ w: c.w.replace(/[.,]$/, ''), f: c.f }));
    const cnc = ch.find((c) => c.cn);
    if (cnc) opts.push({ w: cnc.cn, f: 'CN' }, { w: cnc.cn, f: 'CN' });
    const o = pick(opts);
    const quoted = /^(Léa|Tim|Mamie)/.test(o.w) ? o.w : o.w.replace(/^./, (x) => x.toLowerCase());
    return mc('fr:fonc', `Quelle est la fonction ${deQ(o.f === 'S' && /^(Léa|Tim)/.test(o.w) ? o.w : quoted)} dans : ${sentence}`, FN[o.f], ['sujet', 'complément du verbe', 'complément de phrase', 'attribut du sujet', 'complément du nom'].filter((x) => x !== FN[o.f]).sort(() => Math.random() - 0.5),
      foncWhy(o.f, quoted, verb, ch, sing), FR2_HINTS['fr:fonc']);
  }
  const want = lv <= 0 ? ['S', 'S', 'V'] : lv === 1 ? ['S', 'S', 'V', 'CP'] : lv === 2 ? ['CV', 'CP', 'S', 'CV', 'CP'] : ['S', 'AT', 'CV', 'CP', 'AT', 'S'];
  const f = pick(want.filter((x) => fs.includes(x)).concat(fs.includes('S') ? ['S'] : []));
  const i = fs.indexOf(f);
  return { cat: 'fr:fonc', q: f === 'S' ? `Touche le sujet du verbe « ${verb} ».` : FQ[f], words: ch.map((c) => c.w), a: String(i), ok: [String(i)], u: '',
    sol: `C’était « ${ch[i].w.replace(/[.,]$/, '')} ».`, ex: foncWhy(f, ch[i].w.replace(/[.,]$/, ''), verb, ch, sing), hint: FR2_HINTS['fr:fonc'] };
}
function foncWhy(f, w, verb, ch, sing) {
  const S = ch.find((c) => c.f === 'S');
  const s = S ? S.w.replace(/[.,]$/, '') : '';
  if (f === 'S') return `Qui est-ce qui ${sing} ? « ${/^(Léa|Tim)/.test(w) ? w : w.charAt(0).toLowerCase() + w.slice(1)} » : c’est le sujet.${ch[0].f === 'CP' && ch[1].f === 'V' ? ' Ici, il est placé après le verbe !' : ''}`;
  if (f === 'V') return `« ${w} » est le verbe conjugué : il change si on dit hier ou demain. Son sujet est « ${s} ».`;
  if (f === 'CV') return `« ${w} » complète le verbe « ${verb} » : ${s} ${verb} quoi ? ${w}. On ne peut ni le déplacer ni l’effacer : c’est un complément du verbe.`;
  if (f === 'CP') return `« ${w} » dit où ou quand. On peut le déplacer ou l’effacer, la phrase reste juste : c’est un complément de phrase.`;
  if (f === 'AT') return `« ${w} » dit comment est le sujet « ${s} », à travers le verbe « ${verb} » (on pourrait dire « est ») : c’est l’attribut du sujet. Il s’accorde avec le sujet.`;
  return `« ${w} » complète le nom dans « ${s} » : c’est un complément du nom, il fait partie du groupe sujet.`;
}

// =============================== Orthographe des mots ===============================
// [word with @, answer, choices, rule, level from which it comes (default: the rule's level)]
const OR = [];
const or = (rule, choices, list) => list.forEach(([w, a, extra]) => OR.push({ w, a, choices, rule, extra }));
or('mbp', ['m', 'n'], [['une la@pe', 'm'], ['une ja@be', 'm'], ['un po@pier', 'm'], ['une o@bre', 'm'], ['le te@ps', 'm'], ['un cha@pion', 'm'], ['la cha@bre', 'm'], ['un ta@bour', 'm'],
  ['une co@pote', 'm'], ['une tro@pette', 'm'], ['un ja@bon', 'm'], ['la ca@pagne', 'm'], ['le printe@ps', 'm'], ['i@possible', 'm'],
  ['une ta@te', 'n'], ['un e@fant', 'n'], ['la mo@tagne', 'n'], ['un pa@talon', 'n'], ['le ve@dredi', 'n'], ['un o@cle', 'n'], ['cha@ter', 'n'], ['la lo@gueur', 'n'], ['un bo@bon', 'n', 'Attention, exception : un bonbon s’écrit avec n.']]);
or('sz', ['s', 'ss'], [['une ro@e', 's'], ['une mai@on', 's'], ['un oi@eau', 's'], ['la cui@ine', 's'], ['une ceri@e', 's'], ['une chemi@e', 's'], ['un vi@age', 's'], ['une vali@e', 's'], ['du rai@in', 's'],
  ['un poi@on rouge', 'ss'], ['une cai@e', 'ss'], ['une ta@e', 'ss'], ['une chau@ette', 'ss'], ['un cou@in', 'ss'], ['une bro@e', 'ss'], ['de la mou@e', 'ss'], ['une ca@erole', 'ss'], ['un de@in', 'ss']]);
or('cç', ['c', 'ç'], [['un gar@on', 'ç'], ['une le@on', 'ç'], ['un ma@on', 'ç'], ['un gla@on', 'ç'], ['une balan@oire', 'ç'], ['un hame@on', 'ç'], ['la fa@ade', 'ç'], ['il a re@u', 'ç'], ['nous commen@ons', 'ç'], ['dé@u', 'ç'],
  ['une @erise', 'c'], ['le @iel', 'c'], ['un @ygne', 'c'], ['une @itrouille', 'c'], ['la pi@ine', 'c'], ['un @inéma', 'c'], ['la gla@e', 'c'], ['un pou@e', 'c'], ['la ra@ine', 'c']]);
or('g', ['g', 'ge', 'gu'], [['un pi@on', 'ge'], ['un bour@on', 'ge'], ['nous man@ons', 'ge'], ['il na@ait', 'ge'], ['il plon@a', 'ge'], ['une oran@ade', 'ge'],
  ['une @êpe', 'gu'], ['une @itare', 'gu'], ['une ba@e', 'gu'], ['la lan@e', 'gu'], ['une va@e', 'gu'], ['une fi@e', 'gu'],
  ['la @are', 'g'], ['un @âteau', 'g'], ['une @irafe', 'g'], ['une @omme', 'g'], ['un @ilet', 'g'], ['une ti@e', 'g']]);
or('acc', ['é', 'è', 'ê'], [['une f@te', 'ê'], ['la for@t', 'ê'], ['une b@te', 'ê'], ['la t@te', 'ê'], ['un r@ve', 'ê'], ['la fen@tre', 'ê'], ['une r@gle', 'è'], ['le p@re', 'è'], ['un z@bre', 'è'],
  ['une fl@che', 'è'], ['une ch@vre', 'è'], ['la pi@ce', 'è'], ['la lumi@re', 'è'], ['l’@cole', 'é'], ['le th@', 'é'], ['la r@colte', 'é'], ['une f@e', 'é'], ['une @toile', 'é'], ['le pr@', 'é']]);
const ailOr = (pairs) => pairs.forEach(([w, a, m, f]) => OR.push({ w, a, choices: [m, f], rule: 'ail' }));
ailOr([['le trav@', 'ail', 'ail', 'aille'], ['la bat@', 'aille', 'ail', 'aille'], ['le port@', 'ail', 'ail', 'aille'], ['la méd@', 'aille', 'ail', 'aille'], ['la p@', 'aille', 'ail', 'aille'], ['le gouvern@', 'ail', 'ail', 'aille'],
  ['le sol@', 'eil', 'eil', 'eille'], ['une ab@', 'eille', 'eil', 'eille'], ['le rév@', 'eil', 'eil', 'eille'], ['une bout@', 'eille', 'eil', 'eille'], ['une or@', 'eille', 'eil', 'eille'], ['un ort@', 'eil', 'eil', 'eille'], ['le somm@', 'eil', 'eil', 'eille'], ['une corb@', 'eille', 'eil', 'eille'],
  ['un faut@', 'euil', 'euil', 'euille'], ['une f@', 'euille', 'euil', 'euille'], ['un écur@', 'euil', 'euil', 'euille'], ['le chevr@', 'euil', 'euil', 'euille'], ['le fen@', 'ouil', 'ouil', 'ouille'], ['une citr@', 'ouille', 'ouil', 'ouille'], ['une gren@', 'ouille', 'ouil', 'ouille']]);
const mute = (list) => list.forEach(([w, a, fam]) => OR.push({ w, a, choices: uniq([a, ...shuffle(['t', 'd', 's', 'p'].filter((x) => x !== a)).slice(0, 2)]), rule: 'muette', fam }));
mute([['un cha@', 't', 'un chaton'], ['le lai@', 't', 'le laitier'], ['un lou@', 'p', 'une louve'], ['un dra@', 'p', 'un drapeau'], ['le bor@', 'd', 'border'], ['le cam@', 'p', 'camper'], ['un tapi@', 's', 'tapisser'],
  ['un bon@', 'd', 'bondir'], ['le galo@', 'p', 'galoper'], ['un bavar@', 'd', 'bavarder'], ['le marchan@', 'd', 'une marchande'], ['un sau@', 't', 'sauter'], ['le goû@', 't', 'goûter'], ['le do@', 's', 'un dossier'],
  ['le repo@', 's', 'se reposer'], ['un ran@', 'g', 'ranger'], ['le froi@', 'd', 'froide'], ['un écla@', 't', 'éclater'], ['un enfan@', 't', 'enfantin']]);
or('ee', ['é', 'ée', 'er'], [['le pr@', 'é'], ['la fus@', 'ée'], ['le pani@', 'er'], ['la beaut@', 'é'], ['la poup@', 'ée'], ['le bl@', 'é'], ['la ros@ du matin', 'ée'], ['l’amiti@', 'é'], ['le roch@', 'er'],
  ['le cahi@', 'er'], ['la chemin@', 'ée'], ['la journ@', 'ée'], ['le pommi@', 'er'], ['la libert@', 'é'], ['le march@', 'é'], ['l’ann@', 'ée'], ['le boulang@', 'er'], ['la soir@', 'ée']]);
const dbl = (list) => list.forEach(([w, a, s]) => OR.push({ w, a, choices: [s, s + s], rule: 'dbl' }));
dbl([['a@raper', 'tt', 't'], ['a@iver', 'rr', 'r'], ['a@orter', 'pp', 'p'], ['a@eler', 'pp', 'p'], ['e@acer', 'ff', 'f'], ['o@rir', 'ff', 'f'], ['a@rocher', 'cc', 'c'], ['a@endre', 'tt', 't'],
  ['un a@artement', 'pp', 'p'], ['a@ercevoir', 'p', 'p'], ['un a@ricot', 'b', 'b'], ['a@iter', 'g', 'g'], ['a@aiser', 'p', 'p'], ['a@uyer', 'pp', 'p']]);
const OR_LV = { mbp: -1, sz: 0, 'cç': 0, g: 1, acc: 1, ail: 2, muette: 3, ee: 4, dbl: 5 };
const OR_AT = (lv) => (lv <= -1 ? ['mbp'] : lv === 0 ? ['sz', 'cç', 'mbp'] : lv === 1 ? ['g', 'acc', 'sz', 'cç'] : lv === 2 ? ['ail', 'ail', 'g', 'acc'] : lv === 3 ? ['muette', 'muette', 'ail', 'acc'] : lv === 4 ? ['ee', 'ee', 'muette', 'ail', 'g'] : ['dbl', 'dbl', 'ee', 'muette', 'ail', 'mbp', 'acc']);
const OR_RULE = {
  mbp: 'Devant m, b, p, on écrit m (une lampe, une jambe). Ailleurs, n (un enfant).',
  sz: 'Entre deux voyelles, un seul s fait le son [z] (une rose). Pour le son [s], on double : ss (un poisson).',
  'cç': 'Devant e, i, y, le c fait déjà [s] : pas de cédille (une cerise). Devant a, o, u, il faut une cédille pour faire [s] (un garçon).',
  g: 'Devant a, o, u, le g fait [g] (une gare) ; devant e, i, il fait [j] (une girafe). Pour faire [j] devant a, o, on ajoute un e (un pigeon). Pour faire [g] devant e, i, on ajoute un u (une guêpe).',
  acc: 'é se prononce fermé (l’école). è et ê se prononcent ouvert. Le ê remplace souvent un ancien s : fête → festival, forêt → forestier, bête → bestiole.',
  ail: 'Les noms masculins finissent par -ail, -eil, -euil, -ouil (le travail, le soleil, un fauteuil). Les noms féminins par -aille, -eille, -euille, -ouille (la paille, une abeille, une feuille).',
  muette: 'Pour trouver la lettre muette, cherche un mot de la même famille où on l’entend.',
  ee: 'Les noms féminins en [é] s’écrivent souvent -ée (la journée), sauf ceux en -té et -tié (la beauté, l’amitié). Les noms masculins : -é (le pré), ou -er pour beaucoup d’arbres, d’objets et de métiers (le pommier, le cahier, le boulanger).',
  dbl: 'Au début des verbes en ap-, at-, ar-, ac-, ef-, of-, on double souvent la consonne : apporter, attraper, arriver, accrocher, effacer, offrir. Mais il y a des exceptions : apercevoir, apaiser, agiter, un abricot.',
};
function ortho(d) {
  const lv = lvOf(d), rule = pick(OR_AT(lv));
  const it = pick(OR.filter((o) => o.rule === rule && (!o.extra || lv >= 3)));
  const word = it.w.replace('@', it.a);
  const ex = `On écrit « ${word} ». ${it.extra || (it.fam ? `${cap(it.fam)} : on entend le « ${it.a} », donc ${word}. ` : '')}${it.extra ? '' : OR_RULE[rule]}`.trim();
  return { cat: 'fr:ortho', q: `Complète le mot : ${it.w}`, a: it.a, choices: it.rule === 'dbl' ? it.choices : shuffle([...it.choices]), u: '', ex, hint: OR_RULE[rule].split('. ')[0] + '.' };
}

// =============================== Vocabulaire ===============================
const CONTR = { adj: [['grand', 'petit', 'géant'], ['chaud', 'froid', 'brûlant'], ['plein', 'vide', 'rempli'], ['rapide', 'lent', 'vif'], ['propre', 'sale', 'net'], ['lourd', 'léger', 'pesant'],
  ['facile', 'difficile', 'simple'], ['gentil', 'méchant', 'aimable'], ['fort', 'faible', 'puissant'], ['vieux', 'jeune', 'ancien'], ['large', 'étroit', 'vaste'], ['sec', 'mouillé', null], ['content', 'triste', 'joyeux']],
  verb: [['ouvrir', 'fermer', null], ['monter', 'descendre', 'grimper'], ['gagner', 'perdre', 'réussir'], ['entrer', 'sortir', null], ['allumer', 'éteindre', 'éclairer'], ['remplir', 'vider', null],
    ['acheter', 'vendre', 'payer'], ['rire', 'pleurer', 'sourire'], ['se lever', 'se coucher', 'se réveiller'], ['commencer', 'finir', 'débuter']],
  noun: [['le jour', 'la nuit', null], ['l’été', 'l’hiver', null], ['la paix', 'la guerre', 'le calme'], ['le début', 'la fin', 'le départ']],
  adv: [['toujours', 'jamais', null], ['avant', 'après', null], ['tôt', 'tard', null], ['dessus', 'dessous', null]] };
const SYN = { adj: [['content', 'joyeux', 'triste'], ['joli', 'beau', 'laid'], ['petit', 'minuscule', 'énorme'], ['rusé', 'malin', 'naïf'], ['triste', 'malheureux', 'heureux'], ['gentil', 'aimable', 'méchant'], ['effrayé', 'apeuré', 'courageux'], ['énorme', 'gigantesque', 'minuscule']],
  verb: [['commencer', 'débuter', 'finir'], ['finir', 'terminer', 'commencer'], ['regarder', 'observer', 'écouter'], ['crier', 'hurler', 'chuchoter'], ['parler', 'bavarder', 'se taire'], ['bâtir', 'construire', 'démolir'], ['se dépêcher', 'se presser', 'traîner']],
  noun: [['un chemin', 'un sentier', null], ['la peur', 'la frayeur', 'le courage'], ['une maison', 'une habitation', null], ['un cadeau', 'un présent', null], ['un ami', 'un camarade', 'un ennemi']] };
const GEN = [['des fruits', ['pomme', 'poire', 'cerise']], ['des légumes', ['carotte', 'poireau', 'courgette']], ['des outils', ['marteau', 'scie', 'pelle']], ['des fleurs', ['rose', 'tulipe', 'marguerite']],
  ['des arbres', ['chêne', 'sapin', 'bouleau']], ['des instruments de musique', ['flûte', 'guitare', 'violon']], ['des vêtements', ['pull', 'pantalon', 'chaussette']], ['des oiseaux', ['merle', 'moineau', 'pigeon']],
  ['des insectes', ['fourmi', 'abeille', 'papillon']], ['des meubles', ['table', 'chaise', 'armoire']], ['des couleurs', ['rouge', 'bleu', 'vert']], ['des métiers', ['boulanger', 'fermier', 'facteur']]];
// [root, family, false friends (they look alike but are not from the family)]
const FAM = [['terre', ['terrier', 'enterrer', 'terrain'], ['tortue', 'tirer', 'tarte']], ['fleur', ['fleuriste', 'fleurir', 'fleuri'], ['flûte', 'flotter', 'flamme']],
  ['jardin', ['jardinier', 'jardiner', 'jardinage'], ['jaune', 'jambon', 'jarre']], ['lait', ['laitier', 'laitage', 'allaiter'], ['laine', 'laisser', 'laid']],
  ['dent', ['dentiste', 'dentifrice', 'dentier'], ['danse', 'dinde', 'dans']], ['chant', ['chanter', 'chanteur', 'chanson'], ['champ', 'chance', 'château']],
  ['long', ['longueur', 'allonger', 'longtemps'], ['loup', 'lourd', 'loin']], ['froid', ['refroidir', 'froidement', 'froideur'], ['fromage', 'front', 'frite']],
  ['neige', ['neiger', 'enneigé', 'neigeux'], ['nez', 'neuf', 'nager']], ['bois', ['boisé', 'déboiser', 'sous-bois'], ['boire', 'boîte', 'boisson']],
  ['pied', ['piéton', 'piétiner', 'trépied'], ['pie', 'pile', 'pierre']], ['gel', ['geler', 'dégeler', 'gelée'], ['gentil', 'géant', 'gens']],
  ['roi', ['royaume', 'royal', 'royauté'], ['roue', 'rouge', 'rond']], ['sel', ['saler', 'salière', 'salé'], ['selle', 'seul', 'celui']]];
const PREF = [['possible', 'impossible', ['inpossible', 'dépossible', 'malpossible']], ['faire', 'défaire', ['infaire', 'malfaire', 'imfaire']], ['heureux', 'malheureux', ['déheureux', 'inheureux', 'imheureux']],
  ['visible', 'invisible', ['dévisible', 'malvisible', 'imvisible']], ['patient', 'impatient', ['inpatient', 'dépatient', 'malpatient']], ['coller', 'décoller', ['incoller', 'malcoller', 'imcoller']],
  ['honnête', 'malhonnête', ['déshonnête', 'inhonnête', 'imhonnête']], ['connu', 'inconnu', ['déconnu', 'malconnu', 'imconnu']], ['plier', 'déplier', ['implier', 'malplier', 'inplier']],
  ['content', 'mécontent', ['incontent', 'décontent', 'malcontent']], ['prudent', 'imprudent', ['inprudent', 'déprudent', 'malprudent']], ['boucher', 'déboucher', ['imboucher', 'malboucher', 'inboucher']]];
const SUFF = [['le petit du chat', 'chaton', ['chatette', 'chatier', 'chateur']], ['une petite maison', 'maisonnette', ['maisonnier', 'maisonneur', 'maisonnage']], ['celui qui travaille au jardin', 'jardinier', ['jardinette', 'jardineur', 'jardinon']],
  ['celle qui vend des fleurs', 'fleuriste', ['fleurette', 'fleurière', 'fleureuse']], ['celui qui chante', 'chanteur', ['chantiste', 'chantette', 'chanton']], ['le petit de l’ours', 'ourson', ['oursette', 'oursier', 'oursiste']],
  ['une petite fille', 'fillette', ['fillon', 'fillière', 'filleuse']], ['celle qui danse', 'danseuse', ['dansière', 'dansette', 'danseure']], ['le petit de la chèvre', 'chevreau', ['chevrette', 'chevrier', 'chevrin']],
  ['le petit du lion', 'lionceau', ['lionnet', 'lionette', 'lionnier']], ['celui qui conduit un camion', 'camionneur', ['camionniste', 'camionnier', 'camionnet']]];
const PREF_SENSE = [['refaire', 're-', 'encore une fois'], ['relire', 're-', 'encore une fois'], ['repartir', 're-', 'encore une fois'], ['défaire', 'dé-', 'le contraire'], ['décoller', 'dé-', 'le contraire'],
  ['déplier', 'dé-', 'le contraire'], ['prévoir', 'pré-', 'avant'], ['préhistoire', 'pré-', 'avant'], ['impossible', 'im-', 'pas (le contraire)'], ['invisible', 'in-', 'pas (le contraire)']];
const SENSES = ['encore une fois', 'le contraire', 'avant', 'pas (le contraire)', 'très', 'à côté'];
const ALPHA = ['abeille', 'arbre', 'avion', 'balai', 'baleine', 'ballon', 'balançoire', 'barque', 'bateau', 'biche', 'blé', 'cabane', 'canard', 'carotte', 'castor', 'cerise', 'chalet', 'champ', 'chapeau', 'chat', 'château', 'chêne',
  'cheval', 'chèvre', 'citron', 'colline', 'coq', 'dindon', 'écureuil', 'étoile', 'ferme', 'feuille', 'fleur', 'forêt', 'fraise', 'fromage', 'grange', 'grenade', 'grenier', 'grenouille', 'hibou', 'jardin', 'lac', 'lapin',
  'lune', 'maison', 'marmotte', 'mouche', 'moulin', 'mousse', 'mouton', 'navet', 'nuage', 'oie', 'oiseau', 'orange', 'panier', 'poire', 'poireau', 'poisson', 'poivron', 'pomme', 'porte', 'portail', 'poule', 'pré', 'prune',
  'radis', 'renard', 'rivière', 'rocher', 'sapin', 'souris', 'tomate', 'tortue', 'trace', 'tracteur', 'train', 'travail', 'vache', 'vélo', 'verger'];
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const REG = [['bagnole', 'voiture', 'automobile'], ['bouquin', 'livre', 'ouvrage'], ['bouffer', 'manger', 'se restaurer'], ['se planquer', 'se cacher', 'se dissimuler'],
  ['avoir la trouille', 'avoir peur', 'être effrayé'], ['un pote', 'un ami', 'un compagnon'], ['rigoler', 'rire', 's’esclaffer'], ['le boulot', 'le travail', 'la besogne']];
const EXPR = [['avoir un chat dans la gorge', 'avoir du mal à parler'], ['poser un lapin', 'ne pas venir au rendez-vous'], ['avoir la tête dans les nuages', 'être distrait, rêver'],
  ['donner sa langue au chat', 'renoncer à deviner'], ['être muet comme une carpe', 'ne rien dire du tout'], ['avoir une faim de loup', 'avoir très faim'], ['il pleut des cordes', 'il pleut très fort'],
  ['se lever avec les poules', 'se lever très tôt'], ['un froid de canard', 'un très grand froid'], ['quand les poules auront des dents', 'jamais'], ['être têtu comme une mule', 'ne jamais changer d’avis']];
function vocWord(bank, kind, lv) {
  const cat = pick(Object.keys(bank).filter((k) => lv >= 1 || k !== 'adv')), [w, right, trap] = pick(bank[cat]);
  const others = shuffle(bank[cat].filter((x) => x[0] !== w && x[1] !== right && x[1] !== w && x[0] !== right).map((x) => x[1]));
  return mc('fr:voc', kind === 'contr' ? `Quel est le contraire ${deQ(w)} ?` : `Quel mot veut presque dire la même chose ${queQ(w)} ?`, right, [trap, ...others],
    kind === 'contr' ? `« ${right} » est le contraire ${deQ(w)}.${trap ? ` « ${trap} » veut presque dire la même chose ${queQ(w)} (c’est un synonyme, pas un contraire).` : ''}`
      : `« ${w} » et « ${right} » sont des synonymes : ils veulent presque dire la même chose.${trap ? ` « ${trap} », c’est le contraire !` : ''}`,
    kind === 'contr' ? 'Le contraire dit l’opposé : chaud / froid.' : `Mets chaque mot à la place de « ${w} » dans une phrase : lequel garde le sens ?`);
}
function alphaQ(lv) {
  const k = lv <= 0 ? 0 : lv <= 2 ? 1 : lv <= 4 ? 2 : 3; // how many letters are the same at the start
  const groups = {};
  for (const w of ALPHA) { const key = norm(w).slice(0, k); (groups[key] = groups[key] || []).push(w); }
  let words;
  if (k === 0) words = shuffle(uniq(shuffle([...ALPHA]).filter((w, i, a) => a.findIndex((x) => norm(x)[0] === norm(w)[0]) === i))).slice(0, 4);
  else {
    const ok = Object.values(groups).filter((g) => g.length >= 3 && new Set(g.map((w) => norm(w)[k])).size >= 3);
    words = shuffle([...pick(ok)]).filter((w, i, a) => a.findIndex((x) => norm(x)[k] === norm(w)[k]) === i).slice(0, 4);
  }
  const first = [...words].sort((a, b) => norm(a).localeCompare(norm(b)))[0];
  return { cat: 'fr:voc', q: `Dans le dictionnaire, quel mot vient en premier ? ${words.join(', ')}`, a: first, choices: shuffle([...words]), u: '',
    ex: `Dans l’ordre alphabétique : ${[...words].sort((a, b) => norm(a).localeCompare(norm(b))).join(', ')}.${k === 1 ? ' La première lettre est pareille : on compare la 2e.' : k ? ` Les ${k} premières lettres sont pareilles : on compare la ${k + 1}e.` : ''}`,
    hint: k ? `${k === 1 ? 'La première lettre est pareille' : `Les ${k} premières lettres sont pareilles`} : regarde la lettre d’après.` : 'Récite l’alphabet : quelle première lettre arrive d’abord ?' };
}
function voc(d) {
  const lv = lvOf(d);
  const types = lv <= -1 ? ['contr', 'alpha'] : lv === 0 ? ['contr', 'alpha', 'gen'] : lv === 1 ? ['syn', 'alpha', 'gen', 'contr'] : lv === 2 ? ['fam', 'syn', 'alpha', 'contr'] : lv === 3 ? ['pref', 'suff', 'alpha', 'fam', 'syn']
    : lv === 4 ? ['intrus', 'sense', 'pref', 'suff', 'alpha', 'fam'] : ['reg', 'expr', 'expr', 'intrus', 'sense', 'pref', 'alpha', 'syn'];
  const ty = pick(types);
  if (ty === 'contr') return vocWord(CONTR, 'contr', lv);
  if (ty === 'syn') return vocWord(SYN, 'syn', lv);
  if (ty === 'alpha') return alphaQ(lv);
  if (ty === 'gen') {
    const [g, l] = pick(GEN);
    return mc('fr:voc', `Quel mot regroupe : ${l.join(', ')} ?`, g, shuffle(GEN.filter((x) => x[0] !== g)).map((x) => x[0]), `${cap(l.join(', '))} sont ${g}. « ${g.replace(/^des /, '')} » est le mot générique (le mot qui les regroupe tous).`, 'Qu’est-ce qu’ils ont en commun ?');
  }
  if (ty === 'fam' || ty === 'intrus') {
    const [root, fam, ff] = pick(FAM);
    if (ty === 'fam') { const r = pick(fam); return mc('fr:voc', `Quel mot est de la même famille ${queQ(root)} ?`, r, shuffle([...ff]), `« ${r} » est construit sur « ${root} » : même famille. ${cap(ff.join(', '))} se ressemblent un peu, mais n’ont rien à voir avec « ${root} ».`, `Cherche le mot « ${root} » caché dedans, avec un sens qui va avec.`); }
    const odd = pick(ff);
    return mc('fr:voc', `Quel mot n’est pas de la même famille ? ${shuffle([root, ...fam.slice(0, 2), odd]).join(', ')}`, odd, [root, ...fam.slice(0, 2)], `« ${odd} » ressemble à « ${root} », mais son sens n’a rien à voir : ce n’est pas la même famille.`, 'Les mots d’une famille parlent de la même chose.');
  }
  if (ty === 'pref') { const [w, r, wr] = pick(PREF); return mc('fr:voc', `Avec un préfixe, quel est le contraire ${deQ(w)} ?`, r, wr, `« ${r} ». Les préfixes in-, im-, dé-, mal-, mé- peuvent faire un contraire. Devant m, b, p, in- devient im- (impossible).`, 'in- / im- / dé- / mal- / mé- : lequel sonne juste ?'); }
  if (ty === 'suff') { const [def, r, wr] = pick(SUFF); return mc('fr:voc', `Quel mot veut dire « ${def} » ?`, r, wr, `« ${r} ». Le suffixe, à la fin du mot, change son sens : -on, -eau, -ette (petit), -ier, -eur, -iste (le métier, celui qui fait).`, 'Lequel est un vrai mot ? Dis-le à voix haute.'); }
  if (ty === 'sense') { const [w, p, s] = pick(PREF_SENSE); return mc('fr:voc', `Dans « ${w} », que veut dire le préfixe « ${p} » ?`, s, shuffle(SENSES.filter((x) => x !== s && !(s.includes('contraire') && x.includes('contraire')))), `« ${p} » veut dire « ${s} » : ${w}.`, `Enlève « ${p.replace('-', '')} » : que reste-t-il ? Quel sens ajoute le préfixe ?`); }
  if (ty === 'reg') {
    const set = pick(REG), which = pick([0, 2]), name = which === 0 ? 'familier' : 'soutenu';
    return mc('fr:voc', `Quel mot est ${name} ? (on l’utilise ${which === 0 ? 'entre copains' : 'dans un beau texte'})`, set[which], set.filter((_, j) => j !== which), `Familier : ${set[0]} · courant : ${set[1]} · soutenu : ${set[2]}.`, 'Familier : avec les copains. Courant : tous les jours. Soutenu : dans les livres.');
  }
  const [e, m] = pick(EXPR);
  return mc('fr:voc', `Que veut dire « ${e} » ?`, m, shuffle(EXPR.filter((x) => x[0] !== e)).map((x) => x[1]), `« ${cap(e)} » veut dire : ${m}. C’est une expression : il ne faut pas la comprendre mot à mot !`, 'Ce n’est pas à prendre au pied de la lettre : imagine quand on le dit.');
}

export const FR2 = { 'fr:conj': conj, 'fr:nature': nature, 'fr:fonc': fonc, 'fr:ortho': ortho, 'fr:voc': voc };
