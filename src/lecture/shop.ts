// Lecture Z — zénis (coins) and Bulma's shop.
//
// Strategy:
// - Zénis are earned only by reading. Harder exercises pay more, and so does getting it right
//   the first time, so effort is what earns.
// - Goku's transformations can't be bought: he grows stronger by himself, one step per letter
//   cleared, in story order (kid Goku → staff → cloud → Kamehameha → grown up → … → Ultra
//   Instinct → the 7 Dragon Balls → Shenron). Learning is the main progression.
// - Zénis buy everything around him, and that follows the same timeline: friends and places
//   appear once Goku has reached their era (Vegeta after the Saiyans arrive, Trunks once he is
//   Super Saiyan…), so the shop grows with him.
// - Prices: a session earns about 30–45 zénis. Something small is affordable every 2–3 sessions
//   and the big items take a couple of weeks, so there is always a near goal and a far goal.
// - Senzu beans (+15 s on a mini-game) are cheap, but capped so they don't replace reading.

import { FORMS, type Form } from "./content";
import { MASTERED, type Ex, type Save } from "./engine";

/** Zénis for a right answer, by exercise difficulty. */
const PAY: Record<Ex["t"], number> = { ecoute: 2, hunt: 3, lettre: 3, complete: 4, fusion: 4, syllabe: 5, trace: 4 };

export function zeniFor(ex: Ex, firstTry: boolean, boss: boolean): number {
  const base = firstTry ? PAY[ex.t] : 1;
  return boss ? base * 2 : base;
}

export const SESSION_BONUS = 5;
export const PERFECT_BONUS = 10;
/** No mistake at all (every answer right the first time): blue stars, and the secret game. */
export const FLAWLESS_BONUS = 20;
export const LETTER_BONUS = 25;
/** A letter's gold round finished (3 more good sessions after clearing it). */
export const GOLD_BONUS = 60;
/** Its diamond round finished: a dragon ball too. */
export const DIAMOND_BONUS = 100;
/** Seven dragon balls from diamond letters: Shenron's wish. */
export const WISH_BONUS = 500;
export const LETTER_BOSS_BONUS = 15;
export const REVISION_BOSS_BONUS = 40;
/** A revision fight he chooses himself (a rematch): harder, and it pays well. */
export const PRACTICE_BOSS_BONUS = 30;

export type ItemKind = "companion" | "scene" | "aura" | "game" | "level" | "senzu";

/** Steps of Goku's ladder (index in FORMS) when things appear in the story. */
export const ERA = { kid: 0, grown: 4, saiyans: 5, namek: 7, ssj: 8, cell: 10, buu: 11, gods: 12, blue: 13, ui: 14 } as const;

export interface ShopItem {
  id: string;
  kind: ItemKind;
  name: string;
  price: number;
  img?: string; // dbz asset
  imgKid?: string; // how this friend looks while Goku is still young
  color?: string; // aura color
  game?: GameKey;
  level?: number;
  era?: number; // Goku must have reached this step of the ladder
  diamond?: number; // a legend: not for sale, joins at this many letters in diamond (1, 2, 3…)
}

export type GameKey = "nuage" | "kame" | "bulles" | "memoire" | "route" | "baton";

export const SENZU_MAX = 5;
export const SENZU_SECONDS = 15;

export const ITEMS: ShopItem[] = [
  // Friends, in the order they join Goku's story.
  { id: "c-bulma", kind: "companion", name: "Bulma", price: 50, img: "bulma.png", imgKid: "bulma_kid.png", era: ERA.kid },
  { id: "c-yamcha", kind: "companion", name: "Yamcha", price: 70, img: "yamcha.png", era: ERA.kid },
  { id: "c-roshi", kind: "companion", name: "Tortue Géniale", price: 80, img: "roshi.png", era: ERA.kid },
  { id: "c-krillin", kind: "companion", name: "Krilin", price: 60, img: "krillin.png", imgKid: "krillin_kid.png", era: ERA.kid },
  { id: "c-gohan", kind: "companion", name: "Gohan", price: 120, img: "gohan.png", era: ERA.grown },
  { id: "c-piccolo", kind: "companion", name: "Piccolo", price: 150, img: "piccolo_jr.png", era: ERA.grown },
  { id: "c-vegeta", kind: "companion", name: "Vegeta", price: 250, img: "vegeta_new.png", era: ERA.saiyans },
  { id: "c-trunks", kind: "companion", name: "Trunks", price: 300, img: "trunks.png", era: ERA.ssj },
  { id: "c-vegeta-ssj", kind: "companion", name: "Vegeta Super Saiyan", price: 280, img: "vegeta_ssj.png", era: ERA.ssj },
  { id: "c-c18", kind: "companion", name: "C-18", price: 300, img: "c18.png", era: ERA.cell },
  { id: "c-boo", kind: "companion", name: "Boo", price: 320, img: "buu_fat.png", era: ERA.buu },
  { id: "c-whis", kind: "companion", name: "Whis", price: 350, img: "whis.png", era: ERA.gods },
  { id: "c-vegeta-god", kind: "companion", name: "Vegeta God", price: 380, img: "vegeta_god.png", era: ERA.gods },
  { id: "c-beerus", kind: "companion", name: "Beerus", price: 420, img: "beerus.png", era: ERA.gods },
  { id: "c-vegeta-blue", kind: "companion", name: "Vegeta Blue", price: 400, img: "vegeta_blue.png", era: ERA.blue },
  { id: "c-granola", kind: "companion", name: "Granola", price: 450, img: "granola.png", era: ERA.ui },

  // Legends: never for sale, one joins Goku for each letter he brings to diamond.
  ...[
    ["c17", "C-17", "c17.png"],
    ["kidboo", "Kid Boo", "buu_kid.png"],
    ["freezer", "Freezer", "frieza_new.png"],
    ["cell", "Cell parfait", "cell_new.png"],
    ["broly", "Broly", "broly.png"],
    ["jiren", "Jiren", "jiren.png"],
    ["black", "Goku Black", "goku_black.png"],
    ["broly-ssj", "Broly Super Saiyan", "broly_ssj.png"],
    ["superboo", "Super Boo", "buu_majin.png"],
    ["dabura", "Dabura", "dabura.png"],
    ["raditz", "Raditz", "raditz.png"],
    ["nappa", "Nappa", "nappa.png"],
  ].map(([id, name, img], i): ShopItem => ({ id: `d-${id}`, kind: "companion", name, price: 0, img, diamond: i + 1 })),

  // Places, in story order.
  { id: "s-papaya", kind: "scene", name: "Île Papaya", price: 0, img: "bg_papaya.png", era: ERA.kid },
  { id: "s-road", kind: "scene", name: "Le chemin du Serpent", price: 80, img: "bg_road.png", era: ERA.saiyans },
  { id: "s-desert", kind: "scene", name: "Le combat des Saiyans", price: 80, img: "bg_desert.png", era: ERA.saiyans },
  { id: "s-namek", kind: "scene", name: "Namek", price: 120, img: "bg_namek.png", era: ERA.namek },
  { id: "s-cell", kind: "scene", name: "L'arène de Cell", price: 150, img: "bg_cell.png", era: ERA.cell },
  { id: "s-gods", kind: "scene", name: "La planète des dieux", price: 200, img: "bg_gods.png", era: ERA.gods },

  { id: "a-blue", kind: "aura", name: "Aura bleue", price: 70, color: "rgba(60, 170, 255, 0.85)" },
  { id: "a-green", kind: "aura", name: "Aura verte", price: 70, color: "rgba(70, 220, 120, 0.85)" },
  { id: "a-purple", kind: "aura", name: "Aura violette", price: 100, color: "rgba(170, 90, 255, 0.85)" },
  { id: "a-pink", kind: "aura", name: "Aura rose", price: 100, color: "rgba(255, 110, 200, 0.85)" },
  { id: "a-gold", kind: "aura", name: "Aura dorée", price: 200, color: "rgba(255, 215, 60, 1)", era: ERA.ssj },

  // Mini-games: unlocked by clearing letters, or bought earlier.
  { id: "g-kame", kind: "game", name: "Kaméhaméha", price: 120, img: "saibaman.png", game: "kame" },
  { id: "g-bulles", kind: "game", name: "Boules magiques", price: 180, img: "kikoha.png", game: "bulles" },
  { id: "g-memoire", kind: "game", name: "Memory des amis", price: 220, img: "bulma_kid.png", game: "memoire" },
  { id: "g-route", kind: "game", name: "Route du Serpent", price: 260, img: "goku.png", game: "route" },
  { id: "g-baton", kind: "game", name: "Bâton magique", price: 300, img: "goku_kid_staff.png", game: "baton" },

  ...(["nuage", "kame", "bulles", "memoire", "route", "baton"] as GameKey[]).flatMap((game) =>
    [2, 3].map((level) => ({ id: `l-${game}-${level}`, kind: "level" as const, name: `Niveau ${level}`, price: level === 2 ? 100 : 200, game, level })),
  ),

  { id: "senzu", kind: "senzu", name: "Haricot magique", price: 25 },
];

export const ITEM: Record<string, ShopItem> = Object.fromEntries(ITEMS.map((i) => [i.id, i]));

/** Mini-games unlock as letters are cleared (shown locked before, with when). */
export const GAME_UNLOCK: Record<GameKey, number> = { nuage: 0, kame: 1, bulles: 2, memoire: 3, route: 4, baton: 5 };

// ——— Wallet and inventory (functions change the save passed in) ———

export const zeni = (s: Save) => s.progress.zeni ?? 0;

/** Goku's current step on the ladder: one step per letter cleared. */
export const formStep = (s: Save) => Math.min(s.progress.cleared?.length ?? 0, FORMS.length - 1);

/** Whether Goku has reached the era an item belongs to. */
export const inEra = (s: Save, item: ShopItem) => formStep(s) >= (item.era ?? 0);

/** A mini-game is open once enough letters are cleared, or once bought. */
export const gameOpen = (s: Save, g: GameKey) => (s.progress.cleared?.length ?? 0) >= GAME_UNLOCK[g] || owns(s, `g-${g}`);
export const owns = (s: Save, id: string) => {
  const d = ITEM[id]?.diamond;
  if (d) return diamondLetters(s) >= d;
  return ITEM[id]?.price === 0 || (s.progress.owned ?? []).includes(id);
};

/** How many letters are in diamond (all their dots done). */
export const diamondLetters = (s: Save) =>
  Object.entries(s.progress.items).filter(([id, st]) => id.startsWith("g:") && st.level >= MASTERED).length;

/** The legends, in the order they join. */
export const LEGENDS = ITEMS.filter((i) => i.diamond).sort((a, b) => a.diamond! - b.diamond!);

/** The legend who joined between two saves (a letter just reached diamond), if any. */
export function newLegend(before: Save, after: Save): ShopItem | undefined {
  const n = diamondLetters(after);
  return n > diamondLetters(before) ? LEGENDS[n - 1] : undefined;
}

export function canBuy(s: Save, item: ShopItem): boolean {
  if (item.diamond) return false;
  if (item.kind === "senzu") return (s.progress.senzu ?? 0) < SENZU_MAX && zeni(s) >= item.price;
  if (owns(s, item.id) || zeni(s) < item.price || !inEra(s, item)) return false;
  if (item.kind === "game" && item.game) return !gameOpen(s, item.game);
  // A game level needs the game open and the level below.
  if (item.kind === "level" && item.game && item.level)
    return gameOpen(s, item.game) && (item.level === 2 || owns(s, `l-${item.game}-${item.level - 1}`));
  return true;
}

export function buy(s: Save, item: ShopItem): boolean {
  if (!canBuy(s, item)) return false;
  s.progress.zeni = zeni(s) - item.price;
  if (item.kind === "senzu") s.progress.senzu = (s.progress.senzu ?? 0) + 1;
  else {
    s.progress.owned = [...(s.progress.owned ?? []), item.id];
    equip(s, item);
  }
  return true;
}

/** Put on (or take off) an owned item; a bought level becomes the game's level. */
export function equip(s: Save, item: ShopItem) {
  const e = { ...(s.progress.equip ?? {}) };
  if (item.kind === "companion") e.companion = e.companion === item.id ? undefined : item.id;
  if (item.kind === "scene") e.scene = item.id;
  if (item.kind === "aura") e.aura = e.aura === item.id ? undefined : item.id;
  if (item.kind === "level" && item.game && item.level) s.progress.levels = { ...(s.progress.levels ?? {}), [item.game]: item.level };
  s.progress.equip = e;
}

export const equipped = (s: Save, kind: "companion" | "scene" | "aura") => {
  const id = s.progress.equip?.[kind];
  return id ? ITEM[id] : undefined;
};

/** Who fights the bosses and plays Kaméhaméha: Goku (as he is now), or a friend bought in the shop. */
export interface Fighter {
  id?: string; // undefined = Goku
  name: string;
  img: string;
}

export function fighters(s: Save, form: Form): Fighter[] {
  const friends = ITEMS.filter((i) => i.kind === "companion" && i.img && owns(s, i.id)).map((i) => ({
    id: i.id,
    name: i.name,
    img: (form.kid && i.imgKid) || i.img!,
  }));
  return [{ name: "Goku", img: form.sprite }, ...friends];
}

export function fighterOf(s: Save, form: Form): Fighter {
  const all = fighters(s, form);
  return all.find((f) => f.id && f.id === s.progress.equip?.fighter) ?? all[0];
}

export function chooseFighter(s: Save, id?: string) {
  s.progress.equip = { ...(s.progress.equip ?? {}), fighter: id };
}

export const gameLevel = (s: Save, g: GameKey) => s.progress.levels?.[g] ?? 1;
