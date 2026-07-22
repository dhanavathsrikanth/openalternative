import { db } from '@/app/db'
import { Products, Comparisons } from '@/app/db/schema'
import { eq, and } from 'drizzle-orm'
import { redirect, notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ComparePage } from './ComparePage'

const REVALIDATE_SECONDS = 24 * 60 * 60 // 24h ISR

type PageProps = { params: Promise<{ slug: string }> }

function parseSlugs(raw: string): { slugA: string; slugB: string } | null {
  const match = raw.match(/^(.+)-vs-(.+)$/)
  if (!match) return null
  return { slugA: match[1], slugB: match[2] }
}

function canonicalSlug(a: string, b: string): string {
  return a < b ? `${a}-vs-${b}` : `${b}-vs-${a}`
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const parsed = parseSlugs(slug)
  if (!parsed) return { title: 'Not Found — Forklane' }

  const [rowA, rowB] = await Promise.all([
    db.select().from(Products).where(eq(Products.slug, parsed.slugA)).limit(1),
    db.select().from(Products).where(eq(Products.slug, parsed.slugB)).limit(1),
  ])

  if (rowA.length === 0 || rowB.length === 0) return { title: 'Not Found — Forklane' }

  return {
    title: `${rowA[0].name} vs ${rowB[0].name} — Forklane`,
    description: `Compare ${rowA[0].name} and ${rowB[0].name}: features, license, and migration confidence.`,
  }
}

export default async function CompareSlugPage({ params }: PageProps) {
  const { slug } = await params
  const parsed = parseSlugs(slug)
  if (!parsed) notFound()

  // Canonical redirect: always sort alphabetically so only one URL is indexed
  const canonical = canonicalSlug(parsed.slugA, parsed.slugB)
  if (slug !== canonical) {
    redirect(`/compare/${canonical}`)
  }

  const [rowA, rowB] = await Promise.all([
    db.select().from(Products).where(eq(Products.slug, parsed.slugA)).limit(1),
    db.select().from(Products).where(eq(Products.slug, parsed.slugB)).limit(1),
  ])

  if (rowA.length === 0 || rowB.length === 0) notFound()

  const productA = rowA[0]
  const productB = rowB[0]

  // Canonical ordering: smaller ID is always "A"
  const [a, b] = productA.id < productB.id
    ? [productA, productB]
    : [productB, productA]

  const compRows = await db
    .select()
    .from(Comparisons)
    .where(
      and(
        eq(Comparisons.productAId, a.id),
        eq(Comparisons.productBId, b.id),
      ),
    )
    .limit(1)

  const comparison = compRows[0] ?? null

  return (
    <ComparePage productA={a} productB={b} comparison={comparison} />
  )
}
