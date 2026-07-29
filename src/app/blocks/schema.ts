import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
import { createLayoutBlockSpec } from './layout-block';
import { createCalloutBlockSpec } from './callout-block';
import { createInstallCodeBlockSpec } from './code-block';
import { createStatRowBlockSpec } from './stat-row-block';
import { createComparisonTableBlockSpec } from './comparison-table-block';
import { createFaqAccordionBlockSpec } from './faq-accordion-block';
import { createProductCardRowBlockSpec } from './product-card-row-block';
import { createCustomDividerBlockSpec } from './divider-block';

const customSpecs = {
  layout: createLayoutBlockSpec() as any,
  callout: createCalloutBlockSpec() as any,
  installCode: createInstallCodeBlockSpec() as any,
  statRow: createStatRowBlockSpec() as any,
  comparisonTable: createComparisonTableBlockSpec() as any,
  faqAccordion: createFaqAccordionBlockSpec() as any,
  productCardRow: createProductCardRowBlockSpec() as any,
  customDivider: createCustomDividerBlockSpec() as any,
};

export const customSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...defaultBlockSpecs,
    ...customSpecs,
  },
});

export type CustomSchema = typeof customSchema;
