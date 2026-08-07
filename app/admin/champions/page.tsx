'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminNav } from '@/components/admin-nav'
import { Trophy, Lock, Unlock, RefreshCw, Loader2, X, Check } from 'lucide-react'

type Entry = {
  rank: number
  metricValue: number
  metricLabel: string | null
  photographerId: string
  username: string
  displayName: string
  avatarUrl: string | null
}

type Data = {
  period: string | null
  locked: boolean
  labelMode: 'auto' | 'booked' | 'contacted'
  labels: Record<string, string>
  categories: Record<string, Entry[]>
  roster: { id: string; username: string; display_name: string }[]
}

function monthLabel(period: string | null): string {
  if (!period) return '—'
  return new Date(period + 'T00:00:00').toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
}

export default function AdminChampionsPage() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [pickerFor, setPickerFor] = useState<string | null>(null)
  const [pickValue, setPickValue] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/admin/champions')
    if (res.ok) setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function act(body: any, okMsg: string) {
    setBusy(true); setMsg(null)
    const res = await fetch('/api/admin/champions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const json = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) { setMsg(json.error ?? 'Something went wrong'); return }
    setMsg(okMsg)
    setPickerFor(null); setPickValue('')
    await load()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50">
        <AdminNav />
        <div className="flex items-center justify-center py-32"><Loader2 className="w-6 h-6 animate-spin text-ink-300" /></div>
      </div>
    )
  }

  const period = data?.period ?? null
  const locked = data?.locked ?? false

  return (
    <div className="min-h-screen bg-ink-50">
      <AdminNav />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-ink">Champions</h1>
              <p className="text-sm text-ink-400">Curate the monthly leaderboard · {monthLabel(period)}</p>
            </div>
          </div>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {msg && (
          <div className="mb-4 text-sm px-4 py-2 rounded-xl bg-ink text-white flex items-center gap-2">
            <Check className="w-4 h-4" /> {msg}
          </div>
        )}

        {!period ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-ink-100">
            <p className="text-ink-500 font-medium">No leaderboard computed yet.</p>
            <p className="text-ink-400 text-sm mt-1">Run the monthly job or recompute the current month once there is data.</p>
          </div>
        ) : (
          <>
            {/* Controls */}
            <div className="bg-white rounded-2xl p-5 border border-ink-100 mb-6 flex flex-wrap items-center gap-4">
              {/* Lock */}
              <button
                disabled={busy}
                onClick={() => act({ action: 'set_lock', period, locked: !locked }, locked ? 'Month unlocked' : 'Month locked')}
                className={`inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border ${
                  locked ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-ink-50 text-ink-600 border-ink-200'
                }`}
              >
                {locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                {locked ? 'Locked (cron skips)' : 'Unlocked'}
              </button>

              {/* Recompute */}
              <button
                disabled={busy || locked}
                onClick={() => act({ action: 'recompute', period }, 'Recomputed')}
                title={locked ? 'Unlock first' : 'Recompute from live data'}
                className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-xl border bg-ink-50 text-ink-600 border-ink-200 disabled:opacity-40"
              >
                <RefreshCw className="w-4 h-4" /> Recompute month
              </button>

              {/* Label mode */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-xs font-medium text-ink-400">Booked card shows</span>
                <select
                  disabled={busy}
                  value={data?.labelMode ?? 'auto'}
                  onChange={(e) => act({ action: 'set_label', mode: e.target.value }, 'Label updated')}
                  className="text-sm border border-ink-200 rounded-lg px-2 py-1.5 bg-white"
                >
                  <option value="auto">Auto (Booked, else Contacted)</option>
                  <option value="booked">Always Most Booked</option>
                  <option value="contacted">Always Most Contacted</option>
                </select>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-5">
              {Object.keys(data!.labels).map((cat) => {
                const entries = data!.categories[cat] ?? []
                return (
                  <div key={cat} className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100">
                      <h2 className="font-semibold text-ink">{data!.labels[cat]}</h2>
                      <button
                        onClick={() => { setPickerFor(pickerFor === cat ? null : cat); setPickValue('') }}
                        className="text-xs font-semibold text-ink-500 hover:text-ink"
                      >
                        {pickerFor === cat ? 'Cancel' : 'Set winner'}
                      </button>
                    </div>

                    {pickerFor === cat && (
                      <div className="px-5 py-3 bg-ink-50/50 border-b border-ink-100 flex items-center gap-2">
                        <select
                          value={pickValue}
                          onChange={(e) => setPickValue(e.target.value)}
                          className="flex-1 text-sm border border-ink-200 rounded-lg px-2 py-1.5 bg-white"
                        >
                          <option value="">Choose a photographer…</option>
                          {data!.roster.map((r) => (
                            <option key={r.id} value={r.id}>{r.display_name} (@{r.username})</option>
                          ))}
                        </select>
                        <button
                          disabled={busy || !pickValue}
                          onClick={() => act({ action: 'set_winner', period, category: cat, photographerId: pickValue }, 'Winner set')}
                          className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-1.5 rounded-lg bg-ink text-white disabled:opacity-40"
                        >
                          <Trophy className="w-3.5 h-3.5" /> Make #1
                        </button>
                      </div>
                    )}

                    {entries.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-ink-300">No entries this month.</p>
                    ) : (
                      <ul className="divide-y divide-ink-50">
                        {entries.map((e) => (
                          <li key={e.photographerId} className="flex items-center gap-3 px-5 py-2.5">
                            <span className={`w-6 text-sm font-bold ${e.rank === 1 ? 'text-amber-500' : 'text-ink-300'}`}>{e.rank}</span>
                            <span className="flex-1 text-sm text-ink font-medium truncate">{e.displayName}</span>
                            <span className="text-xs text-ink-400">{e.metricLabel ?? e.metricValue}</span>
                            <button
                              disabled={busy}
                              onClick={() => act({ action: 'remove_entry', period, category: cat, photographerId: e.photographerId }, 'Entry removed')}
                              title="Remove from leaderboard"
                              className="text-ink-300 hover:text-red-500 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>

            <p className="text-xs text-ink-300 mt-6 leading-relaxed">
              Manual edits are frozen for the month. Lock the month to stop the monthly job from overwriting your
              changes; unlock and recompute to rebuild from live data. Setting a winner inserts the photographer if
              they weren&apos;t already ranked.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
