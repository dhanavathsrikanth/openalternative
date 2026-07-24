'use client'

import { useState } from 'react'
import posthog from 'posthog-js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsletterSchema, type NewsletterInput } from '@/lib/validation'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function NewsletterSignup() {
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
  })

  async function onSubmit(data: NewsletterInput) {
    setSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || 'Failed to subscribe')
      }

      posthog.capture('newsletter_subscribed')
      setSuccess(true)
      reset()
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
            Thank you for subscribing! You&apos;ll receive our weekly digest.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Card>
        <CardContent>
          <h3 className="mb-2 text-lg font-semibold">Stay Updated</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Get a weekly digest of newly added and updated open-source alternatives.
          </p>

          {serverError && (
            <p className="mb-4 text-sm text-destructive">{serverError}</p>
          )}

          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              className="flex-1"
              {...register('email')}
            />
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </div>
          {errors.email && (
            <p className="mt-2 text-xs text-destructive">{errors.email.message}</p>
          )}
        </CardContent>
      </Card>
    </form>
  )
}
