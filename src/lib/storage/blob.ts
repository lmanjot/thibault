import { del, list, put } from "@vercel/blob";
import type { NewStory, ParagraphRow, StoryRow } from "../types";

const PREFIX = "contes";

function storyMetaPath(id: string) {
  return `${PREFIX}/${id}/story.json`;
}

function paragraphsPath(id: string) {
  return `${PREFIX}/${id}/paragraphs.json`;
}

function imagePath(id: string, position: number) {
  return `${PREFIX}/${id}/${position}.png`;
}

async function readJson<T>(pathname: string): Promise<T | null> {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  const blob = blobs.find((b) => b.pathname === pathname);
  if (!blob) return null;
  const res = await fetch(blob.url);
  if (!res.ok) return null;
  return res.json() as Promise<T>;
}

export async function listStories(): Promise<StoryRow[]> {
  const { blobs } = await list({ prefix: `${PREFIX}/` });
  const metaBlobs = blobs.filter((b) => b.pathname.endsWith("/story.json"));
  const stories = await Promise.all(
    metaBlobs.map(async (b) => {
      const res = await fetch(b.url);
      return res.json() as Promise<StoryRow>;
    })
  );
  return stories.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getStory(id: string): Promise<StoryRow | undefined> {
  return (await readJson<StoryRow>(storyMetaPath(id))) ?? undefined;
}

export async function getParagraphs(storyId: string): Promise<ParagraphRow[]> {
  return (await readJson<ParagraphRow[]>(paragraphsPath(storyId))) ?? [];
}

async function writeStoryMeta(story: StoryRow) {
  await put(storyMetaPath(story.id), JSON.stringify(story), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

async function writeParagraphs(storyId: string, paragraphs: ParagraphRow[]) {
  await put(paragraphsPath(storyId), JSON.stringify(paragraphs), {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function insertStory(story: NewStory) {
  const row: StoryRow = {
    ...story,
    status: "generating",
    error_message: null,
    created_at: new Date().toISOString(),
  };
  await writeStoryMeta(row);
  await writeParagraphs(story.id, []);
}

export async function insertParagraph(
  storyId: string,
  position: number,
  text: string,
  imagePath: string | null = null
) {
  const paragraphs = await getParagraphs(storyId);
  paragraphs.push({
    id: position,
    story_id: storyId,
    position,
    text,
    image_path: imagePath,
  });
  await writeParagraphs(storyId, paragraphs);
}

export async function updateParagraphImage(
  storyId: string,
  position: number,
  imagePath: string
) {
  const paragraphs = await getParagraphs(storyId);
  const p = paragraphs.find((x) => x.position === position);
  if (p) p.image_path = imagePath;
  await writeParagraphs(storyId, paragraphs);
}

export async function updateStoryTitle(id: string, title: string) {
  const story = await getStory(id);
  if (!story) return;
  story.title = title;
  await writeStoryMeta(story);
}

export async function updateStoryStatus(
  id: string,
  status: StoryRow["status"],
  errorMessage: string | null = null
) {
  const story = await getStory(id);
  if (!story) return;
  story.status = status;
  story.error_message = errorMessage;
  await writeStoryMeta(story);
}

export async function deleteStory(id: string) {
  const { blobs } = await list({ prefix: `${PREFIX}/${id}/` });
  if (blobs.length > 0) {
    await del(blobs.map((b) => b.url));
  }
}

export async function saveParagraphImage(
  storyId: string,
  position: number,
  buffer: Buffer
): Promise<string> {
  const blob = await put(imagePath(storyId, position), buffer, {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "image/png",
  });
  return blob.url;
}
