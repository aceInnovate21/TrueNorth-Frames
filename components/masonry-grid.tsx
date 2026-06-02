'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Share2, Star } from 'lucide-react'
import { PhotographerBadge } from '@/components/photographer-badge'
import type { Badge } from '@/lib/badges'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MasonryPhoto {
  id: string
  src: string
  caption: string
  tags: string[]
  photo_taken_month: number | null
  photo_taken_year: number | null
  photographer: {
    photographerId: string
    username: string
    displayName: string
    location: string
    avatarUrl: string | null
    nativeAvgRating: number
    nativeReviewCount: number
    badge: Badge
    specialties: string[]
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function avatarBg(id: string) {
  const palette = [
    'bg-slate-700', 'bg-zinc-700', 'bg-stone-700', 'bg-neutral-700',
    'bg-gray-700',  'bg-slate-600', 'bg-zinc-600', 'bg-stone-600',
  ]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Single masonry card ──────────────────────────────────────────────────────

function MasonryCard({ photo, onShare }: { photo: MasonryPhoto; onShare: (username: string) => void }) {
  const [hovered, setHovered] = useState(false)
  const p = photo.photographer

  return (
    <div
      className="relative break-inside-avoid mb-3 rounded-2xl overflow-hidden cursor-pointer group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/photographers/${p.username}`} className="block">
        {/* Photo */}
        <Image
          src={photo.src}
          alt={photo.caption || p.displayName}
          width={600}
          height={800}
          className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          style={{ display: 'block' }}
        />

        {/* Dark overlay — slides up on hover */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300"
          style={{ opacity: hovered ? 1 : 0 }}
        />

        {/* Bottom content — always rendered, fades in */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-300"
          style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(8px)' }}
        >
          {/* Photographer row */}
          <div className="flex items-center gap-2.5 mb-2.5">
            <div className="relative w-8 h-8 rounded-xl overflow-hidden border border-white/40 flex-shrink-0">
              {p.avatarUrl ? (
                <Image src={p.avatarUrl} alt={p.displayName} fill className="object-cover" sizes="32px" />
              ) : (
                <div className={`w-full h-full ${avatarBg(p.photographerId)} flex items-center justify-center text-white text-[10px] font-bold`}>
                  {initials(p.displayName)}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold text-sm leading-tight truncate">{p.displayName}</p>
              {p.location && (
                <p className="text-white/60 text-[11px] flex items-center gap-1 truncate">
                  <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{p.location}
                </p>
              )}
            </div>
          </div>

          {/* Badge + rating */}
          <div className="flex items-center justify-between gap-2">
            <PhotographerBadge badge={p.badge} size="sm" />
            {p.nativeAvgRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span className="text-white text-[11px] font-semibold">{p.nativeAvgRating.toFixed(1)}</span>
                <span className="text-white/50 text-[10px]">({p.nativeReviewCount})</span>
              </div>
            )}
          </div>

          {/* Caption */}
          {photo.caption && (
            <p className="text-white/70 text-[11px] leading-snug mt-2 line-clamp-2">{photo.caption}</p>
          )}

          {/* Tags + date */}
          {(photo.tags.length > 0 || (photo.photo_taken_month && photo.photo_taken_year)) && (
            <div className="flex items-center gap-1.5 flex-wrap mt-2">
              {photo.photo_taken_month && photo.photo_taken_year && (
                <span className="text-white/40 text-[10px]">
                  {MONTH_NAMES[photo.photo_taken_month - 1]} {photo.photo_taken_year}
                </span>
              )}
              {photo.tags.slice(0, 2).map(t => (
                <span key={t} className="text-white/50 text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </Link>

      {/* Share button — top right, visible on hover */}
      <button
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onShare(p.username) }}
        className="absolute top-3 right-3 w-8 h-8 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all duration-200 z-10"
        style={{ opacity: hovered ? 1 : 0 }}
        aria-label="Share photographer"
      >
        <Share2 className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Masonry skeleton ─────────────────────────────────────────────────────────

function MasonrySkeleton() {
  // Varying heights to mimic real photo aspect ratios
  const heights = ['h-64', 'h-80', 'h-48', 'h-96', 'h-72', 'h-56', 'h-88', 'h-64', 'h-48', 'h-80', 'h-72', 'h-60']
  return (
    <div className="columns-2 lg:columns-3 xl:columns-4 gap-3">
      {heights.map((h, i) => (
        <div key={i} className={`break-inside-avoid mb-3 rounded-2xl bg-ink-100 animate-pulse ${h}`} />
      ))}
    </div>
  )
}

// ─── Main Masonry Grid ────────────────────────────────────────────────────────

interface MasonryGridProps {
  photos: MasonryPhoto[]
  loading?: boolean
  empty?: boolean
  onClear?: () => void
}

export function MasonryGrid({ photos, loading, empty, onClear }: MasonryGridProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = useCallback((username: string) => {
    const url = `${window.location.origin}/photographers/${username}`
    if (navigator.share) {
      navigator.share({ title: 'Check out this photographer on TrueNorth Frames', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url)
        .then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) })
        .catch(() => {})
    }
  }, [])

  if (loading) return <MasonrySkeleton />

  if (empty || photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mb-4">
          <Share2 className="w-7 h-7 text-ink-300" />
        </div>
        <h3 className="font-semibold text-ink text-lg mb-2">No portfolio photos yet</h3>
        <p className="text-ink-400 text-sm mb-6 max-w-xs">
          Try a different specialty or tag — photographers are uploading their work now.
        </p>
        {onClear && (
          <button onClick={onClear}
            className="text-sm font-semibold text-ink border border-ink-200 px-5 py-2.5 rounded-xl hover:bg-ink hover:text-white transition-colors">
            Clear filters
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Copied toast */}
      {copied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg pointer-events-none">
          Link copied!
        </div>
      )}

      {/*
        Asymmetric masonry: CSS columns with varying column widths via a
        4-col layout where col 1 is slightly narrower, col 3 slightly wider.
        This creates the natural asymmetry without JS.
      */}
      <div
        className="columns-2 lg:columns-3 xl:columns-4 gap-3"
        style={{ columnFill: 'balance' }}
      >
        {photos.map((photo) => (
          <MasonryCard key={photo.id} photo={photo} onShare={handleShare} />
        ))}
      </div>
    </>
  )
}
