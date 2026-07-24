# Database

Neon Postgres with Drizzle ORM. Schema lives in `schema.ts`; migrations are generated into `migrations/`.

## Connection Policy

Neon provides two connection endpoints — **pooled** (`-pooler` host) and **direct** (no suffix). The app uses both, strictly separated by purpose:

| Endpoint | Env var | Used by |
|----------|---------|---------|
| **Pooled** (`-pooler`) | `DATABASE_URL` | `src/app/db/index.ts` — all runtime queries (server components, API routes, cron jobs) |
| **Direct** (non-pooled) | `DATABASE_URL_UNPOOLED` | `drizzle.config.ts` (migrations), `scripts/*.ts` (one-off DDL/diagnostic scripts) |

### Why this matters

- The **pooled** endpoint uses Neon's transaction-mode connection pooler. Each HTTP request gets a short-lived connection from the pool, which is released immediately after the query completes. This prevents connection exhaustion under concurrent serverless load (Vercel functions, cron jobs firing in parallel).
- The **direct** endpoint connects straight to the compute instance. It is appropriate for **long-running, single-client operations** like `drizzle-kit push`, schema migrations, and backfill scripts where holding a connection for the duration is expected and no other client needs it.

### Rules

1. **Never** use `DATABASE_URL_UNPOOLED` in production runtime code (`src/`).
2. **Never** use `DATABASE_URL` (pooled) in migration scripts or one-off `scripts/`.
3. When adding a new script, explicitly select the correct env var — do not import `db` from `@/app/db` if you need the direct endpoint; create your own `neon()` connection with `DATABASE_URL_UNPOOLED`.

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
