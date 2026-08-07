// Shared helpers for the Champions feature (monthly_champions leaderboard).

export const CHAMPION_LABELS: Record<string, string> = {
  most_viewed: 'Most Viewed',
  most_booked: 'Most Booked',
  most_contacted: 'Most Contacted',
  highest_rated: 'Highest Rated',
  quick_responder: 'Quick Responder',
}

export type Achievement = {
  category: string
  categoryLabel: string
  period: string        // YYYY-MM-DD (first of month)
  periodLabel: string   // e.g. "August 2026"
  rank: number
  isWin: boolean        // rank === 1
  metricLabel: string | null
}

export type AchievementSummary = {
  totalWins: number
  categoriesWon: string[]  // distinct category labels won at least once
  achievements: Achievement[]
}

function periodLabel(period: string): string {
  const d = new Date(period + 'T00:00:00')
  return d.toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
}

// Fetches a photographer's podium placements (rank 1–3) across all months,
// newest first, plus a small summary. `db` is a service-role Supabase client.
export async function getAchievements(db: any, photographerId: string): Promise<AchievementSummary> {
  const { data, error } = await db
    .from('monthly_champions')
    .select('category, period, rank, metric_label')
    .eq('photographer_id', photographerId)
    .lte('rank', 3)
    .order('period', { ascending: false })
    .order('rank', { ascending: true })

  if (error || !data) {
    return { totalWins: 0, categoriesWon: [], achievements: [] }
  }

  const achievements: Achievement[] = data.map((r: any) => ({
    category: r.category,
    categoryLabel: CHAMPION_LABELS[r.category] ?? r.category,
    period: r.period,
    periodLabel: periodLabel(r.period),
    rank: Number(r.rank),
    isWin: Number(r.rank) === 1,
    metricLabel: r.metric_label,
  }))

  const wins = achievements.filter((a) => a.isWin)
  const categoriesWon = Array.from(new Set(wins.map((a) => a.categoryLabel)))

  return { totalWins: wins.length, categoriesWon, achievements }
}
