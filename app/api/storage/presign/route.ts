import { NextRequest, NextResponse } from 'next/server'
import { createPresignedUploadUrl } from '@/lib/r2'
import { getServerSession, unauthorized } from '@/lib/api-helpers'
import { randomUUID } from 'crypto'

const ALLOWED_ENTITY_TYPES = ['portfolio_photo', 'portfolio_video', 'avatar', 'cover'] as const
type EntityType = typeof ALLOWED_ENTITY_TYPES[number]

const CONTENT_TYPE_MAP: Record<EntityType, string[]> = {
  portfolio_photo: ['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  portfolio_video: ['video/mp4', 'video/quicktime', 'video/x-msvideo'],
  avatar: ['image/jpeg', 'image/png', 'image/webp'],
  cover: ['image/jpeg', 'image/png', 'image/webp'],
}

const SIZE_LIMITS: Record<EntityType, number> = {
  portfolio_photo: 5 * 1024 * 1024,   // 5 MB
  portfolio_video: 100 * 1024 * 1024, // 100 MB
  avatar: 3 * 1024 * 1024,            // 3 MB
  cover: 8 * 1024 * 1024,             // 8 MB
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

  if (size_bytes > SIZE_LIMITS[entity_type as EntityType]) {
    return NextResponse.json({ error: `File exceeds size limit for ${entity_type}` }, { status: 400 })
  }

  const ext = content_type.split('/')[1].replace('quicktime', 'mov').replace('x-msvideo', 'avi')
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
