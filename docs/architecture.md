# Forklane Architecture

Open-source software discovery platform built with Next.js, Neon Postgres, and Clerk.

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 16 (App Router) | React SSR/SSG, API routes, file-based routing |
| **Language** | TypeScript | Type safety across the entire codebase |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with pre-built components |
| **Database** | Neon Postgres | Serverless Postgres with branching |
| **ORM** | Drizzle ORM | Type-safe SQL queries and migrations |
| **Auth** | Clerk | User management (present but unused in V0-V2) |
| **Testing** | Vitest | Unit and integration tests |
| **Linting** | ESLint + Prettier | Code quality and formatting |

## Database Branching

Neon provides database branching that mirrors git workflows:

- **`dev`** — Development and testing
- **`production`** — Live production data

### Branch Workflow

```bash
# Work on dev
neon checkout dev
drizzle-kit push:pg

# Promote to production after testing
neon checkout production
drizzle-kit push:pg
```

## Database Connection Policy

Neon exposes two connection endpoints. The app uses both, separated by purpose:

| Endpoint | Env var | Purpose |
|----------|---------|---------|
| **Pooled** (`-pooler` host) | `DATABASE_URL` | All runtime queries — server components, API routes, cron jobs |
| **Direct** (non-pooled) | `DATABASE_URL_UNPOOLED` | `drizzle-kit` migrations, one-off `scripts/*.ts` |

### Why two endpoints?

The **pooled** endpoint uses Neon's transaction-mode connection pooler. Under concurrent serverless load (many Vercel functions, parallel cron jobs), each request borrows a connection from the pool and releases it immediately after the query. This prevents the compute instance from running out of connections.

The **direct** endpoint connects straight to the compute. It is appropriate for **long-running, single-client operations** — schema migrations, backfills, diagnostics — where holding a connection for the duration is expected and no other client needs it.

### Rules

1. Production runtime code (`src/`) **must** use `DATABASE_URL` (pooled).
2. Migration scripts and one-off `scripts/` **must** use `DATABASE_URL_UNPOOLED` (direct).
3. Never import `db` from `@/app/db` in a script that needs the direct endpoint — create your own `neon(DATABASE_URL_UNPOOLED)` connection instead.

See `src/app/db/README.md` for the full connection policy and migration workflow.

## Folder Structure

```
openalternative/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   │   └── webhooks/      # Webhook handlers (Clerk)
│   │   ├── components/        # React components
│   │   ├── db/                # Database schema and migrations
│   │   ├── lib/               # Utilities and shared code
│   │   │   ├── __tests__/     # Unit tests
│   │   │   └── utils.ts       # cn() and other utilities
│   │   ├── sign-in/           # Clerk sign-in page
│   │   ├── sign-up/           # Clerk sign-up page
│   │   ├── error.tsx          # Error boundary
│   │   ├── globals.css        # Global styles with shadcn variables
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Home page
│   └── middleware.ts          # Clerk auth middleware
├── docs/                       # Documentation
├── public/                     # Static assets
├── drizzle.config.ts           # Drizzle ORM configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── vitest.config.ts            # Vitest test configuration
└── components.json             # shadcn/ui configuration
```

## Key Decisions

### Clerk: Present but Unused

Clerk is included in the starter template and remains wired up but **unused** for V0-V2. The public product works with zero authentication. Clerk will be activated in V3 when user accounts and personalization features are added.

### Database Schema

- **users** — Synced from Clerk webhooks (unused until V3)

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` — Neon Postgres **pooled** connection string (`-pooler` host)
- `DATABASE_URL_UNPOOLED` — Neon Postgres **direct** connection string (for migrations/scripts)
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `CLERK_SECRET_KEY` — Clerk secret key
- `CLERK_WEBHOOK_SECRET` — Clerk webhook verification secret

## Development

```bash
# Install dependencies
npm install

# Set up database
npm run drizzle:generate
npm run drizzle:push
npm run seed:dev

# Start dev server
npm run dev

# Run tests
npm run test

# Lint and format
npm run lint
npm run format
```

## Deployment

This application is configured for deployment on Vercel with Neon Postgres.

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

Preview deployments automatically get their own Neon database branch via the Neon-Vercel integration.
