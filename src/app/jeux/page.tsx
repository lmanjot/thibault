import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jeux — Thibault",
  description:
    "Choisis ton aventure : Dragon Ball, Chevalier des Pierres, Mine, Course armée et Snake !",
};

const dbGames = [
  {
    href: "/fireball.html",
    title: "Éclair de Feu",
    emoji: "🔥",
    tag: "Esquive",
    blurb:
      "Esquive les Kikōha qui fondent sur toi. Plus le niveau monte, plus ça va vite !",
    accent: "from-orange-500 to-red-500",
    ring: "ring-orange-300",
    chip: "bg-orange-100 text-orange-800",
  },
  {
    href: "/horde.html",
    title: "Last Saiyan",
    emoji: "⚡",
    tag: "Tir auto",
    blurb:
      "Avance, tire, détruis les barrières et les bonus. Forme ta team de guerriers Z !",
    accent: "from-sky-500 to-blue-600",
    ring: "ring-sky-300",
    chip: "bg-sky-100 text-sky-800",
  },
];

const otherGames = [
  {
    href: "/games/index.html",
    title: "Chevalier des Pierres",
    emoji: "⚔️",
    tag: "Aventure",
    blurb:
      "Le grand jeu plateforme : combats, magie et pierres de dragon à collecter.",
    accent: "from-violet-500 to-indigo-700",
    ring: "ring-violet-300",
    chip: "bg-violet-100 text-violet-800",
  },
  {
    href: "/games/mine.html",
    title: "Mine du Nain-Elfe",
    emoji: "⛏️",
    tag: "Craft",
    blurb: "Creuse, craft et explore les profondeurs de la mine enchantée.",
    accent: "from-amber-600 to-yellow-700",
    ring: "ring-amber-300",
    chip: "bg-amber-100 text-amber-900",
  },
  {
    href: "/games/metal-slug.html",
    title: "Course armée",
    emoji: "💥",
    tag: "Shoot",
    blurb: "Course d’obstacles façon run & gun — avance, tire, survive !",
    accent: "from-emerald-500 to-teal-700",
    ring: "ring-emerald-300",
    chip: "bg-emerald-100 text-emerald-800",
  },
  {
    href: "/games/snake.html",
    title: "Snake",
    emoji: "🐍",
    tag: "Rétro",
    blurb: "Le classique Nokia 3310. Mange, grandis, ne te mords pas la queue.",
    accent: "from-lime-500 to-green-700",
    ring: "ring-lime-300",
    chip: "bg-lime-100 text-lime-900",
  },
];

function GameCard({
  g,
  i,
}: {
  g: (typeof dbGames)[number];
  i: number;
}) {
  return (
    <Link
      href={g.href}
      className={`group relative overflow-hidden rounded-3xl bg-white/90 p-5 shadow-lg ring-2 ${g.ring} transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-6`}
      style={{ animationDelay: `${i * 80}ms` }}
    >
      <div
        className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${g.accent}`}
      />
      <div className="flex items-start gap-4 pl-2">
        <span
          className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${g.accent} text-3xl shadow-md transition group-hover:scale-110`}
        >
          {g.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-2xl font-bold text-amber-950">
              {g.title}
            </h2>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${g.chip}`}
            >
              {g.tag}
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-amber-900/70 sm:text-base">
            {g.blurb}
          </p>
          <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-amber-700 transition group-hover:gap-2">
            Jouer
            <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function JeuxPage() {
  return (
    <div className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(255,180,40,0.35), transparent 60%), radial-gradient(ellipse 60% 40% at 100% 80%, rgba(56,140,255,0.2), transparent 50%), radial-gradient(ellipse 50% 35% at 0% 70%, rgba(255,100,40,0.15), transparent 50%)",
        }}
      />

      <header className="mb-10 text-center sm:mb-14">
        <p className="mb-3 inline-block rounded-full bg-amber-400/90 px-4 py-1 text-sm font-semibold text-amber-950 shadow-sm">
          Tournoi des jeux
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-amber-950 sm:text-5xl">
          Les jeux de Thibault
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-amber-900/75 sm:text-lg">
          Salut guerrier ! Choisis ton défi — Dragon Ball ou aventure fantasy.
        </p>
      </header>

      <section className="mx-auto mb-10 max-w-2xl">
        <h2 className="mb-4 px-1 font-display text-lg font-bold text-amber-900/80">
          🐉 Dragon Ball
        </h2>
        <div className="grid gap-5 sm:gap-6">
          {dbGames.map((g, i) => (
            <GameCard key={g.href} g={g} i={i} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-2xl">
        <h2 className="mb-4 px-1 font-display text-lg font-bold text-amber-900/80">
          🎮 Autres jeux
        </h2>
        <div className="grid gap-5 sm:gap-6">
          {otherGames.map((g, i) => (
            <GameCard key={g.href} g={g} i={i + dbGames.length} />
          ))}
        </div>
      </section>

      <p className="mt-10 text-center text-sm text-amber-800/60">
        Clavier ou tactile selon le jeu · Entrée pour commencer
      </p>

      <div className="mt-6 text-center">
        <Link
          href="/"
          className="text-sm font-medium text-amber-700/80 underline-offset-2 hover:text-amber-800 hover:underline"
        >
          Retour aux Contes
        </Link>
      </div>
    </div>
  );
}
