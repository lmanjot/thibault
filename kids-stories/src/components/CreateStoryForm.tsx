"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AGE_OPTIONS,
  DRAWING_STYLES,
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
        throw new Error(data.error ?? "Failed to create story");
      }
      router.push(`/stories/${data.storyId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
          Story idea
        </label>
        <textarea
          id="prompt"
          required
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="A brave little fox who learns to share her favorite berries with forest friends…"
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
            Child&apos;s age
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
                {age} years old
              </option>
            ))}
          </select>
        </div>

        <div>
          <span className="mb-2 block font-display text-sm font-semibold text-amber-950">
            Story length
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
            Drawing style
          </label>
          <select
            id="style"
            value={drawingStyle}
            onChange={(e) => setDrawingStyle(e.target.value as DrawingStyle)}
            className="w-full rounded-xl border border-amber-200 bg-white px-4 py-2.5 text-amber-950 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
            disabled={loading}
          >
            {(Object.keys(DRAWING_STYLES) as DrawingStyle[]).map((key) => (
              <option key={key} value={key}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
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
        {loading ? "Creating your story…" : "Create story"}
      </button>

      {loading && (
        <p className="text-sm text-amber-800/70">
          This takes a minute or two — we&apos;re writing your tale and painting each scene.
        </p>
      )}
    </form>
  );
}
