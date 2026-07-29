'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

interface Props {
  productId: number
  productSlug: string
  homepageUrl: string | null
  githubUrl: string | null
  claimedByOrgId: number | null
  currentOrgId: string | null
}

type ClaimState =
  | { step: 'idle' }
  | { step: 'instructions'; claimRequestId: number; verificationToken: string; method: string }
  | { step: 'verifying' }
  | { step: 'success' }
  | { step: 'error'; message: string }
  | { step: 'already_claimed' }

export function ClaimForm({
  productId,
  productSlug,
  homepageUrl,
  githubUrl,
  claimedByOrgId,
  currentOrgId,
}: Props) {
  const t = useTranslations('Product.claim')
  const [state, setState] = useState<ClaimState>(
    claimedByOrgId !== null
      ? currentOrgId && String(claimedByOrgId) === currentOrgId
        ? { step: 'success' }
        : { step: 'already_claimed' }
      : { step: 'idle' }
  )
  const [method, setMethod] = useState<'dns_txt' | 'github_org'>('dns_txt')
  const [loading, setLoading] = useState(false)

  async function initiateClaim() {
    setLoading(true)
    try {
      const res = await fetch('/api/claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, method }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'already_claimed') {
          setState({ step: 'already_claimed' })
          return
        }
        setState({ step: 'error', message: data.error || t('initError') })
        return
      }
      setState({
        step: 'instructions',
        claimRequestId: data.claimRequestId,
        verificationToken: data.verificationToken,
        method: data.method,
      })
    } catch {
      setState({ step: 'error', message: t('networkError') })
    } finally {
      setLoading(false)
    }
  }

  async function verifyClaim() {
    if (state.step !== 'instructions') return
    setLoading(true)
    setState({ step: 'verifying' })
    try {
      const res = await fetch(`/api/claims/${state.claimRequestId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      if (!res.ok) {
        setState({ step: 'error', message: data.message || data.error || t('verifyError') })
        return
      }
      setState({ step: 'success' })
    } catch {
      setState({ step: 'error', message: t('networkError') })
    } finally {
      setLoading(false)
    }
  }

  if (state.step === 'success') {
    return null
  }

  if (state.step === 'already_claimed') {
    return (
      <div className="rounded-lg border border-warning/30 bg-warning/10 p-4">
        <p className="text-body-sm font-medium text-warning">
          {t('alreadyClaimed')}
        </p>
        <p className="mt-1 text-body-xs text-warning/80">
          {t('alreadyClaimedContact')}
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-2 text-body-sm font-display font-semibold">{t('heading')}</h3>
      <p className="mb-4 text-body-xs text-muted-foreground">
        {t('description')}
      </p>

      {state.step === 'idle' && (
        <>
          <div className="mb-4 flex flex-col gap-2">
            {homepageUrl && (
              <label className="flex items-center gap-2 text-body-sm">
                <input
                  type="radio"
                  name="method"
                  value="dns_txt"
                  checked={method === 'dns_txt'}
                  onChange={() => setMethod('dns_txt')}
                  className="accent-success"
                />
                {t('methodDns')}
                <span className="text-body-xs text-muted-foreground">({t('methodDnsHint')})</span>
              </label>
            )}
            {githubUrl && (
              <label className="flex items-center gap-2 text-body-sm">
                <input
                  type="radio"
                  name="method"
                  value="github_org"
                  checked={method === 'github_org'}
                  onChange={() => setMethod('github_org')}
                  className="accent-success"
                />
                {t('methodGithub')}
                <span className="text-body-xs text-muted-foreground">({t('methodGithubHint')})</span>
              </label>
            )}
          </div>
          <button
            onClick={initiateClaim}
            disabled={loading}
            className="rounded-lg bg-success px-4 py-2 text-body-sm font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
          >
            {loading ? t('starting') : t('startVerification')}
          </button>
        </>
      )}

      {state.step === 'instructions' && (
        <div className="space-y-3">
          {state.method === 'dns_txt' ? (
            <div className="rounded-lg bg-sunken p-3">
              <p className="mb-2 text-body-xs font-medium">{t('dnsInstructions')}</p>
              <code className="block break-all rounded bg-background px-3 py-2 text-body-xs font-mono">
                {`forklane-verify=${state.verificationToken}`}
              </code>
              <p className="mt-2 text-body-xs text-muted-foreground">
                {t('dnsRecordType')}
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-sunken p-3">
              <p className="text-body-xs">
                {t('githubInstructions')}
              </p>
              <p className="mt-1 text-body-xs text-muted-foreground">
                {t('githubSteps')}
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={verifyClaim}
              disabled={loading}
              className="rounded-lg bg-success px-4 py-2 text-body-sm font-medium text-success-foreground transition-colors hover:bg-success/90 disabled:opacity-50"
            >
              {loading ? t('verifying') : t('verifyNow')}
            </button>
            <button
              onClick={() => setState({ step: 'idle' })}
              className="rounded-lg border px-4 py-2 text-body-sm font-medium transition-colors hover:bg-accent"
            >
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      {state.step === 'verifying' && (
        <p className="text-body-sm text-muted-foreground">{t('checking')}</p>
      )}

      {state.step === 'error' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-body-sm text-destructive">{state.message}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={verifyClaim}
              className="rounded-lg border px-4 py-2 text-body-sm font-medium transition-colors hover:bg-accent"
            >
              {t('tryAgain')}
            </button>
            <button
              onClick={() => setState({ step: 'idle' })}
              className="rounded-lg border px-4 py-2 text-body-sm font-medium transition-colors hover:bg-accent"
            >
              {t('startOver')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
