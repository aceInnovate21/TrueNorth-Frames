// Shared profile-completeness scoring.
//
// The `photographer_profiles.completeness_score` column defaults to 0 and is
// not kept up to date, so it can't be trusted for display. This helper derives
// the score live from real profile signals, using the same weights the
// photographer dashboard shows, so the admin review and the dashboard agree.

export interface CompletenessSignals {
  displayName?: string | null
  bio?: string | null
  location?: string | null
  avatarUrl?: string | null
  specialtyCount?: number
  portfolioPhotoCount?: number
  availabilitySet?: boolean
  faqCount?: number
  isGbpOAuthConnected?: boolean
}

// Weights mirror the dashboard checklist (app/dashboard/photographer/page.tsx).
// The score is normalized against the total, so the weights need not sum to 100.
export function computeCompleteness(s: CompletenessSignals): number {
  const items: Array<{ done: boolean; weight: number }> = [
    { done: !!s.displayName,                        weight: 10 }, // Display name
    { done: (s.bio ?? '').length >= 20,             weight: 10 }, // Bio written
    { done: !!s.location,                           weight: 5  }, // Location set
    { done: !!s.avatarUrl,                          weight: 10 }, // Profile photo
    { done: (s.specialtyCount ?? 0) > 0,            weight: 10 }, // Specialties chosen
    { done: (s.portfolioPhotoCount ?? 0) > 0,       weight: 15 }, // Portfolio photos
    { done: !!s.availabilitySet,                    weight: 10 }, // Availability set
    { done: (s.faqCount ?? 0) > 0,                  weight: 5  }, // At least 1 FAQ
    { done: !!s.isGbpOAuthConnected,                weight: 20 }, // Google Business connected
  ]
  const earned = items.filter(i => i.done).reduce((a, i) => a + i.weight, 0)
  const total = items.reduce((a, i) => a + i.weight, 0)
  return Math.round((earned / total) * 100)
}
