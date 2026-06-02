import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { deleteFromR2 } from '@/lib/r2'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// POST /api/photographer/photos — register photo after R2 upload
// Body: { album_id, storage_asset_id, caption?, tags?, photo_taken_month?, photo_taken_year? }
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const body = await request.json()
  const { album_id, storage_asset_id, caption, tags, photo_taken_month, photo_taken_year } = body
  if (!album_id || !storage_asset_id) return badRequest('album_id and storage_asset_id are required')

  const { data: album } = await db
    .from('portfolio_albums')
    .select('id')
    .eq('id', album_id)
    .eq('photographer_id', photographerId)
    .single()

  if (!album) return notFound('Album not found')

  const { count } = await db
    .from('portfolio_photos')
    .select('id', { count: 'exact', head: true })
    .eq('photographer_id', photographerId)

  if ((count ?? 0) >= PLATFORM_CONFIG.max_photos_per_photographer) {
    return badRequest(`Maximum ${PLATFORM_CONFIG.max_photos_per_photographer} photos allowed`)
  }

  const { data: existing } = await db
    .from('portfolio_photos')
    .select('sort_order')
    .eq('album_id', album_id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sortOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const cleanTags = Array.isArray(tags)
    ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10)
    : []

  const { data: photo, error } = await db
    .from('portfolio_photos')
    .insert({
      album_id,
      photographer_id:  photographerId,
      storage_asset_id,
      caption:          caption?.trim().slice(0, PLATFORM_CONFIG.max_photo_caption_length) || null,
      tags:             cleanTags,
      photo_taken_month: photo_taken_month ? Number(photo_taken_month) : null,
      photo_taken_year:  photo_taken_year  ? Number(photo_taken_year)  : null,
      sort_order:       sortOrder,
    })
    .select('id, caption, tags, photo_taken_month, photo_taken_year, sort_order, storage_asset_id')
    .single()

  if (error || !photo) return serverError('Failed to register photo')

  await db
    .from('storage_assets')
    .update({ orphan_expires_at: null, entity_type: 'portfolio_photo', entity_id: photo.id })
    .eq('id', storage_asset_id)

  return NextResponse.json(photo)
}

// PATCH /api/photographer/photos — update caption, tags, date, and/or sort_order
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const body = await request.json()
  const { id, caption, tags, photo_taken_month, photo_taken_year, sort_order } = body
  if (!id) return badRequest('id is required')

  const updates: Record<string, unknown> = {}
  if (caption !== undefined)
    updates.caption = caption?.trim().slice(0, PLATFORM_CONFIG.max_photo_caption_length) || null
  if (tags !== undefined)
    updates.tags = Array.isArray(tags)
      ? tags.map((t: string) => t.trim().toLowerCase()).filter(Boolean).slice(0, 10)
      : []
  if (photo_taken_month !== undefined)
    updates.photo_taken_month = photo_taken_month ? Number(photo_taken_month) : null
  if (photo_taken_year !== undefined)
    updates.photo_taken_year = photo_taken_year ? Number(photo_taken_year) : null
  if (sort_order !== undefined)
    updates.sort_order = sort_order

  const { error } = await db
    .from('portfolio_photos')
    .update(updates)
    .eq('id', id)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to update photo')
  return NextResponse.json({ success: true })
}

// PUT /api/photographer/photos — bulk reorder [{ id, sort_order }]
export async function PUT(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const items: { id: string; sort_order: number }[] = await request.json()
  if (!Array.isArray(items)) return badRequest('array expected')

  await Promise.all(
    items.map(({ id, sort_order }) =>
      db.from('portfolio_photos').update({ sort_order }).eq('id', id).eq('photographer_id', photographerId)
    )
  )

  return NextResponse.json({ success: true })
}

// DELETE /api/photographer/photos — delete photo + R2 object
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return badRequest('id is required')

  const { data: photo } = await db
    .from('portfolio_photos')
    .select('storage_asset_id, storage_assets!storage_asset_id(key, bucket)')
    .eq('id', id)
    .eq('photographer_id', photographerId)
    .single()

  if (!photo) return notFound('Photo not found')

  const { error } = await db
    .from('portfolio_photos')
    .delete()
    .eq('id', id)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to delete photo')

  const assetKey = photo.storage_assets?.key
  const bucket = photo.storage_assets?.bucket
  if (assetKey && bucket) {
    await deleteFromR2(assetKey).catch(() => {})
    await db.from('storage_assets').delete().eq('id', photo.storage_asset_id)
  }

  return NextResponse.json({ success: true })
}
