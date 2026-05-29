'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, Search, Bell, LayoutDashboard, LogOut } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface NavUser {
  initials: string
  avatarUrl: string | null
  role: 'client' | 'photographer' | null
  dashboardHref: string
}

export function Nav() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [navUser, setNavUser] = useState<NavUser | null>(null)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Fetch role + name/avatar from whichever table matches
      const res = await fetch('/api/client/me').then(r => r.ok ? r.json() : null)
      if (res?.role === 'client') {
        const name: string = res.full_name ?? 'Client'
        const parts = name.trim().split(' ').filter(Boolean)
        const inits = parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join('')
        setNavUser({ initials: inits, avatarUrl: null, role: 'client', dashboardHref: '/dashboard/client' })
        return
      }

      // Try photographer
      const pRes = await fetch('/api/photographer/profile').then(r => r.ok ? r.json() : null)
      if (pRes) {
        const name: string = pRes.display_name ?? 'Photographer'
        const parts = name.trim().split(' ').filter(Boolean)
        const inits = parts.map((p: string) => p[0].toUpperCase()).slice(0, 2).join('')
        setNavUser({ initials: inits, avatarUrl: pRes.avatar_url ?? null, role: 'photographer', dashboardHref: '/dashboard/photographer' })
      }
    }
    loadUser()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    setNavUser(null)
    setProfileOpen(false)
    window.location.href = '/'
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-ink-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <Image src="/logo.png" alt="TrueNorth Frames" width={36} height={36} className="rounded-md" priority />
            <span className="font-semibold text-ink text-sm tracking-tight hidden sm:block">TrueNorth Frames</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/photographers" className="text-sm text-ink-400 hover:text-ink transition-colors">Browse photographers</Link>
            <Link href="/for-photographers" className="text-sm text-ink-400 hover:text-ink transition-colors">For photographers</Link>
            <Link href="/how-it-works" className="text-sm text-ink-400 hover:text-ink transition-colors">How it works</Link>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            <Link href="/photographers" className="hidden sm:flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink transition-colors px-3 py-2 rounded-lg hover:bg-ink-50">
              <Search className="w-3.5 h-3.5" />
              Search
            </Link>

            {navUser ? (
              // ── Logged-in state ──
              <div className="flex items-center gap-2">
                <Link href={navUser.dashboardHref}
                  className="hidden sm:flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink px-3 py-2 rounded-lg hover:bg-ink-50 transition-colors">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>

                {/* Avatar dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileOpen(v => !v)}
                    className="w-9 h-9 rounded-xl overflow-hidden border-2 border-ink-100 hover:border-ink transition-colors flex-shrink-0 flex items-center justify-center"
                  >
                    {navUser.avatarUrl ? (
                      <Image src={navUser.avatarUrl} alt="Profile" width={36} height={36} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full bg-ink flex items-center justify-center text-white text-[11px] font-bold">
                        {navUser.initials}
                      </div>
                    )}
                  </button>

                  {profileOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl border border-ink-100 z-20 overflow-hidden"
                        style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                        <Link href={navUser.dashboardHref} onClick={() => setProfileOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-ink-50 transition-colors border-b border-ink-50">
                          <LayoutDashboard className="w-3.5 h-3.5 text-ink-400" />
                          Dashboard
                        </Link>
                        {navUser.role === 'photographer' && (
                          <Link href="/photographers/your-profile" onClick={() => setProfileOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink hover:bg-ink-50 transition-colors border-b border-ink-50">
                            <Bell className="w-3.5 h-3.5 text-ink-400" />
                            View profile
                          </Link>
                        )}
                        <button onClick={signOut}
                          className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-500 hover:bg-red-50 transition-colors">
                          <LogOut className="w-3.5 h-3.5" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              // ── Logged-out state ──
              <>
                <Link href="/login" className="hidden sm:block text-sm text-ink-400 hover:text-ink transition-colors px-3 py-2">Sign in</Link>
                <Link href="/signup" className="bg-ink hover:bg-ink-800 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
                  Get started
                </Link>
              </>
            )}

            <button className="md:hidden p-2 rounded-lg hover:bg-ink-50 transition-colors" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
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
            ...(navUser
              ? [{ href: navUser.dashboardHref, label: 'Dashboard' }]
              : [{ href: '/login', label: 'Sign in' }, { href: '/signup', label: 'Get started' }]
            ),
          ].map((item) => (
            <Link key={item.href} href={item.href}
              className="block text-sm text-ink-400 hover:text-ink py-2.5 border-b border-ink-50 last:border-0"
              onClick={() => setMobileOpen(false)}>
              {item.label}
            </Link>
          ))}
          {navUser && (
            <button onClick={signOut} className="block w-full text-left text-sm text-red-500 py-2.5">Sign out</button>
          )}
        </div>
      )}
    </nav>
  )
}
