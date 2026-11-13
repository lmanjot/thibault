// Lecture Z — the closed catalog of everything the game says.
// Every spoken line is built from these short clips, generated once by
// scripts/gen-voice.mts and stored in public/lecture/voice/ (no live text-to-speech).

import { BOSSES, FORMS, GRAPHEME, GRAPHEMES, WORDS } from "./content";

/** Fixed lines, in Goku's voice. */
export const L = {
  asIn: "comme dans…",
  findSound: "Trouve le son…",
  slideIt: "Glisse la lettre au bon endroit !",
  doYouHear: "Écoute bien… Est-ce que tu entends…",
  inWord: "dans le mot…",
  yesHeard: "Mais si ! On l'entend dans…",
  notHeard: "Eh non ! Il n'y a pas…",
  showLetter: "Montre-moi la lettre qui fait…",
  firstSound: "Quel est le premier son du mot…",
  showGoodLetter: "Montre-moi la bonne lettre !",
  startsWith: "commence par…",
  theWord: "Presque ! Le mot…",
  thatIs: "Oups ! Ça, c'est…",
  needed: "Il fallait…",
  wanted: "On cherchait…",
  noWanted: "Presque ! On voulait…",
  itsThisOne: "Presque ! C'est celle-ci…",
  findAll: "Trouve toutes les lettres…",
  three: "Il y en a trois !",
  foundAll: "Tu les as tous trouvés !",
  fusion: "Fusion ! Fais…",
  show: "Montre-moi…",
  attacks: "attaque ! Réponds juste pour lancer ton Kaméhaméha !",
  kamehameha: "Kaaa… méééé… haaa… méééé… HAAAAA !",
  beaten: "est vaincu ! Bravo, champion !",
  perfect: "Parfait ! Trois étoiles !",
  trainingDone: "Bravo, entraînement terminé !",
  letterDone: "Bravo ! Tu as réussi la lettre…",
  newPower: "Goku gagne un nouveau pouvoir !",
  popAll: "Touche les boules avec la lettre…",
  newRecord: "Nouveau record ! Tu es trop fort !",
  gameOver: "Fin du jeu ! Bien joué !",
} as const;

export const PRAISE = ["Bravo !", "Super !", "Génial !", "Trop fort !", "Waouh, quelle puissance !", "Tu deviens super fort !", "Incroyable !", "Ouiii, c'est ça !"];

// ——— Sounds and syllables ———

const SCHWA_SAY: Record<string, string> = { r: "reu", f: "feu", v: "veu", ch: "cheu", p: "peu", b: "beu" };

/** Consonant sounds as pronounced (stretched when possible), never the letter's name. */
const CONSONANT_SAY: Record<string, string> = {
  l: "llll",
  r: "rrrr",
  m: "mmmm",
  s: "ssss",
  f: "ffff",
  ch: "chhhh",
  v: "vvvv",
  n: "nnnn",
  j: "jjjj",
  z: "zzzz",
  p: "pe",
  t: "te",
  d: "de",
  b: "be",
  c: "ke",
  g: "gue",
};

export function soundSay(g: string): string {
  const gr = GRAPHEME[g];
  return gr.say ?? CONSONANT_SAY[g] ?? gr.display;
}

export function sylSay(c: string, v: string): string {
  if (v === "e" && SCHWA_SAY[c]) return SCHWA_SAY[c];
  if (v === "in") return GRAPHEME[c].display + "ain";
  return GRAPHEME[c].display + GRAPHEME[v].display;
}

// ——— The whole catalog ———

export interface Clip {
  text: string;
  /** Spoken alone (sound, syllable, word): said clearly, with unspoken context. */
  short?: boolean;
  /** A picture word (said naturally, silent letters stay silent). */
  word?: boolean;
}

export function allClips(): Clip[] {
  const out = new Map<string, Clip>();
  const add = (text: string, short = false, word = false) =>
    text && !out.has(text) && out.set(text, { text, short, ...(word ? { word } : {}) });
  Object.values(L).forEach((t) => add(t));
  PRAISE.forEach((t) => add(t));
  BOSSES.forEach((b) => add(b.name, true));
  FORMS.forEach((f) => {
    add(f.name); // announced with excitement on the reward screen
    add(f.story); // then what the new power does
  });
  for (const g of GRAPHEMES) add(soundSay(g.id), true);
  const vowels = GRAPHEMES.filter((g) => g.kind === "v");
  for (const c of GRAPHEMES.filter((g) => g.kind === "c"))
    for (const v of vowels) if (!c.noVowels?.includes(v.id)) add(sylSay(c.id, v.id), true);
  WORDS.forEach((w) => add(w.w, true, true));
  return [...out.values()];
}
