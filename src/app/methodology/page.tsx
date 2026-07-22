import { Metadata } from 'next'
import fs from 'fs/promises'
import path from 'path'
import { marked } from 'marked'

export const metadata: Metadata = {
  title: 'Methodology – Migration Confidence Score',
  description: 'How Forklane calculates migration confidence scores for open-source projects.',
  alternates: { canonical: '/methodology' },
  openGraph: {
    title: 'Methodology – Migration Confidence Score',
    description: 'How Forklane calculates migration confidence scores for open-source projects.',
    type: 'article',
  },
}

async function getMethodologyContent(): Promise<string> {
  const mdPath = path.join(process.cwd(), 'docs', 'scoring-methodology.md')
  const raw = await fs.readFile(mdPath, 'utf8')
  return marked.parse(raw) as string
}

export default async function MethodologyPage() {
  const html = await getMethodologyContent()

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight">Methodology</h1>
        <p className="mt-3 text-lg text-muted-foreground">
          How Forklane calculates migration confidence scores for open-source projects.
        </p>
      </header>

      <article
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <footer className="mt-12 border-t pt-6 text-sm text-muted-foreground">
        <p>
          <a href="/docs/scoring-methodology.md" className="underline hover:text-foreground">
            View raw Markdown
          </a>
        </p>
      </footer>
    </main>
  )
}
