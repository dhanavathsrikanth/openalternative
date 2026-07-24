/**
 * Validation script: compares migrated block output against original
 * rigid-section content for a handful of products.
 *
 * Usage:
 *   npx tsx scripts/validate-migration.ts               # validate 3 random products
 *   npx tsx scripts/validate-migration.ts --id 42        # validate product #42
 *   npx tsx scripts/validate-migration.ts --all          # validate all products (verbose)
 *   npx tsx scripts/validate-migration.ts --dump-dir ./dump  # also write JSON files
 *
 * For each product, this script:
 *   1. Fetches the original approved product_content rows
 *   2. Runs the migration converter to produce blocks
 *   3. Extracts text content from the generated blocks
 *   4. Compares text content against the original data
 *   5. Reports any missing or mismatched content
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// ── Block helpers (mirrored from migrate-content-blocks.ts) ─────────────

function uid(): string {
  return crypto.randomUUID()
}

function txt(content: string, styles: Record<string, boolean> = {}) {
  return { type: 'text' as const, text: content, styles }
}

// ── Content-type converters (duplicated to keep validation self-contained) ─

function convertTldr(data: { tldr: string }): any[] {
  return [
    { id: uid(), type: 'heading', props: { level: 2 }, content: [txt('TL;DR')], children: [] },
    { id: uid(), type: 'paragraph', props: {}, content: [txt(data.tldr)], children: [] },
  ]
}

function convertWhoItsFor(data: { personas: { persona: string; useCase: string; skipIf: string }[] }): any[] {
  const blocks: any[] = [
    { id: uid(), type: 'heading', props: { level: 2 }, content: [txt("Who it's for")], children: [] },
  ]
  for (const p of data.personas) {
    const children: any[] = [
      { id: uid(), type: 'bulletListItem', props: {}, content: [txt(p.useCase)], children: [] },
    ]
    if (p.skipIf) {
      children.push({
        id: uid(), type: 'bulletListItem', props: {},
        content: [txt('Skip if: '), txt(p.skipIf, { italic: true })], children: [],
      })
    }
    blocks.push({
      id: uid(), type: 'callout', props: { variant: 'neutral', title: p.persona },
      content: [], children,
    })
  }
  return blocks
}

function convertProblem(data: { problem: string }): any[] {
  return [
    { id: uid(), type: 'heading', props: { level: 2 }, content: [txt('The problem it solves')], children: [] },
    { id: uid(), type: 'paragraph', props: {}, content: [txt(data.problem)], children: [] },
  ]
}

function convertSolution(data: { solutions: { title: string; description: string }[] }): any[] {
  const blocks: any[] = [
    { id: uid(), type: 'heading', props: { level: 2 }, content: [txt('How it solves it')], children: [] },
  ]
  for (const s of data.solutions) {
    blocks.push({
      id: uid(), type: 'callout', props: { variant: 'neutral', title: s.title },
      content: [], children: [
        { id: uid(), type: 'paragraph', props: {}, content: [txt(s.description)], children: [] },
      ],
    })
  }
  return blocks
}

function convertStrengthsTradeoffs(
  strengthsData: { strengths: { title: string; signal: string }[] },
  tradeoffsData: { tradeoffs: { title: string; detail: string }[] },
): any[] {
  const strengthChildren = (strengthsData.strengths || []).map((s) => ({
    id: uid(), type: 'bulletListItem' as const, props: {},
    content: [txt(`${s.title}: `, { bold: true }), txt(s.signal)], children: [],
  }))
  const tradeoffChildren = (tradeoffsData.tradeoffs || []).map((t) => ({
    id: uid(), type: 'bulletListItem' as const, props: {},
    content: [txt(`${t.title}: `, { bold: true }), txt(t.detail)], children: [],
  }))
  return [
    { id: uid(), type: 'heading', props: { level: 2 }, content: [txt('Strengths & trade-offs')], children: [] },
    {
      id: uid(), type: 'layout', props: { columnCount: '2', scrollMode: false }, content: [],
      children: [
        { id: uid(), type: 'callout', props: { variant: 'positive', title: 'Strengths' }, content: [], children: strengthChildren },
        { id: uid(), type: 'callout', props: { variant: 'negative', title: 'Trade-offs' }, content: [], children: tradeoffChildren },
      ],
    },
  ]
}

function convertVersusAlternatives(data: { comparisons: { comparedProductName: string; body: string; summary: string }[] }): any[] {
  const blocks: any[] = [
    { id: uid(), type: 'heading', props: { level: 2 }, content: [txt('Versus alternatives')], children: [] },
  ]
  for (const c of data.comparisons) {
    blocks.push(
      { id: uid(), type: 'heading', props: { level: 3 }, content: [txt(c.comparedProductName)], children: [] },
      { id: uid(), type: 'paragraph', props: {}, content: [txt(c.body)], children: [] },
    )
    if (c.summary) {
      blocks.push({ id: uid(), type: 'paragraph', props: {}, content: [txt(c.summary, { bold: true })], children: [] })
    }
  }
  return blocks
}

function convertInstallMethods(data: { methods: { label: string; commands: string[] }[] }): any[] {
  const blocks: any[] = [
    { id: uid(), type: 'heading', props: { level: 2 }, content: [txt('Install & self-host')], children: [] },
  ]
  for (const m of data.methods) {
    blocks.push({
      id: uid(), type: 'installCode', props: { language: 'bash', methodLabel: m.label },
      content: [{ type: 'text', text: m.commands.join('\n'), styles: {} }], children: [],
    })
  }
  return blocks
}

function convertFaq(faq: { question: string; answer: string }[]): any[] {
  const valid = faq.filter((f) => f.question && f.answer)
  if (valid.length === 0) return []
  return [{
    id: uid(), type: 'faqAccordion',
    props: { items: JSON.stringify(valid) }, content: [], children: [],
  }]
}

// ── Text extraction from blocks ──────────────────────────────────────────

function extractText(blocks: any[]): string {
  const lines: string[] = []
  for (const b of blocks) {
    if (b.content && Array.isArray(b.content)) {
      for (const ic of b.content) {
        if (ic.text) lines.push(ic.text)
      }
    }
    if (b.props?.title) lines.push(b.props.title)
    if (b.props?.items) {
      try {
        const items = JSON.parse(b.props.items)
        for (const item of items) {
          if (item.question) lines.push(item.question)
          if (item.answer) lines.push(item.answer)
          if (item.text) lines.push(item.text)
        }
      } catch { /* skip */ }
    }
    if (b.children) lines.push(extractText(b.children))
  }
  return lines.join('\n')
}

// ── Validation ───────────────────────────────────────────────────────────

interface CheckResult {
  section: string
  passed: boolean
  detail: string
}

function validateProduct(productId: number, content: Record<string, any>, faq: any[], blocks: any[]): CheckResult[] {
  const results: CheckResult[] = []
  const blockText = extractText(blocks)

  // TL;DR
  if (content.tldr) {
    const original = content.tldr.tldr
    const found = blockText.includes(original)
    results.push({ section: 'TL;DR', passed: found, detail: found ? 'OK' : `Missing text: "${original.slice(0, 80)}..."` })
  }

  // Who it's for
  if (content.whoItsFor) {
    for (const p of content.whoItsFor.personas) {
      const personaOk = blockText.includes(p.persona)
      const useCaseOk = blockText.includes(p.useCase)
      const skipOk = !p.skipIf || blockText.includes(p.skipIf)
      results.push({
        section: `WhoItsFor/${p.persona}`,
        passed: personaOk && useCaseOk && skipOk,
        detail: [
          personaOk ? null : `missing persona "${p.persona}"`,
          useCaseOk ? null : `missing useCase "${p.useCase.slice(0, 60)}"`,
          skipOk ? null : `missing skipIf "${p.skipIf.slice(0, 60)}"`,
        ].filter(Boolean).join(', ') || 'OK',
      })
    }
  }

  // Problem
  if (content.problem) {
    const original = content.problem.problem
    const found = blockText.includes(original)
    results.push({ section: 'Problem', passed: found, detail: found ? 'OK' : `Missing problem text` })
  }

  // Solution
  if (content.solution) {
    for (const s of content.solution.solutions) {
      const titleOk = blockText.includes(s.title)
      const descOk = blockText.includes(s.description)
      results.push({
        section: `Solution/${s.title}`,
        passed: titleOk && descOk,
        detail: titleOk && descOk ? 'OK' : `missing ${!titleOk ? 'title' : 'description'}`,
      })
    }
  }

  // Strengths
  if (content.strengths) {
    for (const s of content.strengths.strengths) {
      const found = blockText.includes(s.title) && blockText.includes(s.signal)
      results.push({ section: `Strength/${s.title}`, passed: found, detail: found ? 'OK' : 'missing content' })
    }
  }

  // Tradeoffs
  if (content.tradeoffs) {
    for (const t of content.tradeoffs.tradeoffs) {
      const found = blockText.includes(t.title) && blockText.includes(t.detail)
      results.push({ section: `Tradeoff/${t.title}`, passed: found, detail: found ? 'OK' : 'missing content' })
    }
  }

  // Versus alternatives
  if (content.versusAlternatives) {
    for (const c of content.versusAlternatives.comparisons) {
      const nameOk = blockText.includes(c.comparedProductName)
      const bodyOk = blockText.includes(c.body)
      results.push({
        section: `Versus/${c.comparedProductName}`,
        passed: nameOk && bodyOk,
        detail: nameOk && bodyOk ? 'OK' : `missing ${!nameOk ? 'name' : 'body'}`,
      })
    }
  }

  // Install methods
  if (content.installMethods) {
    for (const m of content.installMethods.methods) {
      const labelOk = blockText.includes(m.label)
      const cmdsOk = m.commands.every((c: string) => blockText.includes(c))
      results.push({
        section: `Install/${m.label}`,
        passed: labelOk && cmdsOk,
        detail: labelOk && cmdsOk ? 'OK' : `missing ${!labelOk ? 'label' : 'commands'}`,
      })
    }
  }

  // Custom FAQ
  if (faq.length > 0) {
    const validFaq = faq.filter((f) => f.question && f.answer)
    for (const f of validFaq) {
      const found = blockText.includes(f.question) && blockText.includes(f.answer)
      results.push({ section: `FAQ/${f.question.slice(0, 50)}`, passed: found, detail: found ? 'OK' : 'missing content' })
    }
  }

  return results
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const all = args.includes('--all')
  const idIdx = args.indexOf('--id')
  const singleId = idIdx !== -1 ? parseInt(args[idIdx + 1], 10) : undefined
  const dumpDirIdx = args.indexOf('--dump-dir')
  const dumpDir = dumpDirIdx !== -1 ? args[dumpDirIdx + 1] : undefined

  if (dumpDir) {
    const fs = await import('fs')
    if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true })
  }

  // Determine product IDs to validate
  let productIds: number[]

  if (singleId) {
    productIds = [singleId]
  } else if (all) {
    const rows = await sql`
      SELECT DISTINCT product_id
      FROM product_content
      WHERE review_status = 'approved'
    ` as { product_id: number }[]
    productIds = rows.map((r) => r.product_id)
  } else {
    // Random sample of 3
    const rows = await sql`
      SELECT DISTINCT product_id
      FROM product_content
      WHERE review_status = 'approved'
      ORDER BY RANDOM()
      LIMIT 3
    ` as { product_id: number }[]
    productIds = rows.map((r) => r.product_id)
  }

  console.log(`Validating ${productIds.length} product(s)...\n`)

  let totalChecks = 0
  let passed = 0
  let failed = 0

  for (const pid of productIds) {
    const contentRows = await sql`
      SELECT content_type, output FROM product_content
      WHERE product_id = ${pid} AND review_status = 'approved'
    ` as { content_type: string; output: any }[]

    const [product] = await sql`
      SELECT id, name, slug, faq FROM products WHERE id = ${pid}
    ` as { id: number; name: string; slug: string; faq: any }[]

    if (!product) {
      console.log(`#${pid}: product not found, skipping\n`)
      continue
    }

    const content: Record<string, any> = {}
    for (const row of contentRows) {
      content[row.content_type] = row.output
    }

    const faq = (Array.isArray(product.faq) ? product.faq : []) as { question: string; answer: string }[]

    // Build blocks (same logic as migration script)
    const blocks: any[] = []
    if (content.tldr) blocks.push(...convertTldr(content.tldr))
    if (content.whoItsFor) blocks.push(...convertWhoItsFor(content.whoItsFor))
    if (content.problem) blocks.push(...convertProblem(content.problem))
    if (content.solution) blocks.push(...convertSolution(content.solution))
    if (content.strengths && content.tradeoffs) blocks.push(...convertStrengthsTradeoffs(content.strengths, content.tradeoffs))
    if (content.versusAlternatives) blocks.push(...convertVersusAlternatives(content.versusAlternatives))
    if (content.installMethods) blocks.push(...convertInstallMethods(content.installMethods))
    blocks.push(...convertFaq(faq))

    // Dump JSON if requested
    if (dumpDir) {
      const fs = await import('fs')
      fs.writeFileSync(
        `${dumpDir}/${product.slug}.json`,
        JSON.stringify({ productId: pid, name: product.name, slug: product.slug, blocks }, null, 2),
      )
    }

    // Validate
    const results = validateProduct(pid, content, faq, blocks)
    const productPassed = results.filter((r) => r.passed).length
    const productFailed = results.filter((r) => !r.passed).length
    totalChecks += results.length
    passed += productPassed
    failed += productFailed

    const status = productFailed === 0 ? '✓' : '✗'
    const typeCounts = blocks.reduce((acc: Record<string, number>, b: any) => {
      acc[b.type] = (acc[b.type] || 0) + 1
      return acc
    }, {})

    console.log(`${status} #${pid} ${product.name} (${product.slug})`)
    console.log(`  Blocks: ${blocks.length} (${Object.entries(typeCounts).map(([t, c]) => `${t}×${c}`).join(', ')})`)
    console.log(`  Checks: ${productPassed} passed, ${productFailed} failed`)

    for (const r of results.filter((r) => !r.passed)) {
      console.log(`    ✗ ${r.section}: ${r.detail}`)
    }
    console.log('')
  }

  console.log('─'.repeat(60))
  console.log(`Total: ${passed} passed, ${failed} failed out of ${totalChecks} checks`)

  if (failed > 0) {
    console.log('\nSome checks failed. Review the issues above before running --apply.')
    process.exit(1)
  } else {
    console.log('\nAll checks passed. Safe to run --apply on the migration script.')
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
