'use client'

interface BlockRendererProps {
  blocks: unknown[]
  className?: string
}

/**
 * Read-only renderer for BlockNote content blocks.
 * Used in the admin Preview tab to render the content editor's in-memory state.
 */
export function BlockRenderer({ blocks, className }: BlockRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className={`text-sm text-muted-foreground italic ${className ?? ''}`}>
        No content blocks yet. Switch to the Content tab to add blocks.
      </div>
    )
  }

  return (
    <div className={className}>
      {blocks.map((block, i) => (
        <BlockNode key={(block as any).id ?? i} block={block as any} />
      ))}
    </div>
  )
}

// ── Individual block renderer ─────────────────────────────────────────────

function BlockNode({ block }: { block: any }) {
  switch (block.type) {
    case 'paragraph':
      return <ParagraphBlock block={block} />
    case 'heading':
      return <HeadingBlock block={block} />
    case 'bulletListItem':
      return <BulletListBlock block={block} />
    case 'numberedListItem':
      return <NumberedListBlock block={block} />
    case 'checkListItem':
      return <CheckListBlock block={block} />
    case 'quote':
      return <QuoteBlock block={block} />
    case 'codeBlock':
      return <CodeBlock block={block} />
    case 'divider':
      return <hr className="my-4 border-border" />
    case 'image':
      return <ImageBlock block={block} />
    case 'layout':
      return <LayoutBlock block={block} />
    case 'callout':
      return <CalloutBlock block={block} />
    case 'installCode':
      return <InstallCodeBlock block={block} />
    case 'statRow':
      return <StatRowBlock block={block} />
    case 'comparisonTable':
      return <ComparisonTableBlock block={block} />
    case 'faqAccordion':
      return <FaqAccordionBlock block={block} />
    case 'productCardRow':
      return <ProductCardRowBlock block={block} />
    default:
      return (
        <div className="rounded border border-dashed border-border p-2 text-xs text-muted-foreground">
          [{block.type}]
        </div>
      )
  }
}

// ── Text rendering helpers ────────────────────────────────────────────────

function renderInlineContent(content: any[]): React.ReactNode {
  if (!content || !Array.isArray(content)) return null
  return content.map((item, i) => {
    if (item.type === 'text') {
      let text: React.ReactNode = item.text
      if (item.styles?.bold) text = <strong key={i}>{text}</strong>
      if (item.styles?.italic) text = <em key={i}>{text}</em>
      if (item.styles?.underline) text = <u key={i}>{text}</u>
      if (item.styles?.strikethrough) text = <s key={i}>{text}</s>
      if (item.styles?.code) {
        text = (
          <code key={i} className="rounded bg-muted px-1 py-0.5 text-xs font-mono">
            {text}
          </code>
        )
      }
      return <span key={i}>{text}</span>
    }
    return null
  })
}

// ── Block implementations ─────────────────────────────────────────────────

function ParagraphBlock({ block }: { block: any }) {
  const text = renderInlineContent(block.content)
  return <p className="mb-2 text-sm leading-relaxed">{text || <br />}</p>
}

function HeadingBlock({ block }: { block: any }) {
  const level = block.props?.level ?? 2
  const text = renderInlineContent(block.content)
  const Tag = `h${level}` as keyof JSX.IntrinsicElements
  const className = level === 1
    ? 'text-2xl font-bold mb-3 mt-6'
    : level === 2
      ? 'text-xl font-semibold mb-2 mt-5'
      : 'text-lg font-medium mb-2 mt-4'
  return <Tag className={className}>{text}</Tag>
}

function BulletListBlock({ block }: { block: any }) {
  const text = renderInlineContent(block.content)
  return <li className="ml-4 list-disc text-sm leading-relaxed mb-1">{text}</li>
}

function NumberedListBlock({ block }: { block: any }) {
  const text = renderInlineContent(block.content)
  return <li className="ml-4 list-decimal text-sm leading-relaxed mb-1">{text}</li>
}

function CheckListBlock({ block }: { block: any }) {
  const text = renderInlineContent(block.content)
  const checked = block.props?.checked ?? false
  return (
    <label className="flex items-start gap-2 text-sm leading-relaxed mb-1">
      <input type="checkbox" checked={checked} readOnly className="mt-1" />
      <span className={checked ? 'line-through text-muted-foreground' : ''}>{text}</span>
    </label>
  )
}

function QuoteBlock({ block }: { block: any }) {
  const text = renderInlineContent(block.content)
  return (
    <blockquote className="border-l-4 border-border pl-4 my-3 text-sm italic text-muted-foreground">
      {text}
    </blockquote>
  )
}

function CodeBlock({ block }: { block: any }) {
  const text = renderInlineContent(block.content)
  const language = block.props?.language ?? ''
  return (
    <div className="my-3 rounded-lg border bg-card overflow-hidden">
      {language && (
        <div className="border-b bg-muted/50 px-3 py-1 text-xs font-mono text-muted-foreground">
          {language}
        </div>
      )}
      <pre className="overflow-x-auto p-3 text-xs font-mono">
        <code>{text}</code>
      </pre>
    </div>
  )
}

function ImageBlock({ block }: { block: any }) {
  const src = block.props?.url ?? ''
  const caption = block.props?.caption ?? ''
  if (!src) return null
  return (
    <figure className="my-3">
      <img src={src} alt={caption} className="rounded-lg border w-full object-cover" />
      {caption && (
        <figcaption className="mt-1 text-xs text-muted-foreground text-center">{caption}</figcaption>
      )}
    </figure>
  )
}

// ── Custom block renderers (read-only) ────────────────────────────────────

const variantStyles: Record<string, { border: string; bg: string; icon: string }> = {
  positive: { border: 'border-l-green-500', bg: 'bg-green-50 dark:bg-green-950/30', icon: '\u2705' },
  negative: { border: 'border-l-red-500', bg: 'bg-red-50 dark:bg-red-950/30', icon: '\u274C' },
  neutral: { border: 'border-l-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', icon: '\u2139\uFE0F' },
}

function LayoutBlock({ block }: { block: any }) {
  const cols = parseInt(block.props?.columnCount ?? '2', 10) || 2
  const children = block.children ?? []
  return (
    <div className="my-4 rounded-lg border border-border bg-secondary/5 p-3">
      <div className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {cols}-column layout
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {children.map((child: any, i: number) => (
          <div key={child.id ?? i} className="rounded border border-dashed border-border/60 bg-background/50 p-2">
            <BlockNode block={child} />
          </div>
        ))}
        {Array.from({ length: Math.max(0, cols - children.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="flex min-h-[60px] items-center justify-center rounded border border-dashed border-border/30">
            <span className="text-[10px] text-muted-foreground/40">Drop block here</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CalloutBlock({ block }: { block: any }) {
  const vs = variantStyles[block.props?.variant] ?? variantStyles.neutral
  const title = block.props?.title ?? ''
  const children = block.children ?? []
  return (
    <div className={`my-3 flex gap-3 rounded-md border-l-4 p-4 ${vs.border} ${vs.bg}`}>
      <span className="mt-0.5 shrink-0 text-base">{vs.icon}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="mb-1 text-sm font-semibold">{title}</p>}
        {children.length > 0 ? (
          children.map((child: any, i: number) => <BlockNode key={child.id ?? i} block={child} />)
        ) : (
          <p className="text-sm text-muted-foreground italic">Empty callout</p>
        )}
      </div>
    </div>
  )
}

function InstallCodeBlock({ block }: { block: any }) {
  const language = block.props?.language ?? 'bash'
  const methodLabel = block.props?.methodLabel ?? 'Install'
  const code = block.content?.[0]?.text ?? ''
  return (
    <div className="my-3 rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between border-b bg-muted/50 px-3 py-1.5">
        <span className="text-xs font-medium">{methodLabel}</span>
        <span className="text-[10px] font-mono text-muted-foreground">{language}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-xs font-mono">
        <code>{code || 'No code entered'}</code>
      </pre>
    </div>
  )
}

function StatRowBlock({ block }: { block: any }) {
  let items: { label: string; value: string }[] = []
  try {
    items = JSON.parse(block.props?.items ?? '[]')
  } catch { /* ignore */ }
  if (items.length === 0) {
    items = [{ label: '', value: '' }]
  }
  return (
    <div className="my-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border bg-card p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{item.value || '\u2014'}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.label || 'Label'}</p>
        </div>
      ))}
    </div>
  )
}

function ComparisonTableBlock({ block }: { block: any }) {
  let data: { headers: string[]; rows: string[][] } = { headers: [], rows: [] }
  try {
    data = JSON.parse(block.props?.data ?? '{}')
  } catch { /* ignore */ }
  if (!data.headers || data.headers.length < 2) {
    data = { headers: ['Feature', 'Product A', 'Product B'], rows: [['', '', '']] }
  }
  return (
    <div className="my-3 overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {data.headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium">{h || `Col ${i + 1}`}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, ri) => (
            <tr key={ri} className="border-b last:border-0">
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2">{cell || '\u2014'}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function FaqAccordionBlock({ block }: { block: any }) {
  let items: { question: string; answer: string }[] = []
  try {
    items = JSON.parse(block.props?.items ?? '[]')
  } catch { /* ignore */ }
  if (items.length === 0) {
    items = [{ question: '', answer: '' }]
  }
  return (
    <div className="my-3 space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-lg border bg-card">
          <div className="flex items-center gap-2 px-4 py-3">
            <svg className="h-4 w-4 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18l6-6-6-6" />
            </svg>
            <span className="text-sm font-medium">{item.question || `Question ${i + 1}`}</span>
          </div>
          {item.answer && (
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ProductCardRowBlock({ block }: { block: any }) {
  let slugs: string[] = []
  try {
    slugs = JSON.parse(block.props?.slugs ?? '[]')
  } catch { /* ignore */ }
  if (slugs.length === 0) {
    return (
      <div className="my-3 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
        No products selected
      </div>
    )
  }
  return (
    <div className="my-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {slugs.map((slug, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border bg-card p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
            {slug[0]?.toUpperCase() ?? '?'}
          </div>
          <span className="text-sm font-medium">{slug}</span>
        </div>
      ))}
    </div>
  )
}
