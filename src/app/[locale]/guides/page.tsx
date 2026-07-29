import { db } from '@/app/db'
import { Guides } from '@/app/db/schema'
import { eq, desc } from 'drizzle-orm'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'

export const revalidate = 86400 // 24h ISR

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Guides')
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/guides' },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'website',
    },
  }
}

export default async function GuidesIndexPage() {
  const tCommon = await getTranslations('Common')
  const tGuides = await getTranslations('Guides')

  const guides = await db
    .select({
      id: Guides.id,
      title: Guides.title,
      slug: Guides.slug,
      description: Guides.description,
      authorName: Guides.authorName,
      coverImageUrl: Guides.coverImageUrl,
      publishedAt: Guides.publishedAt,
    })
    .from(Guides)
    .where(eq(Guides.status, 'published'))
    .orderBy(desc(Guides.publishedAt))

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{tGuides('breadcrumb')}</span>
      </nav>

      <h1 className="mb-8 text-3xl font-bold tracking-tight">{tGuides('heading')}</h1>

      {guides.length === 0 ? (
        <p className="text-muted-foreground">{tGuides('empty')}</p>
      ) : (
        <ul className="space-y-4">
          {guides.map((g) => (
            <li key={g.id}>
              <Link
                href={`/guides/${g.slug}`}
                className="block rounded-xl border bg-card p-6 shadow-sm transition-colors duration-fast ease-out hover:bg-accent card-lift"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold">{g.title}</h2>
                    {g.description && (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {g.description}
                      </p>
                    )}
                  </div>
                  {g.coverImageUrl && (
                    <Image
                      src={g.coverImageUrl}
                      alt=""
                      width={64}
                      height={64}
                      unoptimized
                      className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                  )}
                </div>
                <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{g.authorName}</span>
                  {g.publishedAt && (
                    <>
                      <span>·</span>
                      <time dateTime={g.publishedAt.toISOString()}>
                        {g.publishedAt.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                    </>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
