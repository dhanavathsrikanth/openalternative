import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { RawSignals, Products, ProductCategories, ProductTags, ProductAssets } from '@/app/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { verifySecret, unauthorized } from '@/lib/cron-auth'
import { logAudit } from '@/lib/audit'
import { resolveCanonical } from '@/lib/normalize/canonicalResolver'
import { computeConfidenceScore } from '@/lib/scoring/confidenceScore'
import { validatePublishable } from '@/lib/validation/product'
import { checkScope } from '@/lib/validation/submission'
import { detectTechFromGithub } from '@/lib/content-gen/tech-detect'
import * as Sentry from '@sentry/nextjs'

const BATCH_SIZE = 50
const STALE_THRESHOLD_MS = 36 * 60 * 60 * 1000 // 36 hours

/**
 * POST /api/cron/normalize
 *
 * Reads unprocessed raw_signals, computes derived fields, upserts into
 * products inside a transaction, and marks source rows as processed.
 *
 * Protected by CRON_SECRET via Bearer token.
 */
export async function GET(req: NextRequest) {
  if (!verifySecret(req)) return unauthorized()

  // Count unprocessed signals before we start
  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(RawSignals)
    .where(eq(RawSignals.processed, false))

  const pendingBefore = pendingRow?.count ?? 0

  // Check staleness: is the oldest unprocessed signal older than 36 hours?
  if (pendingBefore > 0) {
    const [oldest] = await db
      .select({ fetchedAt: RawSignals.fetchedAt })
      .from(RawSignals)
      .where(eq(RawSignals.processed, false))
      .orderBy(RawSignals.fetchedAt)
      .limit(1)

    if (oldest?.fetchedAt) {
      const age = Date.now() - oldest.fetchedAt.getTime()
      if (age > STALE_THRESHOLD_MS) {
        Sentry.captureMessage(
          `[normalize] Stale queue: oldest unprocessed signal is ${Math.round(age / 3600000)}h old (${pendingBefore} pending)`,
          'warning',
        )
      }
    }
  }

  let normalized = 0
  let skipped = 0
  let errors: string[] = []

  // Process in batches to avoid overwhelming the connection
  while (true) {
    const batch = await db
      .select()
      .from(RawSignals)
      .where(eq(RawSignals.processed, false))
      .limit(BATCH_SIZE)

    if (batch.length === 0) break

    for (const signal of batch) {
      try {
        const payload = signal.payload as Record<string, unknown>
        const canonical = resolveCanonical({
          source: signal.source,
          identifier: signal.repoIdentifier,
          payload,
        })

        const { score, breakdown } = computeConfidenceScore(payload)
        const stars = (payload.stars as number) || null
        const forks = (payload.forks as number) || null
        const openIssues = (payload.openIssues as number) || null
        const watchers = (payload.watchers as number) || null
        const topics = (payload.topics as string[]) || null
        const repoSize = (payload.size as number) || null
        const isArchived = (payload.archived as boolean) || false
        const isFork = (payload.fork as boolean) || false
        const lastPushedAt = payload.pushedAt ? new Date(payload.pushedAt as string) : null
        const defaultBranch = (payload.defaultBranch as string) || null
        const contributorsCount = (payload.contributorsCount as number) || null
        const latestRelease = payload.latestRelease as { tag: string; publishedAt: string } | null
        const latestVersion = latestRelease?.tag ?? null
        const firstReleaseYear = payload.createdAt
          ? new Date(payload.createdAt as string).getFullYear()
          : null

        // Detect tech stack from GitHub manifests (best-effort, non-blocking)
        let techStackDetected: unknown = null
        if (canonical.githubUrl) {
          try {
            techStackDetected = await detectTechFromGithub(
              canonical.githubUrl,
              canonical.primaryLanguage,
              defaultBranch ?? undefined,
            )
          } catch {
            // Detection failure must not block normalization
          }
        }

        // Upsert product: insert if slug doesn't exist, update if it does
        const existing = await db
          .select({ id: Products.id })
          .from(Products)
          .where(eq(Products.slug, canonical.slug))
          .limit(1)

        // A product is publishable only if it passes the shared validation
        // (name, slug, tagline, description, logo, at least one category & tag).
        // Drafts can be messy — publish is gated until all fields are present.
        const [catCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(ProductCategories)
          .where(eq(ProductCategories.productId, existing.length > 0 ? existing[0].id : -1))
        const [tagCount] = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(ProductTags)
          .where(eq(ProductTags.productId, existing.length > 0 ? existing[0].id : -1))
        const [logoRow] = await db
          .select({ url: ProductAssets.url })
          .from(ProductAssets)
          .where(eq(ProductAssets.productId, existing.length > 0 ? existing[0].id : -1))
          .limit(1)

        const publishable = validatePublishable({
          name: canonical.name,
          slug: canonical.slug,
          tagline: null,
          description: canonical.description,
          logoUrl: logoRow?.url ?? null,
          categoryCount: catCount?.count ?? 0,
          tagCount: tagCount?.count ?? 0,
        }) === true

        if (existing.length === 0) {
          // Insert new product
          const scopeCheck = checkScope(canonical.name, canonical.description, techStackDetected)
          await db.insert(Products).values({
            name: canonical.name,
            slug: canonical.slug,
            description: canonical.description,
            license: canonical.license,
            primaryLanguage: canonical.primaryLanguage,
            deploymentMethods: canonical.deploymentMethods,
            githubUrl: canonical.githubUrl,
            homepageUrl: canonical.homepageUrl,
            stars,
            forks,
            openIssues,
            watchers,
            topics,
            repoSize,
            contributorsCount,
            firstReleaseYear,
            latestVersion,
            isArchived,
            isFork,
            lastPushedAt,
            defaultBranch,
            confidenceScore: String(score),
            scoreBreakdown: breakdown,
            techStackDetected,
            status: publishable ? 'published' : 'draft',
            reviewFlags: scopeCheck.flagged ? scopeCheck.reasons : null,
            lastVerifiedAt: new Date(),
          })
          if (publishable) {
            await logAudit('system', 'product.published', 'product', canonical.slug, null, { slug: canonical.slug, name: canonical.name })
          }
        } else {
          // Update existing product — keep the higher score
          const currentProduct = await db
            .select({ confidenceScore: Products.confidenceScore, status: Products.status })
            .from(Products)
            .where(eq(Products.id, existing[0].id))
            .limit(1)

          const currentScore = currentProduct[0]?.confidenceScore
            ? parseFloat(currentProduct[0].confidenceScore)
            : 0

          // Only auto-promote products that are currently in 'draft' status
          const canAutoPromote = publishable && currentProduct[0]?.status === 'draft'

          if (score > currentScore) {
            const scopeCheck = checkScope(canonical.name, canonical.description, techStackDetected)
            await db
              .update(Products)
              .set({
                name: canonical.name,
                description: canonical.description || undefined,
                license: canonical.license || undefined,
                primaryLanguage: canonical.primaryLanguage || undefined,
                deploymentMethods: canonical.deploymentMethods,
                githubUrl: canonical.githubUrl || undefined,
                homepageUrl: canonical.homepageUrl || undefined,
                stars,
                forks,
                openIssues,
                watchers,
                topics,
                repoSize,
                contributorsCount,
                firstReleaseYear,
                latestVersion,
                isArchived,
                isFork,
                lastPushedAt,
                defaultBranch,
                confidenceScore: String(score),
                scoreBreakdown: breakdown,
                techStackDetected,
                // Only promote draft → published; never override rejected/delisted/pending_review/scheduled
                ...(canAutoPromote ? { status: 'published' as const } : {}),
                reviewFlags: scopeCheck.flagged ? scopeCheck.reasons : null,
                lastVerifiedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(Products.id, existing[0].id))
            if (canAutoPromote) {
              await logAudit('system', 'product.published', 'product', canonical.slug, null, { slug: canonical.slug })
            }
          }
        }

        // Mark signal as processed (only after successful upsert)
        await db
          .update(RawSignals)
          .set({ processed: true })
          .where(eq(RawSignals.id, signal.id))

        normalized++
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[normalize] Error processing signal ${signal.id}:`, msg)
        errors.push(`signal ${signal.id}: ${msg}`)
        skipped++
      }
    }
  }

  // Alert if normalize ran but processed nothing while signals were waiting
  if (normalized === 0 && pendingBefore > 0) {
    Sentry.captureMessage(
      `[normalize] Processed 0 signals but ${pendingBefore} were pending before this run`,
      'warning',
    )
  }

  return NextResponse.json({
    normalized,
    skipped,
    errors,
  })
}
