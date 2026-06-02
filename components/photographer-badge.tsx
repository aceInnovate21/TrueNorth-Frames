'use client'

import { Badge } from '@/lib/badges'

interface PhotographerBadgeProps {
  badge: Badge
  size?: 'sm' | 'md'
  showDescription?: boolean
}

export function PhotographerBadge({ badge, size = 'md', showDescription = false }: PhotographerBadgeProps) {
  const isSm = size === 'sm'

  return (
    <div className="inline-flex flex-col gap-1">
      <span
        className={`inline-flex items-center gap-1 font-semibold border rounded-full transition-colors
          ${badge.color} ${badge.textColor} ${badge.borderColor}
          ${isSm ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1'}
        `}
      >
        <span className={isSm ? 'text-[10px]' : 'text-xs'}>{badge.emoji}</span>
        {badge.label}
      </span>
      {showDescription && (
        <p className="text-[11px] text-ink-400 leading-snug max-w-[200px]">{badge.description}</p>
      )}
    </div>
  )
}
