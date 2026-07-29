'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import posthog from 'posthog-js'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { newsletterSchema, type NewsletterInput } from '@/lib/validation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function HeroNewsletter() {
  const t = useTranslations('Newsletter.hero')
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

      posthog.capture('newsletter_subscribed', { source: 'hero' })
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
      <p className="text-sm text-green-600 dark:text-green-400">
        {t('success')}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col items-center gap-2">
      <div className="flex w-full max-w-sm gap-2">
        <Input
          type="email"
          placeholder={t('placeholder')}
          className="flex-1"
          {...register('email')}
        />
        <Button type="submit" size="default" disabled={submitting}>
          {submitting ? '...' : t('subscribe')}
        </Button>
      </div>
      {(serverError || errors.email) && (
        <p className="text-xs text-destructive">
          {serverError || errors.email?.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        {t('helper')}
      </p>
    </form>
  )
}
