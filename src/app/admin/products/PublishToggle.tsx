'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PublishToggle({ productId, currentStatus }: { productId: number; currentStatus: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/products/${productId}/publish`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: currentStatus === 'published' ? 'draft' : 'published',
        }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        alert(data.error ?? 'Failed to toggle publish status')
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
      title={currentStatus === 'published' ? 'Unpublish' : 'Publish'}
    >
      {loading ? '…' : currentStatus === 'published' ? 'Unpublish' : 'Publish'}
    </button>
  )
}
