'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { AdminNav } from '@/components/admin-nav'
import {
  Globe, Star, RefreshCw, AlertTriangle,
  CheckCircle2, Clock, X, ChevronDown, ChevronUp, Shield,
  Zap, AlertCircle, Activity, BarChart3,
  Wifi, WifiOff, Loader2,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type SyncStatus = 'success' | 'partial' | 'failed' | 'pending'
type Platform   = 'google'

interface SyncLogEntry {
  syncedAt:      string
  status:        SyncStatus
  errorMessage:  string | null
  fetchedRating: number | null
  fetchedCount:  number | null
  scoreBefore:   number | null
  scoreAfter:    number | null
}

interface PlatformHealth {
  platform:                Platform
  profilesLinked:          number
  profilesUpdatedLastSync: number
  avgRating:               number
  totalReviews:            number
  lastSyncAt:              string | null
  lastStatus:              SyncStatus
  errorMessage:            string | null
  logs:                    SyncLogEntry[]
}

interface HealthData {
  overallStatus:          SyncStatus
  platformsMonitored:     number
  profilesWithTrustData:  number
  avgCompositeScore:      string | null
  totalReviewsTracked:    number
  platforms:              PlatformHealth[]
}

// ─── Static config ────────────────────────────────────────────────────────────

// Instagram and Facebook are out of scope until post-launch Meta app review.
// Trust is built exclusively from Google Business Profile.
const PLATFORM_META: Record<Platform, { label: string; icon: React.ElementType; iconColor: string; description: string }> = {
  google: { label: 'Google Business Profile', icon: Globe, iconColor: 'text-blue-500', description: 'Star rating · Review count · Account age · Verified status' },
}

const WEIGHT_NOTES = [
  { label: 'GBP connected (baseline)', weight: 75,   note: 'Unlocked the moment GBP is connected' },
  { label: 'Reviews (rating + count)', weight: 12.5, note: 'Star rating 55% · Review count 45%' },
  { label: 'Verification + completeness', weight: 9.5, note: 'GBP verified 55% · Profile completeness 45%' },
  { label: 'Account age',               weight: 3,   note: 'Up to 5 years' },
]

const PLATFORM_ORDER: Platform[] = ['google']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusStyle(s: SyncStatus) {
  return {
    success: { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', icon: CheckCircle2  },
    failed:  { pill: 'bg-red-50 text-red-700 border-red-200',             dot: 'bg-red-500',     icon: AlertTriangle },
    partial: { pill: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-500',   icon: AlertCircle   },
    pending: { pill: 'bg-ink-50 text-ink-400 border-ink-100',             dot: 'bg-ink-300',     icon: Clock         },
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

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

// ─── Platform card ────────────────────────────────────────────────────────────

function PlatformCard({ p, onForceSync }: {
  p: PlatformHealth
  onForceSync: () => Promise<void>
}) {
  const [expanded, setExpanded] = useState(false)
  const [syncing, setSyncing]   = useState(false)
  const meta  = PLATFORM_META[p.platform]
  const style = statusStyle(p.lastStatus)
  const Icon  = meta.icon

  async function forceSync() {
    setSyncing(true)
    try { await onForceSync() } finally { setSyncing(false) }
  }

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      p.lastStatus === 'failed'  ? 'border-red-200'    :
      p.lastStatus === 'partial' ? 'border-amber-200'  : 'border-ink-100'
    }`}>
      <div className="px-6 py-5">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            p.lastStatus === 'failed'  ? 'bg-red-50'   :
            p.lastStatus === 'partial' ? 'bg-amber-50' : 'bg-ink-50'
          }`}>
            <Icon className={`w-5 h-5 ${meta.iconColor}`} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h3 className="font-semibold text-ink">{meta.label}</h3>
              <StatusPill status={p.lastStatus} />
              <span className="text-[10px] text-ink-300 font-medium">{meta.description}</span>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-ink-400">
              {p.lastSyncAt
                ? <span>Last sync: <span className="text-ink font-medium">{relTime(p.lastSyncAt)}</span></span>
                : <span className="text-ink-300">No sync yet</span>
              }
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
            <p className={`text-lg font-bold ${
              p.profilesUpdatedLastSync === 0 && p.profilesLinked > 0 ? 'text-red-500' :
              p.profilesUpdatedLastSync < p.profilesLinked             ? 'text-amber-500' : 'text-ink'
            }`}>
              {p.profilesLinked > 0 ? `${p.profilesUpdatedLastSync}/${p.profilesLinked}` : '—'}
            </p>
            <p className="text-xs text-ink-300">Updated last sync</p>
          </div>
          <div>
            {p.avgRating > 0
              ? <p className="text-lg font-bold text-ink">{p.avgRating}</p>
              : <p className="text-lg font-bold text-ink-200">—</p>
            }
            <p className="text-xs text-ink-300">{p.avgRating > 0 ? 'Avg rating' : 'Ratings N/A'}</p>
          </div>
          <div>
            {p.totalReviews > 0
              ? <p className="text-lg font-bold text-ink">{p.totalReviews}</p>
              : <p className="text-lg font-bold text-ink-200">—</p>
            }
            <p className="text-xs text-ink-300">{p.totalReviews > 0 ? 'Reviews tracked' : 'Followers / Engagement'}</p>
          </div>
        </div>

        {/* Error message */}
        {p.errorMessage && (
          <div className={`flex items-start gap-2.5 mt-4 p-3.5 rounded-xl ${
            p.lastStatus === 'failed' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'
          }`}>
            <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${
              p.lastStatus === 'failed' ? 'text-red-500' : 'text-amber-500'
            }`} />
            <p className={`text-xs leading-relaxed ${
              p.lastStatus === 'failed' ? 'text-red-700' : 'text-amber-700'
            }`}>{p.errorMessage}</p>
          </div>
        )}
      </div>

      {/* Sync log */}
      {expanded && (
        <div className="border-t border-ink-50 px-6 py-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-3">Sync history (last 5)</p>
          {p.logs.length === 0 ? (
            <p className="text-xs text-ink-300">No sync history yet</p>
          ) : (
            <div className="space-y-2.5">
              {p.logs.map((log, i) => {
                const ls = statusStyle(log.status)
                return (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${ls.dot}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-ink-400">{relTime(log.syncedAt)}</span>
                        <StatusPill status={log.status} />
                        {log.fetchedCount != null && log.fetchedCount > 0 && (
                          <span className="text-[10px] text-ink-300">{log.fetchedCount} reviews</span>
                        )}
                        {log.fetchedRating != null && (
                          <span className="text-[10px] text-ink-300">★ {log.fetchedRating}</span>
                        )}
                        {log.scoreBefore != null && log.scoreAfter != null && log.scoreAfter !== log.scoreBefore && (
                          <span className="text-[10px] text-ink-400">
                            score {log.scoreBefore} → {log.scoreAfter}
                          </span>
                        )}
                      </div>
                      {log.errorMessage && (
                        <p className="text-xs text-red-500 mt-0.5 truncate">{log.errorMessage}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TrustHealthPage() {
  const [data, setData]               = useState<HealthData | null>(null)
  const [loading, setLoading]         = useState(true)
  const [fetchError, setFetchError]   = useState('')
  const [globalSyncing, setGlobalSyncing] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const res = await fetch('/api/admin/trust-health')
      if (!res.ok) throw new Error()
      setData(await res.json())
    } catch {
      setFetchError('Could not load trust health data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function syncAll() {
    setGlobalSyncing(true)
    try {
      await fetch('/api/admin/trust-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    } finally {
      setGlobalSyncing(false)
      await load()
    }
  }

  // Per-platform force sync triggers a full sync then reloads (platform-scoped sync API is per-photographer not per-platform)
  async function forceSyncPlatform() {
    await fetch('/api/admin/trust-sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    await load()
  }

  const platforms: PlatformHealth[] = data
    ? PLATFORM_ORDER.map(p => data.platforms.find(x => x.platform === p) ?? {
        platform: p, profilesLinked: 0, profilesUpdatedLastSync: 0,
        avgRating: 0, totalReviews: 0, lastSyncAt: null,
        lastStatus: 'pending' as SyncStatus, errorMessage: null, logs: [],
      })
    : []

  const overallStatus: SyncStatus = data?.overallStatus ?? 'pending'
  const healthy  = platforms.filter(p => p.lastStatus === 'success').length
  const degraded = platforms.filter(p => p.lastStatus === 'partial').length
  const failing  = platforms.filter(p => p.lastStatus === 'failed').length

  return (
    <div className="min-h-screen bg-ink-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Trust aggregator health</h1>
            <p className="text-sm text-ink-300 mt-0.5">Vercel Cron syncs all platforms daily at 6 AM MST</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={load} disabled={loading}
              className="flex items-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 px-4 py-2.5 rounded-xl hover:bg-ink-50 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Refresh
            </button>
            <button onClick={syncAll} disabled={globalSyncing || loading}
              className="flex items-center gap-2 text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-60 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${globalSyncing ? 'animate-spin' : ''}`} />
              {globalSyncing ? 'Syncing all…' : 'Sync all now'}
            </button>
          </div>
        </div>

        {loading && !data ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
          </div>
        ) : fetchError ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl py-10 text-center">
            <p className="text-sm text-red-600">{fetchError}</p>
            <button onClick={load} className="mt-3 text-xs font-medium text-red-600 underline">Retry</button>
          </div>
        ) : (
          <>
            {/* Overall status banner */}
            <div className={`rounded-2xl px-6 py-4 border flex items-center gap-4 ${
              overallStatus === 'success' ? 'bg-emerald-50 border-emerald-200' :
              overallStatus === 'partial' ? 'bg-amber-50 border-amber-200'    : 'bg-red-50 border-red-200'
            }`}>
              {overallStatus === 'success'
                ? <Wifi className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                : <WifiOff className={`w-5 h-5 flex-shrink-0 ${overallStatus === 'failed' ? 'text-red-500' : 'text-amber-500'}`} />
              }
              <div className="flex-1">
                <p className={`font-semibold text-sm ${
                  overallStatus === 'success' ? 'text-emerald-800' :
                  overallStatus === 'partial' ? 'text-amber-800'   : 'text-red-800'
                }`}>
                  {overallStatus === 'success' ? 'All systems healthy' :
                   overallStatus === 'partial' ? 'Some syncs degraded' :
                   overallStatus === 'pending' ? 'No syncs yet'        : 'One or more syncs failing'}
                </p>
                <p className={`text-xs mt-0.5 ${
                  overallStatus === 'success' ? 'text-emerald-600' :
                  overallStatus === 'partial' ? 'text-amber-600'   : 'text-red-600'
                }`}>
                  {healthy} healthy · {degraded} degraded · {failing} failing
                </p>
              </div>
              <StatusPill
                status={overallStatus}
                label={overallStatus === 'success' ? 'All healthy' : overallStatus === 'partial' ? 'Degraded' : overallStatus === 'pending' ? 'Pending' : 'Action needed'}
              />
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Platforms monitored',    value: String(data?.platformsMonitored ?? 4), icon: Activity,  color: 'bg-ink-50 text-ink'             },
                { label: 'Profiles with trust data', value: String(data?.profilesWithTrustData ?? 0), icon: Shield, color: 'bg-blue-50 text-blue-600'   },
                { label: 'Avg composite score',    value: data?.avgCompositeScore ?? '—',        icon: Star,      color: 'bg-amber-50 text-amber-600'     },
                { label: 'Reviews tracked',        value: String(data?.totalReviewsTracked ?? 0), icon: BarChart3, color: 'bg-emerald-50 text-emerald-600' },
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
              {platforms.map(p => (
                <PlatformCard key={p.platform} p={p} onForceSync={forceSyncPlatform} />
              ))}
            </div>

            {/* Score formula */}
            <div className="bg-white rounded-2xl border border-ink-100 p-6">
              <div className="flex items-center gap-2 mb-5">
                <Zap className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink">Trust score formula</h2>
                <span className="text-xs text-ink-300 ml-1">GBP-only · Scale 75–100</span>
              </div>
              <div className="space-y-3">
                {WEIGHT_NOTES.map(w => (
                  <div key={w.label} className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-ink-600 font-medium">{w.label}</span>
                        <span className="text-xs font-bold text-ink">+{w.weight}</span>
                      </div>
                      <div className="h-1.5 bg-ink-50 rounded-full overflow-hidden mb-0.5">
                        <div className="h-full rounded-full bg-ink" style={{ width: `${(w.weight / 100) * 100}%` }} />
                      </div>
                      <p className="text-[10px] text-ink-300">{w.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-300 mt-4 pt-3 border-t border-ink-50">
                Total max: 100. Minimum score: 75 (GBP connected). Adjust in{' '}
                <code className="bg-ink-50 px-1.5 py-0.5 rounded text-ink-500">lib/trust/types.ts</code>.
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
