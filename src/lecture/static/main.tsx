// Lecture Z as a static page (public/lecture/index.html): production serves the public/ folder
// as plain files, so the game is bundled here instead of being served by Next.js.
// Rebuild with: npm run build:lecture

import { createRoot } from "react-dom/client";
import LectureApp from "../ui/LectureApp";

createRoot(document.getElementById("root")!).render(<LectureApp fontClass="lz-fonts" />);

// Keep the sounds and pictures on the device (public/lecture/sw.js), like an installed app.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/lecture/sw.js", { scope: "/lecture/" }).catch(() => {});
  });
}
