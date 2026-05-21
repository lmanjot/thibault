import { NextResponse } from "next/server";
import { listStories } from "@/lib/db";

export async function GET() {
  const stories = listStories();
  return NextResponse.json({ stories });
}
