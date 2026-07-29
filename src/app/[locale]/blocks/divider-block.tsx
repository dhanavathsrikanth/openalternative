import { createReactBlockSpec } from '@blocknote/react';
import type { BlockConfig } from '@blocknote/core';

export const DividerBlockConfig = {
  type: 'customDivider' as const,
  propSchema: {},
  content: 'none' as const,
} satisfies BlockConfig<'customDivider', {}, 'none'>;

export const createCustomDividerBlockSpec = () =>
  createReactBlockSpec(DividerBlockConfig, {
    render() {
      return (
        <hr className="my-4 border-t border-border" />
      );
    },
  })();
