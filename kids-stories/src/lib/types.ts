export type StoryRow = {
  id: string;
  title: string;
  prompt: string;
  child_age: number;
  length: string;
  drawing_style: string;
  status: "generating" | "ready" | "error";
  error_message: string | null;
  created_at: string;
};

export type ParagraphRow = {
  id: number;
  story_id: string;
  position: number;
  text: string;
  image_path: string | null;
};

export type NewStory = Omit<StoryRow, "created_at" | "status" | "error_message">;
