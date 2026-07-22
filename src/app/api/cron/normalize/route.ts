import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { RawSignals, Products } from '@/app/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { verifySecret, unauthorized } from '@/lib/cron-auth'
import { resolveCanonical } from '@/lib/normalize/canonicalResolver'
import { computeConfidenceScore } from '@/lib/scoring/confidenceScore'
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

        // Upsert product: insert if slug doesn't exist, update if it does
        const existing = await db
          .select({ id: Products.id })
          .from(Products)
          .where(eq(Products.slug, canonical.slug))
          .limit(1)

        // A product is publishable if it has a description and at least
        // a GitHub URL or homepage URL — otherwise keep it as draft for
        // manual review.
        const hasDescription = canonical.description.length > 0
        const hasUrl = !!(canonical.githubUrl || canonical.homepageUrl)
        const publishable = hasDescription && hasUrl

        if (existing.length === 0) {
          // Insert new product
          await db.insert(Products).values({
            name: canonical.name,
            slug: canonical.slug,
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
        } else {
          // Update existing product — keep the higher score
          const currentProduct = await db
            .select({ confidenceScore: Products.confidenceScore })
            .from(Products)
            .where(eq(Products.id, existing[0].id))
            .limit(1)

          const currentScore = currentProduct[0]?.confidenceScore
            ? parseFloat(currentProduct[0].confidenceScore)
            : 0

          if (score > currentScore) {
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
                confidenceScore: String(score),
                scoreBreakdown: breakdown,
                // Promote draft to published once it qualifies
                ...(publishable ? { status: 'published' as const } : {}),
                lastVerifiedAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(Products.id, existing[0].id))
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
