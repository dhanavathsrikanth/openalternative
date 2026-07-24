import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import { db } from '@/app/db'
import { ProductContent } from '@/app/db/schema'
import { requireStaff } from '@/lib/auth'
import { logAudit } from '@/lib/audit'
import { buildProductContext, formatContextForPrompt, findComparisonTargets, formatComparisonTargetsForPrompt, type ProductContext } from '@/lib/content-gen/context-builder'
import { generateStructured } from '@/lib/content-gen/client'
import { checkGroundingBatch, type GroundingResult } from '@/lib/content-gen/grounding-check'
import { extractInstallMethods, type InstallMethod } from '@/lib/content-gen/install-parser'

const generateContentSchema = z.object({
  contentType: z.string().min(1).max(100),
})

type RouteContext = { params: Promise<{ id: string }> }

// ── System prompt ─────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert content writer for a developer-focused product directory.
Your job is to produce accurate, grounded marketing copy for open-source tools.
RULES:
- Every claim you make MUST be traceable to the supplied context (README, manifest, scoreBreakdown).
- Never describe a feature you cannot point to in the supplied context.
- Never invent capabilities, integrations, or stats not present in the context.
- Never use the product name in the "problem" section — it must stand alone as a category description.
- When a scoreBreakdown is provided, use it to infer real weaknesses. Do not invent weaknesses not implied by the data.
- Always return valid JSON matching the requested schema. No markdown fences, no commentary.`

// ── Content type definitions ──────────────────────────────────────────────

const personaSchema = z.object({
  persona: z.string().max(200),
  useCase: z.string().max(400),
  skipIf: z.string().max(300),
})

const strengthEntrySchema = z.object({
  title: z.string().max(100),
  signal: z.string().max(400),
})

const tradeoffEntrySchema = z.object({
  title: z.string().max(100),
  detail: z.string().max(400),
})

const CONTENT_SCHEMAS: Record<
  string,
  {
    schema: z.ZodType
    prompt: string
  }
> = {
  whoItsFor: {
    schema: z.object({
      personas: z.array(personaSchema).min(2).max(3),
    }),
    prompt: `Based on the product context below, produce 2-3 personas. Each persona is a short
description of a realistic use case for this product.

For each persona, also write an explicit "skipIf" disqualifier — a condition under which
this person should NOT use this product. The skipIf MUST be derived from a real weakness
implied by the scoreBreakdown or README. Examples of valid reasoning chains:

- Low communityHealth score (< 40) → "Skip if you need responsive community support or active issue triage."
- Low activityTrend score (< 30) → "Skip if you need a project with frequent releases and active maintenance."
- No Dockerfile and high selfHostingComplexity score → "Skip if you want a one-command self-hosted deployment."
- No mention of API/SDK in README → "Skip if you need a programmatic API for automation."
- Low dataExportCapability score → "Skip if data portability and export formats are critical to your workflow."
- License is copyleft (GPL/AGPL) → "Skip if you need to embed this in proprietary SaaS without open-sourcing your code."
- README mentions only one database backend → "Skip if you need database-agnostic deployment."

Never write a generic skipIf like "skip if this doesn't meet your needs" or "skip if you want something different."
Each skipIf must cite a specific, verifiable weakness from the context.

Return JSON: { "personas": [{ "persona": string, "useCase": string, "skipIf": string }] }`,
  },

  problem: {
    schema: z.object({
      problem: z.string().max(800),
    }),
    prompt: `Write one paragraph (3-5 sentences) describing the general pain point that this
CATEGORY of tool solves. This paragraph must stand entirely on its own — it should
never mention the product name, the repository, or any specific technology from the context.

The goal is to describe the problem so well that a developer who experiences it immediately
recognizes their situation. Draw from the README's "Why" or "Motivation" section if present,
and from the features described to infer what pain they address.

Write in second person ("you") to create immediacy. Be specific about the pain, not generic.

Return JSON: { "problem": string }`,
  },

  solution: {
    schema: z.object({
      solutions: z
        .array(
          z.object({
            title: z.string().max(100),
            description: z.string().max(400),
          }),
        )
        .min(2)
        .max(4),
    }),
    prompt: `Based on the product context below, write 2-4 short { title, description } entries
explaining how this specific product addresses the problem.

CRITICAL RULE: Every description MUST be grounded in a feature, capability, or design
decision explicitly mentioned in the README, manifest, or other supplied context. You
may not describe a feature you cannot point to in the supplied context. If the README
mentions a specific command, flag, integration, or architecture pattern, reference it.
If the README is sparse, produce fewer entries rather than fabricating features.

Write as if explaining to a developer who just learned the problem exists and is
evaluating whether this tool is worth their time. Be concrete, not promotional.

Return JSON: { "solutions": [{ "title": string, "description": string }] }`,
  },

  strengths: {
    schema: z.object({
      strengths: z.array(strengthEntrySchema).min(3).max(4),
    }),
    prompt: `Based on the product context below, write 3-4 strengths. Each entry has a "title"
(short label) and "signal" (1-2 sentences explaining the strength).

EVERY strength MUST reference a specific, real signal from the context. Acceptable
grounding sources:
- A README-stated capability (quote or paraphrase the feature name)
- A high sub-score with its actual number (e.g. "activityTrend: 85/100 — frequent releases")
- A specific dependency choice visible in the manifest (e.g. "uses PostgreSQL, not SQLite")
- A concrete stat from the context (e.g. "12k GitHub stars, 800 forks")
- A licensing detail (e.g. "MIT licensed, no copyleft restrictions")

REJECT generic strengths unless they are backed by something concrete:
- BAD: "Easy to use" (unless the README explicitly describes UX design choices)
- BAD: "Great performance" (unless benchmarks or numbers are in the context)
- GOOD: "Docker support via included Dockerfile" (if Dockerfile is present)
- GOOD: "MIT license allows unrestricted commercial use" (if license is MIT)

If you cannot find 3 genuinely grounded strengths, produce fewer entries. Never pad
the list with vague claims.

Return JSON: { "strengths": [{ "title": string, "signal": string }] }`,
  },

  tradeoffs: {
    schema: z.object({
      tradeoffs: z.array(tradeoffEntrySchema).min(3).max(4),
    }),
    prompt: `Based on the product context below, write 3-4 tradeoffs. Each entry has a "title"
(short label) and "detail" (1-2 sentences explaining the tradeoff).

EVERY tradeoff MUST map to one of:
(a) A genuinely low or middling sub-score in the scoreBreakdown. Cite the actual number.
    - selfHostingComplexity < 50 → name what makes it complex (e.g. "requires Redis, PostgreSQL,
      and a reverse proxy — not a single-binary deployment")
    - communityHealth < 40 → name the gap (e.g. "only 3 contributors in the last 6 months,
      issues go weeks without response")
    - dataExportCapability < 40 → name the missing export (e.g. "no built-in CSV/JSON export;
      you'll need to query the database directly")
    - activityTrend < 30 → name the staleness (e.g. "last release was 14 months ago")
    - licenseCompatibility < 50 → name the restriction (e.g. "AGPL-3.0 — if you modify and
      serve it, you must release your source")

(b) A real constraint findable in the README or manifest:
    - A specific dependency requirement (e.g. "requires Node.js 18+ and PostgreSQL 14+")
    - A licensing detail with version specificity (e.g. "Apache-2.0 with LLVM exception —
      not the same as plain Apache")
    - A known limitation stated in the README (e.g. "only supports Linux; macOS/Windows
      are experimental")

EXPLICITLY FORBIDDEN — no vague hedging:
- BAD: "May require some configuration"
- BAD: "Could be complex for beginners"
- GOOD: "Requires setting up a PostgreSQL database, Redis cache, and environment variables
  for JWT_SECRET, DATABASE_URL, and REDIS_URL"
- GOOD: "Self-hosting complexity score: 35/100 — the README lists 6 required services
  before the app starts"

If you cannot find 3 genuinely grounded tradeoffs, produce fewer entries. Never pad
the list with soft hedges.

Return JSON: { "tradeoffs": [{ "title": string, "detail": string }] }`,
  },

  tldr: {
    schema: z.object({
      tldr: z.string().max(300),
    }),
    prompt: `You have been given three previously-generated content sections for the same product:
"whoItsFor" (target personas), "problem" (the pain point), and "solution" (how this
product addresses it).

Write a single "tldr" sentence (max 2 sentences, under 300 characters) that synthesizes
all three sections. The tldr must:
1. Capture the core value proposition (from solution).
2. Hint at who it is for (from whoItsFor).
3. NOT introduce any new claims, features, or statistics not present in the three sections.

This is a synthesis task, not a free generation. Your output is constrained by the
preceding content. If a claim cannot be derived from the three sections, do not include it.

Return JSON: { "tldr": string }`,
  },

  versusAlternatives: {
    schema: z.object({
      comparisons: z.array(
        z.object({
          comparedProductId: z.number(),
          comparedProductName: z.string(),
          body: z.string().max(800),
          summary: z.string().max(200),
        }),
      ).min(1).max(3),
    }),
    prompt: `You are comparing the PRIMARY product against 2-3 comparison targets listed below.
Each comparison target has its own description, license, language, and score breakdown.

For EACH comparison target, write one paragraph (3-5 sentences) covering:
- What the PRIMARY product does better and why (cite specific score differences, license
  advantages, deployment model, or hosting cost implications).
- What the comparison target does better and why.
- The concrete decision factors a real engineering team would weigh.

RULES:
- Every claim MUST cite a real, verifiable difference visible in the data: license type
  (MIT vs AGPL vs Apache), deployment model (Docker vs manual), hosting cost implications
  (managed dependencies vs self-hosted), score sub-scores with actual numbers, language
  ecosystem, or feature presence/absence from the manifests.
- NEVER write generic "it depends" hedging. Be specific about the tradeoff.
- NEVER invent features, benchmarks, or stats not present in the context.
- Reference the score sub-scores by name and number when they differ meaningfully
  (>15 points).

For EACH comparison, end with EXACTLY one summary line matching this pattern:
"Teams that <specific need> typically choose <Product A>; teams that <specific need>
lean toward <Product B>."

The summary must name the actual products (not "X" or "Y") and describe a concrete
team profile, not a generic preference.

Return JSON: { "comparisons": [{ "comparedProductId": number, "comparedProductName": string, "body": string, "summary": string }] }`,
  },
}

// ── Content type ordering ─────────────────────────────────────────────────

const GENERATION_ORDER = ['whoItsFor', 'problem', 'solution', 'tldr', 'versusAlternatives'] as const

// ── Route handler ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest, { params }: RouteContext) {
  let ctx
  try {
    ctx = await requireStaff()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const productId = parseInt(id, 10)
  if (isNaN(productId)) {
    return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const parsed = generateContentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const { contentType } = parsed.data

  // ── installMethods: deterministic parse + LLM fallback ─────────────

  if (contentType === 'installMethods') {
    try {
      const productContext = await buildProductContext(productId)
      const methods = extractInstallMethods(productContext)

      const output = { methods }
      await upsertContent(productId, contentType, output, ctx.userId)
      await logAudit(ctx.userId, 'content.generated', 'product_content', `${productId}:installMethods`)

      const generatedCount = methods.filter((m) => !m.extracted).length
      const extractedCount = methods.filter((m) => m.extracted).length
      return NextResponse.json({
        success: true,
        contentType,
        productId,
        summary: { extracted: extractedCount, generated: generatedCount },
      })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Install methods extraction failed' },
        { status: 500 },
      )
    }
  }

  // ── Single content type generation ──────────────────────────────────

  if (contentType !== 'all') {
    const config = CONTENT_SCHEMAS[contentType]
    if (!config) {
      return NextResponse.json(
        {
          error: `Unknown content type "${contentType}". Available: ${Object.keys(CONTENT_SCHEMAS).join(', ')}, installMethods, all`,
        },
        { status: 400 },
      )
    }

    try {
      const { output, context, extraContext } = await generateOne(productId, contentType, config)
      await upsertContent(productId, contentType, output, ctx.userId)

      const warnings = runGroundingCheck(contentType, output, context, extraContext)

      await logAudit(ctx.userId, 'content.generated', 'product_content', `${productId}:${contentType}`)
      return NextResponse.json({ success: true, contentType, productId, warnings })
    } catch (err) {
      return NextResponse.json(
        { error: err instanceof Error ? err.message : 'Content generation failed' },
        { status: 500 },
      )
    }
  }

  // ── Batch: generate all content types in order ──────────────────────

  try {
    const productContext = await buildProductContext(productId)
    const baseMessage = formatContextForPrompt(productContext)
    const generated: Record<string, unknown> = {}
    const allWarnings: Record<string, GroundingResult[]> = {}

    for (const type of GENERATION_ORDER) {
      const config = CONTENT_SCHEMAS[type]
      let userMessage =
        type === 'tldr'
          ? buildTldrMessage(baseMessage, generated)
          : baseMessage

      let targetsContext: string | undefined
      if (type === 'versusAlternatives') {
        const targets = await findComparisonTargets(productId, 3)
        if (targets.length === 0) {
          // Skip — no comparison targets available
          continue
        }
        targetsContext = formatComparisonTargetsForPrompt(targets)
        userMessage += '\n\n' + targetsContext
      }

      const output = await generateStructured(
        `${SYSTEM_PROMPT}\n\n${config.prompt}`,
        userMessage,
        config.schema,
      )

      generated[type] = output
      await upsertContent(productId, type, output, ctx.userId)

      const warnings = runGroundingCheck(type, output, productContext, targetsContext)
      if (warnings.length > 0) allWarnings[type] = warnings
    }

    await logAudit(ctx.userId, 'content.generated', 'product_content', `${productId}:all`)
    return NextResponse.json({ success: true, contentType: 'all', productId, warnings: allWarnings })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Content generation failed' },
      { status: 500 },
    )
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function generateOne(
  productId: number,
  contentType: string,
  config: { schema: z.ZodType; prompt: string },
): Promise<{ output: unknown; context: ProductContext; extraContext?: string }> {
  const productContext = await buildProductContext(productId)
  let userMessage = formatContextForPrompt(productContext)
  let extraContext: string | undefined

  if (contentType === 'versusAlternatives') {
    const targets = await findComparisonTargets(productId, 3)
    if (targets.length === 0) {
      throw new Error('No comparison targets found — cannot generate versusAlternatives')
    }
    extraContext = formatComparisonTargetsForPrompt(targets)
    userMessage += '\n\n' + extraContext
  }

  const output = await generateStructured(
    `${SYSTEM_PROMPT}\n\n${config.prompt}`,
    userMessage,
    config.schema,
  )

  return { output, context: productContext, extraContext }
}

async function upsertContent(
  productId: number,
  contentType: string,
  output: unknown,
  staffId: string,
): Promise<void> {
  const existing = await db
    .select({ id: ProductContent.id })
    .from(ProductContent)
    .where(
      and(
        eq(ProductContent.productId, productId),
        eq(ProductContent.contentType, contentType),
      ),
    )
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(ProductContent)
      .set({
        output,
        model: 'claude-sonnet-4-20250514',
        generatedByStaffId: staffId,
        reviewStatus: 'draft',
        updatedAt: new Date(),
      })
      .where(eq(ProductContent.id, existing[0].id))
  } else {
    await db.insert(ProductContent).values({
      productId,
      contentType,
      output,
      model: 'claude-sonnet-4-20250514',
      generatedByStaffId: staffId,
    })
  }
}

function buildTldrMessage(
  baseContext: string,
  generated: Record<string, unknown>,
): string {
  const parts: string[] = [baseContext]

  parts.push('')
  parts.push('---')
  parts.push('## Previously generated content for this product:')
  parts.push('')

  if (generated.whoItsFor) {
    parts.push(`### whoItsFor\n${JSON.stringify(generated.whoItsFor, null, 2)}`)
    parts.push('')
  }
  if (generated.problem) {
    parts.push(`### problem\n${JSON.stringify(generated.problem, null, 2)}`)
    parts.push('')
  }
  if (generated.solution) {
    parts.push(`### solution\n${JSON.stringify(generated.solution, null, 2)}`)
    parts.push('')
  }

  parts.push('---')
  parts.push('Using ONLY the three sections above, write the tldr.')

  return parts.join('\n')
}

// ── Grounding check ───────────────────────────────────────────────────────

/**
 * Run the grounding heuristic on generated content. Extracts all text
 * strings from the output (handles objects with string fields) and checks
 * each against the context. Returns warnings for entries with no overlap.
 */
function runGroundingCheck(
  contentType: string,
  output: unknown,
  context: ProductContext,
  extraContext?: string,
): GroundingResult[] {
  const contextText = formatContextForPrompt(context) + (extraContext ? '\n\n' + extraContext : '')
  const texts = extractTexts(output)

  if (texts.length === 0) return []

  const results = checkGroundingBatch(texts, contextText)

  // Only flag for content types where grounding matters most
  const GROUNDED_TYPES = new Set(['strengths', 'tradeoffs', 'solution', 'versusAlternatives'])
  if (!GROUNDED_TYPES.has(contentType)) return []

  return results.filter((r) => !r.grounded)
}

/**
 * Recursively extract all string values from a nested object/array.
 */
function extractTexts(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (Array.isArray(value)) return value.flatMap(extractTexts)
  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(extractTexts)
  }
  return []
}
