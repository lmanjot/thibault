import Link from "next/link";
import { listStories } from "@/lib/db";
import { StoryCard } from "@/components/StoryCard";

export const dynamic = "force-dynamic";

export default function StoriesPage() {
  const stories = listStories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold text-amber-950">
          Mes histoires
        </h1>
        <Link
          href="/create"
          className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
        >
          + Nouvelle
        </Link>
      </div>

      {stories.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg text-amber-900/60">Aucune histoire pour l&apos;instant.</p>
          <Link
            href="/create"
            className="mt-4 inline-block font-medium text-amber-700 hover:text-amber-800"
          >
            Créer votre première histoire →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {stories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}
    </div>
  );
}
