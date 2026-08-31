import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, notFound, serverError } from '@/lib/api-helpers'
import { syncTrustScore } from '@/lib/trust/sync'
import { notify } from '@/lib/notify'

// GET  — return current trust breakdown + connected platform status
// POST — trigger a fresh sync for the authenticated photographer

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id, trust_score, last_trust_sync_at, native_avg_rating, native_review_count, google_place_id, google_business_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) return notFound('Photographer profile not found')

  // Load trust breakdown
  const { data: breakdown } = await db
    .from('trust_score_breakdown')
    .select('*')
    .eq('photographer_id', profile.id)
    .single()

  // Load connected OAuth tokens (metadata only — no tokens exposed)
  const { data: tokens } = await db
    .from('platform_oauth_tokens')
    .select('platform, platform_username, connected_at, last_refreshed_at, is_active')
    .eq('photographer_id', profile.id)

  const connectedPlatforms: Record<string, { username: string; connectedAt: string; isActive: boolean }> = {}
  for (const t of tokens ?? []) {
    connectedPlatforms[t.platform] = {
      username:    t.platform_username ?? '',
      connectedAt: t.connected_at,
      isActive:    t.is_active,
    }
  }

  // Google is now linked via a public Places listing (no OAuth token).
  if (profile.google_place_id || profile.google_business_name) {
    connectedPlatforms.google = {
      username:    profile.google_business_name ?? '',
      connectedAt: profile.last_trust_sync_at ?? '',
      isActive:    true,
    }
  }

  // Latest snapshot per platform
  const { data: snapshots } = await db
    .from('trust_signal_snapshots')
    .select('*')
    .eq('photographer_id', profile.id)
    .order('snapped_at', { ascending: false })
    .limit(9)   // up to 3 platforms × 3 most recent each

  const latestByPlatform: Record<string, any> = {}
  for (const s of snapshots ?? []) {
    if (!latestByPlatform[s.platform]) latestByPlatform[s.platform] = s
  }

  // Recent sync log
  const { data: syncLog } = await db
    .from('trust_sync_log')
    .select('platform, status, error_message, score_before, score_after, synced_at')
    .eq('photographer_id', profile.id)
    .order('synced_at', { ascending: false })
    .limit(15)

  return NextResponse.json({
    trust_score:       profile.trust_score ?? 0,
    last_sync_at:      profile.last_trust_sync_at ?? null,
    native_avg_rating: profile.native_avg_rating ?? 0,
    native_review_count: profile.native_review_count ?? 0,
    breakdown: breakdown ? {
      total:        breakdown.total_score,
      platform:     breakdown.platform_score,
      reviews:      breakdown.review_score,
      activity:     breakdown.activity_score,
      verification: breakdown.verification_score,
      signals:      breakdown.signals,
      computed_at:  breakdown.last_computed_at,
    } : null,
    connected_platforms: connectedPlatforms,
    latest_signals:      latestByPlatform,
    sync_log:            syncLog ?? [],
  })
}

export async function POST() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return notFound('Photographer profile not found')

  // Read score before sync so we can compare
  const { data: beforeProfile } = await db
    .from('photographer_profiles')
    .select('trust_score')
    .eq('id', profile.id)
    .single()
  const scoreBefore = Number(beforeProfile?.trust_score ?? 0)

  try {
    const newScore = await syncTrustScore(profile.id)

    // Notify only when score actually changes
    if (newScore !== scoreBefore) {
      const direction = newScore > scoreBefore ? 'increased' : 'decreased'
      await notify({
        db,
        userId: user.id,
        type: 'trust_score_updated',
        title: 'Trust score updated',
        body: `Your trust score ${direction} from ${scoreBefore.toFixed(1)} to ${Number(newScore).toFixed(1)}.`,
        entityType: 'photographer_profile',
        entityId: profile.id,
      })
    }

    return NextResponse.json({ success: true, trust_score: newScore })
  } catch (e: any) {
    return serverError(e?.message ?? 'Sync failed')
  }
}
