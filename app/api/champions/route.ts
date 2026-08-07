import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 300 // 5-minute edge cache

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
}

// GET /api/champions
// Returns the most recent frozen leaderboard, grouped by category, with the
// display fields the homepage Champions section needs. Reads only — the monthly
// cron is what writes the rows.
export async function GET() {
  const db = getDb()

  // Latest period we have any rows for (so a mid-month gap still shows results).
  const { data: latest } = await db
    .from('monthly_champions')
    .select('period')
    .order('period', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!latest?.period) {
    return NextResponse.json({ period: null, categories: {} })
  }

  const { data: rows, error } = await db
    .from('monthly_champions')
    .select(`
      category, rank, metric_value, metric_label,
      photographer:photographer_profiles!photographer_id(
        username, display_name, avatar_url, location, tagline,
        native_avg_rating, native_review_count, trust_score
      )
    `)
    .eq('period', latest.period)
    .order('rank', { ascending: true })

  if (error) {
    return NextResponse.json({ error: 'Failed to load champions' }, { status: 500 })
  }

  const categories: Record<string, any[]> = {}
  for (const r of rows ?? []) {
    const p = r.photographer
    if (!p) continue
    ;(categories[r.category] ??= []).push({
      rank: r.rank,
      metricValue: Number(r.metric_value),
      metricLabel: r.metric_label,
      username: p.username,
      displayName: p.display_name,
      avatarUrl: p.avatar_url,
      location: p.location,
      tagline: p.tagline,
      rating: Number(p.native_avg_rating ?? 0),
      reviews: Number(p.native_review_count ?? 0),
      trustScore: Number(p.trust_score ?? 0),
    })
  }

  return NextResponse.json({ period: latest.period, categories })
}
