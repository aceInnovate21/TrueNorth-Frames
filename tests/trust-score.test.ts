import { describe, it, expect } from 'vitest'
import { computeTrustScore } from '@/lib/trust/score-engine'
import { TRUST_WEIGHTS } from '@/lib/trust/types'
import type { PlatformSignals } from '@/lib/trust/types'

const gbp = (over: Partial<PlatformSignals> = {}): PlatformSignals => ({
  platform: 'google',
  reviewCount: 0,
  accountAgeDays: 0,
  isVerified: false,
  ...over,
})

describe('computeTrustScore', () => {
  it('scores 0 when no GBP is connected', () => {
    const r = computeTrustScore({ google: null, profileCompletenessPct: 100 })
    expect(r.totalScore).toBe(0)
    expect(r.pillars).toEqual({ reviews: 0, age: 0, verification: 0 })
  })

  it('scores 0 when the GBP signal carries an error', () => {
    const r = computeTrustScore({ google: gbp({ error: 'oauth failed' }), profileCompletenessPct: 100 })
    expect(r.totalScore).toBe(0)
  })

  it('gives the 75 baseline for a connected-but-empty GBP', () => {
    const r = computeTrustScore({ google: gbp(), profileCompletenessPct: 0 })
    expect(r.totalScore).toBe(TRUST_WEIGHTS.BASE_SCORE)
  })

  it('awards the full 100 for a maxed-out profile', () => {
    const r = computeTrustScore({
      google: gbp({
        reviewRating: 5,
        reviewCount: TRUST_WEIGHTS.caps.reviewCount,
        accountAgeDays: TRUST_WEIGHTS.caps.accountAgeDays,
        isVerified: true,
      }),
      profileCompletenessPct: 100,
    })
    expect(r.totalScore).toBe(100)
  })

  it('never exceeds 100 even past the caps', () => {
    const r = computeTrustScore({
      google: gbp({
        reviewRating: 5,
        reviewCount: TRUST_WEIGHTS.caps.reviewCount * 10,
        accountAgeDays: TRUST_WEIGHTS.caps.accountAgeDays * 10,
        isVerified: true,
      }),
      profileCompletenessPct: 100,
    })
    expect(r.totalScore).toBeLessThanOrEqual(100)
  })

  it('keeps every connected score within [75, 100]', () => {
    for (const rating of [1, 2, 3, 4, 5]) {
      const r = computeTrustScore({
        google: gbp({ reviewRating: rating, reviewCount: 10, accountAgeDays: 300, isVerified: false }),
        profileCompletenessPct: 50,
      })
      expect(r.totalScore).toBeGreaterThanOrEqual(75)
      expect(r.totalScore).toBeLessThanOrEqual(100)
    }
  })
})
