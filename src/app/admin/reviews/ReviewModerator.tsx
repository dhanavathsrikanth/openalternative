'use client'

import { useState } from 'react'

type Props = { reviewId: number }

export function ReviewModerator({ reviewId }: Props) {
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this review? This cannot be undone.')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, { method: 'DELETE' })
      if (res.ok) {
        window.location.reload()
      }
    } finally {
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding px-2.5 text-sm font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 h-8 disabled:opacity-50"
    >
      {deleting ? '...' : 'Delete'}
    </button>
  )
}
