'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { AdminNav } from '@/components/admin-nav'
import {
  TrendingUp, TrendingDown, Users, Camera, MessageSquare,
  RefreshCw, Loader2, Shield, BookOpen, Download,
  CheckCircle2, MapPin, Target, Clock,
} from 'lucide-react'

// ─── Phase 2 targets ──────────────────────────────────────────────────────────
// Adjust these to match your actual Phase 2 milestone goals
const TARGETS = {
  photographers:  50,    // photographer signups needed
  clients:        200,   // client signups needed
  conversations:  100,   // conversations (platform-validated demand)
  bookings:       20,    // confirmed bookings (feature expansion readiness)
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  platformSince:           string | null
  totalClients:            number
  totalPhotographers:      number
  pendingApprovals:        number
  totalBookings:           number
  completedBookings:       number
  totalMessages:           number
  totalConversations:      number
  totalReviews:            number
  totalSaves:              number
  avgTrustScore:           string | null
  fullyOnboarded:          number
  newClientsThisWeek:      number
  newPhotographersThisWeek: number
  newMessagesThisWeek:     number
  newBookingsThisWeek:     number
  clientDelta:             number | null
  photographerDelta:       number | null
  messageDelta:            number | null
  bookingDelta:            number | null
  specialtyDist:           { label: string; supply: number }[]
  areaMetrics:             { area: string; photographers: number; clients: number }[]
  topPhotographers:        { id: string; displayName: string; location: string; trustScore: number; completeness: number; specialties: string[]; conversations: number; profileStatus: string }[]
  topClients:              { id: string; fullName: string; createdAt: string; messagesSent: number; saves: number }[]
  completeness:            { hasDisplayName: number; hasBio: number; hasLocation: number; hasRate: number; hasAvatar: number; hasCover: number; hasPortfolio: number; hasGoogleLinked: number; total: number }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pct(n: number, d: number) {
  if (!d) return 0
  return Math.round((n / d) * 100)
}

function Delta({ v }: { v: number | null }) {
  if (v === null) return <span className="text-[10px] text-ink-300">First week</span>
  const up = v >= 0
  return (
    <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      {up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {up ? '+' : ''}{v}% vs last week
    </span>
  )
}

const AVATAR_COLORS = [
  'bg-blue-500','bg-violet-600','bg-teal-500','bg-slate-600',
  'bg-orange-500','bg-rose-400','bg-emerald-600','bg-amber-500',
]
function avatarColor(id: string) {
  let n = 0; for (const c of id) n = (n * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function sinceLabel(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })
}

// ─── Progress bar toward Phase 2 target ──────────────────────────────────────

function TargetBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  const p = Math.min(pct(value, target), 100)
  const done = value >= target
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {done
            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            : <Target className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
          }
          <span className="text-sm font-medium text-ink">{label}</span>
        </div>
        <span className={`text-sm font-bold ${done ? 'text-emerald-600' : 'text-ink'}`}>
          {value.toLocaleString()} <span className="text-xs font-normal text-ink-300">/ {target}</span>
        </span>
      </div>
      <div className="h-3 bg-ink-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${done ? 'bg-emerald-500' : color}`}
          style={{ width: `${p}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className={`text-[10px] font-semibold ${done ? 'text-emerald-600' : 'text-ink-400'}`}>
          {done ? '✓ Target reached' : `${p}% of target`}
        </span>
        {!done && (
          <span className="text-[10px] text-ink-300">{target - value} to go</span>
        )}
      </div>
    </div>
  )
}

// ─── CSV download ─────────────────────────────────────────────────────────────

function buildCSV(d: AnalyticsData, sinceDate: string): string {
  const rows: string[][] = []
  rows.push(['TrueNorth Frames — Platform Analytics'])
  rows.push([`Since ${sinceDate}`, `Generated ${new Date().toLocaleDateString('en-CA')}`])
  rows.push([])

  rows.push(['GROWTH'])
  rows.push(['Metric', 'Value', 'New this week'])
  rows.push(['Total clients',        String(d.totalClients),       String(d.newClientsThisWeek)])
  rows.push(['Total photographers',  String(d.totalPhotographers), String(d.newPhotographersThisWeek)])
  rows.push(['Messages sent',        String(d.totalMessages),      String(d.newMessagesThisWeek)])
  rows.push(['Bookings',             String(d.totalBookings),      String(d.newBookingsThisWeek)])
  rows.push(['Completed bookings',   String(d.completedBookings),  ''])
  rows.push([])

  rows.push(['MARKETPLACE HEALTH'])
  rows.push(['Metric', 'Value'])
  rows.push(['Conversations started',  String(d.totalConversations)])
  rows.push(['Client → message rate',  `${pct(d.totalConversations, d.totalClients)}%`])
  rows.push(['Conv → booking rate',    `${pct(d.totalBookings, d.totalConversations)}%`])
  rows.push(['Booking completion rate',`${pct(d.completedBookings, d.totalBookings)}%`])
  rows.push(['Reviews collected',      String(d.totalReviews)])
  rows.push(['Saves (bookmarks)',       String(d.totalSaves)])
  rows.push([])

  rows.push(['PHASE 2 READINESS'])
  rows.push(['Target', 'Goal', 'Current', 'Progress'])
  rows.push(['Photographers', String(TARGETS.photographers), String(d.totalPhotographers), `${pct(d.totalPhotographers, TARGETS.photographers)}%`])
  rows.push(['Clients',       String(TARGETS.clients),       String(d.totalClients),       `${pct(d.totalClients, TARGETS.clients)}%`])
  rows.push(['Conversations', String(TARGETS.conversations), String(d.totalConversations), `${pct(d.totalConversations, TARGETS.conversations)}%`])
  rows.push(['Bookings',      String(TARGETS.bookings),      String(d.totalBookings),      `${pct(d.totalBookings, TARGETS.bookings)}%`])
  rows.push([])

  rows.push(['SUPPLY QUALITY'])
  rows.push(['Metric', 'Value'])
  rows.push(['Avg trust score',      d.avgTrustScore ?? '—'])
  rows.push(['Fully onboarded (≥80%)', String(d.fullyOnboarded)])
  rows.push(['Google Business linked', String(d.completeness.hasGoogleLinked)])
  rows.push(['Portfolio uploaded',     String(d.completeness.hasPortfolio)])
  rows.push([])

  rows.push(['SPECIALTIES'])
  rows.push(['Specialty', 'Photographers'])
  for (const s of d.specialtyDist) rows.push([s.label, String(s.supply)])
  rows.push([])

  if (d.areaMetrics.length > 0) {
    rows.push(['NEIGHBOURHOOD BREAKDOWN'])
    rows.push(['Area', 'Photographers', 'Clients'])
    for (const a of d.areaMetrics) rows.push([a.area, String(a.photographers), String(a.clients)])
    rows.push([])
  }

  rows.push(['TOP CLIENTS (by messages sent)'])
  rows.push(['Name', 'Messages sent', 'Saves'])
  for (const c of d.topClients) rows.push([c.fullName, String(c.messagesSent), String(c.saves)])

  return rows.map(r => r.map(v => `"${v.replace(/"/g, '""')}"`).join(',')).join('\n')
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const downloadRef           = useRef<HTMLAnchorElement>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/admin/analytics')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch { setError('Could not load analytics.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function downloadCSV() {
    if (!data) return
    const since = sinceLabel(data.platformSince)
    const csv  = buildCSV(data, since)
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = downloadRef.current!
    a.href     = url
    a.download = `truenorth-analytics-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const d = data

  // Computed rates
  const messagingRate  = d ? pct(d.totalConversations, d.totalClients)    : 0
  const bookingRate    = d ? pct(d.totalBookings, d.totalConversations)    : 0
  const completionRate = d ? pct(d.completedBookings, d.totalBookings)     : 0
  const reviewRate     = d ? pct(d.totalReviews, d.completedBookings)      : 0
  const saveRate       = d ? pct(d.totalSaves, d.totalClients)             : 0
  const onboardingRate = d ? pct(d.fullyOnboarded, d.totalPhotographers)   : 0
  const trustCoverage  = d ? pct(d.completeness.hasGoogleLinked, d.completeness.total) : 0

  // Phase 2 score: how many of the 4 targets are hit
  const phase2Targets = d ? [
    d.totalPhotographers >= TARGETS.photographers,
    d.totalClients       >= TARGETS.clients,
    d.totalConversations >= TARGETS.conversations,
    d.totalBookings      >= TARGETS.bookings,
  ] : []
  const phase2Score   = phase2Targets.filter(Boolean).length
  const phase2Ready   = phase2Score === 4

  return (
    <div className="min-h-screen bg-ink-50">
      <AdminNav />
      {/* Hidden download anchor */}
      <a ref={downloadRef} className="hidden" />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink">Platform analytics</h1>
            {d?.platformSince && (
              <div className="flex items-center gap-1.5 mt-1">
                <Clock className="w-3.5 h-3.5 text-ink-300" />
                <p className="text-sm text-ink-300">
                  Since <span className="font-medium text-ink-500">{sinceLabel(d.platformSince)}</span> · Edmonton, AB
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 text-sm font-medium border border-ink-100 bg-white text-ink-500 px-4 py-2 rounded-xl hover:bg-ink-50 disabled:opacity-50 transition-colors">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </button>
            <button onClick={downloadCSV} disabled={!data}
              className="flex items-center gap-2 text-sm font-semibold bg-ink text-white px-4 py-2 rounded-xl hover:bg-ink-800 disabled:opacity-50 transition-colors">
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        </div>

        {loading && !d ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={load} className="mt-3 text-xs text-red-600 underline">Retry</button>
          </div>
        ) : d && (
          <>
            {/* ── 1. Phase 2 readiness ──────────────────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-base font-bold text-ink">Phase 2 readiness</h2>
                  <p className="text-xs text-ink-300 mt-0.5">
                    Targets to unlock Phase 2 features — priority listings &amp; advanced booking tools
                  </p>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-semibold text-sm ${
                  phase2Ready
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    : 'bg-amber-50 border-amber-200 text-amber-700'
                }`}>
                  {phase2Ready
                    ? <><CheckCircle2 className="w-4 h-4" /> Ready for Phase 2</>
                    : <><Target className="w-4 h-4" /> {phase2Score}/4 targets hit</>
                  }
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-ink-100 space-y-5">
                <TargetBar label="Photographers listed"   value={d.totalPhotographers} target={TARGETS.photographers} color="bg-violet-400" />
                <TargetBar label="Clients signed up"       value={d.totalClients}       target={TARGETS.clients}       color="bg-blue-400"   />
                <TargetBar label="Conversations started"   value={d.totalConversations} target={TARGETS.conversations} color="bg-emerald-400"/>
                <TargetBar label="Bookings confirmed"      value={d.totalBookings}       target={TARGETS.bookings}      color="bg-amber-400"  />

                <div className="pt-4 border-t border-ink-50 text-xs text-ink-400">
                  Phase 2 unlocks: <span className="font-medium text-ink">Priority listings for photographers</span> · <span className="font-medium text-ink">Advanced booking management tools</span> · <span className="font-medium text-ink">Enhanced client matching</span>
                </div>
              </div>
            </section>

            {/* ── 2. Growth momentum ───────────────────────────────────── */}
            <section>
              <h2 className="text-base font-bold text-ink mb-1">Growth momentum</h2>
              <p className="text-xs text-ink-300 mb-5">New activity this week vs last week</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: 'Total clients',      value: d.totalClients,       sub: `+${d.newClientsThisWeek} this week`,       delta: d.clientDelta,       icon: Users,          accent: 'bg-blue-50 text-blue-600'    },
                  { label: 'Photographers',      value: d.totalPhotographers, sub: `+${d.newPhotographersThisWeek} this week`,  delta: d.photographerDelta, icon: Camera,         accent: 'bg-violet-50 text-violet-600'},
                  { label: 'Messages sent',      value: d.totalMessages,      sub: `+${d.newMessagesThisWeek} this week`,       delta: d.messageDelta,      icon: MessageSquare,  accent: 'bg-emerald-50 text-emerald-600'},
                  { label: 'Bookings',           value: d.totalBookings,      sub: `+${d.newBookingsThisWeek} this week`,       delta: d.bookingDelta,      icon: BookOpen,       accent: 'bg-amber-50 text-amber-600'  },
                ].map(m => (
                  <div key={m.label} className="bg-white rounded-2xl p-5 border border-ink-100 flex flex-col gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.accent}`}>
                      <m.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-ink">{m.value.toLocaleString()}</p>
                      <p className="text-xs text-ink-400 mt-0.5">{m.label}</p>
                      <p className="text-[10px] text-ink-300">{m.sub}</p>
                      <div className="mt-1.5"><Delta v={m.delta ?? null} /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 3. Marketplace health ─────────────────────────────────── */}
            <section>
              <h2 className="text-base font-bold text-ink mb-1">Marketplace health</h2>
              <p className="text-xs text-ink-300 mb-5">Conversion rates that signal whether the platform is working</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { value: `${messagingRate}%`,  label: 'Client → message rate',      note: `${d.totalConversations} of ${d.totalClients} clients messaged` },
                  { value: `${bookingRate}%`,    label: 'Conversation → booking rate', note: `${d.totalBookings} of ${d.totalConversations} convos → booking` },
                  { value: `${completionRate}%`, label: 'Booking completion rate',     note: `${d.completedBookings} of ${d.totalBookings} sessions completed` },
                  { value: `${reviewRate}%`,     label: 'Post-session review rate',    note: `${d.totalReviews} of ${d.completedBookings} left a review` },
                ].map(s => (
                  <div key={s.label} className="bg-white rounded-2xl p-5 border border-ink-100">
                    <p className="text-3xl font-bold text-ink">{s.value}</p>
                    <p className="text-xs font-medium text-ink-500 mt-1">{s.label}</p>
                    <p className="text-[10px] text-ink-300 mt-0.5">{s.note}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 4. Client journey funnel ──────────────────────────────── */}
            <section>
              <h2 className="text-base font-bold text-ink mb-1">Client journey funnel</h2>
              <p className="text-xs text-ink-300 mb-5">From signup to completed booking</p>
              <div className="bg-white rounded-2xl p-6 border border-ink-100 space-y-4">
                {[
                  { label: 'Signed up',               value: d.totalClients,        color: 'bg-ink',          note: '100% baseline' },
                  { label: 'Saved a photographer',     value: Math.min(d.totalSaves, d.totalClients), color: 'bg-blue-400',   note: `${saveRate}% showed buying intent` },
                  { label: 'Started a conversation',   value: d.totalConversations,  color: 'bg-violet-400',   note: `${messagingRate}% messaged a photographer` },
                  { label: 'Made a booking',           value: d.totalBookings,       color: 'bg-emerald-400',  note: `${bookingRate}% conv → booking` },
                  { label: 'Session completed',        value: d.completedBookings,   color: 'bg-emerald-600',  note: `${completionRate}% completion rate` },
                  { label: 'Left a review',            value: d.totalReviews,        color: 'bg-amber-400',    note: `${reviewRate}% post-session` },
                ].map(f => (
                  <div key={f.label} className="flex items-center gap-4">
                    <div className="w-48 flex-shrink-0">
                      <p className="text-sm font-medium text-ink">{f.label}</p>
                      <p className="text-[10px] text-ink-300">{f.note}</p>
                    </div>
                    <div className="flex-1 bg-ink-50 rounded-full h-3 overflow-hidden">
                      <div className={`h-full rounded-full ${f.color}`}
                        style={{ width: `${pct(f.value, d.totalClients)}%` }} />
                    </div>
                    <span className="text-sm font-bold text-ink w-12 text-right flex-shrink-0">
                      {f.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── 5. Supply quality + Specialty + Area ──────────────────── */}
            <section>
              <h2 className="text-base font-bold text-ink mb-1">Supply-side quality</h2>
              <p className="text-xs text-ink-300 mb-5">Photographer readiness and marketplace coverage</p>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quality metrics */}
                <div className="bg-white rounded-2xl p-6 border border-ink-100 space-y-4">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Key metrics</p>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { v: `${onboardingRate}%`, label: 'Fully onboarded', sub: `${d.fullyOnboarded}/${d.totalPhotographers} at ≥80%` },
                      { v: `${trustCoverage}%`,  label: 'GBP connected',   sub: `${d.completeness.hasGoogleLinked}/${d.completeness.total} have trust score` },
                      { v: d.avgTrustScore ?? '—', label: 'Avg trust score', sub: 'Scale 75–100' },
                      { v: String(d.pendingApprovals), label: 'Pending approval', sub: 'Awaiting review' },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-xl font-bold text-ink">{s.v}</p>
                        <p className="text-[10px] font-medium text-ink-500">{s.label}</p>
                        <p className="text-[10px] text-ink-300">{s.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-ink-50">
                    <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-2.5">Profile completeness</p>
                    {d.completeness.total > 0 && [
                      { label: 'Display name',  n: d.completeness.hasDisplayName },
                      { label: 'Bio',           n: d.completeness.hasBio         },
                      { label: 'Rate set',      n: d.completeness.hasRate        },
                      { label: 'Portfolio uploaded', n: d.completeness.hasPortfolio },
                      { label: 'Google linked', n: d.completeness.hasGoogleLinked },
                    ].map(f => (
                      <div key={f.label} className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] text-ink-500 w-28 flex-shrink-0">{f.label}</span>
                        <div className="flex-1 bg-ink-50 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-ink"
                            style={{ width: `${pct(f.n, d.completeness.total)}%` }} />
                        </div>
                        <span className="text-[10px] font-semibold text-ink w-10 text-right">{f.n}/{d.completeness.total}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specialty supply */}
                <div className="bg-white rounded-2xl p-6 border border-ink-100">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-4">Specialty supply</p>
                  {d.specialtyDist.length === 0 ? (
                    <p className="text-sm text-ink-300">No specialty data yet</p>
                  ) : (
                    <div className="space-y-2.5">
                      {d.specialtyDist.map(s => {
                        const max = Math.max(...d.specialtyDist.map(x => x.supply), 1)
                        return (
                          <div key={s.label} className="flex items-center gap-3">
                            <span className="text-xs text-ink-600 w-24 flex-shrink-0 truncate">{s.label}</span>
                            <div className="flex-1 bg-ink-50 rounded-full h-2 overflow-hidden">
                              <div className="h-full rounded-full bg-ink"
                                style={{ width: `${(s.supply / max) * 100}%` }} />
                            </div>
                            <span className="text-xs font-bold text-ink w-5 text-right">{s.supply}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Area metrics */}
                <div className="bg-white rounded-2xl p-6 border border-ink-100">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-ink-400" />
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest">By neighbourhood</p>
                  </div>
                  {d.areaMetrics.length === 0 ? (
                    <p className="text-sm text-ink-300">No location data yet — add locations to profiles</p>
                  ) : (
                    <div className="space-y-3">
                      {d.areaMetrics.map(a => (
                        <div key={a.area}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-ink">{a.area}</span>
                            <div className="flex items-center gap-2 text-[10px] text-ink-400">
                              <span className="text-violet-600 font-semibold">{a.photographers}P</span>
                              <span className="text-blue-600 font-semibold">{a.clients}C</span>
                            </div>
                          </div>
                          <div className="flex gap-0.5 h-2">
                            <div className="bg-violet-400 rounded-l-full" style={{ flex: a.photographers }} />
                            <div className="bg-blue-300 rounded-r-full" style={{ flex: a.clients || 0.1 }} />
                          </div>
                        </div>
                      ))}
                      <div className="flex items-center gap-3 pt-2 text-[10px] text-ink-400">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-violet-400" />Photographers</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-300" />Clients</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── 6. Top photographers + clients ───────────────────────── */}
            <section>
              <h2 className="text-base font-bold text-ink mb-5">Engagement leaders</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Top photographers */}
                <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-ink-50 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-ink-400" />
                    <h3 className="font-semibold text-ink text-sm">Top photographers by conversations</h3>
                  </div>
                  {d.topPhotographers.length === 0 ? (
                    <p className="text-sm text-ink-300 px-5 py-6">No conversation data yet</p>
                  ) : (
                    <div className="divide-y divide-ink-50">
                      {d.topPhotographers.slice(0, 6).map((p, i) => (
                        <div key={p.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50 transition-colors">
                          <span className="text-xs font-bold text-ink-300 w-4 flex-shrink-0">{i + 1}</span>
                          <div className={`w-8 h-8 rounded-full ${avatarColor(p.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials(p.displayName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{p.displayName}</p>
                            <p className="text-[10px] text-ink-300">{p.specialties.slice(0,2).join(' · ') || '—'}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-ink">{p.conversations}</p>
                            <p className="text-[10px] text-ink-300">convos</p>
                          </div>
                          {p.trustScore > 0 && (
                            <div className="flex items-center gap-0.5 text-[10px] font-semibold text-blue-600 w-10 flex-shrink-0">
                              <Shield className="w-2.5 h-2.5" />{Number(p.trustScore).toFixed(0)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Top clients */}
                <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
                  <div className="px-5 py-4 border-b border-ink-50 flex items-center gap-2">
                    <Users className="w-4 h-4 text-ink-400" />
                    <h3 className="font-semibold text-ink text-sm">Most active clients</h3>
                  </div>
                  {d.topClients.length === 0 ? (
                    <p className="text-sm text-ink-300 px-5 py-6">No client activity yet</p>
                  ) : (
                    <div className="divide-y divide-ink-50">
                      {d.topClients.slice(0, 6).map((c, i) => (
                        <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-ink-50 transition-colors">
                          <span className="text-xs font-bold text-ink-300 w-4 flex-shrink-0">{i + 1}</span>
                          <div className={`w-8 h-8 rounded-full ${avatarColor(c.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {initials(c.fullName)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink truncate">{c.fullName}</p>
                            <p className="text-[10px] text-ink-300">
                              Joined {new Date(c.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-ink">{c.messagesSent}</p>
                            <p className="text-[10px] text-ink-300">messages</p>
                          </div>
                          <div className="text-right flex-shrink-0 w-10">
                            <p className="text-sm font-bold text-ink">{c.saves}</p>
                            <p className="text-[10px] text-ink-300">saves</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── 7. Investor snapshot ──────────────────────────────────── */}
            <section>
              <div className="bg-ink rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute inset-0 grid-pattern pointer-events-none opacity-40" />
                <div className="relative z-10">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-4">
                    Investor snapshot · TrueNorth Frames
                  </p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                      { v: d.totalPhotographers, label: 'Edmonton photographers listed', note: 'Supply-side of the marketplace' },
                      { v: d.totalClients,        label: 'Clients seeking photographers', note: 'Demand-side, growing week-on-week' },
                      { v: `${messagingRate}%`,   label: 'Client engagement rate',        note: 'Clients who messaged a photographer' },
                      { v: d.totalConversations,  label: 'Direct connections made',        note: 'Photographer ↔ client conversations' },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-3xl font-bold text-white">{typeof s.v === 'number' ? s.v.toLocaleString() : s.v}</p>
                        <p className="text-sm font-semibold text-ink-300 mt-1">{s.label}</p>
                        <p className="text-xs text-ink-500 mt-0.5">{s.note}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
