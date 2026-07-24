'use client'

import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqItems = [
  {
    id: 'what-is-forklane',
    question: 'What is Forklane?',
    answer:
      'Forklane is an open-source software directory that helps developers discover, compare, and migrate to open-source alternatives. We index tools from GitHub, npm, PyPI, and crates.io, score them with a confidence metric, and present them alongside the paid or proprietary tools they can replace.',
  },
  {
    id: 'how-decide-tools',
    question: 'How do you decide which tools to include?',
    answer:
      'Our ingestion pipeline pulls metadata from public package registries and GitHub on a scheduled basis. Each candidate passes through a scoring step that evaluates stars, recent commit activity, release cadence, license compatibility, and community signals. Tools that clear a configurable confidence threshold are published to the directory; the score breakdown is transparent on every product page.',
  },
  {
    id: 'are-tools-free',
    question: 'Are these tools free to use?',
    answer:
      'The tools listed on Forklane are independent open-source projects, each with its own license. Forklane surfaces the license (e.g., MIT, Apache-2.0, GPL) on every product card and detail page so you can verify compatibility before adopting a tool.',
  },
  {
    id: 'how-current',
    question: 'How current is the directory?',
    answer:
      'Each product page shows a "Last verified" timestamp derived from the lastVerifiedAt field in our database. Our pipeline periodically re-fetches metadata and re-runs the scoring logic, so listings stay fresh without requiring manual edits.',
  },
  {
    id: 'how-to-list',
    question: 'How do I list my open-source tool?',
    answer:
      'You can suggest a product through our contributor flow. Create a contributor account and submit a contribution — our team reviews submissions and publishes approved tools. Get started at the contributor sign-up page.',
    link: { href: '/contributor/sign-up', label: 'Sign up as a contributor' },
  },
  {
    id: 'find-replacement',
    question: 'Can I find a replacement for a specific paid tool?',
    answer:
      'Yes — that is one of the core use cases for Forklane. Use the search bar on the homepage or browse by category to find open-source alternatives to proprietary software. Each listing includes a confidence score indicating how closely it matches the feature set of the tool it could replace.',
  },
]

// Single-open mode: only one accordion item can be expanded at a time.
export function FaqSection() {
  return (
    <section className="border-t bg-card">
      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-12">
        <h2 className="mb-2 text-2xl font-semibold">Frequently Asked Questions</h2>
        <p className="mb-8 text-muted-foreground">
          Everything you need to know about Forklane.
        </p>

        <Accordion defaultValue={[]}>
          {faqItems.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">{item.answer}</p>
                {'link' in item && item.link && (
                  <Link
                    href={item.link.href}
                    className="mt-2 inline-block text-sm font-medium underline underline-offset-3 hover:text-foreground"
                  >
                    {item.link.label} →
                  </Link>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
