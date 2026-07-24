import { useState, useCallback } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import type { BlockConfig } from '@blocknote/core';

export interface FaqItem {
  question: string;
  answer: string;
}

export const FaqAccordionBlockConfig = {
  type: 'faqAccordion' as const,
  propSchema: {
    items: {
      default:
        '[{"question":"What is this?","answer":"An open-source tool."}]',
    },
  },
  content: 'none' as const,
} satisfies BlockConfig<'faqAccordion', any, 'none'>;

function parseItems(raw: string): FaqItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return [{ question: '', answer: '' }];
}

function FaqAccordionEditor({
  block,
  editor,
}: {
  block: any;
  editor: any;
}) {
  const [items, setItems] = useState<FaqItem[]>(() =>
    parseItems(block.props.items),
  );
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const persist = useCallback(
    (next: FaqItem[]) => {
      setItems(next);
      editor.updateBlock(block, {
        props: { ...block.props, items: JSON.stringify(next) },
      });
    },
    [block, editor],
  );

  const update = (idx: number, key: keyof FaqItem, val: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [key]: val } : item));
    persist(next);
  };

  const add = () => {
    const next = [...items, { question: '', answer: '' }];
    persist(next);
    setOpenIdx(next.length - 1);
  };

  const remove = (idx: number) => {
    if (items.length <= 1) return;
    const next = items.filter((_, i) => i !== idx);
    persist(next);
    if (openIdx === idx) setOpenIdx(0);
    else if (openIdx !== null && openIdx > idx) setOpenIdx(openIdx - 1);
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {items.map((item, idx) => (
        <div key={idx} className="border-b border-border last:border-0">
          <div className="flex items-center gap-2 bg-muted/30 px-4 py-3">
            <button
              type="button"
              onClick={() => setOpenIdx(openIdx === idx ? null : idx)}
              className="shrink-0 text-muted-foreground text-xs"
            >
              {openIdx === idx ? '\u25BC' : '\u25B6'}
            </button>
            <input
              value={item.question}
              onChange={(e) => update(idx, 'question', e.target.value)}
              placeholder="Question"
              className="flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              className="shrink-0 text-destructive text-xs opacity-0 hover:opacity-100 transition-opacity"
              style={{ opacity: items.length > 1 ? undefined : 0 }}
            >
              &times;
            </button>
          </div>
          {openIdx === idx && (
            <div className="px-4 py-3">
              <textarea
                value={item.answer}
                onChange={(e) => update(idx, 'answer', e.target.value)}
                placeholder="Answer (supports rich text on render)"
                rows={3}
                className="w-full resize-none rounded border border-border bg-background p-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/50"
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full px-4 py-2 text-xs text-muted-foreground hover:bg-muted/30 hover:text-foreground transition-colors"
      >
        + Add FAQ item
      </button>
    </div>
  );
}

export const createFaqAccordionBlockSpec = () =>
  createReactBlockSpec(FaqAccordionBlockConfig, {
    render({ block, editor }) {
      return <FaqAccordionEditor block={block} editor={editor} />;
    },
  })();
