/**
 * Recursively walks a BlockNote contentBlocks tree and extracts
 * structured data for schema.org generation.
 *
 * Resilient to zero, one, or multiple FAQ/Code blocks scattered
 * anywhere in the tree — pure recursive walk with no positional assumptions.
 */

interface Block {
  id?: string
  type: string
  props?: Record<string, any>
  content?: { type: string; text: string; styles?: Record<string, boolean> }[]
  children?: Block[]
}

export interface ExtractedFaqPair {
  question: string
  answer: string
}

export interface ExtractedInstallStep {
  label: string
  commands: string[]
}

function walkTree(
  blocks: Block[],
  onFaqAccordion: (items: ExtractedFaqPair[]) => void,
  onInstallCode: (step: ExtractedInstallStep) => void,
) {
  for (const block of blocks) {
    if (block.type === 'faqAccordion' && block.props?.items) {
      try {
        const items = JSON.parse(block.props.items) as { question: string; answer: string }[]
        const valid = items.filter((f) => f.question && f.answer)
        if (valid.length > 0) onFaqAccordion(valid)
      } catch { /* skip malformed */ }
    }

    if (block.type === 'installCode') {
      const label = block.props?.methodLabel || 'Install'
      const code = block.content?.[0]?.text || ''
      const commands = code.split('\n').filter((l: string) => l.trim())
      if (commands.length > 0) {
        onInstallCode({ label, commands })
      }
    }

    if (block.children && block.children.length > 0) {
      walkTree(block.children, onFaqAccordion, onInstallCode)
    }
  }
}

export function extractFaqPairs(blocks: unknown[] | null | undefined): ExtractedFaqPair[] {
  if (!blocks || !Array.isArray(blocks)) return []
  const pairs: ExtractedFaqPair[] = []
  walkTree(blocks as Block[], (items) => pairs.push(...items), () => {})
  return pairs
}

export function extractInstallSteps(blocks: unknown[] | null | undefined): ExtractedInstallStep[] {
  if (!blocks || !Array.isArray(blocks)) return []
  const steps: ExtractedInstallStep[] = []
  walkTree(blocks as Block[], () => {}, (step) => steps.push(step))
  return steps
}
