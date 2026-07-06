import { NextRequest, NextResponse } from 'next/server'
import { createPresignedUploadUrl } from '@/lib/r2'
import { getServerSession, unauthorized } from '@/lib/api-helpers'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { checkQuota } from '@/lib/storage-quota'
import { randomUUID } from 'crypto'

const ALLOWED_ENTITY_TYPES = ['portfolio_photo', 'portfolio_video', 'avatar', 'cover'] as const
type EntityType = typeof ALLOWED_ENTITY_TYPES[number]

const CONTENT_TYPE_MAP: Record<EntityType, string[]> = {
  // Photos are compressed to WebP in the browser before upload.
  portfolio_photo: ['image/webp', 'image/jpeg', 'image/png', 'image/heic', 'image/heif'],
  portfolio_video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'],
  avatar: ['image/webp', 'image/jpeg', 'image/png'],
  cover: ['image/webp', 'image/jpeg', 'image/png'],
}

const SIZE_LIMITS: Record<EntityType, number> = {
  portfolio_photo: PLATFORM_CONFIG.max_compressed_photo_bytes, // compressed artefact ceiling
  portfolio_video: PLATFORM_CONFIG.max_video_bytes,
  avatar: PLATFORM_CONFIG.max_avatar_bytes,
  cover: PLATFORM_CONFIG.max_cover_bytes,
}

export async function POST(request: NextRequest) {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { entity_type, content_type, size_bytes } = body

  if (!ALLOWED_ENTITY_TYPES.includes(entity_type)) {
    return NextResponse.json({ error: 'Invalid entity_type' }, { status: 400 })
  }

  if (!CONTENT_TYPE_MAP[entity_type as EntityType].includes(content_type)) {
    return NextResponse.json({ error: `Invalid content_type for ${entity_type}` }, { status: 400 })
  }

  const incomingBytes = Number(size_bytes) || 0
  if (incomingBytes <= 0) {
    return NextResponse.json({ error: 'size_bytes is required' }, { status: 400 })
  }
  if (incomingBytes > SIZE_LIMITS[entity_type as EntityType]) {
    return NextResponse.json({ error: `File exceeds size limit for ${entity_type}` }, { status: 400 })
  }

  // Per-photographer storage quota (portfolio + profile assets).
  const quotaError = await checkQuota(db, user.id, incomingBytes)
  if (quotaError) {
    return NextResponse.json({ error: quotaError }, { status: 413 })
  }

  const ext = content_type.split('/')[1]
    .replace('quicktime', 'mov')
    .replace('x-msvideo', 'avi')
    .replace('x-matroska', 'mkv')
  const key = `${entity_type}s/${user.id}/${randomUUID()}.${ext}`
  const expirySeconds = 900 // 15 min — matches platform_config r2_presigned_url_expiry_seconds

  const uploadUrl = await createPresignedUploadUrl(key, content_type, expirySeconds)

  // Register the asset as an orphan — cron will purge if never linked
  const orphanExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour
  const insertPayload = {
    owner_id: user.id,
    bucket: process.env.R2_BUCKET_NAME!,
    key,
    content_type,
    size_bytes,
    entity_type,
    orphan_expires_at: orphanExpiresAt,
  }

  const { data: asset, error } = await db
    .from('storage_assets')
    .insert(insertPayload)
    .select('id')
    .single()

  if (error || !asset) {
    return NextResponse.json({ error: 'Failed to register asset' }, { status: 500 })
  }

  return NextResponse.json({ upload_url: uploadUrl, key, asset_id: asset.id })
}
