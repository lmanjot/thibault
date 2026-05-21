import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, experimental_generateImage as generateImage } from "ai";
import { z } from "zod";
import fs from "fs";
import path from "path";
import {
  DRAWING_STYLES,
  STORY_LENGTHS,
  type DrawingStyle,
  type StoryLength,
} from "./constants";
import { getGeneratedImagesDir } from "./db";

const storySchema = z.object({
  title: z.string().describe("A short, catchy title for the story"),
  paragraphs: z
    .array(z.string())
    .describe(
      "Story split into short paragraphs, one scene per paragraph. Each paragraph is 2-4 sentences."
    ),
});

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY is not set. Add it to kids-stories/.env.local to generate stories and images."
    );
  }
  return createOpenAI({ apiKey });
}

export async function generateStoryText({
  prompt,
  childAge,
  length,
}: {
  prompt: string;
  childAge: number;
  length: StoryLength;
}) {
  const paragraphCount = STORY_LENGTHS[length].paragraphs;
  const openai = getOpenAI();

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    schema: storySchema,
    prompt: `You are a warm, imaginative children's author.

Write an original story for a ${childAge}-year-old child based on this idea:
"${prompt}"

Requirements:
- Exactly ${paragraphCount} paragraphs (one scene per paragraph)
- Vocabulary and themes appropriate for age ${childAge}
- Each paragraph: 2-4 short sentences, easy to read aloud
- Positive tone, gentle conflict if any, satisfying ending
- No scary violence; keep it cozy and age-appropriate
- Do not include paragraph numbers or labels in the text`,
  });

  return object;
}

export async function generateParagraphImage({
  storyId,
  position,
  paragraphText,
  drawingStyle,
  storyTitle,
}: {
  storyId: string;
  position: number;
  paragraphText: string;
  drawingStyle: DrawingStyle;
  storyTitle: string;
}) {
  const openai = getOpenAI();
  const styleDescription = DRAWING_STYLES[drawingStyle];

  const imagePrompt = `Children's book illustration for the story "${storyTitle}".
Scene: ${paragraphText}
Art style: ${styleDescription}.
No text, letters, or words in the image. Safe for young children. Single clear scene.`;

  const { image } = await generateImage({
    model: openai.image("dall-e-3"),
    prompt: imagePrompt,
    size: "1024x1024",
  });

  const dir = getGeneratedImagesDir(storyId);
  const filename = `${position}.png`;
  const filePath = path.join(dir, filename);
  const buffer = Buffer.from(image.base64, "base64");
  fs.writeFileSync(filePath, buffer);

  return `/generated/${storyId}/${filename}`;
}
