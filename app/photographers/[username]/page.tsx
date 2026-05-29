'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  ArrowLeft, Star, MapPin, Shield, Camera, CheckCircle2,
  Globe, Instagram, ExternalLink, Award, Calendar, DollarSign,
  ChevronDown, Package, Eye, X, ChevronLeft, ChevronRight, Layers,
  Facebook, Users, TrendingUp, BadgeCheck,
} from 'lucide-react'

// ─── Portfolio lightbox + masonry grid ────────────────────────────────────────

interface PortfolioPhoto { id: string; album_id: string; src: string; caption: string }
interface PortfolioVideo { id: string; album_id: string; src: string; title: string; duration_seconds: number | null }
interface PortfolioAlbum { id: string; title: string; photo_count: number; video_count: number; cover_src: string; collage_srcs: string[] }
interface StandalonePhoto { id: string; src: string; caption: string }
interface StandaloneVideo { id: string; src: string; title: string; duration_seconds: number | null }

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
        <div className="relative w-full h-full flex items-center justify-center">
          <img src={ph.src} alt={ph.caption || ''} className="max-w-full max-h-full object-contain rounded-lg" style={{ maxHeight: 'calc(100vh - 140px)' }} />
        </div>
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)}
            className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors ml-1">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {idx < photos.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)}
            className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center transition-colors mr-1">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>

      <div className="flex-shrink-0 pb-4" onClick={e => e.stopPropagation()}>
        {ph.caption && (
          <p className="text-white/70 text-sm text-center px-6 py-2 leading-relaxed">{ph.caption}</p>
        )}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-4 mt-1 overflow-x-auto scrollbar-none">
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

// Video player modal
function VideoModal({ video, onClose }: { video: PortfolioVideo; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          {video.title ? <p className="text-white text-sm font-medium">{video.title}</p> : <span />}
          <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors ml-auto">
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        {video.src ? (
          <video
            src={video.src}
            controls
            autoPlay
            className="w-full rounded-2xl bg-black"
            style={{ maxHeight: 'calc(100vh - 120px)' }}
          />
        ) : (
          <div className="w-full aspect-video rounded-2xl bg-ink-900 flex items-center justify-center">
            <p className="text-white/40 text-sm">Video unavailable</p>
          </div>
        )}
      </div>
    </div>
  )
}

// Three-section public portfolio: standalone photos, standalone videos, albums
// Albums open inline — click tile → full masonry inside
function PortfolioGrid({
  standalonePhotos,
  standaloneVideos,
  albums,
  allPhotos,
  allVideos,
}: {
  standalonePhotos: StandalonePhoto[]
  standaloneVideos: StandaloneVideo[]
  albums: PortfolioAlbum[]
  allPhotos: PortfolioPhoto[]
  allVideos: PortfolioVideo[]
}) {
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<{ photos: { id: string; src: string; caption: string }[]; idx: number } | null>(null)
  const [activeVideo, setActiveVideo] = useState<{ src: string; title: string } | null>(null)

  const openAlbum = openAlbumId ? albums.find(a => a.id === openAlbumId) ?? null : null
  const albumPhotos = openAlbumId ? allPhotos.filter(p => p.album_id === openAlbumId) : []
  const albumVideos = openAlbumId ? allVideos.filter(v => v.album_id === openAlbumId) : []
  const isEmpty = standalonePhotos.length === 0 && standaloneVideos.length === 0 && albums.length === 0

  // Shared photo item
  function PhotoItem({ ph, idx, photosForLightbox }: { ph: { id: string; src: string; caption: string }; idx: number; photosForLightbox: { id: string; src: string; caption: string }[] }) {
    return (
      <button
        key={ph.id}
        type="button"
        onClick={() => setLightbox({ photos: photosForLightbox, idx })}
        className="relative w-full break-inside-avoid rounded-xl overflow-hidden bg-ink-100 group block cursor-pointer"
        style={{ marginBottom: '6px' }}
      >
        <img src={ph.src} alt={ph.caption || ''} className="w-full h-auto block" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 pointer-events-none" />
        {ph.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-300 pointer-events-none">
            <p className="text-white text-[10px] font-medium line-clamp-2">{ph.caption}</p>
          </div>
        )}
      </button>
    )
  }

  // Shared video item
  function VideoItem({ vid }: { vid: { id: string; src: string; title: string } }) {
    return (
      <button
        type="button"
        onClick={() => setActiveVideo({ src: vid.src, title: vid.title })}
        className="relative rounded-xl overflow-hidden bg-ink-900 group aspect-video block w-full cursor-pointer"
      >
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
    )
  }

  return (
    <div>
      {/* ── Album open view (inline drill-down) ── */}
      {openAlbum ? (
        <div>
          {/* Sticky breadcrumb */}
          <div className="flex items-center gap-2 mb-5 pb-3 border-b border-ink-100">
            <button
              type="button"
              onClick={() => setOpenAlbumId(null)}
              className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink transition-colors font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              Portfolio
            </button>
            <span className="text-ink-200">/</span>
            <span className="text-sm font-semibold text-ink">{openAlbum.title}</span>
            <span className="text-xs text-ink-300">({albumPhotos.length + albumVideos.length} items)</span>
          </div>

          {albumPhotos.length === 0 && albumVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Camera className="w-8 h-8 text-ink-200 mb-3" />
              <p className="text-ink-400 text-sm">This album is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {albumPhotos.length > 0 && (
                <div className="columns-2 sm:columns-3" style={{ columnGap: '6px' }}>
                  {albumPhotos.map((ph, idx) => (
                    <PhotoItem key={ph.id} ph={ph} idx={idx} photosForLightbox={albumPhotos} />
                  ))}
                </div>
              )}
              {albumVideos.length > 0 && (
                <>
                  {albumPhotos.length > 0 && <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide">Videos</p>}
                  <div className="grid grid-cols-2 gap-3">
                    {albumVideos.map(vid => (
                      <VideoItem key={vid.id} vid={vid} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      ) : isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Camera className="w-10 h-10 text-ink-200 mb-3" />
          <p className="text-ink-400 text-sm font-medium">No portfolio items yet</p>
        </div>

      ) : (
        /* ── Top-level feed: albums + standalone photos + standalone videos ── */
        <div className="space-y-8">

          {/* Albums grid — 2-column, square tiles with 2×2 collage */}
          {albums.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide mb-3">Albums</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {albums.map(album => {
                  const srcs = (album.collage_srcs?.length ? album.collage_srcs : album.cover_src ? [album.cover_src] : [])
                  const totalCount = album.photo_count + album.video_count
                  return (
                    <button
                      key={album.id}
                      type="button"
                      onClick={() => setOpenAlbumId(album.id)}
                      className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group cursor-pointer block w-full"
                    >
                      {/* Cover: 2×2 collage if 4+ srcs, else single image */}
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
                      {/* Gradient + info overlay — pointer-events-none so button gets the click */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                      <div className="absolute bottom-0 left-0 right-0 p-2.5 pointer-events-none">
                        <p className="text-white text-xs font-semibold leading-tight truncate">{album.title}</p>
                        <p className="text-white/60 text-[10px] mt-0.5">{totalCount} item{totalCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="absolute top-2 right-2 pointer-events-none">
                        <div className="flex items-center gap-1 bg-black/50 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                          <Layers className="w-2.5 h-2.5 text-white" />
                          <span className="text-white text-[9px] font-semibold">{totalCount}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Standalone photos masonry */}
          {standalonePhotos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide mb-3">Photos</p>
              <div className="columns-2 sm:columns-3" style={{ columnGap: '6px' }}>
                {standalonePhotos.map((ph, idx) => (
                  <PhotoItem key={ph.id} ph={ph} idx={idx} photosForLightbox={standalonePhotos} />
                ))}
              </div>
            </div>
          )}

          {/* Standalone videos */}
          {standaloneVideos.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide mb-3">Videos</p>
              <div className="grid grid-cols-2 gap-3">
                {standaloneVideos.map(vid => (
                  <VideoItem key={vid.id} vid={vid} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {lightbox && (
        <Lightbox photos={lightbox.photos} startIdx={lightbox.idx} onClose={() => setLightbox(null)} />
      )}
      {activeVideo && (
        <VideoModal video={{ id: '', album_id: '', ...activeVideo, duration_seconds: null }} onClose={() => setActiveVideo(null)} />
      )}
    </div>
  )
}

import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { ContactModal } from '@/components/contact-modal'
import { SaveButton } from '@/components/save-button'

// ─── Portfolio preview card (extracted to avoid hooks-in-IIFE violation) ─────

function PortfolioPreview({
  standalonePhotos,
  standaloneVideos,
  portfolioAlbums,
  portfolioPhotos,
  portfolioVideos,
}: {
  standalonePhotos: StandalonePhoto[]
  standaloneVideos: StandaloneVideo[]
  portfolioAlbums: PortfolioAlbum[]
  portfolioPhotos: PortfolioPhoto[]
  portfolioVideos: PortfolioVideo[]
}) {
  const [portfolioExpanded, setPortfolioExpanded] = useState(false)
  const [openAlbum, setOpenAlbum] = useState<{ album: PortfolioAlbum; slideIdx: number } | null>(null)
  const slideRef = useRef<HTMLDivElement>(null)

  const postCount  = standalonePhotos.length + standaloneVideos.length
  const albumCount = portfolioAlbums.length

  const albumSlides = openAlbum
    ? [
        ...portfolioPhotos.filter(p => p.album_id === openAlbum.album.id),
        ...portfolioVideos.filter(v => v.album_id === openAlbum.album.id),
      ]
    : []

  function goSlide(dir: 1 | -1) {
    if (!openAlbum) return
    const next = Math.max(0, Math.min(albumSlides.length - 1, openAlbum.slideIdx + dir))
    setOpenAlbum({ ...openAlbum, slideIdx: next })
    slideRef.current?.children[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' })
  }

  useEffect(() => {
    if (!portfolioExpanded) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpenAlbum(null); setPortfolioExpanded(false) }
      if (openAlbum) {
        if (e.key === 'ArrowRight') goSlide(1)
        if (e.key === 'ArrowLeft')  goSlide(-1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [portfolioExpanded, openAlbum, albumSlides.length])

  const masonryItems = [
    ...portfolioAlbums.map(a  => ({ type: 'album' as const, id: a.id,  src: a.cover_src || (a.collage_srcs?.[0] ?? ''), label: a.title,   album: a       })),
    ...standalonePhotos.map(ph => ({ type: 'photo' as const, id: ph.id, src: ph.src,                                       label: ph.caption, album: null as any })),
    ...standaloneVideos.map(v  => ({ type: 'video' as const, id: v.id,  src: v.src,                                        label: v.title,    album: null as any })),
  ]

  function MasonryGrid({ clickable }: { clickable: boolean }) {
    return (
      <div className="columns-2 sm:columns-3" style={{ columnGap: '6px' }}>
        {masonryItems.map(item => (
          <div key={item.id} className="break-inside-avoid mb-1.5 relative rounded-xl overflow-hidden bg-ink-100 group cursor-pointer"
            onClick={() => { if (clickable) setPortfolioExpanded(true) }}>
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
      <div className="w-full mb-1" onClick={e => e.stopPropagation()}>
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

  return (
    <>
      {/* Card: scrollable masonry preview */}
      <section className="bg-white rounded-2xl border border-ink-50 overflow-hidden" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-ink-400" />
            <h2 className="font-semibold text-ink text-base">Portfolio</h2>
            <span className="text-ink-300 text-xs">
              {postCount > 0 ? `${postCount} post${postCount !== 1 ? 's' : ''}` : ''}
              {albumCount > 0 ? `${postCount > 0 ? ' · ' : ''}${albumCount} album${albumCount !== 1 ? 's' : ''}` : ''}
            </span>
          </div>
          <button onClick={() => setPortfolioExpanded(true)} className="text-xs font-medium text-ink-400 hover:text-ink transition-colors flex items-center gap-1">
            Expand <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-5 cursor-pointer" style={{ maxHeight: '480px' }} onClick={() => setPortfolioExpanded(true)}>
          <MasonryGrid clickable={true} />
        </div>
      </section>

      {/* Fullscreen overlay */}
      {portfolioExpanded && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {openAlbum ? (
            <>
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/10">
                <button onClick={() => setOpenAlbum(null)} className="flex items-center gap-1.5 text-white/70 hover:text-white transition-colors text-sm">
                  <ChevronLeft className="w-4 h-4" />{openAlbum.album.title}
                </button>
                <span className="text-white/40 text-xs tabular-nums">{openAlbum.slideIdx + 1} / {albumSlides.length}</span>
                <button onClick={() => { setOpenAlbum(null); setPortfolioExpanded(false) }} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <div className="relative flex-1 flex items-center">
                <div ref={slideRef} className="flex w-full h-full overflow-x-auto" style={{ scrollSnapType: 'x mandatory', scrollBehavior: 'smooth' }}>
                  {albumSlides.map((slide) => (
                    <div key={slide.id} className="flex-shrink-0 w-full h-full flex items-center justify-center p-2 sm:p-6" style={{ scrollSnapAlign: 'start' }}>
                      {'duration_seconds' in slide ? (
                        <video src={slide.src} className="max-w-full max-h-full w-auto h-auto rounded-xl" controls preload="metadata" />
                      ) : (
                        <img src={slide.src} alt={(slide as any).caption || ''} className="max-w-full max-h-full w-auto h-auto rounded-xl object-contain" />
                      )}
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
              <div className="flex items-center justify-between px-4 py-3 flex-shrink-0 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-white/60" />
                  <span className="text-white font-semibold text-sm">Portfolio</span>
                  <span className="text-white/40 text-xs">
                    {postCount > 0 ? `${postCount} post${postCount !== 1 ? 's' : ''}` : ''}
                    {albumCount > 0 ? `${postCount > 0 ? ' · ' : ''}${albumCount} album${albumCount !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>
                <button onClick={() => setPortfolioExpanded(false)} className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
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

// ─── Data fetch ───────────────────────────────────────────────────────────────

async function getProfile(username: string) {
  const base = typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')
    : ''
  const res = await fetch(`${base}/api/photographer/${username}`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-0.5">
        {[1,2,3,4,5].map(i => (
          <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 fill-ink-200'}`} />
        ))}
      </div>
      <span className="font-bold text-ink text-sm ml-1">{Number(rating).toFixed(1)}</span>
      <span className="text-ink-300 text-xs">({count})</span>
    </div>
  )
}

const SUB_LABELS: { key: string; label: string }[] = [
  { key: 'communication_rating', label: 'Communication' },
  { key: 'quality_rating',       label: 'Quality' },
  { key: 'punctuality_rating',   label: 'Punctuality' },
  { key: 'value_rating',         label: 'Value' },
]

function MiniStars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-2.5 h-2.5 ${i <= value ? 'text-amber-400 fill-amber-400' : 'text-ink-100 fill-ink-100'}`} />
      ))}
    </div>
  )
}

function ReviewCard({ r }: { r: any }) {
  const subRatings = SUB_LABELS.filter(s => r[s.key] != null)
  return (
    <div className="bg-white rounded-2xl p-5 border border-ink-50"
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
            {initials(r.reviewer_name)}
          </div>
          <div>
            <p className="font-semibold text-ink text-sm">{r.reviewer_name}</p>
            <span className="text-ink-300 text-[10px]">{formatDate(r.created_at)}</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(i => (
            <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-ink-100 fill-ink-100'}`} />
          ))}
        </div>
      </div>
      {subRatings.length > 0 && (
        <div className="space-y-1.5 mb-3 pt-3 border-t border-ink-50">
          {subRatings.map(s => (
            <div key={s.key} className="flex items-center gap-3">
              <span className="text-[10px] text-ink-300 w-20 flex-shrink-0">{s.label}</span>
              <MiniStars value={r[s.key]} />
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

function PackageCard({ pkg, username, photographerName, photographerId, allPackages, availability }: {
  pkg: any; username: string; photographerName: string
  photographerId: string; allPackages: any[]; availability: any[]
}) {
  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 hover:-translate-y-0.5 ${
      pkg.isPopular ? 'border-ink ring-1 ring-ink' : 'border-ink-100 hover:border-ink-300'
    }`}
      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>

      {/* Popular strip / badge */}
      {pkg.isPopular && !pkg.bannerUrl && (
        <div className="bg-ink py-1 flex items-center justify-center gap-1.5">
          <span className="text-[10px] font-bold text-white tracking-wide uppercase">Most popular</span>
        </div>
      )}

      {/* Banner */}
      {pkg.bannerUrl && (
        <div className="relative w-full h-32 overflow-hidden flex-shrink-0">
          <Image src={pkg.bannerUrl} alt={pkg.name} fill className="object-cover" sizes="600px" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
          {pkg.isPopular && (
            <div className="absolute top-2.5 left-3 flex items-center gap-1 bg-ink/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <span className="text-[10px] font-bold text-white tracking-wide uppercase">Most popular</span>
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div>
            <p className="font-semibold text-sm text-ink">{pkg.name}</p>
            {pkg.description && <p className="text-xs mt-1 leading-relaxed text-ink-400">{pkg.description}</p>}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-xl leading-none text-ink">${pkg.price}</p>
            <p className="text-[10px] mt-0.5 text-ink-300">/{pkg.billingType === 'hourly' ? 'hr' : 'session'}</p>
          </div>
        </div>
        {pkg.specialty && (
          <div className="mb-3">
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ink-50 text-ink-500 border border-ink-100">
              {pkg.specialty.charAt(0).toUpperCase() + pkg.specialty.slice(1).replace('-', ' ')}
            </span>
          </div>
        )}
        {pkg.deliverables?.length > 0 && (
          <ul className="space-y-1.5 mb-4">
            {pkg.deliverables.map((d: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-500">
                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-ink" />
                {d}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <ContactModal
            photographerId={photographerId}
            photographerName={photographerName}
            username={username}
            preselectedPackageId={pkg.id}
            availability={availability}
            packages={allPackages}
            trigger={
              <button type="button" className="w-full bg-ink hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs">
                <span>Request a booking</span>
              </button>
            }
          />
        </div>
      </div>
    </div>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-ink-50 last:border-0">
      <summary className="flex items-center justify-between py-4 cursor-pointer list-none gap-3">
        <span className="font-medium text-ink text-sm">{q}</span>
        <ChevronDown className="w-4 h-4 text-ink-300 flex-shrink-0 group-open:rotate-180 transition-transform duration-200" />
      </summary>
      <p className="text-ink-400 text-sm leading-relaxed pb-4 -mt-1">{a}</p>
    </details>
  )
}

function AvailabilityStrip({ availability }: { availability: { date: string; status: string }[] }) {
  const statusMap: Record<string, string> = {}
  for (const d of availability) statusMap[d.date] = d.status

  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    return {
      date: key,
      label: d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' }),
      day: d.toLocaleDateString('en-CA', { weekday: 'short' }),
      status: statusMap[key] ?? 'unknown',
    }
  })

  const color = (s: string) => {
    if (s === 'available') return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100'
    if (s === 'busy') return 'bg-red-50 text-red-400 border-red-100 ring-red-50'
    if (s === 'tentative') return 'bg-amber-50 text-amber-600 border-amber-100 ring-amber-50'
    return 'bg-ink-50 text-ink-300 border-ink-100 ring-ink-50'
  }

  return (
    <div className="grid grid-cols-7 gap-1.5">
      {days.map(d => (
        <div key={d.date} className={`flex flex-col items-center py-2 px-1 rounded-xl border text-center ring-1 ${color(d.status)}`}>
          <span className="text-[9px] font-semibold uppercase tracking-wide">{d.day}</span>
          <span className="text-[13px] font-bold mt-0.5">{d.label.split(' ')[1]}</span>
          <span className="text-[9px] mt-0.5">
            {d.status === 'available' ? '✓' : d.status === 'busy' ? '✗' : d.status === 'tentative' ? '~' : '·'}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ProfilePage({ params }: { params: { username: string } }) {
  const [p, setP] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProfile(params.username).then(data => {
      setP(data)
      setLoading(false)
    })
  }, [params.username])

  if (loading) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-ink-50 flex items-center justify-center">
          <svg className="w-6 h-6 animate-spin text-ink-300" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        </div>
        <Footer />
      </>
    )
  }

  if (!p) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-ink-50 flex flex-col items-center justify-center gap-4">
          <p className="text-ink-400 text-sm">Photographer not found.</p>
          <Link href="/photographers" className="text-sm text-ink underline">Browse photographers</Link>
        </div>
        <Footer />
      </>
    )
  }

  function fmtNum(n: number | null | undefined): string {
    if (n == null) return '—'
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
    return String(n)
  }

  // Build rich platform data from links
  type LinkInfo = {
    url: string; rating: number | null; count: number | null
    username: string | null; follower_count: number | null
    engagement_rate: number | null; posting_consistency: number | null
    account_age_days: number | null; is_verified: boolean; is_oauth_connected: boolean
  }
  const links = p.links as Record<string, LinkInfo>

  // Connected OAuth platforms (have real metrics)
  const connectedPlatforms = Object.entries(links ?? {}).filter(([, v]) => v.is_oauth_connected)

  // Legacy trust sources (manual URL links with ratings)
  const trustSources = Object.entries(links ?? {})
    .filter(([, info]) => info.rating != null)
    .map(([platform, info]) => ({
      name: platform.charAt(0).toUpperCase() + platform.slice(1),
      score: String(info.rating),
      count: `${info.count}`,
      bar: Math.round((Number(info.rating) / 5) * 100),
      url: info.url,
    }))

  const hasPackages = p.packages?.length > 0
  const hasFaqs = p.faqs?.length > 0
  const reviewList: any[] = p.native_reviews ?? []
  const hasReviews = reviewList.length > 0
  const liveReviewCount = reviewList.length
  const liveAvgRating = hasReviews
    ? Math.round((reviewList.reduce((s: number, r: any) => s + r.rating, 0) / reviewList.length) * 10) / 10
    : 0
  const hasAvailability = p.availability?.length > 0
  const portfolioAlbums: PortfolioAlbum[] = p.portfolio_albums ?? []
  const portfolioPhotos: PortfolioPhoto[] = p.portfolio_photos ?? []
  const portfolioVideos: PortfolioVideo[] = p.portfolio_videos ?? []
  const standalonePhotos: StandalonePhoto[] = p.standalone_photos ?? []
  const standaloneVideos: StandaloneVideo[] = p.standalone_videos ?? []
  const hasPortfolio = standalonePhotos.length > 0 || standaloneVideos.length > 0 || portfolioAlbums.length > 0

  return (
    <>
      <Nav />

      {/* ── Cover ─────────────────────────────────────────────────────── */}
      <div className="relative h-56 sm:h-72 bg-ink-900 overflow-hidden">
        {p.cover_image_url ? (
          <Image src={p.cover_image_url} alt="" fill className="object-cover opacity-90" priority sizes="100vw" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-black" />
        )}
        {/* Subtle noise/grain overlay for depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link href="/photographers"
            className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-medium px-3 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All photographers
          </Link>
        </div>
      </div>

      {/* ── Profile header ────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.04)' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Avatar row */}
          <div className="flex items-end gap-4 -mt-12 pb-4 relative z-10">
            <div className="relative flex-shrink-0">
              <div className="w-24 h-24 rounded-2xl overflow-hidden border-4 border-white bg-ink"
                style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.06)' }}>
                {p.avatar_url ? (
                  <Image src={p.avatar_url} alt={p.display_name} width={96} height={96} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold tracking-tight">
                    {initials(p.display_name)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Name + actions row */}
          <div className="pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                {/* Name */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">{p.display_name}</h1>
                </div>
                {p.tagline && <p className="text-ink-400 text-sm mt-1">{p.tagline}</p>}
                {/* Meta row */}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {p.location && (
                    <span className="flex items-center gap-1 text-ink-400 text-xs">
                      <MapPin className="w-3 h-3" />{p.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-ink-300 text-xs">
                    <Award className="w-3 h-3" />Member since {formatDate(p.member_since)}
                  </span>
                  {p.rate_display && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-ink bg-ink-50 px-2 py-0.5 rounded-full border border-ink-100">
                      <DollarSign className="w-3 h-3" />{p.rate_display}
                    </span>
                  )}
                  {hasReviews && <StarRow rating={liveAvgRating} count={liveReviewCount} />}
                </div>
                {/* Specialties */}
                {p.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.specialties.map((s: string) => (
                      <span key={s} className="bg-ink text-white text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <SaveButton slug={params.username} photographerId={p.id} />
                <ContactModal
                  photographerId={p.id}
                  photographerName={p.display_name}
                  username={params.username}
                  availability={p.availability ?? []}
                  packages={p.packages ?? []}
                  trigger={
                    <button type="button" className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0">
                      Request a booking
                    </button>
                  }
                />
              </div>
            </div>
          </div>

          {/* ── Tab bar ─────────────────────────────────────────────── */}
          <div className="flex items-center gap-1 -mb-px">
            <button
              className="px-4 py-2.5 text-sm font-medium border-b-2 border-ink text-ink"
            >
              Overview
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab content ───────────────────────────────────────────────── */}
      <div className="bg-ink-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* ══ OVERVIEW ═══════════════════════════════════════════════ */}
          {(
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* ── Left column ──────────────────────────────────────── */}
              <div className="lg:col-span-2 space-y-5">

                {/* About */}
                {p.bio && (
                  <section className="bg-white rounded-2xl p-6 border border-ink-50"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <h2 className="font-semibold text-ink text-base mb-3">About</h2>
                    <div className="text-ink-500 text-sm leading-relaxed space-y-3">
                      {p.bio.trim().split('\n\n').map((para: string, i: number) => <p key={i}>{para}</p>)}
                    </div>
                  </section>
                )}

                {/* Portfolio preview — scrollable masonry, click to expand fullscreen */}
                {hasPortfolio && (
                  <PortfolioPreview
                    standalonePhotos={standalonePhotos}
                    standaloneVideos={standaloneVideos}
                    portfolioAlbums={portfolioAlbums}
                    portfolioPhotos={portfolioPhotos}
                    portfolioVideos={portfolioVideos}
                  />
                )}

                {/* Packages */}
                <section className="bg-white rounded-2xl p-6 border border-ink-50"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-2 mb-5">
                    <Package className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink text-base">Packages</h2>
                  </div>
                  {hasPackages ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {p.packages.map((pkg: any) => (
                        <PackageCard key={pkg.id} pkg={pkg} username={params.username} photographerName={p.display_name} photographerId={p.id} allPackages={p.packages} availability={p.availability ?? []} />
                      ))}
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-ink-100 rounded-xl py-10 text-center">
                      <Package className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                      <p className="text-ink-400 text-sm font-medium">No packages listed yet</p>
                      <p className="text-ink-300 text-xs mt-1">Contact the photographer directly for pricing.</p>
                    </div>
                  )}
                </section>

                {/* Reviews */}
                <section>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-ink text-base">Reviews</h2>
                      {hasReviews && <span className="text-ink-300 text-sm font-normal">({liveReviewCount})</span>}
                    </div>
                    {hasReviews && <StarRow rating={liveAvgRating} count={liveReviewCount} />}
                  </div>
                  {hasReviews ? (
                    <div className="space-y-3">
                      {p.native_reviews.map((r: any) => <ReviewCard key={r.id} r={r} />)}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl py-12 text-center border border-ink-50"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <Star className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                      <p className="text-ink-400 text-sm font-medium">No reviews yet</p>
                      <p className="text-ink-300 text-xs mt-1">Reviews from booked sessions will appear here.</p>
                    </div>
                  )}
                </section>

                {/* FAQ */}
                <section className="bg-white rounded-2xl px-6 py-5 border border-ink-50"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <h2 className="font-semibold text-ink text-base mb-1">FAQ</h2>
                  {hasFaqs ? (
                    p.faqs.map((f: any) => <FaqItem key={f.id} q={f.question} a={f.answer} />)
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-ink-400 text-sm font-medium">No FAQs yet</p>
                      <p className="text-ink-300 text-xs mt-1">Common questions will appear here once added.</p>
                    </div>
                  )}
                </section>

                {/* Availability */}
                {hasAvailability && (
                  <section className="bg-white rounded-2xl p-6 border border-ink-50"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center gap-2 mb-4">
                      <Calendar className="w-4 h-4 text-ink-400" />
                      <h2 className="font-semibold text-ink text-base">Availability</h2>
                      <span className="text-ink-300 text-xs">Next 14 days</span>
                    </div>
                    <AvailabilityStrip availability={p.availability} />
                    <div className="flex items-center gap-5 mt-4 text-[10px] text-ink-400">
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" />Available</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" />Tentative</span>
                      <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-400" />Busy</span>
                    </div>
                    <div className="mt-5 pt-4 border-t border-ink-50">
                      <ContactModal
                      photographerId={p.id}
                      photographerName={p.display_name}
                      username={params.username}
                      availability={p.availability ?? []}
                      packages={p.packages ?? []}
                      trigger={
                        <button type="button" className="w-full bg-ink hover:bg-ink-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                          Request a booking
                        </button>
                      }
                    />
                    </div>
                  </section>
                )}
              </div>

              {/* ── Right sidebar ─────────────────────────────────────── */}
              <div className="space-y-4">

                {/* Book CTA card */}
                <div className="rounded-2xl p-5 text-white overflow-hidden relative"
                  style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.06) inset' }}>
                  {/* Subtle highlight */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  <p className="font-semibold text-base mb-1">Book {p.display_name.split(' ')[0]}</p>
                  {p.rate_display ? (
                    <div className="mb-4">
                      <p className="text-white/50 text-[10px] uppercase tracking-widest mb-1">Starting from</p>
                      <p className="font-bold text-white text-2xl leading-none tracking-tight">{p.rate_display}</p>
                      {p.rate_note && <p className="text-white/40 text-xs mt-1">{p.rate_note}</p>}
                    </div>
                  ) : (
                    <p className="text-white/40 text-xs mb-4">Contact for pricing</p>
                  )}
                  <ContactModal
                    photographerId={p.id}
                    photographerName={p.display_name}
                    username={params.username}
                    availability={p.availability ?? []}
                    packages={p.packages ?? []}
                    trigger={
                      <button type="button" className="w-full bg-white hover:bg-ink-50 text-ink font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm border border-white/20">
                        Request a booking
                      </button>
                    }
                  />
                </div>

                {/* At a glance */}
                <div className="bg-white rounded-2xl p-5 border border-ink-50"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                  <h3 className="font-semibold text-ink text-sm mb-4">At a glance</h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { label: 'Reviews', value: String(liveReviewCount), icon: Star },
                      { label: 'Specialties', value: String(p.specialties.length), icon: Camera },
                      { label: 'Trust score', value: Number(p.trust_score) > 0 ? Number(p.trust_score).toFixed(1) : '—', icon: Shield },
                      { label: 'Profile views', value: String(p.profile_view_count), icon: Eye },
                    ].map(stat => {
                      const Icon = stat.icon
                      return (
                        <div key={stat.label} className="bg-ink-50 rounded-xl p-3 text-center border border-ink-50 hover:border-ink-100 transition-colors">
                          <Icon className="w-4 h-4 text-ink-300 mx-auto mb-1.5" />
                          <p className="font-bold text-ink text-lg leading-none">{stat.value}</p>
                          <p className="text-ink-300 text-[10px] mt-1 font-medium">{stat.label}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Social proof metrics — shown when photographer has OAuth-connected platforms */}
                {connectedPlatforms.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-ink-50"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-ink text-sm">Social proof</h3>
                      {Number(p.trust_score) > 0 && (
                        <div className="flex items-center gap-1.5 bg-ink rounded-full px-2.5 py-1">
                          <Shield className="w-3 h-3 text-white" />
                          <span className="text-white text-xs font-bold">{Number(p.trust_score).toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-2.5">
                      {connectedPlatforms.map(([platform, info]) => {
                        // Build metrics to show for this platform
                        const metrics: { label: string; value: string; icon: React.ElementType }[] = []

                        if (platform === 'instagram') {
                          if (info.follower_count != null) metrics.push({ label: 'Followers', value: fmtNum(info.follower_count), icon: Users })
                          if (info.engagement_rate != null) metrics.push({ label: 'Engagement', value: `${(info.engagement_rate * 100).toFixed(1)}%`, icon: TrendingUp })
                          if (info.posting_consistency != null) metrics.push({ label: 'Consistency', value: `${Math.round(info.posting_consistency * 100)}%`, icon: CheckCircle2 })
                        } else if (platform === 'facebook') {
                          if (info.follower_count != null) metrics.push({ label: 'Page likes', value: fmtNum(info.follower_count), icon: Users })
                          if (info.rating != null) metrics.push({ label: 'Rating', value: `${Number(info.rating).toFixed(1)} ★`, icon: Star })
                          if (info.count != null && info.count > 0) metrics.push({ label: 'Reviews', value: fmtNum(info.count), icon: CheckCircle2 })
                        } else if (platform === 'google') {
                          if (info.rating != null) metrics.push({ label: 'Rating', value: `${Number(info.rating).toFixed(1)} ★`, icon: Star })
                          if (info.count != null && info.count > 0) metrics.push({ label: 'Reviews', value: fmtNum(info.count), icon: CheckCircle2 })
                        }

                        // Platform visual config
                        const cfg: Record<string, { label: string; gradient: string; iconBg: string; border: string; Icon: React.ElementType }> = {
                          instagram: { label: 'Instagram', gradient: 'from-pink-50 to-purple-50', iconBg: 'bg-gradient-to-br from-pink-500 to-purple-600', border: 'border-pink-100 hover:border-pink-300', Icon: Instagram },
                          facebook:  { label: 'Facebook',  gradient: 'from-blue-50 to-sky-50',    iconBg: 'bg-gradient-to-br from-blue-600 to-blue-400',   border: 'border-blue-100 hover:border-blue-300',   Icon: Facebook  },
                          google:    { label: 'Google',    gradient: 'from-slate-50 to-white',     iconBg: 'bg-white border border-blue-100',               border: 'border-slate-100 hover:border-slate-300', Icon: Globe     },
                        }
                        const c = cfg[platform] ?? cfg.google

                        const PlatformIcon = c.Icon
                        const hasLink = !!info.url

                        const cardInner = (
                          <div className={`rounded-xl border p-3 transition-all bg-gradient-to-r ${c.gradient} ${c.border} ${hasLink ? 'cursor-pointer hover:shadow-sm' : ''} group`}>
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className={`w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                                {platform === 'google'
                                  ? <span className="text-sm font-black text-blue-500 leading-none">G</span>
                                  : <PlatformIcon className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1">
                                  <p className="text-xs font-semibold text-ink">{c.label}</p>
                                  {info.is_verified && <BadgeCheck className="w-3 h-3 text-blue-500 flex-shrink-0" />}
                                </div>
                                {info.username && (
                                  <p className="text-[10px] text-ink-400 truncate">@{info.username}</p>
                                )}
                              </div>
                              {hasLink && <ExternalLink className="w-3 h-3 text-ink-200 group-hover:text-ink-400 flex-shrink-0 transition-colors" />}
                            </div>
                            {metrics.length > 0 && (
                              <div className="grid grid-cols-3 gap-1.5">
                                {metrics.map(m => {
                                  const MIcon = m.icon
                                  return (
                                    <div key={m.label} className="bg-white/70 rounded-lg px-1.5 py-1.5 text-center">
                                      <MIcon className="w-3 h-3 text-ink-300 mx-auto mb-0.5" />
                                      <p className="text-[10px] font-bold text-ink leading-none">{m.value}</p>
                                      <p className="text-[9px] text-ink-300 mt-0.5 leading-none">{m.label}</p>
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                          </div>
                        )

                        return hasLink ? (
                          <a key={platform} href={info.url} target="_blank" rel="noopener noreferrer">
                            {cardInner}
                          </a>
                        ) : (
                          <div key={platform}>{cardInner}</div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Review links — Google / Yelp (non-OAuth) */}
                {(() => {
                  const hasGoogle = links?.google?.url && !links?.google?.is_oauth_connected
                  const hasYelp   = links?.yelp?.url
                  if (!hasGoogle && !hasYelp) return null
                  return (
                    <div className="bg-white rounded-2xl p-5 border border-ink-50"
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                      <p className="text-xs font-semibold text-ink mb-3 uppercase tracking-wide">Reviews</p>
                      <div className="space-y-2">
                        {hasGoogle && (
                          <a href={links.google.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-blue-50 border border-blue-100 hover:border-blue-300 hover:shadow-sm transition-all group">
                            <div className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <span className="text-sm font-black text-blue-500 leading-none">G</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-ink-400 leading-none mb-0.5">Google Reviews</p>
                              {links.google.rating != null ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-ink">{Number(links.google.rating).toFixed(1)}</span>
                                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                                  {links.google.count && <span className="text-ink-300 text-[10px]">({links.google.count})</span>}
                                </div>
                              ) : <p className="text-xs font-semibold text-ink">View reviews</p>}
                            </div>
                            <ExternalLink className="w-3 h-3 text-ink-200 group-hover:text-ink-400 transition-colors flex-shrink-0" />
                          </a>
                        )}
                        {hasYelp && (
                          <a href={links.yelp.url} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-3 p-2.5 rounded-xl bg-red-50 border border-red-100 hover:border-red-300 hover:shadow-sm transition-all group">
                            <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                              <span className="text-xs font-black text-white">★</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] text-ink-400 leading-none mb-0.5">Yelp</p>
                              {links.yelp.rating != null ? (
                                <div className="flex items-center gap-1">
                                  <span className="text-xs font-bold text-ink">{Number(links.yelp.rating).toFixed(1)}</span>
                                  <Star className="w-3 h-3 text-red-400 fill-red-400" />
                                  {links.yelp.count && <span className="text-ink-300 text-[10px]">({links.yelp.count})</span>}
                                </div>
                              ) : <p className="text-xs font-semibold text-ink">View reviews</p>}
                            </div>
                            <ExternalLink className="w-3 h-3 text-ink-200 group-hover:text-ink-400 transition-colors flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  )
                })()}

                {/* Trust score breakdown — only for manually-linked platforms without OAuth metrics */}
                {trustSources.length > 0 && connectedPlatforms.length === 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-ink-50"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
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
                          <div className="flex items-center justify-between mb-1.5">
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
                            <div className="h-full bg-gradient-to-r from-ink-600 to-ink rounded-full transition-all" style={{ width: `${s.bar}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links — contact socials as icons */}
                {(p.contact_instagram_url || p.contact_facebook_url || p.website_url) && (
                  <div className="bg-white rounded-2xl p-5 border border-ink-50"
                    style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                    <p className="text-xs font-semibold text-ink mb-3 uppercase tracking-wide">Links</p>
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

              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
