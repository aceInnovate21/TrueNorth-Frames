import { createClient } from '@supabase/supabase-js'
import { fetchInstagramSignals } from './fetchers/instagram'
import { fetchFacebookSignals } from './fetchers/facebook'
import { fetchGoogleSignals, fetchGooglePlacesSignals, refreshGoogleToken } from './fetchers/google'
import { computeTrustScore } from './score-engine'
import { PlatformSignals, Platform } from './types'

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
}

// Run a full trust sync for one photographer.
// Returns the new score or throws on fatal errors.
export async function syncTrustScore(photographerId: string): Promise<number> {
  const db = adminDb()

  // Load profile for native reviews + completeness + business name for Places fallback
  const { data: profile } = await db
    .from('photographer_profiles')
    .select('native_avg_rating, native_review_count, completeness_score, trust_score, display_name, location')
    .eq('id', photographerId)
    .single()

  // Load all active OAuth tokens for this photographer
  const { data: tokens } = await db
    .from('platform_oauth_tokens')
    .select('platform, access_token, refresh_token, token_expires_at, platform_user_id')
    .eq('photographer_id', photographerId)
    .eq('is_active', true)

  const tokenMap: Record<string, { access_token: string; refresh_token?: string; token_expires_at?: string; platform_user_id?: string }> = {}
  for (const t of tokens ?? []) tokenMap[t.platform] = t

  // Refresh Google token if expired or expiring within 5 min
  if (tokenMap.google?.refresh_token) {
    const expiresAt = tokenMap.google.token_expires_at
      ? new Date(tokenMap.google.token_expires_at)
      : null
    const expiresSoon = !expiresAt || expiresAt.getTime() < Date.now() + 5 * 60 * 1000

    if (expiresSoon) {
      const refreshed = await refreshGoogleToken(tokenMap.google.refresh_token)
      if (!('error' in refreshed)) {
        await db.from('platform_oauth_tokens')
          .update({
            access_token:     refreshed.accessToken,
            token_expires_at: refreshed.expiresAt.toISOString(),
            last_refreshed_at: new Date().toISOString(),
          })
          .eq('photographer_id', photographerId)
          .eq('platform', 'google')
        tokenMap.google.access_token = refreshed.accessToken
      }
    }
  }

  const scoreBefore = profile?.trust_score ?? 0

  // Fetch signals in parallel
  const [instagram, facebook, google] = await Promise.all([
    tokenMap.instagram
      ? fetchInstagramSignals(tokenMap.instagram.access_token)
      : Promise.resolve(null),
    tokenMap.facebook
      ? fetchFacebookSignals(tokenMap.facebook.access_token, tokenMap.facebook.platform_user_id)
      : Promise.resolve(null),
    tokenMap.google
      ? fetchGoogleSignals(tokenMap.google.access_token)
      : (profile?.display_name && process.env.GOOGLE_PLACES_API_KEY)
        ? fetchGooglePlacesSignals(profile.display_name, profile.location ?? 'Edmonton AB')
        : Promise.resolve(null),
  ])

  const breakdown = computeTrustScore({
    instagram,
    facebook,
    google,
    nativeAvgRating:         profile?.native_avg_rating ?? 0,
    nativeReviewCount:       profile?.native_review_count ?? 0,
    profileCompletenessPct:  profile?.completeness_score ?? 0,
  })

  const newScore = breakdown.totalScore

  // Persist signal snapshots
  const snapshotRows = ([instagram, facebook, google] as (PlatformSignals | null)[])
    .filter(Boolean)
    .map(s => ({
      photographer_id:      photographerId,
      platform:             s!.platform,
      follower_count:       s!.followerCount,
      following_count:      s!.followingCount,
      post_count:           s!.postCount,
      account_age_days:     s!.accountAgeDays,
      is_verified:          s!.isVerified,
      avg_likes_per_post:   s!.avgLikesPerPost,
      avg_comments_per_post: s!.avgCommentsPerPost,
      engagement_rate:      s!.engagementRate,
      posting_consistency:  s!.postingConsistency,
      review_rating:        s!.reviewRating,
      review_count:         s!.reviewCount,
      platform_score:       breakdown.pillars[s!.platform as keyof typeof breakdown.pillars] ?? 0,
    }))

  if (snapshotRows.length > 0) {
    await db.from('trust_signal_snapshots').insert(snapshotRows)
  }

  // Update trust_score_breakdown (upsert)
  await db.from('trust_score_breakdown').upsert({
    photographer_id:    photographerId,
    total_score:        newScore,
    platform_score:     breakdown.pillars.platform,
    review_score:       breakdown.pillars.reviews,
    activity_score:     breakdown.pillars.activity,
    verification_score: breakdown.pillars.verification,
    signals:            breakdown.signals,
    last_computed_at:   breakdown.computedAt,
  }, { onConflict: 'photographer_id' })

  // Update photographer_profiles.trust_score + last_trust_sync_at
  await db.from('photographer_profiles').update({
    trust_score:        newScore,
    last_trust_sync_at: breakdown.computedAt,
  }).eq('id', photographerId)

  // Update external_platform_links with fresh data for public display
  for (const s of [instagram, facebook, google] as (PlatformSignals | null)[]) {
    if (!s || s.error) continue
    await db.from('external_platform_links').upsert({
      photographer_id:    photographerId,
      platform:           s.platform,
      profile_url:        '',   // preserved from existing row via RLS bypass
      platform_rating:    s.reviewRating ?? null,
      platform_review_count: s.reviewCount ?? null,
      follower_count:     s.followerCount ?? null,
      following_count:    s.followingCount ?? null,
      post_count:         s.postCount ?? null,
      account_age_days:   s.accountAgeDays ?? null,
      engagement_rate:    s.engagementRate ?? null,
      posting_consistency: s.postingConsistency ?? null,
      platform_user_id:   s.platformUserId ?? null,
      platform_username:  s.platformUsername ?? null,
      is_oauth_connected: !!tokenMap[s.platform],
      last_fetched_at:    breakdown.computedAt,
    }, { onConflict: 'photographer_id,platform', ignoreDuplicates: false })
  }

  // Log the sync
  for (const s of [instagram, facebook, google] as (PlatformSignals | null)[]) {
    if (!s) continue
    await db.from('trust_sync_log').insert({
      photographer_id: photographerId,
      platform:        s.platform,
      status:          s.error ? 'failed' : 'success',
      fetched_rating:  s.reviewRating ?? null,
      fetched_count:   s.reviewCount ?? null,
      error_message:   s.error ?? null,
      signals_fetched: s.error ? null : s,
      score_before:    scoreBefore,
      score_after:     newScore,
    })
  }

  return newScore
}

// Sync all photographers who have at least one OAuth token
// (intended for a scheduled cron — call from a secure admin-only route)
export async function syncAllPhotographers(): Promise<{ photographerId: string; score: number; error?: string }[]> {
  const db = adminDb()
  const { data: photographers } = await db
    .from('platform_oauth_tokens')
    .select('photographer_id')
    .eq('is_active', true)

  const unique: string[] = Array.from(new Set((photographers ?? []).map((r: any) => r.photographer_id as string)))
  const results = await Promise.allSettled(
    unique.map((id: string) => syncTrustScore(id).then(score => ({ photographerId: id, score })))
  )

  return results.map((r, i): { photographerId: string; score: number; error?: string } =>
    r.status === 'fulfilled'
      ? r.value
      : { photographerId: unique[i], score: 0, error: (r.reason as Error)?.message }
  )
}
