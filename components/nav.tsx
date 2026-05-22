'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X, Search } from 'lucide-react'

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <Image
              src="/logo.png"
              alt="TrueNorth Frames"
              width={36}
              height={36}
              className="rounded-md"
              priority
            />
            <span className="font-semibold text-ink text-sm tracking-tight hidden sm:block">
              TrueNorth Frames
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/photographers" className="text-sm text-ink-400 hover:text-ink transition-colors">
              Browse photographers
            </Link>
            <Link href="/for-photographers" className="text-sm text-ink-400 hover:text-ink transition-colors">
              For photographers
            </Link>
            <Link href="/how-it-works" className="text-sm text-ink-400 hover:text-ink transition-colors">
              How it works
            </Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Link href="/photographers" className="hidden sm:flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink transition-colors px-3 py-2 rounded-lg hover:bg-ink-50">
              <Search className="w-3.5 h-3.5" />
              Search
            </Link>
            <Link href="/login" className="hidden sm:block text-sm text-ink-400 hover:text-ink transition-colors px-3 py-2">
              Sign in
            </Link>
            <Link
              href="/signup"
              className="bg-ink hover:bg-ink-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Get started
            </Link>
            <button
              className="md:hidden p-2 rounded-lg hover:bg-ink-50 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-4 h-4 text-ink" /> : <Menu className="w-4 h-4 text-ink" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-ink-100 bg-white px-4 py-3 space-y-0.5">
          {[
            { href: '/photographers', label: 'Browse photographers' },
            { href: '/for-photographers', label: 'For photographers' },
            { href: '/how-it-works', label: 'How it works' },
            { href: '/login', label: 'Sign in' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block text-sm text-ink-400 hover:text-ink py-2.5 border-b border-ink-50 last:border-0"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
