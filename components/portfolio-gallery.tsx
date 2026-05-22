'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Play, Video, Image as ImageIcon, X } from 'lucide-react'

interface Album {
  id: string
  title: string
  emoji: string
  photos: { src: string; caption: string }[]
  videos: { thumbnail: string; title: string; duration: string }[]
}

export function PortfolioGallery({ albums }: { albums: Album[] }) {
  const [activeAlbumId, setActiveAlbumId] = useState(albums[0]?.id ?? '')
  const [lightbox, setLightbox] = useState<{ src: string; caption: string } | null>(null)

  const album = albums.find(a => a.id === activeAlbumId) ?? albums[0]
  const totalPhotos = albums.reduce((n, a) => n + a.photos.length, 0)
  const totalVideos = albums.reduce((n, a) => n + a.videos.length, 0)

  if (!album) return null

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightbox.src} alt={lightbox.caption} className="w-full max-h-[80vh] object-contain rounded-xl" />
            {lightbox.caption && (
              <p className="text-white/70 text-sm text-center mt-3">{lightbox.caption}</p>
            )}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-ink text-base">Portfolio</h2>
          <span className="text-xs text-ink-300">{totalPhotos} photos · {totalVideos} video{totalVideos !== 1 ? 's' : ''}</span>
        </div>

        {/* Album tabs */}
        {albums.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
            {albums.map(a => (
              <button
                key={a.id}
                onClick={() => setActiveAlbumId(a.id)}
                className={`flex-shrink-0 flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                  activeAlbumId === a.id
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                }`}
              >
                <span>{a.emoji}</span>
                <span>{a.title}</span>
                <span className={`text-[10px] ${activeAlbumId === a.id ? 'text-white/70' : 'text-ink-300'}`}>
                  {a.photos.length + a.videos.length}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Videos row */}
        {album.videos.length > 0 && (
          <div className="mb-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {album.videos.map((v, i) => (
                <div key={i} className="flex-shrink-0 w-48 rounded-xl overflow-hidden relative group cursor-pointer">
                  <div className="relative aspect-video">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={v.thumbnail} alt={v.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-colors">
                      <div className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center">
                        <Play className="w-4 h-4 text-ink fill-ink ml-0.5" />
                      </div>
                    </div>
                    <div className="absolute bottom-1.5 right-1.5 bg-black/70 text-white text-[10px] font-medium px-1.5 py-0.5 rounded">
                      {v.duration}
                    </div>
                  </div>
                  <div className="bg-ink-50 px-2.5 py-2">
                    <p className="text-[11px] font-medium text-ink truncate">{v.title}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Photo grid */}
        {album.photos.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {album.photos.map((photo, i) => (
              <div
                key={i}
                className={`relative overflow-hidden rounded-xl bg-ink-100 group cursor-pointer ${
                  i === 0 ? 'col-span-2 sm:col-span-1 row-span-2' : ''
                }`}
                style={{ aspectRatio: i === 0 ? '3/4' : '4/3' }}
                onClick={() => setLightbox({ src: photo.src, caption: photo.caption })}
              >
                <Image
                  src={photo.src}
                  alt={photo.caption}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                  <p className="text-white text-[11px] font-medium">{photo.caption}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty album */}
        {album.photos.length === 0 && album.videos.length === 0 && (
          <div className="py-12 text-center">
            <ImageIcon className="w-8 h-8 text-ink-200 mx-auto mb-2" />
            <p className="text-ink-300 text-sm">No photos in this album yet</p>
          </div>
        )}
      </div>
    </>
  )
}
