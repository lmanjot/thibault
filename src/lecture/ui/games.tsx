"use client";

// Lecture Z — reward mini-games: short (45 s), one-finger, no game over.

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { ASSET, GRAPHEME } from "../content";
import { sfx, soundPart, speak } from "../audio";
import { L } from "../voice";
import { DragonBall, Icon } from "./bits";

export const GAME_SECONDS = 45;

export const MINI_GAMES = [
  { id: "nuage", name: "Nuage magique", img: "goku_kid_cloud.png", tip: "Attrape les 7 boules de cristal !" },
  { id: "kame", name: "Kaméhaméha", img: "saibaman.png", tip: "Touche les ennemis !" },
  { id: "bulles", name: "Boules magiques", img: "kikoha.png", tip: "Touche les boules avec la bonne lettre !" },
] as const;
export type GameId = (typeof MINI_GAMES)[number]["id"];

const rand = (a: number, b: number) => a + Math.random() * (b - a);
let nextId = 1;

type Phase = "count" | "play" | "end";

/** Runs a fixed-step world for `seconds` after a 3-2-1 countdown. */
function useGame<W extends { time: number; score: number }>(init: () => W, step: (w: W, dt: number) => W, seconds: number) {
  const [world, setWorld] = useState(init);
  const [phase, setPhase] = useState<Phase>("count");
  const [count, setCount] = useState(3);
  const stepRef = useRef(step);
  useEffect(() => {
    stepRef.current = step;
  });

  useEffect(() => {
    if (phase !== "count") return;
    const id = setInterval(
      () =>
        setCount((c) => {
          if (c <= 1) {
            clearInterval(id);
            setPhase("play");
          }
          return c - 1;
        }),
      600,
    );
    return () => clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "play") return;
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = performance.now();
    let elapsed = 0;
    let stopped = false;
    // Next frame from requestAnimationFrame, or a timer when frames are throttled.
    const schedule = () => {
      let fired = false;
      const run = () => {
        if (fired || stopped) return;
        fired = true;
        cancelAnimationFrame(raf);
        clearTimeout(timer);
        frame(performance.now());
      };
      raf = requestAnimationFrame(run);
      timer = setTimeout(run, 50);
    };
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      elapsed += dt;
      setWorld((w) => stepRef.current({ ...w, time: w.time + dt }, dt));
      if (elapsed >= seconds) {
        setPhase("end");
        return;
      }
      schedule();
    };
    schedule();
    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [phase, seconds]);

  return { world, setWorld, phase, count };
}

function Hud({ score, time, icon, seconds }: { score: number; time: number; icon: string; seconds: number }) {
  const left = Math.max(0, Math.ceil(seconds - time));
  return (
    <div className="lz-game-hud">
      <span className="lz-game-score">
        <span className="lz-game-icon">{icon}</span> {score}
      </span>
      <div className="lz-timer" style={{ ["--p" as string]: left / seconds }}>
        <span>{left}</span>
      </div>
    </div>
  );
}

function Overlay({ phase, count, score, game, onDone }: { phase: Phase; count: number; score: number; game: GameId; onDone: () => void }) {
  const [best] = useState(() => {
    try {
      const prev = Number(localStorage.getItem(`lz-best-${game}`) ?? 0);
      return prev;
    } catch {
      return 0;
    }
  });
  useEffect(() => {
    if (phase !== "end") return;
    try {
      if (score > best) localStorage.setItem(`lz-best-${game}`, String(score));
    } catch {}
    speak([score > best ? L.newRecord : L.gameOver]);
  }, [phase, score, best, game]);

  if (phase === "count")
    return (
      <div className="lz-game-overlay">
        <span key={count} className="lz-count">
          {count > 0 ? count : "Go !"}
        </span>
      </div>
    );
  if (phase === "end")
    return (
      <div className="lz-game-overlay is-end">
        <div className="lz-panel">
          <h2 className="lz-title-sm">{score > best ? "Nouveau record !" : "Fin du jeu !"}</h2>
          <p className="lz-kigain">{score} points</p>
          {best > 0 && score <= best && <p className="lz-hint-kid">Record : {best}</p>}
          <button className="lz-round" onClick={onDone} aria-label="Continuer">
            <Icon name="arrow" />
          </button>
        </div>
      </div>
    );
  return null;
}

interface GameProps {
  onDone: () => void;
  level: number;
  seconds: number;
}

const paceOf = (level: number) => 1 + 0.3 * (level - 1);

// ——— 1. Nuage magique: fly on the cloud, catch the 7 dragon balls, dodge ki blasts ———

interface Fall {
  id: number;
  x: number;
  y: number;
  vy: number;
  sway: number;
  kind: "ball" | "fire";
  stars: number;
}
interface NuageW {
  time: number;
  score: number;
  x: number;
  tx: number;
  items: Fall[];
  spawn: number;
  got: boolean[]; // the 7 balls collected so far
  wish?: number; // when Shenron appeared
  wishes: number;
  pops: { id: number; x: number; y: number; good: boolean; t: number; text: string }[];
}

const SKY_CLOUDS = [
  { x: 8, w: 150, d: 9, delay: 0, o: 0.9 },
  { x: 62, w: 220, d: 12, delay: -4, o: 0.75 },
  { x: 35, w: 110, d: 7, delay: -2, o: 0.95 },
  { x: 82, w: 130, d: 8.5, delay: -6, o: 0.85 },
  { x: 18, w: 260, d: 15, delay: -9, o: 0.55 },
  { x: 50, w: 90, d: 6, delay: -3.5, o: 0.9 },
];

const WISH_SECONDS = 2.6;

function Nuage({ onDone, level, seconds }: GameProps) {
  const pace = paceOf(level);
  const box = useRef<HTMLDivElement>(null);
  const { world, setWorld, phase, count } = useGame<NuageW>(
    () => ({ time: 0, score: 0, x: 0.5, tx: 0.5, items: [], spawn: 0.4, got: Array(7).fill(false), wishes: 0, pops: [] }),
    (w, dt) => {
      const speed = (0.26 + w.time * 0.005) * pace;
      let { score, spawn, got, wish, wishes } = w;
      const x = w.x + (w.tx - w.x) * Math.min(1, dt * 12);
      const pops = w.pops.filter((p) => w.time - p.t < 0.7);
      const items: Fall[] = [];
      for (const it of w.items) {
        const y = it.y + it.vy * dt;
        const ix = it.x + Math.sin(w.time * 2 + it.id) * it.sway * dt;
        if (y > 0.7 && y < 0.86 && Math.abs(ix - x) < 0.1) {
          if (it.kind === "ball") {
            score += level;
            sfx.good();
            const fresh = !got[it.stars - 1];
            if (fresh) got = got.map((g, i) => g || i === it.stars - 1);
            pops.push({ id: it.id, x: ix, y, good: true, t: w.time, text: `+${level}` });
            // All seven: Shenron grants a wish (bonus), and a new hunt begins.
            if (fresh && got.every(Boolean)) {
              score += 10 * level;
              wish = w.time;
              wishes += 1;
              got = Array(7).fill(false);
              sfx.power();
              pops.push({ id: nextId++, x: 0.5, y: 0.45, good: true, t: w.time, text: `+${10 * level}` });
            }
          } else {
            score = Math.max(0, score - level);
            sfx.hit();
            pops.push({ id: it.id, x: ix, y, good: false, t: w.time, text: `−${level}` });
          }
          continue;
        }
        if (y < 1.1) items.push({ ...it, x: Math.min(0.94, Math.max(0.06, ix)), y });
      }
      spawn -= dt;
      const wishing = wish !== undefined && w.time - wish < WISH_SECONDS;
      if (spawn <= 0 && !wishing) {
        spawn = (rand(0.6, 0.95) - Math.min(0.25, w.time * 0.004)) / pace;
        const fire = Math.random() < 0.2;
        // Mostly balls still missing from the collection, so the 7 come within reach.
        const missing = got.map((g, i) => (g ? 0 : i + 1)).filter(Boolean);
        const stars = missing.length && Math.random() < 0.75 ? missing[Math.floor(Math.random() * missing.length)] : 1 + Math.floor(Math.random() * 7);
        items.push({ id: nextId++, x: rand(0.1, 0.9), y: -0.08, vy: speed * rand(0.85, 1.15), sway: rand(0, 0.12), kind: fire ? "fire" : "ball", stars });
      }
      return { ...w, x, score, spawn, items, pops, got, wish, wishes };
    },
    seconds,
  );

  const steer = (e: RPointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    const tx = Math.min(0.92, Math.max(0.08, (e.clientX - r.left) / r.width));
    setWorld((w) => ({ ...w, tx }));
  };

  const tilt = Math.max(-14, Math.min(14, (world.tx - world.x) * 70));
  const wishing = world.wish !== undefined && world.time - world.wish < WISH_SECONDS;

  return (
    <div
      ref={box}
      className={`lz-game lz-game-nuage ${wishing ? "is-wish" : ""}`}
      onPointerDown={steer}
      onPointerMove={(e) => (e.buttons || e.pointerType === "touch") && steer(e)}
    >
      <div className="lz-sky" aria-hidden>
        {SKY_CLOUDS.map((c, i) => (
          <span key={i} className="lz-skycloud" style={{ left: `${c.x}%`, width: c.w, animationDuration: `${c.d}s`, animationDelay: `${c.delay}s`, opacity: c.o }} />
        ))}
      </div>
      <Hud score={world.score} time={world.time} icon="★" seconds={seconds} />
      <div className="lz-collect" aria-label="Boules de cristal trouvées">
        {world.got.map((g, i) => (
          <span key={`${world.wishes}-${i}`} className={`lz-collect-slot ${g ? "is-got" : ""}`}>
            <DragonBall stars={i + 1} size={38} />
          </span>
        ))}
      </div>
      {world.items.map((it) =>
        it.kind === "ball" ? (
          <div key={it.id} className="lz-fallball" style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }}>
            <DragonBall stars={it.stars} size={68} />
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={it.id} className="lz-fire" src={ASSET("kikoha.png")} alt="" style={{ left: `${it.x * 100}%`, top: `${it.y * 100}%` }} />
        ),
      )}
      {world.pops.map((p) => (
        <span key={p.id} className={`lz-catch ${p.good ? "good" : "bad"}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
          {p.good && <span className="lz-sparks" aria-hidden />}
          <span className="lz-pop-text">{p.text}</span>
        </span>
      ))}
      <div className="lz-rider" style={{ left: `${world.x * 100}%`, rotate: `${tilt}deg` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET("goku_kid_cloud.png")} alt="Goku sur le nuage magique" />
        <span className="lz-trail" aria-hidden />
      </div>
      {wishing && (
        <div className="lz-wish" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET("shenron.png")} alt="" />
          <span className="lz-wish-text">Vœu exaucé !</span>
        </div>
      )}
      <Overlay phase={phase} count={count} score={world.score} game="nuage" onDone={onDone} />
    </div>
  );
}

// ——— 2. Kaméhaméha: blast the enemies before they teleport away ———

interface Foe {
  id: number;
  x: number;
  y: number;
  born: number;
  life: number;
  sprite: string;
  hitAt?: number;
}
interface KameW {
  time: number;
  score: number;
  foes: Foe[];
  spawn: number;
  shots: { id: number; x: number; y: number; t: number; text: string }[];
  combo: number;
  lastHit: number;
  gone: { id: number; x: number; y: number; t: number }[]; // enemies that got away (a puff of smoke)
}

const FOES = ["saibaman.png", "saibaman.png", "soldier.png"];
// Where enemies appear and where the beam leaves Goku's hands (shares of the screen).
// Landscape: Goku on the left, enemies on the right. Portrait (phones): Goku at the bottom,
// enemies spread over the upper part of the screen.
const KAME_LAYOUT = {
  wide: { x: [0.4, 0.88], y: [0.32, 0.7], hands: { x: 0.2, y: 0.66 }, apart: 0.2 },
  tall: { x: [0.16, 0.84], y: [0.17, 0.62], hands: { x: 0.3, y: 0.8 }, apart: 0.2 },
};

function Kame({ onDone, level, seconds, goku }: GameProps & { goku: string }) {
  const pace = paceOf(level);
  const [lay] = useState(() => (typeof window !== "undefined" && window.innerHeight > window.innerWidth ? KAME_LAYOUT.tall : KAME_LAYOUT.wide));
  // Distance on screen (portrait screens are narrow: x counts for less).
  const aspect = typeof window !== "undefined" ? window.innerWidth / window.innerHeight : 1.5;
  const far = (a: { x: number; y: number }, x: number, y: number) => Math.hypot((a.x - x) * aspect, a.y - y) >= lay.apart;
  const { world, setWorld, phase, count } = useGame<KameW>(
    () => ({ time: 0, score: 0, foes: [], spawn: 0.3, shots: [], combo: 0, lastHit: -9, gone: [] }),
    (w, dt) => {
      let { spawn } = w;
      const gone = w.gone.filter((g) => w.time - g.t < 0.5);
      const foes = w.foes.filter((f) => {
        if (f.hitAt) return w.time - f.hitAt < 0.6;
        if (w.time - f.born < f.life) return true;
        gone.push({ id: f.id, x: f.x, y: f.y, t: w.time });
        return false;
      });
      spawn -= dt;
      if (spawn <= 0 && foes.filter((f) => !f.hitAt).length < 3) {
        spawn = Math.max(0.45, 1 - w.time * 0.012) / pace;
        let x = rand(lay.x[0], lay.x[1]);
        let y = rand(lay.y[0], lay.y[1]);
        for (let k = 0; k < 12 && !foes.every((f) => far(f, x, y)); k++) {
          x = rand(lay.x[0], lay.x[1]);
          y = rand(lay.y[0], lay.y[1]);
        }
        foes.push({ id: nextId++, x, y, born: w.time, life: Math.max(1.3, 2.4 - w.time * 0.015) / pace, sprite: FOES[Math.floor(Math.random() * FOES.length)] });
      }
      const combo = w.time - w.lastHit > 1.6 ? 0 : w.combo;
      return { ...w, spawn, foes, gone, combo, shots: w.shots.filter((s) => w.time - s.t < 0.7) };
    },
    seconds,
  );

  const zap = (id: number) => {
    if (phase !== "play") return;
    setWorld((w) => {
      const f = w.foes.find((x) => x.id === id);
      if (!f || f.hitAt) return w;
      sfx.beam();
      // Quick hits in a row make a combo: one more point per hit in the chain.
      const combo = w.time - w.lastHit < 1.6 ? w.combo + 1 : 1;
      const gain = level + (combo >= 3 ? 1 : 0);
      return {
        ...w,
        score: w.score + gain,
        combo,
        lastHit: w.time,
        foes: w.foes.map((x) => (x.id === id ? { ...x, hitAt: w.time } : x)),
        shots: [...w.shots, { id: nextId++, x: f.x, y: f.y, t: w.time, text: `+${gain}` }],
      };
    });
  };

  const firing = world.time - world.lastHit < 0.3;
  const shaking = world.time - world.lastHit < 0.18;

  return (
    <div className={`lz-game lz-game-kame ${shaking ? "is-shake" : ""}`} style={{ backgroundImage: `url(${ASSET("bg_desert.png")})` }}>
      <div className="lz-kame-sky" aria-hidden />
      <Hud score={world.score} time={world.time} icon="★" seconds={seconds} />
      {world.combo >= 2 && (
        <span key={world.combo} className="lz-combo">
          Combo ×{world.combo}
        </span>
      )}
      <div className={`lz-kame-goku ${firing ? "is-firing" : ""}`}>
        <span className="lz-kame-aura" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET(goku)} alt="Goku" draggable={false} />
      </div>
      {world.foes.map((f) => (
        <button
          key={f.id}
          className={`lz-foe ${f.hitAt ? "is-down" : ""}`}
          style={{ left: `${f.x * 100}%`, top: `${f.y * 100}%`, ["--life" as string]: `${f.life}s` }}
          onPointerDown={() => zap(f.id)}
          aria-label="Ennemi"
        >
          <span className="lz-foe-shadow" aria-hidden />
          {!f.hitAt && (
            <svg className="lz-foe-timer" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" pathLength="100" />
            </svg>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET(f.sprite)} alt="" draggable={false} />
        </button>
      ))}
      {world.shots.map((s) => (
        <Beam key={s.id} x0={lay.hands.x} y0={lay.hands.y} x1={s.x} y1={s.y} />
      ))}
      {world.shots.map((s) => (
        <span key={`b${s.id}`} className="lz-blast" style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%` }} aria-hidden>
          <span className="lz-blast-core" />
          <span className="lz-sparks" />
          <span className="lz-pop-text">{s.text}</span>
        </span>
      ))}
      {world.gone.map((g) => (
        <span key={`g${g.id}`} className="lz-puff" style={{ left: `${g.x * 100}%`, top: `${g.y * 100}%` }} aria-hidden />
      ))}
      <Overlay phase={phase} count={count} score={world.score} game="kame" onDone={onDone} />
    </div>
  );
}

function Beam({ x0, y0, x1, y1 }: { x0: number; y0: number; x1: number; y1: number }) {
  const [size, setSize] = useState({ w: 1000, h: 700 });
  useEffect(() => {
    const r = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", r);
    const id = requestAnimationFrame(r);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", r);
    };
  }, []);
  const dx = (x1 - x0) * size.w;
  const dy = (y1 - y0) * size.h;
  return (
    <div
      className="lz-kbeam"
      style={{ left: `${x0 * 100}%`, top: `${y0 * 100}%`, width: Math.hypot(dx, dy), transform: `rotate(${Math.atan2(dy, dx)}rad)` }}
    >
      <span className="lz-kbeam-orb" />
    </div>
  );
}

// ——— 3. Boules magiques: touch the dragon balls carrying the right letter ———

interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  letter: string;
  stars: number;
  hint?: boolean; // the first right balls glow a little, to get started
  popped?: number;
  wrong?: number;
}
interface BoulesW {
  time: number;
  score: number;
  target: string;
  balls: Ball[];
  spawn: number;
  hints: number; // right balls still to show with a glow
}

// Ball radius as a share of the screen width: balls are 120 px, or 24% of a phone's width.
const wallFor = () => (typeof window === "undefined" ? 0.06 : Math.min(0.14, Math.max(0.05, Math.min(window.innerWidth * 0.24, 120, window.innerHeight * 0.16) / 2 / window.innerWidth + 0.01)));

function Boules({ letters, onDone, level, seconds }: GameProps & { letters: string[] }) {
  const pace = paceOf(level);
  const pool = letters.length ? letters : ["a", "i", "o"];
  const others = pool.length > 1 ? pool : ["a", "i", "o", "u"];
  const [WALL] = useState(wallFor);
  const { world, setWorld, phase, count } = useGame<BoulesW>(
    () => ({ time: 0, score: 0, target: pool[Math.floor(Math.random() * pool.length)], balls: [], spawn: 0.2, hints: 2 }),
    (w, dt) => {
      let { spawn, hints } = w;
      const balls = w.balls
        .filter((b) => (b.popped ? w.time - b.popped < 0.45 : b.y > -0.2))
        .map((b) => {
          if (b.popped) return b;
          // Rise diagonally and bounce off the side walls.
          let x = b.x + b.vx * dt;
          let vx = b.vx;
          if (x < WALL) {
            x = WALL;
            vx = Math.abs(vx);
          } else if (x > 1 - WALL) {
            x = 1 - WALL;
            vx = -Math.abs(vx);
          }
          return { ...b, x, vx, y: b.y - b.vy * dt };
        });
      spawn -= dt;
      if (spawn <= 0) {
        spawn = (rand(0.55, 0.85) / pace) * (WALL > 0.08 ? 1.4 : 1); // fewer at once on a narrow phone
        const isTarget = Math.random() < 0.45;
        const wrongs = others.filter((l) => l !== w.target);
        const letter = isTarget || !wrongs.length ? w.target : wrongs[Math.floor(Math.random() * wrongs.length)];
        const hint = letter === w.target && hints > 0;
        if (hint) hints -= 1;
        balls.push({
          id: nextId++,
          x: rand(WALL, 1 - WALL),
          y: 1.1,
          vx: (Math.random() < 0.5 ? -1 : 1) * rand(0.06, 0.16) * pace,
          vy: (rand(0.11, 0.16) + w.time * 0.001) * pace,
          letter,
          stars: 1 + Math.floor(Math.random() * 7),
          hint,
        });
      }
      // A new letter to find every 15 seconds (with two glowing helpers again).
      const slot = Math.floor(w.time / 15);
      const prevSlot = Math.floor((w.time - dt) / 15);
      let target = w.target;
      if (slot !== prevSlot && pool.length > 1) {
        const choices = pool.filter((l) => l !== w.target);
        target = choices[Math.floor(Math.random() * choices.length)];
        hints = 2;
      }
      return { ...w, spawn, balls, target, hints };
    },
    seconds,
  );

  const target = world.target;
  useEffect(() => {
    if (phase === "count" || phase === "play") speak([L.popAll, soundPart(target)]);
  }, [target, phase]);

  const pop = (id: number) => {
    if (phase !== "play") return;
    setWorld((w) => {
      const b = w.balls.find((x) => x.id === id);
      if (!b || b.popped) return w;
      if (b.letter === w.target) {
        sfx.good();
        return { ...w, score: w.score + level, balls: w.balls.map((x) => (x.id === id ? { ...x, popped: w.time } : x)) };
      }
      sfx.bad();
      return { ...w, balls: w.balls.map((x) => (x.id === id ? { ...x, wrong: w.time } : x)) };
    });
  };

  return (
    <div className="lz-game lz-game-boules" style={{ backgroundImage: `url(${ASSET("bg_gods.png")})` }}>
      <Hud score={world.score} time={world.time} icon="★" seconds={seconds} />
      <button className="lz-bulles-target" onClick={() => speak([soundPart(target)])} aria-label="Lettre à trouver">
        <span className="lz-read">{GRAPHEME[target]?.display ?? target}</span>
      </button>
      {world.balls.map((b) => (
        <button
          key={b.id}
          className={`lz-magicball ${b.hint && b.letter === target ? "is-hint" : ""} ${b.popped ? "is-popped" : ""} ${b.wrong && world.time - b.wrong < 0.4 ? "is-wrong" : ""}`}
          style={{ left: `${b.x * 100}%`, top: `${b.y * 100}%` }}
          onPointerDown={() => pop(b.id)}
        >
          <span className="lz-magicball-stars" aria-hidden>
            {"★".repeat(b.stars)}
          </span>
          <span className="lz-read lz-magicball-letter">{GRAPHEME[b.letter]?.display ?? b.letter}</span>
        </button>
      ))}
      <Overlay phase={phase} count={count} score={world.score} game="bulles" onDone={onDone} />
    </div>
  );
}

export function MiniGame({ id, letters, level = 1, extra = 0, goku = "goku.png", onDone }: { id: GameId; letters: string[]; level?: number; extra?: number; goku?: string; onDone: () => void }) {
  const seconds = GAME_SECONDS + extra;
  if (id === "nuage") return <Nuage onDone={onDone} level={level} seconds={seconds} />;
  if (id === "kame") return <Kame onDone={onDone} level={level} seconds={seconds} goku={goku} />;
  return <Boules letters={letters} onDone={onDone} level={level} seconds={seconds} />;
}
