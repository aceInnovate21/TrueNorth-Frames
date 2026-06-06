import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, notFound, serverError } from '@/lib/api-helpers'
import { sendEmail, queueEmail } from '@/lib/email/client'

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

  // Email the photographer about the cancellation
  try {
    const { data: fullBooking } = await db
      .from('booking_requests')
      .select('occasion, requested_date, location_note, photographer_id')
      .eq('id', params.id)
      .single()

    const { data: clientUser } = await db
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()

    if (fullBooking) {
      const { data: photProfile } = await db
        .from('photographer_profiles')
        .select('user_id, display_name')
        .eq('id', fullBooking.photographer_id)
        .single()

      if (photProfile) {
        const { data: photUser } = await db
          .from('users')
          .select('email')
          .eq('id', photProfile.user_id)
          .single()

        if (photUser?.email) {
          const dateLabel = fullBooking.requested_date
            ? new Date(fullBooking.requested_date).toLocaleDateString('en-CA', { month: 'long', day: 'numeric', year: 'numeric' })
            : 'your session'
          const cancelPayload = {
            clientName:  clientUser?.full_name ?? 'The client',
            sessionType: fullBooking.occasion,
            date:        dateLabel,
            reason:      reason.trim(),
          }
          const sent = await sendEmail({ to: photUser.email, templateId: 'booking_cancelled_by_client', payload: cancelPayload })
          if (!sent.ok) await queueEmail({ to: photUser.email, templateId: 'booking_cancelled_by_client', payload: cancelPayload })
        }
      }
    }
  } catch { /* best-effort — never block the cancellation */ }

  return NextResponse.json({ success: true, new_status: newStatus })
}
