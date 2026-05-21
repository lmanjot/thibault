"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { ParagraphRow, StoryRow } from "@/lib/db";

export function StoryIllustrator({
  story,
  paragraphs,
}: {
  story: StoryRow;
  paragraphs: ParagraphRow[];
}) {
  const router = useRouter();
  const started = useRef(false);
  const [progress, setProgress] = useState(
    paragraphs.filter((p) => p.image_path).length
  );
  const [error, setError] = useState<string | null>(null);

  const total = paragraphs.length;
  const needsIllustration =
    story.status === "generating" &&
    paragraphs.some((p) => !p.image_path);

  useEffect(() => {
    if (!needsIllustration || started.current) return;
    started.current = true;

    const missing = paragraphs
      .filter((p) => !p.image_path)
      .sort((a, b) => a.position - b.position);

    async function illustrateAll() {
      for (const paragraph of missing) {
        const res = await fetch(`/api/stories/${story.id}/illustrate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: paragraph.position }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Erreur lors de l'illustration");
          router.refresh();
          return;
        }
        setProgress(data.illustrated ?? 0);
        router.refresh();
        if (data.done) break;
      }
      router.refresh();
    }

    illustrateAll();
  }, [needsIllustration, story.id, paragraphs, router]);

  if (!needsIllustration) return null;

  return (
    <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-4 text-center">
      <p className="font-display font-semibold text-amber-900">
        Illustration en cours…
      </p>
      <p className="mt-1 text-sm text-amber-800/70">
        Scène {progress} sur {total}
      </p>
      {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
    </div>
  );
}
