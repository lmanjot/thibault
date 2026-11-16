"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ASSET, attackFor, bossFor, formFor, GRAPHEME, rematchFor, type Boss } from "../content";
import {
  activeTarget,
  nextFight,
  practiceFight,
  lettersToRevision,
  type Fight,
  buildBoss,
  buildSession,
  focusSound,
  gid,
  level,
  loadSave,
  applySession,
  clearedList,
  isCleared,
  starsFor,
  startLetter,
  upcomingLetters,
  roundOf,
  storeSave,
  type Ex,
  type Save,
} from "../engine";
import { loadRecordings, loadVoice, namePart, sfx, soundPart, speak, stopSpeech } from "../audio";
import { pullNewer, pushSave } from "../sync";
import { L } from "../voice";
import { Session, type SessionResult } from "./Session";
import { Parent } from "./Parent";
import { DragonBall, FighterPicker, Goku, Icon, Pips, Stars, Zeni } from "./bits";
import { MINI_GAMES, MiniGame, SECRET_GAME, type GameId } from "./games";
import { Shop } from "./Shop";
import { chooseFighter, DIAMOND_BONUS, FLAWLESS_BONUS, equipped, fighterOf, fighters, formStep, GAME_UNLOCK, gameLevel, gameOpen, GOLD_BONUS, ITEM, LETTER_BONUS, WISH_BONUS, LETTER_BOSS_BONUS, PERFECT_BONUS, PRACTICE_BOSS_BONUS, REVISION_BOSS_BONUS, SENZU_SECONDS, SESSION_BONUS, zeni } from "../shop";
import "../lecture.css";

type Screen =
  | { s: "home" }
  | { s: "versus"; boss: Boss; fight: Fight }
  | { s: "session"; exercises: Ex[]; boss?: Boss; fight?: Fight }
  | { s: "result"; stars: number; earned: number; boss?: Boss; cleared: string[]; medal?: Medal; perfect?: boolean; secret?: boolean }
  | { s: "reward"; letters: string[] }
  | { s: "bonus"; game?: GameId; cleared: string[]; extra?: number }
  | { s: "shop" }
  | { s: "parent" };

const noop = () => () => {};

/** Progress lives in localStorage, so render only in the browser. */
export default function LectureApp({ fontClass }: { fontClass: string }) {
  const isClient = useSyncExternalStore(noop, () => true, () => false);
  return isClient ? <Game fontClass={fontClass} /> : <div className={`lz ${fontClass}`} />;
}

function Game({ fontClass }: { fontClass: string }) {
  const [save, setSave] = useState<Save>(loadSave);
  const [screen, setScreen] = useState<Screen>(() => {
    // Dev shortcut to try a mini-game directly: /lecture?jeu=nuage
    const jeu = process.env.NODE_ENV === "development" ? new URLSearchParams(location.search).get("jeu") : null;
    if (jeu === "choix") return { s: "bonus", cleared: [] }; // the game picker
    // /lecture?jeu=trace: drawing letters (a, e, u, ch).
    if (jeu === "trace")
      return { s: "session", exercises: ["a", "e", "u", "ch"].map((g) => ({ t: "trace", section: "train", item: `g:${g}`, g }) as Ex) };
    // /lecture?jeu=or, ?jeu=diamant, ?jeu=voeu: the result screen with a gold or diamond letter.
    if (jeu === "parfait") return { s: "result", stars: 3, earned: 95, cleared: [], perfect: true, secret: true };
    if (jeu === "or" || jeu === "diamant" || jeu === "voeu")
      return { s: "result", stars: 3, earned: 160, cleared: [], medal: { letter: "a", kind: jeu === "or" ? "or" : "diamant", balls: 3, wish: jeu === "voeu" } };
    return MINI_GAMES.some((g) => g.id === jeu) || jeu === SECRET_GAME.id ? { s: "bonus", game: jeu as GameId, cleared: [] } : { s: "home" };
  });

  useEffect(() => {
    loadRecordings();
    loadVoice();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    // --vh = 1% of the height really visible. Tablet and phone browsers count "100vh" without their
    // toolbar, which cut off the bottom of the screen; every size in lecture.css uses --vh instead.
    const vv = window.visualViewport;
    const setVh = () => document.documentElement.style.setProperty("--vh", `${(vv?.height ?? window.innerHeight) / 100}px`);
    setVh();
    vv?.addEventListener("resize", setVh);
    window.addEventListener("resize", setVh);
    window.addEventListener("orientationchange", setVh);
    // Some browsers (Windows tablets) resize the window without a timely resize event: watch the page too.
    const ro = new ResizeObserver(setVh);
    ro.observe(document.documentElement);
    return () => {
      ro.disconnect();
      document.documentElement.style.overflow = prev;
      vv?.removeEventListener("resize", setVh);
      window.removeEventListener("resize", setVh);
      window.removeEventListener("orientationchange", setVh);
      stopSpeech();
    };
  }, []);

  function update(s: Save) {
    const copy = structuredClone(s);
    copy.updatedAt = Date.now();
    storeSave(copy);
    setSave(copy);
    pushSave(copy, adopt); // shared with the other devices using the same code
  }

  /** Take a newer save from another device (only between games, never in the middle of one). */
  function adopt(remote: Save) {
    storeSave(remote);
    setSave(remote);
  }

  // When the game opens or comes back to the screen, take the progress made on another device.
  const screenRef = useRef(screen.s);
  useEffect(() => {
    screenRef.current = screen.s;
  });
  useEffect(() => {
    const check = () => {
      if (document.visibilityState !== "visible" || screenRef.current !== "home") return;
      pullNewer(loadSave()).then((remote) => remote && screenRef.current === "home" && adopt(remote));
    };
    check();
    document.addEventListener("visibilitychange", check);
    return () => document.removeEventListener("visibilitychange", check);
  }, []);

  const { form } = formFor(formStep(save));
  const fighter = fighterOf(save, form);
  const pickFighter = (id?: string) => {
    const s = structuredClone(save);
    chooseFighter(s, id);
    update(s);
    sfx.tap();
  };
  const fontMode = save.settings.font === "cursive" ? "font-cursive" : "font-script";
  const aura = equipped(save, "aura");

  function start() {
    sfx.unlock();
    setScreen({ s: "session", exercises: buildSession(save!) });
  }

  function startBoss() {
    const fight = nextFight(save);
    if (!fight) return;
    sfx.unlock();
    const boss = bossFor(formStep(save), fight.kind, save.progress.beaten);
    setScreen({ s: "versus", boss, fight });
    speak([boss.name, L.attacks]);
  }

  /** A revision fight he chooses: a rematch against a boss already met, harder, more zénis. */
  function startPractice() {
    sfx.unlock();
    const boss = rematchFor(formStep(save), save.progress.beaten, save.progress.practices ?? 0);
    setScreen({ s: "versus", boss, fight: practiceFight(save) });
    speak([boss.name, L.attacks]);
  }

  /** Back home, through the reward scene when a letter was just cleared. */
  function leave(cleared: string[]) {
    stopSpeech();
    if (cleared.length) {
      sfx.power();
      setScreen({ s: "reward", letters: cleared });
      speak([L.letterDone, soundPart(cleared[cleared.length - 1]), L.newPower, form.name, form.story]);
    } else setScreen({ s: "home" });
  }

  function finish(r: SessionResult, boss?: Boss, fight?: Fight) {
    const s = structuredClone(save!);
    // In a letter boss, that letter is the one being worked on; a revision clears nothing new.
    const worked = fight ? (fight.letter ?? null) : focusSound(save);
    const before = worked ? roundOf(level(save, gid(worked))) : null;
    const cleared = applySession(s, r.answers, worked);
    // A gold or diamond round finished (3 more dots): a big bonus, and a dragon ball for diamond.
    const after = worked ? roundOf(level(s, gid(worked))) : null;
    const roundDone = !!before && !!after && isCleared(save, worked!) && (after.round > before.round || (after.dots === 3 && before.dots < 3));
    let medal: Medal | undefined;
    let medalBonus = 0;
    if (roundDone && worked) {
      const kind = doneRound(level(s, gid(worked))) === 2 ? "diamant" : "or";
      medal = { letter: worked, kind };
      medalBonus = kind === "or" ? GOLD_BONUS : DIAMOND_BONUS;
      if (kind === "diamant") {
        const balls = (s.progress.letterBalls ?? 0) + 1;
        medal.balls = balls;
        if (balls >= 7) {
          medal.wish = true;
          medalBonus += WISH_BONUS;
          s.progress.wishes = (s.progress.wishes ?? 0) + 1;
          s.progress.letterBalls = 0;
        } else s.progress.letterBalls = balls;
      }
    }
    const stars = starsFor(r.ok, r.total);
    // Not a single mistake: blue stars, and the secret game (after training or a letters challenge).
    const perfect = r.total > 0 && r.ok === r.total && r.answers.every((a) => a.ok);
    const secret = perfect && (!boss || !!fight?.target);
    // Zénis: the answers, plus a bonus for finishing, for a perfect session and for each letter cleared.
    const bossBonus = fight ? (fight.practice ? PRACTICE_BOSS_BONUS : fight.kind === "revision" ? REVISION_BOSS_BONUS : LETTER_BOSS_BONUS) : 0;
    const earned = r.zeni + SESSION_BONUS + (stars === 3 ? PERFECT_BONUS : 0) + (perfect ? FLAWLESS_BONUS : 0) + cleared.length * LETTER_BONUS + medalBonus + bossBonus;
    s.progress.zeni = zeni(s) + earned;
    if (fight?.practice) {
      s.progress.practices = (s.progress.practices ?? 0) + 1; // next time, another opponent
    } else if (boss) {
      s.progress.bosses += 1;
      s.progress.fights = (s.progress.fights ?? []).slice(1); // that boss is beaten
      s.progress.beaten = [...(s.progress.beaten ?? []), boss.name];
    }
    update(s);
    setScreen({ s: "result", stars, earned, boss, cleared, medal, perfect, secret });
    if (medal || perfect) sfx.power();
    speak(
      medal
        ? medal.wish
          ? [L.diamondDone, L.wish]
          : [medal.kind === "or" ? L.goldDone : L.diamondDone]
        : boss
          ? [boss.name, L.beaten, ...(perfect ? [L.flawless] : []), ...(secret ? [L.secretOpen] : [])]
          : perfect
            ? [L.flawless, ...(secret ? [L.secretOpen] : [])]
            : [stars === 3 ? L.perfect : L.trainingDone],
    );
  }

  return (
    <div
      className={`lz ${fontClass} ${fontMode} ${aura ? "has-aura" : ""}`}
      style={aura?.color ? ({ ["--aura-custom" as string]: aura.color } as React.CSSProperties) : undefined}
    >
      {screen.s === "home" && (
        <Home
          save={save}
          onTrain={start}
          onBoss={startBoss}
          onPractice={startPractice}
          onParent={() => {
            stopSpeech();
            setScreen({ s: "parent" });
          }}
          onPick={(g) => {
            const s = structuredClone(save);
            startLetter(s, g); // a known letter (new letters are added by the parent)
            update(s);
          }}
          onShop={() => {
            stopSpeech();
            setScreen({ s: "shop" });
          }}
        />
      )}

      {screen.s === "versus" && (
        <div className="lz-versus" style={{ backgroundImage: `url(${ASSET(screen.boss.bg)})` }}>
          <div className="lz-vs-row">
            <Goku form={form} size="lg" as={fighter} />
            <span className="lz-vs">VS</span>
            <div className={`lz-boss lz-boss-big fx-${screen.boss.fx ?? "none"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET(screen.boss.sprite)} alt={screen.boss.name} />
            </div>
          </div>
          <p className="lz-reward-kicker lz-vs-kind">
            {screen.fight.target
              ? `Défi des lettres ${targetLabel(screen.fight.letters)} · zénis ×3`
              : screen.fight.practice
              ? "Combat de révision · zénis ×3"
              : screen.fight.kind === "revision"
                ? "Grande révision"
                : `Boss de la lettre ${GRAPHEME[screen.fight.letter ?? ""]?.display ?? ""}`}
          </p>
          <h2 className="lz-title-sm">{screen.boss.name}</h2>
          <FighterPicker options={fighters(save, form)} current={fighter.id} onPick={pickFighter} />
          <div className="lz-row">
            <button className="lz-round" onClick={() => setScreen({ s: "home" })} aria-label="Retour">
              <Icon name="back" />
            </button>
            <button
              className="lz-cta lz-cta-boss"
              onClick={() => setScreen({ s: "session", exercises: buildBoss(save, screen.fight), boss: screen.boss, fight: screen.fight })}
            >
              <Icon name="fist" size={34} /> Combattre !
            </button>
          </div>
        </div>
      )}

      {screen.s === "session" && (
        <Session
          exercises={screen.exercises}
          form={form}
          fighter={fighter}
          step={formStep(save)}
          boss={screen.boss}
          onExit={() => setScreen({ s: "home" })}
          onDone={(r) => finish(r, screen.boss, screen.fight)}
        />
      )}

      {screen.s === "result" && (
        <div className="lz-result">
          <div className="lz-panel">
            <h2 className="lz-title-sm">{screen.boss ? "Victoire !" : "Bravo !"}</h2>
            <Stars n={screen.stars} size={72} perfect={screen.perfect} />
            {screen.perfect && <p className="lz-flawless">Sans-faute !</p>}
            {screen.medal && <MedalBanner medal={screen.medal} />}
            <p className="lz-kigain">
              +{screen.earned} <Zeni size={40} />
            </p>
            {screen.secret && (
              <button
                className="lz-cta lz-cta-secret"
                onClick={() => {
                  stopSpeech();
                  sfx.unlock();
                  setScreen({ s: "bonus", game: SECRET_GAME.id, cleared: screen.cleared });
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ASSET(SECRET_GAME.img)} alt="" /> Jeu secret : {SECRET_GAME.name}
              </button>
            )}
            <div className="lz-row">
              <button
                className="lz-cta lz-cta-alt"
                onClick={() => {
                  stopSpeech();
                  setScreen({ s: "bonus", cleared: screen.cleared });
                }}
              >
                <Icon name="play" size={30} /> Jeu bonus
              </button>
              <button className="lz-round" aria-label="Continuer" onClick={() => leave(screen.cleared)}>
                <Icon name="arrow" />
              </button>
            </div>
          </div>
        </div>
      )}

      {screen.s === "reward" && (
        <div className="lz-transform">
          <div className="lz-flash" />
          <Goku form={form} size="lg" state="cheer" />
          <div className="lz-reward">
            <div className="lz-reward-letters">
              {screen.letters.map((g) => (
                <span key={g} className="lz-read">
                  {GRAPHEME[g]?.display}
                </span>
              ))}
            </div>
            <p className="lz-reward-kicker">Nouveau pouvoir</p>
            <h2 className="lz-title-sm">{form.name}</h2>
            <p className="lz-reward-story">{form.story}</p>
            <p className="lz-kigain lz-reward-zeni">
              +{LETTER_BONUS * screen.letters.length} <Zeni size={34} />
            </p>
            <button className="lz-round" onClick={() => setScreen({ s: "home" })} aria-label="Continuer">
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      )}

      {screen.s === "bonus" && (
        <Bonus
          save={save}
          game={screen.game}
          extra={screen.extra ?? 0}
          letters={save.settings.classSounds.filter((g) => GRAPHEME[g] && level(save, gid(g)) >= 1)}
          fighter={fighter}
          onFighter={pickFighter}
          onPick={(g, senzu) => {
            if (senzu) {
              const s = structuredClone(save);
              s.progress.senzu = Math.max(0, (s.progress.senzu ?? 0) - 1);
              update(s);
            }
            setScreen({ s: "bonus", game: g, cleared: screen.cleared, extra: senzu ? SENZU_SECONDS : 0 });
          }}
          onDone={() => leave(screen.cleared)}
        />
      )}

      {screen.s === "shop" && (
        <Shop save={save} onChange={update} onClose={() => setScreen({ s: "home" })} />
      )}

      {screen.s === "parent" && <Parent save={save} onChange={update} onClose={() => setScreen({ s: "home" })} />}
    </div>
  );
}

function Home({
  save,
  onTrain,
  onBoss,
  onPractice,
  onParent,
  onPick,
  onShop,
}: {
  save: Save;
  onTrain: () => void;
  onBoss: () => void;
  onPractice: () => void;
  onParent: () => void;
  onPick: (g: string) => void;
  onShop: () => void;
}) {
  const { form, next } = formFor(formStep(save));
  const fight = nextFight(save);
  const boss = fight ? bossFor(formStep(save), fight.kind, save.progress.beaten) : undefined;
  const toRevision = lettersToRevision(save);
  const target = activeTarget(save);
  const rematch = rematchFor(formStep(save), save.progress.beaten, save.progress.practices ?? 0);
  const week = save.settings.weekSounds.filter((g) => GRAPHEME[g]);
  const focus = focusSound(save);
  const letters = save.settings.classSounds.filter((g) => GRAPHEME[g]); // same order as in the parent settings
  // The gauge follows the current letter's dots: green (clearing it brings the next power), then yellow, then red.
  const focusRound = focus ? roundOf(level(save, gid(focus))) : { round: 0, dots: 0 };
  const gauge = focus ? focusRound.dots / 3 : next ? 0 : 1;
  const roundName = ["", "or", "diamant"][focusRound.round];
  const companion = equipped(save, "companion");

  // Shrink the home column when the screen is too short for it (Windows tablets with the browser bar,
  // small laptops): every button, the boss one included, must stay on screen without scrolling.
  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const fit = () => {
      el.style.zoom = "";
      if (getComputedStyle(el).display === "contents") return; // phone portrait: one column, scrolls
      const avail = el.parentElement!.clientHeight; // the column's own padding keeps the tablet bottom margin
      const need = el.scrollHeight;
      if (need > avail) el.style.zoom = String(Math.max(0.55, avail / need));
    };
    fit();
    document.fonts?.ready.then(fit);
    // The screen's size, and the column's own (sizes follow --vh); the fit ends on the same zoom, so no loop.
    const ro = new ResizeObserver(fit);
    ro.observe(el.parentElement!);
    for (const c of el.children) ro.observe(c);
    return () => ro.disconnect();
  });

  return (
    <div className="lz-home" style={{ backgroundImage: `url(${ASSET(equipped(save, "scene")?.img ?? "bg_papaya.png")})` }}>
      <div className="lz-home-shade" />
      <div className={`lz-home-hero ${companion?.img ? "has-companion" : ""}`}>
        <Goku form={form} size="lg" />
        {companion?.img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="lz-companion" src={ASSET((form.kid && companion.imgKid) || companion.img)} alt={companion.name} />
        )}
      </div>
      <div className="lz-home-main" ref={mainRef}>
        <h1 className="lz-brand">
          Lecture <span>Z</span>
        </h1>
        <div className="lz-power">
          <span className="lz-formname">{form.name}</span>
          <div className={`lz-gauge round-${focusRound.round}`}>
            <div style={{ width: `${Math.round(gauge * 100)}%` }} />
          </div>
          <span className="lz-hint-kid">
            {focus && focusRound.round > 0 ? (
              <>Points {roundName} · lettre {GRAPHEME[focus]?.display ?? ""}</>
            ) : next ? (
              <>
                Prochain pouvoir : {next.name}{focus ? ` · réussis la lettre ${GRAPHEME[focus]?.display ?? ""}` : ""}
              </>
            ) : (
              "Puissance maximale !"
            )}
          </span>
        </div>

        {letters.length > 0 && (
          <div className="lz-weekrow" role="radiogroup" aria-label="Lettre à travailler">
            {letters.map((g) => (
              <button
                key={g}
                role="radio"
                aria-checked={g === focus}
                className={`lz-weektile ${g === focus ? "is-focus" : ""} ${week.includes(g) ? "is-week" : ""} ${isCleared(save, g) ? "is-cleared" : ""}`}
                onClick={() => {
                  sfx.tap();
                  onPick(g);
                  speak([namePart(g)]);
                }}
              >
                {isCleared(save, g) ? (
                  <span className={`lz-week-star is-done round-${doneRound(level(save, gid(g)))}`}>✓</span>
                ) : (
                  week.includes(g) && <span className="lz-week-star">★</span>
                )}
                <span className="lz-read">{GRAPHEME[g].display}</span>
                <Pips level={level(save, gid(g))} />
              </button>
            ))}
            {/* The next letter of the usual order, locked: only the parent adds letters. */}
            {upcomingLetters(save, 1).map((g) => (
              <span key={g} className="lz-weektile is-upcoming is-locked" aria-label={`Bientôt : ${GRAPHEME[g].display}`}>
                <span className="lz-week-star is-new">
                  <Icon name="lock" size={16} />
                </span>
                <span className="lz-read">{GRAPHEME[g].display}</span>
              </span>
            ))}
          </div>
        )}

        <div className="lz-actions">
          <button className="lz-cta" onClick={onTrain}>
            <Icon name="fist" size={38} /> S&apos;entraîner
          </button>
          <button className="lz-cta lz-cta-shop" onClick={onShop} aria-label="Boutique de Bulma">
            <span className="lz-capsule" /> <Zeni size={30} /> {zeni(save)}
          </button>
          {fight && boss && (
            <button className={`lz-cta lz-cta-boss ${fight.kind === "revision" ? "is-revision" : ""}`} onClick={onBoss}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET(boss.sprite)} alt="" className="lz-cta-face" />
              {fight.kind === "revision" ? "Révision" : "Boss"} : {boss.name}
            </button>
          )}
          {/* The targeted challenge is always there while the parent has it on; the plain revision only without a story boss. */}
          {(target || !(fight && boss)) && (
            // No story boss waiting: a revision fight (a rematch) is always there, harder and worth more.
            <button
              className="lz-cta lz-cta-boss is-revision is-practice"
              onClick={onPractice}
              title={`Prochain boss de l'histoire : réussis une lettre · grande révision dans ${toRevision} lettre${toRevision > 1 ? "s" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET(rematch.sprite)} alt="" className="lz-cta-face" />
              <span className="lz-practice-label">
                {target ? `Défi ${targetLabel(target.must)}` : "Révision"}
                <small>zénis ×3</small>
              </span>
            </button>
          )}
        </div>

      </div>
      <HoldButton onHold={onParent} />
    </div>
  );
}

/** Parent gate: hold for 2 seconds. */
function HoldButton({ onHold }: { onHold: () => void }) {
  const [holding, setHolding] = useState(false);
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startHold = () => {
    setHolding(true);
    t.current = setTimeout(() => {
      setHolding(false);
      onHold();
    }, 2000);
  };
  const cancel = () => {
    setHolding(false);
    if (t.current) clearTimeout(t.current);
  };
  return (
    <button
      className={`lz-gate ${holding ? "is-holding" : ""}`}
      onPointerDown={startHold}
      onPointerUp={cancel}
      onPointerLeave={cancel}
      onContextMenu={(e) => e.preventDefault()}
      aria-label="Espace parent (maintenir appuyé)"
    >
      <svg viewBox="0 0 40 40" className="lz-gate-ring">
        <circle cx="20" cy="20" r="17" />
      </svg>
      <Icon name="gear" size={22} />
    </button>
  );
}

function Bonus({
  save,
  game,
  extra,
  letters,
  fighter,
  onFighter,
  onPick,
  onDone,
}: {
  save: Save;
  game?: GameId;
  extra: number;
  letters: string[];
  fighter: { id?: string; name: string; img: string };
  onFighter: (id?: string) => void;
  onPick: (g: GameId, senzu: boolean) => void;
  onDone: () => void;
}) {
  const [senzu, setSenzu] = useState(false);
  const beans = save.progress.senzu ?? 0;
  const cleared = clearedList(save).length;
  if (!game)
    return (
      <div className="lz-bonus-pick" style={{ backgroundImage: `url(${ASSET("bg_gods.png")})` }}>
        <div className="lz-row lz-bonus-games">
          {MINI_GAMES.map((g) => {
            const need = GAME_UNLOCK[g.id];
            const open = gameOpen(save, g.id);
            const price = ITEM[`g-${g.id}`]?.price;
            const lvl = gameLevel(save, g.id);
            return (
              <button key={g.id} className={`lz-gamecard ${open ? "" : "is-locked"}`} disabled={!open} onClick={() => onPick(g.id, senzu)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={ASSET(g.img)} alt="" />
                <span className="lz-gamecard-name">{g.name}</span>
                {open ? (
                  lvl > 1 && <span className="lz-gamecard-tag">Niveau {lvl}</span>
                ) : (
                  <span className="lz-gamecard-lock">
                    <Icon name="lock" size={22} /> encore {need - cleared} lettre{need - cleared > 1 ? "s" : ""}
                    {price ? (
                      <>
                        {" "}· ou <Zeni size={18} /> {price}
                      </>
                    ) : null}
                  </span>
                )}
              </button>
            );
          })}
          <div className="lz-gamecard is-locked is-secret" aria-label="Jeu secret">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSET(SECRET_GAME.img)} alt="" />
            <span className="lz-gamecard-name">Jeu secret</span>
            <span className="lz-gamecard-lock">
              <Icon name="lock" size={22} /> fais un sans-faute
            </span>
          </div>
        </div>
        <FighterPicker options={fighters(save, formFor(formStep(save)).form)} current={fighter.id} onPick={onFighter} />
        <div className="lz-row">
          <button className="lz-round" onClick={onDone} aria-label="Retour">
            <Icon name="back" />
          </button>
          {beans > 0 && (
            <button className={`lz-senzu-toggle ${senzu ? "on" : ""}`} onClick={() => setSenzu(!senzu)} aria-pressed={senzu}>
              <span className="lz-bean" /> +{SENZU_SECONDS} s <em>×{beans}</em>
            </button>
          )}
        </div>
      </div>
    );
  return <MiniGame key={game} id={game} letters={letters} level={game === SECRET_GAME.id ? 1 : gameLevel(save, game)} extra={extra} goku={fighter.img} beam={attackFor(fighter.id, formStep(save)).color} onDone={onDone} />;
}

/** « e · u » */
function targetLabel(letters: string[] = []): string {
  return letters.map((g) => GRAPHEME[g]?.display ?? g).join(" · ");
}

/** The last round of dots finished: 0 green (cleared), 1 yellow, 2 red (mastered). */
function doneRound(lvl: number): number {
  const { round, dots } = roundOf(lvl);
  return dots === 3 ? round : round - 1;
}

/** A gold or diamond letter, shown on the result screen (with the dragon balls won so far). */
interface Medal {
  letter: string;
  kind: "or" | "diamant";
  balls?: number; // dragon balls collected with diamond letters, this one included
  wish?: boolean; // the seventh: Shenron's wish
}

function MedalBanner({ medal }: { medal: Medal }) {
  const got = medal.wish ? 7 : (medal.balls ?? 0);
  return (
    <div className={`lz-medal is-${medal.kind}`}>
      <span className="lz-medal-tile lz-read">{GRAPHEME[medal.letter]?.display}</span>
      <div>
        <p className="lz-medal-title">{medal.wish ? "Shenron exauce ton vœu !" : medal.kind === "or" ? "Lettre en or !" : "Lettre en diamant !"}</p>
        {medal.kind === "diamant" && (
          <div className="lz-medal-balls" aria-label={`${got} boules de cristal sur 7`}>
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className={i < got ? "is-got" : ""}>
                <DragonBall stars={i + 1} size={32} />
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
