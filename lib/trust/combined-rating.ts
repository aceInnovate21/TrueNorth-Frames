// Combined "Overall rating" for a photographer, blending on-platform (TrueNorth
// Frames) reviews with public Google reviews.
//
// Option B — verified weighting: TrueNorth Frames reviews are tied to real,
// completed, paid bookings, so they cannot be gamed the way public reviews can.
// We therefore weight each TNF review more heavily than a Google review. This is
// a deliberate, DISCLOSED methodology — we never alter the underlying Google
// rating or count, we only weight the two verified/unverified sources when
// combining them into one headline number.

export const TNF_REVIEW_WEIGHT = 1.25 // each booking-verified TNF review counts 1.25×

export interface CombinedRatingInput {
  tnfAvg:      number | null | undefined
  tnfCount:    number | null | undefined
  googleAvg:   number | null | undefined
  googleCount: number | null | undefined
}

export interface CombinedRatingResult {
  rating:        number | null  // weighted 1–5, or null if no reviews anywhere
  totalCount:    number         // raw total (unweighted) review count
  tnfWeight:     number         // the weight applied to TNF reviews
  hasTnf:        boolean
  hasGoogle:     boolean
}

export function combinedRating(input: CombinedRatingInput): CombinedRatingResult {
  const tnfAvg      = Number(input.tnfAvg ?? 0)
  const tnfCount    = Number(input.tnfCount ?? 0)
  const googleAvg   = Number(input.googleAvg ?? 0)
  const googleCount = Number(input.googleCount ?? 0)

  const tnfWeighted    = tnfCount * TNF_REVIEW_WEIGHT
  const googleWeighted = googleCount // Google weight = 1×
  const denom          = tnfWeighted + googleWeighted

  const rating = denom > 0
    ? Math.round(((tnfAvg * tnfWeighted + googleAvg * googleWeighted) / denom) * 10) / 10
    : null

  return {
    rating,
    totalCount: tnfCount + googleCount,
    tnfWeight:  TNF_REVIEW_WEIGHT,
    hasTnf:     tnfCount > 0,
    hasGoogle:  googleCount > 0,
  }
}
