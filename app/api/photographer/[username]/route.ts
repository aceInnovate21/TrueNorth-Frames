import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { notFound } from '@/lib/api-helpers'

// Public read-only route — no auth required, uses service role for reliable reads
function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { username: string } }
) {
  const db = getDb()

  const { data: profile, error } = await db
    .from('photographer_profiles')
    .select(`
      id, username, display_name, tagline, bio, location,
      avatar_url, cover_image_url, website_url, instagram_url,
      rate_display, rate_note, trust_score, native_avg_rating,
      native_review_count, profile_view_count, created_at
    `)
    .eq('username', params.username)
    .eq('profile_status', 'approved')
    .single()

  if (error || !profile) return notFound()

  const photographerId = profile.id

  const today = new Date().toISOString().slice(0, 10)
  const in90 = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

  const [
    { data: specialties },
    { data: links },
    { data: nativeReviews },
    { data: packages },
    { data: faqs },
    { data: dayStatuses },
    { data: portfolioPhotos },
    { data: portfolioAlbums },
    { data: portfolioVideos },
  ] = await Promise.all([
    db.from('photographer_specialties').select('specialty').eq('photographer_id', photographerId),
    db.from('external_platform_links').select('platform, profile_url, platform_rating, platform_review_count').eq('photographer_id', photographerId),
    db.from('reviews').select('id, rating, body, created_at, client:users!client_id(full_name)').eq('photographer_id', photographerId).eq('flag_status', 'none').order('created_at', { ascending: false }).limit(10),
    db.from('packages').select('id, name, description, billing_type, price, deliverables, is_popular').eq('photographer_id', photographerId).eq('is_active', true).order('sort_order', { ascending: true }),
    db.from('photographer_faqs').select('id, question, answer, sort_order').eq('photographer_id', photographerId).eq('is_published', true).order('sort_order', { ascending: true }),
    db.from('availability_day_status').select('date, status').eq('photographer_id', photographerId).gte('date', today).lte('date', in90),
    db.from('portfolio_photos').select('id, album_id, caption, sort_order, storage_asset_id').eq('photographer_id', photographerId).order('sort_order', { ascending: true }),
    db.from('portfolio_albums').select('id, title, sort_order').eq('photographer_id', photographerId).eq('is_published', true).order('sort_order', { ascending: true }),
    db.from('portfolio_videos').select('id, album_id, title, sort_order, duration_seconds, storage_asset_id').eq('photographer_id', photographerId).order('sort_order', { ascending: true }),
  ])

  // Resolve storage asset keys for photos and videos in one query
  const allAssetIds = Array.from(new Set([
    ...(portfolioPhotos ?? []).map((p: any) => p.storage_asset_id),
    ...(portfolioVideos ?? []).map((v: any) => v.storage_asset_id),
  ].filter(Boolean)))
  const photoAssetKeyMap: Record<string, string> = {}
  if (allAssetIds.length > 0) {
    const { data: assets } = await db.from('storage_assets').select('id, key').in('id', allAssetIds)
    for (const a of assets ?? []) photoAssetKeyMap[a.id] = a.key
  }

  // Group photos and videos by album_id; collect standalones (album_id = null)
  const photosByAlbum: Record<string, any[]> = {}
  const standalonePhotos: any[] = []
  for (const ph of portfolioPhotos ?? []) {
    if (ph.album_id) {
      if (!photosByAlbum[ph.album_id]) photosByAlbum[ph.album_id] = []
      photosByAlbum[ph.album_id].push(ph)
    } else {
      standalonePhotos.push(ph)
    }
  }
  const videosByAlbum: Record<string, any[]> = {}
  const standaloneVideos: any[] = []
  for (const v of portfolioVideos ?? []) {
    if (v.album_id) {
      if (!videosByAlbum[v.album_id]) videosByAlbum[v.album_id] = []
      videosByAlbum[v.album_id].push(v)
    } else {
      standaloneVideos.push(v)
    }
  }

  const linksMap: Record<string, { url: string; rating: number | null; count: number | null }> = {}
  for (const l of links ?? []) {
    linksMap[l.platform] = {
      url: l.profile_url,
      rating: l.platform_rating,
      count: l.platform_review_count,
    }
  }

  const r2Base = process.env.R2_PUBLIC_URL ?? ''

  return NextResponse.json({
    id: profile.id,
    username: profile.username,
    display_name: profile.display_name,
    tagline: profile.tagline ?? '',
    bio: profile.bio ?? '',
    location: profile.location ?? '',
    avatar_url: profile.avatar_url ?? null,
    cover_image_url: profile.cover_image_url ?? null,
    website_url: profile.website_url ?? '',
    instagram_url: profile.instagram_url ?? '',
    rate_display: profile.rate_display ?? '',
    rate_note: profile.rate_note ?? '',
    trust_score: profile.trust_score ?? 0,
    native_avg_rating: profile.native_avg_rating ?? 0,
    native_review_count: profile.native_review_count ?? 0,
    profile_view_count: profile.profile_view_count ?? 0,
    member_since: profile.created_at,
    specialties: (specialties ?? []).map((s: { specialty: string }) => s.specialty),
    links: linksMap,
    native_reviews: (nativeReviews ?? []).map((r: any) => ({
      id: r.id,
      rating: r.rating,
      body: r.body,
      created_at: r.created_at,
      reviewer_name: r.client?.full_name ?? 'Anonymous',
    })),
    packages: (packages ?? []).map((pkg: any) => ({
      id: pkg.id,
      name: pkg.name,
      description: pkg.description ?? '',
      billingType: pkg.billing_type,
      price: pkg.price,
      deliverables: pkg.deliverables ?? [],
      isPopular: pkg.is_popular ?? false,
    })),
    faqs: (faqs ?? []).map((f: any) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
    })),
    availability: (dayStatuses ?? []).map((d: any) => ({
      date: d.date,
      status: d.status,
    })),
    // Standalone (not in any album)
    standalone_photos: standalonePhotos.map((ph: any) => ({
      id: ph.id,
      src: photoAssetKeyMap[ph.storage_asset_id] ? `${r2Base}/${photoAssetKeyMap[ph.storage_asset_id]}` : '',
      caption: ph.caption ?? '',
    })),
    standalone_videos: standaloneVideos.map((v: any) => ({
      id: v.id,
      src: photoAssetKeyMap[v.storage_asset_id] ? `${r2Base}/${photoAssetKeyMap[v.storage_asset_id]}` : '',
      title: v.title ?? '',
      duration_seconds: v.duration_seconds ?? null,
    })),
    // Album-assigned (grouped)
    portfolio_albums: (portfolioAlbums ?? []).map((a: any) => {
      const albumPhotos = photosByAlbum[a.id] ?? []
      const albumVideos = videosByAlbum[a.id] ?? []
      const coverPhoto = albumPhotos[0]
      const coverSrc = coverPhoto && photoAssetKeyMap[coverPhoto.storage_asset_id]
        ? `${r2Base}/${photoAssetKeyMap[coverPhoto.storage_asset_id]}`
        : ''
      // Build 2x2 collage srcs (first 4 photos)
      const collage_srcs = albumPhotos.slice(0, 4).map((p: any) =>
        photoAssetKeyMap[p.storage_asset_id] ? `${r2Base}/${photoAssetKeyMap[p.storage_asset_id]}` : ''
      )
      return {
        id: a.id,
        title: a.title,
        photo_count: albumPhotos.length,
        video_count: albumVideos.length,
        cover_src: coverSrc,
        collage_srcs,
      }
    }),
    portfolio_photos: (portfolioPhotos ?? []).map((ph: any) => ({
      id: ph.id,
      album_id: ph.album_id,
      src: photoAssetKeyMap[ph.storage_asset_id] ? `${r2Base}/${photoAssetKeyMap[ph.storage_asset_id]}` : '',
      caption: ph.caption ?? '',
    })),
    portfolio_videos: (portfolioVideos ?? []).map((v: any) => ({
      id: v.id,
      album_id: v.album_id,
      src: photoAssetKeyMap[v.storage_asset_id] ? `${r2Base}/${photoAssetKeyMap[v.storage_asset_id]}` : '',
      title: v.title ?? '',
      duration_seconds: v.duration_seconds ?? null,
    })),
  })
}
