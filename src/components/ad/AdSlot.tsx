'use client'

import { useState, useEffect } from 'react'

interface Props {
  position: 'sidebar-primary' | 'sidebar-secondary'
}

function isPreviewMode(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NODE_ENV === 'development' || window.location.search.includes('preview=true')
}

export function AdSlot({ position }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(isPreviewMode())
  }, [])

  if (!show) return null

  const sizes: Record<string, { w: string; h: string }> = {
    'sidebar-primary': { w: '100%', h: '180px' },
    'sidebar-secondary': { w: '100%', h: '120px' },
  }

  const size = sizes[position] ?? { w: '100%', h: '120px' }

  return (
    <div
      className="rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center"
      style={{ width: size.w, height: size.h, minHeight: size.h }}
      data-ad-slot={position}
      aria-hidden="true"
    >
      <span className="text-body-xs text-muted-foreground/60 uppercase tracking-wider">
        Ad slot: {position}
      </span>
    </div>
  )
}