'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Search, LayoutDashboard, Menu, X } from 'lucide-react'

/** Client-facing top nav, mirroring the production Nav but wired to /marketing. */
export function SiteNav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/marketing" className="flex items-center gap-2.5 group flex-shrink-0">
            <Image src="/logo.png" alt="TrueNorth Frames" width={36} height={36} className="rounded-md" priority />
            <span className="font-semibold text-ink text-sm tracking-tight hidden sm:block">TrueNorth Frames</span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link href="/marketing/browse" className="text-sm text-ink-400 hover:text-ink transition-colors">Browse photographers</Link>
            <Link href="/marketing/dashboard" className="text-sm text-ink-400 hover:text-ink transition-colors">For photographers</Link>
            <Link href="/marketing/messages" className="text-sm text-ink-400 hover:text-ink transition-colors">Messages</Link>
          </div>

          <div className="flex items-center gap-2">
            <Link href="/marketing/browse" className="hidden sm:flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink transition-colors px-3 py-2 rounded-lg hover:bg-ink-50">
              <Search className="w-3.5 h-3.5" /> Search
            </Link>
            <Link href="/marketing/dashboard" className="hidden sm:flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink px-3 py-2 rounded-lg hover:bg-ink-50 transition-colors">
              <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <Link href="/marketing/browse" className="bg-ink hover:bg-ink-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              Get started
            </Link>
            <button className="md:hidden p-2 rounded-lg hover:bg-ink-50 transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X className="w-4 h-4 text-ink" /> : <Menu className="w-4 h-4 text-ink" />}
            </button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-ink-100 bg-white px-4 py-3 space-y-0.5">
          {[
            { href: '/marketing/browse', label: 'Browse photographers' },
            { href: '/marketing/dashboard', label: 'For photographers' },
            { href: '/marketing/messages', label: 'Messages' },
          ].map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)} className="block px-3 py-2.5 text-sm text-ink-500 hover:bg-ink-50 rounded-lg transition-colors">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
