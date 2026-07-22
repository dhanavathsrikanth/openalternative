'use client'

import { useState } from 'react'
import type { Contribution } from '@/app/db/schema'
import Link from 'next/link'

interface ContributionRow {
  id: number
  productId: number
  contributorId: number
  changes: unknown
  sourceUrl: string
  status: string
  createdAt: Date
  productName: string
  productSlug: string
  contributorEmail: string
  contributorName: string
  contributorRep: number
}

interface Props {
  contributions: ContributionRow[]
}

export function ModerationQueue({ contributions: initial }: Props) {
  const [contributions, setContributions] = useState(initial)
  const [processing, setProcessing] = useState<number | null>(null)

  async function handleAction(id: number, action: 'approved' | 'rejected') {
    setProcessing(id)
    try {
      const res = await fetch(`/api/contributions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action }),
      })

      if (res.ok) {
        setContributions((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setProcessing(null)
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <nav className="mb-8 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground">Forklane</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">Moderation</span>
      </nav>

      <h1 className="mb-2 text-3xl font-bold tracking-tight">Moderation Queue</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        {contributions.length} pending contribution{contributions.length !== 1 ? 's' : ''}
      </p>

      {contributions.length === 0 ? (
        <p className="text-muted-foreground">No pending contributions. All caught up!</p>
      ) : (
        <ul className="space-y-4">
          {contributions.map((c) => {
            const changes = (typeof c.changes === 'object' && c.changes !== null ? c.changes : []) as { field: string; value: string }[]
            return (
              <li key={c.id} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <Link
                      href={`/products/${c.productSlug}`}
                      className="font-semibold hover:underline"
                    >
                      {c.productName}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      by {c.contributorName} ({c.contributorEmail}) · {c.contributorRep} rep
                    </p>
                  </div>
                  <time className="text-xs text-muted-foreground" dateTime={c.createdAt.toISOString()}>
                    {c.createdAt.toLocaleString()}
                  </time>
                </div>

                <div className="mb-4 space-y-2">
                  {changes.map((change) => (
                    <div key={change.field} className="rounded-lg bg-muted/50 p-3">
                      <span className="text-xs font-medium capitalize text-muted-foreground">
                        {change.field}
                      </span>
                      <p className="mt-1 text-sm">{change.value}</p>
                    </div>
                  ))}
                </div>

                <div className="mb-4">
                  <a
                    href={c.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                  >
                    Source: {c.sourceUrl}
                  </a>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleAction(c.id, 'approved')}
                    disabled={processing === c.id}
                    className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing === c.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleAction(c.id, 'rejected')}
                    disabled={processing === c.id}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                  >
                    {processing === c.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </main>
  )
}
