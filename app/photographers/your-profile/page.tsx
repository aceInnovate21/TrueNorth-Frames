'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, Star, MapPin, Shield, Camera, CheckCircle2,
  Globe, Instagram, Facebook, ExternalLink, Award, Calendar, DollarSign,
  ChevronDown, Package, Eye, Pencil, AlertCircle, ChevronLeft, ChevronRight, X, Layers,
} from 'lucide-react'

interface ProfileData {
  id: string
  username: string
  display_name: string
  tagline: string
  bio: string
  location: string
  avatar_url: string | null
  cover_image_url: string | null
  website_url: string
  instagram_url: string
  rate_display: string
  rate_note: string
  trust_score: number
  native_avg_rating: number
  native_review_count: number
  profile_view_count: number
  member_since: string
  contact_instagram_url: string | null
  contact_facebook_url: string | null
  specialties: string[]
  links: Record<string, { url: string; rating: number | null; count: number | null }>
  native_reviews: { id: string; rating: number; body: string; public_reply: string | null; client_reply: string | null; created_at: string; reviewer_name: string; communication_rating: number | null; quality_rating: number | null; value_rating: number | null; punctuality_rating: number | null }[]
  packages: { id: string; name: string; description: string; billingType: string; price: number; deliverables: string[]; isPopular: boolean }[]
  faqs: { id: string; question: string; answer: string }[]
  availability: { date: string; status: string }[]
  standalone_photos: { id: string; src: string; caption: string }[]
  standalone_videos: { id: string; src: string; title: string; duration_seconds: number | null }[]
  portfolio_albums: { id: string; title: string; photo_count: number; video_count: number; cover_src: string; collage_srcs: string[] }[]
  portfolio_photos: { id: string; album_id: string; src: string; caption: string }[]
  portfolio_videos: { id: string; album_id: string; src: string; title: string; duration_seconds: number | null }[]
}

// ─── Portfolio components ──────────────────────────────────────────────────────

function Lightbox({ photos, startIdx, onClose }: {
  photos: { id: string; src: string; caption: string }[]
  startIdx: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIdx)
  const ph = photos[idx]
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, photos.length - 1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length, onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white/50 text-xs tabular-nums">{idx + 1} / {photos.length}</span>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-12" onClick={e => e.stopPropagation()}>
        <img src={ph.src} alt={ph.caption || ''} className="max-w-full max-h-full object-contain rounded-lg" style={{ maxHeight: 'calc(100vh - 140px)' }} />
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center ml-1">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {idx < photos.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center mr-1">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
      <div className="flex-shrink-0 pb-4" onClick={e => e.stopPropagation()}>
        {ph.caption && <p className="text-white/70 text-sm text-center px-6 py-2 leading-relaxed">{ph.caption}</p>}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-4 mt-1 overflow-x-auto">
            {photos.map((t, i) => (
              <button key={t.id} onClick={() => setIdx(i)}
                className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden transition-all ${i === idx ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-70'}`}>
                <img src={t.src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function VideoModal({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          {title ? <p className="text-white text-sm font-medium">{title}</p> : <span />}
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center ml-auto">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        {src ? (
          <video src={src} controls autoPlay className="w-full rounded-2xl bg-black" style={{ maxHeight: 'calc(100vh - 120px)' }} />
        ) : (
          <div className="w-full aspect-video rounded-2xl bg-ink-900 flex items-center justify-center">
            <p className="text-white/40 text-sm">Video unavailable</p>
          </div>
        )}
      </div>
    </div>
  )
}

function PortfolioPreview({ profile }: { profile: ProfileData }) {
  const [expanded, setExpanded] = useState(false)
  const [openAlbum, setOpenAlbum] = useState<{ album: typeof profile.portfolio_albums[0]; slideIdx: number } | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  const albums = profile.portfolio_albums
  const allPhotos = profile.portfolio_photos
  const allVideos = profile.portfolio_videos
  const standalonePhotos = profile.standalone_photos
  const standaloneVideos = profile.standalone_videos
  const isEmpty = standalonePhotos.length === 0 && standaloneVideos.length === 0 && albums.length === 0

  const postCount = standalonePhotos.length + standaloneVideos.length
  const albumCount = albums.length

  const albumSlides = openAlbum
    ? [
        ...allPhotos.filter(p => p.album_id === openAlbum.album.id).map(p => ({ id: p.id, src: p.src, label: p.caption, isVideo: false })),
        ...allVideos.filter(v => v.album_id === openAlbum.album.id).map(v => ({ id: v.id, src: v.src, label: v.title, isVideo: true })),
      ]
    : []

  function goSlide(dir: 1 | -1) {
    if (!openAlbum) return
    const next = Math.max(0, Math.min(albumSlides.length - 1, openAlbum.slideIdx + dir))
    setOpenAlbum({ ...openAlbum, slideIdx: next })
    slideRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  useEffect(() => {
    if (!expanded) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpenAlbum(null); setExpanded(false) }
      if (openAlbum) {
        if (e.key === 'ArrowRight') goSlide(1)
        if (e.key === 'ArrowLeft') goSlide(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [expanded, openAlbum, albumSlides.length])

  const masonryItems = [
    ...albums.map(a => ({ type: 'album' as const, id: a.id, src: a.cover_src || (a.collage_srcs?.[0] ?? ''), label: a.title, album: a })),
    ...standalonePhotos.map(ph => ({ type: 'photo' as const, id: ph.id, src: ph.src, label: ph.caption, album: null as any })),
    ...standaloneVideos.map(v => ({ type: 'video' as const, id: v.id, src: v.src, label: v.title, album: null as any })),
  ]

  function MasonryGrid() {
    return (
      <div className="columns-2 sm:columns-3" style={{ columnGap: '6px' }}>
        {masonryItems.map(item => (
          <div key={item.id} className="break-inside-avoid mb-1.5 relative rounded-xl overflow-hidden bg-ink-100 group cursor-pointer"
            onClick={() => setExpanded(true)}>
            {item.type === 'video' ? (
              <div className="relative">
                <video src={item.src} className="w-full h-auto block" muted preload="metadata" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors pointer-events-none">
                  <div className="w-8 h-8 rounded-full bg-white/90 flex items-center justify-center shadow">
                    <svg className="w-3.5 h-3.5 text-ink ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                {item.src ? <img src={item.src} alt={item.label || ''} className="w-full h-auto block" /> : <div className="w-full aspect-square flex items-center justify-center bg-ink-100"><Camera className="w-6 h-6 text-ink-200" /></div>}
                {item.type === 'album' && <div className="absolute top-1.5 right-1.5 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-1 pointer-events-none"><Layers className="w-2.5 h-2.5 text-white" /></div>}
                {item.label && <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none"><p className="text-white text-[10px] font-medium line-clamp-2">{item.label}</p></div>}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  function FeedItem({ item }: { item: typeof masonryItems[0] }) {
    return (
      <div className="w-full mb-1">
        {item.type === 'album' ? (
          <button className="w-full relative group cursor-pointer" onClick={() => setOpenAlbum({ album: item.album, slideIdx: 0 })}>
            {item.src ? <img src={item.src} alt={item.label || ''} className="w-full h-auto block" /> : <div className="w-full aspect-video bg-white/10 flex items-center justify-center"><Camera className="w-8 h-8 text-white/30" /></div>}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-2">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-2">
                <Layers className="w-4 h-4 text-white" />
                <span className="text-white font-semibold text-sm">{item.label}</span>
                <span className="text-white/60 text-xs">· {item.album.photo_count + item.album.video_count} items</span>
              </div>
              <p className="text-white/60 text-xs">Tap to view album</p>
            </div>
          </button>
        ) : item.type === 'video' ? (
          <div className="relative w-full">
            <video src={item.src} className="w-full h-auto block" controls preload="metadata" />
            {item.label && <p className="text-white/60 text-xs px-1 pt-1.5">{item.label}</p>}
          </div>
        ) : (
          <div className="relative w-full">
            <img src={item.src} alt={item.label || ''} className="w-full h-auto block" />
            {item.label && <p className="text-white/60 text-xs px-1 pt-1.5">{item.label}</p>}
          </div>
        )}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div className="border-2 border-dashed border-ink-100 rounded-xl p-8 text-center">
        <Camera className="w-8 h-8 text-ink-200 mx-auto mb-2" />
        <p className="text-xs text-ink-300">No portfolio items yet</p>
        <Link href="/dashboard/photographer?tab=portfolio" className="text-xs text-ink underline mt-1 inline-block">Add photos &amp; videos</Link>
      </div>
    )
  }

  return (
    <>
      {/* Scrollable masonry container */}
      <div className="overflow-y-auto cursor-pointer" style={{ maxHeight: '480px' }} onClick={() => setExpanded(true)}>
        <MasonryGrid />
      </div>
      <button onClick={() => setExpanded(true)}
        className="mt-3 w-full text-xs text-ink-300 hover:text-ink transition-colors flex items-center justify-center gap-1">
        <ChevronRight className="w-3.5 h-3.5" />Expand full view
      </button>

      {/* Fullscreen overlay */}
      {expanded && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {openAlbum ? (
            <>
              {/* Album slide header */}
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/10">
                <button onClick={() => setOpenAlbum(null)} className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4" />{openAlbum.album.title}
                </button>
                <span className="text-white/40 text-xs tabular-nums">{openAlbum.slideIdx + 1} / {albumSlides.length}</span>
                <button onClick={() => { setOpenAlbum(null); setExpanded(false) }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Horizontal scroll snap */}
              <div className="relative flex-1 flex items-center">
                <div ref={slideRef} className="flex w-full h-full overflow-x-auto" style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
                  {albumSlides.map((slide, i) => (
                    <div key={slide.id} className="flex-shrink-0 w-full h-full flex items-center justify-center p-2 sm:p-6" style={{ scrollSnapAlign: 'start' }}>
                      {slide.isVideo
                        ? <video src={slide.src} className="max-w-full max-h-full w-auto h-auto rounded-xl" controls preload="metadata" />
                        : <img src={slide.src} alt={slide.label || ''} className="max-w-full max-h-full w-auto h-auto rounded-xl object-contain" />
                      }
                    </div>
                  ))}
                </div>
                {openAlbum.slideIdx > 0 && (
                  <button onClick={() => goSlide(-1)} className="hidden sm:flex absolute left-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 items-center justify-center transition-colors z-10">
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                )}
                {openAlbum.slideIdx < albumSlides.length - 1 && (
                  <button onClick={() => goSlide(1)} className="hidden sm:flex absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 items-center justify-center transition-colors z-10">
                    <ChevronRight className="w-5 h-5 text-white" />
                  </button>
                )}
              </div>

              {/* Dot indicator */}
              {albumSlides.length > 1 && (
                <div className="flex justify-center gap-1 py-3 flex-shrink-0">
                  {albumSlides.map((_, i) => (
                    <button key={i} onClick={() => { setOpenAlbum({ ...openAlbum, slideIdx: i }); slideRef.current?.children[i]?.scrollIntoView({ behavior: 'smooth', inline: 'start' }) }}
                      className={`rounded-full transition-all ${i === openAlbum.slideIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Feed header */}
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-white/60" />
                  <span className="text-white font-semibold text-sm">Portfolio</span>
                  <span className="text-white/40 text-xs">
                    {postCount > 0 ? `${postCount} post${postCount !== 1 ? 's' : ''}` : ''}
                    {albumCount > 0 ? `${postCount > 0 ? ' · ' : ''}${albumCount} album${albumCount !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>
                <button onClick={() => setExpanded(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>

              {/* Vertical Instagram-style feed */}
              <div className="flex-1 overflow-y-auto">
                <div className="max-w-2xl mx-auto py-2 px-2 sm:px-0 space-y-1">
                  {masonryItems.map(item => <FeedItem key={item.id} item={item} />)}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

// ─── Page helpers ─────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
}

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-ink fill-ink' : 'text-ink-200 fill-ink-200'}`} />
        ))}
      </div>
      <span className="font-bold text-ink text-sm">{Number(rating).toFixed(1)}</span>
      <span className="text-ink-300 text-xs">({count})</span>
    </div>
  )
}

const REVIEW_SUB_LABELS = [
  { key: 'communication_rating' as const, label: 'Communication' },
  { key: 'quality_rating' as const,       label: 'Quality' },
  { key: 'punctuality_rating' as const,   label: 'Punctuality' },
  { key: 'value_rating' as const,         label: 'Value' },
]

function ReviewCard({ r }: { r: ProfileData['native_reviews'][0] }) {
  const subRatings = REVIEW_SUB_LABELS.filter(s => r[s.key] != null)
  return (
    <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {initials(r.reviewer_name)}
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{r.reviewer_name}</p>
            <span className="text-ink-300 text-[10px]">{formatDate(r.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'text-ink fill-ink' : 'text-ink-100 fill-ink-100'}`} />
          ))}
        </div>
      </div>
      {subRatings.length > 0 && (
        <div className="space-y-1.5 mb-3 pt-3 border-t border-ink-50">
          {subRatings.map(s => (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-[10px] text-ink-300 w-20 flex-shrink-0">{s.label}</span>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} className={`w-3 h-3 ${i <= (r[s.key] ?? 0) ? 'text-ink fill-ink' : 'text-ink-100 fill-ink-100'}`} />
                ))}
              </div>
              <span className="text-[10px] text-ink-200 ml-0.5">
                {['','Poor','Fair','Good','Great','Excellent'][r[s.key] ?? 0]}
              </span>
            </div>
          ))}
        </div>
      )}
      {r.body && <p className="text-ink-500 text-sm leading-relaxed">{r.body}</p>}
      {r.public_reply && (
        <div className="mt-3 pt-3 border-t border-ink-50 space-y-2.5">
          <div className="flex gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-ink flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-[9px] font-bold">P</span>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-ink mb-0.5">Photographer's reply</p>
              <p className="text-xs text-ink-500 leading-relaxed">{r.public_reply}</p>
            </div>
          </div>
          {r.client_reply && (
            <div className="flex gap-2.5 pl-2 border-l-2 border-ink-100">
              <div className="w-5 h-5 rounded-md bg-ink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-ink-500 text-[8px] font-bold">C</span>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-ink-500 mb-0.5">{r.reviewer_name}</p>
                <p className="text-xs text-ink-500 leading-relaxed">{r.client_reply}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function PackageCard({ pkg }: { pkg: ProfileData['packages'][0] }) {
  return (
    <div className={`relative bg-white rounded-2xl p-5 border ${pkg.isPopular ? 'border-ink' : 'border-ink-100'}`}
      style={{ boxShadow: pkg.isPopular ? '0 4px 20px rgba(0,0,0,0.1)' : '0 1px 2px rgba(0,0,0,0.04)' }}>
      {pkg.isPopular && (
        <div className="absolute -top-3 left-4">
          <span className="text-[10px] font-bold bg-ink text-white px-3 py-1 rounded-full">Most Popular</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="font-semibold text-ink text-sm">{pkg.name}</p>
          {pkg.description && <p className="text-ink-400 text-xs mt-1 leading-relaxed">{pkg.description}</p>}
        </div>
        <div className="text-right flex-shrink-0">
          <p className="font-bold text-ink text-lg leading-none">${pkg.price}</p>
          <p className="text-ink-300 text-[10px] mt-0.5">/{pkg.billingType === 'hourly' ? 'hr' : 'session'}</p>
        </div>
      </div>
      {pkg.deliverables?.length > 0 && (
        <ul className="space-y-1.5 mb-4">
          {pkg.deliverables.map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-ink-500">
              <CheckCircle2 className="w-3.5 h-3.5 text-ink mt-0.5 flex-shrink-0" />
              {d}
            </li>
          ))}
        </ul>
      )}
      {/* Disabled in preview */}
      <button disabled className="w-full border border-ink-200 text-ink font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs opacity-40 cursor-not-allowed">
        Enquire about this package
      </button>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-ink-50 last:border-0">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none gap-3">
        <span className="font-medium text-ink text-sm">{q}</span>
        <ChevronDown className="w-4 h-4 text-ink-300 flex-shrink-0 group-open:rotate-180 transition-transform" />
      </summary>
      <p className="text-ink-400 text-sm leading-relaxed pb-4">{a}</p>
    </details>
  )
}

function AvailabilityStrip({ availability }: { availability: { date: string; status: string }[] }) {
  const statusMap: Record<string, string> = {}
  for (const d of availability) statusMap[d.date] = d.status

  const days: { date: string; label: string; day: string; status: string }[] = []
  for (let i = 0; i < 14; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    days.push({
      date: key,
      label: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      day: d.toLocaleDateString('en-CA', { weekday: 'short' }),
      status: statusMap[key] ?? 'unknown',
    })
  }

  const color = (s: string) => {
    if (s === 'available') return 'bg-emerald-100 text-emerald-700 border-emerald-200'
    if (s === 'busy') return 'bg-red-50 text-red-400 border-red-100'
    if (s === 'tentative') return 'bg-amber-50 text-amber-600 border-amber-100'
    return 'bg-ink-50 text-ink-300 border-ink-100'
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map(d => (
        <div key={d.date} className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center ${color(d.status)}`}>
          <span className="text-[9px] font-semibold uppercase">{d.day}</span>
          <span className="text-[11px] font-bold mt-0.5">{d.label.split(' ')[1]}</span>
          <span className="text-[8px] mt-0.5 font-medium">
            {d.status === 'available' ? '✓' : d.status === 'busy' ? '✗' : d.status === 'tentative' ? '~' : '?'}
          </span>
        </div>
      ))}
    </div>
  )
}

export default function YourProfilePreviewPage() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/photographer/preview')
      .then(r => r.ok ? r.json() : null)
      .then(data => setProfile(data))
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <svg className="w-6 h-6 animate-spin text-ink-300" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center flex-col gap-4">
        <p className="text-ink-400 text-sm">Could not load profile.</p>
        <Link href="/dashboard/photographer" className="text-sm text-ink underline">Back to dashboard</Link>
      </div>
    )
  }

  const p = profile
  const hasPortfolio = p.standalone_photos.length > 0 || p.standalone_videos.length > 0 || p.portfolio_albums.length > 0

  const completenessItems = [
    { label: 'Bio', done: p.bio.trim().length > 0 },
    { label: 'Rate', done: !!p.rate_display },
    { label: 'Specialties', done: p.specialties.length > 0 },
    { label: 'Portfolio', done: hasPortfolio },
  ]
  const completePct = Math.round((completenessItems.filter(i => i.done).length / completenessItems.length) * 100)
  const isIncomplete = completePct < 100

  const trustSources = Object.entries(p.links)
    .filter(([, info]) => info.rating != null)
    .map(([platform, info]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      score: String(info.rating),
      count: `${info.count}`,
      bar: Math.round((Number(info.rating) / 5) * 100),
      url: info.url,
    }))

  const hasPackages = p.packages.length > 0
  const hasFaqs = p.faqs.length > 0
  const reviewList = p.native_reviews ?? []
  const hasReviews = reviewList.length > 0
  const liveReviewCount = reviewList.length
  const liveAvgRating = hasReviews
    ? Math.round((reviewList.reduce((s, r) => s + r.rating, 0) / reviewList.length) * 10) / 10
    : 0
  const hasAvailability = p.availability.length > 0

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 bg-ink text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 min-w-0">
            <Eye className="w-4 h-4 text-white/60 flex-shrink-0" />
            <p className="text-sm font-medium truncate">
              <span className="text-white/60 hidden sm:inline">Profile preview — </span>
              <span className="text-white/60 sm:hidden">Preview</span>
              <span className="hidden sm:inline">Client view</span>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/dashboard/photographer?tab=settings"
              className="flex items-center gap-1.5 text-xs font-semibold bg-white text-ink px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors">
              <Pencil className="w-3.5 h-3.5" /><span className="hidden sm:inline">Edit profile</span><span className="sm:hidden">Edit</span>
            </Link>
            <Link href="/dashboard/photographer"
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /><span className="hidden sm:inline">Dashboard</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Incompleteness nudge */}
      {isIncomplete && (
        <div className="bg-amber-50 border-b border-amber-100">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700 flex-1">
              Your profile is <strong>{completePct}% complete.</strong> Missing: {completenessItems.filter(i => !i.done).map(i => i.label).join(', ')}.
            </p>
            <Link href="/dashboard/photographer/edit" className="text-xs font-semibold text-amber-700 underline underline-offset-2 flex-shrink-0">
              Complete now
            </Link>
          </div>
        </div>
      )}

      {/* Cover */}
      <div className="relative h-64 sm:h-80 bg-ink-800 overflow-hidden">
        {p.cover_image_url ? (
          <img src={p.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      </div>

      {/* Profile header */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Avatar + available badge */}
          <div className="flex items-end gap-4 -mt-10 pb-4 relative z-10">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-white flex-shrink-0 bg-ink"
              style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
              {p.avatar_url ? (
                <img src={p.avatar_url} alt={p.display_name} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                  {initials(p.display_name || 'P')}
                </div>
              )}
            </div>
          </div>

          {/* Name row */}
          <div className="pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">{p.display_name || 'Your name'}</h1>
                </div>
                {p.tagline && <p className="text-ink-400 text-sm mt-0.5">{p.tagline}</p>}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {p.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-ink-300" />
                      <span className="text-ink-300 text-xs">{p.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Award className="w-3 h-3 text-ink-300" />
                    <span className="text-ink-300 text-xs">Member since {formatDate(p.member_since)}</span>
                  </div>
                  {p.rate_display && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-ink-400" />
                      <span className="text-ink-500 text-xs font-semibold">{p.rate_display}</span>
                    </div>
                  )}
                  {hasReviews && <StarRow rating={liveAvgRating} count={liveReviewCount} />}
                </div>
              </div>
              {/* Disabled in preview mode */}
              <button disabled className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-5 py-2.5 rounded-xl text-sm opacity-40 cursor-not-allowed flex-shrink-0" title="Disabled in preview mode">
                Message
              </button>
            </div>
            {p.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3">
                {p.specialties.map(s => (
                  <span key={s} className="bg-ink text-white text-[10px] font-semibold px-2.5 py-1 rounded-full">{s}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ──────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* About */}
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <h2 className="font-semibold text-ink text-base mb-3">About</h2>
              {p.bio ? (
                <div className="text-ink-500 text-sm leading-relaxed space-y-3">
                  {p.bio.trim().split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
                </div>
              ) : (
                <p className="text-ink-200 text-sm italic">
                  No bio yet.{' '}
                  <Link href="/dashboard/photographer?tab=settings" className="text-ink underline">Add one</Link>
                </p>
              )}
            </div>

            {/* Portfolio */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between gap-2 px-6 pt-6 pb-4">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-ink-400" />
                  <h2 className="font-semibold text-ink text-base">Portfolio</h2>
                  {hasPortfolio && (
                    <span className="text-ink-300 text-xs font-normal">
                      ({p.standalone_photos.length + p.standalone_videos.length} posts · {p.portfolio_albums.length} albums)
                    </span>
                  )}
                </div>
                <Link href="/dashboard/photographer?tab=portfolio"
                  className="text-xs text-ink-400 hover:text-ink border border-ink-100 px-2.5 py-1 rounded-lg transition-colors">
                  Edit
                </Link>
              </div>
              <div className="px-6 pb-6">
                <PortfolioPreview profile={p} />
              </div>
            </div>

            {/* Packages */}
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center gap-2 mb-5">
                <Package className="w-4 h-4 text-ink-400" />
                <h2 className="font-semibold text-ink text-base">Packages</h2>
              </div>
              {hasPackages ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {p.packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                </div>
              ) : (
                <div className="border-2 border-dashed border-ink-100 rounded-xl p-8 text-center">
                  <Package className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-ink-400 text-sm font-medium">No packages yet</p>
                  <Link href="/dashboard/photographer?tab=packages" className="text-xs text-ink underline mt-1 inline-block">Add a package</Link>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-ink text-base">Reviews</h2>
                  {hasReviews && <span className="text-ink-300 text-sm font-normal">({liveReviewCount})</span>}
                </div>
                {hasReviews && <StarRow rating={liveAvgRating} count={liveReviewCount} />}
              </div>
              {hasReviews ? (
                <div className="space-y-3">
                  {p.native_reviews.map(r => <ReviewCard key={r.id} r={r} />)}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                  <Star className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-ink-400 text-sm font-medium">No reviews yet</p>
                  <p className="text-ink-300 text-xs mt-1">Reviews from booked sessions will appear here.</p>
                </div>
              )}
            </div>

            {/* FAQs */}
            <div className="bg-white rounded-2xl px-6 py-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <h2 className="font-semibold text-ink text-base mb-2">FAQ</h2>
              {hasFaqs ? (
                p.faqs.map(f => <FaqItem key={f.id} q={f.question} a={f.answer} />)
              ) : (
                <div className="py-6 text-center">
                  <p className="text-ink-400 text-sm font-medium">No FAQs yet</p>
                  <p className="text-ink-300 text-xs mt-1">
                    <Link href="/dashboard/photographer?tab=faq" className="text-ink underline">Add common questions</Link> clients might ask.
                  </p>
                </div>
              )}
            </div>

            {/* Availability */}
            {hasAvailability && (
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-ink-400" />
                  <h2 className="font-semibold text-ink text-base">Availability</h2>
                </div>
                <AvailabilityStrip availability={p.availability} />
                <div className="flex items-center gap-4 mt-4 text-[10px] text-ink-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Available</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Tentative</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" /> Busy</span>
                </div>
                <div className="mt-5 pt-4 border-t border-ink-50">
                  <button disabled className="w-full bg-ink hover:bg-ink-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm opacity-40 cursor-not-allowed">
                    Request a booking
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right sidebar ────────────────────────────────────────── */}
          <div className="space-y-4">

            {/* Book CTA — disabled in preview */}
            <div className="bg-ink rounded-2xl p-5 text-white">
              <p className="font-semibold text-base mb-1">Book {p.display_name.split(' ')[0] || 'me'}</p>
              {p.rate_display ? (
                <div className="mb-4">
                  <p className="text-white/60 text-[10px] uppercase tracking-wide mb-0.5">Starting from</p>
                  <p className="font-bold text-white text-xl leading-none">{p.rate_display}</p>
                  {p.rate_note && <p className="text-white/50 text-xs mt-1">{p.rate_note}</p>}
                </div>
              ) : (
                <Link href="/dashboard/photographer/edit#rate" className="flex items-center gap-1.5 mb-4 text-white/50 hover:text-white/80 text-xs transition-colors">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span className="underline underline-offset-2">Add your rate</span>
                </Link>
              )}
              <button disabled className="w-full bg-white hover:bg-ink-50 text-ink font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm opacity-40 cursor-not-allowed" title="Disabled in preview mode">
                Send a message
              </button>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <h3 className="font-semibold text-ink text-sm mb-4">At a glance</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Reviews', value: String(liveReviewCount), icon: Star },
                  { label: 'Specialties', value: String(p.specialties.length), icon: Camera },
                  { label: 'Trust score', value: Number(p.trust_score) > 0 ? Number(p.trust_score).toFixed(1) : '—', icon: Shield },
                  { label: 'Profile views', value: String(p.profile_view_count), icon: Award },
                ].map(stat => {
                  const Icon = stat.icon
                  return (
                    <div key={stat.label} className="bg-ink-50 rounded-xl p-3 text-center">
                      <Icon className="w-4 h-4 text-ink-400 mx-auto mb-1" />
                      <p className="font-bold text-ink text-base leading-none">{stat.value}</p>
                      <p className="text-ink-300 text-[10px] mt-0.5">{stat.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Links — contact socials as icons */}
            {(p.contact_instagram_url || p.contact_facebook_url || p.website_url) && (
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <p className="text-xs font-semibold text-ink mb-3">Links</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {p.contact_instagram_url && (
                    <a
                      href={`https://instagram.com/${p.contact_instagram_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`@${p.contact_instagram_url} on Instagram`}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <Instagram className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {p.contact_facebook_url && (
                    <a
                      href={`https://facebook.com/${p.contact_facebook_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${p.contact_facebook_url} on Facebook`}
                      className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <Facebook className="w-4 h-4 text-white" />
                    </a>
                  )}
                  {p.website_url && (
                    <a
                      href={/^https?:\/\//.test(p.website_url) ? p.website_url : `https://${p.website_url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={p.website_url.replace(/^https?:\/\//, '')}
                      className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center hover:opacity-80 transition-opacity"
                    >
                      <Globe className="w-4 h-4 text-white" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Trust score breakdown */}
            {trustSources.length > 0 && (
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-ink text-sm">Trust score</h3>
                  <div className="flex items-center gap-1.5 bg-ink rounded-full px-2.5 py-1">
                    <Shield className="w-3 h-3 text-white" />
                    <span className="text-white text-xs font-bold">{Number(p.trust_score).toFixed(1)}</span>
                  </div>
                </div>
                <div className="space-y-3.5">
                  {trustSources.map(s => (
                    <div key={s.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-ink-500 text-xs">{s.name}</span>
                          <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-ink-200 hover:text-ink transition-colors">
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        </div>
                        <div className="text-right">
                          <span className="text-ink font-semibold text-xs">{s.score}</span>
                          <span className="text-ink-300 text-[10px] ml-1">({s.count})</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-ink-50 rounded-full overflow-hidden">
                        <div className="h-full bg-ink rounded-full" style={{ width: `${s.bar}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Packages summary in sidebar */}
            {hasPackages && (
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <p className="text-xs font-semibold text-ink mb-3">Packages</p>
                <div className="space-y-2">
                  {p.packages.map(pkg => (
                    <div key={pkg.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        {pkg.isPopular && <span className="text-[8px] font-bold bg-ink text-white px-1.5 py-0.5 rounded-full flex-shrink-0">Popular</span>}
                        <span className="text-xs text-ink-500 truncate">{pkg.name}</span>
                      </div>
                      <span className="text-xs font-bold text-ink flex-shrink-0 ml-2">${pkg.price}<span className="text-ink-300 font-normal text-[10px]">/{pkg.billingType === 'hourly' ? 'hr' : 'session'}</span></span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Edit nudge */}
            <div className="bg-white rounded-2xl p-4 border border-ink-100">
              <p className="text-xs font-semibold text-ink mb-2">Improve your profile</p>
              <div className="space-y-2">
                {[
                  { label: 'Add portfolio photos', href: '/dashboard/photographer?tab=portfolio' },
                  { label: 'Link your Google reviews', href: '/dashboard/photographer?tab=trust' },
                  { label: 'Write a longer bio', href: '/dashboard/photographer?tab=settings' },
                  { label: 'Add packages', href: '/dashboard/photographer?tab=packages' },
                ].map(item => (
                  <Link key={item.label} href={item.href} className="flex items-center gap-2 text-xs text-ink-500 hover:text-ink transition-colors group">
                    <ExternalLink className="w-3.5 h-3.5 text-ink-300 group-hover:text-ink transition-colors" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
