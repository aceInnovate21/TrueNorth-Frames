import { describe, it, expect } from 'vitest'
import { combinedRating, TNF_REVIEW_WEIGHT } from '@/lib/trust/combined-rating'

describe('combinedRating (Option B — verified weighting)', () => {
  it('returns null rating when there are no reviews anywhere', () => {
    const r = combinedRating({ tnfAvg: 0, tnfCount: 0, googleAvg: null, googleCount: 0 })
    expect(r.rating).toBeNull()
    expect(r.totalCount).toBe(0)
    expect(r.hasTnf).toBe(false)
    expect(r.hasGoogle).toBe(false)
  })

  it('mirrors Google exactly when there are no TNF reviews', () => {
    const r = combinedRating({ tnfAvg: 0, tnfCount: 0, googleAvg: 4.2, googleCount: 100 })
    expect(r.rating).toBe(4.2)
    expect(r.totalCount).toBe(100)
    expect(r.hasGoogle).toBe(true)
  })

  it('mirrors TNF exactly when there are no Google reviews', () => {
    const r = combinedRating({ tnfAvg: 4.9, tnfCount: 8, googleAvg: null, googleCount: 0 })
    expect(r.rating).toBe(4.9)
    expect(r.totalCount).toBe(8)
    expect(r.hasTnf).toBe(true)
  })

  it('weights TNF reviews above Google when combining', () => {
    // TNF 5.0 x10, Google 4.0 x10. Plain avg = 4.5. Weighted should exceed 4.5.
    const plain = (5.0 * 10 + 4.0 * 10) / 20 // 4.5
    const r = combinedRating({ tnfAvg: 5.0, tnfCount: 10, googleAvg: 4.0, googleCount: 10 })
    expect(r.rating!).toBeGreaterThan(plain)
    // Exact: (5*10*1.25 + 4*10) / (10*1.25 + 10) = (62.5 + 40) / 22.5 = 4.555… → 4.6
    expect(r.rating).toBe(4.6)
    expect(r.totalCount).toBe(20)
    expect(r.tnfWeight).toBe(TNF_REVIEW_WEIGHT)
  })

  it('totalCount is the raw (unweighted) sum', () => {
    const r = combinedRating({ tnfAvg: 4.5, tnfCount: 3, googleAvg: 4.0, googleCount: 7 })
    expect(r.totalCount).toBe(10)
  })
})
