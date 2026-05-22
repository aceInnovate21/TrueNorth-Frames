'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  ArrowLeft, Star, MapPin, Shield, Camera, CheckCircle2,
  Globe, Instagram, ExternalLink, Award, Calendar, DollarSign,
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
  specialties: string[]
  links: Record<string, { url: string; rating: number | null; count: number | null }>
  native_reviews: { id: string; rating: number; body: string; created_at: string; reviewer_name: string }[]
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
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ photos: { id: string; src: string; caption: string }[]; idx: number } | null>(null)
  const [activeVideo, setActiveVideo] = useState<{ src: string; title: string } | null>(null)

  const albums = profile.portfolio_albums
  const allPhotos = profile.portfolio_photos
  const allVideos = profile.portfolio_videos
  const standalonePhotos = profile.standalone_photos
  const standaloneVideos = profile.standalone_videos

  const openAlbum = openAlbumId ? albums.find(a => a.id === openAlbumId) ?? null : null
  const albumPhotos = openAlbumId ? allPhotos.filter(p => p.album_id === openAlbumId) : []
  const albumVideos = openAlbumId ? allVideos.filter(v => v.album_id === openAlbumId) : []
  const isEmpty = standalonePhotos.length === 0 && standaloneVideos.length === 0 && albums.length === 0

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
    <div>
      {openAlbum ? (
        /* ── Album drill-down ── */
        <div>
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-ink-100">
            <button type="button" onClick={() => setOpenAlbumId(null)}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink transition-colors font-medium">
              <ChevronLeft className="w-4 h-4" /> Portfolio
            </button>
            <span className="text-ink-200">/</span>
            <span className="text-sm font-semibold text-ink">{openAlbum.title}</span>
            <span className="text-xs text-ink-300">({albumPhotos.length + albumVideos.length} items)</span>
          </div>

          {albumPhotos.length === 0 && albumVideos.length === 0 ? (
            <div className="py-12 text-center">
              <Camera className="w-8 h-8 text-ink-200 mx-auto mb-2" />
              <p className="text-ink-400 text-sm">This album is empty</p>
              <Link href="/dashboard/photographer?tab=portfolio" className="text-xs text-ink underline mt-1 inline-block">Add photos</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {albumPhotos.length > 0 && (
                <div className="columns-2 sm:columns-3" style={{ columnGap: '6px' }}>
                  {albumPhotos.map((ph, idx) => (
                    <button key={ph.id} type="button" onClick={() => setLightbox({ photos: albumPhotos, idx })}
                      className="relative w-full break-inside-avoid rounded-xl overflow-hidden bg-ink-100 group block cursor-pointer"
                      style={{ marginBottom: '6px' }}>
                      <img src={ph.src} alt={ph.caption || ''} className="w-full h-auto block" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 pointer-events-none" />
                      {ph.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                          <p className="text-white text-[10px] font-medium line-clamp-2">{ph.caption}</p>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}
              {albumVideos.length > 0 && (
                <>
                  {albumPhotos.length > 0 && <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide">Videos</p>}
                  <div className="grid grid-cols-2 gap-3">
                    {albumVideos.map(vid => (
                      <button key={vid.id} type="button" onClick={() => setActiveVideo({ src: vid.src, title: vid.title })}
                        className="relative rounded-xl overflow-hidden bg-ink-900 group aspect-video block w-full cursor-pointer">
                        {vid.src && <video src={vid.src} className="w-full h-full object-cover" muted preload="metadata" />}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors pointer-events-none">
                          <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                            <svg className="w-4 h-4 text-ink ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        </div>
                        {vid.title && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
                            <p className="text-white text-[10px] font-medium line-clamp-1">{vid.title}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        /* ── Top-level: albums + standalone photos + standalone videos ── */
        <div className="space-y-6">
          {albums.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide mb-2">Albums</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {albums.map(album => {
                  const srcs = album.collage_srcs?.length ? album.collage_srcs : album.cover_src ? [album.cover_src] : []
                  const total = album.photo_count + album.video_count
                  return (
                    <button key={album.id} type="button" onClick={() => setOpenAlbumId(album.id)}
                      className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group cursor-pointer block w-full">
                      {srcs.length >= 4 ? (
                        <div className="grid grid-cols-2 gap-0.5 w-full h-full">
                          {srcs.slice(0, 4).map((s, i) => (
                            <div key={i} className="overflow-hidden">
                              <img src={s} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                          ))}
                        </div>
                      ) : srcs[0] ? (
                        <img src={srcs[0]} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-ink-100">
                          <Camera className="w-8 h-8 text-ink-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 pointer-events-none">
                        <p className="text-white text-xs font-semibold leading-tight truncate">{album.title}</p>
                        <p className="text-white/60 text-[10px] mt-0.5">{total} item{total !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                          <Layers className="w-2.5 h-2.5 text-white" />
                          <span className="text-white text-[9px] font-semibold">{total}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {standalonePhotos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide mb-2">Photos</p>
              <div className="columns-2 sm:columns-3" style={{ columnGap: '6px' }}>
                {standalonePhotos.map((ph, idx) => (
                  <button key={ph.id} type="button" onClick={() => setLightbox({ photos: standalonePhotos, idx })}
                    className="relative w-full break-inside-avoid rounded-xl overflow-hidden bg-ink-100 group block cursor-pointer"
                    style={{ marginBottom: '6px' }}>
                    <img src={ph.src} alt={ph.caption || ''} className="w-full h-auto block" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 pointer-events-none" />
                    {ph.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
                        <p className="text-white text-[10px] font-medium line-clamp-2">{ph.caption}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {standaloneVideos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide mb-2">Videos</p>
              <div className="grid grid-cols-2 gap-3">
                {standaloneVideos.map(vid => (
                  <button key={vid.id} type="button" onClick={() => setActiveVideo({ src: vid.src, title: vid.title })}
                    className="relative rounded-xl overflow-hidden bg-ink-900 group aspect-video block w-full cursor-pointer">
                    {vid.src && <video src={vid.src} className="w-full h-full object-cover" muted preload="metadata" />}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors pointer-events-none">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 text-ink ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                      </div>
                    </div>
                    {vid.title && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 pointer-events-none">
                        <p className="text-white text-[10px] font-medium line-clamp-1">{vid.title}</p>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {lightbox && <Lightbox photos={lightbox.photos} startIdx={lightbox.idx} onClose={() => setLightbox(null)} />}
      {activeVideo && <VideoModal src={activeVideo.src} title={activeVideo.title} onClose={() => setActiveVideo(null)} />}
    </div>
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

function ReviewCard({ r }: { r: ProfileData['native_reviews'][0] }) {
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
      <p className="text-ink-500 text-sm leading-relaxed">{r.body}</p>
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
  const hasReviews = p.native_review_count > 0
  const hasAvailability = p.availability.length > 0

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Preview banner */}
      <div className="sticky top-0 z-50 bg-ink text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-white/60" />
            <p className="text-sm font-medium">
              <span className="text-white/60">Profile preview —</span> this is how clients see your profile
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/photographer/edit"
              className="flex items-center gap-1.5 text-xs font-semibold bg-white text-ink px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors">
              <Pencil className="w-3.5 h-3.5" /> Edit profile
            </Link>
            <Link href="/dashboard/photographer"
              className="flex items-center gap-1.5 text-xs text-white/70 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
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
          <Image src={p.cover_image_url} alt="" fill className="object-cover" priority sizes="100vw" />
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
                <Image src={p.avatar_url} alt={p.display_name} width={96} height={96} className="object-cover w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                  {initials(p.display_name || 'P')}
                </div>
              )}
            </div>
            <div className="mb-1 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-100">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-600">Available</span>
            </div>
          </div>

          {/* Name row */}
          <div className="pb-5">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">{p.display_name || 'Your name'}</h1>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {p.instagram_url && (
                      <span className="w-6 h-6 rounded-md bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center" title="Instagram">
                        <Instagram className="w-3 h-3 text-white" />
                      </span>
                    )}
                    {p.links?.google?.url && (
                      <span className="w-6 h-6 rounded-md bg-white border border-ink-100 flex items-center justify-center" title="Google Reviews">
                        <span className="text-[9px] font-black text-blue-500 leading-none">G</span>
                      </span>
                    )}
                    {p.website_url && (
                      <span className="w-6 h-6 rounded-md bg-ink-100 flex items-center justify-center" title="Website">
                        <Globe className="w-3 h-3 text-ink-500" />
                      </span>
                    )}
                  </div>
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
                  {hasReviews && <StarRow rating={p.native_avg_rating} count={p.native_review_count} />}
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
                  <Link href="/dashboard/photographer/edit#bio" className="text-ink underline">Add one</Link>
                </p>
              )}
            </div>

            {/* Portfolio */}
            <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <div className="flex items-center justify-between gap-2 mb-4">
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
              <PortfolioPreview profile={p} />
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
                  <Link href="/dashboard/photographer/edit#packages" className="text-xs text-ink underline mt-1 inline-block">Add a package</Link>
                </div>
              )}
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-ink text-base">Reviews</h2>
                  {hasReviews && <span className="text-ink-300 text-sm font-normal">({p.native_review_count})</span>}
                </div>
                {hasReviews && <StarRow rating={p.native_avg_rating} count={p.native_review_count} />}
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
                    <Link href="/dashboard/photographer/edit#faqs" className="text-ink underline">Add common questions</Link> clients might ask.
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
                  { label: 'Reviews', value: String(p.native_review_count), icon: Star },
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

            {/* Social & Reviews */}
            {(p.instagram_url || p.website_url || p.links?.google?.url || p.links?.yelp?.url) && (
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <p className="text-xs font-semibold text-ink mb-3">Social &amp; Reviews</p>
                <div className="space-y-2">
                  {p.instagram_url && (
                    <a href={p.instagram_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50 border border-pink-100 hover:border-pink-300 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Instagram className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-ink-400 leading-none mb-0.5">Instagram</p>
                        <p className="text-xs font-semibold text-ink truncate">
                          @{p.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/\/$/, '') || p.instagram_url.replace(/^https?:\/\//, '')}
                        </p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-ink-300 group-hover:text-ink-500 transition-colors flex-shrink-0" />
                    </a>
                  )}
                  {p.links?.google?.url && (
                    <a href={p.links.google.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-black text-blue-500 leading-none">G</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-ink-400 leading-none mb-0.5">Google Reviews</p>
                        {p.links.google.rating != null ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-ink">{Number(p.links.google.rating).toFixed(1)}</span>
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                            {p.links.google.count && <span className="text-ink-300 text-[10px]">({p.links.google.count} reviews)</span>}
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-ink">View reviews</p>
                        )}
                      </div>
                      <ExternalLink className="w-3 h-3 text-ink-300 group-hover:text-ink-500 transition-colors flex-shrink-0" />
                    </a>
                  )}
                  {p.links?.yelp?.url && (
                    <a href={p.links.yelp.url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50 border border-red-100 hover:border-red-300 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-black text-white leading-none">★</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-ink-400 leading-none mb-0.5">Yelp</p>
                        {p.links.yelp.rating != null ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-ink">{Number(p.links.yelp.rating).toFixed(1)}</span>
                            <Star className="w-3 h-3 text-red-400 fill-red-400" />
                            {p.links.yelp.count && <span className="text-ink-300 text-[10px]">({p.links.yelp.count} reviews)</span>}
                          </div>
                        ) : (
                          <p className="text-xs font-semibold text-ink">View reviews</p>
                        )}
                      </div>
                      <ExternalLink className="w-3 h-3 text-ink-300 group-hover:text-ink-500 transition-colors flex-shrink-0" />
                    </a>
                  )}
                  {p.website_url && (
                    <a href={p.website_url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-ink-50 border border-ink-100 hover:border-ink-300 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] text-ink-400 leading-none mb-0.5">Website</p>
                        <p className="text-xs font-semibold text-ink truncate">{p.website_url.replace(/^https?:\/\//, '')}</p>
                      </div>
                      <ExternalLink className="w-3 h-3 text-ink-300 group-hover:text-ink-500 transition-colors flex-shrink-0" />
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
                  { label: 'Add portfolio photos', href: '/dashboard/photographer/portfolio' },
                  { label: 'Link your Google reviews', href: '/dashboard/photographer/edit#links' },
                  { label: 'Write a longer bio', href: '/dashboard/photographer/edit#bio' },
                  { label: 'Add packages', href: '/dashboard/photographer/edit#packages' },
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
