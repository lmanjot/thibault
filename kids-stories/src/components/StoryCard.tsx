import Link from "next/link";
import type { StoryRow } from "@/lib/db";
import { STORY_LENGTHS } from "@/lib/constants";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function StoryCard({ story }: { story: StoryRow }) {
  const statusLabel =
    story.status === "ready"
      ? "Ready"
      : story.status === "generating"
        ? "Creating…"
        : "Error";

  return (
    <Link
      href={`/stories/${story.id}`}
      className="group block rounded-2xl border border-amber-200/80 bg-white p-5 shadow-sm transition hover:border-amber-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold text-amber-950 group-hover:text-amber-800">
          {story.title}
        </h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
            story.status === "ready"
              ? "bg-emerald-100 text-emerald-800"
              : story.status === "generating"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
          }`}
        >
          {statusLabel}
        </span>
      </div>
      <p className="mt-2 line-clamp-2 text-sm text-amber-900/70">{story.prompt}</p>
      <p className="mt-3 text-xs text-amber-800/60">
        Age {story.child_age} · {STORY_LENGTHS[story.length as keyof typeof STORY_LENGTHS]?.label ?? story.length} ·{" "}
        {formatDate(story.created_at)}
      </p>
    </Link>
  );
}
