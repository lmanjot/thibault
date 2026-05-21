# Contes — Histoires illustrées pour enfants

Créez des histoires illustrées personnalisées pour vos enfants. Décrivez une idée, indiquez l'âge de l'enfant, la longueur du récit et le style de dessin — l'application rédige un conte en français, découpé en courts paragraphes, chacun accompagné d'une illustration générée par IA. Les histoires sont enregistrées pour les relire à tout moment.

## Fonctionnalités

- **Idée d'histoire** — Partez de n'importe quelle idée (ex. « un dragon qui a le vertige »)
- **Paramètres** — Âge (3–12 ans), longueur (courte / moyenne / longue), style de dessin
- **Scène par scène** — Chaque paragraphe a sa propre illustration
- **Bibliothèque** — Parcourir, lire et supprimer les histoires enregistrées

## Déploiement Vercel (ce dépôt)

Le dépôt contient aussi des jeux HTML à la racine. **`vercel.json` à la racine** configure Vercel pour builder l'app Next.js dans `kids-stories/`.

**URL de production** : celle affichée dans le dashboard Vercel du projet, en général :

- `https://thibault.vercel.app` ou
- `https://thibault-<votre-equipe>.vercel.app`

(Le sous-domaine exact dépend du nom du projet Vercel lié au repo `lmanjot/thibault`.)

### Variables d'environnement Vercel

| Variable | Obligatoire |
|----------|-------------|
| `OPENAI_API_KEY` | Oui — texte et images |
| `BLOB_READ_WRITE_TOKEN` | Oui en production — créez un **Blob store** dans Vercel → Storage → Connect to Project |

### Réglage recommandé dans Vercel

Si le build échoue encore, dans **Project Settings → General → Root Directory**, mettez : `kids-stories`

## Développement local

```bash
cd kids-stories
cp .env.example .env.local   # OPENAI_API_KEY
npm install
npm run dev
```

→ http://localhost:3000

En local, les histoires sont stockées dans `data/stories.db` (SQLite). Sur Vercel, le stockage utilise **Vercel Blob**.

## Technique

- Next.js App Router
- Vercel AI SDK + OpenAI (GPT-4o mini, DALL·E 3)
- SQLite en local / Vercel Blob en production
