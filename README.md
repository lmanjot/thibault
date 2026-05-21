# Contes — Histoires illustrées pour enfants

Application Next.js (français) pour créer des histoires illustrées avec l'IA.

**Déploiement Vercel** : le projet est à la racine du repo (`package.json` avec Next.js). L'URL de production est celle du projet Vercel (ex. `https://thibault.vercel.app`).

Les anciens jeux HTML sont dans le dossier [`games/`](games/).

## Démarrage local

```bash
cp .env.example .env.local   # OPENAI_API_KEY
npm install
npm run dev
```

→ http://localhost:3000

## Variables Vercel

| Variable | Obligatoire |
|----------|-------------|
| `OPENAI_API_KEY` | Oui |
| `BLOB_READ_WRITE_TOKEN` | Oui en production (Storage → Blob dans Vercel) |

Voir aussi les détails dans le code source (`src/lib/storage/`).
