'use client'

import { useState, useEffect, useCallback } from 'react'

export interface TocEntry {
  id: string
  label: string
}

interface Props {
  entries: TocEntry[]
}

export function StickyToc({ entries }: Props) {
  const [activeId, setActiveId] = useState<string>('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleClick = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setMobileOpen(false)
    }
  }, [])

  useEffect(() => {
    if (entries.length === 0) return

    const observer = new IntersectionObserver(
      (observed) => {
        // Pick the intersecting entry closest to the top of the viewport
        let best: Element | null = null
        let bestTop = Infinity
        for (const entry of observed) {
          if (entry.isIntersecting) {
            const top = entry.boundingClientRect.top
            if (top < bestTop) {
              bestTop = top
              best = entry.target
            }
          }
        }
        if (best) {
          setActiveId(best.id)
        }
      },
      {
        rootMargin: '-120px 0px -70% 0px',
        threshold: 0,
      },
    )

    for (const { id } of entries) {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [entries])

  if (entries.length === 0) return null

  const activeIndex = entries.findIndex((e) => e.id === activeId)
  const activeLabel = activeIndex >= 0 ? entries[activeIndex].label : entries[0].label

  return (
    <nav className="sticky top-[calc(var(--header-height)+1.5rem)] z-30 mb-6">
      {/* Desktop: horizontal pill bar */}
      <div className="hidden lg:block">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border bg-card/95 px-3 py-2 shadow-sm backdrop-blur">
          {entries.map((entry, i) => {
            const num = String(i + 1).padStart(2, '0')
            const isActive = entry.id === activeId || (!activeId && i === 0)
            return (
              <button
                key={entry.id}
                onClick={() => handleClick(entry.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                }`}
              >
                <span className={`tabular-nums ${isActive ? 'opacity-70' : 'opacity-50'}`}>{num}</span>
                <span className="hidden xl:inline">{entry.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile: dropdown toggle */}
      <div className="lg:hidden">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm"
        >
          <span className="flex items-center gap-2">
            <span className="tabular-nums text-muted-foreground">
              {activeIndex >= 0 ? String(activeIndex + 1).padStart(2, '0') : '01'}
            </span>
            {activeLabel}
          </span>
          <svg
            className={`h-4 w-4 text-muted-foreground transition-transform ${mobileOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        {mobileOpen && (
          <div className="mt-1 overflow-hidden rounded-xl border bg-card shadow-lg">
            {entries.map((entry, i) => {
              const num = String(i + 1).padStart(2, '0')
              const isActive = entry.id === activeId || (!activeId && i === 0)
              return (
                <button
                  key={entry.id}
                  onClick={() => handleClick(entry.id)}
                  className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors ${
                    isActive
                      ? 'bg-accent font-medium text-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                  }`}
                >
                  <span className="tabular-nums opacity-50">{num}</span>
                  {entry.label}
                </button>
              )
            })}
          </div>
        )}
      </div>
    </nav>
  )
}
