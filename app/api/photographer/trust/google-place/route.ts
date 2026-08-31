import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, notFound } from '@/lib/api-helpers'
import { searchGooglePlace } from '@/lib/trust/fetchers/google'
import { syncTrustScore } from '@/lib/trust/sync'

// POST — look up a photographer's public Google listing by business name,
// store the matched place_id, and run a trust sync.
// Body: { businessName: string, location?: string }
export async function POST(request: NextRequest) {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json().catch(() => ({}))
  const businessName = (body?.businessName ?? '').toString().trim()
  const location     = (body?.location ?? '').toString().trim() || undefined
  if (!businessName) return badRequest('Business name is required')

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id, location')
    .eq('user_id', user.id)
    .single()
  if (!profile) return notFound('Photographer profile not found')

  const result = await searchGooglePlace(businessName, location ?? profile.location ?? 'Edmonton AB')
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 422 })

  const c = result.candidate

  // Save the confirmed listing so future syncs are stable.
  await db.from('photographer_profiles')
    .update({ google_place_id: c.placeId, google_business_name: c.name })
    .eq('id', profile.id)

  // Compute the trust score immediately from the freshly linked listing.
  let trustScore: number | null = null
  try {
    trustScore = await syncTrustScore(profile.id)
  } catch {
    // Non-fatal: the listing is linked; the next sync will pick up the score.
  }

  return NextResponse.json({
    success: true,
    listing: {
      placeId:     c.placeId,
      name:        c.name,
      address:     c.address,
      rating:      c.rating ?? null,
      reviewCount: c.reviewCount,
      operational: c.operational,
    },
    trust_score: trustScore,
  })
}

// DELETE — unlink the Google listing and clear the trust score.
export async function DELETE() {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) return notFound('Photographer profile not found')

  await db.from('photographer_profiles')
    .update({ google_place_id: null, google_business_name: null, trust_score: 0 })
    .eq('id', profile.id)

  await db.from('external_platform_links')
    .delete()
    .eq('photographer_id', profile.id)
    .eq('platform', 'google')

  return NextResponse.json({ success: true })
}
