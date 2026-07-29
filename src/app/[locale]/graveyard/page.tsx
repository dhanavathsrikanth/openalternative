import { db } from '@/app/db'
import { Products, ProductAssets } from '@/app/db/schema'
import { eq, desc, and, inArray } from 'drizzle-orm'
import type { Metadata } from 'next'
import { GraveyardPage } from './GraveyardPage'

export const revalidate = 86400 // 24h ISR

export const metadata: Metadata = {
  title: 'The Graveyard — Forklane',
  description: 'A historical archive of delisted open-source alternatives. These projects are preserved for reference but are no longer actively maintained or listed.',
}

export default async function GraveyardRoute() {
  const products = await db
    .select({
      id: Products.id,
      name: Products.name,
      slug: Products.slug,
      description: Products.description,
      tagline: Products.tagline,
      license: Products.license,
      primaryLanguage: Products.primaryLanguage,
      stars: Products.stars,
      forks: Products.forks,
      githubUrl: Products.githubUrl,
      homepageUrl: Products.homepageUrl,
      delistReason: Products.delistReason,
      delistedAt: Products.delistedAt,
      updatedAt: Products.updatedAt,
    })
    .from(Products)
    .where(eq(Products.status, 'delisted'))
    .orderBy(desc(Products.delistedAt))

  const productIds = products.map((p) => p.id)

  const logoRows = productIds.length > 0
    ? await db
        .select({ productId: ProductAssets.productId, url: ProductAssets.url })
        .from(ProductAssets)
        .where(
          and(
            inArray(ProductAssets.productId, productIds),
            eq(ProductAssets.type, 'logo'),
          ),
        )
    : []

  const logoByUrl = new Map(logoRows.map((r) => [r.productId, r.url]))

  const productsWithLogos = products.map((p) => ({
    ...p,
    logoUrl: logoByUrl.get(p.id) ?? null,
  }))

  return <GraveyardPage products={productsWithLogos} />
}
