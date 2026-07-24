'use client'

import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import posthog from 'posthog-js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createReviewSchema, type CreateReviewInput } from '@/lib/validation'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface Props {
  productId: number
}

export function ReviewForm({ productId }: Props) {
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateReviewInput>({
    resolver: zodResolver(createReviewSchema),
    defaultValues: { productId, rating: 5, reviewBody: '' },
  })

  const rating = watch('rating')

  if (!isSignedIn) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            <a href="/contributor/sign-in" className="underline hover:text-foreground">
              Sign in
            </a>{' '}
            to leave a review.
          </p>
        </CardContent>
      </Card>
    )
  }

  async function onSubmit(data: CreateReviewInput) {
    setSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to submit review')
      }

      posthog.capture('review_submitted', {
        product_id: productId,
        rating,
      })
      setSuccess(true)
      router.refresh()
    } catch (err) {
      setServerError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-green-600 dark:text-green-400">
            Thank you! Your review has been submitted.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent>
          <h3 className="mb-4 text-lg font-semibold">Write a Review</h3>

          {serverError && (
            <p className="mb-4 text-sm text-destructive">{serverError}</p>
          )}

          <div className="mb-4">
            <Label className="mb-2 block">Rating</Label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setValue('rating', star, { shouldValidate: true })}
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
            {errors.rating && (
              <p className="mt-1 text-xs text-destructive">{errors.rating.message}</p>
            )}
          </div>

          <div className="mb-4">
            <Label htmlFor="review-body" className="mb-2 block">
              Your review
            </Label>
            <Textarea
              id="review-body"
              rows={4}
              placeholder="Share your experience with this tool..."
              {...register('reviewBody')}
            />
            {errors.reviewBody && (
              <p className="mt-1 text-xs text-destructive">{errors.reviewBody.message}</p>
            )}
          </div>

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit Review'}
          </Button>
        </CardContent>
      </Card>
    </form>
  )
}
