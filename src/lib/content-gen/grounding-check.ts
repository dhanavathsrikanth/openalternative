/**
 * Lightweight grounding heuristic.
 *
 * After generation, tokenizes the generated text and the grounding context,
 * then checks whether at least one meaningful term (length > 3, not a
 * stopword) from the generated text also appears in the context.
 *
 * This is a rough signal — it flags, never blocks. False positives are
 * expected and handled by the reviewer.
 */

const STOPWORDS = new Set([
  'that', 'this', 'with', 'from', 'your', 'have', 'will', 'been', 'were',
  'they', 'their', 'what', 'when', 'where', 'which', 'about', 'would',
  'could', 'should', 'there', 'also', 'than', 'some', 'more', 'very',
  'just', 'only', 'into', 'over', 'such', 'each', 'most', 'other',
  'these', 'those', 'then', 'them', 'does', 'will', 'just', 'like',
  'well', 'back', 'even', 'still', 'made', 'make', 'many', 'must',
  'sure', 'take', 'want', 'look', 'first', 'same', 'both', 'every',
])

function tokenize(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\-_]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  return new Set(words)
}

export interface GroundingResult {
  /** True if the check found at least one overlapping meaningful term. */
  grounded: boolean
  /** Number of overlapping terms found. */
  overlapCount: number
  /** Sample of overlapping terms (max 10) for display. */
  sampleOverlap: string[]
}

export function checkGrounding(
  generatedText: string,
  contextText: string,
): GroundingResult {
  const genTokens = tokenize(generatedText)
  const ctxTokens = tokenize(contextText)

  const overlap: string[] = []
  for (const t of genTokens) {
    if (ctxTokens.has(t)) {
      overlap.push(t)
      if (overlap.length >= 10) break
    }
  }

  return {
    grounded: overlap.length > 0,
    overlapCount: overlap.length,
    sampleOverlap: overlap,
  }
}

/**
 * Run grounding checks on an array of text entries against the context.
 * Returns one result per entry, in order.
 */
export function checkGroundingBatch(
  texts: string[],
  contextText: string,
): GroundingResult[] {
  return texts.map((t) => checkGrounding(t, contextText))
}
