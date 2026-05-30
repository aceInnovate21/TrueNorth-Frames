import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { queueEmail } from '@/lib/email/client'

async function verifyAdmin(db: any, userId: string) {
  const { data } = await db.from('users').select('role').eq('id', userId).single()
  return data?.role === 'admin'
}

// GET /api/admin/reviews?id=<review_id>
// Returns a single review with submitter info — used by the support ticket card
export async function GET(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  if (!await verifyAdmin(db, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const reviewId = new URL(request.url).searchParams.get('id')
  if (!reviewId) return badRequest('id is required')

  const { data: review, error } = await db
    .from('reviews')
    .select(`
      id, rating, body, flag_status, flag_reason, created_at,
      client:users!client_id(id, full_name, email),
      photographer:photographer_profiles!photographer_id(id, display_name, username)
    `)
    .eq('id', reviewId)
    .single()

  if (error || !review) return NextResponse.json({ error: 'Review not found' }, { status: 404 })

  return NextResponse.json({
    id:              review.id,
    rating:          review.rating,
    body:            review.body ?? '',
    flagStatus:      review.flag_status,
    flagReason:      review.flag_reason ?? '',
    createdAt:       review.created_at,
    reviewerName:    review.client?.full_name ?? 'Anonymous',
    reviewerEmail:   review.client?.email ?? '',
    photographerName: review.photographer?.display_name ?? '',
    photographerUsername: review.photographer?.username ?? '',
  })
}

// PATCH /api/admin/reviews
// Body: { review_id, action: 'remove' | 'dismiss', ticket_id? }
// remove  → flag_status = 'flag_resolved' (hidden from public profile)
// dismiss → flag_status = 'none'          (review stays up, flag cleared)
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  if (!await verifyAdmin(db, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { review_id, action, ticket_id } = body

  if (!review_id) return badRequest('review_id is required')
  if (!['remove', 'dismiss'].includes(action)) return badRequest('action must be remove or dismiss')

  const now = new Date().toISOString()

  // Update the review
  const reviewUpdate: Record<string, any> = action === 'remove'
    ? { flag_status: 'flag_resolved', flag_resolved_by: user.id, flag_resolved_at: now }
    : { flag_status: 'none', flag_reason: null, flag_submitted_at: null }

  const { error: reviewError } = await db
    .from('reviews')
    .update(reviewUpdate)
    .eq('id', review_id)

  if (reviewError) return serverError('Failed to update review')

  // If a ticket_id is supplied, auto-resolve the support ticket
  if (ticket_id) {
    const resolutionNote = action === 'remove'
      ? 'Admin reviewed the flagged review and removed it from the public profile.'
      : 'Admin reviewed the flagged review and determined it does not violate our policies. The review remains visible.'

    await db.from('support_tickets').update({
      status:          'resolved',
      resolution_note: resolutionNote,
      resolved_at:     now,
      updated_at:      now,
    }).eq('id', ticket_id)
  }

  // Email photographer about the review decision
  try {
    const { data: review } = await db
      .from('reviews')
      .select('photographer_id')
      .eq('id', review_id)
      .single()

    if (review?.photographer_id) {
      const { data: photProfile } = await db
        .from('photographer_profiles')
        .select('user_id, display_name, username')
        .eq('id', review.photographer_id)
        .single()
      if (photProfile?.user_id) {
        const { data: photUser } = await db
          .from('users').select('email, full_name').eq('id', photProfile.user_id).single()
        if (photUser?.email) {
          const firstName = (photUser.full_name ?? 'there').split(' ')[0]
          await queueEmail({
            to:         photUser.email,
            templateId: action === 'remove' ? 'review_removed' : 'review_dismissed',
            payload: {
              firstName,
              username: photProfile.username ?? '',
              email:    photUser.email,
            },
          })
        }
      }
    }
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true, action })
}
