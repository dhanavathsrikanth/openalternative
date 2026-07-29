'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, FormEvent } from 'react'
import { SearchIcon, MenuIcon, XIcon } from 'lucide-react'
import { useUser, UserButton } from '@clerk/nextjs'
import { useTranslations } from 'next-intl'

export function SiteHeader() {
  const t = useTranslations('Common')
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NAV_LINKS = [
    { href: '/products', label: 'Alternatives' },
    { href: '/categories', label: 'Categories' },
    { href: '/collections', label: 'Collections ▾' },
    { href: '/guides', label: 'Resources ▾' },
    { href: '/advertise', label: 'Advertise' },
  ] as const

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    router.push('/search')
  }

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 h-[50px] border-b border-[#e0e0e0] bg-white">
        <div className="mx-auto flex h-full max-w-[72rem] items-center gap-4 px-6 text-sm">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-m-2 p-2 text-[#737373] hover:text-[#1f1f1f] lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="size-5" />
          </button>

          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <svg className="h-4 w-auto text-[#1f1f1f]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <rect x="4" y="4" width="16" height="16" rx="3" transform="rotate(45 12 12)" />
            </svg>
            <span className="text-sm font-medium text-[#1f1f1f]">
              OpenAlternative
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 lg:flex">
            <ul className="flex items-center gap-x-4">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`text-sm transition-colors ${
                      pathname === href || pathname.startsWith(href + '/')
                        ? 'text-[#1f1f1f]'
                        : 'text-[#737373] hover:text-[#1f1f1f]'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Spacer */}
          <div className="flex-1 lg:hidden" />

          {/* Right section */}
          <div className="hidden items-center gap-3 md:flex">
            {/* Search icon button (circular, bordered) */}
            <button
              type="button"
              onClick={handleSearch}
              className="flex size-8 items-center justify-center rounded-full border border-[#e0e0e0] text-[#737373] transition-colors hover:border-[#b0b0b0] hover:text-[#1f1f1f]"
              aria-label="Search"
            >
              <SearchIcon className="size-4" />
            </button>

            {/* Submit button (white bg, bordered, rounded-md) */}
            <Link
              href="/submit"
              className="inline-flex items-center rounded-md border border-[#e0e0e0] bg-white px-4 py-1.5 text-sm font-medium text-[#737373] transition-colors hover:border-[#b0b0b0] hover:text-[#1f1f1f]"
            >
              Submit
            </Link>

            {isSignedIn ? (
              <UserButton />
            ) : (
              <Link
                href="/sign-in"
                className="inline-flex items-center rounded-md border border-[#e0e0e0] px-4 py-1.5 text-sm font-medium text-[#737373] transition-colors hover:border-[#b0b0b0] hover:text-[#1f1f1f]"
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile search link */}
          <div className="flex items-center md:hidden">
            <button
              type="button"
              onClick={handleSearch}
              className="-m-2 p-2 text-[#737373] hover:text-[#1f1f1f]"
              aria-label="Search"
            >
              <SearchIcon className="size-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Scroll mask gradient — always visible */}
      <div className="pointer-events-none fixed inset-x-0 z-40 h-8 bg-white" style={{ top: '50px' }} />

      {/* Mobile nav overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/20" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 top-0 bg-white">
            <div className="mx-auto max-w-[72rem] px-6">
              <div className="flex h-[50px] items-center gap-4">
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="-m-2 p-2 text-[#737373] hover:text-[#1f1f1f]"
                  aria-label="Close menu"
                >
                  <XIcon className="size-5" />
                </button>
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <svg className="h-4 w-auto text-[#1f1f1f]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <rect x="4" y="4" width="16" height="16" rx="3" transform="rotate(45 12 12)" />
                  </svg>
                  <span className="text-sm font-medium text-[#1f1f1f]">OpenAlternative</span>
                </Link>
              </div>
              <nav className="flex flex-col gap-2 py-4">
                {NAV_LINKS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={`py-2 text-sm ${
                      pathname === href || pathname.startsWith(href + '/')
                        ? 'text-[#1f1f1f]'
                        : 'text-[#737373] hover:text-[#1f1f1f]'
                    }`}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
              <div className="h-px bg-[#e0e0e0]" />
              <div className="flex flex-col gap-3 py-4">
                {isSignedIn ? (
                  <UserButton />
                ) : (
                  <Link
                    href="/sign-in"
                    onClick={() => setMobileOpen(false)}
                    className="inline-flex items-center rounded-md border border-[#e0e0e0] px-4 py-2 text-sm font-medium text-[#737373] transition-colors hover:border-[#b0b0b0] hover:text-[#1f1f1f]"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
