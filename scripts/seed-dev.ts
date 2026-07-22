/**
 * scripts/seed-dev.ts
 *
 * Batch-efficient seed: reads all raw_signals, normalizes in memory,
 * then does bulk inserts/updates. Creates categories and links.
 *
 * Usage: npx tsx scripts/seed-dev.ts
 */

import { db } from '../src/app/db'
import { RawSignals, Products, Categories, ProductCategories } from '../src/app/db/schema'
import { eq, sql } from 'drizzle-orm'
import { resolveCanonical } from '../src/lib/normalize/canonicalResolver'
import { computeConfidenceScore } from '../src/lib/scoring/confidenceScore'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const CATEGORY_META: Record<string, { name: string; description: string }> = {
  frameworks: { name: 'Frameworks', description: 'Web frameworks, UI frameworks, and application scaffolds' },
  databases: { name: 'Databases', description: 'Database drivers, ORMs, and data layer tools' },
  backend: { name: 'Backend', description: 'Backend libraries, utilities, and runtime tools' },
  'ui-libraries': { name: 'UI Libraries', description: 'Component libraries, design systems, and UI primitives' },
  testing: { name: 'Testing', description: 'Test runners, assertion libraries, and E2E tools' },
  devops: { name: 'DevOps', description: 'Build tools, bundlers, CI/CD, and developer infrastructure' },
  programming: { name: 'Programming', description: 'Formatters, linters, language tooling, and code quality' },
  monitoring: { name: 'Monitoring', description: 'Observability, logging, and tracing' },
}

const PRODUCT_CATEGORIES: Record<string, string> = {
  'next.js': 'frameworks', react: 'frameworks', vue: 'frameworks', svelte: 'frameworks',
  angular: 'frameworks', tailwindcss: 'frameworks', 'drizzle-orm': 'databases',
  prisma: 'databases', typeorm: 'databases', serverless: 'databases', supabase: 'databases',
  express: 'backend', fastify: 'backend', hono: 'backend', trpc: 'backend',
  'shadcn-ui': 'ui-libraries', primitives: 'ui-libraries', 'chakra-ui': 'ui-libraries',
  mantine: 'ui-libraries', ui: 'ui-libraries', vitest: 'testing', jest: 'testing',
  playwright: 'testing', cypress: 'testing', storybook: 'devops', eslint: 'programming',
  prettier: 'programming', vite: 'devops', turborepo: 'devops', unocss: 'programming',
  typescript: 'programming', zod: 'backend', '@trpc/server': 'backend',
  django: 'frameworks', fastapi: 'frameworks', flask: 'frameworks',
  sqlalchemy: 'databases', pydantic: 'backend', pytest: 'testing',
  ruff: 'programming', black: 'programming', httpx: 'backend', celery: 'backend',
  'actix-web': 'frameworks', axum: 'frameworks', tokio: 'backend', serde: 'backend',
  sqlx: 'databases', clap: 'programming', reqwest: 'backend', tracing: 'monitoring',
  thiserror: 'backend', anyhow: 'backend',
}

async function main() {
  console.log('=== Forklane Seed: Dev ===\n')

  // Step 1: Read all raw signals
  console.log('📡 Step 1: Reading raw signals...')
  const signals = await db.select().from(RawSignals).where(eq(RawSignals.processed, false))
  console.log(`  ${signals.length} unprocessed signals\n`)

  if (signals.length === 0) {
    console.log('  No signals to process. Done.')
    return
  }

  // Step 2: Normalize in memory (no DB calls)
  console.log('🔄 Step 2: Normalizing in memory...')
  const bySlug = new Map<string, { canonical: ReturnType<typeof resolveCanonical>; score: number; breakdown: unknown; signalId: number }>()

  for (const signal of signals) {
    try {
      const payload = signal.payload as Record<string, unknown>
      const canonical = resolveCanonical({
        source: signal.source,
        identifier: signal.repoIdentifier,
        payload,
      })
      const { score, breakdown } = computeConfidenceScore(payload)

      const existing = bySlug.get(canonical.slug)
      if (!existing || score > existing.score) {
        bySlug.set(canonical.slug, { canonical, score, breakdown, signalId: signal.id })
      }
    } catch {
      // skip bad signals
    }
  }

  console.log(`  ${bySlug.size} unique products resolved\n`)

  // Step 3: Read existing products to decide insert vs update
  console.log('📊 Step 3: Checking existing products...')
  const existingProducts = await db.select({ id: Products.id, slug: Products.slug, confidenceScore: Products.confidenceScore }).from(Products)
  const existingMap = new Map<string, { id: number; score: number }>()
  for (const p of existingProducts) {
    existingMap.set(p.slug, { id: p.id, score: p.confidenceScore ? parseFloat(p.confidenceScore) : 0 })
  }
  console.log(`  ${existingMap.size} existing products\n`)

  // Step 4: Bulk insert new products
  console.log('💾 Step 4: Writing products to database...')
  const toInsert: Array<Record<string, unknown>> = []
  const toUpdate: Array<{ id: number; data: Record<string, unknown> }> = []
  const signalIdsToMark: number[] = []

  for (const [slug, { canonical, score, breakdown, signalId }] of bySlug) {
    const hasDescription = canonical.description.length > 0
    const hasUrl = !!(canonical.githubUrl || canonical.homepageUrl)
    const publishable = hasDescription && hasUrl
    const existing = existingMap.get(slug)

    if (!existing) {
      toInsert.push({
        name: canonical.name,
        slug,
        description: canonical.description,
        license: canonical.license,
        primaryLanguage: canonical.primaryLanguage,
        deploymentMethods: canonical.deploymentMethods,
        githubUrl: canonical.githubUrl,
        homepageUrl: canonical.homepageUrl,
        confidenceScore: String(score),
        scoreBreakdown: breakdown,
        status: publishable ? 'published' : 'draft',
        lastVerifiedAt: new Date(),
      })
    } else if (score > existing.score) {
      toUpdate.push({
        id: existing.id,
        data: {
          name: canonical.name,
          description: canonical.description || undefined,
          license: canonical.license || undefined,
          primaryLanguage: canonical.primaryLanguage || undefined,
          deploymentMethods: canonical.deploymentMethods,
          githubUrl: canonical.githubUrl || undefined,
          homepageUrl: canonical.homepageUrl || undefined,
          confidenceScore: String(score),
          scoreBreakdown: breakdown,
          ...(publishable ? { status: 'published' } : {}),
          lastVerifiedAt: new Date(),
          updatedAt: new Date(),
        },
      })
    }

    signalIdsToMark.push(signalId)
  }

  // Batch insert new products (100 at a time)
  for (let i = 0; i < toInsert.length; i += 100) {
    const chunk = toInsert.slice(i, i + 100)
    await db.insert(Products).values(chunk as any)
  }
  console.log(`  Inserted: ${toInsert.length}`)

  // Batch update existing products (individual UPDATEs are unavoidable with Drizzle)
  for (const { id, data } of toUpdate) {
    await db.update(Products).set(data as any).where(eq(Products.id, id))
  }
  console.log(`  Updated: ${toUpdate.length}`)

  // Mark all signals as processed
  for (let i = 0; i < signalIdsToMark.length; i += 100) {
    const chunk = signalIdsToMark.slice(i, i + 100)
    for (const id of chunk) {
      await db.update(RawSignals).set({ processed: true }).where(eq(RawSignals.id, id))
    }
  }
  console.log(`  Signals marked processed: ${signalIdsToMark.length}\n`)

  // Step 5: Create categories
  console.log('📁 Step 5: Creating categories...')
  for (const [slug, meta] of Object.entries(CATEGORY_META)) {
    await db.insert(Categories).values({ name: meta.name, slug, description: meta.description }).onConflictDoNothing({ target: Categories.slug })
  }
  const catCount = await db.select({ count: sql<number>`count(*)::int` }).from(Categories)
  console.log(`  Categories: ${catCount[0].count}\n`)

  // Step 6: Link products to categories
  console.log('🔗 Step 6: Linking products to categories...')
  const allCats = await db.select().from(Categories)
  const catIdMap = new Map(allCats.map(c => [c.slug, c.id]))

  const allProds = await db.select({ id: Products.id, slug: Products.slug }).from(Products)
  const prodIdMap = new Map(allProds.map(p => [p.slug, p.id]))

  let links = 0
  for (const [prodSlug, catSlug] of Object.entries(PRODUCT_CATEGORIES)) {
    const pid = prodIdMap.get(prodSlug)
    const cid = catIdMap.get(catSlug)
    if (pid && cid) {
      await db.insert(ProductCategories).values({ productId: pid, categoryId: cid }).onConflictDoNothing()
      links++
    }
  }
  console.log(`  Links: ${links}\n`)

  // Summary
  console.log('📊 Summary')
  const published = await db.select({ count: sql<number>`count(*)::int` }).from(Products).where(eq(Products.status, 'published'))
  const draft = await db.select({ count: sql<number>`count(*)::int` }).from(Products).where(eq(Products.status, 'draft'))
  console.log(`  Products (published): ${published[0].count}`)
  console.log(`  Products (draft): ${draft[0].count}`)
  console.log(`  Categories: ${catCount[0].count}`)
  console.log(`  Links: ${links}`)
  console.log('\n✅ Done!')
}

main().catch((err) => { console.error('Fatal:', err); process.exit(1) })
