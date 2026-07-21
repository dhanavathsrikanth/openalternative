# Forklane Architecture

Open-source software discovery platform built with Next.js, Neon Postgres, and Clerk.

## Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Framework** | Next.js 14 (App Router) | React SSR/SSG, API routes, file-based routing |
| **Language** | TypeScript | Type safety across the entire codebase |
| **Styling** | Tailwind CSS + shadcn/ui | Utility-first CSS with pre-built components |
| **Database** | Neon Postgres | Serverless Postgres with branching |
| **ORM** | Drizzle ORM | Type-safe SQL queries and migrations |
| **Auth** | Clerk | User management (present but unused in V0-V2) |
| **Testing** | Vitest | Unit and integration tests |
| **Linting** | ESLint + Prettier | Code quality and formatting |

## Database Branching

Neon provides database branching that mirrors git workflows:

- **`production`** (default) — Live production data
- **`dev`** — Shared development branch
- **`feature/*`** — Short-lived branches for each feature, deleted after merge

### Branch Workflow

```bash
# Create a feature branch
neon checkout feature/my-feature

# Work on the feature (DATABASE_URL auto-updates)

# Merge and cleanup
neon checkout dev
neon branch delete feature/my-feature
```

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
│   │   ├── voted/             # Voting page
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
- **elements** — Periodic table data (seed data)
- **element_votes** — User votes on elements

### Environment Variables

Required environment variables (see `.env.example`):

- `DATABASE_URL` — Neon Postgres connection string
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
npm run seed

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
