import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { checkQuota } from '@/lib/storage-quota'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// POST /api/photographer/photos/register
// Called after a browser-compressed image is uploaded directly to R2 via presign.
// Registers the portfolio_photo row and claims the orphan storage asset.
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  // Total photo count cap (byte quota is the primary governor; this is a sanity bound)
  const { count } = await db
    .from('portfolio_photos')
    .select('id', { count: 'exact', head: true })
    .eq('photographer_id', photographerId)

  if ((count ?? 0) >= PLATFORM_CONFIG.max_photos_per_photographer) {
    return badRequest(`Maximum ${PLATFORM_CONFIG.max_photos_per_photographer} photos allowed`)
  }

  const body = await request.json()
  const { asset_id, key, album_id, caption } = body
  if (!asset_id || !key) return badRequest('asset_id and key are required')

  // Verify the asset belongs to this user and is still orphaned (unclaimed)
  const { data: asset } = await db
    .from('storage_assets')
    .select('id, size_bytes')
    .eq('id', asset_id)
    .eq('owner_id', user.id)
    .not('orphan_expires_at', 'is', null)
    .single()

  if (!asset) return notFound('Asset not found or already claimed')

  // Defensive quota re-check (presign already checked, but assets could have
  // been added concurrently between presign and register).
  const quotaError = await checkQuota(db, user.id, Number(asset.size_bytes) || 0)
  if (quotaError) {
    // Roll back the orphaned asset so it doesn't linger until cron purge.
    await db.from('storage_assets').delete().eq('id', asset_id)
    return NextResponse.json({ error: quotaError }, { status: 413 })
  }

  // If album_id provided, verify ownership
  const albumId = album_id || null
  if (albumId) {
    const { data: album } = await db
      .from('portfolio_albums')
      .select('id')
      .eq('id', albumId)
      .eq('photographer_id', photographerId)
      .single()
    if (!album) return notFound('Album not found')
  }

  // Next sort_order, scoped to album or standalone
  const sortQuery = db
    .from('portfolio_photos')
    .select('sort_order')
    .eq('photographer_id', photographerId)
    .order('sort_order', { ascending: false })
    .limit(1)
  if (albumId) sortQuery.eq('album_id', albumId)
  else sortQuery.is('album_id', null)

  const { data: existing } = await sortQuery
  const sortOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const insertData: Record<string, unknown> = {
    photographer_id: photographerId,
    storage_asset_id: asset_id,
    sort_order: sortOrder,
    ...(albumId ? { album_id: albumId } : {}),
    ...(typeof caption === 'string' && caption.trim()
      ? { caption: caption.trim().slice(0, PLATFORM_CONFIG.max_photo_caption_length) }
      : {}),
  }

  const { data: photo, error: photoError } = await db
    .from('portfolio_photos')
    .insert(insertData)
    .select('id, sort_order, caption')
    .single()

  if (photoError || !photo) {
    await db.from('storage_assets').delete().eq('id', asset_id)
    return serverError('Failed to register photo')
  }

  // Claim the storage asset — removes orphan TTL
  await db
    .from('storage_assets')
    .update({ orphan_expires_at: null, entity_id: photo.id })
    .eq('id', asset_id)

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  return NextResponse.json({
    id: photo.id,
    src: publicUrl,
    caption: photo.caption ?? '',
    isCover: false,
    storage_asset_id: asset_id,
  })
}
