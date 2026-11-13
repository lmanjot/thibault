"use client";

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { GRAPHEME, type Seg } from "../content";
import { parseSyl, sylText, type Ex } from "../engine";
import { soundPart, speak, sfx, sylPart, type Part } from "../audio";
import { L, PRAISE } from "../voice";
import { Icon } from "./bits";

const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

/** What Goku says when an exercise appears (all from the voice catalog). Exported for pre-loading. */
export function promptParts(ex: Ex): Part[] {
  switch (ex.t) {
    case "ecoute":
      return [L.doYouHear, soundPart(ex.g), L.inWord, ex.word.w];
    case "lettre":
      return ex.word ? [L.firstSound, ex.word.w, L.showGoodLetter] : [L.showLetter, soundPart(ex.g)];
    case "complete":
      return [L.findSound, soundPart(ex.g), L.asIn, ex.word.w, L.slideIt];
    case "hunt":
      return [L.findAll, soundPart(ex.g), L.three];
    case "fusion":
      return [L.fusion, sylPart(ex.c, ex.v)];
    case "syllabe": {
      const { c, v } = parseSyl(ex.item);
      return [L.show, sylPart(c, v)];
    }
  }
}

function replayParts(ex: Ex): Part[] {
  switch (ex.t) {
    case "ecoute":
      return [soundPart(ex.g), L.inWord, ex.word.w];
    case "lettre":
      return ex.word ? [ex.word.w] : [soundPart(ex.g)];
    case "complete":
      return [soundPart(ex.g), L.asIn, ex.word.w];
    case "hunt":
      return [soundPart(ex.g)];
    case "fusion":
      return [sylPart(ex.c, ex.v)];
    case "syllabe": {
      const { c, v } = parseSyl(ex.item);
      return [sylPart(c, v)];
    }
    default:
      return promptParts(ex);
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A word written with its sounds: the target in orange, silent letters greyed. */
function SpelledWord({ segs, mark, gap, filled }: { segs: Seg[]; mark?: string; gap?: number; filled?: string | null }) {
  return (
    <span className="lz-word">
      {segs.map((sg, i) =>
        i === gap ? (
          <span key={i} className={`lz-gap ${filled ? "is-filled" : ""}`} data-gap>
            {filled ?? "?"}
          </span>
        ) : (
          <span key={i} className={sg.phon === null ? "lz-silent" : sg.text === mark ? "lz-mark" : ""}>
            {sg.text}
          </span>
        ),
      )}
    </span>
  );
}

export function Exercise({ ex, onResult }: { ex: Ex; onResult: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<string | null>(null);
  const [state, setState] = useState<"ask" | "ok" | "ko">("ask");
  const busy = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => speak(promptParts(ex)), 250);
    return () => clearTimeout(t);
  }, [ex]);

  async function answer(choice: string, ok: boolean, feedback: Part[]) {
    if (busy.current) return;
    busy.current = true;
    setPicked(choice);
    setState(ok ? "ok" : "ko");
    if (ok) sfx.good();
    else sfx.bad();
    await speak(feedback);
    await wait(ok ? 300 : 650);
    onResult(ok);
  }

  if (ex.t === "hunt") return <Hunt ex={ex} onResult={onResult} />;

  const speaker = (
    <button className="lz-round lz-speaker" onClick={() => speak(replayParts(ex))} aria-label="Réécouter">
      <Icon name="speaker" size={36} />
    </button>
  );

  // ——— J'entends ? ———
  if (ex.t === "ecoute") {
    const choose = (yes: boolean) => {
      const ok = yes === ex.answer;
      const fb: Part[] = ok
        ? [praise()]
        : ex.answer
          ? [L.yesHeard, ex.word.w]
          : [L.notHeard, soundPart(ex.g), L.inWord, ex.word.w];
      answer(yes ? "yes" : "no", ok, fb);
    };
    const cls = (v: "yes" | "no") => {
      const correct = (v === "yes") === ex.answer;
      if (state === "ask") return "";
      if (picked === v) return correct ? "is-ok" : "is-ko";
      return state === "ko" && correct ? "is-reveal" : "is-dim";
    };
    return (
      <div className="lz-ex">
        <div className="lz-prompt">
          {speaker}
          <button className="lz-pic lz-pic-big" onClick={() => speak([ex.word.w])} aria-label={ex.word.w}>
            <span>{ex.word.pic}</span>
          </button>
          <div className="lz-ear">
            <span className="lz-ear-letter">{GRAPHEME[ex.g].display}</span>
            <span className="lz-ear-q">?</span>
          </div>
        </div>
        <div className="lz-options lz-yesno">
          <button className={`lz-yn yes ${cls("yes")}`} onClick={() => choose(true)} aria-label="Oui">
            <Icon name="check" size={56} />
          </button>
          <button className={`lz-yn no ${cls("no")}`} onClick={() => choose(false)} aria-label="Non">
            <Icon name="cross" size={56} />
          </button>
        </div>
      </div>
    );
  }

  // ——— Complète le mot (drag & drop) ———
  if (ex.t === "complete") {
    const target = ex.g;
    const choose = (o: string) => {
      const ok = o === target;
      const fb: Part[] = ok
        ? [ex.word.w, praise()]
        : [L.thatIs, soundPart(o), L.needed, soundPart(target), ex.word.w];
      answer(o, ok, fb);
    };
    const filled = state === "ok" ? GRAPHEME[target].display : state === "ko" && picked ? GRAPHEME[picked].display : null;
    return (
      <div className="lz-ex lz-complete">
        <div className="lz-complete-top">
          <button className="lz-pic lz-pic-big" onClick={() => speak([ex.word.w])} aria-label={ex.word.w}>
            <span>{ex.word.pic}</span>
          </button>
          <div className={`lz-wordline ${state === "ok" ? "is-ok" : state === "ko" ? "is-ko" : ""}`}>
            <SpelledWord segs={ex.segs} gap={ex.gap} filled={filled} />
          </div>
          {speaker}
        </div>
        <DragOptions
          options={ex.options}
          label={(o) => GRAPHEME[o].display}
          state={state}
          picked={picked}
          target={target}
          onDrop={choose}
        />
      </div>
    );
  }

  // ——— Trouve la lettre / Quelle syllabe ———
  if (ex.t === "lettre" || ex.t === "syllabe") {
    const isSyl = ex.t === "syllabe";
    const target = isSyl ? ex.item : ex.g;
    const label = (o: string) => (isSyl ? sylText(parseSyl(o).c, parseSyl(o).v) : GRAPHEME[o].display);
    const say = (o: string): Part => (isSyl ? sylPart(parseSyl(o).c, parseSyl(o).v) : soundPart(o));
    const choose = (o: string) => {
      const ok = o === target;
      const fb: Part[] = ok
        ? isSyl
          ? [say(o), praise()]
          : [praise()]
        : isSyl
          ? [L.thatIs, say(o), L.wanted, say(target)]
          : ex.t === "lettre" && ex.word
            ? [L.theWord, ex.word.w, L.startsWith, soundPart(target)]
            : [L.itsThisOne, soundPart(target)];
      answer(o, ok, fb);
    };
    return (
      <div className="lz-ex">
        <div className="lz-prompt">
          {speaker}
          {ex.t === "lettre" && ex.word && (
            <button className="lz-pic lz-pic-big" onClick={() => speak([ex.word!.w])} aria-label={ex.word.w}>
              <span>{ex.word.pic}</span>
            </button>
          )}
        </div>
        <div className={`lz-options n${ex.options.length}`}>
          {ex.options.map((o) => {
            let c = "";
            if (state !== "ask") {
              if (o === picked) c = o === target ? "is-ok" : "is-ko";
              else if (o === target && state === "ko") c = "is-reveal";
              else c = "is-dim";
            }
            return (
              <button key={o} className={`lz-tile ${isSyl ? "syl" : ""} ${c}`} onClick={() => choose(o)}>
                {label(o)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ——— Fusion ———
  const { c, v } = ex;
  const choose = (o: string) => {
    const ok = o === v;
    const fb: Part[] = ok ? [sylPart(c, o), praise()] : [sylPart(c, o), L.noWanted, sylPart(c, v)];
    answer(o, ok, fb);
  };
  return (
    <div className="lz-ex lz-fusion">
      <div className="lz-prompt">{speaker}</div>
      <div className={`lz-fuse ${picked ? "is-fused" : ""} ${state === "ok" ? "is-ok" : state === "ko" ? "is-ko" : ""}`}>
        <span className="lz-tile lz-cons">{GRAPHEME[c].display}</span>
        <span className="lz-slot" data-gap>
          {picked ? GRAPHEME[picked].display : ""}
        </span>
        <span className="lz-fuse-flash" />
      </div>
      <DragOptions options={ex.options} label={(o) => GRAPHEME[o].display} state={state} picked={picked} target={v} onDrop={choose} vowel />
    </div>
  );
}

type DragState = { o: string; dx: number; dy: number; scale: number; mode: "drag" | "fly" | "back" };

/** Size the tile should have to fit exactly in the gap. */
function gapFit(tile: DOMRect, gap: DOMRect) {
  return Math.min(gap.width / tile.width, gap.height / tile.height);
}

/** Letter tiles to drag onto the element marked [data-gap] (a tap works too): the tile lifts,
 * follows the finger and shrinks as it nears the gap, then flies in at the gap's exact size,
 * or springs back to its place. */
function DragOptions({
  options,
  label,
  state,
  picked,
  target,
  onDrop,
  vowel,
}: {
  options: string[];
  label: (o: string) => string;
  state: "ask" | "ok" | "ko";
  picked: string | null;
  target: string;
  onDrop: (o: string) => void;
  vowel?: boolean;
}) {
  const [drag, setDrag] = useState<DragState | null>(null);
  const start = useRef<{
    x: number;
    y: number;
    cx: number;
    cy: number;
    fit: number; // scale at which the tile matches the gap
    dist0: number; // starting distance from the gap
    moved: boolean;
  } | null>(null);

  const LIFT = 1.08;

  const down = (o: string) => (e: RPointerEvent<HTMLButtonElement>) => {
    if (state !== "ask" || drag) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // capture is a nicety; dragging still works without it
    }
    const r = e.currentTarget.getBoundingClientRect();
    const gap = document.querySelector("[data-gap]")?.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    start.current = {
      x: e.clientX,
      y: e.clientY,
      cx,
      cy,
      fit: gap ? gapFit(r, gap) : 1,
      dist0: gap ? Math.max(1, Math.hypot(gap.left + gap.width / 2 - cx, gap.top + gap.height / 2 - cy)) : 1,
      moved: false,
    };
    setDrag({ o, dx: 0, dy: 0, scale: LIFT, mode: "drag" });
    sfx.tap();
  };
  const move = (e: RPointerEvent<HTMLButtonElement>) => {
    const st = start.current;
    if (!st || drag?.mode !== "drag") return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    if (Math.hypot(dx, dy) > 8) st.moved = true;
    // Shrink smoothly toward the gap's size as the tile gets closer to it.
    const gap = document.querySelector("[data-gap]")?.getBoundingClientRect();
    let scale = LIFT;
    if (gap) {
      const d = Math.hypot(gap.left + gap.width / 2 - (st.cx + dx), gap.top + gap.height / 2 - (st.cy + dy));
      const t = Math.min(1, d / st.dist0);
      scale = st.fit + (LIFT - st.fit) * t;
    }
    setDrag({ ...drag, dx, dy, scale });
  };
  const up = (e: RPointerEvent<HTMLButtonElement>) => {
    const st = start.current;
    if (!st || drag?.mode !== "drag") return;
    start.current = null;
    const o = drag.o;
    const gap = document.querySelector("[data-gap]")?.getBoundingClientRect();
    const pad = 50;
    const inside =
      !!gap && e.clientX > gap.left - pad && e.clientX < gap.right + pad && e.clientY > gap.top - pad && e.clientY < gap.bottom + pad;
    if (gap && (!st.moved || inside)) {
      // Fly into the gap at exactly its size, then answer.
      setDrag({ o, dx: gap.left + gap.width / 2 - st.cx, dy: gap.top + gap.height / 2 - st.cy, scale: st.fit, mode: "fly" });
      setTimeout(() => {
        setDrag(null);
        onDrop(o);
      }, 280);
    } else {
      setDrag({ o, dx: 0, dy: 0, scale: 1, mode: "back" });
      setTimeout(() => setDrag(null), 380);
    }
  };

  return (
    <div className={`lz-options n${options.length}`}>
      {options.map((o) => {
        let c = "";
        if (state !== "ask") {
          if (o === picked) c = "is-placed";
          else if (o === target && state === "ko") c = "is-reveal";
          else c = "is-dim";
        }
        const d = drag?.o === o ? drag : null;
        return (
          <button
            key={o}
            className={`lz-tile ${vowel ? "lz-vow" : ""} ${c} ${d ? `is-${d.mode}` : ""}`}
            style={d ? { transform: `translate(${d.dx}px, ${d.dy}px) scale(${d.scale})` } : undefined}
            onPointerDown={down(o)}
            onPointerMove={move}
            onPointerUp={up}
            onPointerCancel={() => {
              start.current = null;
              setDrag((x) => (x ? { ...x, dx: 0, dy: 0, scale: 1, mode: "back" } : null));
              setTimeout(() => setDrag(null), 380);
            }}
          >
            {label(o)}
          </button>
        );
      })}
    </div>
  );
}

/** "Trouve tous les a": tap every target in the grid. */
function Hunt({ ex, onResult }: { ex: Extract<Ex, { t: "hunt" }>; onResult: (ok: boolean) => void }) {
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const missed = useRef(false);
  const done = useRef(false);
  const total = ex.letters.filter((l) => l === ex.g).length;

  async function tap(i: number) {
    if (done.current || found.includes(i)) return;
    if (ex.letters[i] === ex.g) {
      const next = [...found, i];
      setFound(next);
      sfx.good();
      if (next.length === total) {
        done.current = true;
        await speak([missed.current ? L.foundAll : praise()]);
        await wait(300);
        onResult(!missed.current);
      } else speak([soundPart(ex.g)]);
    } else {
      missed.current = true;
      setWrong(i);
      sfx.bad();
      speak([L.thatIs, soundPart(ex.letters[i])]);
      setTimeout(() => setWrong(null), 600);
    }
  }

  return (
    <div className="lz-ex">
      <div className="lz-prompt">
        <button className="lz-round lz-speaker" onClick={() => speak(promptParts(ex))} aria-label="Réécouter">
          <Icon name="speaker" size={36} />
        </button>
        <div className="lz-hunt-count">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={i < found.length ? "on" : ""}>
              {GRAPHEME[ex.g].display}
            </span>
          ))}
        </div>
      </div>
      <div className={`lz-hunt n${ex.letters.length}`}>
        {ex.letters.map((l, i) => (
          <button
            key={i}
            className={`lz-tile lz-tile-sm ${found.includes(i) ? "is-ok is-found" : ""} ${wrong === i ? "is-ko" : ""}`}
            onClick={() => tap(i)}
          >
            {GRAPHEME[l].display}
          </button>
        ))}
      </div>
    </div>
  );
}

