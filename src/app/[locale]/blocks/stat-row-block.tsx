import { useState, useCallback } from 'react';
import { createReactBlockSpec } from '@blocknote/react';
import type { BlockConfig } from '@blocknote/core';

export interface StatItem {
  label: string;
  value: string;
}

export const StatRowBlockConfig = {
  type: 'statRow' as const,
  propSchema: {
    items: { default: '[]' },
  },
  content: 'none' as const,
} satisfies BlockConfig<'statRow', any, 'none'>;

function parseItems(raw: string): StatItem[] {
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* ignore */ }
  return [{ label: '', value: '' }];
}

function StatRowEditor({
  block,
  editor,
}: {
  block: any;
  editor: any;
}) {
  const [items, setItems] = useState<StatItem[]>(() =>
    parseItems(block.props.items),
  );

  const persist = useCallback(
    (next: StatItem[]) => {
      setItems(next);
      editor.updateBlock(block, {
        props: { ...block.props, items: JSON.stringify(next) },
      });
    },
    [block, editor],
  );

  const update = (idx: number, key: keyof StatItem, val: string) => {
    const next = items.map((item, i) => (i === idx ? { ...item, [key]: val } : item));
    persist(next);
  };

  const add = () => persist([...items, { label: '', value: '' }]);

  const remove = (idx: number) => {
    if (items.length <= 1) return;
    persist(items.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, minmax(0, 1fr))` }}>
        {items.map((item, idx) => (
          <div key={idx} className="group relative rounded-md border border-border bg-secondary/30 p-3 text-center">
            <button
              type="button"
              onClick={() => remove(idx)}
              className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs opacity-0 group-hover:opacity-100 transition-opacity"
            >
              &times;
            </button>
            <input
              value={item.value}
              onChange={(e) => update(idx, 'value', e.target.value)}
              placeholder="Value"
              className="mb-1 w-full bg-transparent text-center text-2xl font-bold text-foreground outline-none placeholder:text-muted-foreground/50"
            />
            <input
              value={item.label}
              onChange={(e) => update(idx, 'label', e.target.value)}
              placeholder="Label"
              className="w-full bg-transparent text-center text-xs text-muted-foreground outline-none placeholder:text-muted-foreground/50"
            />
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        + Add stat
      </button>
    </div>
  );
}

export const createStatRowBlockSpec = () =>
  createReactBlockSpec(StatRowBlockConfig, {
    render({ block, editor }) {
      return <StatRowEditor block={block} editor={editor} />;
    },
  })();
