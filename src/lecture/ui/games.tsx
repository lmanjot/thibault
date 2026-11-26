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
  { id: "memoire", name: "Memory des amis", img: "bulma_kid.png", tip: "Trouve les paires d'amis !" },
  { id: "route", name: "Route du Serpent", img: "goku.png", tip: "Saute par-dessus les rochers !" },
  { id: "baton", name: "Bâton magique", img: "goku_kid_staff.png", tip: "Fais grandir le bâton pour passer d'un pilier à l'autre !" },
] as const;
/** The secret game: opened only by a session without a single mistake. */
export const SECRET_GAME = { id: "instinct", name: "Ultra Instinct", img: "goku_ui.png" } as const;
/** Shenron's game: his wish, after the first 7 dragon balls (never for sale). */
export const VOL_GAME = { id: "vol", name: "Le vol de Shenron", img: "shenron.png" } as const;
export type GameId = (typeof MINI_GAMES)[number]["id"] | typeof SECRET_GAME.id | typeof VOL_GAME.id;

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
      const x = w.x + (w.tx - w.x) * Math.min(1, dt * 20); // follows the finger closely, with a touch of smoothing
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
        items.push({ id: nextId++, x: rand(0.14, 0.86), y: -0.08, vy: speed * rand(0.85, 1.15), sway: rand(0, 0.12), kind: fire ? "fire" : "ball", stars });
      }
      return { ...w, x, score, spawn, items, pops, got, wish, wishes };
    },
    seconds,
  );

  // Steering is a drag: Goku moves as much as the finger moves, wherever the finger is put down,
  // so touching the screen never makes him jump across it.
  const grab = useRef<{ fx: number; gx: number } | null>(null);
  const press = (e: RPointerEvent) => {
    grab.current = { fx: e.clientX, gx: world.tx };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // capture is a nicety
    }
  };
  const steer = (e: RPointerEvent) => {
    const g = grab.current;
    const r = box.current?.getBoundingClientRect();
    if (!g || !r) return;
    // Keep at least three quarters of Goku on screen.
    const half = (box.current?.querySelector(".lz-rider img")?.getBoundingClientRect().width ?? 0) / 2;
    const edge = Math.min(0.2, Math.max(0.06, (half * 0.5) / r.width));
    const tx = Math.min(1 - edge, Math.max(edge, g.gx + ((e.clientX - g.fx) / r.width) * 1.2));
    setWorld((w) => ({ ...w, tx }));
  };
  const release = () => {
    grab.current = null;
  };

  const tilt = Math.max(-14, Math.min(14, (world.tx - world.x) * 70));
  const wishing = world.wish !== undefined && world.time - world.wish < WISH_SECONDS;

  return (
    <div
      ref={box}
      className={`lz-game lz-game-nuage ${wishing ? "is-wish" : ""}`}
      onPointerDown={press}
      onPointerMove={steer}
      onPointerUp={release}
      onPointerCancel={release}
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
      <div className="lz-rider" style={{ transform: `translateX(${world.x * 100}vw) rotate(${tilt}deg)` }}>
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

function Kame({ onDone, level, seconds, goku, beam }: GameProps & { goku: string; beam: string }) {
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
    <div className={`lz-game lz-game-kame atk-${beam} ${shaking ? "is-shake" : ""}`} style={{ backgroundImage: `url(${ASSET("bg_desert.png")})` }}>
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

// ——— 4. Memory des amis: turn the cards, find the pairs of characters ———

const FACES = [
  "goku_kid.png",
  "bulma_kid.png",
  "krillin_kid.png",
  "roshi.png",
  "yamcha.png",
  "piccolo_jr.png",
  "vegeta_new.png",
  "gohan.png",
  "frieza_new.png",
  "buu_fat.png",
  "trunks.png",
  "beerus.png",
  "shenron.png",
  "pilaf.png",
];

interface Card {
  id: number;
  face: string;
  open: boolean;
  found: boolean;
}
interface MemoW {
  time: number;
  score: number;
  cards: Card[];
  closeAt?: number; // when two different cards turn back
  boards: number; // boards cleared
}

/** Pairs per board: 6, 8, then 10 at level 3. */
const pairsFor = (level: number) => (level >= 3 ? 10 : level === 2 ? 8 : 6);

function dealCards(level: number): Card[] {
  const faces = [...FACES].sort(() => Math.random() - 0.5).slice(0, pairsFor(level));
  const cards = [...faces, ...faces].map((face) => ({ id: nextId++, face, open: false, found: false }));
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

function Memoire({ onDone, level, seconds }: GameProps) {
  const { world, setWorld, phase, count } = useGame<MemoW>(
    () => ({ time: 0, score: 0, cards: dealCards(level), boards: 0 }),
    (w) => {
      // Two different cards: turn them back after a moment.
      if (w.closeAt !== undefined && w.time >= w.closeAt) {
        return { ...w, closeAt: undefined, cards: w.cards.map((c) => (c.found ? c : { ...c, open: false })) };
      }
      // Board cleared: a bonus and a new board.
      if (w.cards.every((c) => c.found)) {
        sfx.power();
        return { ...w, score: w.score + 3 * level, boards: w.boards + 1, cards: dealCards(level) };
      }
      return w;
    },
    seconds,
  );

  const flip = (id: number) => {
    if (phase !== "play") return;
    setWorld((w) => {
      if (w.closeAt !== undefined) return w; // wait for the two cards to turn back
      const card = w.cards.find((c) => c.id === id);
      if (!card || card.open || card.found) return w;
      sfx.tap();
      const cards = w.cards.map((c) => (c.id === id ? { ...c, open: true } : c));
      const open = cards.filter((c) => c.open && !c.found);
      if (open.length < 2) return { ...w, cards };
      if (open[0].face === open[1].face) {
        sfx.good();
        return { ...w, score: w.score + level, cards: cards.map((c) => (c.face === open[0].face ? { ...c, found: true } : c)) };
      }
      return { ...w, cards, closeAt: w.time + 0.9 };
    });
  };

  const n = world.cards.length;
  const [tall] = useState(() => typeof window !== "undefined" && window.innerHeight > window.innerWidth);
  const cols = tall ? (n <= 12 ? 3 : 4) : n <= 12 ? 4 : n <= 16 ? 4 : 5;
  const rows = Math.ceil(n / cols);

  return (
    <div className="lz-game lz-game-memo" style={{ backgroundImage: `url(${ASSET("bg_papaya.png")})` }}>
      <Hud score={world.score} time={world.time} icon="★" seconds={seconds} />
      <div className="lz-memo" style={{ ["--cols" as string]: cols, ["--rows" as string]: rows }}>
        {world.cards.map((c) => (
          <button
            key={c.id}
            className={`lz-memo-card ${c.open || c.found ? "is-open" : ""} ${c.found ? "is-found" : ""}`}
            onClick={() => flip(c.id)}
            aria-label={c.open || c.found ? c.face.replace(".png", "") : "Carte"}
          >
            <span className="lz-memo-back" aria-hidden>
              <DragonBall stars={4} size={44} />
            </span>
            <span className="lz-memo-face" aria-hidden>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET(c.face)} alt="" draggable={false} />
            </span>
          </button>
        ))}
      </div>
      <Overlay phase={phase} count={count} score={world.score} game="memoire" onDone={onDone} />
    </div>
  );
}

// ——— 5. Route du Serpent: run, tap to jump over rocks, catch the dragon balls ———

interface Thing {
  id: number;
  x: number; // share of the width
  kind: "rock" | "ball";
  h: number; // height above the road (share of the height), for balls
  stars: number;
  done?: boolean;
}
interface RouteW {
  time: number;
  score: number;
  y: number; // runner's height above the road
  vy: number;
  things: Thing[];
  spawn: number;
  dist: number; // for the scrolling background
  hitAt: number;
  pops: { id: number; x: number; y: number; t: number; text: string; good: boolean }[];
}

const RUNNER_X = 0.22;
// A long, floaty jump: easy to time for a young child.
const GRAVITY = 3.3;
const JUMP = 1.65;

function Route({ onDone, level, seconds, goku }: GameProps & { goku: string }) {
  const pace = paceOf(level);
  const { world, setWorld, phase, count } = useGame<RouteW>(
    () => ({ time: 0, score: 0, y: 0, vy: 0, things: [], spawn: 1, dist: 0, hitAt: -9, pops: [] }),
    (w, dt) => {
      const speed = (0.32 + w.time * 0.004) * pace; // screen widths per second
      let { y, vy, spawn, score, hitAt } = w;
      vy -= GRAVITY * dt;
      y = Math.max(0, y + vy * dt);
      if (y === 0) vy = 0;
      const pops = w.pops.filter((p) => w.time - p.t < 0.7);
      const things: Thing[] = [];
      for (const t of w.things) {
        const x = t.x - speed * dt;
        if (x < -0.1) continue;
        let done = t.done;
        const near = Math.abs(x - RUNNER_X) < (t.kind === "rock" ? 0.035 : 0.06);
        if (!done && near && t.kind === "rock" && y < 0.1 && w.time - hitAt > 0.8) {
          // Bumped into a rock: a stumble, never a game over.
          done = true;
          hitAt = w.time;
          score = Math.max(0, score - 1);
          sfx.hit();
          pops.push({ id: nextId++, x, y: 0.72, t: w.time, text: "−1", good: false });
        } else if (!done && near && t.kind === "ball" && Math.abs(y - t.h) < 0.12) {
          done = true;
          score += 2 * level;
          sfx.good();
          pops.push({ id: nextId++, x, y: 0.72 - t.h, t: w.time, text: `+${2 * level}`, good: true });
          continue; // caught: it disappears
        } else if (!done && t.kind === "rock" && x < RUNNER_X - 0.06) {
          done = true; // jumped over it
          score += level;
        }
        things.push({ ...t, x, done });
      }
      spawn -= dt;
      if (spawn <= 0) {
        spawn = (rand(1.1, 1.8) - Math.min(0.4, w.time * 0.006)) / pace;
        const ball = Math.random() < 0.4;
        things.push({ id: nextId++, x: 1.08, kind: ball ? "ball" : "rock", h: ball ? rand(0.18, 0.34) : 0, stars: 1 + Math.floor(Math.random() * 7) });
      }
      return { ...w, y, vy, spawn, score, hitAt, things, pops, dist: w.dist + speed * dt };
    },
    seconds,
  );

  const jump = () => {
    if (phase !== "play") return;
    setWorld((w) => (w.y > 0.02 ? w : { ...w, vy: JUMP }));
  };

  const stumbling = world.time - world.hitAt < 0.8;

  return (
    <div
      className="lz-game lz-game-route"
      style={{ backgroundImage: `url(${ASSET("bg_road.png")})` }}
      onPointerDown={jump}
    >
      <Hud score={world.score} time={world.time} icon="★" seconds={seconds} />
      <div className="lz-road" style={{ backgroundPositionX: `${-world.dist * 900}px, 0` }} aria-hidden />
      {world.things.map((t) =>
        t.kind === "rock" ? (
          <span key={t.id} className="lz-rock" style={{ left: `${t.x * 100}%` }} aria-hidden />
        ) : (
          <span key={t.id} className="lz-route-ball" style={{ left: `${t.x * 100}%`, bottom: `calc(22% + ${t.h * 100}%)` }} aria-hidden>
            <DragonBall stars={t.stars} size={54} />
          </span>
        ),
      )}
      <div className={`lz-runner ${world.y > 0 ? "is-air" : ""} ${stumbling ? "is-stumble" : ""}`} style={{ left: `${RUNNER_X * 100}%`, bottom: `calc(22% + ${world.y * 100}%)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET(goku)} alt="" draggable={false} />
      </div>
      {world.pops.map((p) => (
        <span key={p.id} className={`lz-catch ${p.good ? "good" : "bad"}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
          {p.good && <span className="lz-sparks" aria-hidden />}
          <span className="lz-pop-text">{p.text}</span>
        </span>
      ))}
      {phase === "play" && world.time < 4 && <span className="lz-route-tip">Touche l&apos;écran pour sauter !</span>}
      <Overlay phase={phase} count={count} score={world.score} game="route" onDone={onDone} />
    </div>
  );
}

// ——— 6. Bâton magique: hold to make the staff grow, let go: it falls and makes a bridge ———

interface Pillar {
  id: number;
  x: number; // left edge, in screen widths (world)
  w: number;
}
type BatonMode = "ready" | "grow" | "fall" | "walk" | "slip" | "drop" | "rescue" | "slide";
interface BatonW {
  time: number;
  score: number;
  mode: BatonMode;
  t: number; // when the mode began
  pillars: Pillar[]; // [where Goku stands, the next one, one more]
  gx: number; // Goku's position (world)
  gy: number; // how far he fell (screen heights)
  len: number; // the staff's length (screen widths)
  angle: number; // 0 = upright, 90 = lying flat
  cam: number;
  streak: number;
  pops: { id: number; x: number; y: number; t: number; text: string; good: boolean }[];
}

const STAFF_SPEED = 0.42; // screen widths per second while held
const WALK = 0.75;

function nextPillar(after: Pillar, level: number): Pillar {
  const gap = rand(0.12, 0.3 + 0.06 * level);
  return { id: nextId++, x: after.x + after.w + gap, w: rand(Math.max(0.06, 0.15 - 0.025 * level), 0.2 - 0.02 * level) };
}

function Baton({ onDone, level, seconds }: GameProps) {
  const pace = paceOf(level);
  const { world, setWorld, phase, count } = useGame<BatonW>(
    () => {
      const first = { id: nextId++, x: 0.05, w: 0.2 };
      const second = nextPillar(first, level);
      return { time: 0, score: 0, mode: "ready", t: 0, pillars: [first, second, nextPillar(second, level)], gx: 0.25, gy: 0, len: 0, angle: 0, cam: 0, streak: 0, pops: [] };
    },
    (w, dt) => {
      let { mode, t, gx, gy, len, angle, cam, score, streak, pillars } = w;
      const pops = w.pops.filter((p) => w.time - p.t < 0.8);
      const [cur, next] = pillars;
      const edge = cur.x + cur.w;
      const tip = edge + len;
      const go = (m: BatonMode) => {
        mode = m;
        t = w.time;
      };
      if (mode === "grow") len = Math.min(0.95, len + STAFF_SPEED * Math.sqrt(pace) * dt);
      else if (mode === "fall") {
        angle = Math.min(90, angle + 300 * dt);
        if (angle === 90) {
          const ok = tip >= next.x && tip <= next.x + next.w;
          if (ok) {
            const center = Math.abs(tip - (next.x + next.w / 2)) < 0.018;
            streak += 1;
            const gain = level * (center ? 3 : 1) + Math.min(streak - 1, 4);
            score += gain;
            sfx.good();
            pops.push({ id: nextId++, x: next.x + next.w / 2 - cam, y: 0.55, t: w.time, text: center ? `Pile au milieu ! +${gain}` : `+${gain}`, good: true });
            go("walk");
          } else {
            streak = 0;
            sfx.bad();
            go("slip");
          }
        }
      } else if (mode === "walk") {
        gx = Math.min(next.x + next.w - 0.03, gx + WALK * dt);
        if (gx >= next.x + next.w - 0.03) go("slide");
      } else if (mode === "slip") {
        // Walks to the end of a staff that is too short (or too long), and drops off it.
        gx = Math.min(tip, gx + WALK * dt);
        if (gx >= tip) go("drop");
      } else if (mode === "drop") {
        gy = Math.min(0.5, gy + 1.6 * dt);
        if (w.time - t > 0.6) {
          sfx.hit();
          go("rescue");
        }
      } else if (mode === "rescue") {
        // The flying cloud brings him back up, onto the next pillar: never a game over.
        const k = Math.min(1, (w.time - t) / 1.1);
        gy = 0.5 * (1 - k) - Math.sin(k * Math.PI) * 0.25;
        gx = gx + (next.x + next.w - 0.03 - gx) * Math.min(1, dt * 4);
        if (k >= 1) {
          gy = 0;
          gx = next.x + next.w - 0.03;
          go("slide");
        }
      } else if (mode === "slide") {
        len = 0;
        angle = 0;
        const target = next.x + next.w - 0.25;
        cam += (target - cam) * Math.min(1, dt * 7);
        if (Math.abs(target - cam) < 0.003) {
          cam = target;
          pillars = [next, pillars[2], nextPillar(pillars[2], level)];
          go("ready");
        }
      }
      return { ...w, mode, t, gx, gy, len, angle, cam, score, streak, pillars, pops };
    },
    seconds,
  );

  const press = () => {
    if (phase !== "play") return;
    setWorld((w) => (w.mode === "ready" ? { ...w, mode: "grow", t: w.time, len: 0.01 } : w));
  };
  const release = () =>
    setWorld((w) => {
      if (w.mode !== "grow") return w;
      sfx.tap();
      return { ...w, mode: "fall", t: w.time };
    });

  const { pillars, cam } = world;
  const edge = pillars[0].x + pillars[0].w;
  const rescuing = world.mode === "rescue";
  const gokuImg = rescuing ? "goku_kid_cloud.png" : "goku_kid_staff.png";

  return (
    <div
      className="lz-game lz-game-baton"
      style={{ backgroundImage: `url(${ASSET("bg_papaya.png")})` }}
      onPointerDown={press}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      <Hud score={world.score} time={world.time} icon="★" seconds={seconds} />
      {pillars.map((p, i) => (
        <span key={p.id} className="lz-pillar" style={{ left: `${(p.x - cam) * 100}%`, width: `${p.w * 100}%` }} aria-hidden>
          {i > 0 && <i className="lz-pillar-mark" />}
        </span>
      ))}
      {world.len > 0 && (
        <span className="lz-staff" style={{ left: `${(edge - cam) * 100}%`, height: `${world.len * 100}vw`, transform: `rotate(${world.angle}deg)` }} aria-hidden />
      )}
      <div
        className={`lz-batonboy ${world.mode === "grow" ? "is-grow" : ""} ${world.mode === "walk" || world.mode === "slip" ? "is-walk" : ""} ${rescuing ? "is-rescue" : ""}`}
        style={{ left: `${(world.gx - cam) * 100}%`, bottom: `calc(30% - ${world.gy * 100}%)` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET(gokuImg)} alt="" draggable={false} />
      </div>
      {world.pops.map((p) => (
        <span key={p.id} className={`lz-catch ${p.good ? "good" : "bad"}`} style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
          {p.good && <span className="lz-sparks" aria-hidden />}
          <span className="lz-pop-text">{p.text}</span>
        </span>
      ))}
      {phase === "play" && world.time < 6 && (
        <span className="lz-route-tip">Appuie pour faire grandir le bâton, lâche pour le poser !</span>
      )}
      <Overlay phase={phase} count={count} score={world.score} game="baton" onDone={onDone} />
    </div>
  );
}

// ——— Secret: Ultra Instinct (only after a perfect session): touch every attack before it lands ———

interface Threat {
  id: number;
  a: number; // angle it comes from
  d: number; // distance from Goku (in shares of the screen's short side)
  v: number;
  kind: "blast" | "foe" | "ball";
  sprite: string;
  stars: number;
}
interface InstinctW {
  time: number;
  score: number;
  threats: Threat[];
  spawn: number;
  combo: number;
  dodge: number; // when Goku last dodged (afterimage)
  pops: { id: number; x: number; y: number; t: number; text: string; good: boolean }[];
}

const UI_FOES = ["jiren.png", "goku_black.png", "frieza_new.png", "broly.png"];
const UI_CENTER = { x: 0.5, y: 0.56 };

function Instinct({ onDone, level, seconds }: GameProps) {
  const pace = paceOf(level);
  const box = useRef<HTMLDivElement>(null);
  const far = useRef(0.9); // spawn distance: just off the screen's long side
  useEffect(() => {
    const r = box.current?.getBoundingClientRect();
    if (r) far.current = (Math.max(r.width, r.height) / Math.min(r.width, r.height)) * 0.62;
  }, []);

  const { world, setWorld, phase, count } = useGame<InstinctW>(
    () => ({ time: 0, score: 0, threats: [], spawn: 0.6, combo: 0, dodge: -9, pops: [] }),
    (w, dt) => {
      let { spawn, combo, dodge } = w;
      const pops = w.pops.filter((p) => w.time - p.t < 0.7);
      const threats: Threat[] = [];
      for (const th of w.threats) {
        const d = th.d - th.v * dt;
        if (d < 0.09) {
          // It reached him: Ultra Instinct dodges by itself, but the combo is lost.
          if (th.kind !== "ball") {
            combo = 0;
            dodge = w.time;
            sfx.beam();
          }
          continue;
        }
        threats.push({ ...th, d });
      }
      spawn -= dt;
      if (spawn <= 0) {
        spawn = (rand(0.55, 0.95) - Math.min(0.3, w.time * 0.006)) / pace;
        const roll = Math.random();
        const kind = roll < 0.12 ? "ball" : roll < 0.4 ? "foe" : "blast";
        threats.push({
          id: nextId++,
          a: rand(0, Math.PI * 2),
          d: far.current,
          v: (kind === "foe" ? 0.2 : 0.28) * pace * (1 + w.time * 0.01),
          kind,
          sprite: kind === "foe" ? UI_FOES[Math.floor(Math.random() * UI_FOES.length)] : "kikoha.png",
          stars: 1 + Math.floor(Math.random() * 7),
        });
      }
      return { ...w, spawn, combo, dodge, threats, pops };
    },
    seconds,
  );

  // Touch (or swipe across) an attack to send it away.
  const pressed = useRef(false);
  const strike = (e: RPointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || phase !== "play") return;
    const m = Math.min(r.width, r.height);
    const px = (e.clientX - (r.left + r.width * UI_CENTER.x)) / m;
    const py = (e.clientY - (r.top + r.height * UI_CENTER.y)) / m;
    setWorld((w) => {
      const hit = w.threats.find((th) => Math.hypot(Math.cos(th.a) * th.d - px, Math.sin(th.a) * th.d - py) < (th.kind === "foe" ? 0.13 : 0.11));
      if (!hit) return w;
      const combo = w.combo + 1;
      const gain = hit.kind === "ball" ? 5 * level : level + Math.floor(combo / 5);
      sfx.good();
      const x = UI_CENTER.x + (Math.cos(hit.a) * hit.d * m) / r.width;
      const y = UI_CENTER.y + (Math.sin(hit.a) * hit.d * m) / r.height;
      return {
        ...w,
        combo,
        score: w.score + gain,
        threats: w.threats.filter((th) => th !== hit),
        pops: [...w.pops, { id: nextId++, x, y, t: w.time, text: combo >= 5 && hit.kind !== "ball" ? `Combo ${combo} ! +${gain}` : `+${gain}`, good: true }],
      };
    });
  };

  const dodging = world.time - world.dodge < 0.45;

  return (
    <div
      ref={box}
      className="lz-game lz-game-instinct"
      style={{ backgroundImage: `url(${ASSET("bg_gods.png")})` }}
      onPointerDown={(e) => {
        pressed.current = true;
        strike(e);
      }}
      onPointerMove={(e) => pressed.current && strike(e)}
      onPointerUp={() => (pressed.current = false)}
      onPointerCancel={() => (pressed.current = false)}
    >
      <Hud score={world.score} time={world.time} icon="✦" seconds={seconds} />
      <div className={`lz-ui-goku ${dodging ? "is-dodge" : ""}`} style={{ left: `${UI_CENTER.x * 100}%`, top: `${UI_CENTER.y * 100}%` }}>
        <span className="lz-ui-aura" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ASSET("goku_ui.png")} alt="Goku Ultra Instinct" draggable={false} />
        {dodging && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="lz-ui-ghost" src={ASSET("goku_ui.png")} alt="" draggable={false} />
        )}
      </div>
      {world.threats.map((th) => (
        <span
          key={th.id}
          className={`lz-ui-threat is-${th.kind}`}
          style={{
            left: `calc(${UI_CENTER.x * 100}% + ${Math.cos(th.a) * th.d} * var(--m))`,
            top: `calc(${UI_CENTER.y * 100}% + ${Math.sin(th.a) * th.d} * var(--m))`,
          }}
          aria-hidden
        >
          {th.kind === "ball" ? (
            <DragonBall stars={th.stars} size={56} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ASSET(th.sprite)} alt="" draggable={false} />
          )}
        </span>
      ))}
      {world.combo >= 5 && <span className="lz-ui-combo">Combo ×{world.combo}</span>}
      {world.pops.map((p) => (
        <span key={p.id} className="lz-catch good" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
          <span className="lz-sparks" aria-hidden />
          <span className="lz-pop-text">{p.text}</span>
        </span>
      ))}
      {phase === "play" && world.time < 5 && <span className="lz-route-tip">Touche les attaques avant qu&apos;elles arrivent !</span>}
      <Overlay phase={phase} count={count} score={world.score} game="instinct" onDone={onDone} />
    </div>
  );
}

// ——— Le vol de Shenron (Shenron's wish): steer the dragon, swallow the orbs with the letter asked ———

interface Orb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  letter: string; // "" for a dragon ball (bonus)
  stars: number;
  born: number;
  eaten?: number; // when swallowed
  wrong?: number; // when bumped with the wrong letter
}
interface VolW {
  time: number;
  score: number;
  x: number; // head, share of the width
  y: number; // share of the height
  a: number; // heading (radians, 0 = right, screen y down)
  path: { x: number; y: number }[]; // past head positions, newest first
  len: number; // body segments
  orbs: Orb[];
  spawn: number;
  target: string;
  pops: { id: number; x: number; y: number; t: number; text: string; good: boolean }[];
}

const VOL_GAP = 0.034; // between body segments (shares of the height)
const VOL_MIN = 7;
const VOL_MAX = 38;
const VOL_EDGE = 0.06;

function Vol({ letters, onDone, level, seconds }: GameProps & { letters: string[] }) {
  const pace = paceOf(level);
  const pool = letters.length ? letters : ["a", "i", "o"];
  const others = pool.length > 1 ? pool : ["a", "i", "o", "u"];
  const box = useRef<HTMLDivElement>(null);
  // Width / height of the screen (the game fills it).
  const [ar] = useState(() => (typeof window === "undefined" ? 1.5 : window.innerWidth / Math.max(1, window.innerHeight)));
  const finger = useRef<{ x: number; y: number } | null>(null);

  const { world, phase, count } = useGame<VolW>(
    () => ({ time: 0, score: 0, x: 0.3, y: 0.55, a: 0, path: [], len: VOL_MIN, orbs: [], spawn: 0.3, target: pool[Math.floor(Math.random() * pool.length)], pops: [] }),
    (w, dt) => {
      let { a, len, score, spawn, target } = w;
      // Turn toward the finger (a dragon turns in a curve, never on the spot).
      const f = finger.current;
      if (f) {
        const want = Math.atan2(f.y - w.y, (f.x - w.x) * ar);
        const near = Math.hypot((f.x - w.x) * ar, f.y - w.y) < 0.03;
        if (!near) {
          let d = want - a;
          while (d > Math.PI) d -= 2 * Math.PI;
          while (d < -Math.PI) d += 2 * Math.PI;
          const turn = 5.5 * dt;
          a += Math.max(-turn, Math.min(turn, d));
        }
      }
      const v = (0.34 + Math.min(0.12, w.time * 0.003)) * pace;
      let x = w.x + (Math.cos(a) * v * dt) / ar;
      let y = w.y + Math.sin(a) * v * dt;
      // Bounce off the edges of the sky.
      if (x < VOL_EDGE || x > 1 - VOL_EDGE) {
        a = Math.PI - a;
        x = Math.min(1 - VOL_EDGE, Math.max(VOL_EDGE, x));
      }
      if (y < VOL_EDGE + 0.06 || y > 1 - VOL_EDGE) {
        a = -a;
        y = Math.min(1 - VOL_EDGE, Math.max(VOL_EDGE + 0.06, y));
      }
      const path = [{ x, y }, ...w.path].slice(0, 400);
      const pops = w.pops.filter((p) => w.time - p.t < 0.7);

      const orbs: Orb[] = [];
      for (const o of w.orbs) {
        if (o.eaten !== undefined) {
          if (w.time - o.eaten < 0.35) orbs.push(o);
          continue;
        }
        if (w.time - o.born > 10) continue; // drifted too long: it fades away
        let { vx, vy } = o;
        let ox = o.x + vx * dt;
        let oy = o.y + vy * dt;
        if (ox < 0.08 || ox > 0.92) vx = -vx;
        if (oy < 0.2 || oy > 0.9) vy = -vy;
        ox = Math.min(0.92, Math.max(0.08, ox));
        oy = Math.min(0.9, Math.max(0.2, oy));
        const hit = Math.hypot((ox - x) * ar, oy - y) < 0.085;
        if (hit && !(o.wrong !== undefined && w.time - o.wrong < 0.8)) {
          if (!o.letter || o.letter === target) {
            const gain = o.letter ? level : 3 * level;
            score += gain;
            len = Math.min(VOL_MAX, len + (o.letter ? 2 : 3));
            sfx.good();
            pops.push({ id: nextId++, x: ox, y: oy, t: w.time, text: `+${gain}`, good: true });
            orbs.push({ ...o, x: ox, y: oy, eaten: w.time });
            continue;
          }
          // The wrong letter: it bounces away, and the dragon gets a little shorter.
          sfx.bad();
          len = Math.max(VOL_MIN, len - 1);
          orbs.push({ ...o, x: ox, y: oy, vx: Math.cos(a) * 0.35, vy: Math.sin(a) * 0.35, wrong: w.time });
          continue;
        }
        const slow = o.wrong !== undefined ? 0.96 : 1; // a bumped orb slows down again
        orbs.push({ ...o, x: ox, y: oy, vx: vx * slow, vy: vy * slow });
      }

      spawn -= dt;
      const live = orbs.filter((o) => o.eaten === undefined);
      if (spawn <= 0 && live.length < 7) {
        spawn = rand(0.7, 1.1) / pace;
        const ball = Math.random() < 0.08;
        const wantTarget = live.filter((o) => o.letter === target).length < 2 || Math.random() < 0.4;
        const wrongs = others.filter((l) => l !== target);
        const letter = ball ? "" : wantTarget || !wrongs.length ? target : wrongs[Math.floor(Math.random() * wrongs.length)];
        // Away from the dragon's head, so it can be seen coming.
        let ox = rand(0.12, 0.88);
        let oy = rand(0.25, 0.85);
        for (let k = 0; k < 6 && Math.hypot((ox - x) * ar, oy - y) < 0.3; k++) {
          ox = rand(0.12, 0.88);
          oy = rand(0.25, 0.85);
        }
        const ang = rand(0, Math.PI * 2);
        const sp = rand(0.02, 0.06);
        orbs.push({ id: nextId++, x: ox, y: oy, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, letter, stars: 1 + Math.floor(Math.random() * 7), born: w.time });
      }

      // A new letter to find every 15 seconds.
      if (Math.floor(w.time / 15) !== Math.floor((w.time - dt) / 15) && pool.length > 1) {
        const choices = pool.filter((l) => l !== target);
        target = choices[Math.floor(Math.random() * choices.length)];
      }
      return { ...w, x, y, a, path, len, orbs, spawn, score, target, pops };
    },
    seconds,
  );

  const target = world.target;
  useEffect(() => {
    if (phase === "count" || phase === "play") speak([L.volGo, soundPart(target)]);
  }, [target, phase]);

  const aim = (e: RPointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r) return;
    finger.current = { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  // The body: points along the path the head took, one every VOL_GAP.
  const body: { x: number; y: number; a: number }[] = [];
  {
    let need = VOL_GAP;
    let acc = 0;
    for (let i = 1; i < world.path.length && body.length < world.len; i++) {
      const p = world.path[i - 1];
      const q = world.path[i];
      acc += Math.hypot((q.x - p.x) * ar, q.y - p.y);
      if (acc >= need) {
        body.push({ x: q.x, y: q.y, a: Math.atan2(p.y - q.y, (p.x - q.x) * ar) });
        need += VOL_GAP;
      }
    }
  }
  const deg = (world.a * 180) / Math.PI;
  const flip = Math.cos(world.a) < 0; // keep the head upright when flying left

  return (
    <div
      ref={box}
      className="lz-game lz-game-vol"
      onPointerDown={(e) => {
        aim(e);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // capture is a nicety
        }
      }}
      onPointerMove={(e) => finger.current && aim(e)}
      onPointerUp={() => (finger.current = null)}
      onPointerCancel={() => (finger.current = null)}
    >
      <div className="lz-vol-stars" aria-hidden />
      <Hud score={world.score} time={world.time} icon="✦" seconds={seconds} />
      <button className="lz-bulles-target lz-vol-target" onPointerDown={(e) => e.stopPropagation()} onClick={() => speak([soundPart(target)])} aria-label="Lettre à attraper">
        <span className="lz-read">{GRAPHEME[target]?.display ?? target}</span>
      </button>
      {world.orbs.map((o) => (
        <span
          key={o.id}
          className={`lz-vol-orb ${o.letter ? "" : "is-ball"} ${o.eaten !== undefined ? "is-eaten" : ""} ${o.wrong !== undefined && world.time - o.wrong < 0.5 ? "is-wrong" : ""} ${world.time - o.born > 8.5 ? "is-fading" : ""}`}
          style={{ left: `${o.x * 100}%`, top: `${o.y * 100}%` }}
          aria-hidden
        >
          {o.letter ? <span className="lz-read">{GRAPHEME[o.letter]?.display ?? o.letter}</span> : <DragonBall stars={o.stars} size={56} />}
        </span>
      ))}
      {body
        .map((b, i) => (
          <span
            key={i}
            className={`lz-vol-seg ${i === body.length - 1 ? "is-tail" : ""}`}
            style={{
              left: `${b.x * 100}%`,
              top: `${b.y * 100}%`,
              transform: `translate(-50%, -50%) rotate(${(b.a * 180) / Math.PI}deg) scale(${1 - (0.55 * i) / Math.max(VOL_MIN, body.length)})`,
            }}
            aria-hidden
          />
        ))
        .reverse()}
      <span className="lz-vol-head" style={{ left: `${world.x * 100}%`, top: `${world.y * 100}%`, transform: `translate(-50%, -50%) rotate(${deg}deg) scaleY(${flip ? -1 : 1})` }} aria-hidden>
        <DragonHead />
      </span>
      {world.pops.map((p) => (
        <span key={p.id} className="lz-catch good" style={{ left: `${p.x * 100}%`, top: `${p.y * 100}%` }}>
          <span className="lz-sparks" aria-hidden />
          <span className="lz-pop-text">{p.text}</span>
        </span>
      ))}
      {phase === "play" && world.time < 5 && <span className="lz-route-tip">Guide Shenron avec ton doigt !</span>}
      <Overlay phase={phase} count={count} score={world.score} game="vol" onDone={onDone} />
    </div>
  );
}

/** Shenron's head, facing right: green scales, red eyes, horns, whiskers. */
function DragonHead() {
  return (
    <svg viewBox="0 -6 120 98" width="100%" height="100%">
      <path d="M8 30 Q30 4 62 10 Q60 0 50 -4" fill="none" stroke="#8a5a1c" strokeWidth="5" strokeLinecap="round" />
      <path d="M14 26 Q34 8 56 16 Q66 2 76 -2" fill="none" stroke="#a8742a" strokeWidth="5" strokeLinecap="round" />
      <path d="M2 34 Q4 16 34 16 L82 22 Q108 26 114 40 Q116 50 104 54 L72 58 Q60 74 30 72 Q6 70 2 50 Z" fill="#3f9b3a" stroke="#1d5a1d" strokeWidth="3" />
      <path d="M40 58 L104 54 Q100 64 86 66 L50 70 Q40 68 40 58 Z" fill="#f2dfa0" stroke="#1d5a1d" strokeWidth="2.5" />
      <path d="M76 58 l4 7 l4 -7 M88 57 l4 6 l4 -7" fill="#fff" stroke="#1d5a1d" strokeWidth="1.5" />
      <ellipse cx="74" cy="32" rx="9" ry="6" fill="#fff" stroke="#1d5a1d" strokeWidth="2" />
      <circle cx="77" cy="32" r="4" fill="#d81b1b" />
      <path d="M62 24 Q74 18 88 26" fill="none" stroke="#1d5a1d" strokeWidth="3" strokeLinecap="round" />
      <circle cx="106" cy="40" r="2.5" fill="#1d5a1d" />
      <path d="M100 48 Q120 70 104 88" fill="none" stroke="#e8d37a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M96 50 Q108 78 88 90" fill="none" stroke="#e8d37a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M20 22 l-8 -10 l14 4 M32 18 l-4 -12 l12 8" fill="#3f9b3a" stroke="#1d5a1d" strokeWidth="2" />
    </svg>
  );
}

export function MiniGame({
  id,
  letters,
  level = 1,
  extra = 0,
  goku = "goku.png",
  beam = "blue",
  onDone,
}: {
  id: GameId;
  letters: string[];
  level?: number;
  extra?: number;
  goku?: string;
  beam?: string;
  onDone: () => void;
}) {
  const seconds = GAME_SECONDS + extra;
  if (id === "nuage") return <Nuage onDone={onDone} level={level} seconds={seconds} />;
  if (id === "kame") return <Kame onDone={onDone} level={level} seconds={seconds} goku={goku} beam={beam} />;
  if (id === "memoire") return <Memoire onDone={onDone} level={level} seconds={seconds} />;
  if (id === "route") return <Route onDone={onDone} level={level} seconds={seconds} goku={goku} />;
  if (id === "baton") return <Baton onDone={onDone} level={level} seconds={seconds} />;
  if (id === "vol") return <Vol letters={letters} onDone={onDone} level={level} seconds={seconds} />;
  if (id === "instinct") return <Instinct onDone={onDone} level={level} seconds={seconds} />;
  return <Boules letters={letters} onDone={onDone} level={level} seconds={seconds} />;
}
