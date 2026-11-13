import type { Metadata, Viewport } from "next";
import LectureApp from "@/lecture/ui/LectureApp";

// The game's fonts come from a plain Google Fonts stylesheet rather than next/font/google:
// with three more Google fonts next to the site's own, Turbopack's build-time font
// download fails intermittently ("next/font/google queries have exactly one entry").
const FONTS =
  "https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Bangers&family=Playwrite+FR+Moderne&display=swap";

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
  return (
    <>
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link rel="stylesheet" href={FONTS} precedence="default" />
      <LectureApp fontClass="lz-fonts" />
    </>
  );
}
