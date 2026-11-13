// Bundles Lecture Z into public/lecture/ (index.html + app.js + app.css) for static hosting.
import { build } from "esbuild";
import { writeFileSync } from "node:fs";

const out = "public/lecture";
await build({
  entryPoints: { app: "src/lecture/static/main.tsx" },
  outdir: out,
  bundle: true,
  minify: true,
  format: "esm",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  logLevel: "info",
});

const v = Date.now().toString(36); // cache-buster for the bundle
writeFileSync(
  `${out}/index.html`,
  `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<meta name="theme-color" content="#12306b" />
<title>Lecture Z</title>
<meta name="description" content="Apprendre à lire avec Goku : les sons de la classe, une fusion à la fois." />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Andika:wght@400;700&family=Bangers&family=Playwrite+FR+Moderne&display=swap" />
<link rel="stylesheet" href="/lecture/app.css?v=${v}" />
<style>html,body{margin:0;height:100%;background:#12306b}</style>
</head>
<body>
<div id="root"></div>
<script type="module" src="/lecture/app.js?v=${v}"></script>
</body>
</html>
`,
);
console.log(`Wrote ${out}/index.html`);
