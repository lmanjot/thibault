import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { generateParagraphImage, generateStoryText } from "@/lib/ai";
import {
  DRAWING_STYLES,
  STORY_LENGTHS,
  type DrawingStyle,
  type StoryLength,
} from "@/lib/constants";
import {
  insertParagraph,
  insertStory,
  updateParagraphImage,
  updateStoryStatus,
  updateStoryTitle,
} from "@/lib/db";

const bodySchema = z.object({
  prompt: z.string().min(3).max(2000),
  childAge: z.number().int().min(3).max(12),
  length: z.enum(["short", "medium", "long"] as [StoryLength, ...StoryLength[]]),
  drawingStyle: z.enum(
    Object.keys(DRAWING_STYLES) as [DrawingStyle, ...DrawingStyle[]]
  ),
});

export async function POST(request: Request) {
  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const storyId = uuidv4();

  try {
    insertStory({
      id: storyId,
      title: "Creating your story…",
      prompt: body.prompt,
      child_age: body.childAge,
      length: body.length,
      drawing_style: body.drawingStyle,
    });

    const { title, paragraphs } = await generateStoryText({
      prompt: body.prompt,
      childAge: body.childAge,
      length: body.length,
    });

    updateStoryTitle(storyId, title);

    const targetCount = STORY_LENGTHS[body.length].paragraphs;
    const storyParagraphs = paragraphs.slice(0, targetCount);

    for (let i = 0; i < storyParagraphs.length; i++) {
      insertParagraph(storyId, i, storyParagraphs[i]);
    }

    for (let i = 0; i < storyParagraphs.length; i++) {
      const imagePath = await generateParagraphImage({
        storyId,
        position: i,
        paragraphText: storyParagraphs[i],
        drawingStyle: body.drawingStyle,
        storyTitle: title,
      });
      updateParagraphImage(storyId, i, imagePath);
    }

    updateStoryStatus(storyId, "ready");

    return NextResponse.json({ storyId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Story generation failed";
    updateStoryStatus(storyId, "error", message);
    return NextResponse.json({ error: message, storyId }, { status: 500 });
  }
}
