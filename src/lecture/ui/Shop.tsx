"use client";

// Bulma's shop: spend zénis on Goku's transformations (in story order), friends, places,
// auras, mini-games and their levels, and senzu beans.

import { useState } from "react";
import { ASSET, FORMS } from "../content";
import type { Save } from "../engine";
import { sfx, speak } from "../audio";
import { buy, canBuy, equip, formStep, gameOpen, inEra, ITEMS, owns, SENZU_MAX, zeni, type ItemKind, type ShopItem } from "../shop";
import { MINI_GAMES } from "./games";
import { Goku, Icon, Zeni } from "./bits";

type Tab = "goku" | ItemKind;

const TABS: { kind: Tab; label: string; icon: string }[] = [
  { kind: "goku", label: "Goku", icon: "goku.png" },
  { kind: "companion", label: "Amis", icon: "krillin.png" },
  { kind: "scene", label: "Décors", icon: "bg_namek.png" },
  { kind: "aura", label: "Auras", icon: "" },
  { kind: "game", label: "Jeux", icon: "kikoha.png" },
  { kind: "senzu", label: "Senzu", icon: "" },
];

export function Shop({
  save,
  onChange,
  onClose,
}: {
  save: Save;
  onChange: (s: Save) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<Tab>("goku");
  const [justBought, setJustBought] = useState<string | null>(null);
  const step = formStep(save);

  function act(item: ShopItem) {
    const s = structuredClone(save);
    if (item.kind !== "senzu" && item.kind !== "game" && owns(s, item.id)) {
      equip(s, item);
      sfx.tap();
      onChange(s);
      return;
    }
    if (!buy(s, item)) {
      sfx.bad();
      return;
    }
    sfx.power();
    speak(["Super !"]);
    setJustBought(item.id);
    onChange(s);
  }

  /** "After Goku reaches X": the step of the story an item is waiting for. */
  const eraLabel = (item: ShopItem) => `après « ${FORMS[item.era ?? 0].name} »`;

  const items = ITEMS.filter((i) => (tab === "game" ? i.kind === "game" || i.kind === "level" : i.kind === tab));

  return (
    <div className="lz-shop">
      <header className="lz-shop-head">
        <button className="lz-round lz-small" onClick={onClose} aria-label="Retour">
          <Icon name="back" size={22} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="lz-shop-host" src={ASSET(step < 4 ? "bulma_kid.png" : "bulma.png")} alt="Bulma" />
        <h2 className="lz-title-sm">Boutique de Bulma</h2>
        <span className="lz-wallet">
          <Zeni size={30} /> {zeni(save)}
        </span>
      </header>

      <nav className="lz-shop-tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.kind} role="tab" aria-selected={tab === t.kind} className={tab === t.kind ? "on" : ""} onClick={() => setTab(t.kind)}>
            {t.kind === "aura" ? (
              <span className="lz-swatch lz-swatch-rainbow" />
            ) : t.kind === "senzu" ? (
              <span className="lz-bean" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={ASSET(t.icon)} alt="" />
            )}
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {tab === "goku" ? (
        <div className="lz-ladder">
          {FORMS.map((form, i) => {
            const done = i <= step;
            const isNext = i === step + 1;
            return (
              <div key={form.name} className={`lz-step ${done ? "is-done" : ""} ${isNext ? "is-next" : ""} ${!done && !isNext ? "is-future" : ""}`}>
                <span className="lz-step-goku">
                  <Goku form={form} size="sm" />
                </span>
                <span className="lz-shop-name">{form.name}</span>
                <span className="lz-shop-state">
                  {done ? (i === step ? "✓ Maintenant" : "✓") : isNext ? "à la prochaine lettre" : (
                    <>
                      <Icon name="lock" size={14} /> lettre {i}
                    </>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="lz-shop-grid">
          {items.map((item) => {
            const mine = item.kind !== "senzu" && owns(save, item.id);
            const on =
              (item.kind === "companion" && save.progress.equip?.companion === item.id) ||
              (item.kind === "scene" && (save.progress.equip?.scene ?? "s-papaya") === item.id) ||
              (item.kind === "aura" && save.progress.equip?.aura === item.id) ||
              (item.kind === "level" && item.game && (save.progress.levels?.[item.game] ?? 1) === item.level);
            const game = item.game ? MINI_GAMES.find((g) => g.id === item.game) : undefined;
            const affordable = canBuy(save, item);
            const missing = Math.max(0, item.price - zeni(save));
            const tooEarly = !inEra(save, item);
            const gameOpenAlready = item.kind === "game" && !!item.game && gameOpen(save, item.game);
            return (
              <button
                key={item.id}
                className={`lz-shop-card ${on ? "is-on" : ""} ${justBought === item.id ? "is-new" : ""} ${!mine && !affordable ? "is-locked" : ""} ${tooEarly ? "is-future" : ""}`}
                onClick={() => act(item)}
              >
                <span className="lz-shop-pic">
                  {item.kind === "aura" ? (
                    <span className="lz-swatch" style={{ background: `radial-gradient(circle, #fff 0 18%, ${item.color} 55%, transparent 72%)` }} />
                  ) : item.kind === "senzu" ? (
                    <span className="lz-bean lz-bean-big" />
                  ) : item.kind === "scene" ? (
                    <span className="lz-scene" style={{ backgroundImage: `url(${ASSET(item.img!)})` }} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ASSET((step < 4 && item.imgKid) || item.img || game?.img || "goku.png")} alt="" />
                  )}
                </span>
                <span className="lz-shop-name">{item.kind === "level" && game ? `${game.name} · ${item.name}` : item.name}</span>
                <span className="lz-shop-state">
                  {item.kind === "senzu" ? (
                    <>
                      <Zeni /> {item.price} · {save.progress.senzu ?? 0}/{SENZU_MAX}
                    </>
                  ) : tooEarly ? (
                    <>
                      <Icon name="lock" size={14} /> {eraLabel(item)}
                    </>
                  ) : mine || gameOpenAlready ? (
                    item.kind === "game" || gameOpenAlready ? "✓ Ouvert" : on ? "✓ Choisi" : "Choisir"
                  ) : item.kind === "level" && item.level! > 2 && !owns(save, `l-${item.game}-${item.level! - 1}`) ? (
                    <>
                      <Icon name="lock" size={14} /> après le niveau {item.level! - 1}
                    </>
                  ) : item.kind === "level" && !affordable && missing === 0 ? (
                    <>
                      <Icon name="lock" size={14} /> ouvre d&apos;abord le jeu
                    </>
                  ) : (
                    <>
                      <Zeni /> {item.price}
                      {missing > 0 && <em> · encore {missing}</em>}
                    </>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
