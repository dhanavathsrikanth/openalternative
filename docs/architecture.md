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
| **i18n** | next-intl | Locale-based routing and translation catalogs |
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
├── messages/                     # i18n translation catalogs
│   └── en.json                  # English strings (default locale)
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── [locale]/           # Locale-aware routes (all public pages)
│   │   │   ├── blocks/        # BlockNote editor custom blocks
│   │   │   ├── categories/    # Category listing & detail
│   │   │   ├── collections/   # Collection listing & detail
│   │   │   ├── compare/       # Comparison pages
│   │   │   ├── components/    # Page-level components (FaqSection, etc.)
│   │   │   ├── contributor/   # Contributor dashboard
│   │   │   ├── contributors/  # Public contributors list
│   │   │   ├── guides/        # Guide pages
│   │   │   ├── graveyard/     # Delisted products archive
│   │   │   ├── methodology/   # Scoring methodology page
│   │   │   ├── products/      # Product detail pages
│   │   │   ├── search/        # Search page
│   │   │   ├── submit/        # Product submission form
│   │   │   ├── Homepage.tsx   # Homepage client component
│   │   │   ├── layout.tsx     # Locale validation layout
│   │   │   └── page.tsx       # Home page (server)
│   │   ├── admin/             # Admin panel (NOT locale-prefixed)
│   │   ├── api/               # API routes (NOT locale-prefixed)
│   │   │   └── webhooks/      # Webhook handlers (Clerk)
│   │   ├── dashboard/         # Org dashboard (NOT locale-prefixed)
│   │   ├── db/                # Database schema and migrations
│   │   ├── lib/               # Utilities and shared code
│   │   │   ├── __tests__/     # Unit tests
│   │   │   └── utils.ts       # cn() and other utilities
│   │   ├── sign-in/           # Clerk sign-in page
│   │   ├── sign-up/           # Clerk sign-up page
│   │   ├── globals.css        # Global styles with shadcn variables
│   │   └── layout.tsx         # Root layout (Clerk + i18n providers)
│   ├── components/             # Shared components (NOT locale-scoped)
│   │   ├── SiteHeader.tsx     # Global header (uses useTranslations)
│   │   ├── SiteFooter.tsx     # Global footer (uses getTranslations)
│   │   ├── ProductCard.tsx    # Product card (uses getTranslations)
│   │   ├── ui/                # shadcn/ui primitives
│   │   └── ...
│   ├── i18n/                   # next-intl configuration
│   │   ├── routing.ts         # Locale routing config
│   │   ├── navigation.ts      # Client navigation helpers (Link, redirect)
│   │   ├── request.ts         # Server request config for loading messages
│   │   └── server.ts          # Server translation helper
│   └── middleware.ts          # Locale detection and redirects
├── docs/                       # Documentation
├── public/                     # Static assets
├── drizzle.config.ts           # Drizzle ORM configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── vitest.config.ts            # Vitest test configuration
└── components.json             # shadcn/ui configuration
```

## Key Decisions

### Internationalization (i18n)

The app uses **next-intl** for internationalization. All user-facing strings live in JSON catalogs under `messages/` — currently only `en.json` ships, but the infrastructure supports adding new locales.

#### Route structure

Public-facing pages are nested under `src/app/[locale]/` so every URL is locale-prefixed (e.g., `/en/products`). Pages that are **not** locale-aware stay outside the `[locale]` segment:

| Locale-prefixed (`[locale]/`) | NOT locale-prefixed |
|-------------------------------|---------------------|
| All public pages (home, products, categories, compare, collections, guides, search, submit, graveyard, methodology, contributors) | API routes (`/api/*`) |
| Client components with user-facing text | Admin panel (`/admin/*`) |
| BlockNote editor blocks | Dashboard (`/dashboard/*`) |
| | Auth routes (`/sign-in/*`, `/sign-up/*`, `/contributor/sign-in/*`, `/contributor/sign-up/*`) |
| | Cron jobs, webhooks, Sentry |

#### Middleware

`src/middleware.ts` uses `next-intl/middleware` to detect the locale from the `Accept-Language` header or cookie. Requests to non-localized paths (API, admin, auth, static files) are excluded via the matcher.

#### Translation catalog

All strings live in `messages/en.json` with dot-notation namespacing:

```json
{
  "Common.brand": "Forklane",
  "Home.hero.headline1": "Find your next",
  "Product.sidebar.migrationConfidence": "Migration Confidence",
  "Submit.form.name": "Product Name *"
}
```

**Interpolation** uses `{variable}` syntax: `"Home.hero.badge": "Now tracking {count} open-source alternatives"`

**Plurals** use ICU MessageFormat: `"{count, plural, =1 {# result found} other {# results found}}"`

#### Using translations in components

**Client components** — use `useTranslations`:

```tsx
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('Namespace')
  return <h1>{t('heading')}</h1>
}
```

**Server components** — use `getTranslations` (must be async):

```tsx
import { getTranslations } from 'next-intl/server'

export async function MyPage() {
  const t = await getTranslations('Namespace')
  return <h1>{t('heading')}</h1>
}
```

#### Adding a new component

When creating a new component with user-facing text:

1. **Add all strings to `messages/en.json`** under an appropriate namespace — never hardcode English text in JSX.
2. Use `useTranslations` (client) or `getTranslations` (server) to reference the keys.
3. If the component lives in `src/app/[locale]/`, relative imports work as-is.
4. If the component is shared (`src/components/`), it can still use translations — the `NextIntlClientProvider` in the root layout provides the messages.

#### Adding a new locale

1. Create `messages/{locale}.json` (copy `en.json` as a starting point).
2. Add the locale to the `locales` array in `src/i18n/routing.ts`.
3. That's it — the middleware will start detecting and routing to the new locale.

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

### i18n workflow

- **String catalog**: `messages/en.json` — add new keys here before using them in components.
- **Adding a string**: Pick a namespace (e.g., `Product.sidebar`), add the key-value pair, then use `t('sidebar.keyName')` in the component.
- **Interpolation**: Use `{variable}` in the catalog, pass values via `t('key', { variable: value })`.
- **Plurals**: Use ICU MessageFormat: `"{count, plural, =1 {# item} other {# items}}"`.
- **Never hardcode English text** in JSX — always go through the catalog.

## Deployment

This application is configured for deployment on Vercel with Neon Postgres.

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

Preview deployments automatically get their own Neon database branch via the Neon-Vercel integration.
