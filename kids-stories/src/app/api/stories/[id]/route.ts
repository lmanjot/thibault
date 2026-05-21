import { NextResponse } from "next/server";
import { deleteStory, getParagraphs, getStory } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = getStory(id);
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  const paragraphs = getParagraphs(id);
  return NextResponse.json({ story, paragraphs });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const story = getStory(id);
  if (!story) {
    return NextResponse.json({ error: "Story not found" }, { status: 404 });
  }
  deleteStory(id);
  return NextResponse.json({ ok: true });
}
