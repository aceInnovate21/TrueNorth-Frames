import { PlatformSignals, TrustBreakdown, TRUST_WEIGHTS, Platform } from './types'

// Clamp a value 0–1 given a cap (diminishing returns above cap)
function norm(value: number | undefined | null, cap: number): number {
  if (!value || value <= 0) return 0
  return Math.min(value / cap, 1)
}

function boolScore(v: boolean | undefined | null): number {
  return v ? 1 : 0
}

// Score 0–100 for Instagram signals
function scoreInstagram(s: PlatformSignals | null): number {
  if (!s) return 0
  const w = TRUST_WEIGHTS.instagram
  const c = TRUST_WEIGHTS.caps
  return (
    norm(s.followerCount,      c.followerCount)      * w.followerCount      +
    norm(s.engagementRate,     c.engagementRate)     * w.engagementRate     +
    norm(s.postingConsistency, c.postingConsistency) * w.postingConsistency +
    norm(s.accountAgeDays,     c.accountAgeDays)     * w.accountAgeDays     +
    boolScore(s.isVerified)                          * w.isVerified
  ) * 100
}

// Score 0–100 for Facebook signals
function scoreFacebook(s: PlatformSignals | null): number {
  if (!s) return 0
  const w = TRUST_WEIGHTS.facebook
  const c = TRUST_WEIGHTS.caps

  // If no reviews, weight follower/age/verified only
  const ratingNorm  = s.reviewRating  ? (s.reviewRating - 1) / 4 : 0   // 1–5 → 0–1
  const countNorm   = norm(s.reviewCount, c.reviewCount)

  return (
    norm(s.followerCount,  c.followerCount)  * w.followerCount  +
    ratingNorm                               * w.reviewRating   +
    countNorm                                * w.reviewCount    +
    norm(s.accountAgeDays, c.accountAgeDays) * w.accountAgeDays +
    boolScore(s.isVerified)                  * w.isVerified
  ) * 100
}

// Score 0–100 for Google signals
function scoreGoogle(s: PlatformSignals | null): number {
  if (!s) return 0
  const w = TRUST_WEIGHTS.google
  const c = TRUST_WEIGHTS.caps
  const ratingNorm = s.reviewRating ? (s.reviewRating - 1) / 4 : 0
  return (
    ratingNorm                               * w.reviewRating   +
    norm(s.reviewCount,    c.reviewCount)    * w.reviewCount    +
    norm(s.accountAgeDays, c.accountAgeDays) * w.accountAgeDays
  ) * 100
}

// Native review score (from our own platform)
function scoreNativeReviews(avgRating: number, reviewCount: number): number {
  const ratingNorm = avgRating ? (avgRating - 1) / 4 : 0
  const countNorm  = norm(reviewCount, TRUST_WEIGHTS.caps.reviewCount)
  return (ratingNorm * 0.65 + countNorm * 0.35) * 100
}

export interface ComputeInput {
  instagram:    PlatformSignals | null
  facebook:     PlatformSignals | null
  google:       PlatformSignals | null
  nativeAvgRating:   number
  nativeReviewCount: number
  profileCompletenessPct: number    // 0–100
}

export function computeTrustScore(input: ComputeInput): TrustBreakdown {
  const w = TRUST_WEIGHTS

  // ── Platform pillar (Instagram + Facebook) ─────────────────────────────────
  const igScore = scoreInstagram(input.instagram)
  const fbScore = scoreFacebook(input.facebook)
  const hasIg = !!input.instagram && !input.instagram.error
  const hasFb = !!input.facebook && !input.facebook.error

  let platformRaw = 0
  if (hasIg && hasFb) {
    platformRaw = igScore * w.platform.instagram + fbScore * w.platform.facebook
  } else if (hasIg) {
    platformRaw = igScore
  } else if (hasFb) {
    platformRaw = fbScore
  }

  // ── Reviews pillar (Google + native, weighted 50/50 if both present) ───────
  const googleScore  = scoreGoogle(input.google)
  const nativeScore  = scoreNativeReviews(input.nativeAvgRating, input.nativeReviewCount)
  const hasGoogle    = !!input.google && !input.google.error
  const hasNative    = input.nativeReviewCount > 0

  let reviewsRaw = 0
  if (hasGoogle && hasNative) {
    reviewsRaw = googleScore * 0.55 + nativeScore * 0.45
  } else if (hasGoogle) {
    reviewsRaw = googleScore
  } else if (hasNative) {
    reviewsRaw = nativeScore
  }

  // ── Activity pillar ────────────────────────────────────────────────────────
  // Best posting consistency + account age across connected platforms
  const consistencySignals = [input.instagram, input.facebook]
    .filter(Boolean)
    .map(s => s!.postingConsistency ?? 0)
  const bestConsistency = consistencySignals.length ? Math.max(...consistencySignals) : 0

  const ageDays = Math.max(
    input.instagram?.accountAgeDays ?? 0,
    input.facebook?.accountAgeDays ?? 0,
    input.google?.accountAgeDays ?? 0,
  )
  const activityRaw = (
    norm(bestConsistency, 1) * 0.60 +
    norm(ageDays, TRUST_WEIGHTS.caps.accountAgeDays) * 0.40
  ) * 100

  // ── Verification pillar ────────────────────────────────────────────────────
  const anyVerified = !!(input.instagram?.isVerified || input.facebook?.isVerified)
  const connectionsCount = [hasIg, hasFb, hasGoogle].filter(Boolean).length

  const verificationRaw = (
    boolScore(anyVerified)                          * 0.35 +
    norm(connectionsCount, 3)                       * 0.30 +
    norm(input.profileCompletenessPct / 100, 1)     * 0.35
  ) * 100

  // ── Total ──────────────────────────────────────────────────────────────────
  const total = (
    platformRaw     * w.pillars.platform     +
    reviewsRaw      * w.pillars.reviews      +
    activityRaw     * w.pillars.activity     +
    verificationRaw * w.pillars.verification
  )

  return {
    totalScore: Math.round(total * 10) / 10,
    pillars: {
      platform:     Math.round(platformRaw * 10) / 10,
      reviews:      Math.round(reviewsRaw * 10) / 10,
      activity:     Math.round(activityRaw * 10) / 10,
      verification: Math.round(verificationRaw * 10) / 10,
    },
    signals: {
      instagram: input.instagram,
      facebook:  input.facebook,
      google:    input.google,
    },
    computedAt: new Date().toISOString(),
  }
}
