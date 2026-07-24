export const faqData = [
  {
    question: 'What is Forklane?',
    answer:
      'Forklane is an open-source software directory that helps developers discover, compare, and migrate to open-source alternatives. We index tools from GitHub, npm, PyPI, and crates.io, score them with a confidence metric, and present them alongside the paid or proprietary tools they can replace.',
  },
  {
    question: 'How do you decide which tools to include?',
    answer:
      'Our ingestion pipeline pulls metadata from public package registries and GitHub on a scheduled basis. Each candidate passes through a scoring step that evaluates stars, recent commit activity, release cadence, license compatibility, and community signals. Tools that clear a configurable confidence threshold are published to the directory; the score breakdown is transparent on every product page.',
  },
  {
    question: 'Are these tools free to use?',
    answer:
      'The tools listed on Forklane are independent open-source projects, each with its own license. Forklane surfaces the license (e.g., MIT, Apache-2.0, GPL) on every product card and detail page so you can verify compatibility before adopting a tool.',
  },
  {
    question: 'How current is the directory?',
    answer:
      'Each product page shows a "Last verified" timestamp derived from the lastVerifiedAt field in our database. Our pipeline periodically re-fetches metadata and re-runs the scoring logic, so listings stay fresh without requiring manual edits.',
  },
  {
    question: 'How do I list my open-source tool?',
    answer:
      'You can suggest a product through our contributor flow. Create a contributor account and submit a contribution — our team reviews submissions and publishes approved tools. Get started at the contributor sign-up page.',
  },
  {
    question: 'Can I find a replacement for a specific paid tool?',
    answer:
      'Yes — that is one of the core use cases for Forklane. Use the search bar on the homepage or browse by category to find open-source alternatives to proprietary software. Each listing includes a confidence score indicating how closely it matches the feature set of the tool it could replace.',
  },
]

export function FaqJsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqData.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
