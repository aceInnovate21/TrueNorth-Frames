import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { uploadToR2 } from '@/lib/r2'
import { compressImage, compressVideo, detectType, LIMITS } from '@/lib/compress-media'

export const runtime = 'nodejs'

// POST /api/photographer/groups/messages/upload
// Body: multipart/form-data  { file, group_id }
// Returns: { url, type, name, size }
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const groupId = formData.get('group_id') as string | null

  if (!file) return badRequest('file is required')
  if (!groupId) return badRequest('group_id is required')

  const db = adminDb as any

  // Verify active membership
  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  const { data: membership } = await db
    .from('group_members')
    .select('group_id')
    .eq('group_id', groupId)
    .eq('photographer_id', me.id)
    .is('removed_at', null)
    .is('left_at', null)
    .single()

  if (!membership) return NextResponse.json({ error: 'Not an active member of this group' }, { status: 403 })

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
      finalBuffer = rawBuffer
      finalMime = mimeType
      finalExt = 'pdf'
    }
  } catch (err) {
    console.error('[groups/messages/upload] compress error:', err)
    return serverError('Failed to process file')
  }

  const key = `group-messages/${groupId}/${Date.now()}.${finalExt}`
  let url: string
  try {
    url = await uploadToR2(key, finalBuffer, finalMime)
  } catch (err) {
    console.error('[groups/messages/upload] R2 error:', err)
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
