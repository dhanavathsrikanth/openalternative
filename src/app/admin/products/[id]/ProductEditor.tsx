'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

type Props = {
  productId: number
  initialStatus: string
  initialSeoTitle: string | null
  initialSeoDescription: string | null
  initialSeoCanonicalUrl: string | null
  initialUsableToday: boolean | null
  initialReviewFlags: string[] | null
}

export function ProductEditor({
  productId,
  initialStatus,
  initialSeoTitle,
  initialSeoDescription,
  initialSeoCanonicalUrl,
  initialUsableToday,
  initialReviewFlags,
}: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [seoTitle, setSeoTitle] = useState(initialSeoTitle ?? '')
  const [seoDescription, setSeoDescription] = useState(initialSeoDescription ?? '')
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState(initialSeoCanonicalUrl ?? '')
  const [usableToday, setUsableToday] = useState(initialUsableToday)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, seoTitle, seoDescription, seoCanonicalUrl, usableToday }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        if (data?.missing && Array.isArray(data.missing)) {
          throw new Error(`Cannot publish: ${data.missing.join('; ')}`)
        }
        throw new Error(data?.error ?? `Request failed (${res.status})`)
      }

      setFeedback({ type: 'success', message: 'Product updated.' })
    } catch (err) {
      setFeedback({ type: 'error', message: err instanceof Error ? err.message : 'Unexpected error' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-md border p-4">
      <div className="space-y-1.5">
        <label htmlFor="status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-9 w-full max-w-xs rounded-md border bg-transparent px-3 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="pending_review">Pending Review</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
          <option value="delisted">Delisted</option>
        </select>
      </div>

      {/* Usable Today checkbox */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="usableToday"
          checked={usableToday === true}
          onChange={(e) => setUsableToday(e.target.checked)}
          className="h-4 w-4 rounded border"
        />
        <label htmlFor="usableToday" className="text-sm font-medium">
          Product is usable today
        </label>
      </div>
      <p className="text-xs text-muted-foreground">
        Staff attestation: confirm the product is in a usable state (not a waitlist, placeholder, or coming-soon page).
      </p>

      {/* Review Flags */}
      {initialReviewFlags && initialReviewFlags.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="mb-1 text-xs font-medium text-amber-800">Automated Review Flags:</p>
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-amber-700">
            {initialReviewFlags.map((flag, i) => (
              <li key={i}>{flag}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-1.5">
        <label htmlFor="seoTitle" className="text-sm font-medium">
          SEO Title
        </label>
        <Input
          id="seoTitle"
          value={seoTitle}
          onChange={(e) => setSeoTitle(e.target.value)}
          placeholder="Override page title"
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="seoDescription" className="text-sm font-medium">
          SEO Description
        </label>
        <Textarea
          id="seoDescription"
          value={seoDescription}
          onChange={(e) => setSeoDescription(e.target.value)}
          placeholder="Override meta description"
          rows={3}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="seoCanonicalUrl" className="text-sm font-medium">
          SEO Canonical URL
        </label>
        <Input
          id="seoCanonicalUrl"
          value={seoCanonicalUrl}
          onChange={(e) => setSeoCanonicalUrl(e.target.value)}
          placeholder="https://example.com/canonical"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </Button>
        {feedback && (
          <Badge variant={feedback.type === 'success' ? 'success' : 'destructive'}>
            {feedback.message}
          </Badge>
        )}
      </div>
    </form>
  )
}
