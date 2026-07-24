'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield } from 'lucide-react'

type Props = {
  orgSlug: string
  isStaff: boolean
  orgName: string
  role: string
  orgNotificationSlot: React.ReactNode
}

const NAV_ITEMS = [
  { label: 'Overview', href: '' },
  { label: 'Profile', href: '/profile' },
  { label: 'Team', href: '/team' },
  { label: 'Analytics', href: '/analytics' },
  { label: 'Announcements', href: '/announcements' },
] as const

export function DashboardNav({ orgSlug, isStaff, orgName, role, orgNotificationSlot }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '') return pathname === `/dashboard/${orgSlug}`
    return pathname === `/dashboard/${orgSlug}${href}` || pathname.startsWith(`/dashboard/${orgSlug}${href}/`)
  }

  return (
    <aside className="sidebar">
      <div className="flex items-center justify-between px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold truncate">{orgName}</h2>
          <span className="mt-0.5 inline-block rounded bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
            {role.replace('org:', '')}
          </span>
        </div>
        {orgNotificationSlot}
      </div>
      <nav className="px-4 pb-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href)
            return (
              <li key={item.label}>
                <Link
                  href={`/dashboard/${orgSlug}${item.href}`}
                  className={
                    active
                      ? 'block rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-foreground'
                      : 'block rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                  }
                >
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
        {isStaff && (
          <>
            <div className="my-2 border-t" />
            <Link
              href="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Shield className="size-3.5" />
              Admin Panel
            </Link>
          </>
        )}
      </nav>
    </aside>
  )
}
