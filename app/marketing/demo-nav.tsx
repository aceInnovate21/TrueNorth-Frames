'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, MessageSquare, CalendarCheck, LayoutDashboard } from 'lucide-react'

const LINKS = [
  { href: '/marketing/browse', label: 'Browse', icon: Search },
  { href: '/marketing/messages', label: 'Messages', icon: MessageSquare },
  { href: '/marketing/book', label: 'Bookings', icon: CalendarCheck },
  { href: '/marketing/dashboard', label: 'Dashboard', icon: LayoutDashboard },
]

export function DemoNav() {
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-ink-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center gap-4 h-16">
        <Link href="/marketing" className="flex items-center gap-2.5 group shrink-0">
          <Image src="/logo.png" alt="TrueNorth Frames" width={34} height={34} className="rounded-md" priority />
          <span className="font-semibold text-[15px] tracking-tight hidden sm:block group-hover:text-ink-600 transition-colors">
            TrueNorth Frames
          </span>
        </Link>

        <div className="flex items-center gap-1 ml-auto">
          {LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  active ? 'bg-ink text-white' : 'text-ink-500 hover:bg-ink-50 hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:block">{label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
