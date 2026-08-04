import { describe, it, expect } from 'vitest'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { TRUST_WEIGHTS } from '@/lib/trust/types'

// These guard invariants the rest of the app quietly relies on. If someone
// re-tunes a weight or a limit and breaks the arithmetic, a test fails instead
// of a photographer silently getting an impossible trust score.
describe('trust weight invariants', () => {
  it('bonus pillars sum to the 25-point headroom', () => {
    const sum = TRUST_WEIGHTS.bonus.reviews + TRUST_WEIGHTS.bonus.age + TRUST_WEIGHTS.bonus.verification
    expect(sum).toBeCloseTo(TRUST_WEIGHTS.BONUS_RANGE, 5)
  })

  it('base + bonus range reaches exactly 100', () => {
    expect(TRUST_WEIGHTS.BASE_SCORE + TRUST_WEIGHTS.BONUS_RANGE).toBe(100)
  })

  it('review rating/count weights sum to 1', () => {
    expect(TRUST_WEIGHTS.reviews.rating + TRUST_WEIGHTS.reviews.count).toBeCloseTo(1, 5)
  })

  it('verification sub-weights sum to 1', () => {
    expect(TRUST_WEIGHTS.verification.completeness + TRUST_WEIGHTS.verification.gbpVerified).toBeCloseTo(1, 5)
  })
})

describe('platform config sanity', () => {
  it('message length and hourly caps are positive', () => {
    expect(PLATFORM_CONFIG.max_message_length).toBeGreaterThan(0)
    expect(PLATFORM_CONFIG.max_messages_per_hour).toBeGreaterThan(0)
  })

  it('group hourly cap is at least the DM cap', () => {
    expect(PLATFORM_CONFIG.max_group_messages_per_hour)
      .toBeGreaterThanOrEqual(PLATFORM_CONFIG.max_messages_per_hour)
  })

  it('per-photographer storage budget is positive and bounded', () => {
    expect(PLATFORM_CONFIG.max_storage_bytes_per_photographer).toBeGreaterThan(0)
    expect(PLATFORM_CONFIG.max_compressed_photo_bytes)
      .toBeLessThan(PLATFORM_CONFIG.max_storage_bytes_per_photographer)
  })
})
