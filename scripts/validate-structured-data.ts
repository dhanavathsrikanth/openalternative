/**
 * Validates that the JSON-LD structured data produced by ProductJsonLd
 * conforms to Google's Rich Results requirements.
 *
 * Usage:
 *   npx tsx scripts/validate-structured-data.ts              # check all products with contentBlocks
 *   npx tsx scripts/validate-structured-data.ts --id 42      # check product #42
 *   npx tsx scripts/validate-structured-data.ts --sample 5    # check 5 random products
 *
 * For full end-to-end validation with Google:
 *   1. Run this script to check structural correctness
 *   2. Start dev server: npm run dev
 *   3. Visit https://search.google.com/test/rich-results
 *   4. Enter a product URL (e.g. http://localhost:3000/products/<slug>)
 *   5. Confirm FAQPage and HowTo rich results are detected
 */
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { neon } from '@neondatabase/serverless'
import { extractFaqPairs, extractInstallSteps } from '../src/lib/blocks/extract-structured-data'

const sql = neon(process.env.DATABASE_URL!)

// ── Schema.org validators ────────────────────────────────────────────────

interface ValidationResult {
  type: string
  valid: boolean
  errors: string[]
  warnings: string[]
}

function validateSoftwareApplication(data: Record<string, any>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (data['@type'] !== 'SoftwareApplication') errors.push(`@type must be "SoftwareApplication", got "${data['@type']}"`)
  if (!data.name) errors.push('name is required')
  if (!data.description) errors.push('description is required')
  if (!data.url) errors.push('url is required')
  if (data.applicationCategory !== 'DeveloperApplication') warnings.push(`applicationCategory is "${data.applicationCategory}", expected "DeveloperApplication"`)
  if (!data.operatingSystem) warnings.push('operatingSystem is recommended')

  if (data.aggregateRating) {
    const ar = data.aggregateRating
    if (ar['@type'] !== 'AggregateRating') errors.push('aggregateRating.@type must be "AggregateRating"')
    if (typeof ar.ratingValue !== 'number') errors.push('aggregateRating.ratingValue must be a number')
    if (ar.ratingValue < 1 || ar.ratingValue > 5) errors.push(`aggregateRating.ratingValue ${ar.ratingValue} is out of range 1-5`)
    if (ar.bestRating !== 5) warnings.push('bestRating should be 5')
  }

  return { type: 'SoftwareApplication', valid: errors.length === 0, errors, warnings }
}

function validateFaqPage(data: Record<string, any>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (data['@type'] !== 'FAQPage') errors.push(`@type must be "FAQPage", got "${data['@type']}"`)
  if (!Array.isArray(data.mainEntity) || data.mainEntity.length === 0) {
    errors.push('mainEntity must be a non-empty array')
  } else {
    for (let i = 0; i < data.mainEntity.length; i++) {
      const q = data.mainEntity[i]
      if (q['@type'] !== 'Question') errors.push(`mainEntity[${i}].@type must be "Question"`)
      if (!q.name) errors.push(`mainEntity[${i}].name (question text) is required`)
      if (!q.acceptedAnswer) {
        errors.push(`mainEntity[${i}].acceptedAnswer is required`)
      } else {
        if (q.acceptedAnswer['@type'] !== 'Answer') errors.push(`mainEntity[${i}].acceptedAnswer.@type must be "Answer"`)
        if (!q.acceptedAnswer.text) errors.push(`mainEntity[${i}].acceptedAnswer.text is required`)
      }
    }
  }

  return { type: 'FAQPage', valid: errors.length === 0, errors, warnings }
}

function validateHowTo(data: Record<string, any>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (data['@type'] !== 'HowTo') errors.push(`@type must be "HowTo", got "${data['@type']}"`)
  if (!data.name) warnings.push('name is recommended for HowTo')
  if (!Array.isArray(data.step) || data.step.length === 0) {
    errors.push('step must be a non-empty array')
  } else {
    for (let i = 0; i < data.step.length; i++) {
      const s = data.step[i]
      if (s['@type'] !== 'HowToStep') errors.push(`step[${i}].@type must be "HowToStep"`)
      if (!s.name) errors.push(`step[${i}].name is required`)
      if (!s.text) errors.push(`step[${i}].text is required`)
      if (typeof s.position !== 'number') warnings.push(`step[${i}].position should be a number`)
    }
  }

  return { type: 'HowTo', valid: errors.length === 0, errors, warnings }
}

// ── Main ─────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const idIdx = args.indexOf('--id')
  const singleId = idIdx !== -1 ? parseInt(args[idIdx + 1], 10) : undefined
  const sampleIdx = args.indexOf('--sample')
  const sampleCount = sampleIdx !== -1 ? parseInt(args[sampleIdx + 1], 10) : undefined

  // Fetch products with contentBlocks
  let products: { id: number; name: string; slug: string; contentBlocks: any; faq: any; installMethods: any }[]

  if (singleId) {
    const rows = await sql`
      SELECT id, name, slug, content_blocks as "contentBlocks", faq,
        (SELECT jsonb_agg(jsonb_build_object('label', pc.output->>'label', 'commands', pc.output->'commands'))
         FROM product_content pc
         WHERE pc.product_id = products.id AND pc.content_type = 'installMethods' AND pc.review_status = 'approved')
        as "installMethods"
      FROM products WHERE id = ${singleId}
    `
    products = rows as any[]
  } else if (sampleCount) {
    const rows = await sql`
      SELECT id, name, slug, content_blocks as "contentBlocks", faq,
        (SELECT jsonb_agg(jsonb_build_object('label', pc.output->>'label', 'commands', pc.output->'commands'))
         FROM product_content pc
         WHERE pc.product_id = products.id AND pc.content_type = 'installMethods' AND pc.review_status = 'approved')
        as "installMethods"
      FROM products
      WHERE content_blocks IS NOT NULL AND content_blocks::text != 'null' AND jsonb_array_length(content_blocks) > 0
      ORDER BY RANDOM()
      LIMIT ${sampleCount}
    `
    products = rows as any[]
  } else {
    const rows = await sql`
      SELECT id, name, slug, content_blocks as "contentBlocks", faq,
        (SELECT jsonb_agg(jsonb_build_object('label', pc.output->>'label', 'commands', pc.output->'commands'))
         FROM product_content pc
         WHERE pc.product_id = products.id AND pc.content_type = 'installMethods' AND pc.review_status = 'approved')
        as "installMethods"
      FROM products
      WHERE content_blocks IS NOT NULL AND content_blocks::text != 'null' AND jsonb_array_length(content_blocks) > 0
      ORDER BY id
    `
    products = rows as any[]
  }

  console.log(`Validating ${products.length} product(s)...\n`)

  let totalValid = 0
  let totalInvalid = 0

  for (const product of products) {
    const blocks = product.contentBlocks as unknown[] | null
    const legacyFaq = (Array.isArray(product.faq) ? product.faq : []) as { question: string; answer: string }[]
    const legacyInstall = (Array.isArray(product.installMethods) ? product.installMethods : []) as { label: string; commands: string[] }[]

    // Extract from contentBlocks (the new path)
    const blockFaq = extractFaqPairs(blocks)
    const blockInstall = extractInstallSteps(blocks)

    // Use contentBlocks extraction if available, fall back to legacy
    const faqPairs = blockFaq.length > 0 ? blockFaq : legacyFaq.filter((f) => f.question && f.answer)
    const installSteps = blockInstall.length > 0
      ? blockInstall
      : legacyInstall.map((m) => ({ label: m.label, commands: m.commands }))

    // Build the structured data (mirrors ProductJsonLd logic)
    const softwareApp = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: product.name,
      description: 'Product page',
      url: `https://forklane.dev/products/${product.slug}`,
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Cross-platform',
    }

    const schemas: Record<string, any>[] = [softwareApp]

    if (faqPairs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqPairs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      })
    }

    if (installSteps.length > 0) {
      schemas.push({
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: `How to install ${product.name}`,
        step: installSteps.map((s, i) => ({
          '@type': 'HowToStep',
          position: i + 1,
          name: s.label,
          text: s.commands.join('\n'),
        })),
      })
    }

    // Validate each schema
    const results: ValidationResult[] = []
    for (const schema of schemas) {
      switch (schema['@type']) {
        case 'SoftwareApplication': results.push(validateSoftwareApplication(schema)); break
        case 'FAQPage': results.push(validateFaqPage(schema)); break
        case 'HowTo': results.push(validateHowTo(schema)); break
      }
    }

    const allValid = results.every((r) => r.valid)
    const allErrors = results.flatMap((r) => r.errors)
    const allWarnings = results.flatMap((r) => r.warnings)

    if (allValid) totalValid++
    else totalInvalid++

    const icon = allValid ? '✓' : '✗'
    const schemaTypes = results.map((r) => r.type).join(', ')
    console.log(`${icon} #${product.id} ${product.name} (${product.slug})`)
    console.log(`  Schemas: ${schemaTypes}`)
    console.log(`  FAQ pairs: ${faqPairs.length}, Install steps: ${installSteps.length}`)

    if (allErrors.length > 0) {
      for (const e of allErrors) console.log(`    ERROR: ${e}`)
    }
    if (allWarnings.length > 0) {
      for (const w of allWarnings) console.log(`    WARN: ${w}`)
    }
    if (allValid && allWarnings.length === 0) {
      console.log(`  All checks passed`)
    }
    console.log('')
  }

  console.log('─'.repeat(60))
  console.log(`Total: ${totalValid} valid, ${totalInvalid} invalid out of ${products.length}`)

  if (totalInvalid > 0) {
    console.log('\nSome products have invalid structured data. Fix the issues above.')
    process.exit(1)
  } else {
    console.log('\nAll structured data is valid.')
    console.log('\nFor full Google validation:')
    console.log('  1. Start dev server: npm run dev')
    console.log('  2. Go to https://search.google.com/test/rich-results')
    console.log('  3. Enter a product URL (e.g. http://localhost:3000/products/<slug>)')
    console.log('  4. Confirm FAQPage and HowTo rich results are detected')
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
