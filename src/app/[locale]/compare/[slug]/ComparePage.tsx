'use client'

import type { Product, Comparison } from '@/app/db/schema'
import { useTranslations } from 'next-intl'
import { LicenseBadge } from '@/components/product/LicenseBadge'
import { ConfidenceGauge } from '@/components/product/ConfidenceGauge'
import { DeploymentMethods } from '@/components/product/DeploymentMethods'
import { ComparisonQA } from './ComparisonQA'
import Link from 'next/link'

interface FeatureRow {
  label: string
  a: string | number | null
  b: string | number | null
}

interface Props {
  productA: Product
  productB: Product
  comparison: Comparison | null
}

function buildFeatureMatrix(
  a: Product,
  b: Product,
  tCompare: (key: string) => string,
): FeatureRow[] {
  return [
    { label: 'License', a: a.license, b: b.license },
    { label: 'Language', a: a.primaryLanguage, b: b.primaryLanguage },
    { label: 'Confidence Score', a: a.confidenceScore ?? '—', b: b.confidenceScore ?? '—' },
    { label: 'Deployment', a: a.deploymentMethods?.join(', ') ?? '—', b: b.deploymentMethods?.join(', ') ?? '—' },
  ]
}

export function ComparePage({ productA, productB, comparison }: Props) {
  const tCommon = useTranslations('Common')
  const tCompare = useTranslations('Compare')

  const matrix = comparison
    ? (comparison.featureMatrix as FeatureRow[])
    : buildFeatureMatrix(productA, productB, (key: string) => tCompare(key as never))

  const scoreA = productA.confidenceScore ? parseFloat(productA.confidenceScore) : null
  const scoreB = productB.confidenceScore ? parseFloat(productB.confidenceScore) : null

  return (
    <main className="mx-auto max-w-[68rem] px-6 lg:px-8 py-12 pt-[var(--header-height)]">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">{tCommon('brand')}</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{tCompare('breadcrumb')}</span>
      </nav>

      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {productA.name} vs {productB.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {tCompare('subtitle')}
        </p>
      </header>

      {/* Product cards */}
      <section className="mb-10 grid gap-6 sm:grid-cols-2">
        {[productA, productB].map((p) => (
          <Link
            key={p.id}
             href={`/product/${p.slug}`}
            className="block rounded-xl border bg-card p-6 shadow-sm transition-colors duration-fast ease-out hover:bg-accent card-lift"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h2 className="text-xl font-semibold">{p.name}</h2>
              {p.license && <LicenseBadge license={p.license} />}
            </div>
            <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">
              {p.description}
            </p>
            <DeploymentMethods methods={p.deploymentMethods} />
          </Link>
        ))}
      </section>

      {/* Confidence comparison */}
      <section className="mb-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {productA.name} — {tCompare('table.confidence')}
          </h3>
          <ConfidenceGauge score={scoreA} />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {productB.name} — {tCompare('table.confidence')}
          </h3>
          <ConfidenceGauge score={scoreB} />
        </div>
      </section>

      {/* Feature matrix table */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">{tCompare('section.heading')}</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">{tCompare('table.feature')}</th>
                <th className="px-4 py-3 text-left font-medium">{productA.name}</th>
                <th className="px-4 py-3 text-left font-medium">{productB.name}</th>
              </tr>
            </thead>
            <tbody>
              {matrix.map((row, i) => (
                <tr key={row.label} className={i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}>
                  <td className="px-4 py-3 font-medium">{row.label}</td>
                  <td className="px-4 py-3">{row.a ?? '—'}</td>
                  <td className="px-4 py-3">{row.b ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Q&A Block */}
      <section className="mb-10">
        <ComparisonQA data={{ productA, productB }} />
      </section>

      {/* Footer */}
      {comparison && (
        <footer className="border-t pt-6 text-xs text-muted-foreground">
          {tCompare('footer.generated', {
            date: comparison.generatedAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          })}{' '}
          <time dateTime={comparison.generatedAt.toISOString()} className="sr-only">
            {comparison.generatedAt.toISOString()}
          </time>
        </footer>
      )}
    </main>
  )
}
