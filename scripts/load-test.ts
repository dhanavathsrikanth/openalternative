/**
 * scripts/load-test.ts
 *
 * Fires N concurrent requests at the search and product-page routes
 * and reports success/failure rates plus any connection-exhaustion errors.
 *
 * Usage:  npx tsx scripts/load-test.ts [baseUrl] [concurrency]
 *         Default: http://localhost:3000  concurrency=50
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000'
const CONCURRENCY = parseInt(process.argv[3] || '50', 10)

const ROUTES = [
  // Search API (hits DB every request)
  '/api/search?q=next',
  '/api/search?q=react&language=TypeScript',
  '/api/search?q=testing&license=MIT',
  // Product pages (SSR, hits DB)
  '/products',
  '/products/nextjs',
  '/products/react',
  '/categories',
  '/contributors',
]

interface Result {
  route: string
  status: number
  ok: boolean
  ms: number
  error?: string
}

async function fetchRoute(route: string): Promise<Result> {
  const url = `${BASE_URL}${route}`
  const start = performance.now()
  try {
    const res = await fetch(url, { cache: 'no-store' })
    const ms = Math.round(performance.now() - start)
    return { route, status: res.status, ok: res.ok, ms }
  } catch (err) {
    const ms = Math.round(performance.now() - start)
    return { route, status: 0, ok: false, ms, error: String(err) }
  }
}

async function main() {
  console.log(`Load test: ${CONCURRENCY} concurrent requests to ${BASE_URL}`)
  console.log(`Routes: ${ROUTES.length} (${ROUTES.join(', ')})`)
  console.log(`Total requests: ${CONCURRENCY * ROUTES.length}\n`)

  // Build the task list: repeat routes to fill the concurrency budget
  const tasks: string[] = []
  while (tasks.length < CONCURRENCY * ROUTES.length) {
    tasks.push(ROUTES[tasks.length % ROUTES.length])
  }

  const start = performance.now()
  const results = await Promise.all(tasks.map(fetchRoute))
  const elapsed = Math.round(performance.now() - start)

  // Summarise
  const succeeded = results.filter((r) => r.ok)
  const failed = results.filter((r) => !r.ok)
  const timeouts = failed.filter((r) => r.error?.includes('fetch failed') || r.error?.includes('timeout'))
  const connectionErrors = failed.filter(
    (r) =>
      r.error?.includes('connection') ||
      r.error?.includes('ECONNREFUSED') ||
      r.error?.includes('ENOTFOUND') ||
      r.error?.includes('socket hang up') ||
      r.error?.includes('exhausted'),
  )

  console.log('--- Results ---')
  console.log(`Total:     ${results.length}`)
  console.log(`Succeeded: ${succeeded.length} (${Math.round((succeeded.length / results.length) * 100)}%)`)
  console.log(`Failed:    ${failed.length}`)
  console.log(`  Timeouts/fetch errors: ${timeouts.length}`)
  console.log(`  Connection errors:     ${connectionErrors.length}`)
  console.log(`Elapsed:   ${elapsed}ms`)

  if (succeeded.length > 0) {
    const latencies = succeeded.map((r) => r.ms).sort((a, b) => a - b)
    console.log(`\nLatency (successful requests):`)
    console.log(`  p50: ${latencies[Math.floor(latencies.length * 0.5)]}ms`)
    console.log(`  p95: ${latencies[Math.floor(latencies.length * 0.95)]}ms`)
    console.log(`  p99: ${latencies[Math.floor(latencies.length * 0.99)]}ms`)
    console.log(`  max: ${latencies[latencies.length - 1]}ms`)
  }

  if (failed.length > 0) {
    console.log('\n--- Failed requests ---')
    // Group by status/error
    const byKey = new Map<string, Result[]>()
    for (const r of failed) {
      const key = r.error ? `error: ${r.error}` : `status ${r.status}`
      const group = byKey.get(key) ?? []
      group.push(r)
      byKey.set(key, group)
    }
    for (const [key, group] of byKey) {
      console.log(`  ${key} — ${group.length} request(s)`)
      for (const r of group.slice(0, 3)) {
        console.log(`    ${r.route} (${r.ms}ms)`)
      }
      if (group.length > 3) console.log(`    ... and ${group.length - 3} more`)
    }
  }

  // Exit code: 1 if any connection errors
  if (connectionErrors.length > 0) {
    console.log('\n❌ Connection exhaustion detected!')
    process.exit(1)
  }

  if (failed.length === 0) {
    console.log('\n✅ All requests succeeded — no connection-exhaustion errors.')
  } else {
    console.log(`\n⚠️  ${failed.length} request(s) failed (see above), but none were connection-exhaustion errors.`)
  }
}

main()
