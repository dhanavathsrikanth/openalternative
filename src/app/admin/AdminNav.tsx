'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Package,
  Tag,
  FolderTree,
  Layers,
  MessageSquare,
  GitPullRequest,
  Building2,
  ScrollText,
  Users,
  Shield,
  ArrowLeft,
  Flag,
} from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  disabled?: boolean
}

const SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: 'Content',
    items: [
      { label: 'Overview', href: '/admin', icon: LayoutDashboard },
      { label: 'Products', href: '/admin/products', icon: Package },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Tags', href: '/admin/tags', icon: Tag },
      { label: 'Collections', href: '/admin/collections', icon: Layers },
    ],
  },
  {
    label: 'Coming Soon',
    items: [
      { label: 'Reviews', href: '/admin/reviews', icon: MessageSquare, disabled: true },
      { label: 'Contributions', href: '/admin/contributions', icon: GitPullRequest, disabled: true },
      { label: 'Organizations', href: '/admin/organizations', icon: Building2, disabled: true },
      { label: 'Audit Log', href: '/admin/audit', icon: ScrollText, disabled: true },
    ],
  },
  {
    label: 'Moderation',
    items: [
      { label: 'Reports', href: '/admin/reports', icon: Flag },
      { label: 'Contributions', href: '/admin/contributions', icon: GitPullRequest },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Staff', href: '/admin/staff', icon: Shield },
      { label: 'Users', href: '/admin/users', icon: Users },
    ],
  },
]

type Props = { orgSlug: string | null }

export function AdminNav({ orgSlug }: Props) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <nav className="px-4 pb-4">
      {SECTIONS.map((section) => (
        <div key={section.label} className="mb-4">
          <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
            {section.label}
          </p>
          <ul className="space-y-1">
            {section.items.map((item) => {
              const Icon = item.icon
              const active = !item.disabled && isActive(item.href)

              if (item.disabled) {
                return (
                  <li key={item.href}>
                    <span className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground/40 cursor-not-allowed select-none">
                      <Icon className="size-3.5" />
                      {item.label}
                      <span className="ml-auto text-[9px] font-medium uppercase tracking-wider text-muted-foreground/30">
                        Soon
                      </span>
                    </span>
                  </li>
                )
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={
                      active
                        ? 'flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-foreground'
                        : 'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground'
                    }
                  >
                    <Icon className="size-3.5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}

      {orgSlug && (
        <div className="border-t pt-3 mt-1">
          <Link
            href={`/dashboard/${orgSlug}`}
            className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Dashboard
          </Link>
        </div>
      )}
    </nav>
  )
}
