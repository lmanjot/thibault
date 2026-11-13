"use client";

// Parent space: listen to Goku's reusable sentences, change how each one is said, regenerate it.
// Works only when the game runs locally (npm run dev): the key stays on this computer.

import { useEffect, useState } from "react";
import { reloadVoice, speak, stopSpeech } from "../audio";
import { Icon } from "./bits";

interface Line {
  text: string;
  word?: boolean;
  file: string | null;
  tuning: { say?: string; expression?: number; speed?: number };
}

type Status = "idle" | "busy" | "done" | "error";

export function VoiceLines() {
  const [data, setData] = useState<{ ready: boolean; defaults: { expression: number; speed: number }; lines: Line[] } | null>(null);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    fetch("/api/lecture-voice")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setUnavailable(true));
  }, []);

  if (unavailable)
    return (
      <p className="lz-hint">
        Les phrases se règlent sur l&apos;ordinateur, en lançant le jeu en local (<code>npm run dev</code>) : la clé ElevenLabs reste
        sur l&apos;ordinateur et le jeu en ligne n&apos;appelle jamais ElevenLabs.
      </p>
    );
  if (!data) return <p className="lz-hint">Chargement…</p>;

  return (
    <>
      <p className="lz-hint">
        Écoutez chaque phrase. Si un mot sonne mal, changez le texte prononcé (par exemple « Trouve le son » → « Trouve le bon son »),
        réglez l&apos;expression et la vitesse, puis « Refaire » : seule cette phrase est régénérée. Pensez à enregistrer (commit) les
        fichiers ensuite pour que le jeu en ligne ait la nouvelle voix.
        {!data.ready && " — Clé ElevenLabs manquante dans .env.local."}
      </p>
      <div className="lz-lines">
        {data.lines
          .filter((l) => !l.word)
          .map((l) => (
            <LineRow key={l.text} line={l} defaults={data.defaults} ready={data.ready} />
          ))}
      </div>
      <h4 className="lz-lines-title">Mots des images</h4>
      <p className="lz-hint">Si un mot est mal prononcé (une lettre muette qu&apos;on entend, par exemple), écrivez-le comme il se dit : « chocola ».</p>
      <div className="lz-lines">
        {data.lines
          .filter((l) => l.word)
          .map((l) => (
            <LineRow key={l.text} line={l} defaults={data.defaults} ready={data.ready} />
          ))}
      </div>
    </>
  );
}

function LineRow({ line, defaults, ready }: { line: Line; defaults: { expression: number; speed: number }; ready: boolean }) {
  const [saved, setSaved] = useState(line.tuning);
  const [say, setSay] = useState(line.tuning.say ?? "");
  const [expression, setExpression] = useState(line.tuning.expression ?? defaults.expression);
  const [speed, setSpeed] = useState(line.tuning.speed ?? defaults.speed);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const changed =
    say.trim() !== (saved.say ?? "") ||
    expression !== (saved.expression ?? defaults.expression) ||
    speed !== (saved.speed ?? defaults.speed);

  async function redo() {
    setStatus("busy");
    setError("");
    stopSpeech();
    const tuning: Line["tuning"] = {};
    if (say.trim()) tuning.say = say.trim();
    if (expression !== defaults.expression) tuning.expression = expression;
    if (speed !== defaults.speed) tuning.speed = speed;
    const r = await fetch("/api/lecture-voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: line.text, tuning }),
    });
    if (!r.ok) {
      setStatus("error");
      setError(await r.text());
      return;
    }
    await reloadVoice();
    setStatus("done");
    setSaved(tuning);
    speak([line.text]);
  }

  return (
    <div className="lz-line">
      <div className="lz-line-head">
        <button className="lz-round lz-small" onClick={() => speak([line.text])} aria-label={`Écouter : ${line.text}`}>
          <Icon name="play" size={18} />
        </button>
        <span className="lz-line-text">{line.text}</span>
      </div>
      <div className="lz-line-controls">
        <input
          type="text"
          value={say}
          placeholder={`Texte prononcé (par défaut : ${line.text.replace(/\s*…\s*$/, "")})`}
          onChange={(e) => setSay(e.target.value)}
          aria-label="Texte prononcé"
        />
        <label>
          Expression
          <input type="range" min={0} max={1} step={0.1} value={expression} onChange={(e) => setExpression(Number(e.target.value))} />
        </label>
        <label>
          Vitesse
          <input type="range" min={0.8} max={1.1} step={0.05} value={speed} onChange={(e) => setSpeed(Number(e.target.value))} />
        </label>
        <button className="lz-btn" disabled={!ready || status === "busy"} onClick={redo}>
          {status === "busy" ? "…" : changed ? "Refaire" : "Refaire pareil"}
        </button>
        {status === "done" && <span className="lz-line-ok">Nouvelle version</span>}
        {status === "error" && <span className="lz-line-err">{error.slice(0, 120)}</span>}
      </div>
    </div>
  );
}
