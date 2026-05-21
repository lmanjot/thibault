import Link from "next/link";
import { listStories } from "@/lib/db";
import { StoryCard } from "@/components/StoryCard";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const recent = listStories().slice(0, 3);

  return (
    <div className="space-y-12">
      <section className="text-center">
        <h1 className="font-display text-4xl font-bold tracking-tight text-amber-950 sm:text-5xl">
          Des histoires magiques, rien que pour votre enfant
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-amber-900/75">
          Décrivez une idée, choisissez l&apos;âge et le style des dessins : nous
          écrivons une histoire avec une illustration par scène — à relire au
          coucher quand vous voulez.
        </p>
        <Link
          href="/create"
          className="mt-8 inline-block rounded-2xl bg-amber-500 px-8 py-4 font-display text-lg font-semibold text-white shadow-md transition hover:bg-amber-600"
        >
          Créer une histoire
        </Link>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-amber-950">
              Histoires récentes
            </h2>
            <Link
              href="/stories"
              className="text-sm font-medium text-amber-700 hover:text-amber-800"
            >
              Tout voir →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recent.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 rounded-2xl border border-amber-100 bg-white/80 p-6 sm:grid-cols-3">
        {[
          {
            title: "Votre idée",
            text: "Un dragon qui a le vertige, un goûter sur la Lune — tout est possible.",
          },
          {
            title: "Sur mesure",
            text: "Âge, longueur et style d'illustration : chaque histoire colle à votre lecteur.",
          },
          {
            title: "Scène par scène",
            text: "De courts paragraphes avec une image chacun — parfaits pour lire ensemble.",
          },
        ].map((item) => (
          <div key={item.title}>
            <h3 className="font-display font-semibold text-amber-900">
              {item.title}
            </h3>
            <p className="mt-1 text-sm text-amber-800/70">{item.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
