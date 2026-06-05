import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { uploadToR2 } from '@/lib/r2'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { randomUUID } from 'crypto'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// POST /api/photographer/videos/upload
// multipart/form-data: file (video) + optional album_id + optional title
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  // Check total video limit across photographer
  const { count: totalVideoCount } = await db
    .from('portfolio_videos')
    .select('id', { count: 'exact', head: true })
    .eq('photographer_id', photographerId)

  if ((totalVideoCount ?? 0) >= PLATFORM_CONFIG.max_videos_per_photographer) {
    return badRequest(`Maximum ${PLATFORM_CONFIG.max_videos_per_photographer} videos allowed`)
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const albumId = (formData.get('album_id') as string | null) || null
  const title = (formData.get('title') as string | null)?.trim() || null
  const tagsRaw = (formData.get('tags') as string | null) || ''
  const tags: string[] = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean).slice(0, 10) : []
  const videoTakenMonth = parseInt(formData.get('video_taken_month') as string) || null
  const videoTakenYear  = parseInt(formData.get('video_taken_year')  as string) || null

  if (!file) return badRequest('file is required')
  if (!file.type.startsWith('video/')) return badRequest('Only video files are allowed')
  if (file.size > PLATFORM_CONFIG.max_video_bytes) {
    return badRequest(`File exceeds ${PLATFORM_CONFIG.max_video_bytes / 1024 / 1024} MB limit`)
  }

  // If album_id provided, verify it belongs to this photographer and check per-album limit
  if (albumId) {
    const { data: album } = await db
      .from('portfolio_albums')
      .select('id')
      .eq('id', albumId)
      .eq('photographer_id', photographerId)
      .single()
    if (!album) return notFound('Album not found')

    const { count: albumVideoCount } = await db
      .from('portfolio_videos')
      .select('id', { count: 'exact', head: true })
      .eq('album_id', albumId)

    if ((albumVideoCount ?? 0) >= PLATFORM_CONFIG.max_videos_per_album) {
      return badRequest(`Maximum ${PLATFORM_CONFIG.max_videos_per_album} videos per album`)
    }
  }

  // Upload to R2
  const ext = file.type.split('/')[1] || 'mp4'
  const key = `portfolio_videos/${user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await uploadToR2(key, buffer, file.type)
  } catch {
    return serverError('Failed to upload to storage')
  }

  // Register storage_asset (orphan TTL — claimed once video row created)
  const orphanExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const { data: asset, error: assetError } = await db
    .from('storage_assets')
    .insert({
      owner_id: user.id,
      bucket: process.env.R2_BUCKET_NAME!,
      key,
      content_type: file.type,
      size_bytes: file.size,
      entity_type: 'portfolio_video',
      orphan_expires_at: orphanExpiresAt,
    })
    .select('id')
    .single()

  if (assetError || !asset) return serverError('Failed to register asset')

  // Get next sort_order (scoped to album or standalone)
  const sortQuery = db
    .from('portfolio_videos')
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

  // Register portfolio_video row
  const insertData: Record<string, unknown> = {
    photographer_id: photographerId,
    storage_asset_id: asset.id,
    title: title?.slice(0, PLATFORM_CONFIG.max_video_title_length) || null,
    sort_order: sortOrder,
    tags: tags.length > 0 ? tags : [],
    ...(videoTakenMonth && videoTakenMonth >= 1 && videoTakenMonth <= 12 ? { video_taken_month: videoTakenMonth } : {}),
    ...(videoTakenYear && videoTakenYear >= 2000 && videoTakenYear <= 2100 ? { video_taken_year: videoTakenYear } : {}),
  }
  if (albumId) insertData.album_id = albumId

  const { data: video, error: videoError } = await db
    .from('portfolio_videos')
    .insert(insertData)
    .select('id, title, sort_order, storage_asset_id, tags, video_taken_month, video_taken_year')
    .single()

  if (videoError || !video) {
    await db.from('storage_assets').delete().eq('id', asset.id)
    return serverError('Failed to register video')
  }

  // Claim the storage asset
  await db
    .from('storage_assets')
    .update({ orphan_expires_at: null, entity_id: video.id })
    .eq('id', asset.id)

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({
    id: video.id,
    src: publicUrl,
    title: video.title ?? '',
    duration_seconds: null,
    storage_asset_id: asset.id,
    tags: video.tags ?? [],
    video_taken_month: video.video_taken_month ?? null,
    video_taken_year:  video.video_taken_year  ?? null,
  })
}
