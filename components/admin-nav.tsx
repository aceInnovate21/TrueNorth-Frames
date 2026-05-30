'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin',              label: 'Dashboard'    },
  { href: '/admin/accounts',     label: 'Accounts'     },
  { href: '/admin/support',      label: 'Support'      },
  { href: '/admin/conversations',label: 'Conversations' },
  { href: '/admin/analytics',    label: 'Analytics'    },
  { href: '/admin/trust-health', label: 'Trust health' },
]

export function AdminNav({ openCount }: { openCount?: number }) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [name, setName] = useState('')

  useEffect(() => {
    fetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setName(d.name?.split(' ')[0] ?? 'Admin')
    })
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  // Active match: /admin exactly, or starts-with for sub-pages
  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <header className="bg-white border-b border-ink-100 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="font-serif font-bold text-ink text-lg">TrueNorth</Link>
          <span className="text-ink-200 text-lg">/</span>
          <span className="text-sm font-semibold text-ink-500">Admin</span>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(n => (
            <Link key={n.href} href={n.href}
              className={`relative text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isActive(n.href)
                  ? 'bg-ink text-white'
                  : 'text-ink-400 hover:text-ink hover:bg-ink-50'
              }`}
            >
              {n.label}
              {n.href === '/admin/support' && openCount != null && openCount > 0 && (
                <span className="ml-1.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {openCount}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-ink-400 hidden sm:block">{name}</span>
          <button onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-red-500 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
