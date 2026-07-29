'use client'

import { useTranslations } from 'next-intl'
import type { Product } from '@/app/db/schema'
import { SectionHeading } from '@/components/product/SectionHeading'
import { ProductCard } from '@/components/product/ProductCard'

interface Props {
  product: Product
}

interface QABlock {
  question: string
  answer: string
}

function generateQA(product: Product, t: ReturnType<typeof useTranslations>): QABlock[] {
  const blocks: QABlock[] = []

  blocks.push({
    question: t('whatIs', { name: product.name }),
    answer: product.description,
  })

  const audience = buildAudience(product)
  blocks.push({
    question: t('whoIsFor', { name: product.name }),
    answer: audience,
  })

  const pros = buildPros(product)
  blocks.push({
    question: t('prosOf', { name: product.name }),
    answer: pros,
  })

  const cons = buildCons(product)
  blocks.push({
    question: t('consOf', { name: product.name }),
    answer: cons,
  })

  const migration = buildMigrationPath(product)
  blocks.push({
    question: t('migrateTo', { name: product.name }),
    answer: migration,
  })

  return blocks
}

function buildAudience(p: Product): string {
  const parts: string[] = []

  if (p.primaryLanguage) {
    parts.push(`${p.primaryLanguage} developers`)
  }

  if (p.deploymentMethods?.includes('docker')) {
    parts.push('teams looking for containerized deployment')
  }

  if (p.deploymentMethods?.includes('npm')) {
    parts.push('JavaScript/TypeScript projects')
  }

  if (p.deploymentMethods?.includes('pip')) {
    parts.push('Python projects')
  }

  if (p.deploymentMethods?.includes('cargo')) {
    parts.push('Rust projects')
  }

  if (parts.length === 0) {
    parts.push('developers looking for an open-source alternative')
  }

  return `${p.name} is ideal for ${parts.join(', ')}.`
}

function buildPros(p: Product): string {
  const pros: string[] = []

  if (p.license) {
    const permissive = ['MIT', 'ISC', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause']
    if (permissive.includes(p.license)) {
      pros.push(`Permissive ${p.license} license`)
    } else {
      pros.push(`Available under ${p.license} license`)
    }
  }

  if (p.confidenceScore && parseFloat(p.confidenceScore) >= 70) {
    pros.push('High migration confidence score')
  }

  if (p.githubUrl) {
    pros.push('Active open-source community')
  }

  if (p.deploymentMethods && p.deploymentMethods.length > 0) {
    pros.push(`Multiple deployment options: ${p.deploymentMethods.join(', ')}`)
  }

  if (p.primaryLanguage) {
    pros.push(`Written in ${p.primaryLanguage}`)
  }

  return pros.length > 0 ? pros.join('. ') + '.' : 'Open-source and free to use.'
}

function buildCons(p: Product): string {
  const cons: string[] = []

  if (p.confidenceScore && parseFloat(p.confidenceScore) < 40) {
    cons.push('Lower migration confidence — evaluate carefully')
  }

  if (!p.license) {
    cons.push('No license specified — verify usage terms')
  }

  if (p.deploymentMethods && p.deploymentMethods.length === 0) {
    cons.push('Limited deployment options detected')
  }

  if (p.githubUrl) {
    cons.push('Self-hosted — requires infrastructure management')
  }

  return cons.length > 0 ? cons.join('. ') + '.' : 'No significant cons identified.'
}

function buildMigrationPath(p: Product): string {
  const steps: string[] = []

  if (p.deploymentMethods?.includes('docker')) {
    steps.push('Pull the Docker image and configure your environment')
  } else if (p.deploymentMethods?.includes('npm')) {
    steps.push('Install via npm: `npm install ' + p.name.toLowerCase().replace(/\s+/g, '-') + '`')
  } else if (p.deploymentMethods?.includes('pip')) {
    steps.push('Install via pip: `pip install ' + p.name.toLowerCase().replace(/\s+/g, '-') + '`')
  } else if (p.deploymentMethods?.includes('cargo')) {
    steps.push('Install via cargo: `cargo install ' + p.name.toLowerCase().replace(/\s+/g, '-') + '`')
  } else {
    steps.push('Clone the repository and follow the build instructions')
  }

  if (p.homepageUrl) {
    steps.push(`Check the official documentation at ${p.homepageUrl}`)
  }

  if (p.githubUrl) {
    steps.push(`View the source code and documentation at ${p.githubUrl}`)
  }

  return steps.join('. ') + '.'
}

export function ProductQA({ product }: Props) {
  const t = useTranslations('Product.faq')
  const tFAQ = useTranslations('FAQ')

  const blocks = generateQA(product, t)

  const customFaq = (product.faq as { question: string; answer: string }[] | null) ?? []
  const allBlocks = [...blocks, ...customFaq.filter((f) => f.question && f.answer)]

  return (
    <>
      <SectionHeading number="09" label={tFAQ('heading')} />
      <ProductCard>
        <dl className="space-y-6">
          {allBlocks.map((block) => (
            <div key={block.question}>
              <dt className="font-display font-medium">{block.question}</dt>
              <dd className="mt-1 text-body-sm text-muted-foreground leading-relaxed">
                {block.answer}
              </dd>
            </div>
          ))}
        </dl>
      </ProductCard>
    </>
  )
}
