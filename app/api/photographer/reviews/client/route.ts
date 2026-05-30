import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, notFound, serverError } from '@/lib/api-helpers'

// POST /api/photographer/reviews/client
// Body: { booking_id, rating, body? }
// Stores the photographer's private review of the client on the existing reviews row.
// Creates the row first if the client hasn't reviewed yet (edge case: photographer reviews before client).
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { booking_id, rating, body: reviewBody } = body

  if (!booking_id) return badRequest('booking_id is required')
  if (!rating || rating < 1 || rating > 5) return badRequest('rating must be between 1 and 5')

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  const { data: booking, error: bookingError } = await db
    .from('booking_requests')
    .select('id, client_id, photographer_id, status')
    .eq('id', booking_id)
    .eq('photographer_id', profile.id)
    .single()

  if (bookingError || !booking) return notFound('Booking not found')
  if (booking.status !== 'completed') return badRequest('Can only review completed bookings')

  const clientReviewPayload = {
    client_review_rating: rating,
    client_review_body: reviewBody?.trim() ?? null,
    client_review_at: new Date().toISOString(),
  }

  // Upsert: if a reviews row exists for this booking, update it; otherwise insert one
  const { data: existing } = await db
    .from('reviews')
    .select('id')
    .eq('booking_id', booking_id)
    .maybeSingle()

  if (existing) {
    const { error } = await db
      .from('reviews')
      .update(clientReviewPayload)
      .eq('id', existing.id)
    if (error) {
      console.error('[photographer/reviews/client PATCH] error:', error)
      return serverError('Failed to save review')
    }
  } else {
    // Client hasn't reviewed yet — don't create a row with a fake rating.
    // The photographer's review will be saved when the client submits theirs (review row created then).
    return NextResponse.json(
      { error: 'The client must submit their review first before you can review them.' },
      { status: 422 }
    )
  }

  return NextResponse.json({ success: true })
}

// GET /api/photographer/reviews/client?booking_id=xxx — check if already reviewed
export async function GET(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { searchParams } = new URL(request.url)
  const bookingId = searchParams.get('booking_id')
  if (!bookingId) return badRequest('booking_id is required')

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json({ reviewed: false })

  const { data } = await db
    .from('reviews')
    .select('client_review_rating, client_review_body')
    .eq('booking_id', bookingId)
    .maybeSingle()

  return NextResponse.json({
    reviewed: !!data?.client_review_rating,
    rating: data?.client_review_rating ?? null,
    body: data?.client_review_body ?? null,
  })
}
