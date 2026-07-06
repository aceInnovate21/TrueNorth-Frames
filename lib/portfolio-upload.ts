// Client-side portfolio upload helpers, shared by the photographer dashboard.
//
// Photos: compressed to WebP in the browser, then uploaded directly to R2 via a
// presigned URL and registered. Videos: uploaded raw direct-to-R2 via presign
// (bypasses Vercel's body limit) and registered — no transcode.
//
// Both paths flow through /api/storage/presign, which enforces the per-
// photographer storage quota.

import { compressImageToWebp } from './client-compress'

function xhrPut(url: string, blob: Blob, contentType: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.addEventListener('load', () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`))
    )
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')))
    xhr.send(blob)
  })
}

async function presign(entityType: string, contentType: string, sizeBytes: number) {
  const res = await fetch('/api/storage/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity_type: entityType, content_type: contentType, size_bytes: sizeBytes }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? `Upload failed (${res.status})`)
  }
  return res.json() as Promise<{ upload_url: string; key: string; asset_id: string }>
}

const VIDEO_TYPE_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
  webm: 'video/webm', mkv: 'video/x-matroska',
}

/** Compress → presign → upload → register a portfolio photo. Throws on failure. */
export async function uploadPortfolioPhoto(file: File, albumId: string | null): Promise<any> {
  const { blob } = await compressImageToWebp(file, { maxDim: 2048, quality: 0.82 })
  const { upload_url, key, asset_id } = await presign('portfolio_photo', 'image/webp', blob.size)
  await xhrPut(upload_url, blob, 'image/webp')
  const res = await fetch('/api/photographer/photos/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset_id, key, album_id: albumId }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to save photo')
  }
  return res.json()
}

export interface VideoMeta {
  title?: string | null
  tags?: string[]
  video_taken_month?: number | null
  video_taken_year?: number | null
}

/** Presign → upload raw → register a portfolio video (no transcode). Throws on failure. */
export async function uploadPortfolioVideo(file: File, albumId: string | null, meta: VideoMeta = {}): Promise<any> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
  const contentType = file.type || VIDEO_TYPE_BY_EXT[ext] || ''
  if (!contentType.startsWith('video/')) {
    throw new Error('Unsupported video format. Use MP4, MOV, AVI, WEBM, or MKV.')
  }
  const { upload_url, key, asset_id } = await presign('portfolio_video', contentType, file.size)
  await xhrPut(upload_url, file, contentType)
  const res = await fetch('/api/photographer/videos/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ asset_id, key, album_id: albumId, ...meta }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Failed to save video')
  }
  return res.json()
}
