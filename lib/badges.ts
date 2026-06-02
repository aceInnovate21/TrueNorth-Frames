// ─── TrueNorth Frames — Badge Logic ──────────────────────────────────────────
// Badges are computed on the fly from photographer signals.
// No manual assignment, no cron — always reflects current state.

export type BadgeType =
  | 'trusted_pro'     // 3+ yrs Edmonton + GBP + website + Google reviews
  | 'rising_talent'   // < 3 yrs OR new, but has ≥ 5 portfolio photos
  | 'most_reviewed'   // top-N by platform review count
  | 'most_booked'     // top-N by completed bookings
  | 'newly_joined'    // no portfolio, no reviews, no trust score

export interface Badge {
  type:        BadgeType
  label:       string
  description: string
  color:       string   // Tailwind bg class
  textColor:   string   // Tailwind text class
  borderColor: string   // Tailwind border class
  emoji:       string
}

export interface BadgeSignals {
  yearsExperience:      number | null  // years_experience from photographer_profiles
  hasGbp:               boolean        // external_platform_links with platform='google' exists
  hasWebsite:           boolean        // website_url is set
  hasGoogleReviews:     boolean        // GBP link has platform_review_count > 0
  portfolioPhotoCount:  number         // distinct photos uploaded
  platformReviewCount:  number         // native reviews on TrueNorth Frames
  completedBookings:    number         // booking_requests with status='completed'
  trustScore:           number         // trust_score from photographer_profiles
  // Set by the list endpoint for cross-photographer ranking
  isMostReviewed?:      boolean
  isMostBooked?:        boolean
}

const BADGES: Record<BadgeType, Omit<Badge, 'type'>> = {
  trusted_pro: {
    label:       'Trusted Pro',
    description: '3+ years Edmonton experience, verified Google Business Profile & website',
    color:       'bg-emerald-50',
    textColor:   'text-emerald-700',
    borderColor: 'border-emerald-200',
    emoji:       '✅',
  },
  rising_talent: {
    label:       'Rising Talent',
    description: 'Fresh perspective with a strong portfolio — one to watch',
    color:       'bg-amber-50',
    textColor:   'text-amber-700',
    borderColor: 'border-amber-200',
    emoji:       '🌟',
  },
  most_reviewed: {
    label:       'Most Reviewed',
    description: 'Among the most reviewed photographers on TrueNorth Frames',
    color:       'bg-purple-50',
    textColor:   'text-purple-700',
    borderColor: 'border-purple-200',
    emoji:       '🏆',
  },
  most_booked: {
    label:       'Most Booked',
    description: 'Among the most booked photographers on TrueNorth Frames',
    color:       'bg-blue-50',
    textColor:   'text-blue-700',
    borderColor: 'border-blue-200',
    emoji:       '📅',
  },
  newly_joined: {
    label:       'Newly Joined',
    description: 'Recently joined — building their profile on TrueNorth Frames',
    color:       'bg-ink-50',
    textColor:   'text-ink-500',
    borderColor: 'border-ink-100',
    emoji:       '🆕',
  },
}

// ── Primary badge resolver ────────────────────────────────────────────────────
// Priority order: most_reviewed > most_booked > trusted_pro > rising_talent > newly_joined
// A photographer can only display ONE primary badge at a time.
export function computeBadge(signals: BadgeSignals): Badge {
  const {
    yearsExperience,
    hasGbp,
    hasWebsite,
    hasGoogleReviews,
    portfolioPhotoCount,
    platformReviewCount,
    completedBookings,
    trustScore,
    isMostReviewed,
    isMostBooked,
  } = signals

  // 1. Most Reviewed — platform reviews only, top across marketplace
  if (isMostReviewed && platformReviewCount >= 3) {
    return { type: 'most_reviewed', ...BADGES.most_reviewed }
  }

  // 2. Most Booked — completed bookings, top across marketplace
  if (isMostBooked && completedBookings >= 3) {
    return { type: 'most_booked', ...BADGES.most_booked }
  }

  // 3. Trusted Pro — established, verified, external presence
  const isSenior     = yearsExperience !== null && yearsExperience >= 3
  const isTrustedPro = isSenior && hasGbp && hasWebsite && hasGoogleReviews
  if (isTrustedPro) {
    return { type: 'trusted_pro', ...BADGES.trusted_pro }
  }

  // 4. Rising Talent — newer or building up, but has real portfolio work
  const isNewer         = yearsExperience === null || yearsExperience < 3
  const hasGoodPortfolio = portfolioPhotoCount >= 5
  if (isNewer && hasGoodPortfolio) {
    return { type: 'rising_talent', ...BADGES.rising_talent }
  }

  // 5. Even established photographers with portfolio but no GBP/website get Rising Talent
  if (isSenior && hasGoodPortfolio && !isTrustedPro) {
    return { type: 'rising_talent', ...BADGES.rising_talent }
  }

  // 6. Default — newly joined, still building profile
  return { type: 'newly_joined', ...BADGES.newly_joined }
}

// ── Rank helpers — call these in the list API before mapping ─────────────────

// Returns the IDs of the top N photographers by platform review count
export function getMostReviewedIds(
  photographers: { id: string; platformReviewCount: number }[],
  topN = 3
): Set<string> {
  return new Set(
    [...photographers]
      .filter(p => p.platformReviewCount > 0)
      .sort((a, b) => b.platformReviewCount - a.platformReviewCount)
      .slice(0, topN)
      .map(p => p.id)
  )
}

// Returns the IDs of the top N photographers by completed bookings
export function getMostBookedIds(
  photographers: { id: string; completedBookings: number }[],
  topN = 3
): Set<string> {
  return new Set(
    [...photographers]
      .filter(p => p.completedBookings > 0)
      .sort((a, b) => b.completedBookings - a.completedBookings)
      .slice(0, topN)
      .map(p => p.id)
  )
}
