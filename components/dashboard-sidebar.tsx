'use client'

import Image from 'next/image'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Instagram-desktop-style fixed left navigation rail. Rendered only on lg+;
// each dashboard keeps its existing top bar + horizontal tabs for smaller
// screens (the mobile bottom-nav pass comes later). Purely presentational —
// the parent owns tab state and passes the active key + a select handler.

export interface SidebarNavItem {
  key: string
  label: string
  icon: LucideIcon
  /** Optional count rendered as a pill (e.g. unread messages). Hidden when 0. */
  badge?: number
}

export interface SidebarGroup {
  /** Small uppercase section heading. Omit for the top-level group. */
  heading?: string
  items: SidebarNavItem[]
}

interface DashboardSidebarProps {
  groups: SidebarGroup[]
  activeKey: string
  onSelect: (key: string) => void
  /** Account controls pinned to the bottom (view profile, notifications, avatar). */
  footer?: ReactNode
}

export function DashboardSidebar({ groups, activeKey, onSelect, footer }: DashboardSidebarProps) {
  return (
    <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-white border-r border-ink-100 z-40">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2.5 h-16 px-5 border-b border-ink-100 flex-shrink-0">
        <Image src="/logo.png" alt="TrueNorth Frames" width={32} height={32} className="rounded-md" />
        <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
      </Link>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {groups.map((group, gi) => (
          <div key={group.heading ?? `group-${gi}`} className="space-y-1">
            {group.heading && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-ink-300">
                {group.heading}
              </p>
            )}
            {group.items.map(item => {
              const Icon = item.icon
              const active = activeKey === item.key
              return (
                <button
                  key={item.key}
                  onClick={() => onSelect(item.key)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    active ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                  }`}
                >
                  <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-white/20 text-white' : 'bg-ink text-white'
                    }`}>
                      {item.badge > 99 ? '99+' : item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Account footer */}
      {footer && (
        <div className="border-t border-ink-100 p-3 flex-shrink-0">
          {footer}
        </div>
      )}
    </aside>
  )
}
