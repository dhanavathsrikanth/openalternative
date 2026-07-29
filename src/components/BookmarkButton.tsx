'use client'

import { useState, useCallback, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { Heart } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  productId: number
  initialBookmarked: boolean
  /** When true, stops click propagation (for use inside card links) */
  stopPropagation?: boolean
  /** Optional size override */
  size?: 'sm' | 'md'
}

export function BookmarkButton({
  productId,
  initialBookmarked,
  stopPropagation = false,
  size = 'sm',
}: Props) {
  const { isSignedIn } = useUser()
  const router = useRouter()
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  const toggle = useCallback(
    async (e: MouseEvent) => {
      if (stopPropagation) {
        e.preventDefault()
        e.stopPropagation()
      }

      if (!isSignedIn) {
        router.push('/sign-in')
        return
      }

      if (loading) return
      setLoading(true)

      try {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId }),
        })
        if (res.ok) {
          const data = await res.json()
          setBookmarked(data.bookmarked)
        }
      } finally {
        setLoading(false)
      }
    },
    [productId, isSignedIn, loading, stopPropagation, router],
  )

  const iconSize = size === 'sm' ? 'size-4' : 'size-5'

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors duration-fast ease-out',
        'hover:bg-accent/50',
        size === 'sm' ? 'p-1.5' : 'p-2',
        loading && 'opacity-50',
      )}
    >
      <Heart
        className={cn(
          iconSize,
          'transition-colors duration-fast',
          bookmarked
            ? 'fill-red-500 text-red-500'
            : 'text-muted-foreground hover:text-red-400',
        )}
      />
    </button>
  )
}
