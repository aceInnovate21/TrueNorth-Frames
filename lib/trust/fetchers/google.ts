import { PlatformSignals } from '../types'

// Google Business Profile API (formerly My Business API)
// Requires: https://www.googleapis.com/auth/business.manage scope
// Access via OAuth 2.0 — token stored in platform_oauth_tokens

const GBP_BASE = 'https://mybusinessaccountmanagement.googleapis.com/v1'
const GBP_INFO = 'https://mybusinessbusinessinformation.googleapis.com/v1'
const GBP_REVIEWS = 'https://mybusiness.googleapis.com/v4'

// ── Places API fallback ────────────────────────────────────────────────────────
// Used when photographer hasn't connected Google OAuth yet.
// Requires only GOOGLE_PLACES_API_KEY — no user auth needed.
// Photographer provides their business name; we search Places and get rating + count.

export async function fetchGooglePlacesSignals(businessName: string, location = 'Edmonton AB'): Promise<PlatformSignals> {
  const key = process.env.GOOGLE_PLACES_API_KEY
  if (!key) return { platform: 'google', error: 'GOOGLE_PLACES_API_KEY not set' }

  try {
    // Step 1: Find the place by name
    const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/findplacefromtext/json')
    searchUrl.searchParams.set('input', `${businessName} ${location}`)
    searchUrl.searchParams.set('inputtype', 'textquery')
    searchUrl.searchParams.set('fields', 'place_id,name,rating,user_ratings_total,formatted_address')
    searchUrl.searchParams.set('key', key)

    const searchRes = await fetch(searchUrl.toString(), { next: { revalidate: 0 } })
    if (!searchRes.ok) return { platform: 'google', error: `Places search HTTP ${searchRes.status}` }

    const searchData = await searchRes.json()
    const candidate = searchData?.candidates?.[0]
    if (!candidate?.place_id) return { platform: 'google', error: 'No Google Business listing found for this name' }

    // Step 2: Get full details including review count
    const detailUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json')
    detailUrl.searchParams.set('place_id', candidate.place_id)
    detailUrl.searchParams.set('fields', 'name,rating,user_ratings_total,business_status,opening_hours')
    detailUrl.searchParams.set('key', key)

    const detailRes = await fetch(detailUrl.toString(), { next: { revalidate: 0 } })
    const detailData = detailRes.ok ? await detailRes.json() : null
    const place = detailData?.result ?? candidate

    return {
      platform:        'google',
      platformUserId:  candidate.place_id,
      platformUsername: place.name ?? businessName,
      reviewRating:    place.rating ?? undefined,
      reviewCount:     place.user_ratings_total ?? 0,
      isVerified:      place.business_status === 'OPERATIONAL',
    }
  } catch (e: any) {
    return { platform: 'google', error: e?.message ?? 'Places API error' }
  }
}

export async function fetchGoogleSignals(accessToken: string): Promise<PlatformSignals> {
  try {
    // 1. List accounts
    const accountsRes = await fetch(`${GBP_BASE}/accounts`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      next: { revalidate: 0 },
    })
    if (!accountsRes.ok) {
      if (accountsRes.status === 403) {
        return { platform: 'google', error: 'No Google Business Profile found for this account. Create one at business.google.com and reconnect.' }
      }
      return { platform: 'google', error: `Google API error (${accountsRes.status}) — please reconnect your account.` }
    }
    const accountsData = await accountsRes.json()
    const account = accountsData?.accounts?.[0]
    if (!account) return { platform: 'google', error: 'No Google Business Profile found for this account. Create one at business.google.com and reconnect.' }
    const accountName = account.name  // e.g. "accounts/123456"

    // 2. List locations under account
    const locationsRes = await fetch(
      `${GBP_INFO}/${accountName}/locations?readMask=name,title,metadata`,
      { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 0 } }
    )
    if (!locationsRes.ok) {
      return { platform: 'google', error: `HTTP ${locationsRes.status} fetching locations` }
    }
    const locationsData = await locationsRes.json()
    const location = locationsData?.locations?.[0]
    if (!location) return { platform: 'google', error: 'No Google Business locations found' }
    const locationName = location.name   // e.g. "accounts/123/locations/456"

    // 3. Fetch reviews
    const reviewsRes = await fetch(
      `${GBP_REVIEWS}/${locationName}/reviews?pageSize=50`,
      { headers: { Authorization: `Bearer ${accessToken}` }, next: { revalidate: 0 } }
    )
    if (!reviewsRes.ok) {
      // Reviews endpoint failure is non-fatal — return partial signals
      return {
        platform: 'google',
        platformUserId:   accountName,
        platformUsername: location.title ?? '',
        reviewRating:     location.metadata?.mapsUri ? undefined : undefined,
        reviewCount:      0,
      }
    }
    const reviewsData = await reviewsRes.json()
    const reviews: any[] = reviewsData?.reviews ?? []
    const totalRating = reviews.reduce((sum, r) => {
      const map: Record<string, number> = {
        ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5
      }
      return sum + (map[r.starRating] ?? 0)
    }, 0)
    const avgRating = reviews.length > 0 ? totalRating / reviews.length : 0

    // Account age: use createTime from account object if available
    const accountAgeDays = account.createTime
      ? Math.floor((Date.now() - new Date(account.createTime).getTime()) / (1000 * 86400))
      : undefined

    return {
      platform: 'google',
      platformUserId:   accountName,
      platformUsername: location.title ?? '',
      accountAgeDays,
      isVerified:       location.metadata?.isVerified ?? false,
      reviewRating:     reviews.length > 0 ? Math.round(avgRating * 100) / 100 : undefined,
      reviewCount:      reviewsData?.totalReviewCount ?? reviews.length,
    }
  } catch (e: any) {
    return { platform: 'google', error: e?.message ?? 'Unknown error' }
  }
}

// Exchange an authorization code for tokens using Google OAuth 2.0
export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<{
  accessToken: string
  refreshToken: string
  expiresAt: Date
} | { error: string }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err?.error_description ?? `HTTP ${res.status}` }
  }
  const data = await res.json()
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    expiresAt:    new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  }
}

// Refresh a Google access token using the stored refresh token
export async function refreshGoogleToken(refreshToken: string): Promise<{
  accessToken: string
  expiresAt: Date
} | { error: string }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type:    'refresh_token',
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err?.error_description ?? `HTTP ${res.status}` }
  }
  const data = await res.json()
  return {
    accessToken: data.access_token,
    expiresAt:   new Date(Date.now() + (data.expires_in ?? 3600) * 1000),
  }
}
