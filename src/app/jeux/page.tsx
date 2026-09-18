import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jeux Dragon Ball — Thibault",
  description: "Choisis ton aventure Saiyan : Éclair de Feu ou Last Saiyan !",
};

const games = [
  {
    href: "/fireball.html",
    title: "Éclair de Feu",
    emoji: "🔥",
    tag: "Esquive",
    blurb: "Esquive les Kikōha qui fondent sur toi. Plus le niveau monte, plus ça va vite !",
    accent: "from-orange-500 to-red-500",
    ring: "ring-orange-300",
    chip: "bg-orange-100 text-orange-800",
  },
  {
    href: "/horde.html",
    title: "Last Saiyan",
    emoji: "⚡",
    tag: "Tir auto",
    blurb: "Avance, tire, détruis les barrières et les bonus. Forme ta team de guerriers Z !",
    accent: "from-sky-500 to-blue-600",
    ring: "ring-sky-300",
    chip: "bg-sky-100 text-sky-800",
  },
];

export default function JeuxPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Soft energy background */}
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
          Jeux Dragon Ball
        </h1>
        <p className="mx-auto mt-3 max-w-md text-base text-amber-900/75 sm:text-lg">
          Salut guerrier ! Choisis ton défi et entraîne-toi comme un vrai Saiyan.
        </p>
      </header>

      <div className="mx-auto grid max-w-2xl gap-5 sm:gap-6">
        {games.map((g, i) => (
          <Link
            key={g.href}
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
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-amber-800/60">
        ← → ou glisse pour bouger · Entrée pour commencer
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
