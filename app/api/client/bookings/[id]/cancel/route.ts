import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, notFound, serverError } from '@/lib/api-helpers'

// POST /api/client/bookings/[id]/cancel
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { reason } = body
  if (!reason?.trim()) return badRequest('reason is required')

  const { data: booking, error: fetchError } = await db
    .from('booking_requests')
    .select('id, status, photographer_id, client_id')
    .eq('id', params.id)
    .eq('client_id', user.id)
    .single()

  if (fetchError || !booking) return notFound('Booking not found')

  if (booking.status !== 'pending' && booking.status !== 'approved') {
    return badRequest(`Cannot cancel a booking with status: ${booking.status}`)
  }

  let newStatus: string

  if (booking.status === 'pending') {
    newStatus = 'cancelled'
    const { error } = await db
      .from('booking_requests')
      .update({ status: 'cancelled', cancellation_reason: reason.trim() })
      .eq('id', params.id)
    if (error) return serverError('Failed to cancel booking')
  } else {
    newStatus = 'cancellation_pending'
    const { error: updateError } = await db
      .from('booking_requests')
      .update({ status: 'cancellation_pending', cancellation_reason: reason.trim() })
      .eq('id', params.id)
    if (updateError) return serverError('Failed to update booking status')

    // Insert cancellation request record (non-fatal if it fails)
    await db.from('booking_cancellation_requests').insert({
      booking_id: params.id,
      requested_by: user.id,
      actor: 'client',
      reason: reason.trim(),
    })
  }

  return NextResponse.json({ success: true, new_status: newStatus })
}
