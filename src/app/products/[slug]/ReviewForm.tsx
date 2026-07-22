'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'

interface Props {
  productId: number
}

export function ReviewForm({ productId }: Props) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isSignedIn) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-muted-foreground">
          <a href="/contributor/sign-in" className="underline hover:text-foreground">
            Sign in
          </a>{' '}
          to leave a review.
        </p>
      </div>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, rating, reviewBody: body }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to submit review')
      }

      posthog.capture('review_submitted', {
        product_id: productId,
        rating,
      })
      setSuccess(true)
      setBody('')
      setRating(5)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <p className="text-sm text-green-600 dark:text-green-400">
          Thank you! Your review has been submitted.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold">Write a Review</h3>

      {error && (
        <p className="mb-4 text-sm text-destructive">{error}</p>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              className={`h-8 w-8 rounded ${
                star <= rating
                  ? 'bg-yellow-400 text-yellow-900'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="review-body" className="block text-sm font-medium mb-2">
          Your review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          minLength={10}
          required
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          placeholder="Share your experience with this tool..."
        />
      </div>

      <button
        type="submit"
        disabled={submitting || body.trim().length < 10}
        className="inline-flex items-center gap-2 rounded-lg bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/90 disabled:opacity-50"
      >
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
