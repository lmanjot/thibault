export const STORY_LENGTHS = {
  short: { label: "Short", paragraphs: 4, description: "~4 scenes" },
  medium: { label: "Medium", paragraphs: 7, description: "~7 scenes" },
  long: { label: "Long", paragraphs: 11, description: "~11 scenes" },
} as const;

export type StoryLength = keyof typeof STORY_LENGTHS;

export const DRAWING_STYLES = {
  watercolor: "Soft watercolor children's book illustration",
  cartoon: "Bright colorful cartoon style, friendly and playful",
  storybook: "Classic storybook illustration with warm lighting",
  pixel: "Cute pixel art style, retro game aesthetic",
  clay: "Claymation / stop-motion style, textured and whimsical",
  pencil: "Colored pencil sketch, gentle and handmade feel",
} as const;

export type DrawingStyle = keyof typeof DRAWING_STYLES;

export const AGE_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
