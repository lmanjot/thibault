// Lecture Z — progress state, mastery levels and session building.

import { CONFUSE, GRAPHEME, GRAPHEMES, WORDS, segment, wordAmbiguous, wordHas, type Seg, type Word } from "./content";

// ——— State ———

/** A letter is cleared after this many good sessions (level 1 → 4). */
export const CLEARED = 4;

export interface ItemStat {
  level: number; // 1 new · +1 per good session · 4 = cleared
  good: number; // (kept for old saves)
  last: string; // last day practised
}

export interface Settings {
  classSounds: string[]; // letters known or being learned, in class order
  weekSounds: string[];
  weekStart: string;
  font: "script" | "cursive";
  focus?: string; // letter picked on the home screen
}

export interface Progress {
  items: Record<string, ItemStat>;
  ki: number;
  bosses: number;
  bossWeek: string; // weekStart of the last boss beaten
  playDays: string[];
  cleared?: string[]; // letters cleared, in order
  form?: number; // Goku's step on the transformation ladder (bought in the shop)
  zeni?: number; // coins earned by reading
  owned?: string[]; // shop items bought
  equip?: { companion?: string; scene?: string; aura?: string };
  senzu?: number; // beans in stock (+15 s on a mini-game)
  levels?: Partial<Record<"nuage" | "kame" | "bulles", number>>; // mini-game level chosen
  fights?: Fight[]; // bosses waiting to be fought, oldest first
  beaten?: string[]; // names of the bosses beaten, so the story moves on
}

/** A boss fight earned by reading: after each cleared letter, and a revision every few letters. */
export interface Fight {
  kind: "letter" | "revision";
  letter?: string; // the letter just cleared (letter bosses)
  letters?: string[]; // the letters covered (revision bosses)
}

/** A revision boss comes after this many cleared letters. */
export const REVISION_EVERY = 3;

export interface Save {
  v: 1;
  settings: Settings;
  progress: Progress;
}

const KEY = "lecture-z-v1";

export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function newSave(): Save {
  return {
    v: 1,
    settings: { classSounds: ["a", "i"], weekSounds: ["a", "i"], weekStart: today(), font: "script" },
    progress: { items: {}, ki: 0, bosses: 0, bossWeek: "", playDays: [] },
  };
}

export function loadSave(): Save {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as Save;
      if (s?.v === 1) return s;
    }
  } catch {}
  return newSave();
}

export function storeSave(s: Save) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {}
}

// ——— Items ———

export const gid = (id: string) => `g:${id}`;
export const sid = (c: string, v: string) => `s:${c}|${v}`;

export function parseSyl(id: string): { c: string; v: string } {
  const [c, v] = id.slice(2).split("|");
  return { c, v };
}

export function sylText(c: string, v: string): string {
  return GRAPHEME[c].display + GRAPHEME[v].display;
}

/** Default level for an item that has no stats yet. */
function defaultLevel(s: Save, id: string): number {
  if (id.startsWith("g:")) return s.settings.weekSounds.includes(id.slice(2)) ? 1 : 2; // known before this week
  return 1;
}

export function stat(s: Save, id: string): ItemStat {
  const st = s.progress.items[id];
  return { level: st?.level || defaultLevel(s, id), good: st?.good ?? 0, last: st?.last ?? "" };
}

export const level = (s: Save, id: string) => stat(s, id).level;

export const clearedList = (s: Save) => s.progress.cleared ?? [];
export const isCleared = (s: Save, g: string) => clearedList(s).includes(g);

/**
 * Apply one session's answers: each item practised at least twice with ≥ 80% goes up one level.
 * A letter reaching CLEARED is cleared: it joins the learned letters and earns a power-up.
 * Returns the letters cleared by this session.
 */
export function applySession(s: Save, answers: { item: string; ok: boolean }[], focus: string | null): string[] {
  const t = today();
  const per = new Map<string, { ok: number; tot: number }>();
  for (const a of answers) {
    if (a.item.startsWith("p:")) continue; // a peek at a coming letter: not scored
    const p = per.get(a.item) ?? { ok: 0, tot: 0 };
    p.tot += 1;
    if (a.ok) p.ok += 1;
    per.set(a.item, p);
  }
  const cleared: string[] = [];
  for (const [id, { ok, tot }] of per) {
    const st = { ...stat(s, id), last: t };
    // Only the letter being worked on can be cleared; letters mixed in stop one step short.
    const isLetter = id.startsWith("g:");
    const cap = isLetter && id.slice(2) !== focus && !isCleared(s, id.slice(2)) ? CLEARED - 1 : CLEARED;
    if (tot >= 2 && ok / tot >= 0.8 && st.level < cap) {
      st.level += 1;
      if (st.level >= CLEARED && isLetter && !isCleared(s, id.slice(2))) cleared.push(id.slice(2));
    }
    s.progress.items[id] = st;
  }
  if (cleared.length) {
    s.progress.cleared = [...clearedList(s), ...cleared];
    // Each cleared letter earns its boss; every few letters, a bigger revision boss too.
    const fights = [...(s.progress.fights ?? [])];
    for (const g of cleared) {
      fights.push({ kind: "letter", letter: g });
      const done = clearedList(s);
      const n = done.indexOf(g) + 1;
      if (n % REVISION_EVERY === 0) fights.push({ kind: "revision", letters: done.slice(n - REVISION_EVERY, n) });
    }
    s.progress.fights = fights;
    if (s.settings.focus && cleared.includes(s.settings.focus)) delete s.settings.focus; // move on to the next letter
    // Everything known is cleared: bring in the next letter of the usual order, so play never stops.
    if (knownSounds(s).every((g) => isCleared(s, g))) {
      const next = upcomingLetters(s, 1)[0];
      if (next) {
        s.settings.classSounds = [...s.settings.classSounds, next];
        s.progress.items[gid(next)] ??= { level: 1, good: 0, last: "" };
      }
    }
  }
  if (!s.progress.playDays.includes(t)) s.progress.playDays.push(t);
  return cleared;
}

// ——— What is available ———

export function knownSounds(s: Save): string[] {
  return s.settings.classSounds.filter((g) => GRAPHEME[g]);
}

/** The next letters not yet started, in the usual teaching order (shown on the home screen). */
export function upcomingLetters(s: Save, n: number): string[] {
  return GRAPHEMES.map((g) => g.id).filter((g) => !s.settings.classSounds.includes(g)).slice(0, n);
}

/** Start a new letter (added after the known ones) and work on it. */
export function startLetter(s: Save, g: string) {
  if (!s.settings.classSounds.includes(g)) {
    s.settings.classSounds = [...s.settings.classSounds, g];
    s.progress.items[gid(g)] ??= { level: 1, good: 0, last: "" }; // a new letter starts with no dots
  }
  s.settings.focus = g;
}

export function readySounds(s: Save): string[] {
  return knownSounds(s).filter((g) => level(s, gid(g)) >= 2);
}

export function availableSyllables(s: Save, onlyConsonant?: string): string[] {
  const ready = knownSounds(s); // every letter in the parent's list (a new letter starts only on purpose)
  const cons = ready.filter((g) => GRAPHEME[g].kind === "c" && (!onlyConsonant || g === onlyConsonant));
  const vows = ready.filter((g) => GRAPHEME[g].kind === "v");
  const out: string[] = [];
  for (const c of cons)
    for (const v of vows) if (!GRAPHEME[c].noVowels?.includes(v)) out.push(sid(c, v));
  return out;
}

/** The next boss waiting to be fought, if any. */
export const nextFight = (s: Save): Fight | undefined => s.progress.fights?.[0];

/** Letters cleared since the last revision (to show how close the next revision is). */
export const lettersToRevision = (s: Save) => REVISION_EVERY - (clearedList(s).length % REVISION_EVERY);

/**
 * The letter being worked on: the one picked on the home screen, else the first of the week's
 * letters not yet cleared, else the first known letter not yet cleared.
 */
export function focusSound(s: Save): string | null {
  const known = knownSounds(s);
  if (s.settings.focus && known.includes(s.settings.focus)) return s.settings.focus;
  const open = known.filter((g) => !isCleared(s, g));
  return open.find((g) => s.settings.weekSounds.includes(g)) ?? open[0] ?? known[known.length - 1] ?? null;
}

// ——— Exercises ———

export type Section = "warm" | "train" | "defi" | "boss";

export type Ex =
  | { t: "ecoute"; section: Section; item: string; g: string; word: Word; answer: boolean }
  | { t: "complete"; section: Section; item: string; g: string; word: Word; segs: Seg[]; gap: number; options: string[] }
  | { t: "hunt"; section: Section; item: string; g: string; letters: string[] }
  | { t: "lettre"; section: Section; item: string; g: string; word?: Word; options: string[] }
  | { t: "fusion"; section: Section; item: string; c: string; v: string; options: string[] }
  | { t: "syllabe"; section: Section; item: string; options: string[] };

const rnd = <T,>(a: T[]): T => a[Math.floor(Math.random() * a.length)];

export function shuffle<T>(a: T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

const SPICE_VOWELS = ["a", "i", "o", "u", "é", "e"];

/**
 * Letter choices: the answer, the focus letter (always there), look-alikes, other known letters,
 * then common vowels to make it less obvious.
 */
function choices(s: Save, target: string, focus: string | null, n: number): string[] {
  const known = knownSounds(s);
  const out: string[] = [target];
  const add = (x?: string) => {
    if (x && GRAPHEME[x] && !out.includes(x) && out.length < n) out.push(x);
  };
  add(focus ?? undefined);
  shuffle((CONFUSE[target] ?? []).filter((x) => known.includes(x))).forEach(add);
  shuffle(known).forEach(add);
  shuffle(SPICE_VOWELS).forEach(add);
  return shuffle(out);
}

const optionCount = (lvl: number) => (lvl <= 2 ? 4 : 5);

function wordsWith(g: string, initial: boolean): Word[] {
  const p = GRAPHEME[g].phon;
  return WORDS.filter((w) => (initial ? w.s[0] === p : wordHas(w, p)));
}

function wordsWithout(g: string): Word[] {
  const p = GRAPHEME[g].phon;
  return WORDS.filter((w) => !wordHas(w, p) && !wordAmbiguous(w, p));
}

function ecoute(g: string, section: Section, item = gid(g)): Ex | null {
  const yes = Math.random() < 0.55;
  let word: Word | undefined;
  if (yes) {
    word = rnd(wordsWith(g, false));
  } else {
    const pool = wordsWithout(g);
    // Prefer words with a look-alike sound, to make the ear work.
    const near = pool.filter((w) => (CONFUSE[g] ?? []).some((x) => wordHas(w, GRAPHEME[x]?.phon ?? x)));
    word = rnd(near.length && Math.random() < 0.6 ? near : pool);
  }
  if (!word) return null;
  return { t: "ecoute", section, item, g, word, answer: yes };
}

function lettre(s: Save, g: string, focus: string | null, section: Section, bump = 0): Ex | null {
  const isC = GRAPHEME[g].kind === "c";
  const word = isC ? rnd(wordsWith(g, true)) : undefined;
  if (isC && !word) return null;
  return { t: "lettre", section, item: gid(g), g, word, options: choices(s, g, focus, optionCount(level(s, gid(g)) + bump)) };
}

/** Words where the sound is written exactly with this letter, and where it is. */
function completeWords(g: string): { word: Word; segs: Seg[]; gaps: number[] }[] {
  const gr = GRAPHEME[g];
  const out: { word: Word; segs: Seg[]; gaps: number[] }[] = [];
  for (const word of WORDS) {
    const segs = segment(word);
    if (!segs) continue;
    const gaps = segs.flatMap((sg, i) => (sg.text === gr.display && sg.phon === gr.phon ? [i] : []));
    if (gaps.length) out.push({ word, segs, gaps });
  }
  return out;
}

/** "Trouve le son i comme dans idée": drag the letter into the word's gap. */
function complete(s: Save, g: string, focus: string | null, section: Section, bump = 0): Ex | null {
  const pick = rnd(completeWords(g));
  if (!pick) return null;
  return {
    t: "complete",
    section,
    item: gid(g),
    g,
    word: pick.word,
    segs: pick.segs,
    gap: pick.gaps[0],
    options: choices(s, g, focus, optionCount(level(s, gid(g)) + bump)),
  };
}

/** "Trouve tous les a": a grid with 3 targets among other letters (the focus letter included). */
function hunt(s: Save, g: string, focus: string | null, section: Section): Ex {
  const others = choices(s, g, focus, 4).filter((x) => x !== g);
  const letters = [g, g, g];
  while (letters.length < 8) letters.push(others[letters.length % others.length]);
  return { t: "hunt", section, item: gid(g), g, letters: shuffle(letters) };
}

type SoundKind = "ecoute" | "lettre" | "complete" | "hunt";

/** A varied exercise for one sound (never the same kind twice in a row). */
function soundEx(s: Save, g: string, focus: string | null, section: Section, bump = 0, avoid?: string): Ex {
  const weights: [SoundKind, number][] = [
    ["complete", 40],
    ["ecoute", 25],
    ["hunt", 20],
    ["lettre", 15],
  ];
  const pool = weights.filter(([k]) => k !== avoid);
  let r = Math.random() * pool.reduce((n, [, w]) => n + w, 0);
  let kind: SoundKind = pool[0][0];
  for (const [k, w] of pool) {
    if ((r -= w) < 0) {
      kind = k;
      break;
    }
  }
  const make: Record<SoundKind, () => Ex | null> = {
    ecoute: () => ecoute(g, section),
    complete: () => complete(s, g, focus, section, bump),
    hunt: () => hunt(s, g, focus, section),
    lettre: () => lettre(s, g, focus, section, bump),
  };
  return make[kind]() ?? complete(s, g, focus, section, bump) ?? ecoute(g, section) ?? hunt(s, g, focus, section);
}

/**
 * A syllable exercise. Mostly "find the whole syllable" (« li » among « la », « lo », « mi »):
 * reading syllables at a glance is the goal. Building it letter by letter (fusion: L + ? = « li »)
 * comes now and then, only while the syllable is brand new.
 */
function sylEx(s: Save, id: string, section: Section, bump = 0): Ex {
  const { c, v } = parseSyl(id);
  const lvl = level(s, id) + bump;
  const fusion = (): Ex => {
    const vows = knownSounds(s).filter((x) => GRAPHEME[x].kind === "v" && x !== v && !GRAPHEME[c].noVowels?.includes(x));
    const near = (CONFUSE[v] ?? []).filter((x) => vows.includes(x));
    const others = [...near, ...shuffle(vows.filter((x) => !near.includes(x)))].slice(0, 2);
    return { t: "fusion", section, item: id, c, v, options: shuffle([v, ...others]) };
  };
  if (lvl <= 1 && Math.random() < 0.3) return fusion();

  // Wrong answers that look alike: same consonant first (la / li), then same vowel (la / ma), then any.
  const n = 3; // 4 choices from the start (« nu » among na / nu / lu / ni)
  const sameC = syllablesWith(s, c).filter((x) => x !== id && parseSyl(x).c === c);
  const sameV = syllablesWith(s, v).filter((x) => x !== id && parseSyl(x).v === v);
  const any = availableSyllables(s).filter((x) => x !== id);
  const pick: string[] = [];
  const take = (xs: string[], k: number) => {
    for (const x of shuffle(xs)) if (pick.length < k && !pick.includes(x)) pick.push(x);
  };
  take(sameC, Math.ceil(n / 2));
  take(sameV, n);
  take(sameC, n);
  take(any, n);
  if (!pick.length) return fusion(); // nothing to compare with yet
  return { t: "syllabe", section, item: id, options: shuffle([id, ...pick]) };
}

function itemEx(s: Save, id: string, focus: string | null, section: Section, bump = 0): Ex {
  return id.startsWith("g:") ? soundEx(s, id.slice(2), focus, section, bump) : sylEx(s, id, section, bump);
}

/** Pick review items: weak and not seen for a while come first. */
function pickReview(s: Save, pool: string[], n: number): string[] {
  const t = today();
  const scored = pool.map((id) => {
    const st = stat(s, id);
    const age = st.last ? daysBetween(st.last, t) : 7;
    const due = st.level >= CLEARED ? age >= 2 : true; // cleared letters still come back, less often
    return { id, score: (due ? 10 : 0) + (CLEARED - st.level) * 3 + Math.min(age, 14) + Math.random() * 4 };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, n).map((x) => x.id);
}

export function itemOf(e: Ex): string {
  return e.item;
}

/** Space out repeats of the same item. */
function spread(xs: Ex[]): Ex[] {
  const out: Ex[] = [];
  const rest = [...xs];
  while (rest.length) {
    const lastItem = out.length ? itemOf(out[out.length - 1]) : "";
    const i = rest.findIndex((e) => itemOf(e) !== lastItem);
    out.push(rest.splice(i < 0 ? 0 : i, 1)[0]);
  }
  return out;
}

/** True when a syllable is made with this letter. */
const sylHas = (id: string, g: string) => {
  const { c, v } = parseSyl(id);
  return c === g || v === g;
};

/** Syllables made with a letter and the letters already learned, even while that letter is new. */
function syllablesWith(s: Save, g: string): string[] {
  const ready = knownSounds(s).filter((x) => x !== g);
  const gr = GRAPHEME[g];
  if (gr.kind === "c") return ready.filter((v) => GRAPHEME[v].kind === "v" && !gr.noVowels?.includes(v)).map((v) => sid(g, v));
  return ready.filter((c) => GRAPHEME[c].kind === "c" && !GRAPHEME[c].noVowels?.includes(g)).map((c) => sid(c, g));
}

/**
 * A session of 11, mostly on the letter being worked on but mixed with the other known letters
 * (the parent's list), so the answer is never "always the same letter":
 * - Échauffement (2): other known letters and syllables.
 * - Entraînement (7): 6 on the letter being worked on (4 letter exercises + 2 syllables with it when
 *   there are some: la, lu… from its very first session), 1 on the other known letters.
 * - Défi (2): harder: one on the letter being worked on, one on the others.
 * About 7 of 11 on the letter, 4 on the others.
 */
export function buildSession(s: Save): Ex[] {
  const out: Ex[] = [];
  const f = focusSound(s);
  const learned = knownSounds(s).filter((g) => g !== f);
  const syls = availableSyllables(s);
  const pastSyls = f ? syls.filter((x) => !sylHas(x, f)) : syls;
  const pastPool = [...learned.map(gid), ...pastSyls];

  // 1. Échauffement — 2 things learned before (a syllable first when there are some)
  const warm = pastSyls.length >= 2 ? [...pickReview(s, pastSyls, 1), ...pickReview(s, learned.map(gid), 1)] : pickReview(s, pastPool, 2);
  out.push(...warm.map((id) => itemEx(s, id, f, "warm")));

  // 2. Entraînement
  const train: Ex[] = [];
  if (f) {
    // The letter being worked on: four times, in different exercises (the majority, with its syllables).
    for (let i = 0; i < 4; i++) train.push(soundEx(s, f, f, "train", 0, train[i - 1]?.t));
    // Two syllables with it: reading is blending, from the start.
    const focusSyls = syllablesWith(s, f);
    const fsyl = focusSyls.length ? pickReview(s, focusSyls, 2) : [];
    fsyl.forEach((id) => train.push(sylEx(s, id, "train")));
    for (let i = fsyl.length; i < 2; i++) train.push(soundEx(s, f, f, "train", 0, train[train.length - 1]?.t)); // 6 of 7 on the letter
    // The other known letters fill the rest (at least one), or more of the letter when it is the only one.
    const rest = Math.max(1, 7 - train.length);
    const past = pastPool.length ? pickReview(s, pastPool, rest) : [];
    past.forEach((id) => train.push(itemEx(s, id, f, "train")));
    for (let i = past.length; i < rest; i++) train.push(soundEx(s, f, f, "train"));
  }
  out.push(...spread(shuffle(train)));

  // 3. Défi — harder: one on the letter being worked on, one mixed
  if (f) {
    const fs = syllablesWith(s, f);
    out.push(fs.length && Math.random() < 0.5 ? sylEx(s, pickReview(s, fs, 1)[0], "defi", 2) : soundEx(s, f, f, "defi", 2));
  }
  const mixed = [...pastPool, ...(f ? [] : syls)];
  if (mixed.length) out.push(itemEx(s, pickReview(s, mixed, 1)[0], f, "defi", 2));
  else if (f) out.push(soundEx(s, f, f, "defi", 2));
  return out;
}

/**
 * A boss fight.
 * - Letter boss (easier): 6 questions, mostly on the letter just cleared, usual choices.
 * - Revision boss (harder): 12 questions over the last letters and everything before,
 *   with more choices and syllables when there are some.
 */
export function buildBoss(s: Save, fight: Fight): Ex[] {
  const f = focusSound(s);
  if (fight.kind === "letter" && fight.letter) {
    const g = fight.letter;
    const others = knownSounds(s).filter((x) => x !== g);
    const targets = shuffle([g, g, g, g, ...(others.length ? pickReview(s, others.map(gid), 2).map((x) => x.slice(2)) : [g, g])]);
    const out: Ex[] = [];
    targets.forEach((x, i) => out.push(soundEx(s, x, g, "boss", -2, out[i - 1]?.t))); // 4 choices: the easier fight
    return out;
  }
  const recent = (fight.letters ?? []).filter((g) => GRAPHEME[g]);
  const syls = availableSyllables(s);
  const recentItems = [...recent.map(gid), ...syls.filter((x) => recent.includes(parseSyl(x).c) || recent.includes(parseSyl(x).v))];
  const rest = [...knownSounds(s).map(gid), ...syls].filter((x) => !recentItems.includes(x));
  const a = pickReview(s, recentItems, 7);
  const b = pickReview(s, rest, 12 - a.length);
  const ids = [...a, ...b];
  while (ids.length < 12 && ids.length) ids.push(ids[ids.length % (a.length + b.length)]);
  return spread(shuffle(ids).map((id) => itemEx(s, id, f, "boss", 2)));
}

export function starsFor(ok: number, total: number): number {
  if (!total) return 1;
  const r = ok / total;
  return r >= 0.9 ? 3 : r >= 0.7 ? 2 : 1;
}
