import { db } from '@/app/db'
import { ProprietaryTools, ProductAlternatives, Products } from '@/app/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { AlternativesToPage } from './AlternativesToPage'

export const revalidate = 86400 // 24h ISR

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  try {
    const tools = await db
      .select({ slug: ProprietaryTools.slug })
      .from(ProprietaryTools)
      .innerJoin(ProductAlternatives, eq(ProprietaryTools.id, ProductAlternatives.proprietaryToolId))
      .innerJoin(Products, and(eq(ProductAlternatives.productId, Products.id), eq(Products.status, 'published')))

    const uniqueSlugs = [...new Set(tools.map((t) => t.slug))]
    return uniqueSlugs.map((slug) => ({ slug }))
  } catch {
    return []
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params

  try {
    const rows = await db
      .select()
      .from(ProprietaryTools)
      .where(eq(ProprietaryTools.slug, slug))
      .limit(1)

    if (rows.length === 0) return { title: 'Not Found — Forklane' }

    const tool = rows[0]
    const title = `Open Source Alternatives to ${tool.name} — Forklane`
    const description = `Discover the best open-source alternatives to ${tool.name}. Compare migration confidence, features, and community activity.`

    return {
      title,
      description,
      alternates: {
        canonical: `https://forklane.dev/alternatives-to/${slug}`,
      },
    }
  } catch {
    return { title: 'Not Found — Forklane' }
  }
}

export default async function AlternativesToSlugPage({ params }: PageProps) {
  const { slug } = await params

  let toolRows: typeof ProprietaryTools.$inferSelect[] = []
  try {
    toolRows = await db
      .select()
      .from(ProprietaryTools)
      .where(eq(ProprietaryTools.slug, slug))
      .limit(1)
  } catch {
    notFound()
  }

  if (toolRows.length === 0) notFound()

  const tool = toolRows[0]

  let products: {
    id: number
    name: string
    slug: string
    description: string
    license: string | null
    primaryLanguage: string | null
    stars: number | null
    forks: number | null
    githubUrl: string | null
  }[] = []
  try {
    products = await db
      .select({
        id: Products.id,
        name: Products.name,
        slug: Products.slug,
        description: Products.description,
        license: Products.license,
        primaryLanguage: Products.primaryLanguage,
        stars: Products.stars,
        forks: Products.forks,
        githubUrl: Products.githubUrl,
      })
      .from(Products)
      .innerJoin(ProductAlternatives, eq(Products.id, ProductAlternatives.productId))
      .where(
        and(
          eq(ProductAlternatives.proprietaryToolId, tool.id),
          eq(Products.status, 'published'),
        ),
      )
      .orderBy(sql`COALESCE(${Products.confidenceScore}::numeric, 0) DESC`)
  } catch {
    // ProductAlternatives table may not exist yet
  }

  return (
    <AlternativesToPage
      tool={tool}
      products={products}
    />
  )
}
