'use client'

import { useId } from 'react'
import { Card } from '@/components/ui/card'
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion'

export interface AccordionSection {
  id: string
  label: string
  content: React.ReactNode
}

interface Props {
  sections: AccordionSection[]
}

/**
 * Renders the product detail content as a set of accordion sections.
 * On desktop (lg+) all sections are expanded by default for a scannable
 * long-form read; on small screens they collapse for a tidy mobile view.
 */
export function DetailAccordion({ sections }: Props) {
  const baseId = useId()
  const allIds = sections.map((s) => `${baseId}-${s.id}`)

  if (sections.length === 0) return null

  return (
    <Card className="p-2 sm:p-4">
      <Accordion
        openMultiple
        // Expand every section by default so the page reads as a normal
        // document on first paint; users can still toggle each one.
        defaultValue={allIds}
        className="divide-y divide-border-default"
      >
        {sections.map((section, index) => {
          const value = `${baseId}-${section.id}`
          return (
            <AccordionItem
              key={section.id}
              value={value}
              className="px-2 sm:px-3 first:pt-0 last:pb-0 py-1"
            >
              <AccordionTrigger className="text-base font-semibold text-foreground hover:text-brand">
                <span className="flex items-center gap-2">
                  <span className="tabular-nums text-muted-foreground">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  {section.label}
                </span>
              </AccordionTrigger>
              <AccordionContent className="text-body-base leading-relaxed text-foreground/90">
                {section.content}
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </Card>
  )
}
