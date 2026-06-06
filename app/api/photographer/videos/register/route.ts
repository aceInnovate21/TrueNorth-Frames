import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// POST /api/photographer/videos/register
// Called after a direct presigned R2 upload completes.
// Saves video metadata to DB and claims the orphan storage asset.
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  // Check total video limit
  const { count: totalVideoCount } = await db
    .from('portfolio_videos')
    .select('id', { count: 'exact', head: true })
    .eq('photographer_id', photographerId)

  if ((totalVideoCount ?? 0) >= PLATFORM_CONFIG.max_videos_per_photographer) {
    return badRequest(`Maximum ${PLATFORM_CONFIG.max_videos_per_photographer} videos allowed`)
  }

  const body = await request.json()
  const { asset_id, key, album_id, title, tags, video_taken_month, video_taken_year } = body

  if (!asset_id || !key) return badRequest('asset_id and key are required')

  // Verify the asset belongs to this user and is still orphaned
  const { data: asset } = await db
    .from('storage_assets')
    .select('id, size_bytes, content_type')
    .eq('id', asset_id)
    .eq('owner_id', user.id)
    .not('orphan_expires_at', 'is', null)
    .single()

  if (!asset) return notFound('Asset not found or already claimed')

  // If album_id provided, verify it belongs to this photographer and check per-album limit
  if (album_id) {
    const { data: album } = await db
      .from('portfolio_albums')
      .select('id')
      .eq('id', album_id)
      .eq('photographer_id', photographerId)
      .single()
    if (!album) return notFound('Album not found')

    const { count: albumVideoCount } = await db
      .from('portfolio_videos')
      .select('id', { count: 'exact', head: true })
      .eq('album_id', album_id)

    if ((albumVideoCount ?? 0) >= PLATFORM_CONFIG.max_videos_per_album) {
      return badRequest(`Maximum ${PLATFORM_CONFIG.max_videos_per_album} videos per album`)
    }
  }

  // Get next sort_order
  const { data: existing } = await db
    .from('portfolio_videos')
    .select('sort_order')
    .eq('photographer_id', photographerId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sortOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  // Sanitise inputs
  const cleanTitle = title?.trim().slice(0, PLATFORM_CONFIG.max_video_title_length) || null
  const cleanTags: string[] = Array.isArray(tags)
    ? tags.map((t: string) => t.trim()).filter(Boolean).slice(0, 10)
    : []
  const cleanMonth = Number.isInteger(video_taken_month) && video_taken_month >= 1 && video_taken_month <= 12
    ? video_taken_month : null
  const cleanYear = Number.isInteger(video_taken_year) && video_taken_year >= 2000 && video_taken_year <= 2100
    ? video_taken_year : null

  const insertData: Record<string, unknown> = {
    photographer_id: photographerId,
    storage_asset_id: asset_id,
    title: cleanTitle,
    sort_order: sortOrder,
    tags: cleanTags,
    ...(cleanMonth ? { video_taken_month: cleanMonth } : {}),
    ...(cleanYear  ? { video_taken_year:  cleanYear  } : {}),
    ...(album_id   ? { album_id }                      : {}),
  }

  const { data: video, error: videoError } = await db
    .from('portfolio_videos')
    .insert(insertData)
    .select('id, title, sort_order, tags, video_taken_month, video_taken_year')
    .single()

  if (videoError || !video) return serverError('Failed to register video')

  // Claim the storage asset — removes orphan TTL
  await db
    .from('storage_assets')
    .update({ orphan_expires_at: null, entity_id: video.id })
    .eq('id', asset_id)

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({
    id: video.id,
    src: publicUrl,
    title: video.title ?? '',
    duration_seconds: null,
    storage_asset_id: asset_id,
    tags: video.tags ?? [],
    video_taken_month: video.video_taken_month ?? null,
    video_taken_year:  video.video_taken_year  ?? null,
  })
}
