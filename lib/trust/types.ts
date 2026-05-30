// Instagram and Facebook are out of scope until post-launch Meta app review.
// Trust is currently built entirely from Google Business Profile (GBP).
// The Platform type intentionally stays narrow here; fetcher files use string literals.

export type Platform = 'google'

export interface PlatformSignals {
  platform: string   // 'google' in production; 'instagram'/'facebook' reserved for post-launch
  platformUserId?:   string
  platformUsername?: string
  // GBP / review signals (active)
  reviewRating?:     number   // 1–5
  reviewCount?:      number
  accountAgeDays?:   number
  isVerified?:       boolean
  // Social signals (post-launch — Instagram/Facebook)
  followerCount?:    number
  followingCount?:   number
  postCount?:        number
  avgLikesPerPost?:  number
  avgCommentsPerPost?: number
  engagementRate?:   number   // 0–1
  postingConsistency?: number // 0–1
  error?:            string
}

export interface TrustBreakdown {
  totalScore: number          // 75–100 (0 if GBP not connected)
  pillars: {
    reviews:      number      // 0–100 sub-score (rating + count)
    age:          number      // 0–100 sub-score (account age)
    verification: number      // 0–100 sub-score (completeness + verified)
  }
  signals: { google: PlatformSignals | null }
  computedAt: string
}

// Score formula: base 75 + up to 25 from GBP signals
// Breakdown of the +25:
//   reviews pillar  (rating 55% + count 45%) → up to +12.5 pts
//   age pillar      (account age)             → up to  +3.0 pts
//   verification    (completeness + verified) → up to  +9.5 pts
//     └ profile completeness % → up to +4.5
//     └ GBP verified badge     →       +5.0

export const TRUST_WEIGHTS = {
  BASE_SCORE: 75,
  BONUS_RANGE: 25,   // total headroom above 75

  // Allocation of the 25 bonus points (must sum to 25)
  bonus: {
    reviews:      12.5,   // GBP star rating + review count
    age:           3.0,   // GBP account age
    verification:  9.5,   // completeness + GBP verified
  },

  // Within reviews pillar (rating vs count)
  reviews: {
    rating: 0.55,
    count:  0.45,
  },

  // Within verification pillar
  verification: {
    completeness: 0.474,  // → up to 4.5 pts  (9.5 × 0.474 ≈ 4.5)
    gbpVerified:  0.526,  // → up to 5.0 pts  (9.5 × 0.526 ≈ 5.0)
  },

  caps: {
    reviewCount:   200,    // 200 reviews = 100% of count signal
    accountAgeDays: 1_825, // 5 years = 100%
  },
} as const
