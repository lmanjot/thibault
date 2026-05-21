import { NextResponse } from "next/server";
import { z } from "zod";
import { generateParagraphImage } from "@/lib/ai";
import type { DrawingStyle } from "@/lib/constants";
import {
  getParagraphs,
  getStory,
  updateParagraphImage,
  updateStoryStatus,
} from "@/lib/db";

export const maxDuration = 60;

const bodySchema = z.object({
  position: z.number().int().min(0),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) {
    return NextResponse.json({ error: "Histoire introuvable" }, { status: 404 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const paragraphs = await getParagraphs(id);
  const paragraph = paragraphs.find((p) => p.position === body.position);
  if (!paragraph) {
    return NextResponse.json({ error: "Paragraphe introuvable" }, { status: 404 });
  }

  if (paragraph.image_path) {
    return NextResponse.json({ imagePath: paragraph.image_path, done: false });
  }

  try {
    const imagePath = await generateParagraphImage({
      storyId: id,
      position: body.position,
      paragraphText: paragraph.text,
      drawingStyle: story.drawing_style as DrawingStyle,
      storyTitle: story.title,
    });
    await updateParagraphImage(id, body.position, imagePath);

    const updated = await getParagraphs(id);
    const allIllustrated = updated.every((p) => p.image_path);
    if (allIllustrated) {
      await updateStoryStatus(id, "ready");
    }

    return NextResponse.json({
      imagePath,
      done: allIllustrated,
      illustrated: updated.filter((p) => p.image_path).length,
      total: updated.length,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Échec de la génération de l'image";
    await updateStoryStatus(id, "error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
