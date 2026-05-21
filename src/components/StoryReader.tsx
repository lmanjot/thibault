"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ParagraphRow, StoryRow } from "@/lib/db";

export function StoryReader({
  story,
  paragraphs,
}: {
  story: StoryRow;
  paragraphs: ParagraphRow[];
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm("Supprimer cette histoire ? Cette action est irréversible.")) return;
    setDeleting(true);
    await fetch(`/api/stories/${story.id}`, { method: "DELETE" });
    router.push("/stories");
    router.refresh();
  }

  if (story.status === "error") {
    return (
      <div className="rounded-2xl bg-rose-50 p-8 text-center">
        <h2 className="font-display text-xl font-semibold text-rose-900">
          Un problème est survenu
        </h2>
        <p className="mt-2 text-rose-800">{story.error_message}</p>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="mt-6 text-sm text-rose-700 underline"
        >
          Supprimer l&apos;histoire
        </button>
      </div>
    );
  }

  return (
    <article>
      <header className="mb-10 text-center">
        <h1 className="font-display text-3xl font-bold text-amber-950 sm:text-4xl">
          {story.title}
        </h1>
        <p className="mt-2 text-sm text-amber-800/60">
          Pour {story.child_age} ans et plus · Créée le{" "}
          {new Date(story.created_at).toLocaleDateString("fr-FR")}
        </p>
      </header>

      <div className="space-y-14">
        {paragraphs.map((p, index) => (
          <section
            key={p.id}
            className={`flex flex-col gap-6 ${
              index % 2 === 1 ? "md:flex-row-reverse" : "md:flex-row"
            } md:items-center`}
          >
            <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-amber-100 bg-amber-50/50 shadow-inner md:w-1/2">
              {p.image_path ? (
                <Image
                  src={p.image_path}
                  alt={`Illustration de la scène ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority={index < 2}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-amber-600/60">
                  Illustration en cours…
                </div>
              )}
            </div>
            <p className="font-display text-lg leading-relaxed text-amber-950 md:w-1/2 md:text-xl">
              {p.text}
            </p>
          </section>
        ))}
      </div>

      <div className="mt-14 flex justify-center gap-4 border-t border-amber-100 pt-8">
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-amber-800/50 transition hover:text-rose-600"
        >
          {deleting ? "Suppression…" : "Supprimer l'histoire"}
        </button>
      </div>
    </article>
  );
}
