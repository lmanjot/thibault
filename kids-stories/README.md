# Storytime — Illustrated kids' stories

Create personalized illustrated stories for your children. Describe an idea, set the child's age, story length, and drawing style — the app writes a tale split into short paragraphs, each with a matching AI-generated illustration. Stories are saved locally so you can revisit them anytime.

## Features

- **Story ideas** — Start from any prompt (e.g. "a shy robot who wants to dance")
- **Parameters** — Child age (3–12), length (short / medium / long), drawing style (watercolor, cartoon, storybook, pixel, clay, pencil)
- **Scene-by-scene** — Each paragraph gets its own illustration
- **Library** — Browse, read, and delete saved stories

## Setup

1. Install dependencies:

```bash
cd kids-stories
npm install
```

2. Copy the environment file and add your OpenAI API key (used for story text and DALL·E 3 images):

```bash
cp .env.example .env.local
```

3. Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech

- [Next.js](https://nextjs.org/) App Router
- [Vercel AI SDK](https://sdk.vercel.ai/) + OpenAI (GPT-4o mini for text, DALL·E 3 for images)
- SQLite (`better-sqlite3`) for story storage
- Images saved under `public/generated/`

## Notes

- Generation takes 1–3 minutes depending on story length (one image per paragraph).
- Data is stored in `data/stories.db` on your machine — back up the `data/` and `public/generated/` folders if you care about keeping stories.
