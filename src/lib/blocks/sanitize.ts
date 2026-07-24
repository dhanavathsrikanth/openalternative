/**
 * Sanitizes all text content within a contentBlocks tree.
 *
 * Defense-in-depth: even though authors are staff-only, a compromised
 * admin session or editor bug could produce unexpected markup. This
 * strips HTML entities from all user-facing strings before rendering.
 *
 * Zero dependencies — uses a simple entity escaper. BlockNote stores
 * structured data (not raw HTML), so this preserves all meaning while
 * neutralizing any injected tags.
 */

interface InlineContent {
  type: string
  text: string
  styles?: Record<string, boolean>
}

interface Block {
  id?: string
  type: string
  props?: Record<string, any>
  content?: InlineContent[]
  children?: Block[]
}

// ── HTML entity escaper ──────────────────────────────────────────────────

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
}

const ESCAPE_RE = /[&<>"']/g

function escapeHtml(str: string): string {
  return str.replace(ESCAPE_RE, (ch) => ESCAPE_MAP[ch] ?? ch)
}

// ── JSON prop sanitizers ─────────────────────────────────────────────────

function sanitizeFaqItems(raw: string): string {
  try {
    const items = JSON.parse(raw)
    if (!Array.isArray(items)) return raw
    const sanitized = items.map((item: any) => ({
      question: typeof item.question === 'string' ? escapeHtml(item.question) : '',
      answer: typeof item.answer === 'string' ? escapeHtml(item.answer) : '',
    }))
    return JSON.stringify(sanitized)
  } catch {
    return raw
  }
}

function sanitizeStatItems(raw: string): string {
  try {
    const items = JSON.parse(raw)
    if (!Array.isArray(items)) return raw
    const sanitized = items.map((item: any) => ({
      label: typeof item.label === 'string' ? escapeHtml(item.label) : '',
      value: typeof item.value === 'string' ? escapeHtml(item.value) : '',
    }))
    return JSON.stringify(sanitized)
  } catch {
    return raw
  }
}

function sanitizeComparisonData(raw: string): string {
  try {
    const data = JSON.parse(raw)
    if (!data || !Array.isArray(data.headers)) return raw
    const sanitized = {
      headers: data.headers.map((h: any) => typeof h === 'string' ? escapeHtml(h) : ''),
      rows: Array.isArray(data.rows)
        ? data.rows.map((row: any[]) =>
            Array.isArray(row)
              ? row.map((cell: any) => typeof cell === 'string' ? escapeHtml(cell) : '')
              : [],
          )
        : [],
    }
    return JSON.stringify(sanitized)
  } catch {
    return raw
  }
}

function sanitizeProductSlugs(raw: string): string {
  try {
    const slugs = JSON.parse(raw)
    if (!Array.isArray(slugs)) return raw
    return JSON.stringify(slugs.map((s: any) => typeof s === 'string' ? escapeHtml(s) : ''))
  } catch {
    return raw
  }
}

// ── Block tree sanitizer ─────────────────────────────────────────────────

function sanitizeBlockProps(block: Block): void {
  if (!block.props) return

  switch (block.type) {
    case 'faqAccordion':
      if (typeof block.props.items === 'string') {
        block.props.items = sanitizeFaqItems(block.props.items)
      }
      break
    case 'statRow':
      if (typeof block.props.items === 'string') {
        block.props.items = sanitizeStatItems(block.props.items)
      }
      break
    case 'comparisonTable':
      if (typeof block.props.data === 'string') {
        block.props.data = sanitizeComparisonData(block.props.data)
      }
      break
    case 'productCardRow':
      if (typeof block.props.slugs === 'string') {
        block.props.slugs = sanitizeProductSlugs(block.props.slugs)
      }
      break
    case 'callout':
      if (typeof block.props.title === 'string') {
        block.props.title = escapeHtml(block.props.title)
      }
      break
    case 'image':
      // URLs are validated by the renderer (only renders if non-empty),
      // but we escape the caption to prevent XSS in alt text
      if (typeof block.props.caption === 'string') {
        block.props.caption = escapeHtml(block.props.caption)
      }
      break
    case 'heading':
    case 'codeBlock':
      // language prop is a simple string, no injection risk
      break
  }
}

function sanitizeInlineContent(items: InlineContent[] | undefined): InlineContent[] | undefined {
  if (!items) return undefined
  return items.map((item) => ({
    ...item,
    text: typeof item.text === 'string' ? escapeHtml(item.text) : item.text,
  }))
}

/**
 * Deep-clone and sanitize a contentBlocks tree.
 * Returns a new array — the original is not mutated.
 */
export function sanitizeContentBlocks(blocks: unknown[] | null | undefined): unknown[] | null {
  if (!blocks || !Array.isArray(blocks)) return null

  function sanitizeNode(block: Block): Block {
    const sanitized: Block = {
      ...block,
      props: block.props ? { ...block.props } : undefined,
      content: sanitizeInlineContent(block.content),
    }

    sanitizeBlockProps(sanitized)

    if (block.children) {
      sanitized.children = block.children.map(sanitizeNode)
    }

    return sanitized
  }

  return (blocks as Block[]).map(sanitizeNode)
}
