'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, FormEvent } from 'react'
import { GitForkIcon, MenuIcon, SearchIcon, ShieldIcon, XIcon } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { useUser, UserButton } from '@clerk/nextjs'
import { cn } from '@/lib/utils'

const NAV_LINKS = [
  { href: '/products', label: 'Products' },
  { href: '/categories', label: 'Categories' },
  { href: '/compare', label: 'Compare' },
  { href: '/collections', label: 'Collections' },
  { href: '/guides', label: 'Guides' },
] as const

function NavItem({
  href,
  label,
  isActive,
  onClick,
}: {
  href: string
  label: string
  isActive: boolean
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'group flex items-center gap-2 p-0.5 -m-0.5 text-sm text-text-tertiary transition-colors duration-fast ease-out hover:text-text-primary',
        isActive && 'text-text-primary'
      )}
    >
      {label}
    </Link>
  )
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { isSignedIn } = useUser()
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const HEADER_HEIGHT = 50 // --header-height: 3.125rem = 50px
    function onScroll() {
      setScrolled(window.scrollY > 0)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setMobileOpen(false)
    }
  }

  return (
    <>
      {/* ── Fixed header ─────────────────────────────────────────────── */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-50 bg-surface transition-[box-shadow] duration-normal ease-out',
          scrolled && 'shadow-elevation-2'
        )}
      >
        <div className="relative mx-auto flex h-[var(--header-height)] max-w-[68rem] items-center gap-4 px-8 text-sm md:gap-6 lg:gap-8 lg:px-10">
          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="-m-1 p-1 text-lg text-text-tertiary transition-colors duration-fast ease-out hover:text-text-primary lg:hidden"
            aria-label="Open menu"
          >
            <MenuIcon className="size-6" />
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2"
          >
            <GitForkIcon className="size-5 text-text-primary" />
            <span className="hidden font-medium text-sm text-text-primary sm:inline">
              Forklane
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden flex-1 lg:block" aria-label="Main navigation">
            <ul className="flex items-center gap-x-4 text-sm">
              {NAV_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <NavItem
                    href={href}
                    label={label}
                    isActive={pathname === href || pathname.startsWith(href + '/')}
                  />
                </li>
              ))}
            </ul>
          </nav>

          {/* Spacer */}
          <div className="flex-1 lg:hidden" />

          {/* Desktop search + auth */}
          <div className="hidden items-center gap-3 md:flex">
            <form onSubmit={handleSearch} className="relative">
              <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="h-8 w-48 rounded-radius-button border border-border-default bg-surface px-8 pr-3 text-sm text-text-primary placeholder:text-text-tertiary outline-transparent transition-[width,border-color,box-shadow] duration-normal ease-out focus:w-64 focus:border-ring focus:outline-2 focus:outline-border/50"
                aria-label="Search"
              />
            </form>

            {isSignedIn ? (
              <>
                <Link
                  href="/admin"
                  className="flex items-center gap-2 p-0.5 -m-0.5 text-sm text-text-tertiary transition-colors duration-fast ease-out hover:text-text-primary"
                >
                  <ShieldIcon className="size-4" />
                  Admin
                </Link>
                <UserButton />
              </>
            ) : (
              <Link
                href="/sign-in"
                className={buttonVariants({ variant: 'default', size: 'sm' })}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile search + hamburger */}
          <div className="flex items-center gap-1 md:hidden">
            <Link
              href="/search"
              className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
              aria-label="Search"
            >
              <SearchIcon className="size-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Scroll shadow gradient (mask-based, matches competitor) ───── */}
      <div
        className={cn(
          'pointer-events-none fixed inset-x-0 z-40 h-8 bg-surface transition-opacity duration-normal ease-out',
          scrolled ? 'opacity-100' : 'opacity-0'
        )}
        style={{
          top: 'var(--header-inner-offset, 50px)',
          maskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 0%, transparent 100%)',
        }}
      />

      {/* ── Mobile nav overlay ───────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          aria-label="Mobile navigation"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-normal ease-out"
            onClick={() => setMobileOpen(false)}
          />

          {/* Panel — slides from top, matching competitor */}
          <div className="absolute inset-x-0 top-0 h-full overflow-y-auto overscroll-contain bg-surface-overlay/95 backdrop-blur-lg transition-[opacity,transform] duration-normal ease-out data-ending-style:opacity-0 data-starting-style:opacity-0">
            <div className="relative mx-auto max-w-[68rem] px-6 lg:px-8">
              <div className="flex h-[--header-height] items-center gap-4">
                {/* Close button (replaces hamburger) */}
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="-m-1 p-1 text-lg text-text-tertiary transition-colors duration-fast ease-out hover:text-text-primary"
                  aria-label="Close menu"
                >
                  <XIcon className="size-6" />
                </button>

                {/* Logo */}
                <Link
                  href="/"
                  className="flex items-center gap-2"
                  onClick={() => setMobileOpen(false)}
                >
                  <GitForkIcon className="size-5 text-text-primary" />
                  <span className="font-medium text-sm text-text-primary">
                    Forklane
                  </span>
                </Link>
              </div>

              {/* Mobile nav links */}
              <nav className="flex flex-col gap-1 py-4">
                {NAV_LINKS.map(({ href, label }) => (
                  <NavItem
                    key={href}
                    href={href}
                    label={label}
                    isActive={pathname === href || pathname.startsWith(href + '/')}
                    onClick={() => setMobileOpen(false)}
                  />
                ))}
              </nav>

              {/* Divider */}
              <div className="h-px bg-border-subtle" />

              {/* Mobile auth */}
              <div className="flex flex-col gap-3 py-4">
                {isSignedIn ? (
                  <>
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 text-sm text-text-tertiary transition-colors duration-fast ease-out hover:text-text-primary"
                      onClick={() => setMobileOpen(false)}
                    >
                      <ShieldIcon className="size-4" />
                      Admin Panel
                    </Link>
                    <UserButton />
                  </>
                ) : (
                  <Link
                    href="/sign-in"
                    className={buttonVariants({ variant: 'default', size: 'default' })}
                    onClick={() => setMobileOpen(false)}
                  >
                    Sign In
                  </Link>
                )}
              </div>

              {/* Mobile search */}
              <div className="pb-6">
                <form onSubmit={handleSearch}>
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search…"
                      className="h-9 w-full rounded-radius-button border border-border-default bg-surface px-8 pr-3 text-sm text-text-primary placeholder:text-text-tertiary outline-transparent focus:outline-2 focus:outline-border/50 focus:border-ring"
                      aria-label="Search"
                    />
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
