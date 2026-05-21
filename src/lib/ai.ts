import { createOpenAI } from "@ai-sdk/openai";
import { generateObject, experimental_generateImage as generateImage } from "ai";
import { z } from "zod";
import {
  DRAWING_STYLES,
  STORY_LENGTHS,
  type DrawingStyle,
  type StoryLength,
} from "./constants";
import { saveParagraphImage } from "./db";

const storySchema = z.object({
  title: z.string().describe("Un titre court et accrocheur pour l'histoire"),
  paragraphs: z
    .array(z.string())
    .describe(
      "Histoire découpée en courts paragraphes, une scène par paragraphe. Chaque paragraphe fait 2 à 4 phrases."
    ),
});

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OPENAI_API_KEY n'est pas définie. Ajoutez-la dans les variables d'environnement Vercel (ou .env.local en local)."
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
    prompt: `Tu es un auteur d'histoires pour enfants, chaleureux et imaginatif.

Écris une histoire originale en français pour un enfant de ${childAge} ans, à partir de cette idée :
« ${prompt} »

Exigences :
- Exactement ${paragraphCount} paragraphes (une scène par paragraphe)
- Vocabulaire et thèmes adaptés à ${childAge} ans
- Chaque paragraphe : 2 à 4 phrases courtes, faciles à lire à voix haute
- Ton positif, conflit léger éventuel, fin satisfaisante
- Pas de violence effrayante ; ambiance douce et adaptée à l'âge
- Tout le texte (titre et paragraphes) doit être en français
- N'inclus pas de numéros de paragraphe ni d'étiquettes dans le texte`,
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

  const imagePrompt = `Illustration de livre pour enfants pour l'histoire « ${storyTitle} ».
Scène : ${paragraphText}
Style artistique : ${styleDescription}.
Aucun texte, lettre ni mot dans l'image. Contenu adapté aux jeunes enfants. Une seule scène claire.`;

  const { image } = await generateImage({
    model: openai.image("dall-e-3"),
    prompt: imagePrompt,
    size: "1024x1024",
  });

  const buffer = Buffer.from(image.base64, "base64");
  return saveParagraphImage(storyId, position, buffer);
}
