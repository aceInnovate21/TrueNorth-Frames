'use client'

import { Badge } from '@/lib/badges'
import { Tooltip } from '@/components/tooltip'

interface PhotographerBadgeProps {
  badge: Badge
  size?: 'sm' | 'md'
  showDescription?: boolean
  showTooltip?: boolean
}

const BADGE_TOOLTIP: Record<string, string> = {
  trusted_pro:   'Earned through verified Google Business Profile, 3+ completed bookings on TrueNorth Frames, and a platform rating of 4.0 or higher.',
  verified_pro:  'This photographer has connected their Google Business Profile via OAuth and has at least one verified Google review.',
  rising_talent: 'This photographer has 5+ portfolio photos, a well-completed profile, and has been active on the platform for at least 14 days.',
  most_reviewed: 'Among the most reviewed photographers on TrueNorth Frames based on verified client reviews.',
  most_booked:   'Among the most booked photographers on TrueNorth Frames based on completed sessions.',
  newly_joined:  'Recently joined TrueNorth Frames and building their profile. Badges are earned automatically — check back soon.',
}

export function PhotographerBadge({ badge, size = 'md', showDescription = false, showTooltip = false }: PhotographerBadgeProps) {
  const isSm = size === 'sm'

  const chip = (
    <span
      className={`inline-flex items-center gap-1 font-semibold border rounded-full transition-colors
        ${badge.color} ${badge.textColor} ${badge.borderColor}
        ${isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}
      `}
    >
      <span className={isSm ? 'text-[10px]' : 'text-xs'}>{badge.emoji}</span>
      {badge.label}
    </span>
  )

  return (
    <div className="inline-flex flex-col gap-1">
      {showTooltip ? (
        <Tooltip content={BADGE_TOOLTIP[badge.type] ?? badge.description} maxWidth={260} side="top">
          {chip}
        </Tooltip>
      ) : chip}
      {showDescription && (
        <p className="text-[11px] text-ink-400 leading-snug max-w-[200px]">{badge.description}</p>
      )}
    </div>
  )
}
