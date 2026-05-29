import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, notFound, serverError } from '@/lib/api-helpers'

// GET /api/client/reviews — fetch all reviews submitted by this client
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: reviews, error } = await db
    .from('reviews')
    .select(`
      id, booking_id, rating, body,
      communication_rating, quality_rating, value_rating, punctuality_rating,
      public_reply, replied_at,
      client_reply, client_replied_at,
      created_at,
      photographer:photographer_profiles!photographer_id(id, username, display_name, avatar_url),
      booking:booking_requests!booking_id(occasion, requested_date)
    `)
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return serverError('Failed to load reviews')

  return NextResponse.json(
    (reviews ?? []).map((r: any) => ({
      id: r.id,
      bookingId: r.booking_id,
      rating: r.rating,
      body: r.body ?? null,
      communicationRating: r.communication_rating ?? null,
      qualityRating: r.quality_rating ?? null,
      valueRating: r.value_rating ?? null,
      punctualityRating: r.punctuality_rating ?? null,
      publicReply: r.public_reply ?? null,
      repliedAt: r.replied_at ?? null,
      clientReply: r.client_reply ?? null,
      clientRepliedAt: r.client_replied_at ?? null,
      createdAt: r.created_at,
      photographerUsername: r.photographer?.username ?? null,
      photographerDisplayName: r.photographer?.display_name ?? null,
      photographerAvatarUrl: r.photographer?.avatar_url ?? null,
      occasion: r.booking?.occasion ?? null,
      requestedDate: r.booking?.requested_date ?? null,
    }))
  )
}

// POST /api/client/reviews
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const {
    booking_id, rating, body: reviewBody,
    communication_rating, quality_rating, value_rating, punctuality_rating,
  } = body

  if (!booking_id) return badRequest('booking_id is required')
  if (!rating || rating < 1 || rating > 5) return badRequest('rating must be between 1 and 5')
  for (const [key, val] of Object.entries({ communication_rating, quality_rating, value_rating, punctuality_rating })) {
    if (val !== undefined && val !== null && (val < 1 || val > 5)) return badRequest(`${key} must be between 1 and 5`)
  }

  const { data: booking, error: bookingError } = await db
    .from('booking_requests')
    .select('id, client_id, photographer_id, status')
    .eq('id', booking_id)
    .eq('client_id', user.id)
    .single()

  if (bookingError || !booking) return notFound('Booking not found')
  if (booking.status !== 'completed') return badRequest('Can only review completed bookings')

  const { data: existingReview } = await db
    .from('reviews')
    .select('id')
    .eq('booking_id', booking_id)
    .maybeSingle()

  if (existingReview) return badRequest('A review already exists for this booking')

  const { error: insertError } = await db
    .from('reviews')
    .insert({
      booking_id,
      client_id: user.id,
      photographer_id: booking.photographer_id,
      rating,
      body: reviewBody?.trim() ?? null,
      communication_rating: communication_rating ?? null,
      quality_rating: quality_rating ?? null,
      value_rating: value_rating ?? null,
      punctuality_rating: punctuality_rating ?? null,
    })

  if (insertError) {
    console.error('[reviews POST] insert error:', insertError)
    return serverError('Failed to submit review')
  }

  return NextResponse.json({ success: true })
}
