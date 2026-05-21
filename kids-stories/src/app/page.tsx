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
          Magical stories, made just for your child
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-amber-900/75">
          Describe an idea, pick the age and art style, and we&apos;ll write a
          story with an illustration for every scene — saved for bedtime
          anytime.
        </p>
        <Link
          href="/create"
          className="mt-8 inline-block rounded-2xl bg-amber-500 px-8 py-4 font-display text-lg font-semibold text-white shadow-md transition hover:bg-amber-600"
        >
          Create a story
        </Link>
      </section>

      {recent.length > 0 && (
        <section>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold text-amber-950">
              Recent stories
            </h2>
            <Link
              href="/stories"
              className="text-sm font-medium text-amber-700 hover:text-amber-800"
            >
              View all →
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
            title: "Your idea",
            text: "A dragon who is afraid of heights, a tea party on the moon — anything goes.",
          },
          {
            title: "Tailored for them",
            text: "Choose age, length, and illustration style so every story fits your reader.",
          },
          {
            title: "Scene by scene",
            text: "Short paragraphs with matching pictures — perfect for reading together.",
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
