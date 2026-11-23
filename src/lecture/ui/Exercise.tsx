"use client";

import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from "react";
import { GRAPHEME, type Seg } from "../content";
import { parseSyl, sylText, type Ex } from "../engine";
import { soundPart, speak, sfx, stopSpeech, sylPart, type Part } from "../audio";
import { GOOD_SCORE, listen } from "../listen";
import { L, PRAISE } from "../voice";
import { STROKES } from "../strokes";
import { Icon } from "./bits";

const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

/** A drawing of a syllable (le, la…) rather than a letter: its item is the syllable. */
const traceSyl = (ex: Extract<Ex, { t: "trace" }>) => ex.item.startsWith("s:");
const tracePart = (ex: Extract<Ex, { t: "trace" }>): Part => {
  if (!traceSyl(ex)) return soundPart(ex.g);
  const { c, v } = parseSyl(ex.item);
  return sylPart(c, v);
};
const traceText = (ex: Extract<Ex, { t: "trace" }>) => {
  if (!traceSyl(ex)) return GRAPHEME[ex.g].display;
  const { c, v } = parseSyl(ex.item);
  return sylText(c, v);
};

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
    case "mots":
      return [L.findWords, soundPart(ex.g)];
    case "fusion":
      return [L.fusion, sylPart(ex.c, ex.v), L.fusionSlide];
    case "syllabe": {
      const { c, v } = parseSyl(ex.item);
      return [L.show, sylPart(c, v)];
    }
    case "trace":
      return traceSyl(ex) ? [L.traceSyl, tracePart(ex)] : [L.trace, soundPart(ex.g)];
    case "dire":
      return [L.readAloud]; // never the syllable itself: he reads it
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
    case "mots":
      return [soundPart(ex.g)];
    case "fusion":
      return [L.fusion, sylPart(ex.c, ex.v), L.fusionSlide];
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
  if (ex.t === "mots") return <Mots ex={ex} onResult={onResult} />;
  if (ex.t === "trace") return <Trace ex={ex} onResult={onResult} />;
  if (ex.t === "dire") return <Dire ex={ex} onResult={onResult} />;

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

/**
 * « Lis à voix haute »: the syllable is shown, he touches the microphone and reads it.
 * Read well → right. Not quite → one more try, then Goku says it and he repeats it (no longer counts as right).
 * Nothing heard → he is asked to speak louder. No microphone, refused or offline → the same syllable to find by tapping.
 */
function Dire({ ex, onResult }: { ex: Extract<Ex, { t: "dire" }>; onResult: (ok: boolean) => void }) {
  const { c, v } = parseSyl(ex.item);
  const text = sylText(c, v);
  const [phase, setPhase] = useState<"idle" | "rec" | "wait" | "ok" | "ko" | "tap">("idle");
  const misses = useRef(0);
  const silences = useRef(0);

  async function go() {
    if (phase !== "idle") return;
    stopSpeech();
    sfx.tap();
    setPhase("rec");
    const r = await listen(text, () => setPhase("wait"));
    if (r.kind === "unavailable") return setPhase("tap");
    if (r.kind === "silence") {
      silences.current += 1;
      if (silences.current >= 3) return setPhase("tap"); // he'd rather not talk today: tap it instead
      setPhase("idle");
      return void speak([L.speakUp]);
    }
    if (r.score >= GOOD_SCORE) {
      setPhase("ok");
      sfx.good();
      await speak([sylPart(c, v), praise()]);
      await wait(300);
      return onResult(misses.current < 2); // right after Goku said it himself: not counted as read alone
    }
    misses.current += 1;
    if (misses.current === 1) {
      setPhase("idle");
      return void speak([L.readAgain]);
    }
    if (misses.current === 2) {
      setPhase("idle");
      return void speak([L.repeatAfter, sylPart(c, v)]);
    }
    setPhase("ko");
    sfx.bad();
    await speak([L.wanted, sylPart(c, v)]);
    await wait(650);
    onResult(false);
  }

  if (phase === "tap") return <Exercise ex={ex.tap} onResult={onResult} />;
  return (
    <div className="lz-ex lz-dire">
      <div className="lz-prompt">
        <button className="lz-round lz-speaker" onClick={() => speak([L.readAloud])} aria-label="Réécouter">
          <Icon name="speaker" size={36} />
        </button>
      </div>
      <div className={`lz-tile syl lz-dire-syl ${phase === "ok" ? "is-ok" : phase === "ko" ? "is-ko" : ""}`}>{text}</div>
      <button className={`lz-dire-mic is-${phase}`} onClick={go} disabled={phase !== "idle"} aria-label="Lire à voix haute">
        <Icon name="mic" size={56} />
      </button>
    </div>
  );
}

type DragState ={ o: string; dx: number; dy: number; scale: number; mode: "drag" | "fly" | "back" };

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

/**
 * "Touche les mots qui ont… e": written words, the letter never shown. A word found lights its
 * letter and is read; a wrong one shakes and is read too, so he hears the sound is not there.
 */
function Mots({ ex, onResult }: { ex: Extract<Ex, { t: "mots" }>; onResult: (ok: boolean) => void }) {
  const [found, setFound] = useState<number[]>([]);
  const [wrong, setWrong] = useState<number | null>(null);
  const missed = useRef(false);
  const done = useRef(false);
  const total = ex.words.filter((w) => w.ok).length;
  const mark = GRAPHEME[ex.g].display;

  async function tap(i: number) {
    if (done.current || found.includes(i)) return;
    const w = ex.words[i];
    if (w.ok) {
      const next = [...found, i];
      setFound(next);
      sfx.good();
      if (next.length === total) {
        done.current = true;
        await speak([w.word.w, missed.current ? L.foundAll : praise()]);
        await wait(300);
        onResult(!missed.current);
      } else speak([w.word.w]);
    } else {
      missed.current = true;
      setWrong(i);
      sfx.bad();
      speak([L.notHeard, soundPart(ex.g), L.inWord, w.word.w]);
      setTimeout(() => setWrong(null), 700);
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
              {mark}
            </span>
          ))}
        </div>
      </div>
      <div className="lz-mots">
        {ex.words.map((w, i) => (
          <button
            key={i}
            className={`lz-tile lz-mot ${found.includes(i) ? "is-ok is-found" : ""} ${wrong === i ? "is-ko" : ""}`}
            onClick={() => tap(i)}
            aria-label={w.word.w}
          >
            {found.includes(i) && w.segs ? (
              // One line: the tile is a grid, and each letter group would otherwise get its own row.
              <span>
                {w.segs.map((sg, j) => (
                  <span key={j} className={sg.text === mark && sg.phon === GRAPHEME[ex.g].phon ? "lz-mark" : ""}>
                    {sg.text}
                  </span>
                ))}
              </span>
            ) : (
              w.word.w
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

// ——— Trace la lettre ———

/** Drawing box, in canvas units (the canvas is scaled to fit the screen). */
const BOX = 320;
const PEN = BOX * 0.065; // the line drawn
const REACH = BOX * 0.13; // how much of the letter one line covers, when scoring
const SLACK = BOX * 0.05; // how far off the letter a line may stray

type Pt = { x: number; y: number };

interface Glyph {
  font: string;
  x: number;
  y: number;
  ink: Uint8Array; // the letter's pixels
  near: Uint8Array; // the letter, widened by SLACK
  inkCount: number;
  spine: number; // the letter's length, traced along its middle (about half its outline)
  guideSize: number; // the height of a small letter, to size the guide
  guides: Pt[][]; // how to write it: the strokes in order, fitted onto the letters (none for an unknown letter)
}

/** The writing strokes of each letter of the text, in order, in canvas units. */
function fitStrokes(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): Pt[][] {
  const top = (s: string) => y - ctx.measureText(s).actualBoundingBoxAscent;
  const yX = top("x");
  const yAsc = top("l");
  const yDesc = y + ctx.measureText("p").actualBoundingBoxDescent;
  const vy = (v: number) => (v >= 1 ? yX - (v - 1) * (yX - yAsc) : v >= 0 ? y - v * (y - yX) : y - v * (yDesc - y));
  const out: Pt[][] = [];
  const chars = Array.from(text);
  chars.forEach((ch, i) => {
    const strokes = STROKES[ch];
    if (!strokes) return;
    const px = x + ctx.measureText(chars.slice(0, i).join("")).width;
    const m = ctx.measureText(ch);
    const left = px - m.actualBoundingBoxLeft;
    const w = m.actualBoundingBoxLeft + m.actualBoundingBoxRight;
    for (const s of strokes) out.push(s.map(([u, v]) => ({ x: left + u * w, y: vy(v) })));
  });
  return out;
}

/** Points every `step` units along a line, with the direction there. */
function along(line: Pt[], step: number, from = 0) {
  const out: { p: Pt; dx: number; dy: number }[] = [];
  let want = from;
  let done = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (!len) continue;
    while (want <= done + len) {
      const t = (want - done) / len;
      out.push({ p: { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }, dx: (b.x - a.x) / len, dy: (b.y - a.y) / len });
      want += step;
    }
    done += len;
  }
  return out;
}

const lengthOf = (line: Pt[]) => line.reduce((n, p, i) => (i ? n + Math.hypot(p.x - line[i - 1].x, p.y - line[i - 1].y) : 0), 0);

/** The part of a line up to a length along it. */
function lineUpTo(line: Pt[], upTo: number): Pt[] {
  const out: Pt[] = [line[0]];
  let done = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1];
    const b = line[i];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (done + len >= upTo) {
      const t = len ? (upTo - done) / len : 0;
      out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
      return out;
    }
    out.push(b);
    done += len;
  }
  return out;
}

const DEMO_SPEED = 230; // canvas units a second
const DEMO_LIFT = 45; // a short pause (as a length) between two strokes
const DEMO_REST = 230; // and a longer one before showing it again

const NAVY ="rgba(29, 78, 163, 0.7)";

/** The writing guide: arrows along each stroke and its number at the start. */
function paintGuides(ctx: CanvasRenderingContext2D, guides: Pt[][], size: number) {
  const r = Math.max(7, Math.min(12, size * 0.2)); // smaller numbers on a syllable of small letters
  ctx.save();
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.strokeStyle = NAVY;
  ctx.lineWidth = Math.max(2, r / 4);
  for (const line of guides) {
    if (line.length < 2) continue;
    for (const { p, dx, dy } of along(line, r * 3.8, r * 2.5)) {
      const s = r * 0.6;
      ctx.beginPath();
      ctx.moveTo(p.x - dx * s - dy * s, p.y - dy * s + dx * s);
      ctx.lineTo(p.x, p.y);
      ctx.lineTo(p.x - dx * s + dy * s, p.y - dy * s - dx * s);
      ctx.stroke();
    }
  }
  const placed: Pt[] = [];
  guides.forEach((line, i) => {
    let p = line[0];
    ctx.fillStyle = "#1d4ea3";
    if (line.length === 1) {
      // A dot (i, j): marked, with its number beside it.
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 0.4, 0, Math.PI * 2);
      ctx.fill();
      p = { x: p.x + r * 1.4, y: p.y - r * 1.1 };
    }
    // Two strokes starting at the same place (the round of a, then its stick): the second number goes above.
    for (let k = 0; k < 3 && placed.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < r * 2); k++) p = { x: p.x, y: p.y - r * 1.9 };
    placed.push(p);
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${Math.round(r * 1.25)}px system-ui, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), p.x, p.y + 1);
  });
  ctx.restore();
}

function layoutGlyph(text: string, family: string): Glyph {
  const c = document.createElement("canvas");
  c.width = c.height = BOX;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.font = `100px ${family}`;
  const m = ctx.measureText(text);
  const w = Math.max(1, m.actualBoundingBoxLeft + m.actualBoundingBoxRight);
  const h = Math.max(1, m.actualBoundingBoxAscent + m.actualBoundingBoxDescent);
  const k = Math.min((BOX * 0.7) / w, (BOX * 0.72) / h);
  const font = `${100 * k}px ${family}`;
  const x = BOX / 2 - ((m.actualBoundingBoxRight - m.actualBoundingBoxLeft) * k) / 2;
  const y = BOX / 2 + ((m.actualBoundingBoxAscent - m.actualBoundingBoxDescent) * k) / 2;
  const mask = (widen: number) => {
    ctx.clearRect(0, 0, BOX, BOX);
    ctx.font = font;
    ctx.fillStyle = ctx.strokeStyle = "#000";
    ctx.fillText(text, x, y);
    if (widen) {
      ctx.lineWidth = widen * 2;
      ctx.lineJoin = "round";
      ctx.strokeText(text, x, y);
    }
    const d = ctx.getImageData(0, 0, BOX, BOX).data;
    const out = new Uint8Array(BOX * BOX);
    for (let i = 0; i < out.length; i++) out[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    return out;
  };
  const ink = mask(0);
  const near = mask(SLACK);
  let inkCount = 0;
  let edge = 0;
  for (let i = 0; i < ink.length; i++) {
    if (!ink[i]) continue;
    inkCount++;
    if (!ink[i - 1] || !ink[i + 1] || !ink[i - BOX] || !ink[i + BOX]) edge++;
  }
  ctx.font = font;
  return { font, x, y, ink, near, inkCount, spine: edge / 2, guides: fitStrokes(ctx, text, x, y), guideSize: ctx.measureText("x").actualBoundingBoxAscent };
}

/** How much of the letter the lines cover, how much of the lines stay on it (0 to 1), and whether they stay tidy. */
function scoreTrace(g: Glyph, lines: Pt[][]) {
  const c = document.createElement("canvas");
  c.width = c.height = BOX;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.lineCap = ctx.lineJoin = "round";
  ctx.strokeStyle = "#000";
  const strokeAll = (width: number) => {
    ctx.clearRect(0, 0, BOX, BOX);
    ctx.lineWidth = width;
    for (const line of lines) {
      ctx.beginPath();
      line.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      if (line.length === 1) ctx.lineTo(line[0].x + 0.1, line[0].y);
      ctx.stroke();
    }
    return ctx.getImageData(0, 0, BOX, BOX).data;
  };
  // Points every few units along the lines: are they on the letter?
  let pts = 0;
  let on = 0;
  for (const line of lines) {
    for (let i = 0; i < line.length; i++) {
      const a = line[i];
      const b = line[i + 1] ?? a;
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3));
      for (let j = 0; j < n; j++) {
        const x = Math.round(a.x + ((b.x - a.x) * j) / n);
        const y = Math.round(a.y + ((b.y - a.y) * j) / n);
        pts++;
        if (x >= 0 && y >= 0 && x < BOX && y < BOX && g.near[y * BOX + x]) on++;
      }
    }
  }
  const wide = strokeAll(REACH);
  let covered = 0;
  for (let i = 0; i < g.ink.length; i++) if (g.ink[i] && wide[i * 4 + 3] > 110) covered++;
  // Scribbling all over the box covers the letter too: the ink laid down may not be much more
  // than one line along the letter (going over it again, or a shaky line, is fine).
  const pen = strokeAll(PEN);
  let area = 0;
  for (let i = 3; i < pen.length; i += 4) if (pen[i] > 110) area++;
  return {
    cover: covered / Math.max(1, g.inkCount),
    stay: pts ? on / pts : 0,
    tidy: area <= g.spine * PEN * 2.2,
  };
}

/** "Trace la lettre": draw it with a finger over a faint model. Done as soon as it is well covered. */
function Trace({ ex, onResult }: { ex: Extract<Ex, { t: "trace" }>; onResult: (ok: boolean) => void }) {
  const text = traceText(ex);
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const glyph = useRef<Glyph | null>(null);
  const lines = useRef<Pt[][]>([]);
  const drawing = useRef(false);
  const misses = useRef(0);
  const done = useRef(false);
  const [state, setState] = useState<"ask" | "ok" | "ko">("ask");
  const [inked, setInked] = useState(false);
  const demo = useRef<number | null>(null); // how far the demo dot has written, while it plays
  const stopDemo = () => {
    demo.current = null;
  };

  const paint = (win = false) => {
    const cv = canvas.current;
    const g = glyph.current;
    if (!cv || !g) return;
    const ctx = cv.getContext("2d")!;
    const k = cv.width / BOX;
    ctx.setTransform(k, 0, 0, k, 0, 0);
    ctx.clearRect(0, 0, BOX, BOX);
    ctx.font = g.font;
    // The model: a pale letter with a dotted outline (gold once traced).
    ctx.fillStyle = win ? "#ffd23f" : "rgba(29, 78, 163, 0.13)";
    ctx.fillText(text, g.x, g.y);
    if (!win) {
      ctx.setLineDash([6, 7]);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "rgba(29, 78, 163, 0.45)";
      ctx.strokeText(text, g.x, g.y);
      ctx.setLineDash([]);
      paintGuides(ctx, g.guides, g.guideSize);
      // The demo: a finger-dot writing the letter, stroke after stroke, until he starts.
      if (demo.current != null) {
        let left = demo.current;
        ctx.lineCap = ctx.lineJoin = "round";
        for (const line of g.guides) {
          if (left <= 0) break;
          const len = lengthOf(line);
          const part = lineUpTo(line, Math.min(left, len));
          ctx.strokeStyle = "rgba(244, 123, 32, 0.4)";
          ctx.lineWidth = PEN * 0.7;
          ctx.beginPath();
          part.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
          if (part.length === 1) ctx.lineTo(part[0].x + 0.1, part[0].y);
          ctx.stroke();
          if (left <= len + DEMO_LIFT) {
            const head = part[part.length - 1];
            ctx.fillStyle = "#f47b20";
            ctx.beginPath();
            ctx.arc(head.x, head.y, PEN * 0.75, 0, Math.PI * 2);
            ctx.fill();
          }
          left -= len + DEMO_LIFT;
        }
      }
    }
    ctx.lineCap = ctx.lineJoin = "round";
    ctx.lineWidth = PEN;
    ctx.strokeStyle = win ? "rgba(244, 123, 32, 0.55)" : "#f47b20";
    for (const line of lines.current) {
      ctx.beginPath();
      line.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
      if (line.length === 1) ctx.lineTo(line[0].x + 0.1, line[0].y);
      ctx.stroke();
    }
  };

  // Lay the letter out in the game's reading font (script or cursive), once it is loaded.
  useEffect(() => {
    let alive = true;
    let frame = 0;
    const family = (wrap.current && getComputedStyle(wrap.current).fontFamily) || "sans-serif";
    const ready = document.fonts?.load ? document.fonts.load(`100px ${family}`, text).catch(() => null) : Promise.resolve();
    ready.then(() => {
      if (!alive) return;
      const cv = canvas.current;
      if (cv) cv.width = cv.height = Math.round(BOX * Math.min(2, window.devicePixelRatio || 1));
      glyph.current = layoutGlyph(text, family);
      paint();
      if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
      // Show how to write it, twice, before he starts (stops as soon as he touches the pad).
      const total = glyph.current.guides.reduce((n, l) => n + lengthOf(l) + DEMO_LIFT, 0);
      if (!total) return;
      const t0 = performance.now() + 700;
      const run = (now: number) => {
        if (!alive || done.current || lines.current.length) return stopDemo();
        const d = ((now - t0) / 1000) * DEMO_SPEED;
        const lap = total + DEMO_REST;
        if (d >= lap * 2) {
          stopDemo();
          return paint();
        }
        demo.current = d < 0 ? null : Math.min(total, d % lap);
        paint();
        frame = requestAnimationFrame(run);
      };
      frame = requestAnimationFrame(run);
    });
    return () => {
      alive = false;
      cancelAnimationFrame(frame);
      stopDemo();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  const at = (e: RPointerEvent<HTMLCanvasElement>): Pt => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * BOX, y: ((e.clientY - r.top) / r.height) * BOX };
  };

  async function finish(ok: boolean) {
    done.current = true;
    setState(ok ? "ok" : "ko");
    if (ok) {
      paint(true);
      sfx.good();
      await speak([praise()]);
    } else {
      sfx.bad();
      lines.current = [];
      paint(true); // show the letter as it should be
      await speak([L.itsThisOne, tracePart(ex)]);
    }
    await wait(ok ? 300 : 650);
    onResult(ok);
  }

  function check(final: boolean) {
    const g = glyph.current;
    if (!g || done.current || !lines.current.length) return;
    const { cover, stay, tidy } = scoreTrace(g, lines.current);
    if (tidy && cover >= 0.8 && stay >= 0.85) return void finish(true);
    if (!final) return;
    if (tidy && cover >= 0.6 && stay >= 0.8) return void finish(true);
    misses.current += 1;
    if (misses.current >= 2) return void finish(false);
    sfx.bad();
    speak([L.traceMore]);
    lines.current = [];
    setInked(false);
    paint();
  }

  return (
    <div className="lz-ex lz-trace" ref={wrap}>
      <div className="lz-prompt">
        <button className="lz-round lz-speaker" onClick={() => speak(promptParts(ex))} aria-label="Réécouter">
          <Icon name="speaker" size={36} />
        </button>
      </div>
      <div className={`lz-trace-pad ${state === "ok" ? "is-ok" : state === "ko" ? "is-ko" : ""}`}>
        <canvas
          ref={canvas}
          width={BOX}
          height={BOX}
          aria-label={`Trace ${text}`}
          onPointerDown={(e) => {
            if (done.current) return;
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // drawing still works without capture
            }
            drawing.current = true;
            stopDemo();
            lines.current.push([at(e)]);
            setInked(true);
            paint();
          }}
          onPointerMove={(e) => {
            if (!drawing.current || done.current) return;
            const line = lines.current[lines.current.length - 1];
            const p = at(e);
            const last = line[line.length - 1];
            if (Math.hypot(p.x - last.x, p.y - last.y) < 1.5) return;
            line.push(p);
            paint();
          }}
          onPointerUp={() => {
            if (!drawing.current) return;
            drawing.current = false;
            check(false);
          }}
          onPointerCancel={() => {
            drawing.current = false;
          }}
        />
      </div>
      <div className="lz-trace-tools">
        <button
          className="lz-round lz-trace-erase"
          aria-label="Effacer"
          disabled={!inked || state !== "ask"}
          onClick={() => {
            lines.current = [];
            setInked(false);
            paint();
          }}
        >
          <Icon name="trash" size={32} />
        </button>
        <button className="lz-trace-done" aria-label="J'ai fini" disabled={!inked || state !== "ask"} onClick={() => check(true)}>
          <Icon name="check" size={44} />
        </button>
      </div>
    </div>
  );
}
