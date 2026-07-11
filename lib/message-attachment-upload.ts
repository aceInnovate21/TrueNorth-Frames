// Client-side message attachment pipeline (shared by client + photographer + group).
//
// Images  → compressed to WebP in-browser (HEIC-safe), tiny.
// Video   → uploaded raw (no transcode), size-capped by the presign endpoint.
// PDF     → validated by magic bytes, uploaded as-is.
//
// Everything goes presign → direct PUT into the PRIVATE R2 bucket (bypasses the
// Vercel body limit), with real upload progress and cancel support.

import { compressImageToWebp } from './client-compress'

export type AttachType = 'image' | 'video' | 'pdf'

export interface UploadedAttachment {
  key: string
  type: AttachType
  name: string
  size: number
}

export interface MessageTarget {
  type: 'conversation' | 'group'
  id: string
}

const VIDEO_TYPE_BY_EXT: Record<string, string> = {
  mp4: 'video/mp4', mov: 'video/quicktime', avi: 'video/x-msvideo',
  webm: 'video/webm', mkv: 'video/x-matroska',
}

export function detectAttachType(file: File): AttachType | null {
  if (file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)) return 'image'
  if (file.type.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name)) return 'video'
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name)) return 'pdf'
  return null
}

async function looksLikePdf(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer())
  // "%PDF-"
  return head[0] === 0x25 && head[1] === 0x50 && head[2] === 0x44 && head[3] === 0x46
}

function xhrPut(
  url: string, blob: Blob, contentType: string,
  onProgress?: (pct: number) => void, signal?: AbortSignal
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', contentType)
    xhr.upload.addEventListener('progress', e => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
    })
    xhr.addEventListener('load', () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed (${xhr.status})`))
    )
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
    xhr.addEventListener('abort', () => reject(new DOMException('Upload cancelled', 'AbortError')))
    if (signal) {
      if (signal.aborted) { xhr.abort(); return }
      signal.addEventListener('abort', () => xhr.abort())
    }
    xhr.send(blob)
  })
}

export async function uploadMessageAttachment(
  file: File,
  target: MessageTarget,
  opts?: { onProgress?: (pct: number) => void; signal?: AbortSignal }
): Promise<UploadedAttachment> {
  const attachType = detectAttachType(file)
  if (!attachType) throw new Error('Unsupported file. Please send an image, video, or PDF.')

  let blob: Blob = file
  let contentType = file.type
  let ext = ''
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'attachment'

  if (attachType === 'image') {
    const c = await compressImageToWebp(file, { maxDim: 1600, quality: 0.82 })
    blob = c.blob; contentType = 'image/webp'; ext = 'webp'
  } else if (attachType === 'pdf') {
    if (!(await looksLikePdf(file))) throw new Error("That doesn't look like a valid PDF file.")
    contentType = 'application/pdf'; ext = 'pdf'
  } else {
    const fileExt = file.name.split('.').pop()?.toLowerCase() ?? ''
    contentType = file.type || VIDEO_TYPE_BY_EXT[fileExt] || 'video/mp4'
    ext = (contentType.split('/')[1] || 'mp4').replace('quicktime', 'mov').replace('x-msvideo', 'avi').replace('x-matroska', 'mkv')
  }

  const presignRes = await fetch('/api/messages/attachment/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_type: target.type, target_id: target.id,
      attach_type: attachType, content_type: contentType, size_bytes: blob.size,
    }),
  })
  if (!presignRes.ok) {
    const e = await presignRes.json().catch(() => ({}))
    throw new Error(e.error ?? `Upload failed (${presignRes.status})`)
  }
  const { upload_url, key } = await presignRes.json()

  await xhrPut(upload_url, blob, contentType, opts?.onProgress, opts?.signal)

  return { key, type: attachType, name: `${baseName}.${ext}`, size: blob.size }
}
