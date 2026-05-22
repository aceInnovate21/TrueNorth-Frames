'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, Camera, MessageSquare, TrendingUp, TrendingDown,
  Shield, AlertTriangle, CheckCircle2, Clock, Activity,
  BarChart3, Eye, ArrowRight, RefreshCw, Zap,
} from 'lucide-react'

// ─── Seed data ────────────────────────────────────────────────────────────────

const GROWTH_WEEKS = [
  { label: 'Apr 14', clients: 12, photographers: 3, messages: 88 },
  { label: 'Apr 21', clients: 19, photographers: 4, messages: 112 },
  { label: 'Apr 28', clients: 24, photographers: 6, messages: 143 },
  { label: 'May 5',  clients: 31, photographers: 8, messages: 201 },
  { label: 'May 12', clients: 38, photographers: 9, messages: 178 },
  { label: 'May 17', clients: 45, photographers: 12, messages: 267 },
]

const TRUST_DIST = [
  { label: '4.5–5.0', count: 8,  color: 'bg-emerald-500' },
  { label: '4.0–4.4', count: 14, color: 'bg-emerald-400' },
  { label: '3.5–3.9', count: 9,  color: 'bg-amber-400'   },
  { label: '3.0–3.4', count: 5,  color: 'bg-amber-500'   },
  { label: '< 3.0',   count: 2,  color: 'bg-red-400'     },
]

const RECENT_ACTIVITY = [
  { id: 1, type: 'approval',  text: 'New photographer pending review',    sub: 'Jordan Lee · Strathcona',       time: '4m ago',  icon: Clock,       color: 'text-amber-500'  },
  { id: 2, type: 'signup',    text: 'New client registered',              sub: 'priya@example.com',             time: '18m ago', icon: Users,       color: 'text-emerald-500'},
  { id: 3, type: 'trust',     text: 'Trust sync completed',               sub: 'Google · 12 profiles updated',  time: '1h ago',  icon: Shield,      color: 'text-blue-500'   },
  { id: 4, type: 'signup',    text: 'New photographer registered',        sub: 'Sofia Reyes · Windermere',      time: '2h ago',  icon: Camera,      color: 'text-violet-500' },
  { id: 5, type: 'flag',      text: 'Conversation flagged',               sub: 'conv_8f3a · off-platform ask',  time: '3h ago',  icon: AlertTriangle,color: 'text-red-500'   },
  { id: 6, type: 'approval',  text: 'Photographer approved',              sub: 'Marcus Wright · Wedding',       time: '5h ago',  icon: CheckCircle2, color: 'text-emerald-500'},
  { id: 7, type: 'trust',     text: 'Yelp sync failed',                   sub: 'Rate limited · will retry 6am', time: '6h ago',  icon: AlertTriangle,color: 'text-amber-500'  },
  { id: 8, type: 'signup',    text: 'New client registered',              sub: 'alex.k@gmail.com',              time: '8h ago',  icon: Users,       color: 'text-emerald-500'},
]

const SPECIALTY_DIST = [
  { label: 'Wedding',    count: 18 },
  { label: 'Portrait',   count: 14 },
  { label: 'Corporate',  count: 9  },
  { label: 'Newborn',    count: 7  },
  { label: 'Real Estate',count: 5  },
  { label: 'Event',      count: 4  },
  { label: 'Family',     count: 3  },
]

// ─── Mini chart ───────────────────────────────────────────────────────────────

function BarChart({ data, field, color }: {
  data: typeof GROWTH_WEEKS
  field: 'clients' | 'photographers' | 'messages'
  color: string
}) {
  const max = Math.max(...data.map(d => d[field]))
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`w-full rounded-t-md ${color} opacity-80`}
            style={{ height: `${(d[field] / max) * 88}px` }}
          />
          <span className="text-[9px] text-ink-300 whitespace-nowrap">{d.label.replace('Apr ', 'A').replace('May ', 'M')}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, delta, deltaLabel, icon: Icon, accent }: {
  label: string
  value: string
  delta?: number
  deltaLabel?: string
  icon: React.ElementType
  accent: string
}) {
  const up = delta !== undefined && delta >= 0
  return (
    <div className="bg-white rounded-2xl p-5 border border-ink-100 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
        <Icon className="w-4.5 h-4.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-ink-300 font-medium mb-1">{label}</p>
        <p className="text-2xl font-bold text-ink">{value}</p>
        {delta !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
            {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(delta)}% {deltaLabel ?? 'vs last week'}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type MetricTab = 'growth' | 'messages' | 'trust'

export default function AdminDashboard() {
  const [metricTab, setMetricTab] = useState<MetricTab>('growth')

  const latest = GROWTH_WEEKS[GROWTH_WEEKS.length - 1]
  const prev = GROWTH_WEEKS[GROWTH_WEEKS.length - 2]
  const clientDelta = Math.round(((latest.clients - prev.clients) / prev.clients) * 100)
  const photoDelta = Math.round(((latest.photographers - prev.photographers) / prev.photographers) * 100)
  const msgDelta = Math.round(((latest.messages - prev.messages) / prev.messages) * 100)
  const totalMax = Math.max(...SPECIALTY_DIST.map(s => s.count))

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
          <nav className="flex items-center gap-1">
            {[
              { href: '/admin', label: 'Dashboard' },
              { href: '/admin/analytics', label: 'Analytics' },
              { href: '/admin/accounts', label: 'Accounts' },
              { href: '/admin/support', label: 'Support' },
              { href: '/admin/trust-health', label: 'Trust health' },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  n.href === '/admin' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                }`}
              >{n.label}</Link>
            ))}
          </nav>
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">A</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Platform overview</h1>
            <p className="text-sm text-ink-300 mt-0.5">Edmonton · last updated just now</p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>

        {/* Top stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total clients" value={latest.clients.toString()} delta={clientDelta} icon={Users} accent="bg-blue-50 text-blue-600" />
          <StatCard label="Active photographers" value={latest.photographers.toString()} delta={photoDelta} icon={Camera} accent="bg-violet-50 text-violet-600" />
          <StatCard label="Messages this week" value={latest.messages.toString()} delta={msgDelta} icon={MessageSquare} accent="bg-emerald-50 text-emerald-600" />
          <StatCard label="Pending approvals" value="3" icon={Clock} accent="bg-amber-50 text-amber-600" />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Growth chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-ink-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink">Weekly growth</h2>
              </div>
              <div className="flex gap-1 bg-ink-50 p-1 rounded-lg">
                {([
                  { key: 'growth', label: 'Users' },
                  { key: 'messages', label: 'Messages' },
                  { key: 'trust', label: 'Trust' },
                ] as { key: MetricTab; label: string }[]).map(t => (
                  <button key={t.key} onClick={() => setMetricTab(t.key)}
                    className={`text-xs font-medium px-3 py-1 rounded-md transition-all ${
                      metricTab === t.key ? 'bg-white text-ink shadow-sm' : 'text-ink-400 hover:text-ink'
                    }`}
                  >{t.label}</button>
                ))}
              </div>
            </div>

            {metricTab === 'growth' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-ink-300 mb-2 font-medium">Clients</p>
                  <BarChart data={GROWTH_WEEKS} field="clients" color="bg-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-ink-300 mb-2 font-medium">Photographers</p>
                  <BarChart data={GROWTH_WEEKS} field="photographers" color="bg-violet-400" />
                </div>
              </div>
            )}
            {metricTab === 'messages' && (
              <div>
                <p className="text-xs text-ink-300 mb-2 font-medium">Messages per week</p>
                <BarChart data={GROWTH_WEEKS} field="messages" color="bg-emerald-400" />
                <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-ink-50">
                  <div className="text-center">
                    <p className="text-lg font-bold text-ink">{GROWTH_WEEKS.reduce((a, d) => a + d.messages, 0)}</p>
                    <p className="text-xs text-ink-300">Total messages</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-ink">{Math.round(GROWTH_WEEKS.reduce((a, d) => a + d.messages, 0) / GROWTH_WEEKS.length)}</p>
                    <p className="text-xs text-ink-300">Avg / week</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-ink">38</p>
                    <p className="text-xs text-ink-300">Active threads</p>
                  </div>
                </div>
              </div>
            )}
            {metricTab === 'trust' && (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-ink mb-3">Trust score distribution across {TRUST_DIST.reduce((a, d) => a + d.count, 0)} photographers</p>
                  <div className="space-y-2.5">
                    {TRUST_DIST.map(d => (
                      <div key={d.label} className="flex items-center gap-3">
                        <span className="text-xs text-ink-400 w-16 flex-shrink-0">{d.label}</span>
                        <div className="flex-1 bg-ink-50 rounded-full h-3 overflow-hidden">
                          <div className={`h-full rounded-full ${d.color}`} style={{ width: `${(d.count / 14) * 100}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-ink w-5 flex-shrink-0">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-ink-50">
                  <div>
                    <p className="text-lg font-bold text-ink">4.1</p>
                    <p className="text-xs text-ink-300">Avg trust score</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-ink">2</p>
                    <p className="text-xs text-ink-300">Below threshold</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Specialty breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-ink-100">
            <div className="flex items-center gap-2 mb-5">
              <Zap className="w-4 h-4 text-ink-400" />
              <h2 className="font-semibold text-ink">Specialties</h2>
            </div>
            <div className="space-y-3">
              {SPECIALTY_DIST.map(s => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="text-xs text-ink-500 w-20 flex-shrink-0">{s.label}</span>
                  <div className="flex-1 bg-ink-50 rounded-full h-2 overflow-hidden">
                    <div className="h-full rounded-full bg-ink" style={{ width: `${(s.count / totalMax) * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-ink w-4 flex-shrink-0">{s.count}</span>
                </div>
              ))}
            </div>
            <div className="mt-5 pt-5 border-t border-ink-50">
              <p className="text-xs text-ink-300">Top specialty</p>
              <p className="text-base font-bold text-ink mt-0.5">Wedding <span className="text-ink-300 font-normal text-sm">· 18 photographers</span></p>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Activity feed */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-ink-50">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink">Recent activity</h2>
              </div>
              <span className="text-xs text-ink-300">Last 24 hours</span>
            </div>
            <div className="divide-y divide-ink-50">
              {RECENT_ACTIVITY.map(a => {
                const Icon = a.icon
                return (
                  <div key={a.id} className="flex items-start gap-3 px-6 py-3.5">
                    <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${a.color}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink">{a.text}</p>
                      <p className="text-xs text-ink-300">{a.sub}</p>
                    </div>
                    <span className="text-xs text-ink-300 flex-shrink-0">{a.time}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-800">Pending approvals</p>
              </div>
              <p className="text-3xl font-bold text-amber-700 mb-1">3</p>
              <p className="text-xs text-amber-600 mb-4">Photographers waiting for review</p>
              <Link href="/admin/approvals"
                className="flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-900 transition-colors"
              >Review queue <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <p className="text-sm font-semibold text-red-800">Flagged content</p>
              </div>
              <p className="text-3xl font-bold text-red-600 mb-1">1</p>
              <p className="text-xs text-red-500 mb-4">Conversation needs review</p>
              <Link href="/admin/conversations"
                className="flex items-center gap-2 text-sm font-semibold text-red-700 hover:text-red-800 transition-colors"
              >View conversation <ArrowRight className="w-3.5 h-3.5" /></Link>
            </div>

            <div className="bg-white border border-ink-100 rounded-2xl p-5 space-y-3">
              {[
                { label: 'Analytics',    sub: 'Client & photographer data',      href: '/admin/analytics',    icon: BarChart3     },
                { label: 'Accounts',     sub: '45 clients · 12 photographers',  href: '/admin/accounts',     icon: Users         },
                { label: 'Trust health', sub: '1 sync failing',                 href: '/admin/trust-health', icon: Shield        },
                { label: 'Support',sub: '38 active threads',              href: '/admin/support',icon: MessageSquare },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-ink-50 transition-colors group"
                >
                  <l.icon className="w-4 h-4 text-ink-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink">{l.label}</p>
                    <p className="text-xs text-ink-300">{l.sub}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-ink-200 group-hover:text-ink-400 transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}
