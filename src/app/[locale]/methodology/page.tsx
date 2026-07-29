import { Metadata } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { marked } from 'marked'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('Methodology')
  return {
    title: t('title'),
    description: t('description'),
    alternates: { canonical: '/methodology' },
    openGraph: {
      title: t('title'),
      description: t('description'),
      type: 'article',
    },
  }
}

async function getMethodologyContent(): Promise<string> {
  const mdPath = path.join(process.cwd(), 'docs', 'scoring-methodology.md')
  const raw = await fs.readFile(mdPath, 'utf8')
  return marked.parse(raw) as string
}

export default async function MethodologyPage() {
  const t = await getTranslations('Methodology')
  const html = await getMethodologyContent()

  return (
    <main className="mx-auto max-w-3xl px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">{t('heading')}</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          {t('description')}
        </p>
      </header>

      <article
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <p>
          <a href="/docs/scoring-methodology.md" className="underline hover:text-foreground">
            {t('viewRaw')}
          </a>
        </p>
      </footer>
    </main>
  )
}
