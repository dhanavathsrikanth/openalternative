'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ReportRow {
  id: number
  productId: number
  reason: string
  detail: string | null
  reporterId: number | null
  status: string
  createdAt: Date
}

interface Props {
  contributions: ReportRow[]
}

export function ReportsQueue({ contributions: initial }: Props) {
  const [contributions, setContributions] = useState(initial)
  const [processing, setProcessing] = useState<number | null>(null)

  async function handleAction(id: number, action: 'resolved' | 'dismissed') {
    setProcessing(id)
    try {
      const res = await fetch(`/api/admin/reports/${id}`, {
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

  const reasonLabels: Record<string, string> = {
    broken_link: 'Broken Link',
    wrong_category: 'Wrong Category',
    outdated: 'Outdated',
    other: 'Other',
  }

  return (
    <div>
      <h1 className="text-lg font-semibold mb-2">Reports Queue</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {contributions.length} pending report{contributions.length !== 1 ? 's' : ''}
      </p>

      {contributions.length === 0 ? (
        <p className="text-muted-foreground">No pending reports. All caught up!</p>
      ) : (
        <ul className="space-y-4">
          {contributions.map((c) => (
            <li key={c.id} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/products/${c.productId}`}
                    className="font-semibold hover:underline"
                  >
                    Product #{c.productId}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Reason:{' '}
                    <span className="inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground capitalize">
                      {reasonLabels[c.reason] ?? c.reason}
                    </span>
                  </p>
                </div>
                <time
                  className="text-xs text-muted-foreground whitespace-nowrap"
                  dateTime={c.createdAt.toISOString()}
                >
                  {c.createdAt.toLocaleString()}
                </time>
              </div>

              <div className="mb-4">
                <span className="text-xs font-medium capitalize text-muted-foreground">
                  {c.reason.replace('_', ' ')}
                </span>
                {c.detail && (
                  <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">
                    {c.detail}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(c.id, 'resolved')}
                  disabled={processing === c.id}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 h-8"
                >
                  {processing === c.id ? 'Processing...' : 'Mark Resolved'}
                </button>
                <button
                  onClick={() => handleAction(c.id, 'dismissed')}
                  disabled={processing === c.id}
                  className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 h-8"
                >
                  {processing === c.id ? 'Processing...' : 'Dismiss'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}