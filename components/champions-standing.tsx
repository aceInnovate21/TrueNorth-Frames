'use client'

import { useEffect, useState } from 'react'
import { Eye, MessageSquare, CalendarCheck, Trophy, TrendingUp } from 'lucide-react'

type Standing = {
  category: string
  label: string
  rank: number
  value: number
  leaderValue: number
  gapToLead: number
  leading: boolean
  message: string
}

const ICONS: Record<string, typeof Eye> = {
  most_viewed: Eye,
  most_contacted: MessageSquare,
  most_booked: CalendarCheck,
}

// Live "You're #3 in Most Viewed — 12 more views to take the lead" nudge for the
// photographer dashboard overview. Renders nothing until the photographer has
// some traction to report, so it never shows an empty or discouraging state.
export function ChampionsStanding() {
  const [standings, setStandings] = useState<Standing[] | null>(null)

  useEffect(() => {
    fetch('/api/photographer/champions-standing')
      .then((r) => r.json())
      .then((d) => setStandings(d.standings ?? []))
      .catch(() => setStandings([]))
  }, [])

  if (!standings || standings.length === 0) return null

  return (
    <div
      className="bg-white rounded-2xl p-4 sm:p-5"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Trophy className="w-4 h-4 text-amber-500" />
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300">
          Your Champions standing
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {standings.map((s) => {
          const Icon = ICONS[s.category] ?? TrendingUp
          return (
            <div
              key={s.category}
              className={`rounded-xl p-3 border ${
                s.leading ? 'border-amber-200 bg-amber-50/50' : 'border-ink-100 bg-ink-50/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <Icon className="w-3.5 h-3.5 text-ink-400" />
                  <span className="text-xs font-semibold text-ink-600">{s.label}</span>
                </div>
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                    s.leading ? 'bg-amber-500 text-white' : 'bg-ink-100 text-ink-500'
                  }`}
                >
                  {s.leading ? '#1' : `#${s.rank}`}
                </span>
              </div>
              <p className="text-xs text-ink-500 leading-snug">{s.message}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
