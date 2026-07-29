'use client'

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import type { Product } from '@/app/db/schema'
import type { DetectedTech } from '@/lib/content-gen/tech-detect'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { BookmarkButton } from '@/components/BookmarkButton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import type { FeaturedTool } from '@/components/featured/FeaturedToolCard'
import { formatStatNumber } from '@/lib/format'
import { getTechIcon } from '@/lib/tech-icons'
import { useAnalyticsTracking, useOutboundClickTracker } from '@/lib/analytics-tracker'
import {
  Star,
  GitFork,
  Code2,
  Check,
  Copy,
  Share2,
  Flag,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Zap,
  BarChart3,
  LucideIcon,
  Hash,
  Activity,
  Timer,
  History,
  Copyright,
  HardDrive,
  GitBranch,
} from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────

interface Review {
  id: number
  rating: number
  body: string
  createdAt: Date
  contributorName: string | null
}

interface Announcement {
  id: number
  title: string
  body: string
  publishedAt: Date | null
}

interface SimilarProduct {
  id: number
  name: string
  slug: string
  description: string
  logoUrl: string | null
}

interface InstallMethod {
  method: string
  label: string
  commands: string[]
  extracted: boolean
  needsTechnicalReview: boolean
  source?: string
}

interface Props {
  product: Product
  categories: { name: string; slug: string }[]
  tags: { name: string; slug: string }[]
  proprietaryTools?: { id: number; name: string; url: string | null }[]
  reviews?: Review[]
  announcements?: Announcement[]
  approvedContent: Record<string, unknown>
  similarProducts: SimilarProduct[]
  currentOrgId: string | null
  logoUrl: string | null
  screenshotUrls: string[]
  contentBlocksHtml?: ReactNode
  contentBlocks?: unknown[] | null
  isDelisted?: boolean
  delistReason?: string | null
  isBookmarked?: boolean
  isSignedIn?: boolean
  delistedAt?: Date | null
  hostingPartnerUrl?: string | null
  featuredTools?: FeaturedTool[]
}

// ── Content helpers ───────────────────────────────────────────────────────

function getTldr(c: Record<string, unknown>): string | null {
  const d = c.tldr as { tldr: string } | undefined
  return d?.tldr ?? null
}

function getPersonas(c: Record<string, unknown>) {
  const d = c.whoItsFor as { personas: { persona: string; useCase: string; skipIf: string }[] } | undefined
  return d?.personas ?? null
}

function getProblem(c: Record<string, unknown>): string | null {
  const d = c.problem as { problem: string } | undefined
  return d?.problem ?? null
}

function getSolutions(c: Record<string, unknown>) {
  const d = c.solution as { solutions: { title: string; description: string }[] } | undefined
  return d?.solutions ?? null
}

function getStrengthsAndTradeoffs(c: Record<string, unknown>) {
  const strengths = (c.strengths as { strengths: { title: string; signal: string }[] } | undefined)?.strengths ?? null
  const tradeoffs = (c.tradeoffs as { tradeoffs: { title: string; detail: string }[] } | undefined)?.tradeoffs ?? null
  return { strengths, tradeoffs }
}

function getComparisons(c: Record<string, unknown>) {
  const d = c.versusAlternatives as { comparisons: { comparedProductId: number; comparedProductName: string; body: string; summary: string }[] } | undefined
  return d?.comparisons ?? null
}

function getInstallMethods(c: Record<string, unknown>): InstallMethod[] | null {
  const d = c.installMethods as { methods: InstallMethod[] } | undefined
  return d?.methods ?? null
}

function formatTimeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const days = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24))
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  if (days < 365) return `${Math.floor(days / 30)}mo ago`
  return `${Math.floor(days / 365)}y ago`
}

function getActivityScore(score: number): { label: string; color: string; icon: LucideIcon } {
  if (score >= 80) return { label: 'Very Active', color: 'text-emerald-500', icon: Zap }
  if (score >= 60) return { label: 'Active', color: 'text-emerald-400', icon: BarChart3 }
  if (score >= 40) return { label: 'Moderate', color: 'text-amber-500', icon: BarChart3 }
  if (score >= 20) return { label: 'Low', color: 'text-orange-500', icon: BarChart3 }
  return { label: 'Inactive', color: 'text-red-500', icon: AlertTriangle }
}

function isSelfHosted(deploymentMethods: string[] | null): boolean {
  if (!deploymentMethods) return false
  return deploymentMethods.includes('docker') || deploymentMethods.includes('source')
}

// ── Section Label ─────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-4 py-1.5 text-body-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="size-3.5" />
      {label}
    </div>
  )
}

// ── Report Modal ──────────────────────────────────────────────────────────

function ReportButton({ productId, productName }: { productId: number; productName: string }) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reason, setReason] = useState('broken_link')
  const [detail, setDetail] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, reason, detail: detail || undefined }),
      })
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error ?? 'Failed to submit report')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-all hover:border-warning/30 hover:bg-warning/5 hover:text-warning"
        aria-label="Report product"
      >
        <Flag className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-in fade-in slide-in-from-top-2 rounded-xl border bg-popover p-4 shadow-lg">
          {submitted ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <CheckCircle2 className="size-8 text-success" />
              <p className="text-sm font-semibold">Report submitted</p>
              <p className="text-xs text-muted-foreground">We&apos;ll review it shortly.</p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <p className="text-xs font-semibold">Report an issue</p>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
              >
                <option value="broken_link">Broken link</option>
                <option value="wrong_category">Wrong category</option>
                <option value="outdated">Outdated information</option>
                <option value="other">Other</option>
              </select>
              <textarea
                rows={2}
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="Optional details..."
                className="w-full rounded-lg border bg-background px-3 py-2 text-xs"
              />
              {error && <p className="text-xs text-destructive">{error}</p>}
              <Button type="submit" size="sm" className="w-full">
                Submit report
              </Button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}

// ── Copy Button ───────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [text])

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-body-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {copied ? (
        <>
          <Check className="size-3.5 text-success" />
          Copied
        </>
      ) : (
        <>
          <Copy className="size-3.5" />
          Copy
        </>
      )}
    </button>
  )
}

// ── Share Menu ────────────────────────────────────────────────────────────

function ShareMenu({ url, name }: { url: string; name: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const encodedUrl = encodeURIComponent(url)
  const encodedName = encodeURIComponent(name)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const shareLinks = [
    { name: 'X', url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedName}` },
    { name: 'LinkedIn', url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}` },
    { name: 'Reddit', url: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedName}` },
    { name: 'Facebook', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
  ]

  async function copyLink() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
        aria-label="Share"
      >
        <Share2 className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 animate-in fade-in slide-in-from-top-2 rounded-xl border bg-popover p-3 shadow-lg">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold">Share</p>
            <button
              type="button"
              onClick={copyLink}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-accent"
            >
              {copied ? (
                <Check className="size-3 text-success" />
              ) : (
                <Copy className="size-3" />
              )}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <Separator className="mb-2" />
          <div className="flex gap-1">
            {shareLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg px-3 py-2 text-center text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                {link.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Embed Menu ────────────────────────────────────────────────────────────

function EmbedMenu({ productSlug, productName }: { productSlug: string; productName: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [snippet, setSnippet] = useState('')

  useEffect(() => {
    setSnippet(`<a href="${window.location.origin}/product/${productSlug}" target="_blank" rel="noopener noreferrer">\n  <img src="${window.location.origin}/product/${productSlug}/og" alt="${productName}" width="300" />\n</a>`)
  }, [productSlug, productName])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function handleCopy() {
    await navigator.clipboard.writeText(snippet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex size-9 items-center justify-center rounded-xl border bg-card text-muted-foreground transition-all hover:bg-accent hover:text-foreground"
        aria-label="Embed"
      >
        <Code2 className="size-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 animate-in fade-in slide-in-from-top-2 rounded-xl border bg-popover p-4 shadow-lg">
          <p className="mb-2 text-xs font-semibold">Embed badge</p>
          <div className="overflow-hidden rounded-lg border bg-muted p-3">
            <pre className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-muted-foreground">
              {snippet}
            </pre>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="mt-2 w-full"
          >
            {copied ? (
              <><Check className="mr-1.5 size-3.5" /> Copied!</>
            ) : (
              <><Copy className="mr-1.5 size-3.5" /> Copy snippet</>
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

// ── GitHub Icon (inline, lucide doesn't export in this version) ──────────

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )
}

// ── Stat Pill ─────────────────────────────────────────────────────────────

function StatPill({ icon: Icon, label, value, color }: { icon: LucideIcon; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border bg-card px-4 py-2.5">
      <Icon className={`size-4 shrink-0 ${color ?? 'text-muted-foreground'}`} />
      <div className="flex items-baseline gap-1.5">
        <span className="text-body-xs text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
    </div>
  )
}

// ── Tech Stack Pill ───────────────────────────────────────────────────────

function TechBadge({ name }: { name: string }) {
  const icon = getTechIcon(name)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border bg-card px-3 py-1.5 text-body-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
      {icon ? (
        <svg className="size-4 shrink-0" viewBox="0 0 24 24" style={{ color: icon.color }} aria-hidden="true">
          {icon.svg}
        </svg>
      ) : (
        <Hash className="size-3.5" />
      )}
      {name}
    </span>
  )
}

// ── Main Component ────────────────────────────────────────────────────────

export function ProductPage({
  product,
  categories,
  tags,
  proprietaryTools = [],
  reviews = [],
  announcements = [],
  approvedContent,
  similarProducts,
  currentOrgId,
  logoUrl,
  screenshotUrls,
  contentBlocksHtml,
  contentBlocks,
  isDelisted = false,
  delistReason = null,
  delistedAt = null,
  isBookmarked = false,
  isSignedIn = false,
  hostingPartnerUrl = null,
  featuredTools = [],
}: Props) {
  const t = useTranslations('Product')
  const score = product.confidenceScore ? parseFloat(product.confidenceScore) : null
  useAnalyticsTracking(product.id)
  useOutboundClickTracker(product.id)

  const tldr = getTldr(approvedContent)
  const personas = getPersonas(approvedContent)
  const problem = getProblem(approvedContent)
  const solutions = getSolutions(approvedContent)
  const { strengths, tradeoffs } = getStrengthsAndTradeoffs(approvedContent)
  const comparisons = getComparisons(approvedContent)
  const installMethods = getInstallMethods(approvedContent)
  const techStack = (product.techStackDetected as DetectedTech[] | null) ?? []

  const [pageUrl, setPageUrl] = useState('')
  useEffect(() => {
    setPageUrl(window.location.href)
  }, [])

  const autoFaqPairs = [
    { question: `What is ${product.name}?`, answer: product.description },
    ...(personas ? [{ question: `Who is ${product.name} for?`, answer: personas.map((p) => `${p.persona}: ${p.useCase}`).join(' ') }] : []),
    ...(strengths ? [{ question: `What are the advantages of ${product.name}?`, answer: strengths.map((s) => `${s.title}: ${s.signal}`).join(' ') }] : []),
    ...(tradeoffs ? [{ question: `What are the limitations of ${product.name}?`, answer: tradeoffs.map((t) => `${t.title}: ${t.detail}`).join(' ') }] : []),
  ]
  const customFaqPairs = (product.faq as { question: string; answer: string }[] | null ?? []).filter((f) => f.question && f.answer)
  const faqPairs = [...autoFaqPairs, ...customFaqPairs]

  const activityInfo = score ? getActivityScore(Math.round(score)) : null

  return (
    <div className="min-h-screen pt-[3.125rem]">
      <div className="mx-auto max-w-[68rem] px-6 lg:px-8 py-10">
      {/* ── Delisted Banner ── */}
      {isDelisted && (
        <div className="relative z-10 border-b border-warning/20 bg-warning/5 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3 text-body-sm">
            <AlertTriangle className="size-4 shrink-0 text-warning" />
            <div className="flex-1">
              <span className="font-semibold text-warning">Delisted</span>
              <span className="ml-2 text-muted-foreground">
                This product is no longer actively maintained.
                {delistReason && ` Reason: ${delistReason}`}
              </span>
            </div>
            {delistedAt && (
              <span className="hidden shrink-0 text-body-xs text-muted-foreground md:inline">
                {new Date(delistedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
        </div>
      )}



      {/* ── Screenshots Gallery ── */}
      {screenshotUrls.length > 0 && (
        <section className="border-b bg-muted/30">
          <div className="mx-auto max-w-7xl px-6 py-8 md:py-12">
            <div className="grid gap-4 md:grid-cols-2">
              {screenshotUrls.map((url, i) => (
                <div
                  key={i}
                  className="group relative overflow-hidden rounded-2xl border bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative w-full" style={{ aspectRatio: '16 / 9' }}>
                    <img
                      src={url}
                      alt={`${product.name} screenshot ${i + 1}`}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading={i === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Two-column grid ── */}
      <div className="flex w-full flex-col items-start gap-y-8 gap-x-6 md:grid md:grid-cols-3 lg:gap-x-8">

        {/* ── LEFT COLUMN ── */}
        <div className="flex w-full flex-col items-start gap-y-8 md:col-span-2">

        {/* 4a. Title row (sticky sub-header) */}
        <div className="sticky top-[50px] z-30 -mx-6 -mt-2 flex w-[calc(100%+3rem)] items-center gap-3 border-b border-[#e0e0e0] bg-white/95 px-6 py-3 backdrop-blur-sm md:static md:mx-0 md:w-full md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          {logoUrl ? (
            <img src={logoUrl} alt={`${product.name} logo`} className="size-8 rounded-md" />
          ) : (
            <div className="flex size-8 items-center justify-center rounded-md bg-[#e0e0e0]/50 text-sm font-bold text-[#4c4c4c]">
              {product.name[0]}
            </div>
          )}
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <h1 className="truncate text-2xl font-medium leading-tight md:text-3xl">{product.name}</h1>
            {product.claimedByOrgId !== null && (
              <svg className="size-5 shrink-0 fill-blue-500" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <BookmarkButton productId={product.id} initialBookmarked={isBookmarked} size="md" />
            <ReportButton productId={product.id} productName={product.name} />
            <EmbedMenu productSlug={product.slug} productName={product.name} />
          </div>
        </div>

        {/* 4b. Tagline */}
        <h2 className="max-w-2xl text-[#4c4c4c] md:text-lg">
          {product.tagline || product.description}
        </h2>

        {/* 4c. Open Source Alternative to row */}
        {proprietaryTools.length > 0 && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-[#737373]">Open Source Alternative to:</p>
            <div className="flex flex-wrap items-center gap-3">
              {proprietaryTools.slice(0, 4).map((tool) => (
                <div key={tool.id} className="flex items-center gap-1.5">
                  <div className="flex size-6 items-center justify-center rounded-md border border-[#e0e0e0] bg-white text-[10px] font-bold text-[#4c4c4c]">
                    {tool.name[0]}
                  </div>
                  <span className="text-sm text-[#4c4c4c]">{tool.name}</span>
                </div>
              ))}
              {proprietaryTools.length > 4 && (
                <button type="button" className="text-sm font-medium text-[#737373]">+{proprietaryTools.length - 4} more</button>
              )}
            </div>
          </div>
        )}

        {/* 4d. CTA buttons row */}
        <div className="flex flex-wrap items-center gap-3">
          {product.homepageUrl && (
            <a
              href={product.homepageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-[#1f1f1f] px-3.5 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Visit {product.name}
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M7 17L17 7M17 7H8M17 7v9" />
              </svg>
            </a>
          )}
          {hostingPartnerUrl && (
            <a
              href={hostingPartnerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#e0e0e0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#737373] transition-colors hover:border-[#b0b0b0] hover:text-[#1f1f1f]"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 002 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0022 16z" />
              </svg>
              Host with a Partner
            </a>
          )}
          {product.githubUrl && (
            <a
              href={product.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-[#e0e0e0] bg-white px-3.5 py-2.5 text-sm font-medium text-[#737373] transition-colors hover:border-[#b0b0b0] hover:text-[#1f1f1f]"
            >
              <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
              </svg>
              View on GitHub
            </a>
          )}
        </div>

        {/* 4e. Screenshot */}
        {screenshotUrls[0] && (
          <div className="w-full overflow-hidden rounded-lg border border-[#e0e0e0]">
            <img
              src={screenshotUrls[0]}
              alt={`${product.name} screenshot`}
              className="aspect-video w-full object-cover object-top"
              loading="eager"
            />
          </div>
        )}

        {/* 4f. Share row */}
        <div className="flex w-full flex-wrap items-center gap-1 rounded-lg border border-[#e0e0e0] bg-white p-1">
          <button
            type="button"
            onClick={async () => {
              try { await navigator.clipboard.writeText(pageUrl || window.location.href) } catch {}
            }}
            className="rounded-sm px-2 py-1 text-xs font-medium text-[#4c4c4c] transition-colors hover:bg-[#e0e0e0]/50"
          >
            Copy Link
          </button>
          <div className="mx-1.5 h-4 w-px bg-[#d4d4d4]" />
          <span className="mx-1 text-xs text-[#737373]">Share:</span>
          {[
            { name: 'X', href: `https://twitter.com/intent/tweet?url=${encodeURIComponent(pageUrl)}&text=${encodeURIComponent(product.name)}` },
            { name: 'Li', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}` },
            { name: 'R', href: `https://reddit.com/submit?url=${encodeURIComponent(pageUrl)}&title=${encodeURIComponent(product.name)}` },
            { name: 'F', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}` },
          ].map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex size-7 items-center justify-center rounded-full text-xs font-medium text-[#737373] transition-colors hover:bg-[#e0e0e0]/50 hover:text-[#1f1f1f]"
              title={`Share on ${s.name}`}
            >
              {s.name}
            </a>
          ))}
        </div>

        {/* 4g. Second screenshot */}
        {screenshotUrls[1] && (
          <div className="w-full overflow-hidden rounded-lg border border-[#e0e0e0]">
            <img
              src={screenshotUrls[1]}
              alt={`${product.name} screenshot 2`}
              className="aspect-video w-full object-cover object-top"
              loading="lazy"
            />
          </div>
        )}

        {/* 4h. Article body (prose) */}
        <div className="prose max-w-none text-[#4c4c4c] leading-relaxed">
          {contentBlocksHtml ? (
            contentBlocksHtml
          ) : (
            <p>{product.description}</p>
          )}
        </div>

        {/* 4i. Categories block */}
        {categories.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            <strong className="text-base font-medium text-[#1f1f1f]">Categories:</strong>
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => (
                <span key={c.slug} className="rounded-md bg-[#e0e0e0]/50 px-2 py-1 text-sm text-[#4c4c4c]">{c.name}</span>
              ))}
            </div>
          </div>
        )}

        {/* 4j. Tags block */}
        {tags.length > 0 && (
          <div className="flex w-full flex-col gap-2">
            <h4 className="text-base font-medium text-[#1f1f1f]">Tags:</h4>
            <div className="flex flex-wrap gap-3">
              {tags.map((tag) => (
                <span key={tag.slug} className="flex items-center gap-1 text-sm text-[#737373]">
                  <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 7V4h3M4 17v3h3M20 7V4h-3M20 17v3h-3M7 4h10M7 20h10" />
                    <path d="M4 12h16" />
                  </svg>
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 4k. Built with block */}
        {techStack.length > 0 && (
          <div className="flex w-full flex-col gap-3">
            <strong className="text-base font-medium text-[#1f1f1f]">Built with:</strong>
            <div className="flex flex-wrap gap-3">
              {techStack.slice(0, 12).map((tech) => (
                <div key={tech.name} className="flex items-center gap-1.5">
                  <div className="flex size-6 items-center justify-center rounded-md border border-[#e0e0e0] bg-white text-[10px] font-bold text-[#4c4c4c]">
                    {tech.name[0]}
                  </div>
                  <span className="text-sm text-[#4c4c4c]">{tech.name}</span>
                </div>
              ))}
              {techStack.length > 12 && (
                <button type="button" className="text-sm font-medium text-[#737373]">+{techStack.length - 12} more</button>
              )}
            </div>
          </div>
        )}

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-y-5 md:col-span-1 md:self-stretch md:sticky md:top-[3.125rem]">

        {/* ── Stats Card (5a) ── */}
        <div className="border border-[#e0e0e0] bg-[#fafafa] rounded-lg p-5">
          <ul className="text-sm divide-y divide-[#e0e0e0]/60">
            {score !== null && (
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <Activity className="size-4 opacity-75 text-[#737373]" />
                  Activity score
                </span>
                <span className="text-blue-600 font-medium">{Math.round(score)}/100</span>
              </li>
            )}
            {product.stars != null && (
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <Star className="size-4 opacity-75 text-[#737373]" />
                  Stars
                </span>
                <span className="font-medium tabular-nums">{formatStatNumber(product.stars)}</span>
              </li>
            )}
            {product.forks != null && (
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <GitFork className="size-4 opacity-75 text-[#737373]" />
                  Forks
                </span>
                <span className="font-medium tabular-nums">{formatStatNumber(product.forks)}</span>
              </li>
            )}
            {product.lastPushedAt && (
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <Timer className="size-4 opacity-75 text-[#737373]" />
                  Last commit
                </span>
                <span className="font-medium">{formatTimeAgo(product.lastPushedAt)}</span>
              </li>
            )}
            {product.createdAt && (
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <History className="size-4 opacity-75 text-[#737373]" />
                  Repository age
                </span>
                <span className="font-medium">{Math.floor((Date.now() - new Date(product.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 365))} years</span>
              </li>
            )}
            {product.latestVersion && (
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <Tag className="size-4 opacity-75 text-[#737373]" />
                  Version
                </span>
                <span className="font-medium">v{product.latestVersion}</span>
              </li>
            )}
            {product.license && (
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <Copyright className="size-4 opacity-75 text-[#737373]" />
                  License
                </span>
                <a href={`https://spdx.org/licenses/${product.license}`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#f97316] hover:underline">
                  {product.license}
                </a>
              </li>
            )}
            <li className="flex items-center justify-between py-1">
              <span className="flex items-center gap-1.5 text-[#737373]">
                <HardDrive className="size-4 opacity-75 text-[#737373]" />
                Self-hosted
              </span>
              <span className="font-medium">{isSelfHosted(product.deploymentMethods) ? 'Yes' : 'No'}</span>
            </li>
            {product.githubUrl && (
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <GitBranch className="size-4 opacity-75 text-[#737373]" />
                  Repository
                </span>
                <a href={product.githubUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-[#f97316] hover:underline truncate ml-2">
                  {product.githubUrl.replace('https://github.com/', '')}
                </a>
              </li>
            )}
          </ul>
        </div>

        {/* ── Languages Block ── */}
        {product.primaryLanguage && (
          <div className="border border-[#e0e0e0] bg-[#fafafa] rounded-lg p-5">
            <ul className="text-sm divide-y divide-[#e0e0e0]/60">
              <li className="flex items-center justify-between py-1">
                <span className="flex items-center gap-1.5 text-[#737373]">
                  <Code2 className="size-4 opacity-75 text-[#737373]" />
                  Language
                </span>
                <span className="font-medium">{product.primaryLanguage}</span>
              </li>
            </ul>
          </div>
        )}

        {/* ── Featured Projects Card (5b) ── */}
        {featuredTools.length > 0 && (
          <div className="border border-[#e0e0e0] bg-[#fafafa] rounded-lg p-5 flex flex-col gap-3">
            <strong className="text-base font-medium">Featured projects:</strong>
            <div className="grid grid-cols-6 gap-1.5">
              {featuredTools.slice(0, 14).map((tool) => (
                <Link key={tool.id} href={`/product/${tool.slug}`} className="aspect-square border border-[#e0e0e0] rounded-lg overflow-hidden hover:border-[#737373] transition-colors">
                  <div className="w-full h-full p-[5px]">
                    {tool.logoUrl ? (
                      <img src={tool.logoUrl} alt={tool.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#737373] text-[10px] font-medium">
                        {tool.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Newsletter Card (5c) ── */}
        <div className="border border-[#e0e0e0] bg-[#fafafa] rounded-lg p-5 flex flex-col gap-3">
          <strong className="text-base font-medium">Subscribe to our newsletter</strong>
          <p className="text-sm text-[#737373]">Every Sunday we deconstruct one proprietary app and pick the best open source alternatives worth switching to.</p>
          <form className="flex border border-[#e0e0e0] rounded-lg overflow-hidden">
            <input type="email" placeholder="Enter your email" className="flex-1 px-3 py-2 text-sm outline-none" />
            <button type="submit" className="bg-[#1f1f1f] text-white text-sm font-medium px-3 py-1.5 m-0.5 rounded-md">Subscribe</button>
          </form>
        </div>

        </div>

      </div>
      </div>

      {/* ── Featured Tools Section (6) ── */}
      {featuredTools.length > 0 && (
        <section className="w-full pt-10 border-t border-[#e0e0e0]/60 mt-10">
          <div className="mx-auto max-w-[68rem] px-6 lg:px-8">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xl font-medium">Featured Tools</h3>
              <span className="flex-1 h-0.5 max-w-20 bg-[#e0e0e0] mx-4"></span>
              <Link href="/products" className="text-sm font-medium border border-[#e0e0e0] rounded-md px-3 py-2 flex items-center gap-2">
                View all tools →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredTools.slice(0, 6).map((tool) => (
                <Link key={tool.id} href={`/product/${tool.slug}`} className="block border border-[#e0e0e0] rounded-lg p-5 hover:border-[#737373] transition-colors">
                  <div className="flex items-center gap-2.5 mb-3">
                    {tool.logoUrl ? (
                      <img src={tool.logoUrl} alt={tool.name} className="size-9 rounded-lg object-cover" />
                    ) : (
                      <div className="size-9 rounded-lg bg-[#e0e0e0]/50 flex items-center justify-center text-sm font-bold text-[#737373]">{tool.name.charAt(0)}</div>
                    )}
                    <span className="font-semibold text-sm truncate">{tool.name}</span>
                    {tool.isClaimed && (
                      <svg className="size-4 shrink-0 text-[#22c55e]" viewBox="0 0 20 20" fill="currentColor" aria-label="Verified">
                        <path fillRule="evenodd" d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-2.546-4.46a.75.75 0 00-1.214-.883l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-sm text-[#737373] line-clamp-1 mb-4">{tool.description}</p>
                  <dl className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <dt className="text-[#737373]">Stars</dt>
                      <dd className="font-medium tabular-nums">{tool.stars != null ? formatStatNumber(tool.stars) : '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-[#737373]">Forks</dt>
                      <dd className="font-medium tabular-nums">{tool.forks != null ? formatStatNumber(tool.forks) : '—'}</dd>
                    </div>
                    <div className="flex items-center justify-between">
                      <dt className="text-[#737373]">Last commit</dt>
                      <dd className="font-medium">{tool.lastPushedAt ? formatTimeAgo(tool.lastPushedAt) : '—'}</dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer className="border-t bg-card/50">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4 text-body-sm text-muted-foreground">
            <p>
              {product.name} — Open Alternative
            </p>
            <div className="flex items-center gap-4">
              {product.lastVerifiedAt && (
                <span>
                  Last verified: {new Date(product.lastVerifiedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              )}
              {product.latestVersion && (
                <span>v{product.latestVersion}</span>
              )}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
