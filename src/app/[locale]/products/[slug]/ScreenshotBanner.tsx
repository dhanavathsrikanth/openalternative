'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Link2, Share2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface Props {
  src: string
  alt: string
  pageUrl: string
}

export function ScreenshotBanner({ src, alt, pageUrl }: Props) {
  return (
    <div className="group relative mb-6 overflow-hidden rounded-xl border border-border-default bg-surface-raised shadow-elevation-1">
      {/* Wide-aspect-ratio image — 16:9 container, object-cover */}
      <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover"
          loading="eager"
        />

        {/* Gradient scrim on bottom edge for readability */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Overlay controls — top-right, visible on hover */}
        <div className="absolute right-3 top-3 flex items-center gap-1.5 opacity-0 transition-opacity duration-fast group-hover:opacity-100">
          <CopyLinkButton url={pageUrl} />
          <ShareButton url={pageUrl} title={alt} />
        </div>
      </div>
    </div>
  )
}

/* ── Copy Link Button ─────────────────────────────────────────────────── */

function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select + copy
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
      setCopied(true)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setCopied(false), 2000)
    }
  }, [url])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={handleCopy}
      aria-label={copied ? 'Link copied' : 'Copy link'}
      className={cn(
        'border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors duration-fast hover:bg-black/60 hover:text-white',
        copied && 'bg-success/80 hover:bg-success/80',
      )}
    >
      {copied ? <Check className="size-3" /> : <Link2 className="size-3" />}
    </Button>
  )
}

/* ── Share Button ─────────────────────────────────────────────────────── */

function ShareButton({ url, title }: { url: string; title: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNativeShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // User cancelled — no-op
      }
    } else {
      setOpen((v) => !v)
    }
  }, [url, title])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      document.body.removeChild(input)
    }
    setCopied(true)
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      setCopied(false)
      setOpen(false)
    }, 1500)
  }, [url])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function listener(e: globalThis.MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [open])

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={handleNativeShare}
        aria-label="Share"
        className={cn(
          'border border-white/20 bg-black/40 text-white backdrop-blur-sm transition-colors duration-fast hover:bg-black/60 hover:text-white',
          open && 'bg-black/60',
        )}
      >
        <Share2 className="size-3" />
      </Button>

      {/* Fallback share popover (desktop only, when Web Share API unavailable) */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-44 animate-scale-in rounded-radius-card border border-border-default bg-surface-overlay p-2 shadow-elevation-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute right-1.5 top-1.5 rounded-radius-badge p-0.5 text-muted-foreground transition-colors duration-fast hover:bg-surface-raised hover:text-text-primary"
            aria-label="Close"
          >
            <X className="size-3" />
          </button>

          <p className="mb-1.5 px-1 text-[10px] font-medium uppercase tracking-wider text-text-tertiary">
            Share
          </p>

          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-radius-button px-2.5 py-1.5 text-xs text-text-primary transition-colors duration-fast hover:bg-surface-raised"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            X (Twitter)
          </a>

          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-radius-button px-2.5 py-1.5 text-xs text-text-primary transition-colors duration-fast hover:bg-surface-raised"
          >
            <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            LinkedIn
          </a>

          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center gap-2 rounded-radius-button px-2.5 py-1.5 text-xs text-text-primary transition-colors duration-fast hover:bg-surface-raised"
          >
            {copied ? (
              <>
                <Check className="size-3.5 text-success" />
                <span className="text-success">Copied!</span>
              </>
            ) : (
              <>
                <Link2 className="size-3.5" />
                Copy link
              </>
            )}
          </button>
        </div>
      )}
    </div>
  )
}
