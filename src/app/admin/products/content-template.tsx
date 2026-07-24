import type { Block } from '@blocknote/core'

/**
 * Returns a sensible starter template for a new product's content blocks.
 * All text is empty/placeholder — the admin can freely edit, reorder, or delete.
 */
export function getContentTemplate(_productName: string): Block[] {
  return [
    // ── TL;DR heading ───────────────────────────────────────────────
    {
      id: crypto.randomUUID(),
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'TL;DR', styles: {} }],
      children: [],
    },
    {
      id: crypto.randomUUID(),
      type: 'paragraph',
      props: {},
      content: [],
      children: [],
    },

    // ── "Who it's for" heading ─────────────────────────────────────
    {
      id: crypto.randomUUID(),
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: "Who it's for", styles: {} }],
      children: [],
    },

    // ── 2-column layout (Strengths | Trade-offs) ───────────────────
    {
      id: crypto.randomUUID(),
      type: 'layout',
      props: { columnCount: '2', scrollMode: false },
      content: [],
      children: [
        // Left column — Strengths callout
        {
          id: crypto.randomUUID(),
          type: 'callout',
          props: { variant: 'positive', title: 'Strengths' },
          content: [],
          children: [],
        },
        // Right column — Trade-offs callout
        {
          id: crypto.randomUUID(),
          type: 'callout',
          props: { variant: 'negative', title: 'Trade-offs' },
          content: [],
          children: [],
        },
      ],
    } as any,

    // ── FAQ section ────────────────────────────────────────────────
    {
      id: crypto.randomUUID(),
      type: 'heading',
      props: { level: 2 },
      content: [{ type: 'text', text: 'FAQ', styles: {} }],
      children: [],
    },
    {
      id: crypto.randomUUID(),
      type: 'faqAccordion',
      props: {
        items: JSON.stringify([
          { question: '', answer: '' },
          { question: '', answer: '' },
        ]),
      },
      content: [],
      children: [],
    } as any,
  ]
}
