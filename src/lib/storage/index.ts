import * as blob from "./blob";

function useBlobStorage() {
  return (
    Boolean(process.env.BLOB_READ_WRITE_TOKEN) || process.env.VERCEL === "1"
  );
}

async function backend() {
  if (useBlobStorage()) {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      throw new Error(
        "Stockage Vercel Blob requis : créez un Blob store dans le projet Vercel (Storage → Blob), puis redéployez."
      );
    }
    return blob;
  }
  return import("./sqlite");
}

export const listStories = async () => (await backend()).listStories();
export const getStory = async (id: string) => (await backend()).getStory(id);
export const getParagraphs = async (storyId: string) =>
  (await backend()).getParagraphs(storyId);
export const insertStory = async (
  story: Parameters<typeof blob.insertStory>[0]
) => (await backend()).insertStory(story);
export const insertParagraph = async (
  storyId: string,
  position: number,
  text: string,
  imagePath?: string | null
) => (await backend()).insertParagraph(storyId, position, text, imagePath);
export const updateParagraphImage = async (
  storyId: string,
  position: number,
  imagePath: string
) => (await backend()).updateParagraphImage(storyId, position, imagePath);
export const updateStoryTitle = async (id: string, title: string) =>
  (await backend()).updateStoryTitle(id, title);
export const updateStoryStatus = async (
  id: string,
  status: import("../types").StoryRow["status"],
  errorMessage?: string | null
) => (await backend()).updateStoryStatus(id, status, errorMessage);
export const deleteStory = async (id: string) => (await backend()).deleteStory(id);
export const saveParagraphImage = async (
  storyId: string,
  position: number,
  buffer: Buffer
) => (await backend()).saveParagraphImage(storyId, position, buffer);
