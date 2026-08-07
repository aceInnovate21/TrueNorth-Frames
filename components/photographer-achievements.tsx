'use client'

import { useEffect, useState } from 'react'
import { Eye, CalendarCheck, MessageSquare, Star, Zap, Trophy, Medal, Award } from 'lucide-react'

type Achievement = {
  category: string
  categoryLabel: string
  period: string
  periodLabel: string
  rank: number
  isWin: boolean
  metricLabel: string | null
}

type Summary = {
  totalWins: number
  categoriesWon: string[]
  achievements: Achievement[]
}

const CATEGORY_ICON: Record<string, typeof Eye> = {
  most_viewed: Eye,
  most_booked: CalendarCheck,
  most_contacted: MessageSquare,
  highest_rated: Star,
  quick_responder: Zap,
}

const CATEGORY_ACCENT: Record<string, string> = {
  most_viewed: 'from-sky-500 to-blue-600',
  most_booked: 'from-amber-500 to-orange-600',
  most_contacted: 'from-amber-500 to-orange-600',
  highest_rated: 'from-emerald-500 to-green-600',
  quick_responder: 'from-violet-500 to-purple-600',
}

function rankBadge(rank: number) {
  if (rank === 1) return { Icon: Trophy, text: 'Winner', cls: 'text-amber-600 bg-amber-50 border-amber-200' }
  if (rank === 2) return { Icon: Medal, text: '2nd', cls: 'text-ink-500 bg-ink-50 border-ink-200' }
  return { Icon: Award, text: '3rd', cls: 'text-orange-700 bg-orange-50 border-orange-200' }
}

// Displays a photographer's Champion achievements. Pass `username` for the
// public profile; omit it on the photographer's own dashboard (self endpoint).
// `variant="public"` renders only wins as a compact ribbon; `variant="full"`
// (default) renders the full podium timeline.
export function PhotographerAchievements({
  username,
  variant = 'full',
}: {
  username?: string
  variant?: 'full' | 'public'
}) {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = username
      ? `/api/photographer/${username}/achievements`
      : '/api/photographer/achievements'
    fetch(url)
      .then((r) => r.json())
      .then((d: Summary) => setSummary(d))
      .catch(() => setSummary(null))
      .finally(() => setLoading(false))
  }, [username])

  if (loading || !summary) return null

  // Public profile: show only wins, as a compact badge ribbon. Render nothing
  // if there are none (keeps profiles of new photographers clean).
  if (variant === 'public') {
    const wins = summary.achievements.filter((a) => a.isWin)
    if (wins.length === 0) return null
    return (
      <div className="flex flex-wrap gap-2">
        {wins.map((a) => {
          const Icon = CATEGORY_ICON[a.category] ?? Trophy
          return (
            <span
              key={`${a.period}-${a.category}`}
              className="inline-flex items-center gap-1.5 rounded-full pl-2 pr-3 py-1 text-xs font-semibold text-ink-700 bg-white border border-amber-200"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              title={`${a.categoryLabel} champion — ${a.periodLabel}`}
            >
              <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${CATEGORY_ACCENT[a.category] ?? 'from-amber-500 to-orange-600'} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" strokeWidth={2.4} />
              </span>
              {a.categoryLabel}
              <span className="text-ink-300 font-normal">· {a.periodLabel}</span>
            </span>
          )
        })}
      </div>
    )
  }

  // Full timeline (dashboard). Empty state is encouraging rather than blank.
  if (summary.achievements.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <Trophy className="w-8 h-8 text-ink-200 mx-auto mb-3" />
        <p className="font-semibold text-ink text-sm">No achievements yet</p>
        <p className="text-ink-400 text-xs mt-1 max-w-xs mx-auto">
          Reach the top 3 in a monthly category — Most Viewed, Highest Rated, Quick Responder and more — to earn your first badge.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {summary.totalWins > 0 && (
        <div className="flex items-center gap-2 text-sm">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span className="font-semibold text-ink">
            {summary.totalWins} {summary.totalWins === 1 ? 'win' : 'wins'}
          </span>
          <span className="text-ink-400">
            across {summary.categoriesWon.join(', ')}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {summary.achievements.map((a) => {
          const Icon = CATEGORY_ICON[a.category] ?? Trophy
          const badge = rankBadge(a.rank)
          const BadgeIcon = badge.Icon
          return (
            <div
              key={`${a.period}-${a.category}`}
              className="bg-white rounded-2xl p-4 flex items-center gap-3"
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${CATEGORY_ACCENT[a.category] ?? 'from-amber-500 to-orange-600'} flex items-center justify-center flex-shrink-0`}>
                <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink text-sm truncate">{a.categoryLabel}</p>
                <p className="text-xs text-ink-400">{a.periodLabel}{a.metricLabel ? ` · ${a.metricLabel}` : ''}</p>
              </div>
              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full border ${badge.cls} flex-shrink-0`}>
                <BadgeIcon className="w-3 h-3" />
                {badge.text}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
