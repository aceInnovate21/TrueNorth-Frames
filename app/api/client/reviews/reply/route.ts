import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, notFound, serverError } from '@/lib/api-helpers'

// POST /api/client/reviews/reply
// Body: { booking_id, reply }
// Client posts a reply to the photographer's public reply. Only allowed if public_reply exists.
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { booking_id, reply } = body

  if (!booking_id) return badRequest('booking_id is required')
  if (!reply?.trim()) return badRequest('reply is required')
  if (reply.trim().length > 800) return badRequest('Reply must be under 800 characters')

  const { data: review, error } = await db
    .from('reviews')
    .select('id, client_id, public_reply, client_reply')
    .eq('booking_id', booking_id)
    .eq('client_id', user.id)
    .single()

  if (error || !review) return notFound('Review not found')
  if (!review.public_reply) return badRequest('Can only reply after the photographer has replied')
  if (review.client_reply) return badRequest('You have already replied to this review')

  const { error: updateError } = await db
    .from('reviews')
    .update({
      client_reply: reply.trim(),
      client_replied_at: new Date().toISOString(),
    })
    .eq('id', review.id)

  if (updateError) {
    console.error('[client/reviews/reply POST] error:', updateError)
    return serverError('Failed to save reply')
  }

  return NextResponse.json({ success: true })
}
