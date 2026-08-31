import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, notFound } from '@/lib/api-helpers'
import { searchGooglePlaces } from '@/lib/trust/fetchers/google'
import { syncTrustScore } from '@/lib/trust/sync'

// GET — search public Google listings by business name and return candidates
// for the photographer to confirm. Does NOT save anything.
// Query: ?q=<businessName>&location=<optional>
export async function GET(request: NextRequest) {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { searchParams } = new URL(request.url)
  const q        = (searchParams.get('q') ?? '').trim()
  const location = (searchParams.get('location') ?? '').trim() || undefined
  if (!q) return badRequest('Business name is required')

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id, location')
    .eq('user_id', user.id)
    .single()
  if (!profile) return notFound('Photographer profile not found')

  const result = await searchGooglePlaces(q, location ?? profile.location ?? 'Edmonton AB')
  if ('error' in result) return NextResponse.json({ error: result.error }, { status: 422 })

  return NextResponse.json({ candidates: result.candidates })
}

// POST — confirm a specific listing the photographer picked, store it, and sync.
// Body: { placeId: string, name: string }
export async function POST(request: NextRequest) {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body    = await request.json().catch(() => ({}))
  const placeId = (body?.placeId ?? '').toString().trim()
  const name    = (body?.name ?? '').toString().trim()
  if (!placeId) return badRequest('Please choose your listing first')

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!profile) return notFound('Photographer profile not found')

  // Save the confirmed listing so future syncs are stable.
  await db.from('photographer_profiles')
    .update({ google_place_id: placeId, google_business_name: name || null })
    .eq('id', profile.id)

  // Compute the trust score immediately from the confirmed listing.
  let trustScore: number | null = null
  try {
    trustScore = await syncTrustScore(profile.id)
  } catch {
    // Non-fatal: the listing is linked; the next sync will pick up the score.
  }

  return NextResponse.json({ success: true, trust_score: trustScore })
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
