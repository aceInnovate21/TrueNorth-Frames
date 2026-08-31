import { createClient } from '@supabase/supabase-js'
import { fetchGooglePlacesSignals } from './fetchers/google'
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
    .select('native_avg_rating, native_review_count, completeness_score, trust_score, display_name, location, google_place_id, google_business_name')
    .eq('id', photographerId)
    .single()

  const scoreBefore = profile?.trust_score ?? 0

  // Fetch Google signals from the public Places API (New).
  // Prefer the confirmed place_id (stable); otherwise search by the confirmed
  // business name. A photographer who has not linked a listing yet is skipped.
  let google: PlatformSignals | null = null
  if (process.env.GOOGLE_PLACES_API_KEY && (profile?.google_place_id || profile?.google_business_name)) {
    google = await fetchGooglePlacesSignals({
      placeId:      profile.google_place_id ?? undefined,
      businessName: profile.google_business_name ?? undefined,
      location:     profile.location ?? 'Edmonton AB',
    })
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

  // Update photographer_profiles (score + Google display data)
  const profileUpdate: Record<string, any> = {
    trust_score:        newScore,
    last_trust_sync_at: breakdown.computedAt,
  }
  if (google && !google.error) {
    profileUpdate.google_maps_uri = google.googleMapsUri ?? null
    profileUpdate.google_reviews  = google.googleReviews ?? []
  }
  await db.from('photographer_profiles').update(profileUpdate).eq('id', photographerId)

  // Update external_platform_links with fresh GBP data
  if (google && !google.error) {
    await db.from('external_platform_links').upsert({
      photographer_id:       photographerId,
      platform:              'google',
      profile_url:           '',
      platform_rating:       google.reviewRating ?? null,
      platform_review_count: google.reviewCount ?? null,
      account_age_days:      null,
      is_verified:           google.isVerified ?? false,
      platform_user_id:      google.platformUserId ?? null,
      platform_username:     google.platformUsername ?? null,
      is_oauth_connected:    false,
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

// Sync all photographers who have linked a Google listing (place_id or business name).
// Photographers with neither are skipped (no score to compute).
export async function syncAllPhotographers(): Promise<{ photographerId: string; score: number; error?: string }[]> {
  const db = adminDb()

  // Photographers who have confirmed a Google listing.
  const { data: linkedRows } = await db
    .from('photographer_profiles')
    .select('id')
    .or('google_place_id.not.is.null,google_business_name.not.is.null')

  const idsArr = (linkedRows ?? []).map((r: any) => r.id as string)
  const unique = idsArr.filter((id: string, i: number) => idsArr.indexOf(id) === i)

  const results = await Promise.allSettled(
    unique.map((id: string) => syncTrustScore(id).then(score => ({ photographerId: id, score })))
  )

  return results.map((r, i): { photographerId: string; score: number; error?: string } =>
    r.status === 'fulfilled'
      ? r.value
      : { photographerId: unique[i], score: 0, error: (r.reason as Error)?.message }
  )
}
