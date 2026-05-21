export const STORY_LENGTHS = {
  short: { label: "Courte", paragraphs: 4, description: "~4 scènes" },
  medium: { label: "Moyenne", paragraphs: 7, description: "~7 scènes" },
  long: { label: "Longue", paragraphs: 11, description: "~11 scènes" },
} as const;

export type StoryLength = keyof typeof STORY_LENGTHS;

export const DRAWING_STYLES = {
  watercolor: "Illustration douce à l'aquarelle, livre pour enfants",
  cartoon: "Style cartoon coloré, joyeux et ludique",
  storybook: "Illustration classique de conte, lumière chaleureuse",
  pixel: "Pixel art mignon, esthétique rétro",
  clay: "Style pâte à modeler / stop-motion, textures fantaisistes",
  pencil: "Croquis aux crayons de couleur, doux et fait main",
} as const;

export const DRAWING_STYLE_LABELS: Record<keyof typeof DRAWING_STYLES, string> = {
  watercolor: "Aquarelle",
  cartoon: "Cartoon",
  storybook: "Conte illustré",
  pixel: "Pixel art",
  clay: "Pâte à modeler",
  pencil: "Crayons de couleur",
};

export type DrawingStyle = keyof typeof DRAWING_STYLES;

export const AGE_OPTIONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;
