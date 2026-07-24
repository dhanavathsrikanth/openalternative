'use client'

import { useState, useEffect, useCallback } from 'react'
import { BellIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface Notification {
  id: number
  eventType: string
  title: string
  body: string | null
  metadata: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

interface Props {
  orgSlug: string
}

export function NotificationCenter({ orgSlug }: Props) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnreadCount(data.unreadCount ?? 0)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30_000)
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function markRead(id: number) {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  function eventIcon(eventType: string) {
    switch (eventType) {
      case 'claim_verified':
        return <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
      case 'team_invite':
        return <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
      case 'digest_available':
        return <span className="inline-block h-2 w-2 rounded-full bg-purple-500" />
      default:
        return <span className="inline-block h-2 w-2 rounded-full bg-gray-400" />
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) fetchNotifications() }}
        className="relative rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label="Notifications"
      >
        <BellIcon className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border bg-card shadow-lg">
            <div className="border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {loading && notifications.length === 0 && (
                <div className="divide-y">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3">
                      <Skeleton className="mt-1 h-4 w-4 shrink-0 rounded-full" />
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!loading && notifications.length === 0 && (
                <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                  No notifications yet.
                </p>
              )}
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.readAt) markRead(n.id) }}
                  className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent ${
                    !n.readAt ? 'bg-accent/50' : ''
                  }`}
                >
                  <span className="mt-1.5 shrink-0">{eventIcon(n.eventType)}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${!n.readAt ? 'font-medium' : 'text-muted-foreground'}`}>
                      {n.title}
                    </p>
                    {n.body && (
                      <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">
                        {n.body}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!n.readAt && (
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
