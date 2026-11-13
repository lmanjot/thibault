// Lecture Z — static content: sounds (graphemes), picture words, forms, bosses.

export type Kind = "v" | "c";

export interface Grapheme {
  id: string;
  display: string;
  kind: Kind;
  /** Phoneme key used to match words (au → o). */
  phon: string;
  /** What text-to-speech says for the isolated sound (vowels only). */
  say?: string;
  /** Vowels this consonant does not combine with (soft c/g, awkward audio). */
  noVowels?: string[];
}

const g = (
  id: string,
  kind: Kind,
  extra: Partial<Grapheme> = {},
): Grapheme => ({ id, display: id, kind, phon: id, ...extra });

export const GRAPHEMES: Grapheme[] = [
  // Simple vowels
  g("a", "v", { say: "a" }),
  g("i", "v", { say: "i" }),
  g("o", "v", { say: "o" }),
  g("u", "v", { say: "u" }),
  g("e", "v", { say: "e" }),
  g("é", "v", { say: "é" }),
  g("è", "v", { say: "è" }),
  // Continuous consonants first (easier to blend: "mmmm-a")
  g("l", "c"),
  g("r", "c"),
  g("m", "c"),
  g("s", "c"),
  g("f", "c"),
  g("ch", "c"),
  g("v", "c"),
  g("n", "c"),
  g("j", "c"),
  g("z", "c"),
  // Stop consonants
  g("p", "c"),
  g("t", "c"),
  g("d", "c"),
  g("b", "c"),
  g("c", "c", { phon: "k", noVowels: ["i", "e", "é", "è", "in"] }),
  g("g", "c", { noVowels: ["i", "e", "é", "è", "u", "in"] }),
  // Complex vowels
  g("ou", "v", { say: "ou" }),
  g("on", "v", { say: "on" }),
  g("an", "v", { say: "an" }),
  g("in", "v", { say: "hein" }),
  g("oi", "v", { say: "oie" }),
  g("eu", "v", { say: "eux" }),
  g("au", "v", { say: "au", phon: "o" }),
];

export const GRAPHEME: Record<string, Grapheme> = Object.fromEntries(
  GRAPHEMES.map((x) => [x.id, x]),
);

/** Look-alike / sound-alike pairs, used as preferred wrong options. */
export const CONFUSE: Record<string, string[]> = {
  a: ["o"],
  o: ["a", "ou"],
  i: ["l", "é"],
  u: ["n", "ou"],
  e: ["é", "è"],
  é: ["e", "è"],
  è: ["é", "e"],
  l: ["i", "r"],
  r: ["l"],
  m: ["n"],
  n: ["m", "u"],
  s: ["z", "ch"],
  z: ["s"],
  f: ["v"],
  v: ["f"],
  ch: ["j", "s"],
  j: ["ch", "g"],
  p: ["b", "d"],
  b: ["d", "p"],
  d: ["b", "t"],
  t: ["d"],
  c: ["g"],
  g: ["c", "j"],
  ou: ["u", "on"],
  on: ["ou", "an"],
  an: ["on", "in"],
  in: ["an", "on"],
  oi: ["o"],
  eu: ["e", "ou"],
  au: ["o"],
};

export interface Word {
  w: string;
  pic: string;
  /** Phonemes in order (first = first sound heard). */
  s: string[];
}

// Picture words for listening exercises. Pictures are placeholders until the
// illustrated set exists. Words with a glide ([j] in "lion", [w] in "oi") are
// tagged so they are never used to ask about the vowel inside them.
export const WORDS: Word[] = [
  { w: "ananas", pic: "🍍", s: ["a", "n", "a", "n", "a", "s"] },
  { w: "arbre", pic: "🌳", s: ["a", "r", "b", "r"] },
  { w: "chat", pic: "🐱", s: ["ch", "a"] },
  { w: "rat", pic: "🐀", s: ["r", "a"] },
  { w: "lama", pic: "🦙", s: ["l", "a", "m", "a"] },
  { w: "sac", pic: "👜", s: ["s", "a", "k"] },
  { w: "sapin", pic: "🎄", s: ["s", "a", "p", "in"] },
  { w: "vache", pic: "🐄", s: ["v", "a", "ch"] },
  { w: "tomate", pic: "🍅", s: ["t", "o", "m", "a", "t"] },
  { w: "banane", pic: "🍌", s: ["b", "a", "n", "a", "n"] },
  { w: "valise", pic: "🧳", s: ["v", "a", "l", "i", "z"] },
  { w: "salade", pic: "🥗", s: ["s", "a", "l", "a", "d"] },
  { w: "canard", pic: "🦆", s: ["k", "a", "n", "a", "r"] },
  { w: "lapin", pic: "🐰", s: ["l", "a", "p", "in"] },
  { w: "girafe", pic: "🦒", s: ["j", "i", "r", "a", "f"] },
  { w: "lit", pic: "🛏️", s: ["l", "i"] },
  { w: "riz", pic: "🍚", s: ["r", "i"] },
  { w: "souris", pic: "🐭", s: ["s", "ou", "r", "i"] },
  { w: "île", pic: "🏝️", s: ["i", "l"] },
  { w: "nid", pic: "🪹", s: ["n", "i"] },
  { w: "livre", pic: "📖", s: ["l", "i", "v", "r"] },
  { w: "tulipe", pic: "🌷", s: ["t", "u", "l", "i", "p"] },
  { w: "olive", pic: "🫒", s: ["o", "l", "i", "v"] },
  { w: "fourmi", pic: "🐜", s: ["f", "ou", "r", "m", "i"] },
  { w: "tigre", pic: "🐯", s: ["t", "i", "g", "r"] },
  { w: "guitare", pic: "🎸", s: ["g", "i", "t", "a", "r"] },
  { w: "moto", pic: "🏍️", s: ["m", "o", "t", "o"] },
  { w: "robot", pic: "🤖", s: ["r", "o", "b", "o"] },
  { w: "vélo", pic: "🚲", s: ["v", "é", "l", "o"] },
  { w: "os", pic: "🦴", s: ["o", "s"] },
  { w: "orange", pic: "🍊", s: ["o", "r", "an", "j"] },
  { w: "chocolat", pic: "🍫", s: ["ch", "o", "k", "o", "l", "a"] },
  { w: "chapeau", pic: "👒", s: ["ch", "a", "p", "o"] },
  { w: "pomme", pic: "🍎", s: ["p", "o", "m"] },
  { w: "robe", pic: "👗", s: ["r", "o", "b"] },
  { w: "coq", pic: "🐓", s: ["k", "o", "k"] },
  { w: "bateau", pic: "⛵", s: ["b", "a", "t", "o"] },
  { w: "gâteau", pic: "🎂", s: ["g", "a", "t", "o"] },
  { w: "lune", pic: "🌙", s: ["l", "u", "n"] },
  { w: "tortue", pic: "🐢", s: ["t", "o", "r", "t", "u"] },
  { w: "plume", pic: "🪶", s: ["p", "l", "u", "m"] },
  { w: "jus", pic: "🧃", s: ["j", "u"] },
  { w: "mur", pic: "🧱", s: ["m", "u", "r"] },
  { w: "bus", pic: "🚌", s: ["b", "u", "s"] },
  { w: "cheval", pic: "🐴", s: ["ch", "e", "v", "a", "l"] },
  { w: "renard", pic: "🦊", s: ["r", "e", "n", "a", "r"] },
  { w: "requin", pic: "🦈", s: ["r", "e", "k", "in"] },
  { w: "melon", pic: "🍈", s: ["m", "e", "l", "on"] },
  { w: "cerise", pic: "🍒", s: ["s", "e", "r", "i", "z"] },
  { w: "chemise", pic: "👔", s: ["ch", "e", "m", "i", "z"] },
  { w: "fenêtre", pic: "🪟", s: ["f", "e", "n", "è", "t", "r"] },
  { w: "bébé", pic: "👶", s: ["b", "é", "b", "é"] },
  { w: "café", pic: "☕", s: ["k", "a", "f", "é"] },
  { w: "épée", pic: "🗡️", s: ["é", "p", "é"] },
  { w: "éléphant", pic: "🐘", s: ["é", "l", "é", "f", "an"] },
  { w: "fée", pic: "🧚", s: ["f", "é"] },
  { w: "nez", pic: "👃", s: ["n", "é"] },
  { w: "télé", pic: "📺", s: ["t", "é", "l", "é"] },
  { w: "dé", pic: "🎲", s: ["d", "é"] },
  { w: "clé", pic: "🔑", s: ["k", "l", "é"] },
  { w: "fraise", pic: "🍓", s: ["f", "r", "è", "z"] },
  { w: "neige", pic: "❄️", s: ["n", "è", "j"] },
  { w: "ver", pic: "🪱", s: ["v", "è", "r"] },
  { w: "zèbre", pic: "🦓", s: ["z", "è", "b", "r"] },
  { w: "iguane", pic: "🦎", s: ["i", "g", "w", "a", "n"] },
  { w: "usine", pic: "🏭", s: ["u", "z", "i", "n"] },
  { w: "tutu", pic: "🩰", s: ["t", "u", "t", "u"] },
  { w: "pull", pic: "🧥", s: ["p", "u", "l"] },
  { w: "kiwi", pic: "🥝", s: ["k", "i", "w", "i"] },
  { w: "loup", pic: "🐺", s: ["l", "ou"] },
  { w: "mouton", pic: "🐑", s: ["m", "ou", "t", "on"] },
  { w: "ours", pic: "🐻", s: ["ou", "r", "s"] },
  { w: "poule", pic: "🐔", s: ["p", "ou", "l"] },
  { w: "roue", pic: "🛞", s: ["r", "ou"] },
  { w: "mouche", pic: "🪰", s: ["m", "ou", "ch"] },
  { w: "ballon", pic: "🎈", s: ["b", "a", "l", "on"] },
  { w: "dent", pic: "🦷", s: ["d", "an"] },
  { w: "main", pic: "✋", s: ["m", "in"] },
  { w: "dauphin", pic: "🐬", s: ["d", "o", "f", "in"] },
  { w: "feu", pic: "🔥", s: ["f", "eu"] },
  { w: "fleur", pic: "🌸", s: ["f", "l", "eu", "r"] },
  { w: "roi", pic: "👑", s: ["r", "oi"] },
  { w: "poisson", pic: "🐟", s: ["p", "oi", "s", "on"] },
  { w: "étoile", pic: "⭐", s: ["é", "t", "oi", "l"] },
];

// ——— Spelling: which letters write which sound ———

/** Ways each sound can be written, longest first. */
const SPELLINGS: Record<string, string[]> = {
  a: ["a", "â", "à"],
  i: ["i", "î", "y"],
  o: ["eau", "au", "o", "ô"],
  u: ["u", "û"],
  e: ["e"],
  é: ["ez", "er", "é"],
  è: ["ai", "ei", "è", "ê", "e"],
  ou: ["ou"],
  on: ["on", "om"],
  an: ["an", "en", "am", "em"],
  in: ["ain", "ein", "in", "im"],
  oi: ["oi"],
  eu: ["eu"],
  k: ["qu", "c", "k", "q"],
  g: ["gu", "g"],
  j: ["ge", "j", "g"],
  s: ["ss", "s", "c", "ç"],
  z: ["z", "s"],
  f: ["ph", "f"],
  w: ["ou", "u", "w"],
  l: ["ll", "l"],
  m: ["mm", "m"],
  n: ["nn", "n"],
  r: ["rr", "r"],
  t: ["tt", "t"],
  p: ["pp", "p"],
};

const SILENT_TAIL = /^(e|s|t|d|p|x|z|es|ent)?$/;

export interface Seg {
  text: string;
  phon: string | null; // null = silent letters
}

/** Split a word into spelled sounds, e.g. chapeau → ch·a·p·eau. Null if the spelling is unusual. */
export function segment(word: Word): Seg[] | null {
  const go = (ti: number, pi: number): Seg[] | null => {
    if (pi === word.s.length) {
      const rest = word.w.slice(ti);
      return SILENT_TAIL.test(rest) ? (rest ? [{ text: rest, phon: null }] : []) : null;
    }
    const p = word.s[pi];
    for (const sp of SPELLINGS[p] ?? [p]) {
      if (word.w.startsWith(sp, ti)) {
        const tail = go(ti + sp.length, pi + 1);
        if (tail) return [{ text: sp, phon: p }, ...tail];
      }
    }
    return null;
  };
  return go(0, 0);
}

/** Phonemes hidden inside another sound: never ask about them in these words. */
const HIDES: Record<string, string[]> = { oi: ["o", "a", "ou"], in: ["i"], on: ["o"], an: ["a"], ou: ["o", "u"], eu: ["e"], w: ["u", "ou"] };

export function wordHas(word: Word, phon: string): boolean {
  return word.s.includes(phon);
}

/** True when asking "do you hear [phon] in word?" would be ambiguous. */
export function wordAmbiguous(word: Word, phon: string): boolean {
  if (word.s.includes(phon)) return false;
  return word.s.some((p) => HIDES[p]?.includes(phon));
}

// ——— Goku's transformations: bought in Bulma's shop, in story order (Dragon Ball → Z → Super) ———

/** Things Goku carries or shows, drawn around the sprite (they add up). */
export type PowerItem = "staff" | "cloud" | "kame" | "genki" | "teleport" | "shenron";

export interface Form {
  name: string; // the power just earned
  sprite: string;
  fx: string; // aura
  kid?: boolean; // drawn smaller, as young Goku
  items: PowerItem[];
  balls?: number; // dragon balls collected
  price: number; // zénis
  story: string; // a couple of sentences said when the power is earned
}

export const FORMS: Form[] = [
  // Young Goku: his staff and the flying cloud are part of the drawings.
  { name: "Petit Goku", sprite: "goku_kid.png", fx: "base", kid: true, items: [], price: 0, story: "Voici Petit Goku ! Il a une queue de singe, et il est super fort." },
  { name: "Le bâton magique", sprite: "goku_kid_staff.png", fx: "base", kid: true, items: [], price: 40, story: "Le bâton magique peut s'allonger jusqu'au ciel ! Goku s'en sert pour attraper des choses très loin, et pour se battre." },
  { name: "Le nuage magique", sprite: "goku_kid_cloud.png", fx: "base", kid: true, items: [], price: 60, story: "Le nuage magique vole plus vite qu'un avion ! Seuls les enfants au cœur pur peuvent monter dessus." },
  { name: "Le Kaméhaméha", sprite: "goku_kid_cloud.png", fx: "kame", kid: true, items: ["kame"], price: 80, story: "Tortue Géniale lui a appris le Kaméhaméha ! Goku rassemble son énergie dans ses mains… et boum !" },
  { name: "Goku a grandi !", sprite: "goku_teen.png", fx: "base", items: [], price: 100, story: "Goku est devenu grand, et beaucoup plus fort ! Maintenant, il s'entraîne pour protéger ses amis." },
  { name: "Le Kaioken", sprite: "goku_kaioken.png", fx: "kaioken", items: [], price: 120, story: "Maître Kaïo lui a appris le Kaioken ! Goku devient tout rouge, et deux fois plus rapide." },
  { name: "Le Genkidama", sprite: "goku_genki.png", fx: "base", items: ["genki"], price: 140, story: "Avec le Genkidama, Goku demande un peu d'énergie à tous les êtres vivants. Ça fait une boule géante !" },
  { name: "Kaioken fois dix", sprite: "goku_kaioken.png", fx: "kaioken2", items: [], price: 160, story: "Kaioken fois dix ! Goku est dix fois plus fort, mais il doit faire très attention." },
  { name: "Super Saiyan", sprite: "goku_ssj_new.png", fx: "ssj", items: [], price: 200, story: "Goku devient Super Saïyen ! Ses cheveux deviennent dorés, et sa force explose." },
  { name: "La téléportation", sprite: "goku_ssj_new.png", fx: "ssj", items: ["teleport"], price: 220, story: "Goku pose deux doigts sur son front… et hop ! Il apparaît n'importe où, en un clin d'œil." },
  { name: "Super Saiyan 2", sprite: "goku_ssj2.png", fx: "ssj2", items: [], price: 250, story: "Super Saïyen 2 ! Des petits éclairs crépitent tout autour de Goku." },
  { name: "Super Saiyan 3", sprite: "goku_ssj3.png", fx: "ssj3", items: [], price: 280, story: "Super Saïyen 3 ! Ses cheveux deviennent très, très longs, et sa puissance est énorme." },
  { name: "Super Saiyan God", sprite: "goku_god.png", fx: "god", items: [], price: 320, story: "Goku devient un dieu ! Ses cheveux deviennent rouges, et il sent l'énergie des dieux." },
  { name: "Super Saiyan Blue", sprite: "goku_blue.png", fx: "blue", items: [], price: 360, story: "Super Saïyen Blue ! Goku mélange la force des dieux et celle des Saïyens." },
  { name: "Ultra Instinct", sprite: "goku_ui.png", fx: "ui", items: [], price: 420, story: "L'Ultra Instinct ! Le corps de Goku bouge tout seul, plus vite que la pensée." },
  ...[1, 2, 3, 4, 5, 6, 7].map((n) => ({
    name: `La boule de cristal à ${["une", "deux", "trois", "quatre", "cinq", "six", "sept"][n - 1]} étoile${n > 1 ? "s" : ""}`,
    sprite: "goku_ui.png",
    fx: "ui",
    items: [] as PowerItem[],
    balls: n,
    price: 100,
    story:
      n === 1
        ? "Goku a trouvé la première boule de cristal ! Il en faut sept pour appeler le dragon."
        : n === 7
          ? "La septième boule ! Goku les a toutes : le dragon va pouvoir apparaître !"
          : `Encore une boule de cristal ! Plus que ${["six", "cinq", "quatre", "trois", "deux"][n - 2]} à trouver.`,
  })),
  { name: "Shenron exauce ton vœu !", sprite: "goku_ui.png", fx: "ui", items: ["shenron"], balls: 7, price: 300, story: "Le grand dragon Shenron apparaît dans le ciel ! Il peut exaucer un vœu. Bravo, tu es un vrai champion !" },
];

/** Goku's look at step `step` of the ladder, and the next step to buy. */
export function formFor(cleared: number): { form: Form; index: number; next?: Form } {
  const index = Math.min(cleared, FORMS.length - 1);
  return { form: FORMS[index], index, next: FORMS[index + 1] };
}

// ——— Bosses: one after each cleared letter, a bigger one for each revision ———

export interface Boss {
  name: string;
  sprite: string;
  bg: string;
  fx?: string;
}

/**
 * Opponents follow Goku's story: which ones he meets depends on how far he has come on his
 * transformation ladder (`from` = step in FORMS). In each era they come in story order, the next
 * one being the first not yet beaten (the last one repeats). Letter bosses are the easier fights,
 * revision bosses the era's big villains.
 */
export const BOSS_ERAS: { from: number; letter: Boss[]; revision: Boss[] }[] = [
  {
    from: 0, // Dragon Ball: young Goku's adventures
    letter: [
      { name: "Yamcha", sprite: "yamcha.png", bg: "bg_desert.png" },
      { name: "Pilaf", sprite: "pilaf.png", bg: "bg_papaya.png" },
      { name: "Krilin au tournoi", sprite: "krillin_kid.png", bg: "bg_papaya.png" },
      { name: "Giran", sprite: "giran.png", bg: "bg_papaya.png" },
      { name: "Sergent Metallic", sprite: "metallic.png", bg: "bg_desert.png" },
    ],
    revision: [
      { name: "Tao Pai Pai", sprite: "taopaipai.png", bg: "bg_desert.png" },
      { name: "Piccolo Daimaô", sprite: "piccolo.png", bg: "bg_desert.png", fx: "dark" },
    ],
  },
  {
    from: 4, // Goku has grown up: the 23rd tournament, then the Saiyans arrive
    letter: [{ name: "Piccolo au tournoi", sprite: "piccolo_jr.png", bg: "bg_papaya.png" }],
    revision: [{ name: "Raditz", sprite: "raditz.png", bg: "bg_desert.png" }],
  },
  {
    from: 5, // Kaioken: the Saiyan fight
    letter: [
      { name: "Saibaman", sprite: "saibaman.png", bg: "bg_desert.png" },
      { name: "Nappa", sprite: "nappa.png", bg: "bg_desert.png" },
    ],
    revision: [{ name: "Vegeta", sprite: "vegeta_new.png", bg: "bg_desert.png" }],
  },
  {
    from: 7, // Namek
    letter: [
      { name: "Soldat de Freezer", sprite: "soldier.png", bg: "bg_namek.png" },
      { name: "Commando Ginyu", sprite: "ginyu.png", bg: "bg_namek.png" },
    ],
    revision: [{ name: "Freezer", sprite: "frieza.png", bg: "bg_namek.png" }],
  },
  {
    from: 8, // Super Saiyan: the end of Namek
    letter: [{ name: "Freezer", sprite: "frieza_new.png", bg: "bg_namek.png" }],
    revision: [{ name: "Freezer doré", sprite: "frieza_new.png", bg: "bg_namek.png", fx: "gold" }],
  },
  {
    from: 9, // the androids
    letter: [
      { name: "C-18", sprite: "c18.png", bg: "bg_road.png" },
      { name: "C-17", sprite: "c17.png", bg: "bg_road.png" },
    ],
    revision: [{ name: "Cell", sprite: "cell.png", bg: "bg_cell.png" }],
  },
  {
    from: 10, // Super Saiyan 2: the Cell games
    letter: [{ name: "Cell", sprite: "cell.png", bg: "bg_cell.png" }],
    revision: [{ name: "Cell parfait", sprite: "cell_new.png", bg: "bg_cell.png" }],
  },
  {
    from: 11, // Super Saiyan 3: Majin Boo
    letter: [
      { name: "Dabura", sprite: "dabura.png", bg: "bg_road.png" },
      { name: "Majin Vegeta", sprite: "vegeta_ssj.png", bg: "bg_cell.png" },
      { name: "Boo", sprite: "buu_fat.png", bg: "bg_road.png" },
      { name: "Super Boo", sprite: "buu_majin.png", bg: "bg_road.png" },
    ],
    revision: [{ name: "Kid Boo", sprite: "buu_kid.png", bg: "bg_gods.png" }],
  },
  {
    from: 12, // Super Saiyan God: the god of destruction
    letter: [{ name: "Vegeta Super Saiyan God", sprite: "vegeta_god.png", bg: "bg_gods.png" }],
    revision: [{ name: "Beerus", sprite: "beerus.png", bg: "bg_gods.png" }],
  },
  {
    from: 13, // Super Saiyan Blue: Golden Freezer returns, then Goku Black
    letter: [
      { name: "Freezer doré", sprite: "frieza_new.png", bg: "bg_gods.png", fx: "gold" },
      { name: "Goku Black", sprite: "goku_black.png", bg: "bg_gods.png" },
    ],
    revision: [{ name: "Goku Black Rosé", sprite: "goku_black_rose.png", bg: "bg_gods.png" }],
  },
  {
    from: 14, // Ultra Instinct: the Tournament of Power, then Broly and Granola
    letter: [
      { name: "Jiren", sprite: "jiren.png", bg: "bg_gods.png" },
      { name: "Broly", sprite: "broly.png", bg: "bg_desert.png" },
      { name: "Granola", sprite: "granola.png", bg: "bg_namek.png" },
    ],
    revision: [{ name: "Broly Super Saiyan", sprite: "broly_ssj.png", bg: "bg_desert.png" }],
  },
];

export const BOSSES: Boss[] = BOSS_ERAS.flatMap((e) => [...e.letter, ...e.revision]);

/** The next opponent for Goku's step: the first of his era not yet beaten, else the era's last. */
export function bossFor(step: number, kind: "letter" | "revision", beaten: string[] = []): Boss {
  const era = [...BOSS_ERAS].reverse().find((e) => step >= e.from) ?? BOSS_ERAS[0];
  const list = era[kind];
  return list.find((b) => !beaten.includes(b.name)) ?? list[list.length - 1];
}

export const ASSET = (name: string) => `/assets/dbz/ready/${name}`;
