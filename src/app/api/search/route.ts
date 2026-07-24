import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/app/db'
import { Products } from '@/app/db/schema'
import { sql, eq, and, SQL } from 'drizzle-orm'

export const revalidate = 0

interface SearchParams {
  q: string
  license?: string
  language?: string
  deployment?: string
  limit?: string
  offset?: string
}

function parseSearchParams(req: NextRequest): SearchParams {
  const url = new URL(req.url)
  return {
    q: url.searchParams.get('q') ?? '',
    license: url.searchParams.get('license') ?? undefined,
    language: url.searchParams.get('language') ?? undefined,
    deployment: url.searchParams.get('deployment') ?? undefined,
    limit: url.searchParams.get('limit') ?? '20',
    offset: url.searchParams.get('offset') ?? '0',
  }
}

const searchVector = sql.raw('products.search_vector')

export async function GET(req: NextRequest) {
  const params = parseSearchParams(req)
  const limit = Math.min(parseInt(params.limit ?? '20', 10) || 20, 50)
  const offset = parseInt(params.offset ?? '0', 10) || 0

  const conditions: SQL[] = []
  conditions.push(eq(Products.status, 'published'))

  if (params.q.trim()) {
    const tsQuery = sql`plainto_tsquery('english', ${params.q.trim()})`
    conditions.push(sql`${searchVector} @@ ${tsQuery}`)
  }

  if (params.license) {
    conditions.push(eq(Products.license, params.license))
  }

  if (params.language) {
    conditions.push(eq(Products.primaryLanguage, params.language))
  }

  if (params.deployment) {
    conditions.push(sql`${params.deployment} = ANY(${Products.deploymentMethods})`)
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined

  const orderByClause = params.q.trim()
    ? sql`ts_rank(${searchVector}, plainto_tsquery('english', ${params.q.trim()})) DESC`
    : sql`COALESCE(${Products.confidenceScore}::numeric, 0) DESC`

  const results = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      deploymentMethods: Products.deploymentMethods,
      stars: Products.stars,
      forks: Products.forks,
      githubUrl: Products.githubUrl,
      homepageUrl: Products.homepageUrl,
      rank: params.q.trim()
        ? sql<number>`ts_rank(${searchVector}, plainto_tsquery('english', ${params.q.trim()}))`
        : sql<number>`0`,
    })
    .from(Products)
    .where(whereClause)
    .orderBy(orderByClause)
    .limit(limit)
    .offset(offset)

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(Products)
    .where(whereClause)

  return NextResponse.json({
    results,
    total: count,
    limit,
    offset,
  })
}
