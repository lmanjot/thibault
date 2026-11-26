// Lecture Z — the dragon balls won with diamond letters, and the dragons they call.
// The first 7 are the Earth's: Shenron grants one wish, the « Vol de Shenron » game (his own, not for sale).
// After that every set of 7 is from Namek: Porunga grants three wishes, chosen by the child.

import type { Save } from "./engine";
import { ITEM, SENZU_MAX, zeni, type GameKey } from "./shop";

export type Dragon = "shenron" | "porunga";

/** Which balls are being collected now: the Earth's until Shenron has been called once, then Namek's. */
export const ballSeries = (s: Save): "terre" | "namek" => ((s.progress.wishes ?? 0) >= 1 ? "namek" : "terre");

/** Shenron's game opens with his wish. */
export const volOpen = (s: Save) => (s.progress.wishes ?? 0) >= 1;

/**
 * One more ball (a diamond letter): with the seventh, the dragon of that series is called.
 * Returns the balls now held (7 when the dragon comes) and which dragon, if any.
 */
export function addBall(s: Save): { balls: number; series: "terre" | "namek"; dragon?: Dragon } {
  const series = ballSeries(s);
  const balls = (s.progress.letterBalls ?? 0) + 1;
  if (balls < 7) {
    s.progress.letterBalls = balls;
    return { balls, series };
  }
  s.progress.letterBalls = 0;
  if (series === "terre") {
    s.progress.wishes = (s.progress.wishes ?? 0) + 1;
    return { balls: 7, series, dragon: "shenron" };
  }
  s.progress.porunga = (s.progress.porunga ?? 0) + 1;
  s.progress.porungaLeft = (s.progress.porungaLeft ?? 0) + 3;
  return { balls: 7, series, dragon: "porunga" };
}

/** A dragon whose scene hasn't been seen yet (also the wish already won before this scene existed). */
export function pendingDragon(s: Save): Dragon | undefined {
  if ((s.progress.wishes ?? 0) > (s.progress.wishSeen ?? 0)) return "shenron";
  if ((s.progress.porungaLeft ?? 0) > 0) return "porunga";
  return undefined;
}

export function seeShenron(s: Save) {
  s.progress.wishSeen = s.progress.wishes ?? 0;
}

// ——— Porunga's wishes ———

export type WishId = "jeu" | "zeni" | "senzu" | "jeux" | "ami";

export interface WishOption {
  id: WishId;
  name: string; // also what Goku says when it is granted
  img: string;
}

export const PORUNGA_ZENI = 1000;
export const PORUNGA_FRIEND = "c-porunga";
/** Porunga's game, « Le vaisseau pour Namek »: a wish, never for sale. */
export const NAMEK_GAME_WISH = "w-namek";
export const namekOpen = (s: Save) => (s.progress.owned ?? []).includes(NAMEK_GAME_WISH);

const GAMES: GameKey[] = ["nuage", "kame", "bulles", "memoire", "route", "baton"];

/** The next level of each game not owned yet (level 2, then 3). */
function nextLevels(s: Save): string[] {
  const owned = s.progress.owned ?? [];
  return GAMES.map((g) => [2, 3].map((l) => `l-${g}-${l}`).find((id) => !owned.includes(id))).filter((id): id is string => !!id);
}

export const WISHES: Record<WishId, WishOption> = {
  jeu: { id: "jeu", name: "Un nouveau jeu : le vaisseau pour Namek !", img: "bg_namek.png" },
  zeni: { id: "zeni", name: "Une montagne de zénis !", img: "zeni" },
  senzu: { id: "senzu", name: "Des haricots magiques !", img: "senzu" },
  jeux: { id: "jeux", name: "Tous tes jeux plus forts !", img: "goku_kid_cloud.png" },
  ami: { id: "ami", name: "Polunga devient ton ami !", img: "porunga.png" },
};

/** What can still be wished for (one of each per visit; zénis always, so there is always a choice). */
export function wishOptions(s: Save, chosen: WishId[]): WishOption[] {
  const ok: Record<WishId, boolean> = {
    jeu: !namekOpen(s),
    zeni: true,
    senzu: (s.progress.senzu ?? 0) < SENZU_MAX,
    jeux: nextLevels(s).length > 0,
    ami: !(s.progress.owned ?? []).includes(PORUNGA_FRIEND),
  };
  const open = (Object.keys(WISHES) as WishId[]).filter((id) => ok[id] && !chosen.includes(id));
  return (open.length ? open : ["zeni" as WishId]).map((id) => WISHES[id]);
}

/** Grant one of Porunga's wishes (changes the save passed in). */
export function grantWish(s: Save, id: WishId) {
  if (id === "jeu") s.progress.owned = [...(s.progress.owned ?? []), NAMEK_GAME_WISH];
  if (id === "zeni") s.progress.zeni = zeni(s) + PORUNGA_ZENI;
  if (id === "senzu") s.progress.senzu = SENZU_MAX;
  if (id === "jeux") {
    const lv = nextLevels(s);
    s.progress.owned = [...(s.progress.owned ?? []), ...lv];
    // Each game plays at its new level (it can be set back in the games' shop tab).
    const levels = { ...(s.progress.levels ?? {}) };
    for (const l of lv) {
      const item = ITEM[l];
      if (item?.game && item.level) levels[item.game] = item.level;
    }
    s.progress.levels = levels;
  }
  if (id === "ami") {
    s.progress.owned = [...(s.progress.owned ?? []), PORUNGA_FRIEND];
    s.progress.equip = { ...(s.progress.equip ?? {}), companion: PORUNGA_FRIEND };
  }
  s.progress.porungaLeft = Math.max(0, (s.progress.porungaLeft ?? 0) - 1);
}
