# Database

Neon Postgres with Drizzle ORM. Schema lives in `schema.ts`; migrations are generated into `migrations/`.

## Migration Workflow

### 1. Edit the schema

Modify `src/app/db/schema.ts` — add tables, columns, indexes, or constraints.

### 2. Generate the SQL migration

```bash
npm run drizzle:generate
```

This compares `schema.ts` against the existing migrations and writes a new numbered `.sql` file in `migrations/`. **Review the generated SQL** before applying.

### 3. Push to the `dev` branch

```bash
npx neon checkout dev
npm run drizzle:push
```

Never push schema changes directly to `production`. Always test on `dev` first.

### 4. Test

- Run the app against the feature branch to verify queries work.
- Run `npm run test` if relevant unit tests exist.

### 5. Promote to production

Once verified on `dev`:

```bash
npx neon checkout production
npm run drizzle:push
```

## Branch Convention

| Branch | Purpose |
|--------|---------|
| `production` | Live production data |
| `dev` | Development and testing |

## Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run drizzle:generate` | Generate migration SQL from schema diff |
| `npm run drizzle:push` | Push schema directly to current branch (no migration file) |
| `npx neon branch list` | List Neon database branches |
| `npx neon checkout <branch>` | Switch Neon branch (updates `DATABASE_URL` in `.env.local`) |
