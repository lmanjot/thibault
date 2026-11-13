"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ASSET, bossFor, formFor, GRAPHEME, type Boss } from "../content";
import {
  nextFight,
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
  storeSave,
  type Ex,
  type Save,
} from "../engine";
import { loadRecordings, loadVoice, namePart, sfx, soundPart, speak, stopSpeech } from "../audio";
import { L } from "../voice";
import { Session, type SessionResult } from "./Session";
import { Parent } from "./Parent";
import { Goku, Icon, Pips, Stars, Zeni } from "./bits";
import { MINI_GAMES, MiniGame, type GameId } from "./games";
import { Shop } from "./Shop";
import { equipped, formStep, GAME_UNLOCK, gameLevel, gameOpen, ITEM, LETTER_BONUS, LETTER_BOSS_BONUS, PERFECT_BONUS, REVISION_BOSS_BONUS, SENZU_SECONDS, SESSION_BONUS, zeni } from "../shop";
import "../lecture.css";

type Screen =
  | { s: "home" }
  | { s: "versus"; boss: Boss; fight: Fight }
  | { s: "session"; exercises: Ex[]; boss?: Boss; fight?: Fight }
  | { s: "result"; stars: number; earned: number; boss?: Boss; cleared: string[] }
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
    return MINI_GAMES.some((g) => g.id === jeu) ? { s: "bonus", game: jeu as GameId, cleared: [] } : { s: "home" };
  });

  useEffect(() => {
    loadRecordings();
    loadVoice();
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
      stopSpeech();
    };
  }, []);

  function update(s: Save) {
    const copy = structuredClone(s);
    storeSave(copy);
    setSave(copy);
  }

  const { form } = formFor(formStep(save));
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
    const cleared = applySession(s, r.answers, fight ? (fight.letter ?? null) : focusSound(save));
    const stars = starsFor(r.ok, r.total);
    // Zénis: the answers, plus a bonus for finishing, for a perfect session and for each letter cleared.
    const bossBonus = fight ? (fight.kind === "revision" ? REVISION_BOSS_BONUS : LETTER_BOSS_BONUS) : 0;
    const earned = r.zeni + SESSION_BONUS + (stars === 3 ? PERFECT_BONUS : 0) + cleared.length * LETTER_BONUS + bossBonus;
    s.progress.zeni = zeni(s) + earned;
    if (boss) {
      s.progress.bosses += 1;
      s.progress.fights = (s.progress.fights ?? []).slice(1); // that boss is beaten
      s.progress.beaten = [...(s.progress.beaten ?? []), boss.name];
    }
    update(s);
    setScreen({ s: "result", stars, earned, boss, cleared });
    speak(boss ? [boss.name, L.beaten] : [stars === 3 ? L.perfect : L.trainingDone]);
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
          onParent={() => {
            stopSpeech();
            setScreen({ s: "parent" });
          }}
          onPick={(g) => {
            const s = structuredClone(save);
            startLetter(s, g); // also adds a new letter after the known ones
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
            <Goku form={form} size="lg" />
            <span className="lz-vs">VS</span>
            <div className={`lz-boss lz-boss-big fx-${screen.boss.fx ?? "none"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET(screen.boss.sprite)} alt={screen.boss.name} />
            </div>
          </div>
          <p className="lz-reward-kicker lz-vs-kind">
            {screen.fight.kind === "revision" ? "Grande révision" : `Boss de la lettre ${GRAPHEME[screen.fight.letter ?? ""]?.display ?? ""}`}
          </p>
          <h2 className="lz-title-sm">{screen.boss.name}</h2>
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
          boss={screen.boss}
          onExit={() => setScreen({ s: "home" })}
          onDone={(r) => finish(r, screen.boss, screen.fight)}
        />
      )}

      {screen.s === "result" && (
        <div className="lz-result">
          <div className="lz-panel">
            <h2 className="lz-title-sm">{screen.boss ? "Victoire !" : "Bravo !"}</h2>
            <Stars n={screen.stars} size={72} />
            <p className="lz-kigain">
              +{screen.earned} <Zeni size={40} />
            </p>
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
  onParent,
  onPick,
  onShop,
}: {
  save: Save;
  onTrain: () => void;
  onBoss: () => void;
  onParent: () => void;
  onPick: (g: string) => void;
  onShop: () => void;
}) {
  const { form, next } = formFor(formStep(save));
  const fight = nextFight(save);
  const boss = fight ? bossFor(formStep(save), fight.kind, save.progress.beaten) : undefined;
  const toRevision = lettersToRevision(save);
  const week = save.settings.weekSounds.filter((g) => GRAPHEME[g]);
  const focus = focusSound(save);
  const letters = save.settings.classSounds.filter((g) => GRAPHEME[g]); // same order as in the parent settings
  // The gauge fills with the current letter's good sessions: clearing it brings the next power.
  const focusDone = focus ? Math.min(3, level(save, gid(focus)) - 1) : 0;
  const gauge = next ? focusDone / 3 : 1;
  const companion = equipped(save, "companion");

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
      <div className="lz-home-main">
        <h1 className="lz-brand">
          Lecture <span>Z</span>
        </h1>
        <div className="lz-power">
          <span className="lz-formname">{form.name}</span>
          <div className="lz-gauge">
            <div style={{ width: `${Math.round(gauge * 100)}%` }} />
          </div>
          <span className="lz-hint-kid">
            {next ? (
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
                {isCleared(save, g) ? <span className="lz-week-star is-done">✓</span> : week.includes(g) && <span className="lz-week-star">★</span>}
                <span className="lz-read">{GRAPHEME[g].display}</span>
                <Pips level={level(save, gid(g))} />
              </button>
            ))}
            {/* The next letters of the usual order: tap one to start it. */}
            {upcomingLetters(save, 2).map((g) => (
              <button
                key={g}
                className="lz-weektile is-upcoming"
                aria-label={`Nouvelle lettre : ${GRAPHEME[g].display}`}
                onClick={() => {
                  sfx.tap();
                  onPick(g);
                  speak([namePart(g)]);
                }}
              >
                <span className="lz-week-star is-new">+</span>
                <span className="lz-read">{GRAPHEME[g].display}</span>
                <Pips level={1} />
              </button>
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
          {fight && boss ? (
            <button className={`lz-cta lz-cta-boss ${fight.kind === "revision" ? "is-revision" : ""}`} onClick={onBoss}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET(boss.sprite)} alt="" className="lz-cta-face" />
              {fight.kind === "revision" ? "Révision" : "Boss"} : {boss.name}
            </button>
          ) : (
            <div className="lz-locked" title="Un boss arrive après chaque lettre réussie, et une grande révision toutes les 3 lettres.">
              <Icon name="lock" size={26} />
              Boss : réussis une lettre · révision dans {toRevision} lettre{toRevision > 1 ? "s" : ""}
            </div>
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
  onPick,
  onDone,
}: {
  save: Save;
  game?: GameId;
  extra: number;
  letters: string[];
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
        </div>
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
  return <MiniGame key={game} id={game} letters={letters} level={gameLevel(save, game)} extra={extra} goku={formFor(formStep(save)).form.sprite} onDone={onDone} />;
}
