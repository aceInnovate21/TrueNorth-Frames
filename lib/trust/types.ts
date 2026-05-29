export type Platform = 'instagram' | 'facebook' | 'google'

// Raw signals fetched from a platform API
export interface PlatformSignals {
  platform: Platform
  // Identity
  platformUserId?: string
  platformUsername?: string
  // Reach
  followerCount?: number
  followingCount?: number
  postCount?: number
  accountAgeDays?: number
  isVerified?: boolean
  // Engagement
  avgLikesPerPost?: number
  avgCommentsPerPost?: number
  engagementRate?: number        // 0–1
  postingConsistency?: number    // 0–1 (posts/week vs ideal cadence)
  // Reviews
  reviewRating?: number          // 0–5
  reviewCount?: number
  // Error
  error?: string
}

// Weighted score breakdown for one photographer
export interface TrustBreakdown {
  totalScore: number             // 0–100
  pillars: {
    platform: number             // social proof (instagram + facebook)
    reviews: number              // google + native reviews
    activity: number             // posting consistency, account age
    verification: number         // verified badges, profile completeness
  }
  signals: Record<Platform, PlatformSignals | null>
  computedAt: string
}

// Score config — tweak weights here without touching logic
export const TRUST_WEIGHTS = {
  // Pillar weights (must sum to 1)
  pillars: {
    platform:     0.30,   // 30pts — social proof
    reviews:      0.35,   // 35pts — reputation via reviews
    activity:     0.20,   // 20pts — engagement & consistency
    verification: 0.15,   // 15pts — identity signals
  },

  // Sub-weights within platform pillar
  platform: {
    instagram:    0.60,
    facebook:     0.40,
  },

  // Platform-specific signal weights (must sum to 1 per platform)
  instagram: {
    followerCount:       0.25,
    engagementRate:      0.35,
    postingConsistency:  0.25,
    accountAgeDays:      0.10,
    isVerified:          0.05,
  },
  facebook: {
    followerCount:       0.30,
    reviewRating:        0.35,
    reviewCount:         0.20,
    accountAgeDays:      0.10,
    isVerified:          0.05,
  },
  google: {
    reviewRating:        0.55,
    reviewCount:         0.40,
    accountAgeDays:      0.05,
  },

  // Caps for diminishing-returns normalisation
  caps: {
    followerCount:       50_000,   // 50k followers = 100% of signal
    reviewCount:         200,      // 200 reviews = 100%
    accountAgeDays:      1_825,    // 5 years = 100%
    engagementRate:      0.06,     // 6% ER = 100%
    postingConsistency:  1.0,      // already 0–1
  },
} as const
