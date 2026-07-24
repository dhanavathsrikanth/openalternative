/**
 * One-off migration script: move images from legacy Products.logoUrl / Products.screenshotUrls
 * into the product_assets table via Cloudflare Images.
 *
 * Usage:
 *   npx tsx scripts/migrate-images.ts [--dry-run] [--product-id=123]
 *
 * Requires env vars: DATABASE_URL, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN,
 *                    CLOUDFLARE_ACCOUNT_HASH
 *
 * Products that already have a product_assets row for a given type (logo/screenshot)
 * are skipped automatically.
 */

import { neon } from '@neondatabase/serverless'
import sharp from 'sharp'

// ── CLI flags ──────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run')
const PRODUCT_ID_FLAG = process.argv.find((a) => a.startsWith('--product-id='))
const SINGLE_PRODUCT_ID = PRODUCT_ID_FLAG ? parseInt(PRODUCT_ID_FLAG.split('=')[1]) : null

// ── Env vars ───────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL
const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN
const CF_ACCOUNT_HASH = process.env.CLOUDFLARE_ACCOUNT_HASH

if (!DATABASE_URL) throw new Error('DATABASE_URL is required')
if (!CF_ACCOUNT_ID) throw new Error('CLOUDFLARE_ACCOUNT_ID is required')
if (!CF_API_TOKEN) throw new Error('CLOUDFLARE_API_TOKEN is required')
if (!CF_ACCOUNT_HASH) throw new Error('CLOUDFLARE_ACCOUNT_HASH is required')

const sql = neon(DATABASE_URL)

const CF_UPLOAD_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`
const CF_DELETE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/images/v1`
const CF_IMAGE_URL = (id: string) => `https://imagedelivery.net/${CF_ACCOUNT_HASH}/${id}/public`

// ── Logging ────────────────────────────────────────────────────────────

interface Failure {
  productId: number
  productSlug: string
  type: 'logo' | 'screenshot'
  url: string
  error: string
}

const failures: Failure[] = []
let uploaded = 0
let skipped = 0

function log(msg: string) {
  const ts = new Date().toISOString().slice(11, 19)
  console.log(`[${ts}] ${msg}`)
}

// ── Core functions ─────────────────────────────────────────────────────

async function downloadImage(url: string): Promise<Buffer> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Forklane-ImageMigration/1.0',
        Accept: 'image/*',
      },
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`)
    }

    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image (Content-Type: ${contentType})`)
    }

    const arrayBuffer = await res.arrayBuffer()
    return Buffer.from(arrayBuffer)
  } finally {
    clearTimeout(timeout)
  }
}

async function stripAndConvert(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer).rotate().webp({ quality: 90 }).toBuffer()
}

async function uploadToCloudflare(buffer: Buffer): Promise<string> {
  const form = new FormData()
  form.append('file', new Blob([buffer], { type: 'image/webp' }), 'image.webp')

  const res = await fetch(CF_UPLOAD_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    body: form,
  })

  const data = await res.json() as {
    success: boolean
    errors: { code: number; message: string }[]
    result?: { id: string }
  }

  if (!data.success || !data.result?.id) {
    throw new Error(data.errors?.[0]?.message ?? 'Cloudflare upload failed')
  }

  return data.result.id
}

async function deleteFromCloudflare(assetId: string): Promise<void> {
  await fetch(`${CF_DELETE_URL}/${assetId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
  })
}

async function insertAsset(
  productId: number,
  type: 'logo' | 'screenshot',
  url: string,
  assetId: string,
): Promise<void> {
  await sql`
    INSERT INTO product_assets (product_id, type, url, asset_id)
    VALUES (${productId}, ${type}, ${url}, ${assetId})
  `
}

async function assetExists(productId: number, type: 'logo' | 'screenshot'): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM product_assets
    WHERE product_id = ${productId} AND type = ${type}
    LIMIT 1
  `
  return rows.length > 0
}

async function migrateImage(
  productId: number,
  productSlug: string,
  type: 'logo' | 'screenshot',
  url: string,
): Promise<void> {
  if (DRY_RUN) {
    log(`[DRY RUN] Would migrate ${type} for ${productSlug}: ${url}`)
    return
  }

  if (await assetExists(productId, type)) {
    log(`SKIP ${productSlug} ${type} — already exists in product_assets`)
    skipped++
    return
  }

  try {
    log(`Downloading ${type} for ${productSlug}: ${url}`)
    const raw = await downloadImage(url)

    if (raw.length < 100) {
      throw new Error('Downloaded file too small (< 100 bytes), likely not a valid image')
    }

    log(`Processing ${type} for ${productSlug} (${(raw.length / 1024).toFixed(0)} KB raw)`)
    const clean = await stripAndConvert(raw)

    log(`Uploading ${type} for ${productSlug} to Cloudflare Images`)
    const assetId = await uploadToCloudflare(clean)
    const finalUrl = CF_IMAGE_URL(assetId)

    await insertAsset(productId, type, finalUrl, assetId)
    log(`✓ ${productSlug} ${type} migrated → ${finalUrl}`)
    uploaded++
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log(`✗ FAILED ${productSlug} ${type}: ${msg}`)
    failures.push({ productId, productSlug, type, url, error: msg })
  }
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  log('Starting legacy image migration')
  log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)

  // Fetch products that have at least one legacy image URL
  let query
  if (SINGLE_PRODUCT_ID) {
    query = await sql`
      SELECT id, slug, logo_url, screenshot_urls
      FROM products
      WHERE id = ${SINGLE_PRODUCT_ID}
        AND (logo_url IS NOT NULL OR screenshot_urls IS NOT NULL)
    `
  } else {
    query = await sql`
      SELECT id, slug, logo_url, screenshot_urls
      FROM products
      WHERE logo_url IS NOT NULL OR screenshot_urls IS NOT NULL
    `
  }

  log(`Found ${query.length} product(s) with legacy image URLs`)

  for (const row of query) {
    const productId = row.id as number
    const slug = row.slug as string
    const logoUrl = row.logo_url as string | null
    const screenshotUrls = (row.screenshot_urls as string[] | null) ?? []

    if (logoUrl) {
      await migrateImage(productId, slug, 'logo', logoUrl)
    }

    for (const url of screenshotUrls) {
      if (url && url.trim()) {
        await migrateImage(productId, slug, 'screenshot', url.trim())
      }
    }
  }

  // ── Summary ────────────────────────────────────────────────────────
  log('')
  log('═══════════════════════════════════════════════')
  log(' Migration complete')
  log(`   Uploaded:  ${uploaded}`)
  log(`   Skipped:   ${skipped}`)
  log(`   Failed:    ${failures.length}`)
  log('═══════════════════════════════════════════════')

  if (failures.length > 0) {
    log('')
    log('FAILED URLs requiring manual follow-up:')
    log('─'.repeat(60))
    for (const f of failures) {
      log(`  Product:  ${f.productSlug} (id=${f.productId})`)
      log(`  Type:     ${f.type}`)
      log(`  URL:      ${f.url}`)
      log(`  Error:    ${f.error}`)
      log('')
    }

    // Write failures to a JSON file for easy tracking
    const reportPath = 'scripts/migrate-images-failures.json'
    const { writeFileSync } = await import('node:fs')
    writeFileSync(reportPath, JSON.stringify(failures, null, 2))
    log(`Failure report written to ${reportPath}`)
  }
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
