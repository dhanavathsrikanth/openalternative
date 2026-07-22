'use client'

import { useState } from 'react'
import type { Product } from '@/app/db/schema'

interface Props {
  product: Product
}

interface EditField {
  field: string
  value: string
}

export function SuggestEditForm({ product }: Props) {
  const [sourceUrl, setSourceUrl] = useState('')
  const [changes, setChanges] = useState<EditField[]>([
    { field: 'description', value: product.description },
    { field: 'license', value: product.license ?? '' },
    { field: 'homepageUrl', value: product.homepageUrl ?? '' },
  ])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function updateChange(index: number, updates: Partial<EditField>) {
    setChanges((prev) =>
      prev.map((c, i) => (i === index ? { ...c, ...updates } : c))
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          changes: changes.filter((c) => c.value !== ''),
          sourceUrl,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to submit')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Thank you!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your suggestion has been submitted for review. A moderator will review it shortly.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold">Suggest an Edit</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-3">
          {changes.map((change, i) => (
            <div key={change.field}>
              <label className="mb-1 block text-sm font-medium capitalize">
                {change.field}
              </label>
              {change.field === 'description' ? (
                <textarea
                  value={change.value}
                  onChange={(e) => updateChange(i, { value: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  rows={3}
                />
              ) : (
                <input
                  type="text"
                  value={change.value}
                  onChange={(e) => updateChange(i, { value: e.target.value })}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                />
              )}
            </div>
          ))}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Source URL <span className="text-destructive">*</span>
          </label>
          <input
            type="url"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder="https://github.com/..."
            required
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Link to evidence supporting your edit (GitHub issue, docs page, etc.)
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting || !sourceUrl}
          className="rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit Suggestion'}
        </button>
      </form>
    </div>
  )
}
