'use client'

import { useState, FormEvent } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProductCard } from '@/components/product/ProductCard'

export function NewsletterCard() {
  const t = useTranslations('Product')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')
    setMessage('')

    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? 'Subscription failed')
      }

      setStatus('success')
      setEmail('')
      setMessage('Subscribed successfully')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProductCard className="space-y-4">
      <div>
        <h2 className="mb-1 text-body-sm font-medium text-foreground">Newsletter</h2>
        <p className="text-body-xs text-muted-foreground">Get the weekly digest of new open-source alternatives</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <Input
          id="newsletter-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || status === 'success'}
          className="text-body-sm"
          required
        />

        <Button type="submit" className="w-full" disabled={loading || status === 'success'}>
          {loading ? (
            <>
              <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle className="opacity-25" cx="12" cy="12" r="10" />
                <path className="opacity-75" d="M12 2a10 10 0 0110 10" strokeLinecap="round" />
              </svg>
              Subscribing...
            </>
          ) : status === 'success' ? (
            <>
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Subscribed
            </>
          ) : (
            'Subscribe'
          )}
        </Button>

        {(status === 'success' || status === 'error') && (
          <p className={`text-center text-body-xs ${status === 'success' ? 'text-success' : 'text-destructive'}`}>
            {message}
          </p>
        )}

        <p className="text-center text-body-xs text-muted-foreground">
          No spam. Unsubscribe anytime.
        </p>
      </form>
    </ProductCard>
  )
}