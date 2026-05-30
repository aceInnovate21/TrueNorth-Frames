import { createClient } from '@supabase/supabase-js'
import { fetchGoogleSignals, fetchGooglePlacesSignals, refreshGoogleToken } from './fetchers/google'
import { computeTrustScore } from './score-engine'
import { PlatformSignals } from './types'

function adminDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
}

// Run a full trust sync for one photographer.
// Only GBP is in scope — Instagram and Facebook are excluded until post-launch.
// Returns the new score (75–100) or 0 if GBP is not connected.
export async function syncTrustScore(photographerId: string): Promise<number> {
  const db = adminDb()

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('native_avg_rating, native_review_count, completeness_score, trust_score, display_name, location')
    .eq('id', photographerId)
    .single()

  // Load Google OAuth token if connected
  const { data: tokens } = await db
    .from('platform_oauth_tokens')
    .select('platform, access_token, refresh_token, token_expires_at, platform_user_id')
    .eq('photographer_id', photographerId)
    .eq('platform', 'google')
    .eq('is_active', true)

  const googleToken = tokens?.[0] ?? null

  // Refresh Google token if expiring within 5 min
  if (googleToken?.refresh_token) {
    const expiresAt = googleToken.token_expires_at ? new Date(googleToken.token_expires_at) : null
    const expiresSoon = !expiresAt || expiresAt.getTime() < Date.now() + 5 * 60 * 1000
    if (expiresSoon) {
      const refreshed = await refreshGoogleToken(googleToken.refresh_token)
      if (!('error' in refreshed)) {
        await db.from('platform_oauth_tokens')
          .update({
            access_token:      refreshed.accessToken,
            token_expires_at:  refreshed.expiresAt.toISOString(),
            last_refreshed_at: new Date().toISOString(),
          })
          .eq('photographer_id', photographerId)
          .eq('platform', 'google')
        googleToken.access_token = refreshed.accessToken
      }
    }
  }

  const scoreBefore = profile?.trust_score ?? 0

  // Fetch Google signals — OAuth first, Places API fallback
  let google: PlatformSignals | null = null
  if (googleToken?.access_token) {
    google = await fetchGoogleSignals(googleToken.access_token)
  } else if (profile?.display_name && process.env.GOOGLE_PLACES_API_KEY) {
    google = await fetchGooglePlacesSignals(
      profile.display_name,
      profile.location ?? 'Edmonton AB'
    )
  }

  const breakdown = computeTrustScore({
    google,
    profileCompletenessPct: profile?.completeness_score ?? 0,
  })

  const newScore = breakdown.totalScore

  // Persist signal snapshot (only if we got data)
  if (google && !google.error) {
    await db.from('trust_signal_snapshots').insert({
      photographer_id:   photographerId,
      platform:          'google',
      account_age_days:  google.accountAgeDays ?? null,
      is_verified:       google.isVerified ?? false,
      review_rating:     google.reviewRating ?? null,
      review_count:      google.reviewCount ?? null,
      platform_score:    breakdown.pillars.reviews,
    })
  }

  // Upsert trust_score_breakdown
  await db.from('trust_score_breakdown').upsert({
    photographer_id:    photographerId,
    total_score:        newScore,
    platform_score:     0,                        // social (Instagram/Facebook) — not in scope
    review_score:       breakdown.pillars.reviews,
    activity_score:     breakdown.pillars.age,
    verification_score: breakdown.pillars.verification,
    signals:            breakdown.signals,
    last_computed_at:   breakdown.computedAt,
  }, { onConflict: 'photographer_id' })

  // Update photographer_profiles
  await db.from('photographer_profiles').update({
    trust_score:        newScore,
    last_trust_sync_at: breakdown.computedAt,
  }).eq('id', photographerId)

  // Update external_platform_links with fresh GBP data
  if (google && !google.error) {
    await db.from('external_platform_links').upsert({
      photographer_id:       photographerId,
      platform:              'google',
      profile_url:           '',
      platform_rating:       google.reviewRating ?? null,
      platform_review_count: google.reviewCount ?? null,
      account_age_days:      google.accountAgeDays ?? null,
      is_verified:           google.isVerified ?? false,
      platform_user_id:      google.platformUserId ?? null,
      platform_username:     google.platformUsername ?? null,
      is_oauth_connected:    !!googleToken,
      last_fetched_at:       breakdown.computedAt,
    }, { onConflict: 'photographer_id,platform', ignoreDuplicates: false })
  }

  // Log the sync
  await db.from('trust_sync_log').insert({
    photographer_id: photographerId,
    platform:        'google',
    status:          !google
      ? 'failed'
      : google.error
      ? 'failed'
      : 'success',
    fetched_rating:  google?.reviewRating ?? null,
    fetched_count:   google?.reviewCount ?? null,
    error_message:   google?.error ?? null,
    signals_fetched: google && !google.error ? google : null,
    score_before:    scoreBefore,
    score_after:     newScore,
  })

  return newScore
}

// Sync all photographers who have either a Google OAuth token OR a GBP link via Places.
// Photographers with neither are skipped (no score to compute).
export async function syncAllPhotographers(): Promise<{ photographerId: string; score: number; error?: string }[]> {
  const db = adminDb()

  // Get all photographers with an active Google token
  const { data: tokenRows } = await db
    .from('platform_oauth_tokens')
    .select('photographer_id')
    .eq('platform', 'google')
    .eq('is_active', true)

  // Also get photographers with a GBP link (Places fallback) who have no OAuth token
  const { data: linkRows } = await db
    .from('external_platform_links')
    .select('photographer_id')
    .eq('platform', 'google')

  const tokenIds  = new Set((tokenRows ?? []).map((r: any) => r.photographer_id as string))
  const linkIds   = (linkRows ?? []).map((r: any) => r.photographer_id as string)
  const allIdsArr = [...Array.from(tokenIds), ...linkIds]
  const unique    = allIdsArr.filter((id, i) => allIdsArr.indexOf(id) === i)

  const results = await Promise.allSettled(
    unique.map((id: string) => syncTrustScore(id).then(score => ({ photographerId: id, score })))
  )

  return results.map((r, i): { photographerId: string; score: number; error?: string } =>
    r.status === 'fulfilled'
      ? r.value
      : { photographerId: unique[i], score: 0, error: (r.reason as Error)?.message }
  )
}
