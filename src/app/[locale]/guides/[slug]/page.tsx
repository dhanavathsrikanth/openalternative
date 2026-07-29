import { db } from '@/app/db'
import { Guides } from '@/app/db/schema'
import { eq } from 'drizzle-orm'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { MDXRemote } from 'next-mdx-remote/rsc'
import { GuidePage } from './GuidePage'

export const revalidate = 86400 // 24h ISR

type PageProps = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const guides = await db
    .select({ slug: Guides.slug })
    .from(Guides)
    .where(eq(Guides.status, 'published'))
  return guides.map((g) => ({ slug: g.slug }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const rows = await db
    .select()
    .from(Guides)
    .where(eq(Guides.slug, slug))
    .limit(1)

  if (rows.length === 0) return { title: 'Not Found — Forklane' }

  const guide = rows[0]
  return {
    title: `${guide.title} — Forklane`,
    description: guide.description ?? `Read ${guide.title} on Forklane`,
    openGraph: {
      title: guide.title,
      description: guide.description ?? undefined,
      type: 'article',
      publishedTime: guide.publishedAt?.toISOString(),
      images: guide.coverImageUrl ? [guide.coverImageUrl] : [],
    },
  }
}

export default async function GuideSlugPage({ params }: PageProps) {
  const { slug } = await params

  const rows = await db
    .select()
    .from(Guides)
    .where(eq(Guides.slug, slug))
    .limit(1)

  if (rows.length === 0) notFound()

  const guide = rows[0]

  return (
    <GuidePage guide={guide}>
      {guide.body ? <MDXRemote source={guide.body} /> : null}
    </GuidePage>
  )
}
