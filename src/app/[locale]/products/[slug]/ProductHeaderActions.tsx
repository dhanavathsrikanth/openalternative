'use client'
import { useState, useCallback, useRef, useEffect, type MouseEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Bookmark, BookmarkCheck, Flag, Code2, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Props {
  productId: number
  productSlug: string
  productName: string
  initialBookmarked: boolean
  isSignedIn: boolean
}

export function ProductHeaderActions({
  productId,
  productSlug,
  productName,
  initialBookmarked,
  isSignedIn,
}: Props) {
  const t = useTranslations('Product')
  const tCommon = useTranslations('Common')
  const router = useRouter()

  return (
    <div className="flex items-center gap-1">
      <SaveButton
        productId={productId}
        initialBookmarked={initialBookmarked}
        isSignedIn={isSignedIn}
        router={router}
      />
      <FlagButton productId={productId} productName={productName} t={t} tCommon={tCommon} />
      <EmbedButton productSlug={productSlug} productName={productName} t={t} tCommon={tCommon} />
    </div>
  )
}

/* ── Save (Bookmark) ──────────────────────────────────────────────────── */

function SaveButton({
  productId,
  initialBookmarked,
  isSignedIn,
  router,
}: {
  productId: number
  initialBookmarked: boolean
  isSignedIn: boolean
  router: ReturnType<typeof useRouter>
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked)
  const [loading, setLoading] = useState(false)

  const toggle = useCallback(
    async (e: MouseEvent) => {
      e.preventDefault()
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
    [productId, isSignedIn, loading, router],
  )

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={loading}
      aria-label={bookmarked ? 'Remove bookmark' : 'Add bookmark'}
      className={cn(
        'text-muted-foreground transition-colors duration-fast ease-out',
        bookmarked ? 'text-brand hover:text-brand/80' : 'hover:text-brand',
        loading && 'opacity-50',
      )}
    >
      {bookmarked ? (
        <BookmarkCheck className="size-4 fill-brand" />
      ) : (
        <Bookmark className="size-4" />
      )}
    </Button>
  )
}

/* ── Flag (Report) ────────────────────────────────────────────────────── */

function FlagButton({
  productId,
  productName,
  t,
  tCommon,
}: {
  productId: number
  productName: string
  t: ReturnType<typeof useTranslations>
  tCommon: ReturnType<typeof useTranslations>
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false))

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Report product"
        className={cn(
          'text-muted-foreground transition-colors duration-fast ease-out hover:text-warning',
          open && 'bg-surface-raised text-warning',
        )}
      >
        <Flag className="size-4" />
      </Button>

      {open && (
        <PopoverPanel onClose={() => setOpen(false)}>
          <ReportPopoverContent productId={productId} t={t} />
        </PopoverPanel>
      )}
    </div>
  )
}

function ReportPopoverContent({
  productId,
  t,
}: {
  productId: number
  t: ReturnType<typeof useTranslations>
}) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const [reason, setReason] = useState('broken_link')
  const [detail, setDetail] = useState('')

  const REASON_LABELS: Record<string, string> = {
    broken_link: t('report.reason.brokenLink'),
    wrong_category: t('report.reason.wrongCategory'),
    outdated: t('report.reason.outdated'),
    other: t('report.reason.other'),
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setServerError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          reason,
          detail: detail || undefined,
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? t('report.submitError'))
      }
      setSubmitted(true)
    } catch (err) {
      setServerError(err instanceof Error ? err.message : t('report.error'))
    }
  }

  if (submitted) {
    return (
      <div className="py-6 text-center">
        <p className="text-sm font-semibold">{t('report.thanks')}</p>
        <p className="mt-1 text-xs text-muted-foreground">{t('report.thanksBody')}</p>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className="text-xs font-medium text-text-primary">{t('report.heading')}</p>

      <Select value={reason} onValueChange={setReason}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(REASON_LABELS).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div>
        <Label className="mb-1 block text-xs">{t('report.detailsLabel')}</Label>
        <Textarea
          rows={2}
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          placeholder={t('report.detailsPlaceholder')}
          className="text-xs"
        />
      </div>

      {serverError && (
        <Alert variant="destructive" className="py-2">
          <AlertDescription className="text-xs">{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="sm" className="w-full">
        {t('report.submit')}
      </Button>
    </form>
  )
}

/* ── Embed (Badge Snippet) ────────────────────────────────────────────── */

function EmbedButton({
  productSlug,
  productName,
  t,
  tCommon,
}: {
  productSlug: string
  productName: string
  t: ReturnType<typeof useTranslations>
  tCommon: ReturnType<typeof useTranslations>
}) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [snippet, setSnippet] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useClickOutside(ref, () => setOpen(false))

  useEffect(() => {
    const embedUrl = `${window.location.origin}/products/${productSlug}`
    setSnippet(`<a href="${embedUrl}" target="_blank" rel="noopener noreferrer">\n  <img src="${embedUrl}/og" alt="${productName}" width="300" />\n</a>`)
  }, [productSlug, productName])

  const handleCopy = useCallback(async () => {
    if (!snippet) return
    // Ensure the document is focused before attempting to write to the clipboard.
    if (typeof document !== 'undefined' && !document.hasFocus()) {
      // If not focused, we simply set the copied flag to false and exit.
      setCopied(false)
      return
    }
    try {
      await navigator.clipboard.writeText(snippet)
      setCopied(true)
    } catch (err) {
      // Gracefully handle clipboard permission errors.
      console.error('Clipboard write failed', err)
      setCopied(false)
    }
    setTimeout(() => setCopied(false), 2000)
  }, [snippet])

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Embed badge"
        className={cn(
          'text-muted-foreground transition-colors duration-fast ease-out hover:text-info',
          open && 'bg-surface-raised text-info',
        )}
      >
        <Code2 className="size-4" />
      </Button>

      {open && (
        <PopoverPanel onClose={() => setOpen(false)}>
          <div className="space-y-3">
            <p className="text-xs font-medium text-text-primary">
              {t('embed.heading')}
            </p>

            <div className="overflow-hidden rounded-radius-md border border-border-default bg-surface-sunken p-3">
              <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-text-secondary">
                {snippet || '...'}
              </pre>
            </div>

            <Button
              size="sm"
              variant={copied ? 'default' : 'outline'}
              onClick={handleCopy}
              className="w-full"
            >
              {copied ? (
                <>
                  <Check className="size-3.5" />
                  {t('embed.copied')}
                </>
              ) : (
                t('embed.copy')
              )}
            </Button>
          </div>
        </PopoverPanel>
      )}
    </div>
  )
}

/* ── Shared Popover Panel ─────────────────────────────────────────────── */

function PopoverPanel({
  children,
  onClose,
}: {
  children: React.ReactNode
  onClose: () => void
}) {
  return (
    <div className="absolute right-0 top-full z-50 mt-1.5 w-72 animate-scale-in rounded-radius-card border border-border-default bg-surface-overlay p-4 shadow-elevation-3">
      <button
        type="button"
        onClick={onClose}
        className="absolute right-2 top-2 rounded-radius-badge p-1 text-muted-foreground transition-colors duration-fast hover:bg-surface-raised hover:text-text-primary"
        aria-label="Close"
      >
        <X className="size-3" />
      </button>
      {children}
    </div>
  )
}

/* ── useClickOutside hook ─────────────────────────────────────────────── */

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function listener(e: globalThis.MouseEvent) {
      if (!ref.current || ref.current.contains(e.target as Node)) return
      handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}
