'use client'

import { createContext, useCallback, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextValue {
  activeTab: string
  setActiveTab: (tab: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabsContext() {
  const ctx = useContext(TabsContext)
  if (!ctx) throw new Error('Tabs components must be used within <Tabs>')
  return ctx
}

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex gap-0.5 rounded-radius-card border border-border-default bg-surface-raised p-1",
        className
      )}
    >
      {children}
    </div>
  )
}

export function TabsTrigger({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { activeTab, setActiveTab } = useTabsContext()
  const isActive = activeTab === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      onClick={() => setActiveTab(value)}
      className={cn(
        "flex-1 rounded-radius-button px-4 py-2 text-body-sm font-medium transition-[color,background-color,box-shadow] duration-normal ease-out outline-transparent focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand/60",
        isActive
          ? "bg-surface text-text-primary shadow-elevation-1"
          : "text-text-tertiary hover:text-text-primary hover:bg-surface-overlay",
        className
      )}
    >
      {children}
    </button>
  )
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { activeTab } = useTabsContext()
  if (activeTab !== value) return null
  return (
    <div
      role="tabpanel"
      data-state="active"
      className={cn("mt-2 outline-transparent", className)}
    >
      {children}
    </div>
  )
}
