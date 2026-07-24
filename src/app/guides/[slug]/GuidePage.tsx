'use client'

import Link from 'next/link'
import Image from 'next/image'
import type { Guide } from '@/app/db/schema'

type GuidePageProps = {
  guide: Guide
  children: React.ReactNode
}

export function GuidePage({ guide, children }: GuidePageProps) {
  return (
    <main className="mx-auto max-w-3xl px-6 lg:px-8 py-12">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <Link href="/guides" className="hover:text-foreground">Guides</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{guide.title}</span>
      </nav>

      <article>
        <header className="mb-10">
          {guide.coverImageUrl && (
            <Image
              src={guide.coverImageUrl}
              alt=""
              width={768}
              height={256}
              unoptimized
              className="mb-6 h-64 w-full rounded-xl object-cover"
            />
          )}
          <h1 className="text-4xl font-bold tracking-tight">{guide.title}</h1>
          {guide.description && (
            <p className="mt-3 text-lg text-muted-foreground">{guide.description}</p>
          )}
          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            {guide.publishedAt && (
              <time dateTime={guide.publishedAt.toISOString()}>
                {guide.publishedAt.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            )}
          </div>
        </header>

        <div className="prose prose-neutral dark:prose-invert max-w-none">
          {children}
        </div>
      </article>

      {(guide.authorName || guide.authorBio) && (
        <footer className="mt-12 rounded-xl border bg-card p-6">
          <div className="flex items-start gap-4">
            {guide.authorAvatarUrl && (
              <Image
                src={guide.authorAvatarUrl}
                alt={guide.authorName}
                width={48}
                height={48}
                unoptimized
                className="h-12 w-12 shrink-0 rounded-full object-cover"
              />
            )}
            <div>
              <p className="font-semibold">{guide.authorName}</p>
              {guide.authorBio && (
                <p className="mt-1 text-sm text-muted-foreground">{guide.authorBio}</p>
              )}
            </div>
          </div>
        </footer>
      )}
    </main>
  )
}
