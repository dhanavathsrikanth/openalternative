import { z } from 'zod'

// ── Tech categories ───────────────────────────────────────────────────────

export type TechCategory = 'Languages' | 'Frameworks' | 'Databases' | 'Infrastructure' | 'Cache'

export interface DetectedTech {
  category: TechCategory
  name: string
}

// ── Mapping table: dependency name → category ──────────────────────────────
// Keys are lowercase. A single dependency may map to one category only.

const MAPPING: Record<string, TechCategory> = {
  // ── Languages (runtime/build) ────────────────────────────────────────────
  typescript: 'Languages',
  ts: 'Languages',
  javascript: 'Languages',
  coffeeScript: 'Languages',
  python: 'Languages',
  go: 'Languages',
  golang: 'Languages',
  rust: 'Languages',
  ruby: 'Languages',
  php: 'Languages',
  java: 'Languages',
  kotlin: 'Languages',
  scala: 'Languages',
  swift: 'Languages',
  elixir: 'Languages',
  erlang: 'Languages',
  clojure: 'Languages',
  haskell: 'Languages',
  dotnet: 'Languages',
  'c#': 'Languages',
  csharp: 'Languages',

  // ── Frameworks (web, API, fullstack) ─────────────────────────────────────
  react: 'Frameworks',
  'react-dom': 'Frameworks',
  'react-native': 'Frameworks',
  next: 'Frameworks',
  nextjs: 'Frameworks',
  '@remix-run/react': 'Frameworks',
  remix: 'Frameworks',
  nuxt: 'Frameworks',
  nuxt3: 'Frameworks',
  vue: 'Frameworks',
  vuejs: 'Frameworks',
  angular: 'Frameworks',
  svelte: 'Frameworks',
  'solid-js': 'Frameworks',
  preact: 'Frameworks',
  gatsby: 'Frameworks',
  astro: 'Frameworks',
  '@angular/core': 'Frameworks',

  // Backend
  express: 'Frameworks',
  koa: 'Frameworks',
  fastify: 'Frameworks',
  hapi: 'Frameworks',
  nestjs: 'Frameworks',
  '@nestjs/core': 'Frameworks',
  hono: 'Frameworks',
  'express-session': 'Frameworks',
  graphql: 'Frameworks',
  'graphql-yoga': 'Frameworks',
  apollo: 'Frameworks',
  '@apollo/server': 'Frameworks',
  trpc: 'Frameworks',
  '@trpc/server': 'Frameworks',

  // Python frameworks
  django: 'Frameworks',
  flask: 'Frameworks',
  fastapi: 'Frameworks',
  starlette: 'Frameworks',
  tornado: 'Frameworks',
  sanic: 'Frameworks',
  litestar: 'Frameworks',
  uvicorn: 'Frameworks',
  gunicorn: 'Frameworks',

  // Go frameworks
  gin: 'Frameworks',
  echo: 'Frameworks',
  fiber: 'Frameworks',
  chi: 'Frameworks',
  gorilla: 'Frameworks',

  // Ruby frameworks
  rails: 'Frameworks',
  sinatra: 'Frameworks',
  hanami: 'Frameworks',

  // PHP frameworks
  laravel: 'Frameworks',
  symfony: 'Frameworks',
  yii: 'Frameworks',

  // Java/JVM frameworks
  spring: 'Frameworks',
  'spring-boot': 'Frameworks',
  micronaut: 'Frameworks',
  quarkus: 'Frameworks',

  // Rust frameworks
  actix: 'Frameworks',
  axum: 'Frameworks',
  rocket: 'Frameworks',
  warp: 'Frameworks',
  'tower-web': 'Frameworks',

  // ── Databases (drivers, ORMs, engines) ───────────────────────────────────
  // JS/TS
  pg: 'Databases',
  postgres: 'Databases',
  postgresql: 'Databases',
  'node-postgres': 'Databases',
  pgPromise: 'Databases',
  knex: 'Databases',
  prisma: 'Databases',
  '@prisma/client': 'Databases',
  drizzle: 'Databases',
  'drizzle-orm': 'Databases',
  typeorm: 'Databases',
  sequelize: 'Databases',
  mongoose: 'Databases',
  mongodb: 'Databases',
  'better-sqlite3': 'Databases',
  sqlite3: 'Databases',
  mysql2: 'Databases',
  mysql: 'Databases',
  mariadb: 'Databases',
  ioredis: 'Databases',
  redis: 'Databases',
  '@upstash/redis': 'Databases',
  kysely: 'Databases',
  '@libsql/client': 'Databases',
  turso: 'Databases',
  neon: 'Databases',
  '@neondatabase/serverless': 'Databases',
  dynamoose: 'Databases',
  '@aws-sdk/client-dynamodb': 'Databases',
  rethinkdb: 'Databases',
  arangojs: 'Databases',
  neo4j: 'Databases',
  '@neo4j/graphql': 'Databases',

  // Python
  psycopg2: 'Databases',
  'psycopg2-binary': 'Databases',
  sqlalchemy: 'Databases',
  alembic: 'Databases',
  peewee: 'Databases',
  tortoise: 'Databases',
  motor: 'Databases',
  'pymongo': 'Databases',
  redispy: 'Databases',
  'aioredis': 'Databases',

  // Go
  'pgx': 'Databases',
  'lib/pq': 'Databases',
  'go-sql-driver/mysql': 'Databases',
  'go-redis': 'Databases',
  gorm: 'Databases',
  sqlx: 'Databases',
  ent: 'Databases',
  bongodb: 'Databases',

  // Rust
  diesel: 'Databases',
  seaorm: 'Databases',
  redisrs: 'Databases',

  // Java
  jdbc: 'Databases',
  'spring-data-jpa': 'Databases',
  hibernate: 'Databases',

  // ── Infrastructure (runtime, deployment, messaging, object storage) ───────
  docker: 'Infrastructure',
  kubernetes: 'Infrastructure',
  k8s: 'Infrastructure',
  terraform: 'Infrastructure',
  ansible: 'Infrastructure',
  grafana: 'Infrastructure',
  prometheus: 'Infrastructure',
  nginx: 'Infrastructure',
  traefik: 'Infrastructure',
  caddy: 'Infrastructure',
  consul: 'Infrastructure',
  vault: 'Infrastructure',
  vercel: 'Infrastructure',
  netlify: 'Infrastructure',
  fly: 'Infrastructure',
  railway: 'Infrastructure',
  render: 'Infrastructure',
  cloudflare: 'Infrastructure',
  'cloudflare-workers': 'Infrastructure',
  aws: 'Infrastructure',
  gcp: 'Infrastructure',
  azure: 'Infrastructure',
  supabase: 'Infrastructure',
  firebase: 'Infrastructure',

  // Messaging / queues
  rabbitmq: 'Infrastructure',
  kafka: 'Infrastructure',
  'node-rdkafka': 'Infrastructure',
  bull: 'Infrastructure',
  bullmq: 'Infrastructure',
  'aws-sqs': 'Infrastructure',
  celery: 'Infrastructure',
  nats: 'Infrastructure',
  mosquitto: 'Infrastructure',

  // Object storage
  s3: 'Infrastructure',
  minio: 'Infrastructure',
  'aws-sdk': 'Infrastructure',
  'minio-js': 'Infrastructure',

  // ── Cache ────────────────────────────────────────────────────────────────
  memcached: 'Cache',
  'memjs': 'Cache',
  etcd: 'Cache',
  'keyv': 'Cache',
}

// ── Manifest parsers ──────────────────────────────────────────────────────

const packageJsonSchema = z.object({
  dependencies: z.record(z.string(), z.string()).optional(),
  devDependencies: z.record(z.string(), z.string()).optional(),
  peerDependencies: z.record(z.string(), z.string()).optional(),
  optionalDependencies: z.record(z.string(), z.string()).optional(),
})

function parsePackageJson(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    const data = packageJsonSchema.parse(parsed)
    return Object.keys({
      ...data.dependencies,
      ...data.peerDependencies,
      ...data.optionalDependencies,
    })
  } catch {
    return []
  }
}

function parseRequirementsTxt(raw: string): string[] {
  const deps: string[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) continue
    const name = trimmed.split(/[=<>!~\[]/)[0].trim().toLowerCase()
    if (name) deps.push(name)
  }
  return deps
}

function parseGoMod(raw: string): string[] {
  const deps: string[] = []
  let inRequire = false
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('require (')) { inRequire = true; continue }
    if (inRequire && trimmed === ')') { inRequire = false; continue }
    if (inRequire || trimmed.startsWith('require ')) {
      const part = trimmed.replace('require ', '').split('//')[0].trim()
      const tokens = part.split(/\s+/)
      if (tokens.length >= 1 && tokens[0] && !tokens[0].startsWith('//')) {
        const modPath = tokens[0]
        const name = modPath.split('/').pop() || modPath
        deps.push(name.toLowerCase())
      }
    }
  }
  return deps
}

function parseCargoToml(raw: string): string[] {
  const deps: string[] = []
  let inDeps = false
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (trimmed === '[dependencies]' || trimmed.startsWith('[dependencies.')) {
      inDeps = true
      if (trimmed.startsWith('[dependencies.')) {
        const name = trimmed.replace('[dependencies.', '').replace(']', '')
        if (name) deps.push(name)
      }
      continue
    }
    if (trimmed.startsWith('[') && inDeps) { inDeps = false }
    if (inDeps && trimmed) {
      const name = trimmed.split('=')[0]?.trim()
      if (name && !name.startsWith('#')) deps.push(name)
    }
  }
  return deps
}

function parseDockerfile(raw: string): string[] {
  const keywords: string[] = []
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const directive = trimmed.split(/\s/)[0]?.toUpperCase()
    if (directive) keywords.push(directive)
  }
  return keywords
}

function parseDockerCompose(raw: string): string[] {
  // Lightweight YAML image extraction without a YAML parser
  const images: string[] = []
  for (const line of raw.split('\n')) {
    const match = line.match(/image:\s*["']?([^"'\s]+)["']?/)
    if (match?.[1]) images.push(match[1])
  }
  return images
}

// ── Manifest type detection from file path ────────────────────────────────

export type ManifestType = 'packageJson' | 'requirementsTxt' | 'goMod' | 'cargoToml' | null

export function detectManifestType(filePath: string): ManifestType {
  const name = filePath.split('/').pop()?.toLowerCase() ?? ''
  if (name === 'package.json') return 'packageJson'
  if (name === 'requirements.txt') return 'requirementsTxt'
  if (name === 'go.mod') return 'goMod'
  if (name === 'cargo.toml') return 'cargoToml'
  return null
}

// ── GitHub raw fetcher (shared for normalize + content-gen) ────────────────

const GITHUB_RAW = 'https://raw.githubusercontent.com'

function githubHeaders(): HeadersInit {
  const h: HeadersInit = { Accept: 'application/vnd.github+json' }
  if (process.env.GITHUB_TOKEN) {
    h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`
  }
  return h
}

function parseGithubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
  if (!match) return null
  return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
}

async function fetchRawFile(
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  try {
    const res = await fetch(`${GITHUB_RAW}/${owner}/${repo}/${branch}/${path}`, {
      headers: githubHeaders(),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

// ── Core detection logic ──────────────────────────────────────────────────

function matchDependencies(deps: string[], detected: Map<TechCategory, Set<string>>) {
  for (const dep of deps) {
    const depLower = dep.toLowerCase()
    const category = MAPPING[depLower]
    if (category) {
      if (!detected.has(category)) detected.set(category, new Set())
      // Store the human-readable name (title-case from mapping)
      const name = dep.includes('/') ? dep.split('/').pop()! : dep
      detected.get(category)!.add(name)
    }
  }
}

function detectFromDockerfile(raw: string, detected: Map<TechCategory, Set<string>>): void {
  const directives = parseDockerfile(raw)
  if (directives.length === 0) return
  if (!detected.has('Infrastructure')) detected.set('Infrastructure', new Set())
  detected.get('Infrastructure')!.add('Docker')
}

function detectFromDockerCompose(raw: string, detected: Map<TechCategory, Set<string>>): void {
  const images = parseDockerCompose(raw)
  if (images.length === 0) return
  if (!detected.has('Infrastructure')) detected.set('Infrastructure', new Set())
  detected.get('Infrastructure')!.add('Docker Compose')
  for (const img of images) {
    const name = img.split(':')[0]?.split('/').pop()
    if (name) {
      // Well-known compose images
      if (name === 'postgres' || name === 'mysql' || name === 'mongo' || name === 'redis' || name === 'mariadb' || name === 'elasticsearch' || name === 'influxdb') {
        if (!detected.has('Databases')) detected.set('Databases', new Set())
        detected.get('Databases')!.add(name)
      }
    }
  }
}

export interface TechDetectionInput {
  packageManifest: string | null
  manifestType: string | null // 'packageJson' | 'requirementsTxt' | 'goMod' | 'cargoToml' | null
  dockerfile: string | null
  dockerCompose: string | null
  primaryLanguage: string | null
}

/**
 * Detect technologies from raw manifest content. Deterministic — no LLM.
 */
export function detectTechnologies(input: TechDetectionInput): DetectedTech[] {
  const detected = new Map<TechCategory, Set<string>>()

  // 1. Parse manifest into dependency names, then match against mapping
  if (input.packageManifest) {
    let deps: string[] = []
    switch (input.manifestType) {
      case 'packageJson':
        deps = parsePackageJson(input.packageManifest)
        break
      case 'requirementsTxt':
        deps = parseRequirementsTxt(input.packageManifest)
        break
      case 'goMod':
        deps = parseGoMod(input.packageManifest)
        break
      case 'cargoToml':
        deps = parseCargoToml(input.packageManifest)
        break
      default:
        // Try to auto-detect JSON (package.json / composer.json)
        try { deps = parsePackageJson(input.packageManifest) } catch { /* not JSON */ }
    }
    matchDependencies(deps, detected)
  }

  // 2. Dockerfile → Infrastructure
  if (input.dockerfile) detectFromDockerfile(input.dockerfile, detected)

  // 3. docker-compose → Infrastructure + Databases
  if (input.dockerCompose) detectFromDockerCompose(input.dockerCompose, detected)

  // 4. Infer language as a Languages entry if not already detected
  if (input.primaryLanguage) {
    const lang = input.primaryLanguage.toLowerCase()
    if (MAPPING[lang] === 'Languages') {
      if (!detected.has('Languages')) detected.set('Languages', new Set())
      detected.get('Languages')!.add(input.primaryLanguage)
    }
  }

  // 5. Flatten into sorted array
  const result: DetectedTech[] = []
  for (const [category, names] of detected) {
    for (const name of [...names].sort()) {
      result.push({ category, name })
    }
  }
  result.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name))
  return result
}

// ── Manifest candidates by language (mirrors context-builder) ─────────────

function getManifestCandidates(lang: string | null | undefined): string[] {
  switch (lang) {
    case 'typescript':
    case 'javascript':
      return ['package.json']
    case 'python':
      return ['requirements.txt', 'pyproject.toml', 'setup.py', 'setup.cfg', 'Pipfile']
    case 'go':
      return ['go.mod']
    case 'rust':
      return ['Cargo.toml']
    case 'ruby':
      return ['Gemfile']
    case 'php':
      return ['composer.json']
    case 'java':
    case 'kotlin':
      return ['pom.xml', 'build.gradle', 'build.gradle.kts']
    default:
      return ['package.json', 'requirements.txt', 'go.mod', 'Cargo.toml']
  }
}

/**
 * Detect technologies by fetching manifest files from GitHub.
 * Called during normalization — no LLM, just file fetch + pattern match.
 * Returns null if the product has no GitHub URL or the repo is unreachable.
 */
export async function detectTechFromGithub(
  githubUrl: string,
  primaryLanguage: string | null,
  defaultBranch?: string,
): Promise<DetectedTech[] | null> {
  const parsed = parseGithubUrl(githubUrl)
  if (!parsed) return null

  const { owner, repo } = parsed

  // Use provided defaultBranch or fall back to 'main'
  // The stored branch eliminates the need for an extra API call
  const branch = defaultBranch ?? 'main'

  // Fetch manifest
  let manifestContent: string | null = null
  let manifestType: ManifestType = null
  const candidates = getManifestCandidates(primaryLanguage)
  for (const path of candidates) {
    const content = await fetchRawFile(owner, repo, branch, path)
    if (content) {
      manifestContent = content
      manifestType = detectManifestType(path)
      break
    }
  }

  // Fetch Dockerfile
  let dockerfile: string | null = null
  for (const name of ['Dockerfile', 'docker/Dockerfile', 'Dockerfile.dev']) {
    const content = await fetchRawFile(owner, repo, branch, name)
    if (content) { dockerfile = content; break }
  }

  // Fetch docker-compose
  let dockerCompose: string | null = null
  for (const name of ['docker-compose.yml', 'docker-compose.yaml', 'compose.yml', 'compose.yaml']) {
    const content = await fetchRawFile(owner, repo, branch, name)
    if (content) { dockerCompose = content; break }
  }

  return detectTechnologies({
    packageManifest: manifestContent,
    manifestType,
    dockerfile,
    dockerCompose,
    primaryLanguage,
  })
}
