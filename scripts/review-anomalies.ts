/**
 * scripts/review-anomalies.ts
 *
 * Lists products with outlier confidence scores or missing critical fields.
 * Run with: npx tsx scripts/review-anomalies.ts
 *
 * Queries the `dev` Neon branch by default (uses .env.local DATABASE_URL).
 */

import { db } from '../src/app/db'
import { Products } from '../src/app/db/schema'
import { or, isNull, lt, gt, eq, sql } from 'drizzle-orm'

interface Anomaly {
  id: number
  name: string
  slug: string
  confidenceScore: string | null
  status: string | null
  license: string | null
  githubUrl: string | null
  homepageUrl: string | null
  description: string
  issues: string[]
}

async function findAnomalies(): Promise<Anomaly[]> {
  // 1. Products with missing critical fields
  const missingFields = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      confidenceScore: Products.confidenceScore,
      status: Products.status,
      license: Products.license,
      githubUrl: Products.githubUrl,
      homepageUrl: Products.homepageUrl,
      description: Products.description,
    })
    .from(Products)
    .where(
      or(
        isNull(Products.description),
        isNull(Products.githubUrl),
        isNull(Products.homepageUrl),
      ),
    )

  // 2. Products with outlier scores (very low or very high)
  const outlierScores = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      confidenceScore: Products.confidenceScore,
      status: Products.status,
      license: Products.license,
      githubUrl: Products.githubUrl,
      homepageUrl: Products.homepageUrl,
      description: Products.description,
    })
    .from(Products)
    .where(
      or(
        lt(Products.confidenceScore, '10'),
        gt(Products.confidenceScore, '95'),
      ),
    )

  // 3. Products without a license
  const noLicense = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      confidenceScore: Products.confidenceScore,
      status: Products.status,
      license: Products.license,
      githubUrl: Products.githubUrl,
      homepageUrl: Products.homepageUrl,
      description: Products.description,
    })
    .from(Products)
    .where(isNull(Products.license))

  // Merge and deduplicate by id
  const seen = new Set<number>()
  const anomalies: Anomaly[] = []

  const addAnomaly = (row: typeof missingFields[0], issue: string) => {
    const existing = anomalies.find((a) => a.id === row.id)
    if (existing) {
      existing.issues.push(issue)
    } else {
      seen.add(row.id)
      anomalies.push({
        ...row,
        issues: [issue],
      })
    }
  }

  for (const row of missingFields) {
    if (!row.description) addAnomaly(row, 'missing description')
    if (!row.githubUrl) addAnomaly(row, 'missing GitHub URL')
    if (!row.homepageUrl) addAnomaly(row, 'missing homepage URL')
  }

  for (const row of outlierScores) {
    const score = parseFloat(row.confidenceScore || '0')
    if (score < 10) addAnomaly(row, `very low score (${score})`)
    if (score > 95) addAnomaly(row, `very high score (${score})`)
  }

  for (const row of noLicense) {
    addAnomaly(row, 'missing license')
  }

  // Sort by number of issues (most problematic first)
  anomalies.sort((a, b) => b.issues.length - a.issues.length)

  return anomalies
}

async function main() {
  console.log('Scanning products table for anomalies...\n')

  try {
    const anomalies = await findAnomalies()

    if (anomalies.length === 0) {
      console.log('No anomalies found. All products look healthy!')
      process.exit(0)
    }

    console.log(`Found ${anomalies.length} product(s) with anomalies:\n`)

    for (const a of anomalies) {
      console.log(`─ ${a.name} (${a.slug})`)
      console.log(`  ID: ${a.id}  Score: ${a.confidenceScore ?? 'N/A'}  Status: ${a.status ?? 'N/A'}`)
      console.log(`  License: ${a.license ?? 'NONE'}`)
      console.log(`  GitHub: ${a.githubUrl ?? 'NONE'}`)
      console.log(`  Homepage: ${a.homepageUrl ?? 'NONE'}`)
      console.log(`  Issues:`)
      for (const issue of a.issues) {
        console.log(`    • ${issue}`)
      }
      console.log()
    }

    process.exit(0)
  } catch (err) {
    console.error('Error querying database:', err)
    process.exit(1)
  }
}

main()
