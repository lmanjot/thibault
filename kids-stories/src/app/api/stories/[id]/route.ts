import { NextResponse } from "next/server";
import { deleteStory, getParagraphs, getStory } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) {
    return NextResponse.json({ error: "Histoire introuvable" }, { status: 404 });
  }
  const paragraphs = await getParagraphs(id);
  return NextResponse.json({ story, paragraphs });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) {
    return NextResponse.json({ error: "Histoire introuvable" }, { status: 404 });
  }
  await deleteStory(id);
  return NextResponse.json({ ok: true });
}
