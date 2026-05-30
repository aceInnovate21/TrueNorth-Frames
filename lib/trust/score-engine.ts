import { PlatformSignals, TrustBreakdown, TRUST_WEIGHTS } from './types'

function norm(value: number | undefined | null, cap: number): number {
  if (!value || value <= 0) return 0
  return Math.min(value / cap, 1)
}

export interface ComputeInput {
  google:                 PlatformSignals | null
  profileCompletenessPct: number   // 0–100
}

// Returns a score of 75–100 when GBP is connected, 0 when not connected.
// 75 is the baseline for any photographer who connects their GBP.
// The remaining +25 points come from signal quality.
export function computeTrustScore(input: ComputeInput): TrustBreakdown {
  const w   = TRUST_WEIGHTS
  const gbp = input.google

  // No GBP connected → no score
  if (!gbp || gbp.error) {
    return {
      totalScore: 0,
      pillars: { reviews: 0, age: 0, verification: 0 },
      signals: { google: gbp },
      computedAt: new Date().toISOString(),
    }
  }

  // ── Reviews pillar (0–1) ─────────────────────────────────────────────────────
  // rating normalised: 1–5 → 0–1  (a 1-star listing should not score 0)
  const ratingNorm = gbp.reviewRating != null
    ? (gbp.reviewRating - 1) / 4
    : 0
  const countNorm = norm(gbp.reviewCount, w.caps.reviewCount)
  const reviewsRaw = ratingNorm * w.reviews.rating + countNorm * w.reviews.count  // 0–1

  // ── Age pillar (0–1) ─────────────────────────────────────────────────────────
  const ageRaw = norm(gbp.accountAgeDays, w.caps.accountAgeDays)  // 0–1

  // ── Verification pillar (0–1) ────────────────────────────────────────────────
  const completenessRaw = norm(input.profileCompletenessPct, 100)
  const gbpVerifiedRaw  = gbp.isVerified ? 1 : 0
  const verificationRaw = (
    completenessRaw * w.verification.completeness +
    gbpVerifiedRaw  * w.verification.gbpVerified
  )  // 0–1

  // ── Bonus points (0–25) ──────────────────────────────────────────────────────
  const reviewsBonus      = reviewsRaw      * w.bonus.reviews
  const ageBonus          = ageRaw          * w.bonus.age
  const verificationBonus = verificationRaw * w.bonus.verification
  const totalBonus        = reviewsBonus + ageBonus + verificationBonus

  // ── Final score 75–100 ───────────────────────────────────────────────────────
  const total = w.BASE_SCORE + totalBonus

  return {
    totalScore: Math.round(total * 10) / 10,
    pillars: {
      reviews:      Math.round(reviewsRaw      * 100 * 10) / 10,
      age:          Math.round(ageRaw          * 100 * 10) / 10,
      verification: Math.round(verificationRaw * 100 * 10) / 10,
    },
    signals: { google: gbp },
    computedAt: new Date().toISOString(),
  }
}
