'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Users, Camera, MessageSquare, Star, TrendingUp, TrendingDown,
  Heart, Clock, MapPin, Zap, BarChart3, ArrowRight, Eye,
  Calendar, ChevronDown, Filter,
} from 'lucide-react'

// ─── Seed data ────────────────────────────────────────────────────────────────

const WEEKLY = [
  { label: 'Apr 14', newClients: 12, newPhotographers: 3, messages: 88,  bookings: 4,  saves: 19 },
  { label: 'Apr 21', newClients: 19, newPhotographers: 4, messages: 112, bookings: 6,  saves: 31 },
  { label: 'Apr 28', newClients: 24, newPhotographers: 6, messages: 143, bookings: 9,  saves: 42 },
  { label: 'May 5',  newClients: 31, newPhotographers: 8, messages: 201, bookings: 14, saves: 58 },
  { label: 'May 12', newClients: 38, newPhotographers: 9, messages: 178, bookings: 11, saves: 63 },
  { label: 'May 17', newClients: 45, newPhotographers: 12,messages: 267, bookings: 18, saves: 79 },
]

const TOP_PHOTOGRAPHERS = [
  { name: 'Sarah Chen',   initials: 'SC', bg: 'bg-rose-500',    specialty: 'Wedding',    messages: 42, saves: 28, trustScore: 4.8, area: 'Strathcona' },
  { name: 'Aisha Patel',  initials: 'AP', bg: 'bg-violet-500',  specialty: 'Wedding',    messages: 55, saves: 31, trustScore: 4.6, area: 'Downtown'   },
  { name: 'Marcus Wright',initials: 'MW', bg: 'bg-slate-600',   specialty: 'Portrait',   messages: 31, saves: 21, trustScore: 4.5, area: 'Oliver'     },
  { name: 'Sofia Reyes',  initials: 'SR', bg: 'bg-rose-400',    specialty: 'Newborn',    messages: 18, saves: 14, trustScore: 4.2, area: 'Windermere' },
  { name: 'Priya Patel',  initials: 'PP', bg: 'bg-violet-600',  specialty: 'Event',      messages: 24, saves: 12, trustScore: 4.0, area: 'Downtown'   },
]

const TOP_CLIENTS = [
  { name: 'Luca Romano',  initials: 'LR', bg: 'bg-orange-500',  messagesent: 22, photographers: 3, joined: 'Apr 28' },
  { name: 'Alex Kim',     initials: 'AK', bg: 'bg-blue-500',    messagesent: 14, photographers: 2, joined: 'Apr 14' },
  { name: 'Dana Torres',  initials: 'DT', bg: 'bg-teal-500',    messagesent: 8,  photographers: 2, joined: 'May 1'  },
  { name: 'Ryan Foster',  initials: 'RF', bg: 'bg-indigo-500',  messagesent: 3,  photographers: 1, joined: 'May 10' },
]

const SPECIALTY_DEMAND = [
  { label: 'Wedding',     inquiries: 38, supply: 18 },
  { label: 'Portrait',    inquiries: 29, supply: 14 },
  { label: 'Corporate',   inquiries: 22, supply: 9  },
  { label: 'Newborn',     inquiries: 18, supply: 7  },
  { label: 'Real Estate', inquiries: 12, supply: 5  },
  { label: 'Event',       inquiries: 9,  supply: 4  },
]

const AREA_ACTIVITY = [
  { label: 'Downtown',   clients: 14, photographers: 4 },
  { label: 'Strathcona', clients: 11, photographers: 3 },
  { label: 'Oliver',     clients: 9,  photographers: 2 },
  { label: 'Windermere', clients: 6,  photographers: 2 },
  { label: 'Glenora',    clients: 5,  photographers: 1 },
]

// ─── Mini bar chart ───────────────────────────────────────────────────────────

type WeeklyKey = 'newClients' | 'newPhotographers' | 'messages' | 'bookings' | 'saves'

function Sparkline({ data, field, color }: { data: typeof WEEKLY; field: WeeklyKey; color: string }) {
  const max = Math.max(...data.map(d => d[field]))
  return (
    <div className="flex items-end gap-1 h-16">
      {data.map(d => (
        <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-full rounded-t-sm ${color}`} style={{ height: `${Math.max(4, (d[field] / max) * 58)}px` }} />
          <span className="text-[8px] text-ink-200 whitespace-nowrap">{d.label.replace('Apr ', 'A').replace('May ', 'M')}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function KPI({ label, value, sub, delta, chart, chartField, chartColor }: {
  label: string
  value: string
  sub?: string
  delta?: number
  chart?: boolean
  chartField?: WeeklyKey
  chartColor?: string
}) {
  const up = delta !== undefined && delta >= 0
  return (
    <div className="bg-white rounded-2xl p-5 border border-ink-100">
      <p className="text-xs text-ink-300 font-medium mb-1">{label}</p>
      <p className="text-3xl font-bold text-ink">{value}</p>
      {sub && <p className="text-xs text-ink-400 mt-0.5">{sub}</p>}
      {delta !== undefined && (
        <div className={`flex items-center gap-1 mt-1.5 text-xs font-medium ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(delta)}% vs last week
        </div>
      )}
      {chart && chartField && chartColor && (
        <div className="mt-3">
          <Sparkline data={WEEKLY} field={chartField} color={chartColor} />
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type ViewTab = 'overview' | 'clients' | 'photographers'

export default function AnalyticsPage() {
  const [view, setView] = useState<ViewTab>('overview')

  const latest = WEEKLY[WEEKLY.length - 1]
  const prev   = WEEKLY[WEEKLY.length - 2]

  const clientDelta  = Math.round(((latest.newClients - prev.newClients) / prev.newClients) * 100)
  const photoDelta   = Math.round(((latest.newPhotographers - prev.newPhotographers) / prev.newPhotographers) * 100)
  const msgDelta     = Math.round(((latest.messages - prev.messages) / prev.messages) * 100)
  const bookingDelta = Math.round(((latest.bookings - prev.bookings) / prev.bookings) * 100)

  const maxDemand = Math.max(...SPECIALTY_DEMAND.map(s => s.inquiries))
  const maxArea   = Math.max(...AREA_ACTIVITY.map(a => a.clients + a.photographers))

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Nav */}
      <header className="bg-white border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif font-bold text-ink text-lg">TrueNorth</Link>
            <span className="text-ink-200 text-lg">/</span>
            <Link href="/admin" className="text-sm font-medium text-ink-400 hover:text-ink transition-colors">Admin</Link>
            <span className="text-ink-200 text-lg">/</span>
            <span className="text-sm font-semibold text-ink-500">Analytics</span>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { href: '/admin',             label: 'Dashboard'     },
              { href: '/admin/analytics',   label: 'Analytics'     },
              { href: '/admin/accounts',    label: 'Accounts'      },
              { href: '/admin/support', label: 'Support' },
              { href: '/admin/trust-health', label: 'Trust health'  },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  n.href === '/admin/analytics' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                }`}
              >{n.label}</Link>
            ))}
          </nav>
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">A</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Header + view switcher */}
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Analytics</h1>
            <p className="text-sm text-ink-300 mt-0.5">Client & photographer activity · Edmonton</p>
          </div>
          <div className="flex gap-1 bg-white border border-ink-100 p-1 rounded-xl">
            {([
              { key: 'overview',       label: 'Overview'       },
              { key: 'clients',        label: 'Clients'        },
              { key: 'photographers',  label: 'Photographers'  },
            ] as { key: ViewTab; label: string }[]).map(t => (
              <button key={t.key} onClick={() => setView(t.key)}
                className={`text-sm font-medium px-4 py-2 rounded-lg transition-all ${
                  view === t.key ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        {/* ── OVERVIEW ─────────────────────────────────────────────────────── */}
        {view === 'overview' && (
          <div className="space-y-6">
            {/* KPI row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPI label="Total clients" value={latest.newClients.toString()} delta={clientDelta} chart chartField="newClients" chartColor="bg-blue-400" />
              <KPI label="Active photographers" value={latest.newPhotographers.toString()} delta={photoDelta} chart chartField="newPhotographers" chartColor="bg-violet-400" />
              <KPI label="Messages this week" value={latest.messages.toString()} delta={msgDelta} chart chartField="messages" chartColor="bg-emerald-400" />
              <KPI label="Bookings confirmed" value={latest.bookings.toString()} delta={bookingDelta} chart chartField="bookings" chartColor="bg-amber-400" />
            </div>

            {/* Specialty demand vs supply */}
            <div className="bg-white rounded-2xl p-6 border border-ink-100">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink">Specialty demand vs supply</h2>
                <span className="text-xs text-ink-300 ml-1">client inquiries vs photographer count</span>
              </div>
              <div className="space-y-3">
                {SPECIALTY_DEMAND.map(s => {
                  const gap = s.inquiries / s.supply
                  const hot = gap > 3
                  return (
                    <div key={s.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-ink">{s.label}</span>
                        <div className="flex items-center gap-3">
                          {hot && <span className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full">High demand</span>}
                          <span className="text-xs text-ink-300">{s.inquiries} inquiries · {s.supply} photographers</span>
                        </div>
                      </div>
                      <div className="relative h-3 bg-ink-50 rounded-full overflow-hidden">
                        <div className="absolute left-0 h-full bg-ink-200 rounded-full" style={{ width: `${(s.supply / maxDemand) * 100}%` }} />
                        <div className={`absolute left-0 h-full rounded-full opacity-70 ${hot ? 'bg-red-400' : 'bg-blue-400'}`} style={{ width: `${(s.inquiries / maxDemand) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-4 pt-4 border-t border-ink-50 text-xs">
                <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-blue-400 opacity-70" /><span className="text-ink-400">Client demand</span></div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-2 rounded-sm bg-ink-200" /><span className="text-ink-400">Photographer supply</span></div>
              </div>
            </div>

            {/* Area activity */}
            <div className="bg-white rounded-2xl p-6 border border-ink-100">
              <div className="flex items-center gap-2 mb-5">
                <MapPin className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink">Activity by neighbourhood</h2>
              </div>
              <div className="space-y-3">
                {AREA_ACTIVITY.map(a => (
                  <div key={a.label} className="flex items-center gap-4">
                    <span className="text-sm text-ink-500 w-24 flex-shrink-0">{a.label}</span>
                    <div className="flex-1 flex gap-1 h-5 items-stretch">
                      <div className="bg-blue-100 rounded-l-md flex items-center pl-2" style={{ flex: a.clients }}>
                        <span className="text-[10px] font-medium text-blue-600 whitespace-nowrap">{a.clients} clients</span>
                      </div>
                      <div className="bg-violet-100 rounded-r-md flex items-center pl-2" style={{ flex: a.photographers }}>
                        <span className="text-[10px] font-medium text-violet-600 whitespace-nowrap">{a.photographers} photog.</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CLIENTS ──────────────────────────────────────────────────────── */}
        {view === 'clients' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPI label="Total clients"        value="45"   sub="all time"       delta={clientDelta}  />
              <KPI label="Active this week"     value="12"   sub="sent ≥1 message" />
              <KPI label="Messages sent"        value={WEEKLY.reduce((a, d) => a + d.messages, 0).toString()} sub="all time" />
              <KPI label="Photographers saved"  value={WEEKLY.reduce((a, d) => a + d.saves, 0).toString()} sub="across all clients" />
            </div>

            {/* Engagement funnel */}
            <div className="bg-white rounded-2xl p-6 border border-ink-100">
              <h2 className="font-semibold text-ink mb-5">Client engagement funnel</h2>
              <div className="space-y-3">
                {[
                  { label: 'Signed up',          value: 45, pct: 100, color: 'bg-ink'          },
                  { label: 'Browsed photographers', value: 41, pct: 91, color: 'bg-blue-500'    },
                  { label: 'Saved a photographer', value: 28, pct: 62, color: 'bg-blue-400'     },
                  { label: 'Sent a message',       value: 18, pct: 40, color: 'bg-emerald-500'  },
                  { label: 'Booking confirmed',    value: 8,  pct: 18, color: 'bg-emerald-400'  },
                  { label: 'Left a review',        value: 3,  pct: 7,  color: 'bg-amber-400'    },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-4">
                    <span className="text-sm text-ink-500 w-44 flex-shrink-0">{f.label}</span>
                    <div className="flex-1 bg-ink-50 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full ${f.color}`} style={{ width: `${f.pct}%` }} />
                    </div>
                    <div className="flex items-center gap-2 w-16 flex-shrink-0 text-right">
                      <span className="text-sm font-semibold text-ink">{f.value}</span>
                      <span className="text-xs text-ink-300">{f.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top clients table */}
            <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-ink-50 flex items-center gap-2">
                <Users className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink">Most active clients</h2>
              </div>
              <div className="divide-y divide-ink-50">
                {TOP_CLIENTS.map(c => (
                  <div key={c.name} className="flex items-center gap-4 px-6 py-4 hover:bg-ink-50 transition-colors">
                    <div className={`w-9 h-9 rounded-full ${c.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {c.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-ink">{c.name}</p>
                      <p className="text-xs text-ink-300">Joined {c.joined}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-ink">{c.messagesent}</p>
                      <p className="text-xs text-ink-300">Messages</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-ink">{c.photographers}</p>
                      <p className="text-xs text-ink-300">Photographers</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── PHOTOGRAPHERS ─────────────────────────────────────────────────── */}
        {view === 'photographers' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KPI label="Total photographers"  value="12"  sub="active on platform"  delta={photoDelta}  />
              <KPI label="Pending approval"      value="3"   sub="awaiting review"      />
              <KPI label="Avg trust score"       value="4.1" sub="composite across all" />
              <KPI label="Fully onboarded"       value="9"   sub="profile completeness ≥80%" />
            </div>

            {/* Profile completeness */}
            <div className="bg-white rounded-2xl p-6 border border-ink-100">
              <h2 className="font-semibold text-ink mb-5">Profile completeness breakdown</h2>
              <div className="space-y-3">
                {[
                  { label: 'Display name',      done: 12, total: 12 },
                  { label: 'Bio written',        done: 10, total: 12 },
                  { label: 'Specialties set',    done: 12, total: 12 },
                  { label: 'Rate added',         done: 9,  total: 12 },
                  { label: 'Portfolio uploaded', done: 8,  total: 12 },
                  { label: 'Google linked',      done: 6,  total: 12 },
                  { label: 'Instagram linked',   done: 5,  total: 12 },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-4">
                    <span className="text-sm text-ink-500 w-40 flex-shrink-0">{f.label}</span>
                    <div className="flex-1 bg-ink-50 rounded-full h-2.5 overflow-hidden">
                      <div className="h-full rounded-full bg-ink" style={{ width: `${(f.done / f.total) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-ink w-12 text-right flex-shrink-0">{f.done}/{f.total}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top photographers table */}
            <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-ink-50 flex items-center gap-2">
                <Camera className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink">Top photographers by engagement</h2>
              </div>
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-3 border-b border-ink-50 bg-ink-50">
                {['Photographer', 'Specialty', 'Messages', 'Saves', 'Trust'].map(h => (
                  <span key={h} className="text-xs font-semibold text-ink-400 uppercase tracking-widest">{h}</span>
                ))}
              </div>
              <div className="divide-y divide-ink-50">
                {TOP_PHOTOGRAPHERS.map((p, i) => (
                  <div key={p.name} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 px-6 py-4 items-center hover:bg-ink-50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-bold text-ink-300 w-4 flex-shrink-0">{i + 1}</span>
                      <div className={`w-8 h-8 rounded-full ${p.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {p.initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink truncate">{p.name}</p>
                        <p className="text-[10px] text-ink-300">{p.area}</p>
                      </div>
                    </div>
                    <span className="text-xs text-ink-500">{p.specialty}</span>
                    <span className="text-sm font-bold text-ink">{p.messages}</span>
                    <span className="text-sm font-bold text-ink">{p.saves}</span>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-bold text-ink">{p.trustScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saves sparkline */}
            <div className="bg-white rounded-2xl p-6 border border-ink-100">
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink">Weekly saves (clients bookmarking photographers)</h2>
              </div>
              <Sparkline data={WEEKLY} field="saves" color="bg-rose-400" />
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-ink-50">
                <div className="text-center">
                  <p className="text-lg font-bold text-ink">{WEEKLY.reduce((a, d) => a + d.saves, 0)}</p>
                  <p className="text-xs text-ink-300">Total saves</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-ink">{Math.round(WEEKLY.reduce((a, d) => a + d.saves, 0) / WEEKLY.length)}</p>
                  <p className="text-xs text-ink-300">Avg / week</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-ink">Sarah Chen</p>
                  <p className="text-xs text-ink-300">Most saved</p>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  )
}
