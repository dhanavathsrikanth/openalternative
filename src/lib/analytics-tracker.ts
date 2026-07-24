'use client'

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import posthog from 'posthog-js'

function trackEvent(eventType: string, productId: number, metadata?: Record<string, unknown>) {
  fetch('/api/analytics/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ eventType, productId, metadata }),
    keepalive: true,
  }).catch(() => {})
}

export function useAnalyticsTracking(productId?: number) {
  const pathname = usePathname()
  const prevPath = useRef<string | null>(null)

  useEffect(() => {
    if (!productId || pathname === prevPath.current) return
    prevPath.current = pathname

    trackEvent('page_view', productId, { path: pathname })
    posthog.capture('product_page_viewed', { product_id: productId, path: pathname })
  }, [productId, pathname])
}

export function useOutboundClickTracker(productId: number) {
  useEffect(() => {
    if (!productId) return

    function handleClick(e: MouseEvent) {
      const anchor = (e.target as HTMLElement).closest('a[href]')
      if (!anchor) return

      const href = anchor.getAttribute('href') ?? ''
      const currentHost = window.location.hostname
      let isOutbound = false
      try {
        const url = new URL(href, window.location.origin)
        isOutbound = url.hostname !== currentHost
      } catch {
        isOutbound = href.startsWith('http')
      }

      if (isOutbound) {
        trackEvent('outbound_click', productId, {
          url: href,
          link_text: (anchor as HTMLElement).textContent?.trim().slice(0, 100) ?? '',
          path: window.location.pathname,
        })
        posthog.capture('product_outbound_click', {
          product_id: productId,
          url: href,
        })
      }
    }

    document.addEventListener('click', handleClick, { capture: true, passive: true })
    return () => document.removeEventListener('click', handleClick, { capture: true })
  }, [productId])
}
