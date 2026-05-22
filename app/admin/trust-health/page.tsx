'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Globe, Instagram, Star, Facebook, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, X, ChevronDown, ChevronUp, Shield,
  Zap, AlertCircle, Activity, BarChart3, ExternalLink,
  TrendingUp, Wifi, WifiOff,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

// Matches DBML trust_sync_status enum
type SyncStatus = 'success' | 'partial' | 'failed' | 'pending'
type Platform = 'google' | 'instagram' | 'yelp' | 'facebook'

interface SyncLog {
  time: string
  status: SyncStatus
  detail: string
  profilesUpdated?: number
}

interface PlatformHealth {
  platform: Platform
  label: string
  icon: React.ElementType
  iconColor: string
  weight: number
  lastSync: string
  nextSync: string
  status: SyncStatus
  profilesLinked: number
  profilesUpdated: number
  avgRating: number
  totalReviews: number
  errorMessage?: string
  logs: SyncLog[]
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const PLATFORMS: PlatformHealth[] = [
  {
    platform: 'google',
    label: 'Google Reviews',
    icon: Globe,
    iconColor: 'text-blue-500',
    weight: 35,
    lastSync: 'May 17, 2026 · 6:00 AM',
    nextSync: 'May 18, 2026 · 6:00 AM',
    status: 'success',
    profilesLinked: 9,
    profilesUpdated: 9,
    avgRating: 4.6,
    totalReviews: 312,
    logs: [
      { time: 'May 17 · 6:00 AM', status: 'success',      detail: '9 profiles synced successfully',     profilesUpdated: 9 },
      { time: 'May 16 · 6:00 AM', status: 'success',      detail: '9 profiles synced successfully',     profilesUpdated: 9 },
      { time: 'May 15 · 6:00 AM', status: 'success',      detail: '8 profiles synced successfully',     profilesUpdated: 8 },
      { time: 'May 14 · 6:00 AM', status: 'partial', detail: 'API quota exceeded — retried at 8 AM, success', profilesUpdated: 9 },
      { time: 'May 13 · 6:00 AM', status: 'success',      detail: '9 profiles synced successfully',     profilesUpdated: 9 },
    ],
  },
  {
    platform: 'instagram',
    label: 'Instagram',
    icon: Instagram,
    iconColor: 'text-pink-500',
    weight: 10,
    lastSync: 'May 17, 2026 · 6:03 AM',
    nextSync: 'May 18, 2026 · 6:03 AM',
    status: 'success',
    profilesLinked: 7,
    profilesUpdated: 6,
    avgRating: 0,
    totalReviews: 0,
    logs: [
      { time: 'May 17 · 6:03 AM', status: 'success',  detail: '6/7 profiles synced (1 handle invalid)',  profilesUpdated: 6 },
      { time: 'May 16 · 6:03 AM', status: 'success',  detail: '7 profiles synced successfully',          profilesUpdated: 7 },
      { time: 'May 15 · 6:03 AM', status: 'success',  detail: '7 profiles synced successfully',          profilesUpdated: 7 },
      { time: 'May 14 · 6:03 AM', status: 'success',  detail: '7 profiles synced successfully',          profilesUpdated: 7 },
      { time: 'May 13 · 6:03 AM', status: 'success',  detail: '7 profiles synced successfully',          profilesUpdated: 7 },
    ],
  },
  {
    platform: 'yelp',
    label: 'Yelp',
    icon: Star,
    iconColor: 'text-red-500',
    weight: 20,
    lastSync: 'May 16, 2026 · 6:05 AM',
    nextSync: 'May 18, 2026 · 6:05 AM',
    status: 'failed',
    profilesLinked: 5,
    profilesUpdated: 0,
    avgRating: 4.1,
    totalReviews: 87,
    errorMessage: 'HTTP 429 — Yelp Fusion API rate limit exceeded. Quota resets at midnight PST. Retry scheduled for May 18 · 6:05 AM.',
    logs: [
      { time: 'May 17 · 6:05 AM', status: 'failed',       detail: 'HTTP 429 — rate limited, no retry today', profilesUpdated: 0 },
      { time: 'May 16 · 6:05 AM', status: 'success',      detail: '5 profiles synced successfully',           profilesUpdated: 5 },
      { time: 'May 15 · 6:05 AM', status: 'success',      detail: '5 profiles synced successfully',           profilesUpdated: 5 },
      { time: 'May 14 · 6:05 AM', status: 'partial', detail: 'Rate limited, retried 8 AM — success',     profilesUpdated: 5 },
      { time: 'May 13 · 6:05 AM', status: 'success',      detail: '5 profiles synced successfully',           profilesUpdated: 5 },
    ],
  },
  {
    platform: 'facebook',
    label: 'Facebook',
    icon: Facebook,
    iconColor: 'text-blue-600',
    weight: 15,
    lastSync: 'May 17, 2026 · 6:08 AM',
    nextSync: 'May 18, 2026 · 6:08 AM',
    status: 'partial',
    profilesLinked: 4,
    profilesUpdated: 2,
    avgRating: 4.3,
    totalReviews: 54,
    errorMessage: 'Graph API returned partial data for 2 of 4 profiles. Meta app token refresh required — pending manual action.',
    logs: [
      { time: 'May 17 · 6:08 AM', status: 'partial', detail: '2/4 profiles synced — token issue on 2',  profilesUpdated: 2 },
      { time: 'May 16 · 6:08 AM', status: 'success',      detail: '4 profiles synced successfully',           profilesUpdated: 4 },
      { time: 'May 15 · 6:08 AM', status: 'success',      detail: '4 profiles synced successfully',           profilesUpdated: 4 },
      { time: 'May 14 · 6:08 AM', status: 'success',      detail: '4 profiles synced successfully',           profilesUpdated: 4 },
      { time: 'May 13 · 6:08 AM', status: 'success',      detail: '3 profiles synced (1 unlinked)',            profilesUpdated: 3 },
    ],
  },
]

const WEIGHT_NOTES = [
  { label: 'Google Reviews', weight: 35 },
  { label: 'Yelp',           weight: 20 },
  { label: 'Native reviews', weight: 20 },
  { label: 'Facebook',       weight: 15 },
  { label: 'Instagram',      weight: 10 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusStyle(s: SyncStatus) {
  return {
    success:      { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2 },
    failed:       { pill: 'bg-red-50 text-red-700 border-red-200',            dot: 'bg-red-500',     icon: AlertTriangle },
    partial: { pill: 'bg-amber-50 text-amber-700 border-amber-200',      dot: 'bg-amber-500',   icon: AlertCircle },
    pending:      { pill: 'bg-ink-50 text-ink-400 border-ink-100',            dot: 'bg-ink-300',     icon: Clock },
  }[s]
}

function StatusPill({ status, label }: { status: SyncStatus; label?: string }) {
  const s = statusStyle(status)
  const Icon = s.icon
  const text = label ?? { success: 'Healthy', failed: 'Failed', partial: 'Degraded', pending: 'Pending' }[status]
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.pill}`}>
      <Icon className="w-2.5 h-2.5" />{text}
    </span>
  )
}

// ─── Platform card ────────────────────────────────────────────────────────────

function PlatformCard({ p }: { p: PlatformHealth }) {
  const [expanded, setExpanded] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const style = statusStyle(p.status)
  const Icon = p.icon

  function forceSync() {
    setSyncing(true)
    setTimeout(() => setSyncing(false), 2000)
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      p.status === 'failed' ? 'border-red-200' : p.status === 'partial' ? 'border-amber-200' : 'border-ink-100'
    }`}>
      {/* Card header */}
      <div className="px-6 py-5">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            p.status === 'failed' ? 'bg-red-50' : p.status === 'partial' ? 'bg-amber-50' : 'bg-ink-50'
          }`}>
            <Icon className={`w-5 h-5 ${p.iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-ink">{p.label}</h3>
              <StatusPill status={p.status} />
              <span className="text-[10px] text-ink-300 font-medium">weight {p.weight}%</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-ink-400">
              <span>Last sync: <span className="text-ink font-medium">{p.lastSync}</span></span>
              <span>Next: <span className="text-ink font-medium">{p.nextSync}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={forceSync} disabled={syncing}
              className="flex items-center gap-1.5 text-xs font-medium border border-ink-100 text-ink-500 px-3 py-1.5 rounded-xl hover:bg-ink-50 hover:text-ink disabled:opacity-50 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Force sync'}
            </button>
            <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400 transition-colors">
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-ink-50">
          <div>
            <p className="text-lg font-bold text-ink">{p.profilesLinked}</p>
            <p className="text-xs text-ink-300">Profiles linked</p>
          </div>
          <div>
            <p className={`text-lg font-bold ${p.profilesUpdated === 0 ? 'text-red-500' : p.profilesUpdated < p.profilesLinked ? 'text-amber-500' : 'text-ink'}`}>
              {p.profilesUpdated}/{p.profilesLinked}
            </p>
            <p className="text-xs text-ink-300">Updated last sync</p>
          </div>
          {p.avgRating > 0 ? (
            <div>
              <p className="text-lg font-bold text-ink">{p.avgRating}</p>
              <p className="text-xs text-ink-300">Avg rating</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-bold text-ink-200">—</p>
              <p className="text-xs text-ink-300">Ratings N/A</p>
            </div>
          )}
          {p.totalReviews > 0 ? (
            <div>
              <p className="text-lg font-bold text-ink">{p.totalReviews}</p>
              <p className="text-xs text-ink-300">Reviews tracked</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-bold text-ink-200">—</p>
              <p className="text-xs text-ink-300">Followers/Engagement</p>
            </div>
          )}
        </div>

        {/* Error message */}
        {p.errorMessage && (
          <div className={`flex items-start gap-2.5 mt-4 p-3.5 rounded-xl ${
            p.status === 'failed' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${p.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`} />
            <p className={`text-xs leading-relaxed ${p.status === 'failed' ? 'text-red-700' : 'text-amber-700'}`}>{p.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Expanded log */}
      {expanded && (
        <div className="border-t border-ink-50 px-6 py-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-3">Sync history (last 5)</p>
          <div className="space-y-2.5">
            {p.logs.map((log, i) => {
              const ls = statusStyle(log.status)
              const LIcon = ls.icon
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ls.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-ink-400">{log.time}</span>
                      <StatusPill status={log.status} />
                      {log.profilesUpdated !== undefined && log.profilesUpdated > 0 && (
                        <span className="text-[10px] text-ink-300">{log.profilesUpdated} updated</span>
                      )}
                    </div>
                    <p className="text-xs text-ink-500 mt-0.5">{log.detail}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrustHealthPage() {
  const healthy   = PLATFORMS.filter(p => p.status === 'success').length
  const degraded  = PLATFORMS.filter(p => p.status === 'partial').length
  const failing   = PLATFORMS.filter(p => p.status === 'failed').length
  const [globalSyncing, setGlobalSyncing] = useState(false)

  function syncAll() {
    setGlobalSyncing(true)
    setTimeout(() => setGlobalSyncing(false), 2500)
  }

  const overallStatus = failing > 0 ? 'failed' : degraded > 0 ? 'partial' : 'success'

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
            <span className="text-sm font-semibold text-ink-500">Trust health</span>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { href: '/admin',            label: 'Dashboard'     },
              { href: '/admin/accounts',   label: 'Accounts'      },
              { href: '/admin/support', label: 'Support' },
              { href: '/admin/trust-health', label: 'Trust health'  },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  n.href === '/admin/trust-health' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                }`}
              >{n.label}</Link>
            ))}
          </nav>
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">A</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Trust aggregator health</h1>
            <p className="text-sm text-ink-300 mt-0.5">Vercel Cron syncs all platforms daily at 6 AM MST</p>
          </div>
          <button onClick={syncAll} disabled={globalSyncing}
            className="flex items-center gap-2 text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-60 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${globalSyncing ? 'animate-spin' : ''}`} />
            {globalSyncing ? 'Syncing all…' : 'Sync all now'}
          </button>
        </div>

        {/* Overall status banner */}
        <div className={`rounded-2xl px-6 py-4 border flex items-center gap-4 ${
          overallStatus === 'success'      ? 'bg-emerald-50 border-emerald-200' :
          overallStatus === 'partial' ? 'bg-amber-50 border-amber-200' :
                                            'bg-red-50 border-red-200'
        }`}>
          {overallStatus === 'success'
            ? <Wifi className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            : <WifiOff className={`w-5 h-5 flex-shrink-0 ${overallStatus === 'failed' ? 'text-red-500' : 'text-amber-500'}`} />
          }
          <div className="flex-1">
            <p className={`font-semibold text-sm ${
              overallStatus === 'success' ? 'text-emerald-800' : overallStatus === 'partial' ? 'text-amber-800' : 'text-red-800'
            }`}>
              {overallStatus === 'success' ? 'All systems healthy' : overallStatus === 'partial' ? 'Some syncs degraded' : 'One or more syncs failing'}
            </p>
            <p className={`text-xs mt-0.5 ${
              overallStatus === 'success' ? 'text-emerald-600' : overallStatus === 'partial' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {healthy} healthy · {degraded} degraded · {failing} failing
            </p>
          </div>
          <StatusPill status={overallStatus} label={overallStatus === 'success' ? 'All healthy' : overallStatus === 'partial' ? 'Degraded' : 'Action needed'} />
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Platforms monitored', value: PLATFORMS.length.toString(),                                                         icon: Activity,    color: 'bg-ink-50 text-ink'            },
            { label: 'Profiles with trust data', value: '12',                                                                           icon: Shield,      color: 'bg-blue-50 text-blue-600'       },
            { label: 'Avg composite score', value: '4.1',                                                                               icon: Star,        color: 'bg-amber-50 text-amber-600'     },
            { label: 'Reviews tracked', value: PLATFORMS.reduce((a, p) => a + p.totalReviews, 0).toString(),                           icon: BarChart3,   color: 'bg-emerald-50 text-emerald-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-2xl p-5 border border-ink-100 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-2xl font-bold text-ink">{s.value}</p>
                <p className="text-xs text-ink-300">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Platform cards */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-ink">Platform status</h2>
          {PLATFORMS.map(p => <PlatformCard key={p.platform} p={p} />)}
        </div>

        {/* Weight config */}
        <div className="bg-white rounded-2xl border border-ink-100 p-6">
          <div className="flex items-center gap-2 mb-5">
            <Zap className="w-4 h-4 text-ink-400" />
            <h2 className="font-semibold text-ink">Trust score weights</h2>
            <span className="text-xs text-ink-300 ml-1">(configurable in codebase — future admin UI)</span>
          </div>
          <div className="space-y-3">
            {WEIGHT_NOTES.map(w => (
              <div key={w.label} className="flex items-center gap-4">
                <span className="text-sm text-ink-500 w-36 flex-shrink-0">{w.label}</span>
                <div className="flex-1 bg-ink-50 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full bg-ink" style={{ width: `${w.weight * 2.86}%` }} />
                </div>
                <span className="text-sm font-semibold text-ink w-8 flex-shrink-0 text-right">{w.weight}%</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-ink-300 mt-4">Weights must sum to 100%. Adjust in <code className="bg-ink-50 px-1.5 py-0.5 rounded text-ink-500">lib/trust-weights.ts</code> (backend).</p>
        </div>

      </main>
    </div>
  )
}
