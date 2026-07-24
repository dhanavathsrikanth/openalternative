/**
 * Deterministic parser for install instructions.
 *
 * Extracts real, maintainer-written commands from:
 * - Dockerfile (EXPOSE, RUN, CMD, ENTRYPOINT, docker build/run commands)
 * - docker-compose.yml (services, ports, volumes, env)
 * - README (install/setup sections with code blocks)
 *
 * Falls back to LLM-generated commands only when no explicit instructions
 * are found. Generated entries are flagged `generated: true` and carry
 * `needs_technical_review: true`.
 */

import type { ProductContext } from './context-builder'

// ── Types ─────────────────────────────────────────────────────────────────

export interface InstallMethod {
  method: 'docker' | 'package_manager' | 'source' | 'binary'
  label: string
  commands: string[]
  /** true = extracted verbatim from source; false = LLM-generated */
  extracted: boolean
  /** true = LLM-generated and needs someone to verify it works */
  needsTechnicalReview: boolean
  /** Human-readable note about where this was extracted from */
  source: string
}

// ── Dockerfile parser ─────────────────────────────────────────────────────

function parseDockerfile(content: string): InstallMethod | null {
  const lines = content.split('\n')
  const exposedPorts: string[] = []
  const runCommands: string[] = []
  let fromImage = ''
  let hasCmd = false
  let hasEntrypoint = false

  for (const raw of lines) {
    const line = raw.replace(/#.*/, '').trim()
    if (!line) continue

    const upper = line.toUpperCase()

    if (upper.startsWith('FROM ')) {
      fromImage = line.slice(5).trim().split(/\s+/)[0]
    } else if (upper.startsWith('EXPOSE ')) {
      exposedPorts.push(line.slice(7).trim())
    } else if (upper.startsWith('RUN ')) {
      runCommands.push(line.slice(4).trim())
    } else if (upper.startsWith('CMD ')) {
      hasCmd = true
    } else if (upper.startsWith('ENTRYPOINT ')) {
      hasEntrypoint = true
    }
  }

  if (!fromImage) return null

  const commands: string[] = []

  // docker build command
  commands.push(`docker build -t ${'<image-name>'} .`)

  // docker run command with exposed ports
  const portFlags = exposedPorts.map((p) => `-p ${p}:${p}`).join(' ')
  const runParts = ['docker run']
  if (portFlags) runParts.push(portFlags)
  if (exposedPorts.length > 0) runParts.push('-d')
  runParts.push(`<image-name>`)
  commands.push(runParts.join(' '))

  // Include the full Dockerfile as reference
  commands.push('')
  commands.push('# Full Dockerfile:')
  commands.push(content.trim())

  return {
    method: 'docker',
    label: `Docker (from ${fromImage})`,
    commands,
    extracted: true,
    needsTechnicalReview: false,
    source: 'Extracted from Dockerfile',
  }
}

// ── docker-compose.yml parser ─────────────────────────────────────────────

function parseDockerCompose(content: string): InstallMethod | null {
  // Simple YAML-ish extraction — we don't need a full YAML parser,
  // just enough to find services and ports.
  const services: { name: string; ports: string[]; image?: string }[] = []
  let currentService = ''
  let inServices = false

  for (const raw of content.split('\n')) {
    const line = raw.trimEnd()

    // Detect "services:" top-level key
    if (/^services\s*:/.test(line)) {
      inServices = true
      continue
    }

    if (!inServices) continue

    // Detect a service name (2-space indent, no further indent)
    const serviceMatch = line.match(/^  (\w[\w.-]*)\s*:/)
    if (serviceMatch && !line.match(/^\s{4,}/)) {
      currentService = serviceMatch[1]
      services.push({ name: currentService, ports: [] })
      continue
    }

    // Detect ports under a service
    const portsMatch = line.match(/^\s+ports\s*:/)
    if (portsMatch && currentService) {
      // Next lines may be list items
      continue
    }

    // Detect port list items like "  - '8080:8080'"
    const portItem = line.match(/^\s+-\s+['"]?(\d+:\d+)['"]?/)
    if (portItem && currentService) {
      const svc = services.find((s) => s.name === currentService)
      if (svc) svc.ports.push(portItem[1])
    }

    // Detect image
    const imageMatch = line.match(/^\s+image\s*:\s*['"]?([^'"\s]+)['"]?/)
    if (imageMatch && currentService) {
      const svc = services.find((s) => s.name === currentService)
      if (svc) svc.image = imageMatch[1]
    }
  }

  if (services.length === 0) return null

  const commands: string[] = []
  commands.push('docker compose up -d')

  // Add service details
  for (const svc of services) {
    const svcParts = [`# Service: ${svc.name}`]
    if (svc.image) svcParts.push(`# Image: ${svc.image}`)
    if (svc.ports.length > 0) svcParts.push(`# Ports: ${svc.ports.join(', ')}`)
    commands.push(svcParts.join('\n'))
  }

  return {
    method: 'docker',
    label: 'Docker Compose',
    commands,
    extracted: true,
    needsTechnicalReview: false,
    source: 'Extracted from docker-compose.yml',
  }
}

// ── README parser ─────────────────────────────────────────────────────────

const INSTALL_SECTION_PATTERNS = [
  /^#{1,3}\s+(?:installation|installing|install|getting\s+started|quick\s+start|setup|setup\s+and?\s*running)/im,
  /^#{1,3}\s+(?:prerequisites|requirements|dependencies)/im,
]

const CODE_BLOCK_RE = /```(?:bash|sh|shell|zsh|cmd|powershell)?\s*\n([\s\S]*?)```/gi

function parseReadme(content: string): InstallMethod[] {
  const methods: InstallMethod[] = []

  // Find install-related sections
  const lines = content.split('\n')
  let inInstallSection = false
  let sectionLines: string[] = []

  for (const line of lines) {
    const isHeading = /^#{1,3}\s/.test(line)

    if (isHeading) {
      // Check if this heading matches an install section
      if (INSTALL_SECTION_PATTERNS.some((p) => p.test(line))) {
        inInstallSection = true
        sectionLines = []
        continue
      } else if (inInstallSection) {
        // We've left the install section — process what we collected
        methods.push(...processInstallSection(sectionLines))
        inInstallSection = false
        sectionLines = []
      }
    }

    if (inInstallSection) {
      sectionLines.push(line)
    }
  }

  // Handle trailing install section
  if (inInstallSection && sectionLines.length > 0) {
    methods.push(...processInstallSection(sectionLines))
  }

  return methods
}

function processInstallSection(lines: string[]): InstallMethod[] {
  const methods: InstallMethod[] = []
  const sectionText = lines.join('\n')

  // Extract code blocks from the section
  let match: RegExpExecArray | null
  const codeBlockRe = new RegExp(CODE_BLOCK_RE.source, 'gi')

  while ((match = codeBlockRe.exec(sectionText)) !== null) {
    const block = match[1].trim()
    if (!block) continue

    const method = classifyCodeBlock(block)
    if (method) {
      methods.push(method)
    }
  }

  return methods
}

function classifyCodeBlock(block: string): InstallMethod | null {
  const lines = block.split('\n').filter((l) => l.trim())
  if (lines.length === 0) return null

  const firstLine = lines[0].toLowerCase()

  // Docker commands
  if (firstLine.startsWith('docker ') || firstLine.startsWith('docker-compose ')) {
    return {
      method: 'docker',
      label: 'Docker (from README)',
      commands: lines,
      extracted: true,
      needsTechnicalReview: false,
      source: 'Extracted from README install section',
    }
  }

  // npm/yarn/pnpm install
  if (/^(npm|yarn|pnpm|bun)\s+(install|add|ci)/.test(firstLine)) {
    return {
      method: 'package_manager',
      label: 'Package Manager (from README)',
      commands: lines,
      extracted: true,
      needsTechnicalReview: false,
      source: 'Extracted from README install section',
    }
  }

  // pip/poetry/conda
  if (/^(pip|pip3|poetry|conda)\s+(install|add)/.test(firstLine)) {
    return {
      method: 'package_manager',
      label: 'Package Manager (from README)',
      commands: lines,
      extracted: true,
      needsTechnicalReview: false,
      source: 'Extracted from README install section',
    }
  }

  // go install, cargo install, gem install, etc.
  if (/^(go|cargo|gem|brew|apt|yum|dnf|apk)\s+(install|add)/.test(firstLine)) {
    return {
      method: 'package_manager',
      label: 'Package Manager (from README)',
      commands: lines,
      extracted: true,
      needsTechnicalReview: false,
      source: 'Extracted from README install section',
    }
  }

  // git clone → source build
  if (firstLine.startsWith('git clone')) {
    return {
      method: 'source',
      label: 'Source Build (from README)',
      commands: lines,
      extracted: true,
      needsTechnicalReview: false,
      source: 'Extracted from README install section',
    }
  }

  // make / cmake / ./configure → source build
  if (/^(make|cmake|\.\/configure|cargo build|go build)/.test(firstLine)) {
    return {
      method: 'source',
      label: 'Source Build (from README)',
      commands: lines,
      extracted: true,
      needsTechnicalReview: false,
      source: 'Extracted from README install section',
    }
  }

  // Generic shell commands — might be install-related
  if (lines.length <= 5) {
    return {
      method: 'source',
      label: 'Setup (from README)',
      commands: lines,
      extracted: true,
      needsTechnicalReview: false,
      source: 'Extracted from README install section',
    }
  }

  return null
}

// ── LLM-generated fallback commands ───────────────────────────────────────

interface GenerateFallbackOptions {
  primaryLanguage: string | null
  packageManifest: string | null
  dockerfile: string | null
  dockerCompose: string | null
  name: string
  description: string
  license: string | null
}

function inferPackageManager(
  lang: string | null,
  manifest: string | null,
): { method: 'package_manager' | 'source' | 'binary'; label: string; commands: string[] } | null {
  const l = lang?.toLowerCase()

  // Check manifest contents for clues
  if (manifest) {
    if (manifest.includes('"dependencies"') || manifest.includes('"devDependencies"')) {
      // Detect lockfile-based managers
      if (manifest.includes('pnpm-lock.yaml') || manifest.includes('"packageManager"')) {
        return { method: 'package_manager', label: 'pnpm', commands: ['pnpm install'] }
      }
      return { method: 'package_manager', label: 'npm', commands: ['npm install'] }
    }
    if (manifest.includes('[project]') || manifest.includes('[tool.poetry]')) {
      return { method: 'package_manager', label: 'pip/poetry', commands: ['pip install -e .'] }
    }
    if (manifest.includes('module ') && manifest.includes('require ')) {
      return { method: 'package_manager', label: 'Go', commands: ['go install ./...'] }
    }
    if (manifest.includes('[package]') && manifest.includes('name =')) {
      return { method: 'package_manager', label: 'Cargo', commands: ['cargo install --path .'] }
    }
  }

  // Language-based fallback
  switch (l) {
    case 'typescript':
    case 'javascript':
      return { method: 'package_manager', label: 'npm', commands: ['npm install'] }
    case 'python':
      return { method: 'package_manager', label: 'pip', commands: ['pip install -e .'] }
    case 'go':
      return { method: 'package_manager', label: 'Go', commands: ['go install ./...'] }
    case 'rust':
      return { method: 'package_manager', label: 'Cargo', commands: ['cargo build --release'] }
    case 'ruby':
      return { method: 'package_manager', label: 'Bundler', commands: ['bundle install'] }
    case 'java':
    case 'kotlin':
      return { method: 'source', label: 'Gradle/Maven', commands: ['./gradlew build'] }
    default:
      return null
  }
}

function generateDockerFallback(opts: GenerateFallbackOptions): InstallMethod {
  const commands: string[] = []

  if (opts.dockerCompose) {
    commands.push('docker compose up -d')
  } else if (opts.dockerfile) {
    commands.push(`docker build -t ${opts.name.toLowerCase().replace(/\s+/g, '-')} .`)
    commands.push(`docker run -p 8080:8080 ${opts.name.toLowerCase().replace(/\s+/g, '-')}`)
  } else {
    commands.push(`# No Dockerfile found — create one or use another install method`)
  }

  return {
    method: 'docker',
    label: 'Docker (generated)',
    commands,
    extracted: false,
    needsTechnicalReview: true,
    source: 'Generated — no Dockerfile/docker-compose found in repository',
  }
}

function generatePackageManagerFallback(
  opts: GenerateFallbackOptions,
): InstallMethod | null {
  const pm = inferPackageManager(opts.primaryLanguage, opts.packageManifest)
  if (!pm) return null

  return {
    method: pm.method,
    label: `${pm.label} (generated)`,
    commands: pm.commands,
    extracted: false,
    needsTechnicalReview: true,
    source: `Generated from detected language: ${opts.primaryLanguage ?? 'unknown'}`,
  }
}

function generateSourceBuildFallback(
  opts: GenerateFallbackOptions,
): InstallMethod | null {
  const l = opts.primaryLanguage?.toLowerCase()

  let commands: string[] = []
  let label = 'Source Build (generated)'

  switch (l) {
    case 'go':
      commands = ['git clone <repo-url>', 'cd <repo>', 'go build -o . .']
      break
    case 'rust':
      commands = ['git clone <repo-url>', 'cd <repo>', 'cargo build --release']
      break
    case 'python':
      commands = ['git clone <repo-url>', 'cd <repo>', 'pip install -e .']
      break
    case 'typescript':
    case 'javascript':
      commands = ['git clone <repo-url>', 'cd <repo>', 'npm install', 'npm run build']
      break
    case 'ruby':
      commands = ['git clone <repo-url>', 'cd <repo>', 'bundle install']
      break
    default:
      return null
  }

  return {
    method: 'source',
    label,
    commands,
    extracted: false,
    needsTechnicalReview: true,
    source: `Generated from detected language: ${opts.primaryLanguage ?? 'unknown'}`,
  }
}

// ── Public API ────────────────────────────────────────────────────────────

/**
 * Parse the product's source material for install instructions.
 * Extracted commands take priority; LLM-generated fallbacks fill gaps.
 *
 * Generated entries always have `needs_technical_review: true`.
 */
export function extractInstallMethods(ctx: ProductContext): InstallMethod[] {
  const methods: InstallMethod[] = []
  const seenMethods = new Set<string>()

  // 1. Deterministic extraction — Dockerfile
  if (ctx.dockerfile) {
    const docker = parseDockerfile(ctx.dockerfile)
    if (docker) {
      methods.push(docker)
      seenMethods.add('docker')
    }
  }

  // 2. Deterministic extraction — docker-compose.yml
  if (ctx.dockerCompose) {
    const compose = parseDockerCompose(ctx.dockerCompose)
    if (compose) {
      methods.push(compose)
      seenMethods.add('docker')
    }
  }

  // 3. Deterministic extraction — README
  if (ctx.readme) {
    const readmeMethods = parseReadme(ctx.readme)
    for (const m of readmeMethods) {
      if (!seenMethods.has(m.method)) {
        methods.push(m)
        seenMethods.add(m.method)
      }
    }
  }

  // 4. LLM-generated fallbacks for missing methods
  const fallbackOpts: GenerateFallbackOptions = {
    primaryLanguage: ctx.primaryLanguage,
    packageManifest: ctx.packageManifest,
    dockerfile: ctx.dockerfile,
    dockerCompose: ctx.dockerCompose,
    name: ctx.name,
    description: ctx.description,
    license: ctx.license,
  }

  // Add package_manager fallback if not extracted
  if (!seenMethods.has('package_manager')) {
    const pmFallback = generatePackageManagerFallback(fallbackOpts)
    if (pmFallback) {
      methods.push(pmFallback)
    }
  }

  // Add source fallback if not extracted
  if (!seenMethods.has('source')) {
    const srcFallback = generateSourceBuildFallback(fallbackOpts)
    if (srcFallback) {
      methods.push(srcFallback)
    }
  }

  return methods
}
