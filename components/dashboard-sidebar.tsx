'use client'

import Image from 'next/image'
import Link from 'next/link'
import { X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// Instagram-desktop-style left navigation rail. On lg+ it's a fixed rail; on
// smaller screens it becomes an off-canvas drawer the parent toggles via
// `open`/`onClose` (opened from a hamburger in the mobile top bar). Purely
// presentational — the parent owns tab state and passes the active key + a
// select handler.

export interface SidebarNavItem {
  key: string
  label: string
  icon: LucideIcon
  /** Optional count rendered as a pill (e.g. unread messages). Hidden when 0. */
  badge?: number
  /** When set, the item is a link (e.g. Browse photographers) instead of a tab/section switch. */
  href?: string
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
  /** Mobile drawer open state. Ignored on lg+ where the rail is always visible. */
  open?: boolean
  /** Close the mobile drawer (backdrop tap, item select, close button). */
  onClose?: () => void
}

export function DashboardSidebar({ groups, activeKey, onSelect, footer, open = false, onClose }: DashboardSidebarProps) {
  function handleSelect(key: string) {
    onSelect(key)
    onClose?.() // collapse the drawer after choosing, on mobile
  }

  return (
    <>
      {/* Backdrop — mobile only, when the drawer is open */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-[55] lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-ink-100 flex flex-col z-[60] transform transition-transform duration-200 lg:translate-x-0 lg:z-40 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo (+ close button on mobile) */}
        <div className="flex items-center justify-between h-16 px-5 border-b border-ink-100 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="TrueNorth Frames" width={32} height={32} className="rounded-md" />
            <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-ink-400 hover:text-ink p-1 -mr-1"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
                const className = `w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  active ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                }`
                const inner = (
                  <>
                    <Icon className="w-[18px] h-[18px] flex-shrink-0" />
                    <span className="flex-1 text-left truncate">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        active ? 'bg-white/20 text-white' : 'bg-ink text-white'
                      }`}>
                        {item.badge > 99 ? '99+' : item.badge}
                      </span>
                    )}
                  </>
                )
                return item.href ? (
                  <Link key={item.key} href={item.href} onClick={onClose} className={className}>
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={item.key}
                    data-tour={`nav-${item.key}`}
                    onClick={() => handleSelect(item.key)}
                    aria-current={active ? 'page' : undefined}
                    className={className}
                  >
                    {inner}
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
    </>
  )
}
