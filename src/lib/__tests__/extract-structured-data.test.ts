import { describe, it, expect } from 'vitest'
import { extractFaqPairs, extractInstallSteps } from '../blocks/extract-structured-data'

// ── extractFaqPairs ──────────────────────────────────────────────────────

describe('extractFaqPairs', () => {
  it('returns empty array for null/undefined', () => {
    expect(extractFaqPairs(null)).toEqual([])
    expect(extractFaqPairs(undefined)).toEqual([])
    expect(extractFaqPairs([])).toEqual([])
  })

  it('extracts FAQ pairs from top-level faqAccordion block', () => {
    const blocks = [
      {
        type: 'faqAccordion',
        props: {
          items: JSON.stringify([
            { question: 'Is it free?', answer: 'Yes, MIT licensed.' },
            { question: 'Does it support Docker?', answer: 'Yes.' },
          ]),
        },
      },
    ]
    const result = extractFaqPairs(blocks)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ question: 'Is it free?', answer: 'Yes, MIT licensed.' })
    expect(result[1]).toEqual({ question: 'Does it support Docker?', answer: 'Yes.' })
  })

  it('recursively finds faqAccordion nested in layout > callout children', () => {
    const blocks = [
      {
        type: 'layout',
        props: { columnCount: '2' },
        children: [
          {
            type: 'callout',
            props: { variant: 'neutral' },
            children: [
              {
                type: 'faqAccordion',
                props: {
                  items: JSON.stringify([
                    { question: 'Nested Q?', answer: 'Nested A.' },
                  ]),
                },
              },
            ],
          },
        ],
      },
    ]
    const result = extractFaqPairs(blocks)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ question: 'Nested Q?', answer: 'Nested A.' })
  })

  it('collects from multiple faqAccordion blocks scattered in the tree', () => {
    const blocks = [
      {
        type: 'faqAccordion',
        props: { items: JSON.stringify([{ question: 'Q1', answer: 'A1' }]) },
      },
      { type: 'heading', props: { level: 2 }, content: [{ type: 'text', text: 'More FAQ' }] },
      {
        type: 'paragraph',
        children: [
          {
            type: 'faqAccordion',
            props: { items: JSON.stringify([{ question: 'Q2', answer: 'A2' }]) },
          },
        ],
      },
    ]
    const result = extractFaqPairs(blocks)
    expect(result).toHaveLength(2)
    expect(result.map((p) => p.question)).toEqual(['Q1', 'Q2'])
  })

  it('filters out entries with missing question or answer', () => {
    const blocks = [
      {
        type: 'faqAccordion',
        props: {
          items: JSON.stringify([
            { question: 'Valid?', answer: 'Yes.' },
            { question: '', answer: 'No question.' },
            { question: 'No answer?', answer: '' },
            { question: 'Also valid', answer: 'Indeed.' },
          ]),
        },
      },
    ]
    const result = extractFaqPairs(blocks)
    expect(result).toHaveLength(2)
    expect(result[0].question).toBe('Valid?')
    expect(result[1].question).toBe('Also valid')
  })

  it('gracefully handles malformed JSON in items prop', () => {
    const blocks = [
      {
        type: 'faqAccordion',
        props: { items: 'not-valid-json' },
      },
    ]
    expect(extractFaqPairs(blocks)).toEqual([])
  })

  it('returns empty for empty items array', () => {
    const blocks = [
      {
        type: 'faqAccordion',
        props: { items: '[]' },
      },
    ]
    expect(extractFaqPairs(blocks)).toEqual([])
  })
})

// ── extractInstallSteps ──────────────────────────────────────────────────

describe('extractInstallSteps', () => {
  it('returns empty array for null/undefined', () => {
    expect(extractInstallSteps(null)).toEqual([])
    expect(extractInstallSteps(undefined)).toEqual([])
    expect(extractInstallSteps([])).toEqual([])
  })

  it('extracts install steps from top-level installCode blocks', () => {
    const blocks = [
      {
        type: 'installCode',
        props: { methodLabel: 'Docker', language: 'bash' },
        content: [{ type: 'text', text: 'docker pull nginx\ndocker run -d nginx' }],
      },
      {
        type: 'installCode',
        props: { methodLabel: 'npm', language: 'bash' },
        content: [{ type: 'text', text: 'npm install my-tool' }],
      },
    ]
    const result = extractInstallSteps(blocks)
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ label: 'Docker', commands: ['docker pull nginx', 'docker run -d nginx'] })
    expect(result[1]).toEqual({ label: 'npm', commands: ['npm install my-tool'] })
  })

  it('recursively finds installCode nested in layout children', () => {
    const blocks = [
      {
        type: 'layout',
        props: { columnCount: '2' },
        children: [
          {
            type: 'installCode',
            props: { methodLabel: 'pip' },
            content: [{ type: 'text', text: 'pip install my-tool' }],
          },
        ],
      },
    ]
    const result = extractInstallSteps(blocks)
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({ label: 'pip', commands: ['pip install my-tool'] })
  })

  it('defaults label to "Install" when methodLabel is missing', () => {
    const blocks = [
      {
        type: 'installCode',
        props: {},
        content: [{ type: 'text', text: 'make install' }],
      },
    ]
    const result = extractInstallSteps(blocks)
    expect(result[0].label).toBe('Install')
  })

  it('skips installCode blocks with empty commands', () => {
    const blocks = [
      {
        type: 'installCode',
        props: { methodLabel: 'Empty' },
        content: [{ type: 'text', text: '' }],
      },
    ]
    expect(extractInstallSteps(blocks)).toEqual([])
  })

  it('filters blank lines from commands', () => {
    const blocks = [
      {
        type: 'installCode',
        props: { methodLabel: 'Docker' },
        content: [{ type: 'text', text: 'docker pull nginx\n\n\ndocker run -d nginx' }],
      },
    ]
    const result = extractInstallSteps(blocks)
    expect(result[0].commands).toEqual(['docker pull nginx', 'docker run -d nginx'])
  })
})

// ── Combined extraction ──────────────────────────────────────────────────

describe('combined block tree extraction', () => {
  it('extracts both FAQ and install steps from a realistic block tree', () => {
    const blocks = [
      { type: 'heading', props: { level: 2 }, content: [{ type: 'text', text: 'TL;DR' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'A great tool.' }] },
      {
        type: 'installCode',
        props: { methodLabel: 'Docker' },
        content: [{ type: 'text', text: 'docker pull my-tool' }],
      },
      {
        type: 'layout',
        props: { columnCount: '2' },
        children: [
          { type: 'callout', props: { variant: 'positive', title: 'Strengths' } },
          { type: 'callout', props: { variant: 'negative', title: 'Trade-offs' } },
        ],
      },
      {
        type: 'faqAccordion',
        props: {
          items: JSON.stringify([
            { question: 'What is this?', answer: 'A tool.' },
            { question: 'Is it free?', answer: 'Yes.' },
          ]),
        },
      },
    ]

    const faq = extractFaqPairs(blocks)
    const steps = extractInstallSteps(blocks)

    expect(faq).toHaveLength(2)
    expect(faq[0].question).toBe('What is this?')
    expect(steps).toHaveLength(1)
    expect(steps[0].label).toBe('Docker')
  })

  it('handles a tree with no FAQ or install blocks', () => {
    const blocks = [
      { type: 'heading', props: { level: 2 }, content: [{ type: 'text', text: 'Title' }] },
      { type: 'paragraph', content: [{ type: 'text', text: 'Body' }] },
    ]
    expect(extractFaqPairs(blocks)).toEqual([])
    expect(extractInstallSteps(blocks)).toEqual([])
  })
})
