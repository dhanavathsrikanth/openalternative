'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_ACTIONS: Record<string, { label: string; target: string }> = {
  draft: { label: 'Publish', target: 'published' },
  scheduled: { label: 'Publish', target: 'published' },
  pending_review: { label: 'Publish', target: 'published' },
  published: { label: 'Unpublish', target: 'draft' },
  rejected: { label: 'Publish', target: 'published' },
  delisted: { label: 'Re-publish', target: 'published' },
}

export function PublishToggle({ productId, currentStatus }: { productId: number; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const action = STATUS_ACTIONS[currentStatus] ?? { label: 'Publish', target: 'published' }

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action.target }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Failed to update status')
      }
    } catch {
      alert('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
      title={action.label}
    >
      {loading ? '…' : action.label}
    </button>
  )
}
