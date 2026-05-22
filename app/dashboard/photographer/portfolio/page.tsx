'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import {
  ArrowLeft, ImagePlus, X, Star, CheckCircle2, AlertCircle,
  ChevronRight, FolderPlus, Pencil, Trash2, Video, Play,
  FolderOpen, Image as ImageIcon, Plus,
} from 'lucide-react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

const MAX_ALBUMS           = PLATFORM_CONFIG.max_albums_per_photographer
const MAX_PHOTOS_TOTAL     = PLATFORM_CONFIG.max_photos_per_photographer
const MAX_VIDEOS_TOTAL     = PLATFORM_CONFIG.max_videos_per_photographer
const MAX_VIDEOS_PER_ALBUM = PLATFORM_CONFIG.max_videos_per_album
const MAX_PHOTO_BYTES      = PLATFORM_CONFIG.max_photo_bytes
const MAX_VIDEO_BYTES      = PLATFORM_CONFIG.max_video_bytes
const MAX_PHOTO_MB         = MAX_PHOTO_BYTES / 1024 / 1024
const MAX_VIDEO_MB         = MAX_VIDEO_BYTES / 1024 / 1024
const MAX_ALBUM_NAME       = PLATFORM_CONFIG.max_album_name_length
const MAX_CAPTION          = PLATFORM_CONFIG.max_photo_caption_length

interface PortfolioPhoto {
  id: string
  src: string
  caption: string
  isCover: boolean
  storage_asset_id: string
}

interface PortfolioVideo {
  id: string
  src: string
  title: string
  duration_seconds: number | null
  storage_asset_id: string
}

interface Album {
  id: string
  title: string
  photos: PortfolioPhoto[]
  videos: PortfolioVideo[]
}

function totalPhotos(albums: Album[]) { return albums.reduce((n, a) => n + a.photos.length, 0) }
function totalVideos(albums: Album[]) { return albums.reduce((n, a) => n + a.videos.length, 0) }

async function uploadPhoto(file: File, albumId: string): Promise<{ id: string; src: string; caption: string; isCover: boolean; storage_asset_id: string } | null> {
  const form = new FormData()
  form.append('file', file)
  form.append('album_id', albumId)
  const res = await fetch('/api/photographer/photos/upload', { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('[photo upload]', res.status, err)
    return null
  }
  return res.json()
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AlbumCard({ album, onOpen, onRename, onDelete }: {
  album: Album; onOpen: () => void; onRename: () => void; onDelete: () => void
}) {
  const cover = album.photos[0]
  return (
    <div className="bg-white rounded-2xl overflow-hidden group cursor-pointer" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      <div className="relative aspect-video bg-ink-100" onClick={onOpen}>
        {cover ? (
          <img src={cover.src} alt={album.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-ink-200" /></div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1 text-xs font-medium text-ink">
          {album.title}
        </div>
        {album.videos.length > 0 && (
          <div className="absolute top-2 right-2 bg-black/60 rounded-lg px-2 py-1 text-[10px] font-medium text-white flex items-center gap-1">
            <Play className="w-2.5 h-2.5" /> {album.videos.length}
          </div>
        )}
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" />{album.photos.length} photos</span>
          <span className="flex items-center gap-1"><Video className="w-3 h-3" />{album.videos.length} videos</span>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={e => { e.stopPropagation(); onRename() }} className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400 hover:text-ink transition-colors">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={e => { e.stopPropagation(); onDelete() }} className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function PhotoCard({ photo, onRemove, onSetCover, onEditCaption, isSaved }: {
  photo: PortfolioPhoto; onRemove: () => void; onSetCover: () => void; onEditCaption: () => void; isSaved: boolean
}) {
  return (
    <div className={`relative bg-white rounded-2xl overflow-hidden group ${photo.isCover ? 'ring-2 ring-ink' : ''}`} style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      <div className="relative aspect-square cursor-pointer" onClick={onSetCover}>
        <img src={photo.src} alt={photo.caption || 'Portfolio photo'} className="w-full h-full object-cover" />
        {photo.isCover && (
          <div className="absolute top-2 left-2 bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Star className="w-2.5 h-2.5" /> Cover
          </div>
        )}
        {!photo.isCover && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full">Set as cover</span>
          </div>
        )}
        <button onClick={e => { e.stopPropagation(); onRemove() }}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      </div>
      <div className="p-3">
        <button onClick={onEditCaption} className="w-full text-left">
          {photo.caption ? (
            <p className="text-xs text-ink-500 line-clamp-2 hover:text-ink transition-colors">{photo.caption}</p>
          ) : (
            <p className="text-xs text-ink-200 italic hover:text-ink-400 transition-colors">Add caption…</p>
          )}
          {isSaved && <span className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1"><CheckCircle2 className="w-2.5 h-2.5" /> Saved</span>}
        </button>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null)

  const [albumModal, setAlbumModal] = useState<{ mode: 'create' | 'rename'; albumId?: string } | null>(null)
  const [albumDraft, setAlbumDraft] = useState('')

  const [editingCaption, setEditingCaption] = useState<{ albumId: string; photoId: string } | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')
  const [savingCaption, setSavingCaption] = useState(false)
  const [savedCaption, setSavedCaption] = useState<string | null>(null)

  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const photoInputRef = useRef<HTMLInputElement>(null)

  const openAlbum = openAlbumId ? albums.find(a => a.id === openAlbumId) ?? null : null
  const totalP = totalPhotos(albums)
  const totalV = totalVideos(albums)

  // Load albums from DB
  useEffect(() => {
    fetch('/api/photographer/albums')
      .then(r => r.json())
      .then(data => setAlbums(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // ─── Album actions ──────────────────────────────────────────────────────────

  async function commitAlbumModal() {
    const title = albumDraft.trim()
    if (!title) return

    if (albumModal?.mode === 'create') {
      const res = await fetch('/api/photographer/albums', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      })
      if (res.ok) {
        const newAlbum = await res.json()
        setAlbums(prev => [...prev, { ...newAlbum, photos: [], videos: [] }])
      }
    } else if (albumModal?.mode === 'rename' && albumModal.albumId) {
      const res = await fetch('/api/photographer/albums', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: albumModal.albumId, title }),
      })
      if (res.ok) {
        setAlbums(prev => prev.map(a => a.id === albumModal.albumId ? { ...a, title } : a))
      }
    }
    setAlbumModal(null)
  }

  async function deleteAlbum(albumId: string) {
    const res = await fetch(`/api/photographer/albums?id=${albumId}`, { method: 'DELETE' })
    if (res.ok) {
      setAlbums(prev => prev.filter(a => a.id !== albumId))
      if (openAlbumId === albumId) setOpenAlbumId(null)
    }
  }

  // ─── Photo upload ───────────────────────────────────────────────────────────

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || !openAlbumId) return
    setUploadError(null)
    const all = Array.from(files).filter(f => f.type.startsWith('image/'))
    const oversized = all.filter(f => f.size > MAX_PHOTO_BYTES)
    if (oversized.length > 0) {
      setUploadError(`${oversized.map(f => f.name).join(', ')} exceed the ${MAX_PHOTO_MB} MB limit.`)
      return
    }
    if (totalP + all.length > MAX_PHOTOS_TOTAL) {
      setUploadError(`Portfolio limit is ${MAX_PHOTOS_TOTAL} photos. You have ${MAX_PHOTOS_TOTAL - totalP} slot(s) remaining.`)
      return
    }

    setUploading(true)
    for (const file of all) {
      const photo = await uploadPhoto(file, openAlbumId)
      if (!photo) {
        setUploadError(`Failed to upload ${file.name}. Try again.`)
        continue
      }
      setAlbums(prev => prev.map(a => a.id === openAlbumId ? {
        ...a,
        photos: [...a.photos, { ...photo, isCover: a.photos.length === 0 }],
      } : a))
    }
    setUploading(false)
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  async function removePhoto(albumId: string, photoId: string) {
    const res = await fetch(`/api/photographer/photos?id=${photoId}`, { method: 'DELETE' })
    if (res.ok) {
      setAlbums(prev => prev.map(a => {
        if (a.id !== albumId) return a
        const next = a.photos.filter(p => p.id !== photoId)
        if (next.length > 0) next[0] = { ...next[0], isCover: true }
        return { ...a, photos: next }
      }))
    }
  }

  function setCover(albumId: string, photoId: string) {
    setAlbums(prev => prev.map(a =>
      a.id !== albumId ? a : { ...a, photos: a.photos.map(p => ({ ...p, isCover: p.id === photoId })) }
    ))
  }

  async function saveCaption() {
    if (!editingCaption) return
    setSavingCaption(true)
    const res = await fetch('/api/photographer/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: editingCaption.photoId, caption: captionDraft }),
    })
    if (res.ok) {
      setAlbums(prev => prev.map(a =>
        a.id !== editingCaption.albumId ? a : {
          ...a, photos: a.photos.map(p => p.id === editingCaption.photoId ? { ...p, caption: captionDraft } : p)
        }
      ))
      setSavedCaption(editingCaption.photoId)
      setTimeout(() => setSavedCaption(null), 2000)
    }
    setEditingCaption(null)
    setSavingCaption(false)
  }

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

  return (
    <div className="min-h-screen bg-ink-50">

      {/* Album / Rename Modal */}
      {albumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h3 className="font-semibold text-ink text-base mb-4">
              {albumModal.mode === 'create' ? 'New album' : 'Rename album'}
            </h3>
            <input
              type="text"
              value={albumDraft}
              onChange={e => setAlbumDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitAlbumModal() }}
              placeholder="Album name…"
              autoFocus
              maxLength={MAX_ALBUM_NAME}
              className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all mb-4"
            />
            <div className="flex gap-2">
              <button onClick={commitAlbumModal} disabled={!albumDraft.trim()}
                className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-40">
                {albumModal.mode === 'create' ? 'Create' : 'Save'}
              </button>
              <button onClick={() => setAlbumModal(null)}
                className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Caption modal */}
      {editingCaption && openAlbum && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <p className="text-sm font-semibold text-ink mb-3">Edit caption</p>
            <input
              type="text"
              value={captionDraft}
              onChange={e => setCaptionDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveCaption() }}
              placeholder="Add a caption…"
              autoFocus
              maxLength={MAX_CAPTION}
              className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all mb-3"
            />
            <div className="flex gap-2">
              <button onClick={saveCaption} disabled={savingCaption}
                className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50">
                {savingCaption ? 'Saving…' : 'Save caption'}
              </button>
              <button onClick={() => setEditingCaption(null)}
                className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-white border-b border-ink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {openAlbum ? (
                <button onClick={() => setOpenAlbumId(null)} className="p-2 rounded-lg hover:bg-ink-50 transition-colors text-ink-400 hover:text-ink">
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <Link href="/dashboard/photographer/edit" className="p-2 rounded-lg hover:bg-ink-50 transition-colors text-ink-400 hover:text-ink">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              )}
              <span className="font-semibold text-ink text-sm">
                {openAlbum ? (
                  <span className="flex items-center gap-2">
                    <button onClick={() => setOpenAlbumId(null)} className="text-ink-400 hover:text-ink transition-colors">Portfolio</button>
                    <ChevronRight className="w-3 h-3 text-ink-300" />
                    <span>{openAlbum.title}</span>
                  </span>
                ) : 'Portfolio albums'}
              </span>
            </div>
            <Link href="/photographers/your-profile" className="text-xs text-ink-400 hover:text-ink transition-colors flex items-center gap-1">
              Preview <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Album list ──────────────────────────────────────────────────── */}
        {!openAlbum && (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-serif text-2xl font-bold text-ink mb-1">Portfolio</h1>
                <p className="text-ink-300 text-sm">Up to {MAX_ALBUMS} albums · {MAX_PHOTOS_TOTAL} photos ({MAX_PHOTO_MB} MB each)</p>
              </div>
              {albums.length < MAX_ALBUMS && (
                <button onClick={() => { setAlbumDraft(''); setAlbumModal({ mode: 'create' }) }}
                  className="flex items-center gap-2 bg-ink text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-ink-800 transition-colors">
                  <FolderPlus className="w-4 h-4" /> New album
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[
                { label: 'Albums', value: `${albums.length} / ${MAX_ALBUMS}` },
                { label: 'Photos', value: `${totalP} / ${MAX_PHOTOS_TOTAL}` },
                { label: 'Videos', value: `${totalV} / ${MAX_VIDEOS_TOTAL}` },
              ].map(s => (
                <div key={s.label} className="bg-white rounded-xl px-4 py-3 text-center" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <p className="font-bold text-ink text-lg">{s.value}</p>
                  <p className="text-ink-300 text-xs mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>

            {albums.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {albums.map(album => (
                  <AlbumCard key={album.id} album={album}
                    onOpen={() => setOpenAlbumId(album.id)}
                    onRename={() => { setAlbumDraft(album.title); setAlbumModal({ mode: 'rename', albumId: album.id }) }}
                    onDelete={() => deleteAlbum(album.id)}
                  />
                ))}
                {albums.length < MAX_ALBUMS && (
                  <button onClick={() => { setAlbumDraft(''); setAlbumModal({ mode: 'create' }) }}
                    className="aspect-video border-2 border-dashed border-ink-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-ink-400 hover:bg-ink-50 transition-all">
                    <FolderPlus className="w-7 h-7 text-ink-300" />
                    <span className="text-sm text-ink-300 font-medium">Create album</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-12 text-center" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                <div className="w-14 h-14 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-7 h-7 text-ink-200" />
                </div>
                <p className="font-semibold text-ink text-sm mb-2">No albums yet</p>
                <p className="text-ink-300 text-xs leading-relaxed mb-5">Organise your work into albums like Weddings, Portraits, or Events.</p>
                <button onClick={() => { setAlbumDraft(''); setAlbumModal({ mode: 'create' }) }}
                  className="inline-flex items-center gap-2 bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink-800 transition-colors">
                  <FolderPlus className="w-4 h-4" /> Create first album
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Album detail ────────────────────────────────────────────────── */}
        {openAlbum && (
          <>
            <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={e => handlePhotoFiles(e.target.files)} />

            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-serif text-2xl font-bold text-ink mb-1">{openAlbum.title}</h1>
                <p className="text-ink-300 text-sm">{openAlbum.photos.length} photos</p>
              </div>
              {totalP < MAX_PHOTOS_TOTAL && (
                <button onClick={() => photoInputRef.current?.click()} disabled={uploading}
                  className="flex items-center gap-1.5 bg-ink text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50">
                  {uploading ? (
                    <><svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg> Uploading…</>
                  ) : (
                    <><ImagePlus className="w-3.5 h-3.5" /> Add photos</>
                  )}
                </button>
              )}
            </div>

            {uploadError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {uploadError}
                <button onClick={() => setUploadError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {openAlbum.photos.length === 0 ? (
              <div onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-ink-200 rounded-2xl p-12 text-center cursor-pointer hover:border-ink-400 hover:bg-ink-50 transition-all mb-6">
                <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImagePlus className="w-6 h-6 text-ink-400" />
                </div>
                <p className="font-semibold text-ink text-sm mb-1">Click to upload photos</p>
                <p className="text-ink-300 text-xs">JPG, PNG, WEBP · max {MAX_PHOTO_MB} MB per photo</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {openAlbum.photos.map(photo => (
                  <PhotoCard
                    key={photo.id}
                    photo={photo}
                    onRemove={() => removePhoto(openAlbum.id, photo.id)}
                    onSetCover={() => setCover(openAlbum.id, photo.id)}
                    onEditCaption={() => { setEditingCaption({ albumId: openAlbum.id, photoId: photo.id }); setCaptionDraft(photo.caption) }}
                    isSaved={savedCaption === photo.id}
                  />
                ))}
                {totalP < MAX_PHOTOS_TOTAL && (
                  <button onClick={() => photoInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-ink-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-ink-400 hover:bg-ink-50 transition-all">
                    <Plus className="w-6 h-6 text-ink-300" />
                    <span className="text-xs text-ink-300">Add photos</span>
                  </button>
                )}
              </div>
            )}

            {openAlbum.photos.length > 0 && openAlbum.photos.length < 6 && (
              <div className="mt-6 bg-ink rounded-2xl p-5">
                <p className="text-white font-semibold text-sm mb-1">Add {6 - openAlbum.photos.length} more photo{6 - openAlbum.photos.length !== 1 ? 's' : ''}</p>
                <p className="text-ink-400 text-xs leading-relaxed">Albums with 6+ photos get significantly more profile views.</p>
              </div>
            )}
          </>
        )}

        <div className="flex justify-between items-center pt-6 mt-2">
          {openAlbum ? (
            <button onClick={() => setOpenAlbumId(null)} className="flex items-center gap-2 text-sm text-ink-400 hover:text-ink transition-colors">
              <ArrowLeft className="w-4 h-4" /> All albums
            </button>
          ) : (
            <Link href="/dashboard/photographer/edit" className="flex items-center gap-2 text-sm text-ink-400 hover:text-ink transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to profile
            </Link>
          )}
          <Link href="/dashboard/photographer" className="flex items-center gap-2 text-sm font-medium text-ink hover:text-ink-600 transition-colors">
            Dashboard <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  )
}
