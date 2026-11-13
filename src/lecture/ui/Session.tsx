"use client";

import { useEffect, useRef, useState } from "react";
import { ASSET, type Boss, type Form } from "../content";
import { itemOf, type Ex } from "../engine";
import { zeniFor } from "../shop";
import { playKamehameha, prefetch, prefetchKamehameha, sfx, speak, stopSpeech } from "../audio";
import { L } from "../voice";

import { Exercise, promptParts } from "./Exercise";
import { Goku, Icon, Zeni } from "./bits";

/** How long the voiced final Kamehameha lasts before moving on. */
// The finishing Kamehameha follows the real cry: the ki charges while Goku shouts,
// the beam fires on the last "HA" and lands as the sound ends.
const FINAL_MS = 7000;
const FINAL_IMPACT_MS = 5600;

export interface SessionResult {
  ok: number; // first-try correct
  total: number; // scored exercises
  answers: { item: string; ok: boolean }[];
  zeni: number; // coins earned by the answers
}

/** The expected answer, exposed only in development so automated checks can play a session. */
function devAnswer(ex: Ex): string {
  if (ex.t === "ecoute") return ex.answer ? "yes" : "no";
  if (ex.t === "fusion") return ex.v;
  if (ex.t === "syllabe") return ex.item;
  return ex.g;
}

/** Calm, bright Dragon Ball places for training (the darker ones are for bosses). */
const TRAINING_BGS = ["bg_papaya.png", "bg_namek.png", "bg_road.png"];

const SECTION_LABEL: Record<string, string> = {
  warm: "Échauffement",
  train: "Entraînement",
  defi: "Défi",
  boss: "Combat",
};

export function Session({
  exercises,
  form,
  boss,
  onExit,
  onDone,
}: {
  exercises: Ex[];
  form: Form;
  boss?: Boss;
  onExit: () => void;
  onDone: (r: SessionResult) => void;
}) {
  const [queue, setQueue] = useState(() => exercises.map((ex, i) => ({ ex, key: i, tries: 0 })));
  const [pos, setPos] = useState(0);
  const [fx, setFx] = useState<"" | "beam" | "final" | "hit">("");
  const result = useRef<SessionResult>({ ok: 0, total: 0, answers: [], zeni: 0 });
  const scoredTotal = exercises.length;
  const [hits, setHits] = useState(0);
  const [pop, setPop] = useState<{ n: number; key: number } | null>(null);
  const [bg] = useState(() => TRAINING_BGS[Math.floor(Math.random() * TRAINING_BGS.length)]);

  const cur = queue[pos];

  // Pre-load the voice lines of the whole session so answers feel instant.
  useEffect(() => {
    exercises.forEach((ex) => prefetch(promptParts(ex)));
    if (boss) prefetchKamehameha();
  }, [exercises, boss]);

  function handle(ok: boolean) {
    const { ex, tries } = cur;
    const r = result.current;
    let nextQueue = queue;
    const newHits = hits + (ok && boss ? 1 : 0);
    r.answers.push({ item: itemOf(ex), ok });
    if (ok) {
      const z = zeniFor(ex, tries === 0, !!boss);
      r.zeni += z;
      setPop({ n: z, key: r.answers.length });
    }
    if (tries === 0) {
      r.total += 1;
      if (ok) r.ok += 1;
    }
    if (ok && boss) setHits(newHits);
    // A miss comes back about 3 questions later: once in training, up to twice against a boss.
    if (!ok && tries < (boss ? 2 : 1)) {
      const at = Math.min(pos + 4, queue.length);
      const again = { ex, key: 1000 * (tries + 1) + queue.length + pos, tries: tries + 1 };
      nextQueue = [...queue.slice(0, at), again, ...queue.slice(at)];
      setQueue(nextQueue);
    }
    const advance = () => {
      if (pos + 1 < nextQueue.length) return setPos(pos + 1);
      // The boss always falls: any HP left is finished off with one last Kamehameha.
      if (boss && newHits < scoredTotal) {
        setHits(scoredTotal);
        finalBlow();
        setTimeout(() => onDone(r), FINAL_MS);
      } else onDone(r);
    };
    if (boss) {
      // The answer that empties the boss's HP is the big, voiced Kamehameha.
      const last = ok && newHits >= scoredTotal;
      if (last) finalBlow();
      else if (ok) {
        setFx("beam");
        sfx.beam();
      } else {
        setFx("hit");
        sfx.hit();
      }
      setTimeout(
        () => {
          setFx("");
          advance();
        },
        last ? FINAL_MS : 900,
      );
    } else {
      advance();
    }
  }

  function finalBlow() {
    setFx("final");
    playKamehameha().then((ok) => {
      if (!ok) {
        sfx.beam(true);
        speak([L.kamehameha]);
      }
    });
    setTimeout(() => sfx.boom(), FINAL_IMPACT_MS);
  }

  // Boss HP = number of scored exercises; misses come back, so it always falls.
  const hp = boss ? Math.max(0, scoredTotal - hits) : 0;
  const progress = boss ? hits / Math.max(1, scoredTotal) : pos / Math.max(1, queue.length);

  return (
    <div className={`lz-session ${boss ? "is-boss" : ""}`} style={{ backgroundImage: `url(${ASSET(boss ? boss.bg : bg)})` }}>
      <div className="lz-topbar">
        <button
          className="lz-round lz-small"
          aria-label="Quitter"
          onClick={() => {
            stopSpeech();
            onExit();
          }}
        >
          <Icon name="close" size={24} />
        </button>
        <div className="lz-kibar" aria-label="Progression">
          <div style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        {pop && (
          <span key={pop.key} className="lz-zpop">
            +{pop.n} <Zeni />
          </span>
        )}
        <span className="lz-section">{boss ? boss.name : SECTION_LABEL[cur?.ex.section ?? "train"]}</span>
      </div>

      {boss && (
        <div className="lz-arena">
          <div className={`lz-fighter ${fx === "hit" ? "is-hit" : ""}`}>
            <Goku form={form} size="md" state={fx === "hit" ? "hit" : ""} />
          </div>
          {(fx === "beam" || fx === "final") && (
            <div className={`lz-kame ${fx === "final" ? "is-final" : ""}`} aria-hidden>
              <span className="lz-kame-charge" />
              <span className="lz-kame-beam" />
              <span className="lz-kame-impact" />
              {fx === "final" && <span className="lz-kame-ring" />}
            </div>
          )}
          <div className={`lz-boss fx-${boss.fx ?? "none"} ${fx === "beam" ? "is-hit" : fx === "final" ? "is-final-hit" : ""} ${fx === "hit" ? "is-attack" : ""}`}>
            <div className="lz-hp">
              <div style={{ width: `${(hp / Math.max(1, scoredTotal)) * 100}%` }} />
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSET(boss.sprite)} alt={boss.name} draggable={false} />
          </div>
        </div>
      )}

      <div className="lz-stage" data-answer={process.env.NODE_ENV === "development" && cur ? devAnswer(cur.ex) : undefined}>
        {cur && <Exercise key={cur.key} ex={cur.ex} onResult={handle} />}
      </div>

      {!boss && (
        <div className="lz-coach">
          <Goku form={form} size="sm" />
        </div>
      )}
    </div>
  );
}
