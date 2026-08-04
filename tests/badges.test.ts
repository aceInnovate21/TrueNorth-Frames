import { describe, it, expect } from 'vitest'
import { computeBadge, type BadgeSignals } from '@/lib/badges'

const base: BadgeSignals = {
  portfolioPhotoCount: 0,
  platformReviewCount: 0,
  nativeAvgRating: 0,
  completedBookings: 0,
  completenessScore: 0,
  accountAgeDays: 0,
  isGbpOAuthConnected: false,
  gbpReviewCount: 0,
  yearsExperience: null,
}

const sig = (over: Partial<BadgeSignals>): BadgeSignals => ({ ...base, ...over })

describe('computeBadge priority ladder', () => {
  it('defaults to newly_joined for an empty profile', () => {
    expect(computeBadge(base).type).toBe('newly_joined')
  })

  it('awards rising_talent on portfolio + completeness + age', () => {
    expect(computeBadge(sig({
      portfolioPhotoCount: 5, completenessScore: 60, accountAgeDays: 14,
    })).type).toBe('rising_talent')
  })

  it('awards verified_pro when GBP connected with a review and 80% profile', () => {
    expect(computeBadge(sig({
      isGbpOAuthConnected: true, gbpReviewCount: 1, completenessScore: 80,
    })).type).toBe('verified_pro')
  })

  it('awards trusted_pro when bookings + rating clear the bar', () => {
    expect(computeBadge(sig({
      isGbpOAuthConnected: true, gbpReviewCount: 1, completenessScore: 80,
      completedBookings: 3, nativeAvgRating: 4.0,
    })).type).toBe('trusted_pro')
  })

  it('ranks most_reviewed above trusted_pro when both qualify', () => {
    expect(computeBadge(sig({
      isMostReviewed: true, platformReviewCount: 3,
      isGbpOAuthConnected: true, gbpReviewCount: 1, completenessScore: 80,
      completedBookings: 3, nativeAvgRating: 5,
    })).type).toBe('most_reviewed')
  })

  it('does not award most_reviewed below the minimum review count', () => {
    expect(computeBadge(sig({ isMostReviewed: true, platformReviewCount: 2 })).type)
      .toBe('newly_joined')
  })

  it('does not award trusted_pro one booking short', () => {
    expect(computeBadge(sig({
      isGbpOAuthConnected: true, gbpReviewCount: 1, completenessScore: 80,
      completedBookings: 2, nativeAvgRating: 5,
    })).type).toBe('verified_pro')
  })
})
