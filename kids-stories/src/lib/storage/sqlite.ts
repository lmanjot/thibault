import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { NewStory, ParagraphRow, StoryRow } from "../types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "stories.db");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

let db: Database.Database | null = null;

function getDb() {
  if (!db) {
    ensureDataDir();
    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS stories (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        prompt TEXT NOT NULL,
        child_age INTEGER NOT NULL,
        length TEXT NOT NULL,
        drawing_style TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'generating',
        error_message TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      CREATE TABLE IF NOT EXISTS paragraphs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        story_id TEXT NOT NULL,
        position INTEGER NOT NULL,
        text TEXT NOT NULL,
        image_path TEXT,
        FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_paragraphs_story ON paragraphs(story_id);
    `);
  }
  return db;
}

export function getGeneratedImagesDir(storyId: string) {
  const dir = path.join(process.cwd(), "public", "generated", storyId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

export async function listStories(): Promise<StoryRow[]> {
  return getDb()
    .prepare(
      `SELECT id, title, prompt, child_age, length, drawing_style, status, error_message, created_at
       FROM stories ORDER BY created_at DESC`
    )
    .all() as StoryRow[];
}

export async function getStory(id: string): Promise<StoryRow | undefined> {
  return getDb()
    .prepare(
      `SELECT id, title, prompt, child_age, length, drawing_style, status, error_message, created_at
       FROM stories WHERE id = ?`
    )
    .get(id) as StoryRow | undefined;
}

export async function getParagraphs(storyId: string): Promise<ParagraphRow[]> {
  return getDb()
    .prepare(
      `SELECT id, story_id, position, text, image_path
       FROM paragraphs WHERE story_id = ? ORDER BY position ASC`
    )
    .all(storyId) as ParagraphRow[];
}

export async function insertStory(story: NewStory) {
  getDb()
    .prepare(
      `INSERT INTO stories (id, title, prompt, child_age, length, drawing_style, status)
       VALUES (@id, @title, @prompt, @child_age, @length, @drawing_style, 'generating')`
    )
    .run(story);
}

export async function insertParagraph(
  storyId: string,
  position: number,
  text: string,
  imagePath: string | null = null
) {
  getDb()
    .prepare(
      `INSERT INTO paragraphs (story_id, position, text, image_path)
       VALUES (?, ?, ?, ?)`
    )
    .run(storyId, position, text, imagePath);
}

export async function updateParagraphImage(
  storyId: string,
  position: number,
  imagePath: string
) {
  getDb()
    .prepare(
      `UPDATE paragraphs SET image_path = ? WHERE story_id = ? AND position = ?`
    )
    .run(imagePath, storyId, position);
}

export async function updateStoryTitle(id: string, title: string) {
  getDb().prepare(`UPDATE stories SET title = ? WHERE id = ?`).run(title, id);
}

export async function updateStoryStatus(
  id: string,
  status: StoryRow["status"],
  errorMessage: string | null = null
) {
  getDb()
    .prepare(`UPDATE stories SET status = ?, error_message = ? WHERE id = ?`)
    .run(status, errorMessage, id);
}

export async function deleteStory(id: string) {
  getDb().prepare(`DELETE FROM paragraphs WHERE story_id = ?`).run(id);
  getDb().prepare(`DELETE FROM stories WHERE id = ?`).run(id);
  const dir = path.join(process.cwd(), "public", "generated", id);
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true });
  }
}

export async function saveParagraphImage(
  storyId: string,
  position: number,
  buffer: Buffer
): Promise<string> {
  const dir = getGeneratedImagesDir(storyId);
  const filename = `${position}.png`;
  fs.writeFileSync(path.join(dir, filename), buffer);
  return `/generated/${storyId}/${filename}`;
}
