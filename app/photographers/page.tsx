'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search, SlidersHorizontal, Star, MapPin, ChevronRight, X,
  Baby, Briefcase, Heart, Home, Sparkles, User,
  Shield, ChevronDown, ChevronLeft, Package, Camera,
  Share2, ChevronUp, Images, GitCompare,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { PhotographerBadge } from '@/components/photographer-badge'
import { MasonryGrid, type MasonryPhoto } from '@/components/masonry-grid'
import type { Badge } from '@/lib/badges'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Photographer {
  id: string
  username: string
  display_name: string
  tagline: string
  bio: string
  location: string
  avatar_url: string | null
  cover_src: string | null
  rate_display: string
  trust_score: number
  native_avg_rating: number
  native_review_count: number
  specialties: string[]
  available_today: boolean
  badge: Badge
}

interface ReelPhoto {
  id: string
  src: string
  caption: string
  tags: string[]
  photo_taken_month: number | null
  photo_taken_year: number | null
}

interface ReelItem {
  photographerId: string
  albumId: string | null
  isAlbum: boolean
  username: string
  displayName: string
  location: string
  avatarUrl: string | null
  nativeAvgRating: number
  nativeReviewCount: number
  trustScore: number
  specialties: string[]
  badge: Badge
  photos: ReelPhoto[]
}

// Keep for masonry flatten helper
type ReelPhotographer = ReelItem

interface PackageListing {
  id: string
  name: string
  description: string
  billing_type: 'hourly' | 'package'
  price: number
  deliverables: string[]
  is_popular: boolean
  banner_url: string | null
  specialty: string | null
  photographer: {
    id: string
    username: string
    display_name: string
    location: string
    avatar_url: string | null
    specialties: string[]
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  { value: 'wedding',     label: 'Wedding',     icon: Heart },
  { value: 'portrait',    label: 'Portrait',    icon: User },
  { value: 'corporate',   label: 'Corporate',   icon: Briefcase },
  { value: 'real-estate', label: 'Real Estate', icon: Home },
  { value: 'events',      label: 'Events',      icon: Sparkles },
  { value: 'newborn',     label: 'Newborn',     icon: Baby },
]

const PHOTO_TAGS = [
  'outdoor', 'studio', 'golden hour', 'black & white',
  'editorial', 'nature', 'night', 'travel',
]

const NEIGHBOURHOODS = [
  { value: 'downtown',      label: 'Downtown' },
  { value: 'oliver',        label: 'Oliver' },
  { value: 'glenora',       label: 'Glenora' },
  { value: 'whyte-ave',     label: 'Whyte Ave' },
  { value: 'windermere',    label: 'Windermere' },
  { value: 'riverbend',     label: 'Riverbend' },
  { value: 'st-albert',     label: 'St. Albert' },
  { value: 'sherwood-park', label: 'Sherwood Park' },
]

const PHOTOGRAPHER_SORT = [
  { value: 'rating',   label: 'Top rated' },
  { value: 'reviews',  label: 'Most reviewed' },
  { value: 'response', label: 'Newest members' },
]

const PACKAGE_SORT = [
  { value: 'popular',    label: 'Most popular' },
  { value: 'price_asc',  label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
]

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function avatarBg(id: string) {
  const palette = [
    'bg-slate-700','bg-zinc-700','bg-stone-700','bg-neutral-700',
    'bg-gray-700','bg-slate-600','bg-zinc-600','bg-stone-600',
  ]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

// 2 established + 1 rising talent randomisation when no search active
function mixedSort(photographers: Photographer[], hasActiveFilters: boolean): Photographer[] {
  if (hasActiveFilters || photographers.length <= 3) return photographers

  const rising     = photographers.filter(p => p.badge.type === 'rising_talent' || p.badge.type === 'newly_joined')
  const established = photographers.filter(p => p.badge.type !== 'rising_talent' && p.badge.type !== 'newly_joined')

  const result: Photographer[] = []
  let ri = 0, ei = 0
  let slot = 0

  while (ei < established.length || ri < rising.length) {
    if (slot % 3 === 2 && ri < rising.length) {
      result.push(rising[ri++])
    } else if (ei < established.length) {
      result.push(established[ei++])
    } else {
      result.push(rising[ri++])
    }
    slot++
  }
  return result
}

// ─── Grid Card (no price) ────────────────────────────────────────────────────

function GridCard({ p, compareIds, onToggleCompare }: {
  p: Photographer
  compareIds: string[]
  onToggleCompare: (id: string) => void
}) {
  const hasRating = p.native_avg_rating > 0
  const isComparing = compareIds.includes(p.username)
  const isDisabled = !isComparing && compareIds.length >= 2

  return (
    <div className="relative group">
      {/* Compare toggle — top-left corner */}
      <button
        onClick={e => { e.preventDefault(); onToggleCompare(p.username) }}
        disabled={isDisabled}
        title={isDisabled ? 'Remove one to add another' : isComparing ? 'Remove from compare' : 'Add to compare'}
        className={`absolute top-3 left-3 z-10 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border-2 transition-all duration-200 ${
          isComparing
            ? 'bg-ink text-white border-ink shadow-md'
            : isDisabled
            ? 'bg-white/60 text-ink-200 border-ink-100 cursor-not-allowed'
            : 'bg-white/80 text-ink-500 border-white/60 backdrop-blur-sm hover:bg-ink hover:text-white hover:border-ink'
        }`}
      >
        <GitCompare className="w-2.5 h-2.5" />
        {isComparing ? 'Added' : 'Compare'}
      </button>

    <Link
      href={`/photographers/${p.username}`}
      className="block bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      <div className="relative h-52 overflow-hidden bg-ink-100">
        {p.cover_src ? (
          <Image src={p.cover_src} alt={p.display_name} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${avatarBg(p.id)}`}>
            <span className="text-white text-4xl font-bold opacity-30">{initials(p.display_name)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {p.available_today && (
          <div className="absolute top-3 right-3">
            <div className="bg-emerald-500 rounded-full px-2.5 py-1">
              <span className="text-white text-[10px] font-bold">Available today</span>
            </div>
          </div>
        )}

        {hasRating ? (
          <div className="absolute bottom-14 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-white text-[11px] font-bold">{p.native_avg_rating.toFixed(1)}</span>
          </div>
        ) : p.trust_score > 0 ? (
          <div className="absolute bottom-14 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
            <Shield className="w-3 h-3 text-white" />
            <span className="text-white text-[11px] font-bold">{p.trust_score.toFixed(1)}</span>
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
          <div className="flex items-end gap-2.5 min-w-0">
            <div className="relative w-9 h-9 rounded-xl overflow-hidden border-2 border-white/80 flex-shrink-0 shadow-md">
              {p.avatar_url ? (
                <Image src={p.avatar_url} alt={p.display_name} fill className="object-cover" sizes="36px" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${avatarBg(p.id)} text-white text-[11px] font-bold`}>
                  {initials(p.display_name)}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-base leading-tight truncate">{p.display_name}</p>
              {p.location && (
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-white/70 flex-shrink-0" />
                  <p className="text-white/70 text-[11px] truncate">{p.location}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2.5">
          <PhotographerBadge badge={p.badge} size="sm" showTooltip />
          {hasRating && (
            <span className="text-[10px] text-ink-400">
              <span className="font-semibold text-ink">{p.native_review_count}</span> review{p.native_review_count !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        {p.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {p.specialties.slice(0, 3).map(s => (
              <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
        {p.bio && <p className="text-ink-400 text-xs leading-relaxed line-clamp-2 mb-3">{p.bio}</p>}
        <div className="flex items-center justify-end pt-3 border-t border-ink-50">
          <div className="flex items-center gap-1 text-ink-400 text-[10px] font-semibold group-hover:text-ink transition-colors">
            View profile <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
    </div>
  )
}

// ─── Grid Skeleton ─────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
      <div className="h-52 bg-ink-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 bg-ink-100 rounded w-1/3" />
        <div className="flex gap-1.5">
          <div className="h-5 bg-ink-50 rounded-full w-16" />
          <div className="h-5 bg-ink-50 rounded-full w-14" />
        </div>
        <div className="h-3 bg-ink-50 rounded w-full" />
        <div className="h-3 bg-ink-50 rounded w-3/4" />
        <div className="h-px bg-ink-50" />
        <div className="h-3 bg-ink-50 rounded w-1/4 ml-auto" />
      </div>
    </div>
  )
}

// ─── Package Card ─────────────────────────────────────────────────────────────

function PackageCard({ pkg }: { pkg: PackageListing }) {
  return (
    <Link href={`/photographers/${pkg.photographer.username}`}
      className="group block bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      {pkg.banner_url ? (
        <div className="relative h-36 overflow-hidden">
          <Image src={pkg.banner_url} alt={pkg.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" sizes="400px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {pkg.is_popular && (
            <span className="absolute top-3 left-3 bg-ink text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Popular</span>
          )}
        </div>
      ) : (
        <div className={`h-20 flex items-center justify-center ${avatarBg(pkg.id)} relative`}>
          <Package className="w-8 h-8 text-white opacity-40" />
          {pkg.is_popular && (
            <span className="absolute top-3 left-3 bg-white text-ink text-[10px] font-bold px-2.5 py-1 rounded-full">Popular</span>
          )}
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <p className="font-semibold text-ink text-sm leading-snug">{pkg.name}</p>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-ink text-sm">${pkg.price}</p>
            <p className="text-ink-300 text-[10px]">{pkg.billing_type === 'hourly' ? '/hr' : 'session'}</p>
          </div>
        </div>
        {pkg.description && <p className="text-ink-400 text-xs leading-relaxed line-clamp-2 mb-3">{pkg.description}</p>}
        <div className="flex items-center gap-2 pt-3 border-t border-ink-50">
          <div className="relative w-6 h-6 rounded-lg overflow-hidden flex-shrink-0">
            {pkg.photographer.avatar_url ? (
              <Image src={pkg.photographer.avatar_url} alt={pkg.photographer.display_name} fill className="object-cover" sizes="24px" />
            ) : (
              <div className={`w-full h-full ${avatarBg(pkg.photographer.id)} flex items-center justify-center text-white text-[8px] font-bold`}>
                {initials(pkg.photographer.display_name)}
              </div>
            )}
          </div>
          <p className="text-xs text-ink-500 truncate">{pkg.photographer.display_name}</p>
          <ChevronRight className="w-3 h-3 text-ink-300 ml-auto flex-shrink-0 group-hover:text-ink transition-colors" />
        </div>
      </div>
    </Link>
  )
}

function PackageSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse">
      <div className="h-36 bg-ink-100" />
      <div className="p-4 space-y-3">
        <div className="flex justify-between"><div className="h-4 bg-ink-100 rounded w-1/2" /><div className="h-4 bg-ink-100 rounded w-12" /></div>
        <div className="h-3 bg-ink-50 rounded w-full" />
        <div className="h-px bg-ink-50" />
        <div className="h-3 bg-ink-50 rounded w-2/3" />
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (n: number) => void }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
  return (
    <div className="flex justify-center items-center gap-2 mt-8">
      <button onClick={() => onPage(page - 1)} disabled={page === 1}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-ink-100 disabled:opacity-30 hover:bg-ink-50 transition-colors">
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((n, i) => (
        <span key={n}>
          {i > 0 && pages[i - 1] !== n - 1 && <span className="text-ink-200 text-sm px-1">…</span>}
          <button onClick={() => onPage(n)}
            className={`w-9 h-9 text-sm font-medium rounded-xl border transition-colors ${n === page ? 'bg-ink text-white border-ink' : 'border-ink-100 text-ink-500 hover:bg-ink-50'}`}>
            {n}
          </button>
        </span>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page === totalPages}
        className="w-9 h-9 flex items-center justify-center rounded-xl border border-ink-100 disabled:opacity-30 hover:bg-ink-50 transition-colors">
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

// ─── Portfolio Masonry (desktop) ──────────────────────────────────────────────

function PortfolioMasonry({ specialty, tag, onClear }: { specialty: string; tag: string; onClear: () => void }) {
  const [photos, setPhotos]         = useState<MasonryPhoto[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [seed]                      = useState(() => Math.floor(Math.random() * 999999))
  const [page, setPage]             = useState(1)
  const [hasMore, setHasMore]       = useState(true)

  const fetchMasonry = useCallback(async (pg: number, append = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      const p = new URLSearchParams({ seed: String(seed), page: String(pg) })
      if (specialty) p.set('specialty', specialty)
      if (tag)       p.set('tag', tag)
      const res = await fetch(`/api/portfolio-reel?${p}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const flat = flattenToMasonryPhotos(data.reelItems ?? [])
      setPhotos(prev => append ? [...prev, ...flat] : flat)
      setHasMore(data.hasMore ?? false)
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingMore(false) }
  }, [seed, specialty, tag])

  useEffect(() => { setPage(1); setPhotos([]); fetchMasonry(1) }, [fetchMasonry])

  function loadMore() {
    const next = page + 1
    setPage(next)
    fetchMasonry(next, true)
  }

  return (
    <div>
      <MasonryGrid photos={photos} loading={loading} onClear={onClear} />
      {hasMore && !loading && (
        <div className="flex justify-center mt-8">
          <button onClick={loadMore} disabled={loadingMore}
            className="flex items-center gap-2 text-sm font-semibold text-ink border border-ink-200 px-6 py-3 rounded-xl hover:bg-ink hover:text-white transition-colors disabled:opacity-50">
            {loadingMore
              ? <><div className="w-4 h-4 border-2 border-ink-300 border-t-ink rounded-full animate-spin" /> Loading…</>
              : 'Load more photos'
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Flatten reel items → masonry photos ─────────────────────────────────────

function flattenToMasonryPhotos(reelItems: ReelPhotographer[]): MasonryPhoto[] {
  const photos: MasonryPhoto[] = []
  for (const item of reelItems) {
    for (const photo of item.photos) {
      if (!photo.src) continue
      photos.push({
        id: photo.id,
        src: photo.src,
        caption: photo.caption,
        tags: photo.tags,
        photo_taken_month: photo.photo_taken_month,
        photo_taken_year: photo.photo_taken_year,
        photographer: {
          photographerId: item.photographerId,
          username: item.username,
          displayName: item.displayName,
          location: item.location,
          avatarUrl: item.avatarUrl,
          nativeAvgRating: item.nativeAvgRating,
          nativeReviewCount: item.nativeReviewCount,
          badge: item.badge,
          specialties: item.specialties,
        },
      })
    }
  }
  // Shuffle so same-photographer photos aren't grouped together
  for (let i = photos.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [photos[i], photos[j]] = [photos[j], photos[i]]
  }
  return photos
}

// ─── Portfolio Reel ───────────────────────────────────────────────────────────

function PortfolioReel({ specialty, tag }: { specialty: string; tag: string }) {
  const [reelItems, setReelItems]   = useState<ReelItem[]>([])
  const [loading, setLoading]       = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [seed]                      = useState(() => Math.floor(Math.random() * 999999))
  const [page, setPage]             = useState(1)
  const [hasMore, setHasMore]       = useState(true)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [photoIdxMap, setPhotoIdxMap] = useState<Record<string, number>>({})
  const [drawer, setDrawer]         = useState<ReelItem | null>(null)
  const [copied, setCopied]         = useState(false)
  const containerRef                = useRef<HTMLDivElement>(null)
  const touchStartY                 = useRef<number | null>(null)
  const touchStartX                 = useRef<number | null>(null)

  const fetchReel = useCallback(async (pg: number, append = false) => {
    if (pg === 1) setLoading(true); else setLoadingMore(true)
    try {
      const p = new URLSearchParams({ seed: String(seed), page: String(pg) })
      if (specialty) p.set('specialty', specialty)
      if (tag)       p.set('tag', tag)
      const res = await fetch(`/api/portfolio-reel?${p}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReelItems(prev => append ? [...prev, ...(data.reelItems ?? [])] : (data.reelItems ?? []))
      setHasMore(data.hasMore ?? false)
    } catch { /* silent */ }
    finally { setLoading(false); setLoadingMore(false) }
  }, [seed, specialty, tag])

  useEffect(() => { setCurrentIdx(0); setPhotoIdxMap({}); setPage(1); fetchReel(1) }, [fetchReel])

  // Load more when near end
  useEffect(() => {
    if (hasMore && !loadingMore && currentIdx >= reelItems.length - 3) {
      const next = page + 1
      setPage(next)
      fetchReel(next, true)
    }
  }, [currentIdx, reelItems.length, hasMore, loadingMore, page, fetchReel])

  function goNext() { if (currentIdx < reelItems.length - 1) setCurrentIdx(i => i + 1) }
  function goPrev() { if (currentIdx > 0) setCurrentIdx(i => i - 1) }

  function nextPhoto(reelIdx: number, total: number) {
    setPhotoIdxMap(m => ({ ...m, [reelIdx]: Math.min((m[reelIdx] ?? 0) + 1, total - 1) }))
  }
  function prevPhoto(reelIdx: number) {
    setPhotoIdxMap(m => ({ ...m, [reelIdx]: Math.max((m[reelIdx] ?? 0) - 1, 0) }))
  }

  // Touch handling — vertical = next/prev photographer, horizontal = next/prev photo
  function onTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent, item: ReelItem) {
    if (touchStartY.current === null || touchStartX.current === null) return
    const dy = touchStartY.current - e.changedTouches[0].clientY
    const dx = touchStartX.current - e.changedTouches[0].clientX
    const absX = Math.abs(dx), absY = Math.abs(dy)

    if (absY > absX && absY > 40) {
      if (dy > 0) goNext(); else goPrev()
    } else if (absX > absY && absX > 30 && item.isAlbum) {
      // Only swipe left/right within an album card — standalone has 1 photo so no swipe
      const photoIdx = photoIdxMap[currentIdx] ?? 0
      if (dx > 0) nextPhoto(currentIdx, item.photos.length)
      else if (photoIdx > 0) prevPhoto(currentIdx)
    }
    touchStartY.current = null; touchStartX.current = null
  }

  function share(username: string) {
    const url = `${window.location.origin}/photographers/${username}`
    if (navigator.share) {
      navigator.share({ title: 'Check out this photographer', url }).catch(() => {})
    } else {
      navigator.clipboard.writeText(url).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }).catch(() => {})
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-ink animate-pulse mx-auto mb-3" />
          <p className="text-ink-300 text-sm">Loading portfolio…</p>
        </div>
      </div>
    )
  }

  if (reelItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mb-4">
          <Images className="w-7 h-7 text-ink-300" />
        </div>
        <h3 className="font-semibold text-ink text-lg mb-2">No portfolio photos yet</h3>
        <p className="text-ink-400 text-sm max-w-xs">Try a different specialty or tag filter — photographers are uploading their work now.</p>
      </div>
    )
  }

  const current = reelItems[currentIdx]
  const photoIdx = photoIdxMap[currentIdx] ?? 0
  const currentPhoto = current?.photos[photoIdx]

  return (
    <div className="relative" ref={containerRef}>
      {/* Copied toast */}
      {copied && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-ink text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg animate-fade-in">
          Link copied!
        </div>
      )}

      {/* Quick drawer backdrop */}
      {drawer && (
        <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(null)} />
      )}

      {/* Quick drawer */}
      {drawer && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl p-6 max-w-lg mx-auto shadow-float-xl"
          style={{ boxShadow: '0 -8px 40px rgba(0,0,0,0.18)' }}>
          <div className="w-10 h-1 bg-ink-100 rounded-full mx-auto mb-5" />
          <div className="flex items-center gap-3 mb-4">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0">
              {drawer.avatarUrl ? (
                <Image src={drawer.avatarUrl} alt={drawer.displayName} fill className="object-cover" sizes="48px" />
              ) : (
                <div className={`w-full h-full ${avatarBg(drawer.photographerId)} flex items-center justify-center text-white font-bold text-sm`}>
                  {initials(drawer.displayName)}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-ink">{drawer.displayName}</p>
              {drawer.location && <p className="text-ink-400 text-xs flex items-center gap-1"><MapPin className="w-3 h-3" />{drawer.location}</p>}
            </div>
            <div className="ml-auto"><PhotographerBadge badge={drawer.badge} size="sm" /></div>
          </div>
          {drawer.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {drawer.specialties.map(s => (
                <span key={s} className="text-xs bg-ink-50 text-ink-500 px-2.5 py-1 rounded-full">{s}</span>
              ))}
            </div>
          )}
          {drawer.nativeAvgRating > 0 && (
            <div className="flex items-center gap-1.5 mb-4 text-sm text-ink-400">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-ink">{drawer.nativeAvgRating.toFixed(1)}</span>
              <span>({drawer.nativeReviewCount} review{drawer.nativeReviewCount !== 1 ? 's' : ''})</span>
            </div>
          )}
          <div className="flex gap-3">
            <Link href={`/photographers/${drawer.username}`}
              className="flex-1 bg-ink text-white text-sm font-semibold py-3 rounded-xl text-center hover:bg-ink-800 transition-colors">
              View full profile
            </Link>
            <button onClick={() => { share(drawer.username); setDrawer(null) }}
              className="w-12 h-12 border border-ink-100 rounded-xl flex items-center justify-center hover:bg-ink-50 transition-colors flex-shrink-0">
              <Share2 className="w-4 h-4 text-ink-400" />
            </button>
          </div>
        </div>
      )}

      {/* Reel card */}
      {current && currentPhoto && (
        <div
          className="relative bg-black rounded-2xl overflow-hidden select-none"
          style={{ height: 'min(80vh, 640px)' }}
          onTouchStart={onTouchStart}
          onTouchEnd={(e) => onTouchEnd(e, current)}
        >
          {/* Photo */}
          <Image
            key={currentPhoto.id}
            src={currentPhoto.src}
            alt={currentPhoto.caption || current.displayName}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 640px"
            priority
          />

          {/* Dark gradient bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* Nav arrows — desktop */}
          <button onClick={goPrev} disabled={currentIdx === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-20 hidden sm:flex z-10">
            <ChevronUp className="w-5 h-5" />
          </button>
          <button onClick={goNext} disabled={currentIdx >= reelItems.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors disabled:opacity-20 hidden sm:flex z-10">
            <ChevronDown className="w-5 h-5" />
          </button>

          {/* Photo swipe dots — albums only */}
          {current.isAlbum && current.photos.length > 1 && (
            <div className="absolute top-4 left-0 right-0 flex justify-center gap-1 z-10 pointer-events-none">
              {current.photos.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-200 ${i === photoIdx ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`} />
              ))}
            </div>
          )}

          {/* Left/right photo swipe arrows — desktop, albums only */}
          {current.isAlbum && current.photos.length > 1 && (
            <>
              {photoIdx > 0 && (
                <button onClick={() => prevPhoto(currentIdx)}
                  className="absolute left-3 bottom-32 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors hidden sm:flex z-10">
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              {photoIdx < current.photos.length - 1 && (
                <button onClick={() => nextPhoto(currentIdx, current.photos.length)}
                  className="absolute right-3 bottom-32 w-8 h-8 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors hidden sm:flex z-10">
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </>
          )}

          {/* Bottom overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
            {/* Photographer info — tap to open drawer */}
            <button className="flex items-center gap-3 mb-3 w-full text-left" onClick={() => setDrawer(current)}>
              <div className="relative w-10 h-10 rounded-2xl overflow-hidden border-2 border-white/60 flex-shrink-0">
                {current.avatarUrl ? (
                  <Image src={current.avatarUrl} alt={current.displayName} fill className="object-cover" sizes="40px" />
                ) : (
                  <div className={`w-full h-full ${avatarBg(current.photographerId)} flex items-center justify-center text-white text-[11px] font-bold`}>
                    {initials(current.displayName)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-tight truncate">{current.displayName}</p>
                {current.location && (
                  <p className="text-white/60 text-xs flex items-center gap-1 truncate">
                    <MapPin className="w-2.5 h-2.5 flex-shrink-0" />{current.location}
                  </p>
                )}
              </div>
              <PhotographerBadge badge={current.badge} size="sm" />
            </button>

            {/* Caption */}
            {currentPhoto.caption && (
              <p className="text-white/90 text-sm leading-relaxed mb-2 line-clamp-2">{currentPhoto.caption}</p>
            )}

            {/* Tags + date row */}
            <div className="flex items-center gap-2 flex-wrap">
              {currentPhoto.photo_taken_month && currentPhoto.photo_taken_year && (
                <span className="text-white/50 text-[11px]">
                  {MONTH_NAMES[(currentPhoto.photo_taken_month ?? 1) - 1]} {currentPhoto.photo_taken_year}
                </span>
              )}
              {(currentPhoto.tags ?? []).slice(0, 3).map(t => (
                <span key={t} className="text-white/60 text-[11px] bg-white/10 px-2 py-0.5 rounded-full">#{t}</span>
              ))}
            </div>
          </div>

          {/* Share button */}
          <button
            onClick={() => share(current.username)}
            className="absolute top-4 right-4 w-9 h-9 bg-black/40 hover:bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors z-10">
            <Share2 className="w-4 h-4" />
          </button>

          {/* Album badge — shown on album cards */}
          {current.isAlbum && (
            <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-full px-2.5 py-1 z-10 flex items-center gap-1">
              <Images className="w-3 h-3 text-white/70" />
              <span className="text-white text-[11px] font-medium">Album · {current.photos.length} photos</span>
            </div>
          )}

          {/* Counter — standalone cards only, when multiple items */}
          {!current.isAlbum && reelItems.length > 1 && (
            <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-sm rounded-full px-2.5 py-1 z-10">
              <span className="text-white text-[11px] font-medium">
                {currentIdx + 1} / {reelItems.length}{hasMore ? '+' : ''}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Desktop: swipe hint */}
      <div className="hidden sm:flex items-center justify-center gap-6 mt-4 text-xs text-ink-300">
        <span>↑ ↓ scroll</span>
        <span>· ← → swipe album photos</span>
        <span>· tap name for profile</span>
      </div>
      <div className="sm:hidden flex items-center justify-center gap-4 mt-3 text-xs text-ink-300">
        <span>Swipe up/down · tap name for profile</span>
      </div>

      {/* Desktop nav bar below card */}
      <div className="hidden sm:flex items-center justify-center gap-3 mt-4">
        <button onClick={goPrev} disabled={currentIdx === 0}
          className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink disabled:opacity-30 transition-colors border border-ink-100 px-4 py-2 rounded-xl">
          <ChevronUp className="w-4 h-4" /> Previous
        </button>
        <button onClick={goNext} disabled={currentIdx >= reelItems.length - 1 && !hasMore}
          className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink disabled:opacity-30 transition-colors border border-ink-100 px-4 py-2 rounded-xl">
          Next <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {loadingMore && (
        <div className="flex justify-center mt-4">
          <div className="w-5 h-5 border-2 border-ink-200 border-t-ink rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PhotographersPage() {
  return <Suspense><PhotographersPageInner /></Suspense>
}

function PhotographersPageInner() {
  const searchParams = useSearchParams()

  // ── Tab ───────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<'portfolio' | 'photographers' | 'packages'>('portfolio')

  // ── Shared filters ────────────────────────────────────────────────────────
  const [query, setQuery]                           = useState('')
  const [selectedSpecialty, setSelectedSpecialty]   = useState('')
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState('')
  const [showFilters, setShowFilters]               = useState(false)
  const [minRating, setMinRating]                   = useState(0)
  const [availableOnly, setAvailableOnly]           = useState(false)
  const [page, setPage]                             = useState(1)

  // ── Portfolio reel filters ────────────────────────────────────────────────
  const [selectedTag, setSelectedTag] = useState('')

  // ── Photographer sort ─────────────────────────────────────────────────────
  const [photoSort, setPhotoSort] = useState('rating')

  // ── Package filters ───────────────────────────────────────────────────────
  const [billingType, setBillingType] = useState('')
  const [minPrice, setMinPrice]       = useState(0)
  const [maxPrice, setMaxPrice]       = useState(0)
  const [packageSort, setPackageSort] = useState('popular')

  // ── Compare ───────────────────────────────────────────────────────────────
  const [compareIds, setCompareIds] = useState<string[]>([])

  function toggleCompare(username: string) {
    setCompareIds(prev =>
      prev.includes(username)
        ? prev.filter(id => id !== username)
        : prev.length < 2 ? [...prev, username] : prev
    )
  }

  // ── Data ──────────────────────────────────────────────────────────────────
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [packages, setPackages]           = useState<PackageListing[]>([])
  const [total, setTotal]                 = useState(0)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pre-fill specialty from URL
  useEffect(() => {
    const sp = searchParams.get('specialty')
    if (sp) { setSelectedSpecialty(sp); setTab('portfolio') }
  }, [searchParams])

  const fetchPhotographers = useCallback(async (opts: {
    q: string; specialty: string; neighbourhood: string
    minRating: number; availableOnly: boolean; sort: string; page: number
  }) => {
    setLoading(true); setError(false)
    try {
      const p = new URLSearchParams()
      if (opts.q)             p.set('q', opts.q)
      if (opts.specialty)     p.set('specialty', opts.specialty)
      if (opts.neighbourhood) p.set('neighbourhood', opts.neighbourhood)
      if (opts.minRating > 0) p.set('min_rating', String(opts.minRating))
      if (opts.availableOnly) p.set('available_today', '1')
      p.set('sort', opts.sort)
      p.set('page', String(opts.page))
      const res = await fetch(`/api/photographers?${p}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPhotographers(data.photographers ?? [])
      setTotal(data.total ?? 0)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [])

  const fetchPackages = useCallback(async (opts: {
    q: string; specialty: string; neighbourhood: string
    billingType: string; minPrice: number; maxPrice: number; sort: string; page: number
  }) => {
    setLoading(true); setError(false)
    try {
      const p = new URLSearchParams()
      if (opts.q)             p.set('q', opts.q)
      if (opts.specialty)     p.set('specialty', opts.specialty)
      if (opts.neighbourhood) p.set('neighbourhood', opts.neighbourhood)
      if (opts.billingType)   p.set('billing_type', opts.billingType)
      if (opts.minPrice > 0)  p.set('min_price', String(opts.minPrice))
      if (opts.maxPrice > 0)  p.set('max_price', String(opts.maxPrice))
      p.set('sort', opts.sort)
      p.set('page', String(opts.page))
      const res = await fetch(`/api/packages?${p}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPackages(data.packages ?? [])
      setTotal(data.total ?? 0)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [])

  // Fetch when tab switches to photographers or packages
  useEffect(() => {
    if (tab === 'portfolio') return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      if (tab === 'photographers') {
        fetchPhotographers({ q: query, specialty: selectedSpecialty, neighbourhood: selectedNeighbourhood, minRating, availableOnly, sort: photoSort, page: 1 })
      } else {
        fetchPackages({ q: query, specialty: selectedSpecialty, neighbourhood: selectedNeighbourhood, billingType, minPrice, maxPrice, sort: packageSort, page: 1 })
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selectedSpecialty, selectedNeighbourhood, minRating, availableOnly, photoSort, billingType, minPrice, maxPrice, packageSort, tab])

  useEffect(() => {
    if (tab === 'portfolio') return
    if (tab === 'photographers') {
      fetchPhotographers({ q: query, specialty: selectedSpecialty, neighbourhood: selectedNeighbourhood, minRating, availableOnly, sort: photoSort, page })
    } else {
      fetchPackages({ q: query, specialty: selectedSpecialty, neighbourhood: selectedNeighbourhood, billingType, minPrice, maxPrice, sort: packageSort, page })
    }
  }, [page]) // eslint-disable-line react-hooks/exhaustive-deps

  function switchTab(t: typeof tab) {
    setTab(t); setPage(1); setQuery('')
    setSelectedSpecialty(''); setSelectedNeighbourhood('')
    setMinRating(0); setAvailableOnly(false)
    setBillingType(''); setMinPrice(0); setMaxPrice(0)
    setSelectedTag(''); setShowFilters(false)
  }

  function clearAll() {
    setQuery(''); setSelectedSpecialty(''); setSelectedNeighbourhood('')
    setMinRating(0); setAvailableOnly(false)
    setBillingType(''); setMinPrice(0); setMaxPrice(0)
    setSelectedTag(''); setPage(1)
  }

  function goPage(n: number) { setPage(n); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  const totalPages = Math.ceil(total / 12)
  const hasActiveFilters = !!(query || selectedSpecialty || selectedNeighbourhood || minRating || availableOnly)
  const displayedPhotographers = tab === 'photographers' ? mixedSort(photographers, hasActiveFilters) : photographers

  const activeFiltersCount = [
    selectedSpecialty, selectedNeighbourhood,
    minRating > 0 ? 'r' : '',
    availableOnly ? 'a' : '',
    billingType,
    minPrice > 0 || maxPrice > 0 ? 'p' : '',
    selectedTag,
  ].filter(Boolean).length

  return (
    <>
      <Nav />

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-1">Edmonton Photographers</h1>
              <p className="text-ink-400 text-sm">Verified trust scores · No booking fees</p>
            </div>

            {/* 3-tab toggle */}
            <div className="flex items-center bg-ink-50 rounded-xl p-1 border border-ink-100">
              {([
                { id: 'portfolio',      label: 'Portfolio',      Icon: Images },
                { id: 'photographers',  label: 'Photographers',  Icon: Camera },
                { id: 'packages',       label: 'Packages',       Icon: Package },
              ] as const).map(({ id, label, Icon }) => (
                <button key={id} onClick={() => switchTab(id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    tab === id ? 'bg-white text-ink shadow-sm border border-ink-100' : 'text-ink-400 hover:text-ink'
                  }`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar — sticky ───────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

            {/* Search — not shown on portfolio tab */}
            {tab !== 'portfolio' && (
              <label className="flex items-center gap-2 flex-1 min-w-[160px] max-w-xs bg-ink-50 rounded-xl px-3.5 py-2.5">
                <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
                <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                  placeholder={tab === 'photographers' ? 'Search by name…' : 'Search packages…'}
                  className="bg-transparent text-ink text-sm placeholder-ink-300 outline-none w-full" />
                {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-ink-300 hover:text-ink" /></button>}
              </label>
            )}

            {/* Specialty pills */}
            <div className="hidden lg:flex items-center gap-1.5 flex-wrap">
              {SPECIALTIES.map(s => (
                <button key={s.value}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === s.value ? '' : s.value)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                    selectedSpecialty === s.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                  }`}>{s.label}
                </button>
              ))}
            </div>

            {/* Tag filter — portfolio tab only */}
            {tab === 'portfolio' && (
              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-nowrap">
                {PHOTO_TAGS.map(t => (
                  <button key={t} onClick={() => setSelectedTag(selectedTag === t ? '' : t)}
                    className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg border transition-colors capitalize ${
                      selectedTag === t ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                    }`}>#{t}
                  </button>
                ))}
              </div>
            )}

            {/* Available today — photographers tab */}
            {tab === 'photographers' && (
              <button onClick={() => setAvailableOnly(!availableOnly)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                  availableOnly ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${availableOnly ? 'bg-white' : 'bg-emerald-400'}`} />
                Available today
              </button>
            )}

            {/* Billing type — packages tab */}
            {tab === 'packages' && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {[{ v: '', l: 'All' }, { v: 'hourly', l: 'Hourly' }, { v: 'package', l: 'Session' }].map(bt => (
                  <button key={bt.v} onClick={() => setBillingType(billingType === bt.v ? '' : bt.v)}
                    className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                      billingType === bt.v ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                    }`}>{bt.l}
                  </button>
                ))}
              </div>
            )}

            {/* Filters — not on portfolio */}
            {tab !== 'portfolio' && (
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                  showFilters || activeFiltersCount > 0 ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                }`}>
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filters
                {activeFiltersCount > 0 && (
                  <span className="bg-white text-ink rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">{activeFiltersCount}</span>
                )}
                <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
              </button>
            )}

            {/* Sort — not on portfolio */}
            {tab !== 'portfolio' && (
              <select
                value={tab === 'photographers' ? photoSort : packageSort}
                onChange={e => tab === 'photographers' ? setPhotoSort(e.target.value) : setPackageSort(e.target.value)}
                className="text-xs font-medium text-ink-500 border border-ink-100 rounded-lg px-3 py-2 outline-none bg-white cursor-pointer flex-shrink-0 ml-auto">
                {(tab === 'photographers' ? PHOTOGRAPHER_SORT : PACKAGE_SORT).map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            )}

            {/* Clear filters — portfolio tab */}
            {tab === 'portfolio' && (selectedSpecialty || selectedTag) && (
              <button onClick={clearAll} className="ml-auto text-xs text-ink-400 hover:text-ink underline underline-offset-2 flex-shrink-0">
                Clear
              </button>
            )}
          </div>

          {/* Expanded filter panel */}
          {showFilters && tab !== 'portfolio' && (
            <div className="mt-4 pt-4 border-t border-ink-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="lg:hidden">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Specialty</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTIES.map(s => (
                    <button key={s.value} onClick={() => setSelectedSpecialty(selectedSpecialty === s.value ? '' : s.value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedSpecialty === s.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100'
                      }`}>{s.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Neighbourhood</p>
                <div className="flex flex-wrap gap-1.5">
                  {NEIGHBOURHOODS.map(n => (
                    <button key={n.value} onClick={() => setSelectedNeighbourhood(selectedNeighbourhood === n.value ? '' : n.value)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                        selectedNeighbourhood === n.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                      }`}>{n.label}
                    </button>
                  ))}
                </div>
              </div>
              {tab === 'photographers' && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Min rating</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[0, 4.5, 4.7, 4.9].map(r => (
                      <button key={r} onClick={() => setMinRating(r)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          minRating === r ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                        }`}>
                        {r === 0 ? 'Any' : <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-current" /> {r}+</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {tab === 'packages' && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Price range</p>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min $" value={minPrice || ''} onChange={e => setMinPrice(Number(e.target.value))}
                      className="w-24 text-xs border border-ink-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-ink" />
                    <span className="text-ink-300 text-xs">–</span>
                    <input type="number" placeholder="Max $" value={maxPrice || ''} onChange={e => setMaxPrice(Number(e.target.value))}
                      className="w-24 text-xs border border-ink-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-ink" />
                  </div>
                </div>
              )}
              {activeFiltersCount > 0 && (
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button onClick={clearAll} className="text-xs text-ink-400 hover:text-ink underline underline-offset-2">Clear all filters</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="bg-ink-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ── Portfolio — masonry on desktop, reel on mobile ── */}
          {tab === 'portfolio' && (
            <>
              {/* Active filter chips */}
              {(selectedSpecialty || selectedTag) && (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {selectedSpecialty && (
                    <button onClick={() => setSelectedSpecialty('')}
                      className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full capitalize">
                      {selectedSpecialty} <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {selectedTag && (
                    <button onClick={() => setSelectedTag('')}
                      className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                      #{selectedTag} <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              )}

              {/* Desktop: Pinterest-style asymmetric masonry grid */}
              <div className="hidden lg:block">
                <PortfolioMasonry specialty={selectedSpecialty} tag={selectedTag} onClear={clearAll} />
              </div>

              {/* Mobile: vertical reel scroll */}
              <div className="lg:hidden max-w-lg mx-auto">
                <PortfolioReel specialty={selectedSpecialty} tag={selectedTag} />
              </div>
            </>
          )}

          {/* ── Photographers grid ── */}
          {tab === 'photographers' && (
            <>
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <p className="text-sm text-ink-400">
                  {loading
                    ? <span className="inline-block w-32 h-4 bg-ink-100 rounded animate-pulse" />
                    : <><span className="font-semibold text-ink">{total}</span> photographer{total !== 1 ? 's' : ''}
                        {selectedSpecialty && <> in <span className="font-medium text-ink capitalize">{selectedSpecialty}</span></>}
                        {!hasActiveFilters && <span className="text-ink-300"> · randomised</span>}
                      </>
                  }
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  {selectedSpecialty && (
                    <button onClick={() => setSelectedSpecialty('')} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                      <span className="capitalize">{selectedSpecialty}</span> <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {selectedNeighbourhood && (
                    <button onClick={() => setSelectedNeighbourhood('')} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                      {NEIGHBOURHOODS.find(n => n.value === selectedNeighbourhood)?.label} <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {minRating > 0 && (
                    <button onClick={() => setMinRating(0)} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                      {minRating}+ stars <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  {availableOnly && (
                    <button onClick={() => setAvailableOnly(false)} className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full">
                      Available today <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              </div>

              {error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <X className="w-8 h-8 text-red-300 mb-3" />
                  <h3 className="font-semibold text-ink mb-2">Something went wrong</h3>
                  <button onClick={clearAll} className="text-sm font-semibold text-ink border border-ink-200 px-5 py-2.5 rounded-xl hover:bg-ink hover:text-white transition-colors">
                    Try again
                  </button>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <GridSkeleton key={i} />)}
                </div>
              ) : displayedPhotographers.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {displayedPhotographers.map(p => (
                      <GridCard key={p.id} p={p} compareIds={compareIds} onToggleCompare={toggleCompare} />
                    ))}
                  </div>
                  <Pagination page={page} totalPages={totalPages} onPage={goPage} />
                </>
              ) : (
                <EmptyState onClear={clearAll} label="photographers" />
              )}
            </>
          )}

          {/* ── Packages ── */}
          {tab === 'packages' && (
            <>
              {error ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <X className="w-8 h-8 text-red-300 mb-3" />
                  <h3 className="font-semibold text-ink mb-2">Something went wrong</h3>
                  <button onClick={clearAll} className="text-sm font-semibold text-ink border border-ink-200 px-5 py-2.5 rounded-xl hover:bg-ink hover:text-white transition-colors">
                    Try again
                  </button>
                </div>
              ) : loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => <PackageSkeleton key={i} />)}
                </div>
              ) : packages.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                  </div>
                  <Pagination page={page} totalPages={totalPages} onPage={goPage} />
                </>
              ) : (
                <EmptyState onClear={clearAll} label="packages" />
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Floating Compare Bar ──────────────────────────────────────────── */}
      {compareIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div
            className="flex items-center gap-3 bg-ink text-white px-5 py-3.5 rounded-2xl shadow-float-xl"
            style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)' }}
          >
            {/* Slots */}
            <div className="flex items-center gap-2">
              {[0, 1].map(i => {
                const username = compareIds[i]
                const p = username ? photographers.find(ph => ph.username === username) : null
                return (
                  <div key={i} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    p ? 'bg-white/15 border border-white/20' : 'border-2 border-dashed border-white/20 text-white/40'
                  }`}>
                    {p ? (
                      <>
                        <div className={`w-5 h-5 rounded-full ${avatarBg(p.id)} flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0`}>
                          {initials(p.display_name)}
                        </div>
                        <span className="max-w-[80px] truncate">{p.display_name}</span>
                        <button onClick={() => toggleCompare(username)} className="ml-0.5 text-white/60 hover:text-white transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <span className="px-1">Pick {i + 1}</span>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="w-px h-6 bg-white/20" />

            {compareIds.length === 2 ? (
              <Link
                href={`/compare?a=${compareIds[0]}&b=${compareIds[1]}`}
                className="flex items-center gap-1.5 bg-white text-ink font-bold text-xs px-4 py-2 rounded-xl hover:bg-ink-100 transition-colors"
              >
                <GitCompare className="w-3.5 h-3.5" />
                Compare now
              </Link>
            ) : (
              <span className="text-white/50 text-xs">Select one more</span>
            )}

            <button onClick={() => setCompareIds([])} className="text-white/40 hover:text-white/80 transition-colors ml-1">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

function EmptyState({ onClear, label }: { onClear: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-ink-300" />
      </div>
      <h3 className="font-semibold text-ink text-lg mb-2">No {label} found</h3>
      <p className="text-ink-400 text-sm mb-6 max-w-xs">Try adjusting your filters or search for something different.</p>
      <button onClick={onClear}
        className="text-sm font-semibold text-ink border border-ink-200 px-5 py-2.5 rounded-xl hover:bg-ink hover:text-white transition-colors">
        Clear all filters
      </button>
    </div>
  )
}
