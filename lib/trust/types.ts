// Instagram and Facebook are out of scope until post-launch Meta app review.
// Trust is currently built entirely from Google Business Profile (GBP).
// The Platform type intentionally stays narrow here; fetcher files use string literals.

export type Platform = 'google'

// A single Google review as returned by the Places API (New). We store only
// what Google's display policy allows us to show, always attributed and linked.
export interface GoogleReviewSnippet {
  author:      string
  authorPhoto: string | null
  rating:      number        // 1–5
  text:        string
  relativeTime: string       // e.g. "2 months ago"
  publishTime: string | null // ISO
}

export interface PlatformSignals {
  platform: string   // 'google' in production; 'instagram'/'facebook' reserved for post-launch
  platformUserId?:   string
  platformUsername?: string
  // GBP / review signals (active)
  reviewRating?:     number   // 1–5
  reviewCount?:      number
  accountAgeDays?:   number
  isVerified?:       boolean
  // Public Google listing extras (Places API New)
  googleMapsUri?:    string
  googleReviews?:    GoogleReviewSnippet[]   // up to 5 "most relevant" reviews
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

// Score formula: base 75 + up to 25 from public Google Places signals.
// (Owner-verified badge and account age were removed — the Places API does not
//  expose them. Their weight was redistributed to reviews and the active-listing
//  signal.)
// Breakdown of the +25:
//   reviews pillar  (rating 55% + count 45%)          → up to +18.0 pts
//   verification    (completeness + active listing)   → up to  +7.0 pts
//     └ profile completeness %      → up to +4.0
//     └ listing operational status  →       +3.0
//   age pillar      (retired — always 0)              →       +0.0

export const TRUST_WEIGHTS = {
  BASE_SCORE: 75,
  BONUS_RANGE: 25,   // total headroom above 75

  // Allocation of the 25 bonus points (must sum to 25)
  bonus: {
    reviews:      18.0,   // Google star rating + review count
    age:           0.0,   // retired (account age not available via Places)
    verification:  7.0,   // profile completeness + active-listing status
  },

  // Within reviews pillar (rating vs count)
  reviews: {
    rating: 0.55,
    count:  0.45,
  },

  // Within verification pillar
  verification: {
    completeness: 0.571,  // → up to 4.0 pts  (7.0 × 0.571 ≈ 4.0)
    gbpVerified:  0.429,  // → up to 3.0 pts  (7.0 × 0.429 ≈ 3.0) — now "active listing"
  },

  caps: {
    reviewCount:   200,    // 200 reviews = 100% of count signal
    accountAgeDays: 1_825, // 5 years = 100% (unused — age retired)
  },
} as const
