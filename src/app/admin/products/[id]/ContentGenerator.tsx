'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Props = {
  productId: number
  onGenerated?: () => void
}

const CONTENT_TYPES = [
  { key: 'whoItsFor', label: 'Who It\'s For' },
  { key: 'problem', label: 'Problem' },
  { key: 'solution', label: 'Solution' },
  { key: 'strengths', label: 'Strengths' },
  { key: 'tradeoffs', label: 'Tradeoffs' },
  { key: 'tldr', label: 'TL;DR' },
  { key: 'installMethods', label: 'Install Methods' },
] as const

export function ContentGenerator({ productId, onGenerated }: Props) {
  const [generating, setGenerating] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleGenerate(contentType: string) {
    setGenerating(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/admin/products/${productId}/generate-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentType }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? `Request failed (${res.status})`)
      }

      const data = await res.json()
      const warningCount = Array.isArray(data.warnings) ? data.warnings.length : 0
      const msg = warningCount > 0
        ? `"${contentType}" generated — ${warningCount} grounding ${warningCount === 1 ? 'warning' : 'warnings'} (review flagged)`
        : `"${contentType}" generated.`

      setFeedback({ type: 'success', message: msg })
      onGenerated?.()
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {CONTENT_TYPES.map(({ key, label }) => (
          <Button
            key={key}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleGenerate(key)}
            disabled={generating}
          >
            {label}
          </Button>
        ))}
        <div className="w-px h-6 bg-border" />
        <Button
          type="button"
          onClick={() => handleGenerate('all')}
          disabled={generating}
        >
          {generating ? 'Generating…' : 'Generate All'}
        </Button>
      </div>
      {feedback && (
        <Badge variant={feedback.type === 'success' ? 'success' : 'destructive'}>
          {feedback.message}
        </Badge>
      )}
      <p className="text-xs text-muted-foreground">
        Generates AI content from the product&apos;s GitHub repo and saves each section as a draft for review.
        &quot;Generate All&quot; runs whoItsFor → problem → solution → tldr in order.
      </p>
    </div>
  )
}
