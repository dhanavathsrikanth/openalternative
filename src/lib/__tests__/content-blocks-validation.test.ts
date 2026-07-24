import { describe, it, expect } from 'vitest'
import { validateContentBlocks, MAX_LAYOUT_DEPTH } from '../validation/content-blocks'
import { sanitizeContentBlocks } from '../blocks/sanitize'

// ══════════════════════════════════════════════════════════════════════════
// 1. Content blocks validation (zod schema + depth guard)
// ══════════════════════════════════════════════════════════════════════════

describe('validateContentBlocks', () => {
  it('accepts a valid minimal block tree', () => {
    const blocks = [
      { id: '1', type: 'heading', props: { level: 2 }, content: [{ type: 'text', text: 'Hi' }] },
      { id: '2', type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
    ]
    expect(validateContentBlocks(blocks)).toEqual({ valid: true, errors: [] })
  })

  it('accepts empty array', () => {
    expect(validateContentBlocks([])).toEqual({ valid: true, errors: [] })
  })

  it('rejects non-array root', () => {
    const result = validateContentBlocks('not an array')
    expect(result.valid).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rejects block without id', () => {
    const blocks = [{ type: 'paragraph', content: [] }]
    const result = validateContentBlocks(blocks)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('id'))).toBe(true)
  })

  it('rejects block with unknown type', () => {
    const blocks = [{ id: '1', type: 'nonexistent' }]
    const result = validateContentBlocks(blocks)
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('nonexistent'))).toBe(true)
  })

  it('accepts all valid block types', () => {
    const types = [
      'paragraph', 'heading', 'bulletListItem', 'numberedListItem',
      'checkListItem', 'quote', 'codeBlock', 'image', 'divider',
      'layout', 'callout', 'installCode', 'statRow',
      'comparisonTable', 'faqAccordion', 'productCardRow', 'customDivider',
    ]
    const blocks = types.map((type, i) => ({ id: String(i), type }))
    expect(validateContentBlocks(blocks)).toEqual({ valid: true, errors: [] })
  })

  it('accepts nested children', () => {
    const blocks = [
      {
        id: '1',
        type: 'layout',
        props: { columnCount: '2' },
        children: [
          { id: '2', type: 'callout', props: { variant: 'positive' } },
          { id: '3', type: 'callout', props: { variant: 'negative' } },
        ],
      },
    ]
    expect(validateContentBlocks(blocks)).toEqual({ valid: true, errors: [] })
  })

  it('rejects layout nesting exceeding max depth', () => {
    // Build a tree nested MAX_LAYOUT_DEPTH + 2 levels deep
    let tree: any = { id: 'deep', type: 'paragraph' }
    for (let i = 0; i <= MAX_LAYOUT_DEPTH + 1; i++) {
      tree = { id: `layout-${i}`, type: 'layout', props: { columnCount: '2' }, children: [tree] }
    }
    const result = validateContentBlocks([tree])
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('nesting depth'))).toBe(true)
  })

  it('accepts layout nesting at exactly max depth', () => {
    let tree: any = { id: 'leaf', type: 'paragraph' }
    for (let i = 0; i < MAX_LAYOUT_DEPTH; i++) {
      tree = { id: `layout-${i}`, type: 'layout', props: { columnCount: '2' }, children: [tree] }
    }
    expect(validateContentBlocks([tree])).toEqual({ valid: true, errors: [] })
  })

  it('reports errors for invalid blocks', () => {
    const blocks = [
      { type: 'heading' },  // missing id
      { id: '2', type: 'bogus' },  // unknown type
    ]
    const result = validateContentBlocks(blocks)
    expect(result.valid).toBe(false)
    // At least the unknown type error is caught in the type-checking pass
    expect(result.errors.some((e) => e.includes('bogus'))).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 2. Content sanitization
// ══════════════════════════════════════════════════════════════════════════

describe('sanitizeContentBlocks', () => {
  it('returns null for null/undefined input', () => {
    expect(sanitizeContentBlocks(null)).toBeNull()
    expect(sanitizeContentBlocks(undefined)).toBeNull()
  })

  it('escapes HTML in inline text content', () => {
    const blocks = [
      {
        id: '1',
        type: 'paragraph',
        content: [{ type: 'text', text: '<script>alert("xss")</script>' }],
      },
    ]
    const sanitized = sanitizeContentBlocks(blocks)!
    const text = (sanitized[0] as any).content[0].text
    expect(text).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;')
    expect(text).not.toContain('<script>')
  })

  it('escapes HTML in callout title', () => {
    const blocks = [
      {
        id: '1',
        type: 'callout',
        props: { variant: 'neutral', title: '<img onerror=alert(1)>' },
      },
    ]
    const sanitized = sanitizeContentBlocks(blocks)!
    expect((sanitized[0] as any).props.title).toBe('&lt;img onerror=alert(1)&gt;')
  })

  it('sanitizes FAQ accordion items', () => {
    const blocks = [
      {
        id: '1',
        type: 'faqAccordion',
        props: {
          items: JSON.stringify([
            { question: 'Is it safe? <script>', answer: 'Yes & no. <b>Bold</b>' },
          ]),
        },
      },
    ]
    const sanitized = sanitizeContentBlocks(blocks)!
    const items = JSON.parse((sanitized[0] as any).props.items)
    expect(items[0].question).toBe('Is it safe? &lt;script&gt;')
    expect(items[0].answer).toBe('Yes &amp; no. &lt;b&gt;Bold&lt;/b&gt;')
  })

  it('sanitizes stat row items', () => {
    const blocks = [
      {
        id: '1',
        type: 'statRow',
        props: {
          items: JSON.stringify([{ label: '<b>Stars</b>', value: '12k' }]),
        },
      },
    ]
    const sanitized = sanitizeContentBlocks(blocks)!
    const items = JSON.parse((sanitized[0] as any).props.items)
    expect(items[0].label).toBe('&lt;b&gt;Stars&lt;/b&gt;')
  })

  it('sanitizes comparison table data', () => {
    const blocks = [
      {
        id: '1',
        type: 'comparisonTable',
        props: {
          data: JSON.stringify({
            headers: ['Feature', '<script>X</script>'],
            rows: [['License', 'MIT & friends']],
          }),
        },
      },
    ]
    const sanitized = sanitizeContentBlocks(blocks)!
    const data = JSON.parse((sanitized[0] as any).props.data)
    expect(data.headers[1]).toBe('&lt;script&gt;X&lt;/script&gt;')
    expect(data.rows[0][1]).toBe('MIT &amp; friends')
  })

  it('sanitizes image caption', () => {
    const blocks = [
      {
        id: '1',
        type: 'image',
        props: { url: 'https://example.com/img.png', caption: '<script>evil</script>' },
      },
    ]
    const sanitized = sanitizeContentBlocks(blocks)!
    expect((sanitized[0] as any).props.caption).toBe('&lt;script&gt;evil&lt;/script&gt;')
    // URL is preserved
    expect((sanitized[0] as any).props.url).toBe('https://example.com/img.png')
  })

  it('sanitizes recursively in children', () => {
    const blocks = [
      {
        id: '1',
        type: 'layout',
        props: { columnCount: '2' },
        children: [
          {
            id: '2',
            type: 'callout',
            props: { title: '<b>Alert</b>' },
            children: [
              { id: '3', type: 'paragraph', content: [{ type: 'text', text: '<script>x</script>' }] },
            ],
          },
        ],
      },
    ]
    const sanitized = sanitizeContentBlocks(blocks)!
    const child = (sanitized[0] as any).children[0]
    expect(child.props.title).toBe('&lt;b&gt;Alert&lt;/b&gt;')
    expect(child.children[0].content[0].text).toBe('&lt;script&gt;x&lt;/script&gt;')
  })

  it('does not mutate the original blocks', () => {
    const original = [
      { id: '1', type: 'paragraph', content: [{ type: 'text', text: '<script>x</script>' }] },
    ]
    sanitizeContentBlocks(original)
    expect(original[0].content[0].text).toBe('<script>x</script>')
  })

  it('handles malformed FAQ JSON gracefully', () => {
    const blocks = [
      {
        id: '1',
        type: 'faqAccordion',
        props: { items: 'not-json' },
      },
    ]
    const sanitized = sanitizeContentBlocks(blocks)!
    expect((sanitized[0] as any).props.items).toBe('not-json')
  })
})

// ══════════════════════════════════════════════════════════════════════════
// 3. Depth guard
// ══════════════════════════════════════════════════════════════════════════

describe('layout depth guard', () => {
  it('MAX_LAYOUT_DEPTH is a reasonable number', () => {
    expect(MAX_LAYOUT_DEPTH).toBeGreaterThanOrEqual(5)
    expect(MAX_LAYOUT_DEPTH).toBeLessThanOrEqual(20)
  })

  it('counts only layout nesting, not callout nesting', () => {
    // Callout children don't count toward layout depth
    let tree: any = { id: 'leaf', type: 'paragraph' }
    for (let i = 0; i < 20; i++) {
      // Alternate between layout and callout — only layout counts
      tree = {
        id: `block-${i}`,
        type: i % 2 === 0 ? 'layout' : 'callout',
        props: i % 2 === 0 ? { columnCount: '2' } : { variant: 'neutral' },
        children: [tree],
      }
    }
    // 10 layouts deep — should be valid
    const result = validateContentBlocks([tree])
    expect(result.valid).toBe(true)
  })
})
