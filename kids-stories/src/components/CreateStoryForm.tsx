"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AGE_OPTIONS,
  DRAWING_STYLE_LABELS,
  STORY_LENGTHS,
  type DrawingStyle,
  type StoryLength,
} from "@/lib/constants";

export function CreateStoryForm() {
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [childAge, setChildAge] = useState(6);
  const [length, setLength] = useState<StoryLength>("medium");
  const [drawingStyle, setDrawingStyle] = useState<DrawingStyle>("storybook");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/stories/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, childAge, length, drawingStyle }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Impossible de créer l'histoire");
      }
      router.push(`/stories/${data.storyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <label
          htmlFor="prompt"
          className="mb-2 block font-display text-sm font-semibold text-amber-950"
        >
          Idée d&apos;histoire
        </label>
        <textarea
          id="prompt"
          required
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Un petit renard courageux qui apprend à partager ses baies préférées avec ses amis de la forêt…"
          className="w-full resize-none rounded-xl border border-amber-200 bg-white px-4 py-3 text-amber-950 placeholder:text-amber-400/80 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          disabled={loading}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label
            htmlFor="age"
            className="mb-2 block font-display text-sm font-semibold text-amber-950"
          >
            Âge de l&apos;enfant
          </label>
          <select
            id="age"
            value={childAge}
            onChange={(e) => setChildAge(Number(e.target.value))}
            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-amber-950 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            disabled={loading}
          >
            {AGE_OPTIONS.map((age) => (
              <option key={age} value={age}>
                {age} ans
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-2 block font-display text-sm font-semibold text-amber-950">
            Longueur de l&apos;histoire
          </span>
          <div className="flex flex-col gap-2">
            {(Object.keys(STORY_LENGTHS) as StoryLength[]).map((key) => (
              <label
                key={key}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                  length === key
                    ? "border-amber-400 bg-amber-50 text-amber-950"
                    : "border-amber-100 bg-white text-amber-900/80 hover:border-amber-200"
                }`}
              >
                <input
                  type="radio"
                  name="length"
                  value={key}
                  checked={length === key}
                  onChange={() => setLength(key)}
                  className="accent-amber-500"
                  disabled={loading}
                />
                <span>
                  <span className="font-medium">{STORY_LENGTHS[key].label}</span>
                  <span className="text-amber-700/60"> — {STORY_LENGTHS[key].description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="style"
            className="mb-2 block font-display text-sm font-semibold text-amber-950"
          >
            Style de dessin
          </label>
          <select
            id="style"
            value={drawingStyle}
            onChange={(e) => setDrawingStyle(e.target.value as DrawingStyle)}
            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-amber-950 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            disabled={loading}
          >
            {(Object.keys(DRAWING_STYLE_LABELS) as DrawingStyle[]).map((key) => (
              <option key={key} value={key}>
                {DRAWING_STYLE_LABELS[key]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !prompt.trim()}
        className="w-full rounded-2xl bg-amber-500 px-6 py-4 font-display text-lg font-semibold text-white shadow-md transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
      >
        {loading ? "Création en cours…" : "Créer l'histoire"}
      </button>

      {loading && (
        <p className="text-sm text-amber-800/70">
          Rédaction du texte en cours… les illustrations suivront sur la page de l&apos;histoire.
        </p>
      )}
    </form>
  );
}
