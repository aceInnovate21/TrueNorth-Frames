import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { uploadToR2 } from '@/lib/r2'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { randomUUID } from 'crypto'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// POST /api/photographer/photos/upload
// multipart/form-data: file + optional album_id (omit for standalone photo)
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  // Check total photo limit
  const { count } = await db
    .from('portfolio_photos')
    .select('id', { count: 'exact', head: true })
    .eq('photographer_id', photographerId)

  if ((count ?? 0) >= PLATFORM_CONFIG.max_photos_per_photographer) {
    return badRequest(`Maximum ${PLATFORM_CONFIG.max_photos_per_photographer} photos allowed`)
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const albumId = (formData.get('album_id') as string | null) || null

  if (!file) return badRequest('file is required')
  if (!file.type.startsWith('image/')) return badRequest('Only image files are allowed')
  if (file.size > PLATFORM_CONFIG.max_photo_bytes) {
    return badRequest(`File exceeds ${PLATFORM_CONFIG.max_photo_bytes / 1024 / 1024} MB limit`)
  }

  // If album_id provided, verify it belongs to this photographer
  if (albumId) {
    const { data: album } = await db
      .from('portfolio_albums')
      .select('id')
      .eq('id', albumId)
      .eq('photographer_id', photographerId)
      .single()
    if (!album) return notFound('Album not found')
  }

  // Upload to R2
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const key = `portfolio_photos/${user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await uploadToR2(key, buffer, file.type)
  } catch {
    return serverError('Failed to upload to storage')
  }

  // Register storage_asset
  const orphanExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const { data: asset, error: assetError } = await db
    .from('storage_assets')
    .insert({
      owner_id: user.id,
      bucket: process.env.R2_BUCKET_NAME!,
      key,
      content_type: file.type,
      size_bytes: file.size,
      entity_type: 'portfolio_photo',
      orphan_expires_at: orphanExpiresAt,
    })
    .select('id')
    .single()

  if (assetError || !asset) return serverError('Failed to register asset')

  // Get next sort_order (scoped to album or standalone)
  const sortQuery = db
    .from('portfolio_photos')
    .select('sort_order')
    .eq('photographer_id', photographerId)
    .order('sort_order', { ascending: false })
    .limit(1)

  if (albumId) {
    sortQuery.eq('album_id', albumId)
  } else {
    sortQuery.is('album_id', null)
  }

  const { data: existing } = await sortQuery
  const sortOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  // Register portfolio_photo
  const insertData: Record<string, unknown> = {
    photographer_id: photographerId,
    storage_asset_id: asset.id,
    sort_order: sortOrder,
  }
  if (albumId) insertData.album_id = albumId

  const { data: photo, error: photoError } = await db
    .from('portfolio_photos')
    .insert(insertData)
    .select('id, sort_order')
    .single()

  if (photoError || !photo) {
    await db.from('storage_assets').delete().eq('id', asset.id)
    return serverError('Failed to register photo')
  }

  // Claim the storage asset
  await db
    .from('storage_assets')
    .update({ orphan_expires_at: null, entity_id: photo.id })
    .eq('id', asset.id)

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({
    id: photo.id,
    src: publicUrl,
    caption: '',
    isCover: false,
    storage_asset_id: asset.id,
  })
}
