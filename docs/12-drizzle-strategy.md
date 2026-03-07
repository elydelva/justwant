# 12 — Stratégie Drizzle vs Prisma

## Question

Est-ce risqué de ne supporter que Drizzle ORM ? Mais du coup supporter toutes les bases sous-jacentes (pg, mysql, sqlite) ?

## Ce que Drizzle apporte

- **Postgres** → pg, postgres.js, neon, vercel-postgres
- **MySQL** → mysql2, planetscale
- **SQLite** → better-sqlite3, bun:sqlite, turso/libsql

Un seul contrat `DrizzleAdapter` couvre toutes les bases relationnelles. Pas de pgAdapter, mysqlAdapter, sqliteAdapter séparés.

Le schema Drizzle devient la **source de vérité** :

```ts
import { users } from '@justwant/user/schema'
import { posts } from './posts'

export const schema = { users, posts }
// → une seule source de vérité, un seul push/migrate
```

## Ce qu'on perd

- **Les users Prisma** — majorité des projets TypeScript aujourd'hui
- **MongoDB** — Drizzle ne supporte pas les bases non-relationnelles (et l'écosystème @justwant/* est fondamentalement relationnel)

## Le vrai risque : perceptionnel

```
Développeur qui tombe sur @justwant/auth :
"Ah, Drizzle only ? Je suis sur Prisma, je passe."
→ il n'essaie même pas
→ il n'arrive jamais à voir la valeur du reste
```

## Cohérence vs adoption

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| **Cohérence maximale** (Drizzle only) | Un seul contrat, schema unifié, migrations Drizzle | Exclut Prisma au lancement |
| **Adoption maximale** (Drizzle + Prisma + raw) | Couvre 90% des stacks | Deux contrats, schema en double, plus de maintenance |

## Recommandation : séquence en 2 phases

### Phase 1 — Drizzle only

Sortir l'écosystème avec Drizzle uniquement. Audience naturelle : les projets from scratch en 2025.

```bash
pnpm create justwant@latest
# → scaffold avec Drizzle, PG, tout câblé
```

### Phase 2 — Prisma adapter

Une fois le schema Drizzle stabilisé, générer les types Prisma équivalents est mécanique.

```bash
npx @justwant migrate generate --adapter prisma
# → génère les model blocks à ajouter au schema.prisma
```

## Communication

Être honnête dès le premier jour dans la doc :

```
"@justwant/* uses Drizzle ORM as its canonical database layer.
Prisma support is planned. If you're on Prisma today, watch this issue."
```

## Verdict

**Non, ce n'est pas un risque fatal** — à condition de l'assumer clairement. Les gens qui démarrent un nouveau projet en 2025 n'ont pas de legacy ORM à défendre — c'est exactement eux qu'on vise en premier.
