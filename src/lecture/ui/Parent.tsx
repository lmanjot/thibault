"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { GRAPHEME, GRAPHEMES } from "../content";
import { availableSyllables, gid, level, newSave, today, type Save } from "../engine";
import { hasRecording, loadRecordings, saveRecording, speak, soundPart } from "../audio";
import { Icon, Pips } from "./bits";
import { VoiceLines } from "./VoiceLines";
import { adoptCode, createCode, fetchCode, formatCode, onSyncChange, stopSync, syncState } from "../sync";

const REC_MS = 1800;

export function Parent({ save, onChange, onClose }: { save: Save; onChange: (s: Save) => void; onClose: () => void }) {
  const { classSounds, weekSounds, weekStart, font } = save.settings;
  const [recTick, setRecTick] = useState(0);
  const [recording, setRecording] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    loadRecordings().then(() => setRecTick((t) => t + 1));
  }, []);

  const set = (patch: Partial<Save["settings"]>) => onChange({ ...save, settings: { ...save.settings, ...patch } });

  function addSound(g: string) {
    if (classSounds.includes(g)) return;
    set({ classSounds: [...classSounds, g], weekSounds: [...weekSounds, g] });
  }

  function toggleWeek(g: string) {
    set({ weekSounds: weekSounds.includes(g) ? weekSounds.filter((x) => x !== g) : [...weekSounds, g] });
  }

  function removeSound(g: string) {
    set({ classSounds: classSounds.filter((x) => x !== g), weekSounds: weekSounds.filter((x) => x !== g) });
  }

  async function record(key: string) {
    if (recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await saveRecording(key, new Blob(chunks, { type: mr.mimeType || "audio/webm" }));
        setRecording(null);
        setRecTick((t) => t + 1);
      };
      mediaRef.current = mr;
      setRecording(key);
      mr.start();
      setTimeout(() => mr.state === "recording" && mr.stop(), REC_MS);
    } catch {
      alert("Le micro n'est pas disponible sur cet appareil.");
    }
  }

  const sylCount = availableSyllables(save).length;
  const weekAge = Math.max(0, Math.round((Date.parse(today()) - Date.parse(weekStart)) / 86400000));

  return (
    <div className="lz-parent">
      <div className="lz-parent-inner">
        <header>
          <h2>Espace parent</h2>
          <button className="lz-round lz-small" onClick={onClose} aria-label="Fermer">
            <Icon name="close" size={22} />
          </button>
        </header>

        <SyncPanel save={save} onChange={onChange} />

        <section>
          <h3>Lettres connues</h3>
          <p className="lz-hint">
            Toutes les lettres déjà vues, dans l&apos;ordre de la classe. Elles sont mélangées aux exercices pour que la réponse ne soit pas toujours la même. Touchez une lettre pour la mettre (ou l&apos;enlever) dans la semaine ★. Sur l&apos;écran d&apos;accueil, l&apos;enfant choisit la lettre à travailler.
          </p>
          <div className="lz-chips">
            {classSounds.length === 0 && <span className="lz-hint">Aucun son pour l&apos;instant : ajoutez-les ci-dessous.</span>}
            {classSounds.map((g) => (
              <span key={g} className={`lz-chip ${weekSounds.includes(g) ? "is-week" : ""}`}>
                <button onClick={() => toggleWeek(g)} title="Semaine en cours">
                  {weekSounds.includes(g) && <b>★</b>}
                  <span className="lz-read">{GRAPHEME[g]?.display ?? g}</span>
                  <Pips level={level(save, gid(g))} />
                </button>
                <button className="lz-x" onClick={() => removeSound(g)} aria-label={`Retirer ${g}`}>
                  <Icon name="close" size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="lz-week">
            <span>
              Semaine commencée {weekAge === 0 ? "aujourd'hui" : `il y a ${weekAge} jour${weekAge > 1 ? "s" : ""}`} ·{" "}
              {(save.progress.fights ?? []).length} boss en attente
            </span>
            <button
              className="lz-btn"
              onClick={() => {
                if (confirm("Commencer une nouvelle semaine ? Les sons ★ passent en révision."))
                  set({ weekSounds: [], weekStart: today() });
              }}
            >
              Nouvelle semaine
            </button>
          </div>
        </section>

        <section>
          <h3>Ajouter une lettre</h3>
          <div className="lz-palette">
            {GRAPHEMES.filter((g) => !classSounds.includes(g.id)).map((g) => (
              <button key={g.id} className={`lz-read kind-${g.kind}`} onClick={() => addSound(g.id)}>
                {g.display}
              </button>
            ))}
          </div>
          <p className="lz-hint">
            {sylCount} syllabe{sylCount > 1 ? "s" : ""} disponible{sylCount > 1 ? "s" : ""}. Une consonne entre dans les syllabes
            quand elle est reconnue (1 point), avec les voyelles reconnues.
          </p>
        </section>

        <section>
          <h3>Phrases de Goku</h3>
          <VoiceLines />
        </section>

        <section>
          <h3>Votre voix pour les sons</h3>
          <p className="lz-hint">
            La voix de synthèse prononce mal les sons isolés. Enregistrez le son, pas le nom de la lettre : « mmm », pas « èm ».
            ({REC_MS / 1000} s par enregistrement.)
          </p>
          <div className="lz-recs" data-tick={recTick}>
            {classSounds.map((g) => {
              const key = `g:${g}`;
              const has = hasRecording(key);
              return (
                <div key={g} className="lz-rec">
                  <span className="lz-read">{GRAPHEME[g]?.display}</span>
                  <button className={`lz-round lz-small ${recording === key ? "is-rec" : ""}`} onClick={() => record(key)} aria-label="Enregistrer">
                    <Icon name={recording === key ? "stop" : "mic"} size={20} />
                  </button>
                  <button className="lz-round lz-small" onClick={() => speak([soundPart(g)])} aria-label="Écouter">
                    <Icon name="play" size={20} />
                  </button>
                  {has && (
                    <button
                      className="lz-round lz-small"
                      onClick={() => saveRecording(key, null).then(() => setRecTick((t) => t + 1))}
                      aria-label="Supprimer"
                    >
                      <Icon name="trash" size={18} />
                    </button>
                  )}
                  {!has && <span className="lz-hint">synthèse</span>}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h3>Écriture</h3>
          <div className="lz-seg">
            <button className={font === "script" ? "on" : ""} onClick={() => set({ font: "script" })}>
              <span className="lz-font-script">script : la lune</span>
            </button>
            <button className={font === "cursive" ? "on" : ""} onClick={() => set({ font: "cursive" })}>
              <span className="lz-font-cursive">cursive : la lune</span>
            </button>
          </div>
        </section>

        <section>
          <h3>Progression</h3>
          <p className="lz-hint">
            {save.progress.playDays.length} jour{save.progress.playDays.length > 1 ? "s" : ""} joué
            {save.progress.playDays.length > 1 ? "s" : ""} · {save.progress.bosses} boss battu{save.progress.bosses > 1 ? "s" : ""} · ki{" "}
            {save.progress.ki}
          </p>
          <button
            className="lz-btn lz-danger"
            onClick={() => {
              if (confirm("Effacer toute la progression ? Les sons de la classe sont gardés."))
                onChange({ ...newSave(), settings: save.settings });
            }}
          >
            Remettre la progression à zéro
          </button>
        </section>
      </div>
    </div>
  );
}

/** Continue on another device: one code, then the progress follows by itself. */
function SyncPanel({ save, onChange }: { save: Save; onChange: (s: Save) => void }) {
  const sync = useSyncExternalStore(onSyncChange, syncState, () => null);
  const [busy, setBusy] = useState(false);
  const [typed, setTyped] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  async function create() {
    setBusy(true);
    setMsg(null);
    try {
      await createCode(save);
    } catch {
      setMsg("Pas de connexion : réessayez dans un moment.");
    }
    setBusy(false);
  }

  async function join() {
    const code = typed.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (code.length !== 6) return setMsg("Le code a 6 caractères, par exemple K7P-4QX.");
    setBusy(true);
    setMsg(null);
    try {
      const remote = await fetchCode(code);
      if (!remote) setMsg("Ce code n'existe pas. Vérifiez les lettres et les chiffres.");
      else if (confirm("Remplacer la progression de cet appareil par celle du code ?")) {
        adoptCode(code, remote.updatedAt);
        onChange(remote);
        setTyped("");
      }
    } catch {
      setMsg("Pas de connexion : réessayez dans un moment.");
    }
    setBusy(false);
  }

  return (
    <section>
      <h3>Continuer sur un autre appareil</h3>
      {sync ? (
        <>
          <p className="lz-hint">
            Sur l&apos;autre téléphone ou tablette, ouvrez le jeu, Espace parent, puis « J&apos;ai un code » avec ce code. La progression
            se met ensuite à jour toute seule sur les deux.
          </p>
          <div className="lz-sync">
            <span className="lz-sync-code">{formatCode(sync.code)}</span>
            <span className={`lz-sync-status ${sync.error ? "is-off" : ""}`}>
              {sync.error ? "Hors ligne : envoi au prochain changement" : "Synchronisé"}
            </span>
          </div>
          <button
            className="lz-btn"
            onClick={() => {
              if (confirm("Ne plus synchroniser cet appareil ? Sa progression reste ici.")) stopSync();
            }}
          >
            Ne plus synchroniser cet appareil
          </button>
        </>
      ) : (
        <>
          <p className="lz-hint">
            Créez un code sur cet appareil, puis tapez-le sur l&apos;autre : la progression (lettres, pouvoirs, zénis, achats) sera la
            même partout.
          </p>
          <div className="lz-row lz-sync-actions">
            <button className="lz-btn" onClick={create} disabled={busy}>
              Créer un code
            </button>
          </div>
          <div className="lz-row lz-sync-actions">
            <input
              className="lz-sync-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="J'ai un code : K7P-4QX"
              maxLength={8}
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
            />
            <button className="lz-btn" onClick={join} disabled={busy || !typed.trim()}>
              Utiliser
            </button>
          </div>
        </>
      )}
      {msg && <p className="lz-hint lz-sync-msg">{msg}</p>}
    </section>
  );
}
