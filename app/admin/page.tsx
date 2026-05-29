'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users, Camera, MessageSquare, Shield, AlertTriangle,
  CheckCircle2, Clock, Activity, BarChart3, ArrowRight,
  RefreshCw, Zap, LogOut, Loader2, BookOpen, Star,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Stats {
  totalClients: number
  totalPhotographers: number
  pendingApprovals: number
  flaggedReviews: number
  totalBookings: number
  completedBookings: number
  recentActivity: { id: string; full_name: string; email: string; role: string; created_at: string }[]
  specialtyDist: { label: string; count: number }[]
}

function StatCard({ label, value, icon: Icon, accent, href }: {
  label: string; value: string | number; icon: React.ElementType; accent: string; href?: string
}) {
  const inner = (
    <div className={`bg-white rounded-2xl p-5 border border-ink-100 flex items-start gap-4 ${href ? 'hover:border-ink-300 transition-colors' : ''}`}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-300 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
      </div>
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

const ROLE_COLORS: Record<string, string> = {
  client: 'bg-blue-50 text-blue-700',
  photographer: 'bg-violet-50 text-violet-700',
  admin: 'bg-ink text-white',
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function AdminDashboard() {
  const router = useRouter()
  const [stats, setStats]       = useState<Stats | null>(null)
  const [loading, setLoading]   = useState(true)
  const [adminName, setAdminName] = useState('')

  async function loadStats() {
    setLoading(true)
    const res = await fetch('/api/admin/stats')
    if (res.status === 403 || res.status === 401) {
      router.push('/admin/login')
      return
    }
    if (res.ok) setStats(await res.json())
    setLoading(false)
  }

  useEffect(() => {
    fetch('/api/admin/me').then(r => r.ok ? r.json() : null).then(d => {
      if (!d) { router.push('/admin/login'); return }
      setAdminName(d.name?.split(' ')[0] ?? 'Admin')
    })
    loadStats()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const totalMax = Math.max(...(stats?.specialtyDist ?? []).map(s => s.count), 1)

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Top nav */}
      <header className="bg-white border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif font-bold text-ink text-lg">TrueNorth</Link>
            <span className="text-ink-200 text-lg">/</span>
            <span className="text-sm font-semibold text-ink-500">Admin</span>
          </div>
          <nav className="hidden md:flex items-center gap-1">
            {[
              { href: '/admin',             label: 'Dashboard'    },
              { href: '/admin/accounts',    label: 'Accounts'     },
              { href: '/admin/support',     label: 'Support'      },
              { href: '/admin/trust-health',label: 'Trust health' },
              { href: '/admin/analytics',   label: 'Analytics'    },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  n.href === '/admin' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                }`}
              >{n.label}</Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-400 hidden sm:block">{adminName}</span>
            <button onClick={signOut}
              className="flex items-center gap-1.5 text-xs text-ink-400 hover:text-red-500 transition-colors">
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Platform overview</h1>
            <p className="text-sm text-ink-300 mt-0.5">Edmonton · TrueNorth Frames</p>
          </div>
          <button onClick={loadStats} disabled={loading}
            className="flex items-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>

        {loading && !stats ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total clients"       value={stats?.totalClients ?? 0}       icon={Users}       accent="bg-blue-50 text-blue-600"    href="/admin/accounts?role=client" />
              <StatCard label="Photographers"       value={stats?.totalPhotographers ?? 0} icon={Camera}      accent="bg-violet-50 text-violet-600" href="/admin/accounts?role=photographer" />
              <StatCard label="Total bookings"      value={stats?.totalBookings ?? 0}      icon={BookOpen}    accent="bg-emerald-50 text-emerald-600" />
              <StatCard label="Pending approvals"   value={stats?.pendingApprovals ?? 0}   icon={Clock}       accent="bg-amber-50 text-amber-600"   href="/admin/accounts?role=photographer&status=pending" />
            </div>

            {/* Second row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Completed sessions"  value={stats?.completedBookings ?? 0}  icon={CheckCircle2} accent="bg-emerald-50 text-emerald-600" />
              <StatCard label="Flagged reviews"     value={stats?.flaggedReviews ?? 0}     icon={AlertTriangle} accent="bg-red-50 text-red-600" />
              <StatCard label="Completion rate"
                value={stats && stats.totalBookings > 0
                  ? `${Math.round((stats.completedBookings / stats.totalBookings) * 100)}%`
                  : '—'}
                icon={BarChart3} accent="bg-sky-50 text-sky-600" />
              <StatCard label="Trust syncs"         value="Live"                            icon={Shield}      accent="bg-ink-50 text-ink-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent signups */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-ink-50">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink">Recent signups</h2>
                  </div>
                  <Link href="/admin/accounts" className="text-xs text-ink-400 hover:text-ink transition-colors">View all →</Link>
                </div>
                <div className="divide-y divide-ink-50">
                  {(stats?.recentActivity ?? []).length === 0 ? (
                    <p className="text-center text-xs text-ink-300 py-8">No users yet</p>
                  ) : (stats?.recentActivity ?? []).map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-6 py-3.5">
                      <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                        {u.full_name?.[0]?.toUpperCase() ?? '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{u.full_name}</p>
                        <p className="text-xs text-ink-300 truncate">{u.email}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] ?? 'bg-ink-100 text-ink-500'}`}>
                        {u.role}
                      </span>
                      <span className="text-xs text-ink-300 flex-shrink-0">{relTime(u.created_at)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4">
                {/* Specialty breakdown */}
                <div className="bg-white rounded-2xl p-5 border border-ink-100">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink text-sm">Specialties</h2>
                  </div>
                  {(stats?.specialtyDist ?? []).length === 0 ? (
                    <p className="text-xs text-ink-300">No data yet</p>
                  ) : (
                    <div className="space-y-2.5">
                      {(stats?.specialtyDist ?? []).map(s => (
                        <div key={s.label} className="flex items-center gap-3">
                          <span className="text-xs text-ink-500 w-20 flex-shrink-0 truncate">{s.label}</span>
                          <div className="flex-1 bg-ink-50 rounded-full h-2 overflow-hidden">
                            <div className="h-full rounded-full bg-ink" style={{ width: `${(s.count / totalMax) * 100}%` }} />
                          </div>
                          <span className="text-xs font-semibold text-ink w-4 flex-shrink-0">{s.count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action cards */}
                {(stats?.pendingApprovals ?? 0) > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <p className="text-sm font-semibold text-amber-800">Pending approvals</p>
                    </div>
                    <p className="text-3xl font-bold text-amber-700 mb-1">{stats?.pendingApprovals}</p>
                    <p className="text-xs text-amber-600 mb-3">Photographers waiting for review</p>
                    <Link href="/admin/accounts?role=photographer"
                      className="flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-900 transition-colors">
                      Review queue <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {(stats?.flaggedReviews ?? 0) > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                      <p className="text-sm font-semibold text-red-800">Flagged reviews</p>
                    </div>
                    <p className="text-3xl font-bold text-red-600 mb-1">{stats?.flaggedReviews}</p>
                    <p className="text-xs text-red-500 mb-3">Reviews need moderation</p>
                    <Link href="/admin/accounts"
                      className="flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800 transition-colors">
                      View flags <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* Quick links */}
                <div className="bg-white border border-ink-100 rounded-2xl p-4 space-y-1">
                  {[
                    { label: 'Accounts',      href: '/admin/accounts',     icon: Users         },
                    { label: 'Trust health',  href: '/admin/trust-health', icon: Shield        },
                    { label: 'Support',       href: '/admin/support',      icon: MessageSquare },
                    { label: 'Analytics',     href: '/admin/analytics',    icon: BarChart3     },
                  ].map(l => (
                    <Link key={l.href} href={l.href}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50 transition-colors group">
                      <l.icon className="w-4 h-4 text-ink-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-ink flex-1">{l.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-ink-200 group-hover:text-ink-400 transition-colors" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
