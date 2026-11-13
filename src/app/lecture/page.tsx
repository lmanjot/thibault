import type { Metadata, Viewport } from "next";
import { Andika, Bangers, Playwrite_FR_Moderne } from "next/font/google";
import LectureApp from "@/lecture/ui/LectureApp";

const read = Andika({ weight: ["400", "700"], subsets: ["latin", "latin-ext"], variable: "--lz-script" });
const cursive = Playwrite_FR_Moderne({ weight: ["400"], variable: "--lz-cursive" });
const display = Bangers({ weight: "400", subsets: ["latin"], variable: "--lz-display" });

export const metadata: Metadata = {
  title: "Lecture Z",
  description: "Apprendre à lire avec Goku : les sons de la classe, une fusion à la fois.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#12306b",
};

export default function LecturePage() {
  return <LectureApp fontClass={`${read.variable} ${cursive.variable} ${display.variable}`} />;
}
