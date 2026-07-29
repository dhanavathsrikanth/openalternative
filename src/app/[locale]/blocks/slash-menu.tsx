import type { BlockNoteEditor, BlockSchema, InlineContentSchema, StyleSchema } from '@blocknote/core';
import { getDefaultReactSlashMenuItems, type DefaultReactSuggestionItem } from '@blocknote/react';

const customIcons: Record<string, JSX.Element> = {
  layout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  callout: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  installCode: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  statRow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  comparisonTable: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="12" y1="3" x2="12" y2="21" />
    </svg>
  ),
  faqAccordion: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="15" y2="17" />
    </svg>
  ),
  productCardRow: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  customDivider: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="2" y1="12" x2="22" y2="12" />
    </svg>
  ),
};

export function getSlashMenuItems(
  editor: BlockNoteEditor<BlockSchema, InlineContentSchema, StyleSchema>,
): DefaultReactSuggestionItem[] {
  const defaults = getDefaultReactSlashMenuItems(editor);
  const e = editor as any;

  const customItems: DefaultReactSuggestionItem[] = [
    {
      title: 'Layout',
      subtext: 'Multi-column layout with resizable columns',
      aliases: ['columns', 'grid'],
      group: 'Custom Blocks',
      icon: customIcons.layout,
      onItemClick: () => {
        const block = e.getTextCursorPosition().block;
        e.updateBlock(block, { type: 'layout' });
      },
    },
    {
      title: 'Callout',
      subtext: 'Highlighted info box with variant and title',
      aliases: ['info', 'warning', 'alert', 'notice'],
      group: 'Custom Blocks',
      icon: customIcons.callout,
      onItemClick: () => {
        const block = e.getTextCursorPosition().block;
        e.updateBlock(block, { type: 'callout' });
      },
    },
    {
      title: 'Install Code',
      subtext: 'Code block with language and method label',
      aliases: ['code', 'snippet', 'install', 'docker'],
      group: 'Custom Blocks',
      icon: customIcons.installCode,
      onItemClick: () => {
        const block = e.getTextCursorPosition().block;
        e.updateBlock(block, { type: 'installCode' });
      },
    },
    {
      title: 'Stat Row',
      subtext: 'Row of label/value stat cards',
      aliases: ['stats', 'metrics', 'numbers'],
      group: 'Custom Blocks',
      icon: customIcons.statRow,
      onItemClick: () => {
        const block = e.getTextCursorPosition().block;
        e.updateBlock(block, {
          type: 'statRow',
          props: { items: JSON.stringify([{ label: '', value: '' }]) },
        });
      },
    },
    {
      title: 'Comparison Table',
      subtext: 'Editable comparison table with rows and columns',
      aliases: ['compare', 'vs', 'table'],
      group: 'Custom Blocks',
      icon: customIcons.comparisonTable,
      onItemClick: () => {
        const block = e.getTextCursorPosition().block;
        e.updateBlock(block, { type: 'comparisonTable' });
      },
    },
    {
      title: 'FAQ Accordion',
      subtext: 'Repeatable question/answer pairs',
      aliases: ['faq', 'questions', 'accordion'],
      group: 'Custom Blocks',
      icon: customIcons.faqAccordion,
      onItemClick: () => {
        const block = e.getTextCursorPosition().block;
        e.updateBlock(block, {
          type: 'faqAccordion',
          props: {
            items: JSON.stringify([{ question: '', answer: '' }]),
          },
        });
      },
    },
    {
      title: 'Product Cards',
      subtext: 'Product slug picker that renders as cards',
      aliases: ['product', 'cards', 'picks'],
      group: 'Custom Blocks',
      icon: customIcons.productCardRow,
      onItemClick: () => {
        const block = e.getTextCursorPosition().block;
        e.updateBlock(block, {
          type: 'productCardRow',
          props: { slugs: '[]' },
        });
      },
    },
    {
      title: 'Divider',
      subtext: 'Horizontal line break',
      aliases: ['hr', 'line', 'separator'],
      group: 'Custom Blocks',
      icon: customIcons.customDivider,
      onItemClick: () => {
        const block = e.getTextCursorPosition().block;
        e.updateBlock(block, { type: 'customDivider' });
      },
    },
  ];

  return [...customItems, ...defaults];
}
