"use client";

// The letters album: one card per letter, with three places (silver, gold, diamond). Each round
// finished on a letter brings a Dragon Ball legend into its place; tapping one says its name and
// makes it Goku's companion on the home screen.

import { useState } from "react";
import { ASSET, GRAPHEME, LEGENDS } from "../content";
import { albumOwned, fillAlbum, type Save } from "../engine";
import { sfx, speak } from "../audio";
import { formStep, ITEM, ITEMS, owns } from "../shop";
import { Icon, Zeni } from "./bits";

const TIERS = ["argent", "or", "diamant"] as const;

/**
 * The save as the album shows it: rounds finished before the album existed get their legends
 * right away on screen. They are written to the save with the next session or the next choice.
 */
function albumView(save: Save): Save {
  const s = structuredClone(save);
  fillAlbum(s);
  return s;
}

export function Album({ save, onChange, onClose, onShop }: { save: Save; onChange: (s: Save) => void; onClose: () => void; onShop: () => void }) {
  const [view] = useState(() => albumView(save));
  const [fresh] = useState(() => new Set(view.progress.albumNew ?? []));
  const letters = save.settings.classSounds.filter((g) => GRAPHEME[g]); // only the letters turned on
  // Friends bought with zénis in Bulma's shop live in the album too.
  const shopFriends = ITEMS.filter((i) => i.kind === "companion" && !i.legend && i.img);
  const bought = shopFriends.filter((i) => owns(save, i.id));
  const owned = albumOwned(view).length + bought.length;
  const kid = formStep(save) < 4;
  const companion = save.progress.equip?.companion;

  function pick(id: string) {
    const l = ITEM[id];
    if (!l) return;
    sfx.tap();
    speak([l.name]);
    const s = structuredClone(view);
    s.progress.albumNew = [];
    s.progress.equip = { ...(s.progress.equip ?? {}), companion: companion === id ? undefined : id };
    onChange(s);
  }

  function close() {
    if (save.progress.albumNew?.length) onChange({ ...save, progress: { ...save.progress, albumNew: [] } });
    onClose();
  }

  return (
    <div className="lz-album">
      <header className="lz-shop-head">
        <button className="lz-round lz-small" onClick={close} aria-label="Retour">
          <Icon name="back" size={22} />
        </button>
        <h2 className="lz-title-sm">Album des amis</h2>
        <span className="lz-wallet lz-album-count">
          {owned} / {LEGENDS.length + shopFriends.length}
        </span>
      </header>
      <div className="lz-album-scroll">
      <div className="lz-album-grid">
        {letters.map((g) => {
          const slots = view.progress.album?.[g] ?? [null, null, null];
          return (
            <div key={g} className="lz-album-card">
              <span className="lz-album-letter lz-read">{GRAPHEME[g].display}</span>
              <div className="lz-album-slots">
                {TIERS.map((tier, r) => {
                  const id = slots[r];
                  const l = id ? ITEM[id] : undefined;
                  return l?.img ? (
                    <button
                      key={tier}
                      className={`lz-album-slot is-${tier} is-won ${fresh.has(id!) ? "is-fresh" : ""} ${companion === id ? "is-on" : ""}`}
                      onClick={() => pick(id!)}
                      aria-label={l.name}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={ASSET(l.img)} alt="" draggable={false} />
                    </button>
                  ) : (
                    <span key={tier} className={`lz-album-slot is-${tier}`} aria-label={`${tier} : pas encore`}>
                      ?
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <h3 className="lz-album-sub">Amis de la boutique</h3>
      <div className="lz-album-shop">
        {shopFriends.map((i) => {
          const mine = bought.includes(i);
          return (
            <button
              key={i.id}
              className={`lz-album-slot is-shop ${mine ? "is-won" : ""} ${companion === i.id ? "is-on" : ""}`}
              onClick={() => (mine ? pick(i.id) : onShop())}
              aria-label={mine ? i.name : `${i.name} : ${i.price} zénis dans la boutique`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={ASSET((kid && i.imgKid) || i.img!)} alt="" draggable={false} />
              {!mine && (
                <span className="lz-album-price">
                  <Zeni size={16} /> {i.price}
                </span>
              )}
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}

/** Home: a round button in the top corner (the parent gate's twin) with a friend's face, how many, and a dot while some are new. */
export function AlbumButton({ save, onClick }: { save: Save; onClick: () => void }) {
  const view = albumView(save);
  const owned = [...albumOwned(view), ...ITEMS.filter((i) => i.kind === "companion" && !i.legend && owns(save, i.id)).map((i) => i.id)];
  const face = ITEM[save.progress.equip?.companion ?? ""]?.legend ? save.progress.equip!.companion! : owned[owned.length - 1];
  const fresh = (view.progress.albumNew ?? []).length > 0;
  return (
    <button className={`lz-album-btn ${fresh ? "has-new" : ""}`} onClick={onClick} aria-label={`Album des amis : ${owned.length}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={ASSET(ITEM[face]?.img ?? "krillin.png")} alt="" draggable={false} className={face ? "" : "is-shadow"} />
      <span className="lz-album-btn-count">{owned.length}</span>
    </button>
  );
}

/** On the result screen: the legends just won (several at once the first time an old save opens its album). */
export function NewFriends({ ids, onAlbum }: { ids: string[]; onAlbum: () => void }) {
  const shown = ids.slice(-4);
  const last = ITEM[ids[ids.length - 1]];
  return (
    <button className="lz-newfriends" onClick={onAlbum}>
      <span className="lz-newfriends-faces">
        {shown.map((id) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={id} src={ASSET(ITEM[id]?.img ?? "")} alt="" />
        ))}
      </span>
      <span className="lz-newfriends-text">
        {ids.length > 1 ? `${ids.length} nouveaux amis !` : "Nouvel ami !"} <b>{last?.name}</b>
        <small>Voir l&apos;album</small>
      </span>
    </button>
  );
}
