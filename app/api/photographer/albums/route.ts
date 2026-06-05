import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// GET /api/photographer/albums — list albums + standalone photos/videos
// Returns: { albums: [...], standalone_photos: [...], standalone_videos: [...] }
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const [
    { data: albums, error: albumsError },
    { data: allPhotos },
    { data: allVideos },
  ] = await Promise.all([
    db.from('portfolio_albums')
      .select('id, title, sort_order, is_published')
      .eq('photographer_id', photographerId)
      .order('sort_order', { ascending: true }),
    db.from('portfolio_photos')
      .select('id, album_id, caption, tags, photo_taken_month, photo_taken_year, sort_order, storage_asset_id')
      .eq('photographer_id', photographerId)
      .order('sort_order', { ascending: true }),
    db.from('portfolio_videos')
      .select('id, album_id, title, sort_order, duration_seconds, storage_asset_id, tags, video_taken_month, video_taken_year')
      .eq('photographer_id', photographerId)
      .order('sort_order', { ascending: true }),
  ])

  if (albumsError) return serverError('Failed to load albums')

  const assetIds = Array.from(new Set([
    ...(allPhotos ?? []).map((p: any) => p.storage_asset_id),
    ...(allVideos ?? []).map((v: any) => v.storage_asset_id),
  ].filter(Boolean)))

  const assetKeyMap: Record<string, string> = {}
  if (assetIds.length > 0) {
    const { data: assets } = await db.from('storage_assets').select('id, key').in('id', assetIds)
    for (const a of assets ?? []) assetKeyMap[a.id] = a.key
  }

  const r2Base = process.env.R2_PUBLIC_URL ?? ''

  const photosByAlbum: Record<string, any[]> = {}
  const standalonePhotos: any[] = []
  for (const p of allPhotos ?? []) {
    if (p.album_id) {
      if (!photosByAlbum[p.album_id]) photosByAlbum[p.album_id] = []
      photosByAlbum[p.album_id].push(p)
    } else {
      standalonePhotos.push(p)
    }
  }

  const videosByAlbum: Record<string, any[]> = {}
  const standaloneVideos: any[] = []
  for (const v of allVideos ?? []) {
    if (v.album_id) {
      if (!videosByAlbum[v.album_id]) videosByAlbum[v.album_id] = []
      videosByAlbum[v.album_id].push(v)
    } else {
      standaloneVideos.push(v)
    }
  }

  const albums_result = (albums ?? []).map((a: any) => {
    const albumPhotos = (photosByAlbum[a.id] ?? []).map((p: any, i: number) => ({
      id: p.id,
      caption: p.caption ?? '',
      tags: p.tags ?? [],
      photo_taken_month: p.photo_taken_month ?? null,
      photo_taken_year:  p.photo_taken_year  ?? null,
      storage_asset_id: p.storage_asset_id,
      src: assetKeyMap[p.storage_asset_id] ? `${r2Base}/${assetKeyMap[p.storage_asset_id]}` : '',
      isCover: i === 0,
    }))
    const albumVideos = (videosByAlbum[a.id] ?? []).map((v: any) => ({
      id: v.id,
      title: v.title ?? '',
      duration_seconds: v.duration_seconds,
      storage_asset_id: v.storage_asset_id,
      src: assetKeyMap[v.storage_asset_id] ? `${r2Base}/${assetKeyMap[v.storage_asset_id]}` : '',
      tags: v.tags ?? [],
      video_taken_month: v.video_taken_month ?? null,
      video_taken_year:  v.video_taken_year  ?? null,
    }))
    return { id: a.id, title: a.title, sort_order: a.sort_order, is_published: a.is_published, photos: albumPhotos, videos: albumVideos }
  })

  return NextResponse.json({
    albums: albums_result,
    standalone_photos: standalonePhotos.map((p: any, i: number) => ({
      id: p.id,
      caption: p.caption ?? '',
      tags: p.tags ?? [],
      photo_taken_month: p.photo_taken_month ?? null,
      photo_taken_year:  p.photo_taken_year  ?? null,
      storage_asset_id: p.storage_asset_id,
      src: assetKeyMap[p.storage_asset_id] ? `${r2Base}/${assetKeyMap[p.storage_asset_id]}` : '',
      isCover: i === 0,
    })),
    standalone_videos: standaloneVideos.map((v: any) => ({
      id: v.id,
      title: v.title ?? '',
      duration_seconds: v.duration_seconds,
      storage_asset_id: v.storage_asset_id,
      src: assetKeyMap[v.storage_asset_id] ? `${r2Base}/${assetKeyMap[v.storage_asset_id]}` : '',
      tags: v.tags ?? [],
      video_taken_month: v.video_taken_month ?? null,
      video_taken_year:  v.video_taken_year  ?? null,
    })),
  })
}

// POST /api/photographer/albums — create album
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const { data: existing } = await db
    .from('portfolio_albums')
    .select('id')
    .eq('photographer_id', photographerId)

  if ((existing ?? []).length >= PLATFORM_CONFIG.max_albums_per_photographer) {
    return badRequest(`Maximum ${PLATFORM_CONFIG.max_albums_per_photographer} albums allowed`)
  }

  const body = await request.json()
  const { title } = body
  if (!title?.trim()) return badRequest('title is required')

  const maxOrder = (existing ?? []).length
  const { data, error } = await db
    .from('portfolio_albums')
    .insert({
      photographer_id: photographerId,
      title: title.trim().slice(0, PLATFORM_CONFIG.max_album_name_length),
      sort_order: maxOrder,
      is_published: true,
    })
    .select('id, title, sort_order, is_published')
    .single()

  if (error || !data) return serverError('Failed to create album')

  return NextResponse.json({ ...data, photos: [], videos: [] })
}

// PATCH /api/photographer/albums — rename or reorder
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const body = await request.json()
  const { id, title } = body
  if (!id) return badRequest('id is required')

  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title.trim().slice(0, PLATFORM_CONFIG.max_album_name_length)

  const { error } = await db
    .from('portfolio_albums')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to update album')
  return NextResponse.json({ success: true })
}

// PUT /api/photographer/albums — bulk reorder [{ id, sort_order }]
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
      db.from('portfolio_albums').update({ sort_order }).eq('id', id).eq('photographer_id', photographerId)
    )
  )

  return NextResponse.json({ success: true })
}

// DELETE /api/photographer/albums — delete album (cascades photos/videos)
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return badRequest('id is required')

  const { error } = await db
    .from('portfolio_albums')
    .delete()
    .eq('id', id)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to delete album')
  return NextResponse.json({ success: true })
}
