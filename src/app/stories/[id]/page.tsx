import Link from "next/link";
import { notFound } from "next/navigation";
import { StoryIllustrator } from "@/components/StoryIllustrator";
import { StoryReader } from "@/components/StoryReader";
import { getParagraphs, getStory } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await getStory(id);
  if (!story) notFound();

  const paragraphs = await getParagraphs(id);

  return (
    <div>
      <Link
        href="/stories"
        className="mb-8 inline-block text-sm font-medium text-amber-700 hover:text-amber-800"
      >
        ← Retour aux histoires
      </Link>
      <StoryIllustrator story={story} paragraphs={paragraphs} />
      <StoryReader story={story} paragraphs={paragraphs} />
    </div>
  );
}
