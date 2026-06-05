// ─── TrueNorth Frames — Badge Logic ──────────────────────────────────────────
// Badges are computed from verified platform signals — never self-reported.
// Priority ladder: most_reviewed > most_booked > trusted_pro > verified_pro > rising_talent > newly_joined
// A photographer displays exactly ONE badge at a time.

export type BadgeType =
  | 'trusted_pro'    // 3+ completed bookings + native rating ≥ 4.0 + GBP OAuth connected + profile ≥ 80%
  | 'verified_pro'   // GBP OAuth connected with ≥ 1 verified review + profile ≥ 80%
  | 'rising_talent'  // 5+ portfolio photos + profile ≥ 60% + account ≥ 14 days
  | 'most_reviewed'  // top-N by native platform review count (cross-marketplace rank)
  | 'most_booked'    // top-N by completed bookings (cross-marketplace rank)
  | 'newly_joined'   // default — profile still building

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
  // Platform-verified signals (from DB, not self-reported)
  portfolioPhotoCount:  number         // count of portfolio_photos rows
  platformReviewCount:  number         // native reviews with flag_status = 'none'
  nativeAvgRating:      number         // photographer_profiles.native_avg_rating
  completedBookings:    number         // booking_requests with status = 'completed'
  completenessScore:    number         // photographer_profiles.completeness_score (0–100)
  accountAgeDays:       number         // days since created_at
  isGbpOAuthConnected:  boolean        // platform_oauth_tokens row exists with platform='google'
  gbpReviewCount:       number         // external_platform_links.platform_review_count (0 if not connected)

  // Soft signal — self-reported at onboarding, used only as a tiebreaker hint
  yearsExperience:      number | null

  // Cross-marketplace ranking flags — set by list endpoints only
  isMostReviewed?:      boolean
  isMostBooked?:        boolean
}

const BADGES: Record<BadgeType, Omit<Badge, 'type'>> = {
  trusted_pro: {
    label:       'Trusted Pro',
    description: 'Verified Google Business Profile, 3+ completed bookings, and a platform rating of 4.0+',
    color:       'bg-emerald-50',
    textColor:   'text-emerald-700',
    borderColor: 'border-emerald-200',
    emoji:       '✅',
  },
  verified_pro: {
    label:       'Verified Pro',
    description: 'Google Business Profile connected and verified with client reviews',
    color:       'bg-blue-50',
    textColor:   'text-blue-700',
    borderColor: 'border-blue-200',
    emoji:       '🔵',
  },
  rising_talent: {
    label:       'Rising Talent',
    description: 'Strong portfolio and active profile — one to watch',
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
    color:       'bg-pink-50',
    textColor:   'text-pink-700',
    borderColor: 'border-pink-200',
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

// ── Thresholds ────────────────────────────────────────────────────────────────

const TRUSTED_PRO_MIN_BOOKINGS     = 3
const TRUSTED_PRO_MIN_RATING       = 4.0
const TRUSTED_PRO_MIN_COMPLETENESS = 80
const VERIFIED_PRO_MIN_GBP_REVIEWS = 1
const VERIFIED_PRO_MIN_COMPLETENESS = 80
const RISING_TALENT_MIN_PHOTOS     = 5
const RISING_TALENT_MIN_COMPLETENESS = 60
const RISING_TALENT_MIN_DAYS       = 14
const MOST_REVIEWED_MIN_REVIEWS    = 3
const MOST_BOOKED_MIN_BOOKINGS     = 3

// ── Primary badge resolver ────────────────────────────────────────────────────
export function computeBadge(signals: BadgeSignals): Badge {
  const {
    portfolioPhotoCount,
    platformReviewCount,
    nativeAvgRating,
    completedBookings,
    completenessScore,
    accountAgeDays,
    isGbpOAuthConnected,
    gbpReviewCount,
    isMostReviewed,
    isMostBooked,
  } = signals

  // 1. Most Reviewed — cross-marketplace rank, requires minimum reviews to qualify
  if (isMostReviewed && platformReviewCount >= MOST_REVIEWED_MIN_REVIEWS) {
    return { type: 'most_reviewed', ...BADGES.most_reviewed }
  }

  // 2. Most Booked — cross-marketplace rank, requires minimum bookings to qualify
  if (isMostBooked && completedBookings >= MOST_BOOKED_MIN_BOOKINGS) {
    return { type: 'most_booked', ...BADGES.most_booked }
  }

  // 3. Trusted Pro — fully earned on-platform, cannot be gamed at signup
  //    Requires: GBP OAuth verified + 3+ completed bookings + rating ≥ 4.0 + profile ≥ 80%
  const isTrustedPro =
    isGbpOAuthConnected &&
    gbpReviewCount >= VERIFIED_PRO_MIN_GBP_REVIEWS &&
    completedBookings >= TRUSTED_PRO_MIN_BOOKINGS &&
    nativeAvgRating >= TRUSTED_PRO_MIN_RATING &&
    completenessScore >= TRUSTED_PRO_MIN_COMPLETENESS
  if (isTrustedPro) {
    return { type: 'trusted_pro', ...BADGES.trusted_pro }
  }

  // 4. Verified Pro — external credibility verified via OAuth
  //    Requires: GBP OAuth connected with at least 1 verified Google review + profile ≥ 80%
  const isVerifiedPro =
    isGbpOAuthConnected &&
    gbpReviewCount >= VERIFIED_PRO_MIN_GBP_REVIEWS &&
    completenessScore >= VERIFIED_PRO_MIN_COMPLETENESS
  if (isVerifiedPro) {
    return { type: 'verified_pro', ...BADGES.verified_pro }
  }

  // 5. Rising Talent — platform-verifiable effort signals
  //    Requires: 5+ photos + completeness ≥ 60% + account ≥ 14 days old
  const isRisingTalent =
    portfolioPhotoCount >= RISING_TALENT_MIN_PHOTOS &&
    completenessScore >= RISING_TALENT_MIN_COMPLETENESS &&
    accountAgeDays >= RISING_TALENT_MIN_DAYS
  if (isRisingTalent) {
    return { type: 'rising_talent', ...BADGES.rising_talent }
  }

  // 6. Default
  return { type: 'newly_joined', ...BADGES.newly_joined }
}

// ── What a photographer needs to reach the NEXT badge ─────────────────────────
// Used to power the dashboard "badge progress" nudge UI.
export interface BadgeProgress {
  current:   BadgeType
  next:      BadgeType | null   // null if already at top
  remaining: string[]           // human-readable list of unmet criteria
}

export function computeBadgeProgress(signals: BadgeSignals): BadgeProgress {
  const badge = computeBadge(signals)
  const {
    portfolioPhotoCount,
    platformReviewCount,
    nativeAvgRating,
    completedBookings,
    completenessScore,
    accountAgeDays,
    isGbpOAuthConnected,
    gbpReviewCount,
  } = signals

  if (badge.type === 'trusted_pro' || badge.type === 'most_reviewed' || badge.type === 'most_booked') {
    return { current: badge.type, next: null, remaining: [] }
  }

  if (badge.type === 'verified_pro') {
    const remaining: string[] = []
    if (completedBookings < TRUSTED_PRO_MIN_BOOKINGS)
      remaining.push(`${TRUSTED_PRO_MIN_BOOKINGS - completedBookings} more completed booking${completedBookings === TRUSTED_PRO_MIN_BOOKINGS - 1 ? '' : 's'}`)
    if (nativeAvgRating < TRUSTED_PRO_MIN_RATING)
      remaining.push(`platform rating of ${TRUSTED_PRO_MIN_RATING}+ (currently ${nativeAvgRating > 0 ? nativeAvgRating.toFixed(1) : 'no ratings yet'})`)
    if (completenessScore < TRUSTED_PRO_MIN_COMPLETENESS)
      remaining.push(`profile completeness to ${TRUSTED_PRO_MIN_COMPLETENESS}% (currently ${completenessScore}%)`)
    return { current: 'verified_pro', next: 'trusted_pro', remaining }
  }

  if (badge.type === 'rising_talent') {
    const remaining: string[] = []
    if (!isGbpOAuthConnected)
      remaining.push('connect your Google Business Profile via OAuth')
    if (gbpReviewCount < VERIFIED_PRO_MIN_GBP_REVIEWS)
      remaining.push('at least 1 Google review on your GBP listing')
    if (completenessScore < VERIFIED_PRO_MIN_COMPLETENESS)
      remaining.push(`profile completeness to ${VERIFIED_PRO_MIN_COMPLETENESS}% (currently ${completenessScore}%)`)
    return { current: 'rising_talent', next: 'verified_pro', remaining }
  }

  // newly_joined — path to Rising Talent
  const remaining: string[] = []
  if (portfolioPhotoCount < RISING_TALENT_MIN_PHOTOS)
    remaining.push(`${RISING_TALENT_MIN_PHOTOS - portfolioPhotoCount} more portfolio photo${portfolioPhotoCount === RISING_TALENT_MIN_PHOTOS - 1 ? '' : 's'}`)
  if (completenessScore < RISING_TALENT_MIN_COMPLETENESS)
    remaining.push(`profile completeness to ${RISING_TALENT_MIN_COMPLETENESS}% (currently ${completenessScore}%)`)
  if (accountAgeDays < RISING_TALENT_MIN_DAYS)
    remaining.push(`${RISING_TALENT_MIN_DAYS - accountAgeDays} more day${accountAgeDays === RISING_TALENT_MIN_DAYS - 1 ? '' : 's'} on the platform`)
  return { current: 'newly_joined', next: 'rising_talent', remaining }
}

// ── Rank helpers — call these in list APIs before mapping ─────────────────────

export function getMostReviewedIds(
  photographers: { id: string; platformReviewCount: number }[],
  topN = 3
): Set<string> {
  return new Set(
    [...photographers]
      .filter(p => p.platformReviewCount >= MOST_REVIEWED_MIN_REVIEWS)
      .sort((a, b) => b.platformReviewCount - a.platformReviewCount)
      .slice(0, topN)
      .map(p => p.id)
  )
}

export function getMostBookedIds(
  photographers: { id: string; completedBookings: number }[],
  topN = 3
): Set<string> {
  return new Set(
    [...photographers]
      .filter(p => p.completedBookings >= MOST_BOOKED_MIN_BOOKINGS)
      .sort((a, b) => b.completedBookings - a.completedBookings)
      .slice(0, topN)
      .map(p => p.id)
  )
}
