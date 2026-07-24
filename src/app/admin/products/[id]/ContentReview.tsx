'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CodeBlock } from '@/components/ui/code-block'
import type { ProductContent } from '@/app/db/schema'

type Props = {
  productId: number
  initialContent: ProductContent[]
}

type StrengthEntry = { title: string; signal: string }
type TradeoffEntry = { title: string; detail: string }
type PersonaEntry = { persona: string; useCase: string; skipIf: string }
type SolutionEntry = { title: string; description: string }
type InstallMethodEntry = {
  method: string
  label: string
  commands: string[]
  extracted: boolean
  needsTechnicalReview: boolean
  source: string
}

const CONTENT_LABELS: Record<string, string> = {
  whoItsFor: 'Who It\'s For',
  problem: 'Problem',
  solution: 'Solution',
  strengths: 'Strengths',
  tradeoffs: 'Tradeoffs',
  tldr: 'TL;DR',
}

const REVIEW_STATUS_STYLES: Record<string, string> = {
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
}

export function ContentReview({ productId, initialContent }: Props) {
  const [content, setContent] = useState(initialContent)
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/content`)
      if (res.ok) {
        const data = await res.json()
        setContent(data.content ?? [])
      }
    } finally {
      setRefreshing(false)
    }
  }

  function getContent(type: string): Record<string, unknown> | null {
    const row = content.find((c) => c.contentType === type)
    if (!row) return null
    return row.output as Record<string, unknown>
  }

  function getReviewStatus(type: string): string {
    const row = content.find((c) => c.contentType === type)
    return row?.reviewStatus ?? 'draft'
  }

  const strengths = getContent('strengths') as { strengths?: StrengthEntry[] } | null
  const tradeoffs = getContent('tradeoffs') as { tradeoffs?: TradeoffEntry[] } | null
  const personas = getContent('whoItsFor') as { personas?: PersonaEntry[] } | null
  const problem = getContent('problem') as { problem?: string } | null
  const solutions = getContent('solution') as { solutions?: SolutionEntry[] } | null
  const tldr = getContent('tldr') as { tldr?: string } | null
  const installData = getContent('installMethods') as { methods?: InstallMethodEntry[] } | null

  const hasAnyContent = !!(strengths || tradeoffs || personas || problem || solutions || tldr || installData)

  if (!hasAnyContent) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Generated Content</h2>
        <p className="text-sm text-muted-foreground">
          No content generated yet. Use the buttons above to generate content for this product.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Generated Content</h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </Button>
      </div>

      {/* ── Strengths / Tradeoffs two-column layout ─────────────────── */}
      {(strengths || tradeoffs) && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ContentColumn
            title="Strengths"
            status={getReviewStatus('strengths')}
            empty="No strengths generated."
          >
            {strengths?.strengths?.map((s, i) => (
              <EntryCard key={i} title={s.title} body={s.signal} />
            ))}
          </ContentColumn>

          <ContentColumn
            title="Tradeoffs"
            status={getReviewStatus('tradeoffs')}
            empty="No tradeoffs generated."
          >
            {tradeoffs?.tradeoffs?.map((t, i) => (
              <EntryCard key={i} title={t.title} body={t.detail} />
            ))}
          </ContentColumn>
        </div>
      )}

      {/* ── Who It's For ────────────────────────────────────────────── */}
      {personas?.personas && (
        <ContentSection title="Who It's For" status={getReviewStatus('whoItsFor')}>
          <div className="space-y-3">
            {personas.personas.map((p, i) => (
              <div key={i} className="rounded-md border p-3 space-y-1.5">
                <p className="text-sm font-medium">{p.persona}</p>
                <p className="text-sm text-muted-foreground">{p.useCase}</p>
                <p className="text-xs">
                  <span className="font-medium text-amber-700 dark:text-amber-300">Skip if: </span>
                  <span className="text-muted-foreground">{p.skipIf}</span>
                </p>
              </div>
            ))}
          </div>
        </ContentSection>
      )}

      {/* ── Problem ─────────────────────────────────────────────────── */}
      {problem?.problem && (
        <ContentSection title="Problem" status={getReviewStatus('problem')}>
          <p className="text-sm leading-relaxed">{problem.problem}</p>
        </ContentSection>
      )}

      {/* ── Solution ────────────────────────────────────────────────── */}
      {solutions?.solutions && (
        <ContentSection title="Solution" status={getReviewStatus('solution')}>
          <div className="space-y-3">
            {solutions.solutions.map((s, i) => (
              <EntryCard key={i} title={s.title} body={s.description} />
            ))}
          </div>
        </ContentSection>
      )}

      {/* ── TL;DR ───────────────────────────────────────────────────── */}
      {tldr?.tldr && (
        <ContentSection title="TL;DR" status={getReviewStatus('tldr')}>
          <p className="text-sm font-medium leading-relaxed">{tldr.tldr}</p>
        </ContentSection>
      )}

      {/* ── Install Methods ─────────────────────────────────────────── */}
      {installData?.methods && installData.methods.length > 0 && (
        <ContentSection title="Install Methods" status={getReviewStatus('installMethods')}>
          <div className="space-y-4">
            {installData.methods.map((m, i) => (
              <CodeBlock
                key={i}
                label={m.label}
                code={m.commands.join('\n')}
                language={m.method === 'docker' ? 'dockerfile' : 'bash'}
                extracted={m.extracted}
                needsReview={m.needsTechnicalReview}
              />
            ))}
            {installData.methods.some((m) => !m.extracted) && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Methods marked &quot;generated&quot; are LLM-drafted suggestions based on the detected
                language/framework and need technical review before publishing.
              </p>
            )}
          </div>
        </ContentSection>
      )}
    </section>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────

function ContentColumn({
  title,
  status,
  empty,
  children,
}: {
  title: string
  status: string
  empty: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ReviewStatusBadge status={status} />
      </div>
      <div className="space-y-2">
        {children ? children : <p className="text-xs text-muted-foreground">{empty}</p>}
      </div>
    </div>
  )
}

function ContentSection({
  title,
  status,
  children,
}: {
  title: string
  status: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3 rounded-md border p-4">
      <div className="flex items-center gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        <ReviewStatusBadge status={status} />
      </div>
      {children}
    </div>
  )
}

function EntryCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{body}</p>
    </div>
  )
}

function ReviewStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${REVIEW_STATUS_STYLES[status] ?? ''}`}>
      {status}
    </span>
  )
}
