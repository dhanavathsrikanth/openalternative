'use client'

import { useTranslations } from 'next-intl'

interface ComparisonData {
  productA: {
    name: string
    description: string
    license?: string | null
    primaryLanguage?: string | null
    deploymentMethods?: string[] | null
    githubUrl?: string | null
    homepageUrl?: string | null
    confidenceScore?: string | null
  }
  productB: {
    name: string
    description: string
    license?: string | null
    primaryLanguage?: string | null
    deploymentMethods?: string[] | null
    githubUrl?: string | null
    homepageUrl?: string | null
    confidenceScore?: string | null
  }
}

interface QABlock {
  question: string
  answer: string
}

function generateCompareQA(data: ComparisonData): QABlock[] {
  const { productA: a, productB: b } = data
  const blocks: QABlock[] = []

  blocks.push({
    question: `What are the differences between ${a.name} and ${b.name}?`,
    answer: buildDifferences(a, b),
  })

  blocks.push({
    question: `Which is better, ${a.name} or ${b.name}?`,
    answer: buildVerdict(a, b),
  })

  blocks.push({
    question: `Can I migrate from ${a.name} to ${b.name}?`,
    answer: buildMigration(a, b),
  })

  blocks.push({
    question: `What are the pros and cons of ${a.name} vs ${b.name}?`,
    answer: buildProsCons(a, b),
  })

  return blocks
}

function buildDifferences(
  a: ComparisonData['productA'],
  b: ComparisonData['productB'],
): string {
  const diffs: string[] = []

  if (a.license && b.license && a.license !== b.license) {
    diffs.push(`${a.name} uses ${a.license} while ${b.name} uses ${b.license}`)
  }

  if (a.primaryLanguage && b.primaryLanguage && a.primaryLanguage !== b.primaryLanguage) {
    diffs.push(`${a.name} is written in ${a.primaryLanguage}, whereas ${b.name} uses ${b.primaryLanguage}`)
  }

  if (
    a.deploymentMethods &&
    b.deploymentMethods &&
    JSON.stringify(a.deploymentMethods) !== JSON.stringify(b.deploymentMethods)
  ) {
    diffs.push(`${a.name} supports ${a.deploymentMethods.join(', ')} deployment, while ${b.name} supports ${b.deploymentMethods.join(', ')}`)
  }

  return diffs.length > 0 ? diffs.join('. ') + '.' : 'Both projects share similar characteristics.'
}

function buildVerdict(
  a: ComparisonData['productA'],
  b: ComparisonData['productB'],
): string {
  const scoreA = a.confidenceScore ? parseFloat(a.confidenceScore) : null
  const scoreB = b.confidenceScore ? parseFloat(b.confidenceScore) : null

  if (scoreA && scoreB) {
    if (scoreA > scoreB) {
      return `${a.name} has a higher confidence score (${scoreA.toFixed(0)} vs ${scoreB.toFixed(0)}), indicating stronger migration readiness. However, the best choice depends on your specific requirements, tech stack, and deployment preferences.`
    }
    if (scoreB > scoreA) {
      return `${b.name} has a higher confidence score (${scoreB.toFixed(0)} vs ${scoreA.toFixed(0)}), indicating stronger migration readiness. However, the best choice depends on your specific requirements, tech stack, and deployment preferences.`
    }
    return `Both projects have similar confidence scores. The choice between ${a.name} and ${b.name} depends on your specific requirements, tech stack, and deployment preferences.`
  }

  return `The best choice depends on your specific requirements, tech stack, and deployment preferences. Evaluate both projects based on your use case.`
}

function buildMigration(
  a: ComparisonData['productA'],
  b: ComparisonData['productB'],
): string {
  return `Yes, migration from ${a.name} to ${b.name} is possible. Review the documentation for both projects at ${a.homepageUrl || a.githubUrl || 'the project page'} and ${b.homepageUrl || b.githubUrl || 'the project page'}. Plan a phased migration: start with a proof-of-concept, migrate data, update integrations, and switch over.`
}

function buildProsCons(
  a: ComparisonData['productA'],
  b: ComparisonData['productA'],
): string {
  const prosA: string[] = []
  const prosB: string[] = []

  if (a.license && ['MIT', 'ISC', 'Apache-2.0'].includes(a.license)) {
    prosA.push(`${a.name} has a permissive ${a.license} license`)
  }
  if (b.license && ['MIT', 'ISC', 'Apache-2.0'].includes(b.license)) {
    prosB.push(`${b.name} has a permissive ${b.license} license`)
  }

  if (a.primaryLanguage) prosA.push(`${a.name} is built with ${a.primaryLanguage}`)
  if (b.primaryLanguage) prosB.push(`${b.name} is built with ${b.primaryLanguage}`)

  return `${prosA.length > 0 ? prosA.join('. ') + '.' : `${a.name} is a solid open-source option.`} ${prosB.length > 0 ? prosB.join('. ') + '.' : `${b.name} is a solid open-source option.`}`
}

export function ComparisonQA({ data }: { data: ComparisonData }) {
  const t = useTranslations('ComparisonQA')
  const blocks = generateCompareQA(data)

  return (
    <section className="rounded-xl border bg-card p-6 shadow-sm">
      <h2 className="mb-6 text-xl font-semibold">
        {t('heading')}
      </h2>
      <dl className="space-y-6">
        {blocks.map((block) => (
          <div key={block.question}>
            <dt className="font-medium">{block.question}</dt>
            <dd className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {block.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
