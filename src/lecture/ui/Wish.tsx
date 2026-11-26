"use client";

// Lecture Z — the dragon's scene, after 7 dragon balls won with diamond letters.
// The sky goes dark, the balls glow and the dragon rises from their light.
// Shenron (the Earth's 7 balls) gives his own game, then tells of Namek's balls.
// Porunga (Namek's 7 balls) grants three wishes, chosen by the child; the balls then fly away.

import { useEffect, useRef, useState } from "react";
import { ASSET } from "../content";
import { grantWish, seeShenron, wishOptions, WISHES, type Dragon, type WishId } from "../dragons";
import type { Save } from "../engine";
import { sfx, speak, stopSpeech } from "../audio";
import { D, L } from "../voice";
import { DragonBall, Icon, Zeni } from "./bits";

type Phase = "sky" | "rise" | "gift" | "namek" | "choose" | "bye";

/** How long the balls glow in the dark before the dragon comes out of their light. */
const SKY_MS = 2800;

export function Wish({
  dragon,
  save,
  onChange,
  onPlay,
  onClose,
}: {
  dragon: Dragon;
  save: Save;
  onChange: (s: Save) => void;
  onPlay: () => void; // Shenron's game, right away
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("sky");
  const [chosen, setChosen] = useState<WishId[]>([]);
  const [granted, setGranted] = useState<{ id: WishId; key: number } | null>(null);
  const alive = useRef(true);
  const saveRef = useRef(save);
  useEffect(() => {
    saveRef.current = save;
  });
  const lastWish = useRef(0);
  const porunga = dragon === "porunga";

  useEffect(() => {
    alive.current = true;
    sfx.charge();
    speak([L.dragonSky]);
    const t = setTimeout(() => alive.current && setPhase("rise"), SKY_MS);
    return () => {
      alive.current = false;
      clearTimeout(t);
      stopSpeech();
    };
  }, []);

  // The dragon rises and speaks; then Shenron's gift, or Porunga's choice.
  useEffect(() => {
    if (phase !== "rise") return;
    sfx.power();
    let gone = false;
    const t = setTimeout(async () => {
      await speak([porunga ? D.porungaHello : D.shenronHello]);
      if (gone || !alive.current) return;
      if (porunga) setPhase("choose");
      else {
        const s = structuredClone(saveRef.current);
        seeShenron(s); // seen: it won't come back, even if he leaves now
        onChange(s);
        setPhase("gift");
      }
    }, 1400);
    return () => {
      gone = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  useEffect(() => {
    if (phase !== "gift") return;
    let gone = false;
    sfx.power();
    speak([D.shenronGift]).then(() => {
      if (!gone && alive.current) setPhase("namek");
    });
    return () => {
      gone = true;
    };
  }, [phase]);

  useEffect(() => {
    if (phase === "namek") speak([D.shenronNamek]);
    if (phase === "bye") {
      sfx.beam(true);
      speak([D.porungaBye]);
    }
  }, [phase]);

  // Porunga: three wishes each time he comes (the ones not chosen yet are offered again later).
  const inBatch = chosen.slice(chosen.length - (chosen.length % 3));
  const options = wishOptions(save, inBatch);
  const left = save.progress.porungaLeft ?? 0;

  function wish(id: WishId, at: number) {
    if (at - lastWish.current < 900) return; // one at a time
    lastWish.current = at;
    const s = structuredClone(save);
    grantWish(s, id);
    onChange(s);
    sfx.power();
    setChosen([...chosen, id]);
    setGranted({ id, key: chosen.length + 1 });
    const done = (s.progress.porungaLeft ?? 0) <= 0;
    speak([D.porungaGranted, WISHES[id].name]).then(() => {
      if (done && alive.current) setPhase("bye");
    });
  }

  const risen = phase !== "sky";
  const wishNo = (chosen.length % 3) + 1;

  return (
    <div className={`lz-dragon is-${dragon} phase-${phase}`}>
      <div className="lz-dragon-sky" aria-hidden />
      <div className="lz-dragon-bolt" aria-hidden />
      {risen && <div className="lz-dragon-beam" aria-hidden />}
      {risen && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="lz-dragon-img" src={ASSET(porunga ? "porunga.png" : "shenron.png")} alt={porunga ? "Polunga" : "Shenron"} draggable={false} />
      )}
      <div className={`lz-dragon-balls ${phase === "bye" || phase === "namek" ? "is-gone" : ""}`} aria-label="Les sept boules de cristal">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: i }}>
            <DragonBall stars={i + 1} size={porunga ? 64 : 52} className={porunga ? "is-namek" : ""} />
          </span>
        ))}
      </div>

      {(phase === "sky" || phase === "rise") && (
        <p className="lz-dragon-title">{porunga ? "Les sept boules de Namek !" : "Les sept boules de cristal !"}</p>
      )}

      {(phase === "gift" || phase === "namek") && (
        <div className="lz-dragon-card lz-panel">
          <p className="lz-dragon-kicker">Shenron exauce ton vœu</p>
          <button className="lz-dragon-game" onClick={onPlay}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={ASSET("shenron.png")} alt="" />
            <span>
              Nouveau jeu
              <strong>Le vol de Shenron</strong>
            </span>
          </button>
          {phase === "namek" && (
            <div className="lz-dragon-next">
              <span className="lz-dragon-next-balls" aria-hidden>
                {Array.from({ length: 7 }, (_, i) => (
                  <DragonBall key={i} stars={i + 1} size={24} className="is-namek is-off" />
                ))}
              </span>
              <span>
                Prochaine quête : les 7 boules de <strong>Namek</strong> et le dragon Polunga, qui exauce <strong>3 vœux</strong> !
              </span>
            </div>
          )}
          <div className="lz-row">
            <button className="lz-cta" onClick={onPlay}>
              <Icon name="play" size={30} /> Jouer !
            </button>
            <button className="lz-round" onClick={onClose} aria-label="Continuer">
              <Icon name="arrow" />
            </button>
          </div>
        </div>
      )}

      {phase === "choose" && (
        <div className="lz-dragon-card lz-panel">
          <p className="lz-dragon-kicker">
            Vœu {Math.min(wishNo, 3)} sur 3 {left > 3 ? `· encore ${left} vœux` : ""}
          </p>
          <div className="lz-wishes">
            {options.map((w) => (
              <button key={w.id} className={`lz-wishcard ${granted?.id === w.id ? "is-granted" : ""}`} onClick={(e) => wish(w.id, e.timeStamp)}>
                <span className="lz-wishcard-pic">
                  {w.img === "zeni" ? (
                    <Zeni size={64} />
                  ) : w.img === "senzu" ? (
                    <span className="lz-bean lz-bean-big" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ASSET(w.img)} alt="" />
                  )}
                </span>
                <span className="lz-wishcard-name">{w.name}</span>
              </button>
            ))}
          </div>
          {granted && (
            <p key={granted.key} className="lz-wish-granted">
              Vœu exaucé : {WISHES[granted.id].name}
            </p>
          )}
        </div>
      )}

      {phase === "bye" && (
        <div className="lz-dragon-card lz-panel">
          <p className="lz-dragon-kicker">Tes vœux sont exaucés !</p>
          <p className="lz-dragon-text">Les boules de Namek s&apos;envolent… Retrouve-les avec tes lettres en diamant !</p>
          <button className="lz-round" onClick={onClose} aria-label="Continuer">
            <Icon name="arrow" />
          </button>
        </div>
      )}
    </div>
  );
}
