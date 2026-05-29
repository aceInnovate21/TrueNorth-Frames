import { PlatformSignals } from '../types'

const FB = 'https://graph.facebook.com/v19.0'

// Fetch Facebook Page signals.
// Requires a Page Access Token with pages_show_list, pages_read_engagement,
// pages_read_user_content scopes.
export async function fetchFacebookSignals(accessToken: string, pageId?: string): Promise<PlatformSignals> {
  try {
    // If no pageId passed, fetch first page the user manages
    let pid = pageId
    if (!pid) {
      const pagesRes = await fetch(
        `${FB}/me/accounts?fields=id,name,fan_count,verification_status,created_time&access_token=${accessToken}`,
        { next: { revalidate: 0 } }
      )
      if (!pagesRes.ok) {
        return { platform: 'facebook', error: `HTTP ${pagesRes.status} fetching pages` }
      }
      const pages = await pagesRes.json()
      const first = pages?.data?.[0]
      if (!first) return { platform: 'facebook', error: 'No Facebook Pages found for this account' }
      pid = first.id
    }

    // Page details
    const pageRes = await fetch(
      `${FB}/${pid}?fields=id,name,fan_count,followers_count,verification_status,created_time,overall_star_rating,rating_count&access_token=${accessToken}`,
      { next: { revalidate: 0 } }
    )
    if (!pageRes.ok) {
      return { platform: 'facebook', error: `HTTP ${pageRes.status} fetching page` }
    }
    const page = await pageRes.json()

    // Recent posts for posting consistency
    const postsRes = await fetch(
      `${FB}/${pid}/posts?fields=created_time&limit=12&access_token=${accessToken}`,
      { next: { revalidate: 0 } }
    )
    const postsJson = postsRes.ok ? await postsRes.json() : { data: [] }
    const posts: Array<{ created_time: string }> = postsJson.data ?? []

    let postingConsistency = 0
    if (posts.length >= 2) {
      const oldest = new Date(posts[posts.length - 1].created_time).getTime()
      const newest = new Date(posts[0].created_time).getTime()
      const spanDays   = (newest - oldest) / (1000 * 86400)
      const actualRate = posts.length / Math.max(spanDays, 1) * 7
      postingConsistency = Math.min(actualRate / 3, 1)
    }

    const accountAgeDays = page.created_time
      ? Math.floor((Date.now() - new Date(page.created_time).getTime()) / (1000 * 86400))
      : undefined

    return {
      platform: 'facebook',
      platformUserId:   pid,
      platformUsername: page.name,
      followerCount:    page.followers_count ?? page.fan_count ?? 0,
      postCount:        posts.length,
      accountAgeDays,
      isVerified:       page.verification_status === 'blue_verified' || page.verification_status === 'gray_verified',
      reviewRating:     page.overall_star_rating ?? undefined,
      reviewCount:      page.rating_count ?? 0,
      postingConsistency,
    }
  } catch (e: any) {
    return { platform: 'facebook', error: e?.message ?? 'Unknown error' }
  }
}

// Exchange a short-lived user code for a long-lived user token,
// then get a long-lived page token for the first page.
export async function exchangeFacebookCode(code: string, redirectUri: string): Promise<{
  accessToken: string
  userId: string
  pageId?: string
} | { error: string }> {
  // Step 1: short-lived user token
  const tokenRes = await fetch(
    `${FB}/oauth/access_token?client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
  )
  if (!tokenRes.ok) {
    const err = await tokenRes.json().catch(() => ({}))
    return { error: err?.error?.message ?? `HTTP ${tokenRes.status}` }
  }
  const tokenData = await tokenRes.json()
  const shortToken = tokenData.access_token

  // Step 2: long-lived user token (60 days)
  const longRes = await fetch(
    `${FB}/oauth/access_token?grant_type=fb_exchange_token&client_id=${process.env.FACEBOOK_APP_ID}&client_secret=${process.env.FACEBOOK_APP_SECRET}&fb_exchange_token=${shortToken}`
  )
  if (!longRes.ok) return { error: 'Long-lived token exchange failed' }
  const longData = await longRes.json()
  const longToken = longData.access_token

  // Step 3: get user id
  const meRes = await fetch(`${FB}/me?access_token=${longToken}`)
  const me = meRes.ok ? await meRes.json() : {}

  // Step 4: get page token (never expires when using long-lived user token)
  const pagesRes = await fetch(`${FB}/me/accounts?access_token=${longToken}`)
  const pages = pagesRes.ok ? await pagesRes.json() : {}
  const firstPage = pages?.data?.[0]

  // Prefer page token (doesn't expire) if photographer has a business page
  return {
    accessToken: firstPage?.access_token ?? longToken,
    userId:      me.id ?? '',
    pageId:      firstPage?.id,
  }
}
