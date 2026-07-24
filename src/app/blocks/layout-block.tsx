import { createReactBlockSpec } from '@blocknote/react';
import type { BlockConfig } from '@blocknote/core';

export const LayoutBlockConfig = {
  type: 'layout' as const,
  propSchema: {
    columnCount: { default: '2', values: ['2', '3', '4'] as const },
    scrollMode: { default: false, type: 'boolean' as const },
  },
  content: 'inline' as const,
} satisfies BlockConfig<'layout', any, 'inline'>;

export const createLayoutBlockSpec = () =>
  createReactBlockSpec(LayoutBlockConfig, {
    meta: {
      isolating: true,
    },
    render({ block, contentRef }) {
      const cols = parseInt(block.props.columnCount, 10) || 2;
      return (
        <div className="my-3" data-layout-cols={cols}>
          <div className="flex items-center gap-2 mb-1.5 px-1">
            <span className="text-[10px] text-muted-foreground select-none">
              {cols}-column layout
              {block.props.scrollMode ? ' \u00B7 scrollable' : ''}
            </span>
          </div>
          <div
            className="grid gap-2"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            <div className="min-h-[48px] rounded-md border border-dashed border-border/60 bg-secondary/10 px-2 py-1">
              <div ref={contentRef} className="text-sm min-h-[40px]" />
            </div>
            {Array.from({ length: cols - 1 }).map((_, i) => (
              <div
                key={i}
                className="min-h-[48px] rounded-md border border-dashed border-border/40 bg-secondary/5 flex items-center justify-center"
              >
                <span className="text-[10px] text-muted-foreground/40 select-none">
                  Col {i + 2}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    },
  })();
