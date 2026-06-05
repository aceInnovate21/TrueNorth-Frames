import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { deleteFromR2 } from '@/lib/r2'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// PATCH /api/photographer/videos — update title and/or sort_order
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const body = await request.json()
  const { id, title, sort_order, tags, video_taken_month, video_taken_year } = body
  if (!id) return badRequest('id is required')

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title?.trim().slice(0, PLATFORM_CONFIG.max_video_title_length) || null
  if (sort_order !== undefined) updates.sort_order = sort_order
  if (tags !== undefined) updates.tags = Array.isArray(tags) ? tags.slice(0, 10) : []
  if (video_taken_month !== undefined) updates.video_taken_month = video_taken_month || null
  if (video_taken_year !== undefined) updates.video_taken_year = video_taken_year || null

  const { error } = await db
    .from('portfolio_videos')
    .update(updates)
    .eq('id', id)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to update video')
  return NextResponse.json({ success: true })
}

// PUT /api/photographer/videos — bulk reorder [{ id, sort_order }]
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
      db.from('portfolio_videos').update({ sort_order }).eq('id', id).eq('photographer_id', photographerId)
    )
  )

  return NextResponse.json({ success: true })
}

// DELETE /api/photographer/videos?id=xxx — delete video + R2 object
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return badRequest('id is required')

  // Fetch asset info before deleting
  const { data: video } = await db
    .from('portfolio_videos')
    .select('storage_asset_id')
    .eq('id', id)
    .eq('photographer_id', photographerId)
    .single()

  if (!video) return notFound('Video not found')

  const { error } = await db
    .from('portfolio_videos')
    .delete()
    .eq('id', id)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to delete video')

  // Clean up storage asset + R2 object
  if (video.storage_asset_id) {
    const { data: asset } = await db
      .from('storage_assets')
      .select('key')
      .eq('id', video.storage_asset_id)
      .single()

    if (asset?.key) {
      await deleteFromR2(asset.key).catch(() => {})
    }
    await db.from('storage_assets').delete().eq('id', video.storage_asset_id)
  }

  return NextResponse.json({ success: true })
}
