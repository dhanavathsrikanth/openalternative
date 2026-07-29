import { db } from '@/app/db'
import { Products, ProductAssets, ProductTags, Tags } from '@/app/db/schema'
import { eq, inArray } from 'drizzle-orm'
import Link from 'next/link'
import type { Product } from '@/app/db/schema'
import { sanitizeContentBlocks } from './sanitize'
import { MAX_LAYOUT_DEPTH } from '@/lib/validation/content-blocks'

// ── Block type definitions ────────────────────────────────────────────────

interface InlineContent {
  type: 'text'
  text: string
  styles?: Record<string, boolean>
}

interface Block {
  id: string
  type: string
  props?: Record<string, any>
  content?: InlineContent[]
  children?: Block[]
}

// ── Inline text renderer ──────────────────────────────────────────────────

function renderInline(items: InlineContent[] | undefined): React.ReactNode {
  if (!items || items.length === 0) return null
  return items.map((item, i) => {
    let node: React.ReactNode = item.text
    if (item.styles?.bold) node = <strong key={i}>{node}</strong>
    if (item.styles?.italic) node = <em key={i}>{node}</em>
    if (item.styles?.underline) node = <u key={i}>{node}</u>
    if (item.styles?.strikethrough) node = <s key={i}>{node}</s>
    if (item.styles?.code) {
      node = (
        <code key={i} className="rounded bg-muted px-1.5 py-0.5 text-[0.9em] font-mono">
          {node}
        </code>
      )
    }
    return <span key={i}>{node}</span>
  })
}

// ── Standard block renderers ──────────────────────────────────────────────

function renderParagraph(block: Block): React.ReactNode {
  const text = renderInline(block.content)
  return <p className="mb-3 text-base leading-relaxed text-foreground/90">{text || '\u00A0'}</p>
}

function renderHeading(block: Block): React.ReactNode {
  const level = block.props?.level ?? 2
  const text = renderInline(block.content)
  const id = text?.toString()?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') ?? ''

  if (level === 1) {
    return <h1 id={id} className="mb-4 mt-8 text-3xl font-bold tracking-tight">{text}</h1>
  }
  if (level === 2) {
    return <h2 id={id} className="mb-3 mt-7 scroll-mt-24 text-2xl font-semibold">{text}</h2>
  }
  return <h3 id={id} className="mb-2 mt-6 text-xl font-medium">{text}</h3>
}

function renderBulletList(block: Block): React.ReactNode {
  const text = renderInline(block.content)
  return <li className="ml-5 list-disc text-base leading-relaxed text-foreground/90">{text}</li>
}

function renderNumberedList(block: Block): React.ReactNode {
  const text = renderInline(block.content)
  return <li className="ml-5 list-decimal text-base leading-relaxed text-foreground/90">{text}</li>
}

function renderCheckList(block: Block): React.ReactNode {
  const text = renderInline(block.content)
  const checked = block.props?.checked ?? false
  return (
    <li className="ml-5 list-none text-base leading-relaxed text-foreground/90">
      <span className="mr-2 inline-block h-4 w-4 align-middle rounded border border-border">
        {checked && (
          <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        )}
      </span>
      <span className={checked ? 'text-muted-foreground line-through' : ''}>{text}</span>
    </li>
  )
}

function renderQuote(block: Block): React.ReactNode {
  const text = renderInline(block.content)
  return (
    <blockquote className="my-4 border-l-4 border-primary/40 pl-5 text-base italic text-muted-foreground">
      {text}
    </blockquote>
  )
}

function renderCodeBlock(block: Block): React.ReactNode {
  const text = renderInline(block.content)
  const language = block.props?.language ?? ''
  return (
    <figure className="my-5 overflow-hidden rounded-xl border border-border bg-card">
      {language && (
        <figcaption className="border-b border-border bg-muted/50 px-4 py-1.5 text-xs font-mono text-muted-foreground">
          {language}
        </figcaption>
      )}
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono">{text}</code>
      </pre>
    </figure>
  )
}

function renderImage(block: Block): React.ReactNode {
  const src = block.props?.url ?? ''
  const caption = block.props?.caption ?? ''
  if (!src) return null
  return (
    <figure className="my-5">
      <img src={src} alt={caption} className="w-full rounded-xl object-cover" loading="lazy" />
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">{caption}</figcaption>
      )}
    </figure>
  )
}

// ── Custom block renderers ────────────────────────────────────────────────

const calloutVariantStyles: Record<string, { border: string; bg: string; icon: string }> = {
  positive: { border: 'border-l-green-500', bg: 'bg-green-50', icon: '\u2705' },
  negative: { border: 'border-l-red-500', bg: 'bg-red-50', icon: '\u274C' },
  neutral: { border: 'border-l-blue-500', bg: 'bg-blue-50', icon: '\u2139\uFE0F' },
}

function renderLayout(block: Block, depth: number = 0): React.ReactNode {
  if (depth >= MAX_LAYOUT_DEPTH) {
    return (
      <div className="my-5 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
        Layout nesting too deep — content truncated for safety.
      </div>
    )
  }
  const cols = parseInt(block.props?.columnCount ?? '2', 10) || 2
  const children = block.children ?? []
  return (
    <div className="my-5">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {children.map((child) => (
          <div key={child.id} className="min-w-0">
            {renderBlock(child, depth + 1)}
          </div>
        ))}
        {Array.from({ length: Math.max(0, cols - children.length) }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}
      </div>
    </div>
  )
}

function renderCallout(block: Block, depth: number = 0): React.ReactNode {
  const vs = calloutVariantStyles[block.props?.variant] ?? calloutVariantStyles.neutral
  const title = block.props?.title ?? ''
  const children = block.children ?? []
  return (
    <aside className={`my-5 flex gap-3 rounded-lg border-l-4 p-5 ${vs.border} ${vs.bg}`}>
      <span className="mt-0.5 shrink-0 text-lg" aria-hidden="true">{vs.icon}</span>
      <div className="min-w-0 flex-1">
        {title && <p className="mb-2 text-base font-semibold">{title}</p>}
        {children.length > 0 ? (
          children.map((child) => <div key={child.id}>{renderBlock(child, depth)}</div>)
        ) : null}
      </div>
    </aside>
  )
}

function renderInstallCode(block: Block): React.ReactNode {
  const language = block.props?.language ?? 'bash'
  const methodLabel = block.props?.methodLabel ?? 'Install'
  const code = block.content?.[0]?.text ?? ''
  return (
    <figure className="my-5 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-4 py-2">
        <span className="text-sm font-medium">{methodLabel}</span>
        <span className="text-xs font-mono text-muted-foreground">{language}</span>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className="font-mono">{code || ''}</code>
      </pre>
    </figure>
  )
}

function renderStatRow(block: Block): React.ReactNode {
  let items: { label: string; value: string }[] = []
  try {
    items = JSON.parse(block.props?.items ?? '[]')
  } catch { /* ignore */ }
  if (items.length === 0) return null
  return (
    <ul className="my-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item, i) => (
        <li key={i} className="rounded-xl border border-border bg-card p-4 text-center">
          <span className="block text-3xl font-bold tabular-nums text-foreground">{item.value || '\u2014'}</span>
          <span className="mt-1 block text-xs font-medium uppercase tracking-wider text-muted-foreground">{item.label || 'Metric'}</span>
        </li>
      ))}
    </ul>
  )
}

function renderComparisonTable(block: Block): React.ReactNode {
  let data: { headers: string[]; rows: string[][] } = { headers: [], rows: [] }
  try {
    data = JSON.parse(block.props?.data ?? '{}')
  } catch { /* ignore */ }
  if (!data.headers || data.headers.length < 2) return null
  return (
    <div className="my-5 overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {data.headers.map((h, i) => (
              <th key={i} className="px-4 py-3 text-left font-semibold">{h || `Column ${i + 1}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className="border-b border-border last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3">{cell || '\u2014'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function renderFaqAccordion(block: Block): React.ReactNode {
  let items: { question: string; answer: string }[] = []
  try {
    items = JSON.parse(block.props?.items ?? '[]')
  } catch { /* ignore */ }
  if (items.length === 0) return null
  return (
    <div className="my-5 space-y-2">
      {items.map((item, i) => (
        <details key={i} className="group rounded-xl border border-border bg-card" open={i === 0}>
          <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 text-base font-medium marker:content-none">
            <svg className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
            {item.question || `Question ${i + 1}`}
          </summary>
          {item.answer && (
            <div className="border-t border-border px-5 py-4 text-base leading-relaxed text-muted-foreground">
              {item.answer}
            </div>
          )}
        </details>
      ))}
    </div>
  )
}

function renderDivider(_block: Block): React.ReactNode {
  return <hr className="my-6 border-border" aria-hidden="true" />
}

// ── Block dispatcher ──────────────────────────────────────────────────────

function renderBlock(block: Block, depth: number = 0): React.ReactNode {
  switch (block.type) {
    case 'paragraph':
      return renderParagraph(block)
    case 'heading':
      return renderHeading(block)
    case 'bulletListItem':
      return renderBulletList(block)
    case 'numberedListItem':
      return renderNumberedList(block)
    case 'checkListItem':
      return renderCheckList(block)
    case 'quote':
      return renderQuote(block)
    case 'codeBlock':
      return renderCodeBlock(block)
    case 'image':
      return renderImage(block)
    case 'divider':
      return renderDivider(block)
    case 'layout':
      return renderLayout(block, depth)
    case 'callout':
      return renderCallout(block, depth)
    case 'installCode':
      return renderInstallCode(block)
    case 'statRow':
      return renderStatRow(block)
    case 'comparisonTable':
      return renderComparisonTable(block)
    case 'faqAccordion':
      return renderFaqAccordion(block)
    case 'productCardRow':
      // productCardRow is async — handled separately in ContentBlocksRenderer
      return null
    default:
      return null
  }
}

// ── Main server component ─────────────────────────────────────────────────

interface ContentBlocksRendererProps {
  contentBlocks: unknown[] | null | undefined
}

/**
 * Server component that renders BlockNote contentBlocks to semantic HTML.
 * Fully SSR-compatible — renders to static HTML on the server, no client JS required.
 *
 * If contentBlocks is empty/missing, renders nothing (callers should handle fallback).
 */
export async function ContentBlocksRenderer({ contentBlocks }: ContentBlocksRendererProps) {
  if (!contentBlocks || !Array.isArray(contentBlocks) || contentBlocks.length === 0) {
    return null
  }

  // Sanitize all text content before rendering (defense in depth)
  const blocks = sanitizeContentBlocks(contentBlocks) as Block[]

  // Pre-fetch all productCardRow slugs in one batch
  const allSlugs: string[] = []
  for (const block of blocks) {
    const b = block as Block
    if (b.type === 'productCardRow') {
      try {
        const slugs: string[] = JSON.parse(b.props?.slugs ?? '[]')
        allSlugs.push(...slugs)
      } catch { /* ignore */ }
    }
  }

  // Pre-fetch all referenced products and their assets/tags
  let productRows: any[] = []
  let productAssets: any[] = []
  let productTagRows: any[] = []

  if (allSlugs.length > 0) {
    const uniqueSlugs = [...new Set(allSlugs)]
    productRows = await db
      .select()
      .from(Products)
      .where(inArray(Products.slug, uniqueSlugs))

    const productIds = productRows.map((p) => p.id)
    if (productIds.length > 0) {
      ;[productAssets, productTagRows] = await Promise.all([
        db
          .select({ productId: ProductAssets.productId, url: ProductAssets.url })
          .from(ProductAssets)
          .where(inArray(ProductAssets.productId, productIds)),
        db
          .select({ productId: ProductTags.productId, name: Tags.name })
          .from(ProductTags)
          .innerJoin(Tags, eq(ProductTags.tagId, Tags.id))
          .where(inArray(ProductTags.productId, productIds)),
      ])
    }
  }

  // Render each block, grouping consecutive list items into <ol>/<ul>
  const rendered: React.ReactNode[] = []
  let listBuffer: { type: 'numberedListItem' | 'bulletListItem'; block: Block }[] = []

  const flushList = () => {
    if (listBuffer.length === 0) return
    const isNumbered = listBuffer[0].type === 'numberedListItem'
    const Tag = isNumbered ? 'ol' : 'ul'
    const listClass = isNumbered
      ? 'my-4 ml-6 space-y-2 list-decimal text-base leading-relaxed text-foreground/90'
      : 'my-4 ml-6 space-y-2 list-disc text-base leading-relaxed text-foreground/90'
    rendered.push(
      <Tag key={`list-${rendered.length}`} className={listClass}>
        {listBuffer.map((item) => (
          <li key={item.block.id}>{renderInline(item.block.content)}</li>
        ))}
      </Tag>,
    )
    listBuffer = []
  }

  for (const block of blocks) {
    const b = block as Block

    // Flush list buffer when we hit a non-list block
    if (b.type !== 'numberedListItem' && b.type !== 'bulletListItem') {
      flushList()
    }

    // Special handling for productCardRow (needs pre-fetched data)
    if (b.type === 'productCardRow') {
      let slugs: string[] = []
      try {
        slugs = JSON.parse(b.props?.slugs ?? '[]')
      } catch { /* ignore */ }
      if (slugs.length === 0) continue

      const orderedProducts = slugs
        .map((slug) => productRows.find((p: any) => p.slug === slug))
        .filter(Boolean)

      if (orderedProducts.length === 0) continue

      rendered.push(
        <div key={b.id} className="my-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedProducts.map((product: any) => {
            const logoUrl = productAssets.find((a: any) => a.productId === product.id)?.url ?? null
            const tags = productTagRows
              .filter((t: any) => t.productId === product.id)
              .map((t: any) => t.name)

            return (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex h-full flex-col rounded-2xl border border-card-border bg-card p-5 transition-colors hover:bg-accent/50"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted text-muted-foreground">
                    {logoUrl ? (
                      <img src={logoUrl} alt={`${product.name} logo`} className="h-full w-full object-cover" />
                    ) : (
                       <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                      </svg>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold leading-tight group-hover:underline">{product.name}</h3>
                    {product.tagline && (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{product.tagline}</p>
                    )}
                  </div>
                </div>
                {tags.length > 0 && (
                  <div className="mt-auto flex flex-wrap gap-1 pt-2">
                    {tags.slice(0, 3).map((tag: string) => (
                      <span key={tag} className="inline-flex items-center rounded-full border border-card-border bg-secondary/30 px-2 py-0.5 text-xs text-muted-foreground">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
        </div>,
      )
      continue
    }

    // Accumulate consecutive list items
    if (b.type === 'numberedListItem' || b.type === 'bulletListItem') {
      listBuffer.push({ type: b.type, block: b })
      continue
    }

    // All other blocks
    rendered.push(<div key={b.id}>{renderBlock(b)}</div>)
  }

  // Flush any remaining list items
  flushList()

  return <>{rendered}</>
}
