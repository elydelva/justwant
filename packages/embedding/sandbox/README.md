# Sandbox — Matching étudiants ↔ missions

Sandbox avancé avec validation par assertions :

- **Moteur** : @xenova/transformers (all-MiniLM-L6-v2, 384 dim) — embeddings sémantiques locaux
- **Stockage** : sqlite-vec (better-sqlite3) en priorité, memory en fallback
- **Validation** : assertions sur les résultats (p1↔m1, recherche sémantique, scores)
- **CI** : `sandbox:validate` pour exécution silencieuse avec exit code

## Prérequis

- **Node.js** — tsx exécute le TypeScript
- Dépendances : `@xenova/transformers`, `better-sqlite3`, `sqlite-vec`, `tsx`

**Note** : Si `better-sqlite3` ne compile pas, le sandbox utilise memory. Pour sqlite-vec : `npm rebuild better-sqlite3` sous Node.

## Exécution

```bash
cd packages/embedding
bun install

# Mode interactif (affichage détaillé)
bun run sandbox

# Mode validation (CI, exit 0/1)
bun run sandbox:validate
```

## Assertions validées

| Assertion | Description |
|-----------|-------------|
| p1 → m1 | Profil dev (p1) a la mission full-stack (m1) dans le top 3 |
| m1 → p1 | Mission full-stack (m1) a le profil dev (p1) dans le top 3 |
| Recherche dev web | "développement web React TypeScript Lyon" retourne m1 ou m5 |
| Recherche stage | "stage développement informatique" retourne m1 dans le top 5 |
| Scores | Tous les scores dans [0, 1] |

## Dataset

- **Missions** : stages, alternances, freelances (Tech, Marketing, Design, Commerce)
- **Profils** : étudiants de différentes écoles (Centrale, Sciences Po, Polytechnique, etc.) avec compétences et centres d'intérêt

## Structure

| Fichier | Rôle |
|---------|------|
| `dataset.ts` | Missions et profils (données représentatives) |
| `local-transformers-engine.ts` | Adaptateur EmbeddingEngine pour @xenova/transformers |
| `core.ts` | Logique : création storage, indexation, requêtes |
| `validate.ts` | Assertions sur les résultats |
| `run.ts` | Script interactif avec affichage |
| `run-validate.ts` | Script validation (CI, silencieux) |
