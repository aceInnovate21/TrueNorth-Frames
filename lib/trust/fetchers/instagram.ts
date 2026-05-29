import { PlatformSignals } from '../types'

// Instagram Graph API — requires a long-lived User token with
// instagram_basic, instagram_manage_insights scopes.
// Token is stored in platform_oauth_tokens for the photographer.

const GRAPH = 'https://graph.instagram.com'
const FB_GRAPH = 'https://graph.facebook.com/v19.0'

// Fetch basic account info + recent media engagement
export async function fetchInstagramSignals(accessToken: string): Promise<PlatformSignals> {
  try {
    // 1. Account info
    const meRes = await fetch(
      `${GRAPH}/me?fields=id,username,account_type,media_count,followers_count,follows_count&access_token=${accessToken}`,
      { next: { revalidate: 0 } }
    )
    if (!meRes.ok) {
      const err = await meRes.json().catch(() => ({}))
      return { platform: 'instagram', error: err?.error?.message ?? `HTTP ${meRes.status}` }
    }
    const me = await meRes.json()

    // 2. Recent media (last 12 posts) for engagement calc
    const mediaRes = await fetch(
      `${GRAPH}/me/media?fields=id,like_count,comments_count,timestamp&limit=12&access_token=${accessToken}`,
      { next: { revalidate: 0 } }
    )
    const mediaJson = mediaRes.ok ? await mediaRes.json() : { data: [] }
    const posts: Array<{ like_count: number; comments_count: number; timestamp: string }> =
      mediaJson.data ?? []

    let avgLikes = 0
    let avgComments = 0
    let engagementRate = 0
    let postingConsistency = 0

    if (posts.length > 0) {
      avgLikes    = posts.reduce((a, p) => a + (p.like_count ?? 0), 0) / posts.length
      avgComments = posts.reduce((a, p) => a + (p.comments_count ?? 0), 0) / posts.length
      const followers = me.followers_count ?? 1
      engagementRate  = followers > 0 ? (avgLikes + avgComments) / followers : 0

      // Posting consistency: ideal = 3 posts/week → 12 posts should span ≤28 days
      if (posts.length >= 2) {
        const oldest = new Date(posts[posts.length - 1].timestamp).getTime()
        const newest = new Date(posts[0].timestamp).getTime()
        const spanDays = (newest - oldest) / (1000 * 86400)
        const actualRate  = posts.length / Math.max(spanDays, 1) * 7  // posts/week
        const idealRate   = 3
        postingConsistency = Math.min(actualRate / idealRate, 1)
      }
    }

    // Account age: IG API doesn't expose created_at directly;
    // estimate from first media timestamp if available
    let accountAgeDays: number | undefined
    if (posts.length > 0) {
      const oldest = posts[posts.length - 1]?.timestamp
      if (oldest) {
        accountAgeDays = Math.floor(
          (Date.now() - new Date(oldest).getTime()) / (1000 * 86400)
        )
      }
    }

    return {
      platform: 'instagram',
      platformUserId:   me.id,
      platformUsername: me.username,
      followerCount:    me.followers_count ?? 0,
      followingCount:   me.follows_count ?? 0,
      postCount:        me.media_count ?? 0,
      accountAgeDays,
      isVerified:       false,  // Basic API doesn't expose verification badge
      avgLikesPerPost:  avgLikes,
      avgCommentsPerPost: avgComments,
      engagementRate,
      postingConsistency,
    }
  } catch (e: any) {
    return { platform: 'instagram', error: e?.message ?? 'Unknown error' }
  }
}

// Exchange a short-lived code for a long-lived Instagram token
export async function exchangeInstagramCode(code: string, redirectUri: string): Promise<{
  accessToken: string
  userId: string
} | { error: string }> {
  // Step 1: short-lived token
  const form = new URLSearchParams({
    client_id:     process.env.INSTAGRAM_APP_ID!,
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    grant_type:    'authorization_code',
    redirect_uri:  redirectUri,
    code,
  })
  const shortRes = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    body: form,
  })
  if (!shortRes.ok) {
    const err = await shortRes.json().catch(() => ({}))
    return { error: err?.error_message ?? `HTTP ${shortRes.status}` }
  }
  const short = await shortRes.json()

  // Step 2: exchange for long-lived (60 day) token
  const longRes = await fetch(
    `${GRAPH}/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_APP_SECRET}&access_token=${short.access_token}`,
  )
  if (!longRes.ok) {
    return { error: `Token exchange failed: HTTP ${longRes.status}` }
  }
  const long = await longRes.json()

  return {
    accessToken: long.access_token,
    userId: short.user_id,
  }
}
