import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { notify } from '@/lib/notify'
import { queueEmail } from '@/lib/email/client'

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json([])

  const { data: bookings, error } = await db
    .from('booking_requests')
    .select(`
      id,
      occasion,
      description,
      billing_type,
      billing_detail,
      requested_date,
      time_slot,
      location_note,
      status,
      photographer_note,
      created_at,
      client_id,
      package_id
    `)
    .eq('photographer_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) return serverError('Failed to load booking requests')

  if (!bookings || bookings.length === 0) return NextResponse.json([])

  // Fetch client names in one query
  const clientIds = Array.from(new Set(bookings.map((b: any) => b.client_id)))
  const { data: clients } = await db
    .from('users')
    .select('id, full_name, avatar_url')
    .in('id', clientIds)

  const clientMap: Record<string, { full_name: string; avatar_url: string | null }> = {}
  for (const c of clients ?? []) {
    clientMap[c.id] = { full_name: c.full_name, avatar_url: c.avatar_url }
  }

  const result = bookings.map((b: any) => {
    const client = clientMap[b.client_id]
    const fullName: string = client?.full_name ?? 'Unknown'
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .map((w: string) => w[0].toUpperCase())
      .slice(0, 2)
      .join('')

    return {
      id: b.id,
      clientId: b.client_id,
      clientName: fullName,
      clientInitials: initials,
      clientAvatarUrl: client?.avatar_url ?? null,
      occasion: b.occasion,
      description: b.description ?? '',
      billingType: b.billing_type,
      billingDetail: b.billing_detail ?? '',
      date: b.requested_date,
      timeSlot: b.time_slot,
      locationNote: b.location_note ?? '',
      status: b.status,
      photographerNote: b.photographer_note ?? '',
      packageId: b.package_id ?? null,
      submittedAt: b.created_at,
    }
  })

  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { id, status, photographer_note } = body
  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 })

  const allowed = ['approved', 'declined', 'completed', 'pending', 'cancelled']
  if (!allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (photographer_note !== undefined) updates.photographer_note = photographer_note
  if (status === 'completed') updates.completed_at = new Date().toISOString()

  const { error } = await db
    .from('booking_requests')
    .update(updates)
    .eq('id', id)
    .eq('photographer_id', profile.id)

  if (error) return serverError('Failed to update booking')

  // Notify + email client about the status change
  const { data: booking } = await db
    .from('booking_requests')
    .select('client_id, requested_date, occasion, location_note')
    .eq('id', id)
    .single()

  if (booking?.client_id) {
    const { data: clientUser } = await db
      .from('users')
      .select('id, email, full_name')
      .eq('id', booking.client_id)
      .single()

    if (clientUser) {
      const dateLabel = booking.requested_date
        ? new Date(booking.requested_date).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
        : 'your session'

      const msgMap: Record<string, { title: string; body: string; type: any }> = {
        approved:  { type: 'booking_approved',   title: 'Booking approved!',    body: `Your booking for ${dateLabel} has been confirmed.` },
        declined:  { type: 'booking_declined',   title: 'Booking declined',     body: `Your booking request for ${dateLabel} was declined.` },
        completed: { type: 'booking_completed',  title: 'Session completed',    body: `Your session on ${dateLabel} has been marked complete.` },
        cancelled: { type: 'booking_cancelled',  title: 'Booking cancelled',    body: `Your booking for ${dateLabel} has been cancelled.` },
      }

      const n = msgMap[status]
      if (n) {
        await notify({ db, userId: clientUser.id, type: n.type, title: n.title, body: n.body, entityType: 'booking_request', entityId: id })
      }

      // Photographer display name for email
      const { data: photProfile } = await db
        .from('photographer_profiles')
        .select('display_name')
        .eq('id', profile.id)
        .single()
      const photographerName: string = photProfile?.display_name ?? 'Your photographer'

      if (clientUser.email) {
        if (status === 'approved') {
          await queueEmail({
            to: clientUser.email,
            templateId: 'booking_confirmed',
            payload: {
              photographerName,
              sessionType: booking.occasion,
              date: dateLabel,
              location: booking.location_note ?? null,
              photographerNote: photographer_note?.trim() ?? null,
            },
          })
        } else if (status === 'declined') {
          await queueEmail({
            to: clientUser.email,
            templateId: 'booking_declined',
            payload: {
              photographerName,
              sessionType: booking.occasion,
              date: dateLabel,
              photographerNote: photographer_note?.trim() ?? null,
            },
          })
        } else if (status === 'completed') {
          await queueEmail({
            to: clientUser.email,
            templateId: 'booking_completed',
            payload: { photographerName, date: dateLabel },
          })
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}
