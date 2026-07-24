'use client'

import { useState } from 'react'

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
        setState({ step: 'error', message: data.error || 'Failed to initiate claim.' })
        return
      }
      setState({
        step: 'instructions',
        claimRequestId: data.claimRequestId,
        verificationToken: data.verificationToken,
        method: data.method,
      })
    } catch {
      setState({ step: 'error', message: 'Network error. Please try again.' })
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
        setState({ step: 'error', message: data.message || data.error || 'Verification failed.' })
        return
      }
      setState({ step: 'success' })
    } catch {
      setState({ step: 'error', message: 'Network error. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (state.step === 'success') {
    return null
  }

  if (state.step === 'already_claimed') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">
          This product has already been claimed by another organization.
        </p>
        <p className="mt-1 text-xs text-amber-700">
          If you believe this is an error, please contact support.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold">Claim this product</h3>
      <p className="mb-4 text-xs text-muted-foreground">
        Prove your organization owns or maintains this project to display a verified badge.
      </p>

      {state.step === 'idle' && (
        <>
          <div className="mb-4 flex flex-col gap-2">
            {homepageUrl && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="method"
                  value="dns_txt"
                  checked={method === 'dns_txt'}
                  onChange={() => setMethod('dns_txt')}
                  className="accent-green-600"
                />
                DNS TXT Record
                <span className="text-xs text-muted-foreground">(requires access to your domain)</span>
              </label>
            )}
            {githubUrl && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="method"
                  value="github_org"
                  checked={method === 'github_org'}
                  onChange={() => setMethod('github_org')}
                  className="accent-green-600"
                />
                GitHub Organization
                <span className="text-xs text-muted-foreground">(must be a public member)</span>
              </label>
            )}
          </div>
          <button
            onClick={initiateClaim}
            disabled={loading}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Starting…' : 'Start Verification'}
          </button>
        </>
      )}

      {state.step === 'instructions' && (
        <div className="space-y-3">
          {state.method === 'dns_txt' ? (
            <div className="rounded-lg bg-muted p-3">
              <p className="mb-2 text-xs font-medium">Add this TXT record to your domain DNS:</p>
              <code className="block break-all rounded bg-background px-3 py-2 text-xs font-mono">
                {`forklane-verify=${state.verificationToken}`}
              </code>
              <p className="mt-2 text-xs text-muted-foreground">
                Record type: <strong>TXT</strong> on your root domain or subdomain.
              </p>
            </div>
          ) : (
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs">
                Ensure your GitHub account (<strong>{state.method === 'github_org' ? 'your account' : 'yours'}</strong>) is a public member of the organization that owns this repository.
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Go to GitHub → Settings → Organizations → verify public membership.
              </p>
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={verifyClaim}
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Verifying…' : 'Verify Now'}
            </button>
            <button
              onClick={() => setState({ step: 'idle' })}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {state.step === 'verifying' && (
        <p className="text-sm text-muted-foreground">Checking verification…</p>
      )}

      {state.step === 'error' && (
        <div className="space-y-3">
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="text-sm text-red-700">{state.message}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={verifyClaim}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Try Again
            </button>
            <button
              onClick={() => setState({ step: 'idle' })}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
            >
              Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
