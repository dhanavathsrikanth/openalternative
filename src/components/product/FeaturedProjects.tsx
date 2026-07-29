'use client'

import { useState, useEffect } from 'react'

interface Props {
  count?: number
}

function isPreviewMode(): boolean {
  if (typeof window === 'undefined') return false
  return process.env.NODE_ENV === 'development' || window.location.search.includes('preview=true')
}

export function FeaturedProjects({ count = 4 }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    setShow(isPreviewMode())
  }, [])

  if (!show) return null

  return (
    <div className="space-y-3" data-featured-projects aria-hidden="true">
      <div className="text-body-xs font-medium text-muted-foreground uppercase tracking-wider">
        Featured projects
      </div>
      <div className="grid grid-cols-2 gap-2">
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center"
          >
            <span className="text-body-xs text-muted-foreground/60">Project {i + 1}</span>
          </div>
        ))}
      </div>
    </div>
  )
}