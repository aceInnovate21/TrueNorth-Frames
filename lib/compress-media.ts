import sharp from 'sharp'
import ffmpeg from 'fluent-ffmpeg'
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg'
import { Readable } from 'stream'
import os from 'os'
import path from 'path'
import fs from 'fs'

ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// ─── Image compression (WhatsApp-style) ──────────────────────────────────────
// Target: max 1600px on longest side, quality 82 WebP, ≤ ~200 KB typical
export async function compressImage(buffer: Buffer, mimeType: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const img = sharp(buffer)
  const meta = await img.metadata()
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0)
  const resize = longest > 1600 ? { width: 1600, height: 1600, fit: 'inside' as const } : undefined

  const compressed = await img
    .rotate() // auto-orient from EXIF
    .resize(resize)
    .webp({ quality: 82, effort: 4 })
    .toBuffer()

  return { buffer: compressed, contentType: 'image/webp', ext: 'webp' }
}

// ─── Video compression (ffmpeg) ───────────────────────────────────────────────
// Target: H.264 CRF 28, scale to max 720p, AAC audio 128k
export async function compressVideo(buffer: Buffer, originalName: string): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const tmpIn = path.join(os.tmpdir(), `msg-in-${Date.now()}${path.extname(originalName)}`)
  const tmpOut = path.join(os.tmpdir(), `msg-out-${Date.now()}.mp4`)

  fs.writeFileSync(tmpIn, buffer)

  await new Promise<void>((resolve, reject) => {
    ffmpeg(tmpIn)
      .outputOptions([
        '-c:v libx264',
        '-crf 28',
        '-preset fast',
        '-vf scale=\'min(1280,iw)\':-2',
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart',
        '-y',
      ])
      .output(tmpOut)
      .on('end', () => resolve())
      .on('error', reject)
      .run()
  })

  const out = fs.readFileSync(tmpOut)
  fs.unlinkSync(tmpIn)
  fs.unlinkSync(tmpOut)

  return { buffer: out, contentType: 'video/mp4', ext: 'mp4' }
}

// ─── Size limits (bytes) ──────────────────────────────────────────────────────
export const LIMITS = {
  image: 8 * 1024 * 1024,   //  8 MB
  video: 16 * 1024 * 1024,  // 16 MB
  pdf:   10 * 1024 * 1024,  // 10 MB
}

export function detectType(mimeType: string): 'image' | 'video' | 'pdf' | null {
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType === 'application/pdf') return 'pdf'
  return null
}
