'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Eye, CalendarCheck, Star, Zap, Trophy, ArrowRight, ChevronRight } from 'lucide-react'

type Champion = {
  rank: number
  metricValue: number
  metricLabel: string | null
  username: string
  displayName: string
  avatarUrl: string | null
  location: string | null
  tagline: string | null
  rating: number
  reviews: number
  trustScore: number
}

type ChampionsPayload = {
  period: string | null
  bookedLabelMode?: 'auto' | 'booked' | 'contacted'
  categories: Record<string, Champion[]>
}

// Card definitions. `most_booked` falls back to `most_contacted` when there is
// no booking data yet — controlled purely by which rows the API returns.
const CARDS = [
  {
    key: 'most_viewed',
    icon: Eye,
    label: 'Most Viewed',
    headline: "Edmonton's Most Discovered Photographer",
    accent: 'from-sky-500 to-blue-600',
  },
  {
    key: 'most_booked',
    fallbackKey: 'most_contacted',
    icon: CalendarCheck,
    label: 'Most Booked',
    fallbackLabel: 'Most Contacted',
    headline: "Edmonton's Busiest Photographer",
    fallbackHeadline: "Edmonton's Most Contacted Photographer",
    accent: 'from-amber-500 to-orange-600',
  },
  {
    key: 'highest_rated',
    icon: Star,
    label: 'Highest Rated',
    headline: "Edmonton's Top Rated Photographer",
    accent: 'from-emerald-500 to-green-600',
  },
  {
    key: 'quick_responder',
    icon: Zap,
    label: 'Quick Responder',
    headline: 'Fastest to Reply This Month',
    accent: 'from-violet-500 to-purple-600',
  },
] as const

function monthLabel(period: string | null): string {
  if (!period) return 'This Month'
  const d = new Date(period + 'T00:00:00')
  return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
}

function initialsOf(name: string): string {
  return name.split(' ').filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join('')
}

function ChampionCard({
  card,
  winner,
  onView,
}: {
  card: (typeof CARDS)[number]
  winner: Champion | null
  onView: () => void
}) {
  const Icon = card.icon
  const label = (card as any)._label as string
  const headline = (card as any)._headline as string

  return (
    <div
      className="group relative bg-white rounded-2xl p-6 flex flex-col"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center`}>
          <Icon className="w-4.5 h-4.5 text-white" strokeWidth={2.2} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-ink-400">{label}</p>
        </div>
      </div>

      <p className="text-sm font-medium text-ink-500 leading-snug mb-5 min-h-[40px]">{headline}</p>

      {winner ? (
        <>
          <Link href={`/photographers/${winner.username}`} className="flex items-center gap-3 mb-4">
            {winner.avatarUrl ? (
              <Image
                src={winner.avatarUrl}
                alt={winner.displayName}
                width={48}
                height={48}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-ink-100"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-ink-100 flex items-center justify-center text-ink-500 font-semibold text-sm">
                {initialsOf(winner.displayName)}
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-ink text-[15px] truncate group-hover:text-ink-600 transition-colors">
                {winner.displayName}
              </p>
              {winner.location && <p className="text-xs text-ink-400 truncate">{winner.location}</p>}
            </div>
          </Link>

          <div className="mt-auto flex items-center justify-between pt-3 border-t border-ink-100">
            <span className="text-sm font-bold text-ink">{winner.metricLabel ?? winner.metricValue}</span>
            <button
              onClick={onView}
              className="inline-flex items-center gap-1 text-xs font-semibold text-ink-400 hover:text-ink transition-colors"
            >
              View all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      ) : (
        <div className="mt-auto flex-1 flex items-center justify-center py-6 text-center">
          <p className="text-xs text-ink-300">No winner yet this month.</p>
        </div>
      )}
    </div>
  )
}

function LeaderboardTable({
  title,
  rows,
  onClose,
}: {
  title: string
  rows: Champion[]
  onClose: () => void
}) {
  return (
    <div className="mt-8 bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100">
        <h3 className="font-serif text-lg font-bold text-ink">{title} — full leaderboard</h3>
        <button onClick={onClose} className="text-xs font-semibold text-ink-400 hover:text-ink transition-colors">
          Close
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-400 text-xs uppercase tracking-wider">
              <th className="px-6 py-3 font-semibold">#</th>
              <th className="px-6 py-3 font-semibold">Photographer</th>
              <th className="px-6 py-3 font-semibold">Result</th>
              <th className="px-6 py-3 font-semibold text-right"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.username} className="border-t border-ink-50 hover:bg-ink-50/50 transition-colors">
                <td className="px-6 py-3 font-bold text-ink-300 w-12">{r.rank}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    {r.avatarUrl ? (
                      <Image src={r.avatarUrl} alt={r.displayName} width={32} height={32} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-ink-100 flex items-center justify-center text-ink-500 text-xs font-semibold">
                        {initialsOf(r.displayName)}
                      </div>
                    )}
                    <span className="font-medium text-ink">{r.displayName}</span>
                  </div>
                </td>
                <td className="px-6 py-3 font-semibold text-ink">{r.metricLabel ?? r.metricValue}</td>
                <td className="px-6 py-3 text-right">
                  <Link href={`/photographers/${r.username}`} className="text-xs font-semibold text-ink-400 hover:text-ink inline-flex items-center gap-1">
                    View <ArrowRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function ChampionsSection() {
  const [data, setData] = useState<ChampionsPayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [openKey, setOpenKey] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/champions')
      .then((r) => r.json())
      .then((d: ChampionsPayload) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Resolve each card against the payload. The Most Booked card can be forced by
  // an admin (bookedLabelMode) or, in 'auto', falls back to Most Contacted when
  // there is no booking data yet.
  const mode = data?.bookedLabelMode ?? 'auto'
  const resolved = CARDS.map((card) => {
    const primary = data?.categories?.[card.key] ?? []
    let rows = primary
    let label: string = card.label
    let headline: string = card.headline
    if ('fallbackKey' in card) {
      const showContacted =
        mode === 'contacted' || (mode === 'auto' && primary.length === 0)
      if (showContacted) {
        rows = data?.categories?.[(card as any).fallbackKey] ?? []
        label = (card as any).fallbackLabel
        headline = (card as any).fallbackHeadline
      }
    }
    return { ...card, _label: label, _headline: headline, rows }
  })

  // Hide the whole section until there is at least one populated category.
  const hasAny = resolved.some((c) => c.rows.length > 0)
  if (!loading && !hasAny) return null

  const openCard = resolved.find((c) => c.key === openKey)

  return (
    <section className="bg-ink-50 py-24 border-y border-ink-100" id="champions">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em]">Champions</p>
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight">
              This month&apos;s<br />standouts
            </h2>
            <p className="text-ink-400 text-sm mt-3">{monthLabel(data?.period ?? null)}</p>
          </div>
          <Link href="/photographers" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-ink-600 transition-colors group">
            Browse all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {resolved.map((card) => (
            <ChampionCard
              key={card.key}
              card={card as any}
              winner={card.rows[0] ?? null}
              onView={() => setOpenKey(openKey === card.key ? null : card.key)}
            />
          ))}
        </div>

        {openCard && openCard.rows.length > 0 && (
          <LeaderboardTable
            title={openCard._label}
            rows={openCard.rows}
            onClose={() => setOpenKey(null)}
          />
        )}
      </div>
    </section>
  )
}
