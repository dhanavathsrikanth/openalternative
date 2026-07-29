import { createReactBlockSpec } from '@blocknote/react';
import type { BlockConfig } from '@blocknote/core';

export const CalloutBlockConfig = {
  type: 'callout' as const,
  propSchema: {
    variant: { default: 'neutral', values: ['positive', 'negative', 'neutral'] as const },
    title: { default: '' },
  },
  content: 'inline' as const,
} satisfies BlockConfig<'callout', any, 'inline'>;

const variantStyles: Record<string, { border: string; bg: string; icon: string }> = {
  positive: {
    border: 'border-l-green-500',
    bg: 'bg-green-50 dark:bg-green-950/30',
    icon: '\u2705',
  },
  negative: {
    border: 'border-l-red-500',
    bg: 'bg-red-50 dark:bg-red-950/30',
    icon: '\u274C',
  },
  neutral: {
    border: 'border-l-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/30',
    icon: '\u2139\uFE0F',
  },
};

export const createCalloutBlockSpec = () =>
  createReactBlockSpec(CalloutBlockConfig, {
    render({ block, contentRef }) {
      const vs = variantStyles[block.props.variant] ?? variantStyles.neutral;
      return (
        <div
          className={`flex gap-3 rounded-md border-l-4 p-4 ${vs.border} ${vs.bg}`}
        >
          <span className="mt-0.5 shrink-0 text-base">{vs.icon}</span>
          <div className="flex-1 min-w-0">
            {block.props.title && (
              <div className="mb-1 text-sm font-semibold text-foreground">
                {block.props.title}
              </div>
            )}
            <div ref={contentRef} className="text-sm leading-relaxed text-foreground" />
          </div>
        </div>
      );
    },
  })();
