"use client";

import { useEffect, useRef } from "react";
import { ASSET, type Form } from "../content";
import { roundOf, ROUNDS } from "../engine";

export function Goku({
  form,
  size = "lg",
  state,
  as,
}: {
  form: Form;
  size?: "sm" | "md" | "lg";
  state?: "hit" | "cheer" | "";
  as?: { id?: string; name: string; img: string }; // a friend fighting instead of Goku
}) {
  if (as?.id)
    return (
      <div className={`lz-goku lz-goku-${size} fx-base is-friend ${state ? `is-${state}` : ""}`}>
        <div className="lz-aura" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lz-goku-img" src={ASSET(as.img)} alt={as.name} draggable={false} />
      </div>
    );
  const has = (i: string) => form.items.includes(i as Form["items"][number]);
  return (
    <div className={`lz-goku lz-goku-${size} fx-${form.fx} ${form.kid ? "is-kid" : ""} ${state ? `is-${state}` : ""}`}>
      <div className="lz-aura" />
      <div className="lz-aura lz-aura-2" />
      {has("shenron") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="lz-shenron" src={ASSET("shenron.png")} alt="" draggable={false} />
      )}
      {has("genki") && <div className="lz-genki" />}
      {has("staff") && <Staff />}
      {(form.fx === "ssj2" || form.fx === "ssj3" || form.fx === "blue") && <div className="lz-sparks" />}
      {has("teleport") && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="lz-ghost" src={ASSET(form.sprite)} alt="" draggable={false} />
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="lz-goku-img" src={ASSET(form.sprite)} alt={form.name} draggable={false} />
      {has("kame") && <div className="lz-kame-orb" />}
      {has("cloud") && <div className="lz-cloud lz-goku-cloud" />}
      {!!form.balls && (
        <div className="lz-balls">
          {Array.from({ length: form.balls }, (_, i) => (
            <DragonBall key={i} stars={i + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

/** The Nyoibo, Goku's magic staff. */
function Staff() {
  return (
    <svg className="lz-staff" viewBox="0 0 20 200" aria-hidden>
      <rect x="6" y="10" width="8" height="180" rx="3" fill="#c81e1e" />
      <rect x="4.5" y="4" width="11" height="16" rx="3" fill="#f2b705" />
      <rect x="4.5" y="180" width="11" height="16" rx="3" fill="#f2b705" />
    </svg>
  );
}

// Where the red stars sit on a dragon ball (1 to 7), on a 100×100 ball.
const STAR_SPOTS: [number, number][][] = [
  [[50, 52]],
  [[40, 52], [60, 52]],
  [[50, 41], [39, 60], [61, 60]],
  [[40, 41], [60, 41], [40, 61], [60, 61]],
  [[50, 51], [37, 39], [63, 39], [37, 63], [63, 63]],
  [[36, 44], [50, 37], [64, 44], [36, 60], [50, 67], [64, 60]],
  [[50, 52], [36, 44], [50, 35], [64, 44], [36, 61], [50, 69], [64, 61]],
];

function starPath(cx: number, cy: number, r: number) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? r * 0.45 : r;
    return `${(cx + rr * Math.cos(a)).toFixed(1)},${(cy + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M${pts.join("L")}Z`;
}

/** A dragon ball: glossy orange crystal with its 1–7 red stars. */
export function DragonBall({ stars, size = 30, className = "" }: { stars: number; size?: number; className?: string }) {
  const n = Math.max(1, Math.min(7, stars));
  const r = n === 1 ? 15 : n <= 3 ? 11 : 9;
  return (
    <svg className={`lz-dbsvg ${className}`} width={size} height={size} viewBox="0 0 100 100" aria-label={`Boule à ${n} étoile${n > 1 ? "s" : ""}`}>
      <defs>
        <radialGradient id="lz-db-body" cx="38%" cy="32%" r="70%">
          <stop offset="0" stopColor="#fff4c2" />
          <stop offset="0.25" stopColor="#ffc23a" />
          <stop offset="0.7" stopColor="#f58a07" />
          <stop offset="1" stopColor="#c45a00" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="47" fill="url(#lz-db-body)" stroke="#a84a00" strokeWidth="2" />
      {STAR_SPOTS[n - 1].map(([x, y], i) => (
        <path key={i} d={starPath(x, y, r)} fill="#e0261b" stroke="#9e1209" strokeWidth="1.2" strokeLinejoin="round" />
      ))}
      <ellipse cx="34" cy="26" rx="15" ry="8" fill="#fff" opacity="0.75" transform="rotate(-30 34 26)" />
      <circle cx="70" cy="74" r="5" fill="#fff" opacity="0.25" />
    </svg>
  );
}

export function Stars({ n, of = 3, size = 28, perfect }: { n: number; of?: number; size?: number; perfect?: boolean }) {
  return (
    <span className={`lz-stars ${perfect ? "is-perfect" : ""}`} aria-label={perfect ? "Sans-faute : étoiles bleues" : `${n} étoiles sur ${of}`}>
      {Array.from({ length: of }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" className={i < n ? "on" : "off"} style={{ animationDelay: `${0.25 + i * 0.3}s` }}>
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </span>
  );
}

/** Good sessions toward clearing a letter (3 to clear). */
/**
 * A letter's dots: 3 per round, green, then yellow, then red (see roundOf). The dots of the
 * finished rounds show as a small ring of their colour behind the current ones.
 */
export function Pips({ level }: { level: number }) {
  const { round, dots } = roundOf(level);
  return (
    <span className={`lz-pips round-${round} ${round === 2 && dots === 3 ? "is-mastered" : ""}`} aria-label={`${dots} réussites sur 3 (points ${ROUNDS[round]})`}>
      {[1, 2, 3].map((i) => (
        <i key={i} className={i <= dots ? "on" : ""} />
      ))}
    </span>
  );
}

type IconName = "speaker" | "close" | "check" | "cross" | "lock" | "gear" | "play" | "arrow" | "mic" | "stop" | "trash" | "fist" | "back";

export function Icon({ name, size = 28 }: { name: IconName; size?: number }) {
  const p = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "speaker":
      return (
        <svg {...p}>
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          <path d="M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11" />
        </svg>
      );
    case "close":
      return (
        <svg {...p}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "check":
      return (
        <svg {...p} strokeWidth={3.4}>
          <path d="M4.5 12.5l5 5L19.5 7" />
        </svg>
      );
    case "cross":
      return (
        <svg {...p} strokeWidth={3.4}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "lock":
      return (
        <svg {...p}>
          <rect x="5" y="10.5" width="14" height="10" rx="2.5" fill="currentColor" />
          <path d="M8 10.5V8a4 4 0 018 0v2.5" />
        </svg>
      );
    case "gear":
      return (
        <svg {...p} strokeWidth={2}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M12 2.8v2.4M12 18.8v2.4M21.2 12h-2.4M5.2 12H2.8M18.5 5.5l-1.7 1.7M7.2 16.8l-1.7 1.7M18.5 18.5l-1.7-1.7M7.2 7.2L5.5 5.5" />
        </svg>
      );
    case "play":
      return (
        <svg {...p}>
          <path d="M8 5.5v13l10.5-6.5z" fill="currentColor" />
        </svg>
      );
    case "arrow":
      return (
        <svg {...p} strokeWidth={3}>
          <path d="M5 12h13M13 6l6 6-6 6" />
        </svg>
      );
    case "back":
      return (
        <svg {...p} strokeWidth={3}>
          <path d="M19 12H6M11 6l-6 6 6 6" />
        </svg>
      );
    case "mic":
      return (
        <svg {...p}>
          <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
          <path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" />
        </svg>
      );
    case "stop":
      return (
        <svg {...p}>
          <rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" />
        </svg>
      );
    case "trash":
      return (
        <svg {...p} strokeWidth={2.2}>
          <path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" />
        </svg>
      );
    case "fist":
      return (
        <svg {...p} strokeWidth={2.2}>
          <path d="M7 10V7.5a1.5 1.5 0 013 0V10M10 9.5V6.5a1.5 1.5 0 013 0v3M13 9.5V7a1.5 1.5 0 013 0v4.5M7 10a1.5 1.5 0 00-3 0v3.5A6.5 6.5 0 0010.5 20h1A6.5 6.5 0 0018 13.5V11a1.5 1.5 0 00-2-1.4" fill="currentColor" fillOpacity=".25" />
        </svg>
      );
  }
}

/** A zéni coin. */
export function Zeni({ size = 22 }: { size?: number }) {
  return (
    <span className="lz-coin" style={{ width: size, height: size, fontSize: size * 0.6 }} aria-label="zénis">
      Z
    </span>
  );
}

/** Choose who fights: Goku or a friend bought in Bulma's shop. */
export function FighterPicker({
  options,
  current,
  onPick,
}: {
  options: { id?: string; name: string; img: string }[];
  current?: string;
  onPick: (id?: string) => void;
}) {
  const row = useRef<HTMLDivElement>(null);
  // Many friends: the chosen one is brought into view.
  useEffect(() => {
    const el = row.current;
    const on = el?.querySelector<HTMLElement>(".is-on");
    if (!el || !on) return;
    const r = on.getBoundingClientRect();
    el.scrollLeft += r.left - el.getBoundingClientRect().left - (el.clientWidth - r.width) / 2; // only this row moves
  }, [current]);
  if (options.length < 2) return null;
  return (
    <div className="lz-fighters" role="radiogroup" aria-label="Combattant" ref={row}>
      {options.map((f) => (
        <button
          key={f.id ?? "goku"}
          role="radio"
          aria-checked={f.id === current}
          aria-label={f.name}
          className={`lz-fighter-pick ${f.id === current ? "is-on" : ""}`}
          onClick={() => onPick(f.id)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ASSET(f.img)} alt="" draggable={false} />
        </button>
      ))}
    </div>
  );
}
