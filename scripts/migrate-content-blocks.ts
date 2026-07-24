/**
 * One-off migration: converts rigid product_content fields + custom FAQs
 * into the block-based contentBlocks structure.
 *
 * Usage:
 *   npx tsx scripts/migrate-content-blocks.ts              # dry-run (preview only)
 *   npx tsx scripts/migrate-content-blocks.ts --apply      # write to DB
 *   npx tsx scripts/migrate-content-blocks.ts --limit 5    # only first 5 products
 *   npx tsx scripts/migrate-content-blocks.ts --id 42      # only product #42
 *   npx tsx scripts/migrate-content-blocks.ts --dump       # output JSON blocks to stdout
 *   npx tsx scripts/migrate-content-blocks.ts --dump-dir ./dump  # write JSON files to directory
 *
 * Recommended validation workflow:
 *   1. Dry-run a few products:        npx tsx scripts/migrate-content-blocks.ts --limit 3
 *   2. Dump blocks for manual review:  npx tsx scripts/migrate-content-blocks.ts --limit 3 --dump-dir ./dump
 *   3. Spot-check one product:         npx tsx scripts/migrate-content-blocks.ts --id 42 --dump
 *   4. Apply after confirmation:       npx tsx scripts/migrate-content-blocks.ts --apply
 *   5. Full apply:                     npx tsx scripts/migrate-content-blocks.ts --apply
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// ── Block helpers ───────────────────────────────────────────────────────────

function uid(): string {
  return crypto.randomUUID()
}

function txt(content: string, styles: Record<string, boolean> = {}): { type: 'text'; text: string; styles: Record<string, boolean> } {
  return { type: 'text', text: content, styles }
}

// ── Content-type converters ─────────────────────────────────────────────────

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
        id: uid(),
        type: 'bulletListItem',
        props: {},
        content: [txt('Skip if: '), txt(p.skipIf, { italic: true })],
        children: [],
      })
    }
    blocks.push({
      id: uid(),
      type: 'callout',
      props: { variant: 'neutral', title: p.persona },
      content: [],
      children,
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
      id: uid(),
      type: 'callout',
      props: { variant: 'neutral', title: s.title },
      content: [],
      children: [
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
    id: uid(),
    type: 'bulletListItem' as const,
    props: {},
    content: [txt(`${s.title}: `, { bold: true }), txt(s.signal)],
    children: [],
  }))

  const tradeoffChildren = (tradeoffsData.tradeoffs || []).map((t) => ({
    id: uid(),
    type: 'bulletListItem' as const,
    props: {},
    content: [txt(`${t.title}: `, { bold: true }), txt(t.detail)],
    children: [],
  }))

  return [
    { id: uid(), type: 'heading', props: { level: 2 }, content: [txt('Strengths & trade-offs')], children: [] },
    {
      id: uid(),
      type: 'layout',
      props: { columnCount: '2', scrollMode: false },
      content: [],
      children: [
        {
          id: uid(),
          type: 'callout',
          props: { variant: 'positive', title: 'Strengths' },
          content: [],
          children: strengthChildren,
        },
        {
          id: uid(),
          type: 'callout',
          props: { variant: 'negative', title: 'Trade-offs' },
          content: [],
          children: tradeoffChildren,
        },
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
      blocks.push({
        id: uid(),
        type: 'paragraph',
        props: {},
        content: [txt(c.summary, { bold: true })],
        children: [],
      })
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
      id: uid(),
      type: 'installCode',
      props: { language: 'bash', methodLabel: m.label },
      content: [{ type: 'text', text: m.commands.join('\n'), styles: {} }],
      children: [],
    })
  }
  return blocks
}

function convertFaq(faq: { question: string; answer: string }[]): any[] {
  const valid = faq.filter((f) => f.question && f.answer)
  if (valid.length === 0) return []
  return [
    {
      id: uid(),
      type: 'faqAccordion',
      props: { items: JSON.stringify(valid) },
      content: [],
      children: [],
    },
  ]
}

// ── Per-product migration ───────────────────────────────────────────────────

async function migrateProduct(productId: number): Promise<any[] | null> {
  // Fetch all approved content rows for this product
  const contentRows = await sql`
    SELECT content_type, output
    FROM product_content
    WHERE product_id = ${productId} AND review_status = 'approved'
  ` as { content_type: string; output: any }[]

  // Fetch the product itself (for custom FAQ)
  const [product] = await sql`
    SELECT id, name, slug, faq
    FROM products
    WHERE id = ${productId}
  ` as { id: number; name: string; slug: string; faq: any }[]

  if (!product) return null

  const content: Record<string, any> = {}
  for (const row of contentRows) {
    content[row.content_type] = row.output
  }

  const blocks: any[] = []

  // Build blocks in the same order as ProductPage's section rendering
  if (content.tldr) blocks.push(...convertTldr(content.tldr))
  if (content.whoItsFor) blocks.push(...convertWhoItsFor(content.whoItsFor))
  if (content.problem) blocks.push(...convertProblem(content.problem))
  if (content.solution) blocks.push(...convertSolution(content.solution))
  if (content.strengths && content.tradeoffs) {
    blocks.push(...convertStrengthsTradeoffs(content.strengths, content.tradeoffs))
  }
  if (content.versusAlternatives) blocks.push(...convertVersusAlternatives(content.versusAlternatives))
  if (content.installMethods) blocks.push(...convertInstallMethods(content.installMethods))

  // Custom FAQ always appears at the end
  const customFaq = (Array.isArray(product.faq) ? product.faq : []) as { question: string; answer: string }[]
  blocks.push(...convertFaq(customFaq))

  return blocks.length > 0 ? blocks : null
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const apply = args.includes('--apply')
  const dump = args.includes('--dump')
  const dumpDirIdx = args.indexOf('--dump-dir')
  const dumpDir = dumpDirIdx !== -1 ? args[dumpDirIdx + 1] : undefined
  const limitIdx = args.indexOf('--limit')
  const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : undefined
  const idIdx = args.indexOf('--id')
  const singleId = idIdx !== -1 ? parseInt(args[idIdx + 1], 10) : undefined

  if (dumpDir) {
    const fs = await import('fs')
    if (!fs.existsSync(dumpDir)) fs.mkdirSync(dumpDir, { recursive: true })
  }

  const modeLabel = apply ? 'WRITE' : dump ? 'DUMP' : 'DRY-RUN (preview only)'
  console.log(`Mode: ${modeLabel}${limit ? ` (limit: ${limit})` : ''}${singleId ? ` (product #${singleId})` : ''}`)
  console.log('')

  let allProductIds: number[]

  if (singleId) {
    allProductIds = [singleId]
  } else {
    // Find product IDs that have approved content rows
    const contentProducts = await sql`
      SELECT DISTINCT product_id
      FROM product_content
      WHERE review_status = 'approved'
    ` as { product_id: number }[]

    const uniqueIds = new Set(contentProducts.map((r) => r.product_id))

    // Also include products with custom FAQ data
    const faqProducts = await sql`
      SELECT id
      FROM products
      WHERE faq IS NOT NULL
        AND faq::text != 'null'
        AND jsonb_array_length(faq) > 0
    ` as { id: number }[]

    for (const r of faqProducts) uniqueIds.add(r.id)

    allProductIds = [...uniqueIds]
    if (limit) allProductIds.length = Math.min(allProductIds.length, limit)
  }

  console.log(`Found ${allProductIds.length} products with content to migrate\n`)

  let migrated = 0
  let skipped = 0

  for (const productId of allProductIds) {
    try {
      const blocks = await migrateProduct(productId)

      if (!blocks) {
        skipped++
        continue
      }

      // Fetch product name for logging
      const [product] = await sql`SELECT name, slug FROM products WHERE id = ${productId}` as { name: string; slug: string }[]

      console.log(`✓ #${productId} ${product?.name ?? '?'} (${product?.slug ?? '?'}) → ${blocks.length} blocks`)

      // Show a summary of block types
      const typeCounts = blocks.reduce((acc: Record<string, number>, b: any) => {
        acc[b.type] = (acc[b.type] || 0) + 1
        return acc
      }, {})
      console.log(`  Types: ${Object.entries(typeCounts).map(([t, c]) => `${t}×${c}`).join(', ')}`)

      if (apply) {
        const blocksJson = JSON.stringify(blocks)
        await sql`
          UPDATE products
          SET content_blocks = ${blocksJson}::jsonb,
              content_updated_at = NOW()
          WHERE id = ${productId}
        `
        console.log(`  → Written to DB`)
      }

      if (dump) {
        console.log(JSON.stringify({ productId, name: product?.name, slug: product?.slug, blocks }, null, 2))
      }

      if (dumpDir) {
        const fs = await import('fs')
        const path = `${dumpDir}/${product?.slug ?? productId}.json`
        fs.writeFileSync(path, JSON.stringify({ productId, name: product?.name, slug: product?.slug, blocks }, null, 2))
        console.log(`  → Dumped to ${path}`)
      }

      migrated++
      console.log('')
    } catch (err) {
      console.error(`✗ #${productId} failed:`, err)
    }
  }

  console.log('─'.repeat(60))
  console.log(`Done. ${migrated} migrated, ${skipped} skipped (no content).`)
  if (!apply) {
    console.log('\nThis was a dry-run. To write changes, run again with --apply.')
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
