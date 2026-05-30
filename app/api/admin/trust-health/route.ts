import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

async function verifyAdmin(db: any, userId: string) {
  const { data } = await db.from('users').select('role').eq('id', userId).single()
  return data?.role === 'admin'
}

// GET /api/admin/trust-health
// Returns per-platform sync status, stats, and last-5 sync log entries
export async function GET(_request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  if (!await verifyAdmin(db, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Instagram and Facebook are out of scope until post-launch Meta app review.
  const PLATFORMS = ['google'] as const

  // 1. Per-platform: count of linked profiles + avg rating + total reviews
  const { data: linkRows, error: linkErr } = await db
    .from('external_platform_links')
    .select('platform, platform_rating, platform_review_count')
  if (linkErr) return serverError('Failed to load platform links')

  // 2. Last 5 sync log entries per platform
  const { data: logRows, error: logErr } = await db
    .from('trust_sync_log')
    .select('platform, status, error_message, synced_at, fetched_rating, fetched_count, signals_fetched, score_before, score_after')
    .order('synced_at', { ascending: false })
    .limit(200)
  if (logErr) return serverError('Failed to load sync logs')

  // 3. Distinct photographers with a GBP link (trust data)
  const { data: distinctRows } = await db
    .from('external_platform_links')
    .select('photographer_id')
    .eq('platform', 'google')
  const profilesWithTrust = new Set((distinctRows ?? []).map((r: any) => r.photographer_id)).size

  // 4. Avg composite trust score across approved photographers with score > 0
  const { data: scoreRows } = await db
    .from('photographer_profiles')
    .select('trust_score')
    .eq('profile_status', 'approved')
    .gt('trust_score', 0)

  const avgComposite = scoreRows && scoreRows.length > 0
    ? (scoreRows.reduce((s: number, r: any) => s + Number(r.trust_score), 0) / scoreRows.length).toFixed(1)
    : null

  // Build per-platform summary
  const platforms = PLATFORMS.map(platform => {
    const links = (linkRows ?? []).filter((r: any) => r.platform === platform)
    const profilesLinked = links.length
    const ratings = links.filter((r: any) => r.platform_rating != null).map((r: any) => Number(r.platform_rating))
    const avgRating = ratings.length > 0 ? +(ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length).toFixed(2) : 0
    const totalReviews = links.reduce((s: number, r: any) => s + (r.platform_review_count > 0 ? r.platform_review_count : 0), 0)

    // Last 5 logs for this platform
    const platformLogs = (logRows ?? [])
      .filter((r: any) => r.platform === platform)
      .slice(0, 5)

    const lastLog = platformLogs[0] ?? null
    const lastSyncAt = lastLog?.synced_at ?? null
    const lastStatus: string = lastLog?.status ?? 'pending'

    // Count how many profiles were updated in last sync run (same synced_at minute)
    const lastMinute = lastSyncAt ? lastSyncAt.slice(0, 16) : null
    const profilesUpdatedLastSync = lastMinute
      ? (logRows ?? []).filter((r: any) =>
          r.platform === platform &&
          r.status !== 'failed' &&
          r.synced_at?.slice(0, 16) === lastMinute
        ).length
      : 0

    const logs = platformLogs.map((r: any) => ({
      syncedAt:        r.synced_at,
      status:          r.status,
      errorMessage:    r.error_message ?? null,
      fetchedRating:   r.fetched_rating ?? null,
      fetchedCount:    r.fetched_count ?? null,
      scoreBefore:     r.score_before ?? null,
      scoreAfter:      r.score_after ?? null,
    }))

    return {
      platform,
      profilesLinked,
      profilesUpdatedLastSync,
      avgRating,
      totalReviews,
      lastSyncAt,
      lastStatus,
      errorMessage: lastStatus === 'failed' || lastStatus === 'partial'
        ? (lastLog?.error_message ?? null)
        : null,
      logs,
    }
  })

  // Overall status
  const statuses = platforms.map(p => p.lastStatus)
  const overallStatus = statuses.includes('failed')
    ? 'failed'
    : statuses.includes('partial')
    ? 'partial'
    : statuses.every(s => s === 'success')
    ? 'success'
    : 'pending'

  return NextResponse.json({
    overallStatus,
    platformsMonitored: PLATFORMS.length,
    profilesWithTrustData: profilesWithTrust,
    avgCompositeScore: avgComposite,
    totalReviewsTracked: platforms.reduce((s, p) => s + p.totalReviews, 0),
    platforms,
  })
}
