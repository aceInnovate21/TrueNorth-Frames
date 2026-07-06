'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  ArrowLeft, ImagePlus, X, Star, CheckCircle2, AlertCircle,
  ChevronRight, FolderPlus, Pencil, Trash2, Video, Play,
  FolderOpen, Image as ImageIcon, Plus, Upload, CheckCheck,
} from 'lucide-react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { compressImageToWebp } from '@/lib/client-compress'
import type { StorageUsage } from '@/lib/storage-quota'

const MAX_ALBUMS           = PLATFORM_CONFIG.max_albums_per_photographer
const MAX_PHOTOS_TOTAL     = PLATFORM_CONFIG.max_photos_per_photographer
const MAX_VIDEOS_TOTAL     = PLATFORM_CONFIG.max_videos_per_photographer
const MAX_VIDEOS_PER_ALBUM = PLATFORM_CONFIG.max_videos_per_album
const MAX_VIDEO_BYTES      = PLATFORM_CONFIG.max_video_bytes
const MAX_VIDEO_MB         = MAX_VIDEO_BYTES / 1024 / 1024
const MAX_ALBUM_NAME       = PLATFORM_CONFIG.max_album_name_length
const MAX_CAPTION          = PLATFORM_CONFIG.max_photo_caption_length
const MAX_VIDEO_TITLE      = PLATFORM_CONFIG.max_video_title_length

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]

const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska']
const ACCEPTED_VIDEO_EXT   = '.mp4,.mov,.avi,.webm,.mkv'
const ACCEPTED_PHOTO_EXT   = 'image/*,.heic,.heif'

function fmtStorage(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 ** 3)).toFixed(2)} GB`
  return `${Math.max(0, Math.round(bytes / (1024 * 1024)))} MB`
}

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
  tags: string[]
  video_taken_month: number | null
  video_taken_year: number | null
}

interface Album {
  id: string
  title: string
  photos: PortfolioPhoto[]
  videos: PortfolioVideo[]
}

// ─── Upload state ─────────────────────────────────────────────────────────────

type VideoUploadPhase = 'idle' | 'uploading' | 'metadata' | 'saving' | 'done'

interface VideoUploadState {
  phase: VideoUploadPhase
  progress: number          // 0–100 during 'uploading'
  error: string | null
  // filled once upload completes, used in metadata step
  assetId: string | null
  key: string | null
  fileName: string | null
}

const INITIAL_UPLOAD_STATE: VideoUploadState = {
  phase: 'idle', progress: 0, error: null,
  assetId: null, key: null, fileName: null,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function totalPhotos(albums: Album[]) { return albums.reduce((n, a) => n + a.photos.length, 0) }
function totalVideos(albums: Album[]) { return albums.reduce((n, a) => n + a.videos.length, 0) }

type UploadedPhoto = { id: string; src: string; caption: string; isCover: boolean; storage_asset_id: string }

// Photo pipeline: compress to WebP in-browser → presigned direct-to-R2 upload → register.
// This keeps large/HEIC originals off the serverless function (Vercel body limit)
// and stores only the small optimized derivative.
async function uploadPhoto(
  file: File, albumId: string
): Promise<UploadedPhoto | { error: string } | null> {
  // 1. Compress client-side (handles HEIC/HEIF too)
  let compressed
  try {
    compressed = await compressImageToWebp(file, { maxDim: 2048, quality: 0.82 })
  } catch (e: any) {
    return { error: e?.message ?? `Could not process ${file.name}.` }
  }

  try {
    // 2. Get a presigned URL (also enforces the storage quota)
    const presignRes = await fetch('/api/storage/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_type: 'portfolio_photo', content_type: 'image/webp', size_bytes: compressed.blob.size }),
    })
    if (!presignRes.ok) {
      const err = await presignRes.json().catch(() => ({}))
      return { error: err.error ?? `Upload failed (${presignRes.status})` }
    }
    const { upload_url, key, asset_id } = await presignRes.json()

    // 3. Upload the compressed blob straight to R2
    await xhrUpload(upload_url, compressed.blob, 'image/webp', () => {})

    // 4. Register the photo row + claim the asset
    const regRes = await fetch('/api/photographer/photos/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id, key, album_id: albumId }),
    })
    if (!regRes.ok) {
      const err = await regRes.json().catch(() => ({}))
      return { error: err.error ?? 'Failed to save photo' }
    }
    return regRes.json()
  } catch (e: any) {
    return { error: e?.message ?? `Failed to upload ${file.name}.` }
  }
}

// XHR-based upload so we get real upload progress
function xhrUpload(url: string, file: Blob, contentType: string, onProgress: (pct: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve()
      else {
        console.error('[R2 XHR] upload failed', xhr.status, xhr.responseText)
        reject(new Error(`R2 upload failed: ${xhr.status}`))
      }
    })
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))
    xhr.send(file)
  })
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

function VideoCard({ video, onRemove }: { video: PortfolioVideo; onRemove: () => void }) {
  const [hovered, setHovered] = useState(false)
  const label = [
    video.title || null,
    video.video_taken_month && video.video_taken_year
      ? `${MONTHS[video.video_taken_month - 1]} ${video.video_taken_year}`
      : null,
  ].filter(Boolean).join(' · ')

  return (
    <div
      className="relative bg-black rounded-2xl overflow-hidden group"
      style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-video">
        <video
          src={video.src}
          className="w-full h-full object-cover"
          preload="metadata"
          muted
          playsInline
        />
        {/* Play overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${hovered ? 'opacity-100' : 'opacity-80'}`}>
          <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
            <Play className="w-4 h-4 text-ink fill-ink ml-0.5" />
          </div>
        </div>
        {/* Delete button */}
        <button
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
        {/* Tags badge */}
        {video.tags?.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {video.tags.slice(0, 2).map(tag => (
              <span key={tag} className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">{tag}</span>
            ))}
            {video.tags.length > 2 && (
              <span className="bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full">+{video.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>
      {label && (
        <div className="px-3 py-2">
          <p className="text-xs text-ink-400 truncate">{label}</p>
        </div>
      )}
    </div>
  )
}

// ─── Video upload progress overlay ────────────────────────────────────────────

function UploadProgressBar({ progress }: { progress: number }) {
  return (
    <div className="w-full bg-ink-100 rounded-full h-2 overflow-hidden">
      <div
        className="bg-ink h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

function StorageMeter({ usage }: { usage: StorageUsage | null }) {
  if (!usage) return null
  const near = usage.pct >= 80
  const full = usage.pct >= 100
  const barColor = full ? 'bg-red-500' : near ? 'bg-amber-500' : 'bg-ink'
  return (
    <div className="bg-white rounded-xl px-4 py-3 mb-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-ink">Storage</p>
        <p className={`text-xs font-medium ${full ? 'text-red-500' : near ? 'text-amber-600' : 'text-ink-400'}`}>
          {fmtStorage(usage.used_bytes)} of {fmtStorage(usage.quota_bytes)} used
        </p>
      </div>
      <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(100, Math.max(2, usage.pct))}%` }} />
      </div>
      <div className="flex items-center gap-3 mt-2 text-[10px] text-ink-300">
        <span>Photos {fmtStorage(usage.photos_bytes)}</span>
        <span>Videos {fmtStorage(usage.videos_bytes)}</span>
        {usage.profile_bytes > 0 && <span>Profile {fmtStorage(usage.profile_bytes)}</span>}
        {near && (
          <span className={`ml-auto font-semibold ${full ? 'text-red-500' : 'text-amber-600'}`}>
            {full ? 'Quota full — delete to free space' : 'Almost full'}
          </span>
        )}
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const [albums, setAlbums]           = useState<Album[]>([])
  const [loading, setLoading]         = useState(true)
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null)

  const [albumModal, setAlbumModal] = useState<{ mode: 'create' | 'rename'; albumId?: string } | null>(null)
  const [albumDraft, setAlbumDraft] = useState('')

  const [editingCaption, setEditingCaption] = useState<{ albumId: string; photoId: string } | null>(null)
  const [captionDraft, setCaptionDraft]     = useState('')
  const [savingCaption, setSavingCaption]   = useState(false)
  const [savedCaption, setSavedCaption]     = useState<string | null>(null)

  const [photoError, setPhotoError] = useState<string | null>(null)
  const [uploading, setUploading]   = useState(false)

  // Video upload state machine
  const [videoUpload, setVideoUpload] = useState<VideoUploadState>(INITIAL_UPLOAD_STATE)

  // Metadata form (filled after upload completes)
  const [videoTitle, setVideoTitle]   = useState('')
  const [videoTagInput, setVideoTagInput] = useState('')
  const [videoTags, setVideoTags]     = useState<string[]>([])
  const [videoMonth, setVideoMonth]   = useState<number | ''>('')
  const [videoYear, setVideoYear]     = useState<number | ''>('')
  const [savingMeta, setSavingMeta]   = useState(false)

  const [storage, setStorage] = useState<StorageUsage | null>(null)
  const refreshStorage = useCallback(() => {
    fetch('/api/photographer/storage')
      .then(r => (r.ok ? r.json() : null))
      .then(d => { if (d) setStorage(d) })
      .catch(() => {})
  }, [])

  const photoInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const openAlbum = openAlbumId ? albums.find(a => a.id === openAlbumId) ?? null : null
  const totalP    = totalPhotos(albums)
  const totalV    = totalVideos(albums)

  useEffect(() => {
    fetch('/api/photographer/albums')
      .then(r => r.json())
      .then(data => setAlbums(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
    refreshStorage()
  }, [refreshStorage])

  // ─── Album actions ────────────────────────────────────────────────────────

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

  // ─── Photo upload ─────────────────────────────────────────────────────────

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || !openAlbumId) return

    // No source size limit — images are compressed in the browser before upload.
    const all = Array.from(files).filter(
      f => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name)
    )
    if (all.length === 0) { setPhotoError('Please choose image files.'); return }
    if (totalP + all.length > MAX_PHOTOS_TOTAL) {
      setPhotoError(`Portfolio limit is ${MAX_PHOTOS_TOTAL} photos. You have ${MAX_PHOTOS_TOTAL - totalP} slot(s) remaining.`)
      return
    }

    setPhotoError(null)
    setUploading(true)
    for (const file of all) {
      const result = await uploadPhoto(file, openAlbumId)
      if (!result) { setPhotoError(`Failed to upload ${file.name}. Try again.`); continue }
      if ('error' in result) { setPhotoError(result.error); continue }
      const photo = result
      setAlbums(prev => prev.map(a => {
        if (a.id !== openAlbumId) return a
        const photos = a.photos.length === 0
          ? [{ ...photo, isCover: true }]
          : [...a.photos, { ...photo, isCover: false }]
        return { ...a, photos }
      }))
    }
    setUploading(false)
    refreshStorage()
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
      refreshStorage()
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

  // ─── Video upload — presigned R2 ──────────────────────────────────────────

  function resetVideoUpload() {
    setVideoUpload(INITIAL_UPLOAD_STATE)
    setVideoTitle('')
    setVideoTagInput('')
    setVideoTags([])
    setVideoMonth('')
    setVideoYear('')
    if (videoInputRef.current) videoInputRef.current.value = ''
  }

  async function handleVideoFile(file: File) {
    if (!openAlbumId) return

    // Normalise content type — some browsers/iOS return empty string or non-standard types
    const rawType = file.type || ''
    const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
    const contentType = rawType || (
      ext === 'mp4'  ? 'video/mp4' :
      ext === 'mov'  ? 'video/quicktime' :
      ext === 'avi'  ? 'video/x-msvideo' :
      ext === 'webm' ? 'video/webm' :
      ext === 'mkv'  ? 'video/x-matroska' : ''
    )

    // Client-side guards
    if (!ACCEPTED_VIDEO_TYPES.includes(contentType)) {
      setVideoUpload(s => ({ ...s, error: 'Supported video formats: MP4, MOV, AVI, WEBM, MKV.' }))
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setVideoUpload(s => ({ ...s, error: `Video exceeds the ${MAX_VIDEO_MB} MB limit. Please trim or export at a lower resolution.` }))
      return
    }

    const albumVideos = openAlbum?.videos.length ?? 0
    if (albumVideos >= MAX_VIDEOS_PER_ALBUM) {
      setVideoUpload(s => ({ ...s, error: `This album already has the maximum of ${MAX_VIDEOS_PER_ALBUM} videos.` }))
      return
    }
    if (totalV >= MAX_VIDEOS_TOTAL) {
      setVideoUpload(s => ({ ...s, error: `You've reached the maximum of ${MAX_VIDEOS_TOTAL} videos across all albums.` }))
      return
    }

    // Show modal immediately so user sees feedback right away
    setVideoUpload({ phase: 'uploading', progress: 0, error: null, assetId: null, key: null, fileName: file.name })

    try {
      // Step 1: get presigned URL + register orphan asset
      const presignRes = await fetch('/api/storage/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: 'portfolio_video', content_type: contentType, size_bytes: file.size }),
      })
      if (!presignRes.ok) {
        const err = await presignRes.json().catch(() => ({}))
        throw new Error(err.error ?? `Failed to get upload URL (${presignRes.status})`)
      }
      const { upload_url, key, asset_id } = await presignRes.json()

      // Show at least 10% so the bar is visible even on fast connections
      setVideoUpload(s => ({ ...s, progress: 10 }))

      // Step 2: upload directly to R2 with progress
      await xhrUpload(upload_url, file, contentType, pct =>
        // Map XHR progress (0–100) into the 10–100 range so bar never goes backwards
        setVideoUpload(s => ({ ...s, progress: Math.max(10, pct) }))
      )

      // Step 3: move to metadata step
      setVideoUpload(s => ({ ...s, phase: 'metadata', progress: 100, assetId: asset_id, key }))

    } catch (err: any) {
      console.error('[video upload error]', err)
      setVideoUpload(s => ({ ...s, phase: 'idle', error: err.message ?? 'Upload failed. Please try again.' }))
    }
  }

  function handleVideoTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if ((e.key === 'Enter' || e.key === ',') && videoTagInput.trim()) {
      e.preventDefault()
      const tag = videoTagInput.trim().toLowerCase()
      if (!videoTags.includes(tag) && videoTags.length < 10) {
        setVideoTags(prev => [...prev, tag])
      }
      setVideoTagInput('')
    }
    if (e.key === 'Backspace' && !videoTagInput && videoTags.length > 0) {
      setVideoTags(prev => prev.slice(0, -1))
    }
  }

  async function saveVideoMetadata() {
    if (!openAlbumId || !videoUpload.assetId || !videoUpload.key) return
    setSavingMeta(true)
    setVideoUpload(s => ({ ...s, phase: 'saving' }))

    try {
      const res = await fetch('/api/photographer/videos/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          asset_id:          videoUpload.assetId,
          key:               videoUpload.key,
          album_id:          openAlbumId,
          title:             videoTitle.trim() || null,
          tags:              videoTags,
          video_taken_month: videoMonth || null,
          video_taken_year:  videoYear  || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Failed to save video')
      }

      const newVideo: PortfolioVideo = await res.json()
      setAlbums(prev => prev.map(a =>
        a.id !== openAlbumId ? a : { ...a, videos: [...a.videos, newVideo] }
      ))
      refreshStorage()
      setVideoUpload(s => ({ ...s, phase: 'done' }))
      setTimeout(() => resetVideoUpload(), 1800)

    } catch (err: any) {
      setVideoUpload(s => ({ ...s, phase: 'metadata', error: err.message ?? 'Failed to save. Try again.' }))
    } finally {
      setSavingMeta(false)
    }
  }

  async function removeVideo(albumId: string, videoId: string) {
    const res = await fetch(`/api/photographer/videos?id=${videoId}`, { method: 'DELETE' })
    if (res.ok) {
      setAlbums(prev => prev.map(a =>
        a.id !== albumId ? a : { ...a, videos: a.videos.filter(v => v.id !== videoId) }
      ))
      refreshStorage()
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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

      {/* ── Album / Rename modal ──────────────────────────────────────────── */}
      {albumModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <h3 className="font-semibold text-ink text-base mb-4">
              {albumModal.mode === 'create' ? 'New album' : 'Rename album'}
            </h3>
            <input
              type="text" value={albumDraft}
              onChange={e => setAlbumDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') commitAlbumModal() }}
              placeholder="Album name…" autoFocus maxLength={MAX_ALBUM_NAME}
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

      {/* ── Caption modal ─────────────────────────────────────────────────── */}
      {editingCaption && openAlbum && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm p-5" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
            <p className="text-sm font-semibold text-ink mb-3">Edit caption</p>
            <input
              type="text" value={captionDraft}
              onChange={e => setCaptionDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveCaption() }}
              placeholder="Add a caption…" autoFocus maxLength={MAX_CAPTION}
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

      {/* ── Video upload modal (uploading + metadata + done) ──────────────── */}
      {videoUpload.phase !== 'idle' && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.22)' }}>

            {/* Uploading */}
            {videoUpload.phase === 'uploading' && (
              <>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-ink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Upload className="w-5 h-5 text-ink-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink text-sm">Uploading video…</p>
                    <p className="text-ink-400 text-xs truncate">{videoUpload.fileName}</p>
                  </div>
                  <span className="ml-auto font-bold text-ink text-sm tabular-nums">{videoUpload.progress}%</span>
                </div>
                <UploadProgressBar progress={videoUpload.progress} />
                <p className="text-ink-300 text-xs mt-3">
                  Going directly to Cloudflare R2 — do not close this tab.
                </p>
              </>
            )}

            {/* Metadata */}
            {(videoUpload.phase === 'metadata' || videoUpload.phase === 'saving') && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="font-semibold text-ink text-sm">Video uploaded</p>
                    <p className="text-ink-400 text-xs mt-0.5">Add details to help clients find your work</p>
                  </div>
                  <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                </div>

                {videoUpload.error && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-3 py-2.5 mb-4">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {videoUpload.error}
                  </div>
                )}

                {/* Title */}
                <label className="block text-xs font-medium text-ink-500 mb-1">Title <span className="text-ink-200">(optional)</span></label>
                <input
                  type="text" value={videoTitle}
                  onChange={e => setVideoTitle(e.target.value)}
                  placeholder="e.g. Summer wedding highlight reel"
                  maxLength={MAX_VIDEO_TITLE}
                  className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all mb-4"
                />

                {/* Tags */}
                <label className="block text-xs font-medium text-ink-500 mb-1">Tags <span className="text-ink-200">(optional · press Enter to add)</span></label>
                <div className="flex flex-wrap gap-1.5 border border-ink-100 rounded-xl px-3 py-2 mb-1 focus-within:border-ink transition-all min-h-[42px]">
                  {videoTags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-ink-50 text-ink text-xs px-2 py-0.5 rounded-full">
                      {tag}
                      <button onClick={() => setVideoTags(prev => prev.filter(t => t !== tag))} className="hover:text-red-500 transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text" value={videoTagInput}
                    onChange={e => setVideoTagInput(e.target.value)}
                    onKeyDown={handleVideoTagKeyDown}
                    placeholder={videoTags.length === 0 ? 'wedding, portrait, outdoor…' : ''}
                    className="flex-1 min-w-[120px] text-sm text-ink outline-none bg-transparent"
                    disabled={videoTags.length >= 10}
                  />
                </div>
                <p className="text-ink-200 text-xs mb-4">{videoTags.length}/10 tags</p>

                {/* Month + Year */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div>
                    <label className="block text-xs font-medium text-ink-500 mb-1">Month <span className="text-ink-200">(optional)</span></label>
                    <select
                      value={videoMonth}
                      onChange={e => setVideoMonth(e.target.value ? Number(e.target.value) : '')}
                      className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all bg-white"
                    >
                      <option value="">Month</option>
                      {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-ink-500 mb-1">Year <span className="text-ink-200">(optional)</span></label>
                    <input
                      type="number" value={videoYear}
                      onChange={e => setVideoYear(e.target.value ? Number(e.target.value) : '')}
                      placeholder="2024" min={2000} max={new Date().getFullYear()}
                      className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={saveVideoMetadata}
                    disabled={savingMeta}
                    className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50"
                  >
                    {savingMeta ? 'Saving…' : 'Save video'}
                  </button>
                  <button
                    onClick={resetVideoUpload}
                    disabled={savingMeta}
                    className="border border-ink-100 text-ink-400 text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-ink-50 transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* Done */}
            {videoUpload.phase === 'done' && (
              <div className="text-center py-4">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCheck className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="font-semibold text-ink text-sm">Video added to your portfolio</p>
                <p className="text-ink-300 text-xs mt-1">It will appear on your public profile immediately.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
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
                <p className="text-ink-300 text-sm">Up to {MAX_ALBUMS} albums · {MAX_PHOTOS_TOTAL} photos · {MAX_VIDEOS_TOTAL} videos</p>
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

            <StorageMeter usage={storage} />

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

        {/* ── Album detail ─────────────────────────────────────────────────── */}
        {openAlbum && (
          <>
            {/* Hidden file inputs */}
            <input ref={photoInputRef} type="file" accept={ACCEPTED_PHOTO_EXT} multiple className="hidden"
              onChange={e => handlePhotoFiles(e.target.files)} />
            <input ref={videoInputRef} type="file" accept={ACCEPTED_VIDEO_EXT} className="hidden"
              onChange={e => { if (e.target.files?.[0]) handleVideoFile(e.target.files[0]) }} />

            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="font-serif text-2xl font-bold text-ink mb-1">{openAlbum.title}</h1>
                <p className="text-ink-300 text-sm">
                  {openAlbum.photos.length} photo{openAlbum.photos.length !== 1 ? 's' : ''} · {openAlbum.videos.length} video{openAlbum.videos.length !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {openAlbum.videos.length < MAX_VIDEOS_PER_ALBUM && totalV < MAX_VIDEOS_TOTAL && (
                  <button
                    onClick={() => { resetVideoUpload(); videoInputRef.current?.click() }}
                    disabled={videoUpload.phase !== 'idle'}
                    className="flex items-center gap-1.5 border border-ink-100 text-ink text-xs font-semibold px-3 py-2 rounded-xl hover:bg-ink-50 transition-colors disabled:opacity-40"
                  >
                    <Video className="w-3.5 h-3.5" /> Add video
                  </button>
                )}
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
            </div>

            {/* Photo error */}
            {photoError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {photoError}
                <button onClick={() => setPhotoError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* Video error (when idle) */}
            {videoUpload.phase === 'idle' && videoUpload.error && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {videoUpload.error}
                <button onClick={() => setVideoUpload(s => ({ ...s, error: null }))} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
              </div>
            )}

            {/* ── Photos grid ──────────────────────────────────────────────── */}
            {openAlbum.photos.length === 0 && openAlbum.videos.length === 0 ? (
              <div onClick={() => photoInputRef.current?.click()}
                className="border-2 border-dashed border-ink-200 rounded-2xl p-12 text-center cursor-pointer hover:border-ink-400 hover:bg-ink-50 transition-all mb-6">
                <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ImagePlus className="w-6 h-6 text-ink-400" />
                </div>
                <p className="font-semibold text-ink text-sm mb-1">Click to upload photos</p>
                <p className="text-ink-300 text-xs">JPG, PNG, WEBP, HEIC · any size, optimized automatically</p>
              </div>
            ) : (
              <>
                {openAlbum.photos.length > 0 && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">Photos</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {openAlbum.photos.map(photo => (
                        <PhotoCard
                          key={photo.id} photo={photo}
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
                  </div>
                )}

                {/* ── Videos grid ──────────────────────────────────────────── */}
                {(openAlbum.videos.length > 0 || openAlbum.videos.length < MAX_VIDEOS_PER_ALBUM) && (
                  <div className="mb-6">
                    <p className="text-xs font-semibold text-ink-300 uppercase tracking-wide mb-3">Videos</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {openAlbum.videos.map(video => (
                        <VideoCard
                          key={video.id} video={video}
                          onRemove={() => removeVideo(openAlbum.id, video.id)}
                        />
                      ))}
                      {openAlbum.videos.length < MAX_VIDEOS_PER_ALBUM && totalV < MAX_VIDEOS_TOTAL && (
                        <button
                          onClick={() => { resetVideoUpload(); videoInputRef.current?.click() }}
                          disabled={videoUpload.phase !== 'idle'}
                          className="aspect-video border-2 border-dashed border-ink-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-ink-400 hover:bg-ink-50 transition-all disabled:opacity-40"
                        >
                          <Video className="w-7 h-7 text-ink-300" />
                          <span className="text-sm text-ink-300 font-medium">Add video</span>
                          <span className="text-xs text-ink-200">MP4, MOV, WEBM · max {MAX_VIDEO_MB} MB</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {openAlbum.photos.length > 0 && openAlbum.photos.length < 6 && (
              <div className="mt-2 bg-ink rounded-2xl p-5">
                <p className="text-white font-semibold text-sm mb-1">
                  Add {6 - openAlbum.photos.length} more photo{6 - openAlbum.photos.length !== 1 ? 's' : ''}
                </p>
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
