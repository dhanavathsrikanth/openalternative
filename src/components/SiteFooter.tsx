import Link from 'next/link'
import { GitForkIcon } from 'lucide-react'
import { FooterNewsletter } from '@/components/FooterNewsletter'

const PRODUCT_LINKS = [
  { href: '/search', label: 'Search' },
  { href: '/categories', label: 'Categories' },
  { href: '/compare', label: 'Compare' },
  { href: '/products', label: 'Submit a tool' },
] as const

const RESOURCE_LINKS = [
  { href: '/guides', label: 'Guides' },
  { href: '/collections', label: 'Collections' },
] as const

const COMPANY_LINKS = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/sitemap.xml', label: 'Sitemap' },
] as const

function FooterLinkColumn({
  title,
  links,
}: {
  title: string
  links: readonly { href: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-medium text-text-primary">{title}</h3>
      <ul className="flex flex-col gap-2">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm text-text-tertiary transition-colors duration-fast ease-out hover:text-text-primary"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="mt-auto flex flex-col gap-8 border-t border-foreground/10 pt-fluid-md">
      <div className="mx-auto w-full max-w-[68rem] px-6 lg:px-8 flex flex-col gap-8">
        {/* Main content — matches competitor's responsive layout */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between md:gap-12">
          {/* Brand + newsletter column */}
          <div className="flex flex-col items-start gap-4 md:max-w-64">
            <Link href="/" className="flex items-center gap-2">
              <GitForkIcon className="size-5 text-text-primary" />
              <span className="text-sm font-medium text-text-primary">
                Forklane
              </span>
            </Link>
            <p className="text-sm text-text-tertiary">
              Open-source software discovery platform
            </p>
            <FooterNewsletter />
          </div>

          {/* Link columns */}
          <FooterLinkColumn title="Product" links={PRODUCT_LINKS} />
          <FooterLinkColumn title="Resources" links={RESOURCE_LINKS} />
          <FooterLinkColumn title="Company" links={COMPANY_LINKS} />
        </div>

        {/* Bottom bar */}
        <div className="flex flex-row flex-wrap items-end justify-between gap-x-4 gap-y-2 text-sm text-text-tertiary">
          <p>
            &copy; {new Date().getFullYear()} Forklane. All rights reserved.
          </p>
          <p>
            Made with care.
          </p>
        </div>
      </div>
    </footer>
  )
}
