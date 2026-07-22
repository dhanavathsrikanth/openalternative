'use client'

import type { Product, Comparison } from '@/app/db/schema'
import { LicenseBadge } from '@/app/products/[slug]/LicenseBadge'
import { ConfidenceGauge } from '@/app/products/[slug]/ConfidenceGauge'
import { DeploymentMethods } from '@/app/products/[slug]/DeploymentMethods'
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

function scoreLabel(score: string | null): string {
  if (!score) return '—'
  const n = Math.round(parseFloat(score))
  if (n >= 80) return `${n} (High)`
  if (n >= 60) return `${n} (Good)`
  if (n >= 40) return `${n} (Moderate)`
  return `${n} (Low)`
}

function licenseCompare(a: string | null, b: string | null): string {
  if (a === b) return 'Same'
  if (!a) return 'B has license, A does not'
  if (!b) return 'A has license, B does not'
  return `${a} vs ${b}`
}

function buildFeatureMatrix(a: Product, b: Product): FeatureRow[] {
  return [
    { label: 'License', a: a.license, b: b.license },
    { label: 'Language', a: a.primaryLanguage, b: b.primaryLanguage },
    { label: 'Confidence Score', a: scoreLabel(a.confidenceScore), b: scoreLabel(b.confidenceScore) },
    { label: 'Deployment', a: a.deploymentMethods?.join(', ') ?? '—', b: b.deploymentMethods?.join(', ') ?? '—' },
    { label: 'License Comparison', a: licenseCompare(a.license, b.license), b: licenseCompare(b.license, a.license) },
  ]
}

export function ComparePage({ productA, productB, comparison }: Props) {
  const matrix = comparison
    ? (comparison.featureMatrix as FeatureRow[])
    : buildFeatureMatrix(productA, productB)

  const scoreA = productA.confidenceScore ? parseFloat(productA.confidenceScore) : null
  const scoreB = productB.confidenceScore ? parseFloat(productB.confidenceScore) : null

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Compare</span>
      </nav>

      {/* Header */}
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {productA.name} vs {productB.name}
        </h1>
        <p className="mt-2 text-muted-foreground">
          Side-by-side feature and migration confidence comparison
        </p>
      </header>

      {/* Product cards */}
      <section className="mb-10 grid gap-6 sm:grid-cols-2">
        {[productA, productB].map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="block rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent"
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
            {productA.name} — Confidence
          </h3>
          <ConfidenceGauge score={scoreA} />
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            {productB.name} — Confidence
          </h3>
          <ConfidenceGauge score={scoreB} />
        </div>
      </section>

      {/* Feature matrix table */}
      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold">Feature Comparison</h2>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Feature</th>
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
          Comparison generated{' '}
          <time dateTime={comparison.generatedAt.toISOString()}>
            {comparison.generatedAt.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </footer>
      )}
    </main>
  )
}
