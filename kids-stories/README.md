# Contes — Histoires illustrées pour enfants

Créez des histoires illustrées personnalisées pour vos enfants. Décrivez une idée, indiquez l'âge de l'enfant, la longueur du récit et le style de dessin — l'application rédige un conte en français, découpé en courts paragraphes, chacun accompagné d'une illustration générée par IA. Les histoires sont enregistrées localement pour les relire à tout moment.

## Fonctionnalités

- **Idée d'histoire** — Partez de n'importe quelle idée (ex. « un dragon qui a le vertige »)
- **Paramètres** — Âge (3–12 ans), longueur (courte / moyenne / longue), style de dessin (aquarelle, cartoon, conte illustré, pixel art, pâte à modeler, crayons)
- **Scène par scène** — Chaque paragraphe a sa propre illustration
- **Bibliothèque** — Parcourir, lire et supprimer les histoires enregistrées

## Installation

1. Installer les dépendances :

```bash
cd kids-stories
npm install
```

2. Copier le fichier d'environnement et ajouter votre clé API OpenAI (texte et images DALL·E 3) :

```bash
cp .env.example .env.local
```

3. Lancer le serveur de développement :

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Technique

- [Next.js](https://nextjs.org/) App Router
- [Vercel AI SDK](https://sdk.vercel.ai/) + OpenAI (GPT-4o mini pour le texte, DALL·E 3 pour les images)
- SQLite (`better-sqlite3`) pour le stockage
- Images enregistrées dans `public/generated/`

## Notes

- La génération prend 1 à 3 minutes selon la longueur (une image par paragraphe).
- Les histoires sont générées **en français**.
- Les données sont dans `data/stories.db` sur votre machine — sauvegardez les dossiers `data/` et `public/generated/` si vous souhaitez les conserver.
