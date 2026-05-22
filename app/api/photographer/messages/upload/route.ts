import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { uploadToR2 } from '@/lib/r2'
import { compressImage, compressVideo, detectType, LIMITS } from '@/lib/compress-media'

export const runtime = 'nodejs'

// POST /api/photographer/messages/upload
// Body: multipart/form-data  { file, conversation_id }
// Returns: { url, type, name, size }
export async function POST(request: NextRequest) {
  const { user } = await getServerSession()
  if (!user) return unauthorized()

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const conversationId = formData.get('conversation_id') as string | null

  if (!file) return badRequest('file is required')
  if (!conversationId) return badRequest('conversation_id is required')

  const mimeType = file.type
  const attachType = detectType(mimeType)
  if (!attachType) return badRequest('Unsupported file type. Only images, video, and PDF are allowed.')

  const limit = LIMITS[attachType]
  if (file.size > limit) {
    return badRequest(`File too large. Max size for ${attachType}: ${Math.round(limit / 1024 / 1024)} MB`)
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer())
  let finalBuffer: Buffer
  let finalMime: string
  let finalExt: string

  try {
    if (attachType === 'image') {
      const result = await compressImage(rawBuffer, mimeType)
      finalBuffer = result.buffer
      finalMime = result.contentType
      finalExt = result.ext
    } else if (attachType === 'video') {
      const result = await compressVideo(rawBuffer, file.name)
      finalBuffer = result.buffer
      finalMime = result.contentType
      finalExt = result.ext
    } else {
      // PDF — no compression, upload as-is
      finalBuffer = rawBuffer
      finalMime = mimeType
      finalExt = 'pdf'
    }
  } catch (err) {
    console.error('[messages/upload] compress error:', err)
    return serverError('Failed to process file')
  }

  const key = `messages/${conversationId}/${Date.now()}.${finalExt}`
  let url: string
  try {
    url = await uploadToR2(key, finalBuffer, finalMime)
  } catch (err) {
    console.error('[messages/upload] R2 error:', err)
    return serverError('Failed to upload file')
  }

  const name = file.name.replace(/\.[^.]+$/, '') + '.' + finalExt

  return NextResponse.json({
    url,
    type: attachType,
    name,
    size: finalBuffer.length,
  })
}
