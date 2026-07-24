/**
 * Validation + depth guard for contentBlocks.
 *
 * Validates the full block tree before any save persists,
 * rejecting malformed data with clear error messages.
 *
 * Also enforces a max nesting depth to prevent pathological
 * layout-in-layout-in-layout trees from breaking rendering.
 */

// ── Constants ────────────────────────────────────────────────────────────

/** Maximum allowed nesting depth for layout blocks. */
export const MAX_LAYOUT_DEPTH = 10

/** Valid block type strings. */
const BLOCK_TYPES = new Set([
  // BlockNote defaults
  'paragraph', 'heading', 'bulletListItem', 'numberedListItem',
  'checkListItem', 'quote', 'codeBlock', 'image', 'divider',
  // Custom blocks
  'layout', 'callout', 'installCode', 'statRow',
  'comparisonTable', 'faqAccordion', 'productCardRow', 'customDivider',
])

// ── Depth checker ────────────────────────────────────────────────────────

interface BlockLike {
  type?: unknown
  children?: BlockLike[]
}

function getMaxLayoutDepth(blocks: BlockLike[], current: number = 0): number {
  let max = current
  for (const block of blocks) {
    if (block.type === 'layout' && block.children) {
      const childDepth = getMaxLayoutDepth(block.children, current + 1)
      if (childDepth > max) max = childDepth
    } else if (block.children) {
      const childDepth = getMaxLayoutDepth(block.children, current)
      if (childDepth > max) max = childDepth
    }
  }
  return max
}

// ── Validation entry point ───────────────────────────────────────────────

export interface ContentBlocksValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate a contentBlocks payload.
 *
 * Returns `{ valid: true }` or `{ valid: false, errors: [...] }`.
 *
 * Checks:
 * - Root is an array
 * - Every block is an object with a non-empty `id` string
 * - Every block `type` is a known block type
 * - `content` (if present) is an array of `{ type: 'text', text: string }` objects
 * - `children` (if present) is an array of blocks
 * - Layout nesting depth does not exceed MAX_LAYOUT_DEPTH
 */
export function validateContentBlocks(
  data: unknown,
): ContentBlocksValidationResult {
  const errors: string[] = []

  // 0. Root must be an array
  if (!Array.isArray(data)) {
    return { valid: false, errors: ['Content blocks must be an array'] }
  }

  // 1 + 2. Validate blocks recursively
  function checkBlocks(items: unknown[], parentPath: string) {
    for (let i = 0; i < items.length; i++) {
      const block = items[i] as Record<string, unknown> | null | undefined
      const path = parentPath ? `${parentPath}[${i}]` : `[${i}]`

      if (!block || typeof block !== 'object' || Array.isArray(block)) {
        errors.push(`${path}: Block must be an object`)
        continue
      }

      if (typeof block.id !== 'string' || !block.id) {
        errors.push(`${path}: Block must have a non-empty "id" string`)
      }

      if (typeof block.type !== 'string') {
        errors.push(`${path}: Block must have a "type" string`)
      } else if (!BLOCK_TYPES.has(block.type)) {
        errors.push(`${path}: Unknown block type "${block.type}"`)
      }

      // Validate inline content shape
      if (block.content !== undefined) {
        if (!Array.isArray(block.content)) {
          errors.push(`${path}: "content" must be an array`)
        } else {
          for (let j = 0; j < block.content.length; j++) {
            const item = block.content[j] as Record<string, unknown> | null | undefined
            const itemPath = `${path}.content[${j}]`
            if (!item || typeof item !== 'object') {
              errors.push(`${itemPath}: Inline content must be an object`)
              continue
            }
            if (item.type !== 'text') {
              errors.push(`${itemPath}: Inline content "type" must be "text"`)
            }
            if (typeof item.text !== 'string') {
              errors.push(`${itemPath}: Inline content must have a "text" string`)
            }
          }
        }
      }

      // Recurse into children
      if (block.children !== undefined) {
        if (!Array.isArray(block.children)) {
          errors.push(`${path}: "children" must be an array`)
        } else {
          checkBlocks(block.children, `${path}.children`)
        }
      }
    }
  }
  checkBlocks(data, '')

  // 3. Layout depth guard
  const depth = getMaxLayoutDepth(data as BlockLike[])
  if (depth > MAX_LAYOUT_DEPTH) {
    errors.push(
      `Layout nesting depth ${depth} exceeds maximum of ${MAX_LAYOUT_DEPTH}`,
    )
  }

  return { valid: errors.length === 0, errors }
}
