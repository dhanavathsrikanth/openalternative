'use client'

import { useState } from 'react'
import posthog from 'posthog-js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsletterSchema, type NewsletterInput } from '@/lib/validation'
import { Button } from '@/components/ui/button'

export function FooterNewsletter() {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const { register, handleSubmit, reset } = useForm<NewsletterInput>({
    resolver: zodResolver(newsletterSchema),
  })

  async function onSubmit(data: NewsletterInput) {
    setSubmitting(true)
    setError(null)

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

      posthog.capture('newsletter_subscribed', { source: 'footer' })
      setSuccess(true)
      reset()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <p className="text-xs text-success">
        Thanks for subscribing!
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3 w-full">
      {/* Bordered wrapper with input + inline button — matches competitor */}
      <div className="flex w-full rounded-radius-input border border-border-default bg-surface transition-[border-color,box-shadow] duration-normal ease-out focus-within:outline-2 focus-within:outline-border/50 focus-within:border-ring">
        <input
          type="email"
          placeholder="Enter your email"
          className="min-h-0 flex-1 border-0 bg-surface px-3 py-2 text-[0.8125rem]/tight text-text-primary placeholder:text-text-tertiary outline-none rounded-l-radius-input md:text-body-sm"
          aria-label="Email address"
          {...register('email')}
        />
        <Button
          type="submit"
          variant="default"
          size="sm"
          disabled={submitting}
          aria-label="Subscribe to newsletter"
          className="m-0.5 shrink-0 rounded-radius-button px-3 py-1.5"
        >
          <span className="flex-1 truncate text-center">Subscribe</span>
        </Button>
      </div>
      <p className="text-xs text-text-tertiary order-first">
        Join our newsletter for weekly updates. Unsubscribe anytime.
      </p>
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </form>
  )
}
