import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { notify } from '@/lib/notify'
import { sendEmailDirect } from '@/lib/email/client'

// GET /api/client/bookings
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: bookings, error } = await db
    .from('booking_requests')
    .select('id, photographer_id, package_id, occasion, description, billing_type, billing_detail, requested_date, requested_end_date, time_slot, location_note, status, photographer_note, cancellation_reason, created_at')
    .eq('client_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return serverError('Failed to load bookings')
  if (!bookings || bookings.length === 0) return NextResponse.json([])

  const photographerIds: string[] = bookings.map((b: any) => b.photographer_id)
  const bookingIds: string[] = bookings.map((b: any) => b.id)

  const [{ data: profiles }, { data: reviewedRows }] = await Promise.all([
    db.from('photographer_profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', photographerIds),
    db.from('reviews')
      .select('booking_id')
      .in('booking_id', bookingIds)
      .eq('client_id', user.id),
  ])

  const profileMap: Record<string, any> = {}
  for (const p of profiles ?? []) profileMap[p.id] = p

  const reviewedSet = new Set<string>((reviewedRows ?? []).map((r: any) => r.booking_id))

  const result = bookings.map((b: any) => {
    const profile = profileMap[b.photographer_id] ?? {}
    return {
      ...b,
      photographer_username: profile.username ?? null,
      photographer_display_name: profile.display_name ?? null,
      photographer_avatar_url: profile.avatar_url ?? null,
      reviewed: reviewedSet.has(b.id),
    }
  })

  return NextResponse.json(result)
}

// POST /api/client/bookings
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { photographer_id, package_id, occasion, description, billing_type, billing_detail, requested_date, requested_end_date, time_slot, location_note } = body

  if (!photographer_id) return badRequest('photographer_id is required')
  if (!occasion?.trim()) return badRequest('occasion is required')
  if (!billing_type) return badRequest('billing_type is required')
  if (!requested_date) return badRequest('requested_date is required')
  if (!time_slot?.trim()) return badRequest('time_slot is required')
  // Optional multi-day range: end date, when present, must be after the start.
  const endDate: string | null =
    requested_end_date && requested_end_date > requested_date ? requested_end_date : null

  const { data, error } = await db
    .from('booking_requests')
    .insert({
      client_id: user.id,
      photographer_id,
      package_id: package_id ?? null,
      occasion: occasion.trim(),
      description: description?.trim() ?? null,
      billing_type,
      billing_detail: billing_detail?.trim() ?? null,
      requested_date,
      requested_end_date: endDate,
      time_slot: time_slot.trim(),
      location_note: location_note?.trim() ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !data) {
    console.error('[client/bookings POST] insert error:', error)
    return serverError('Failed to create booking')
  }

  // ── Post-booking: conversation + message + notification ──────────────────────

  let conversationId: string | null = null

  try {
    // 1. Upsert conversation for (client_id, photographer_id) pair
    const { data: existingConv } = await db
      .from('conversations')
      .select('id')
      .eq('client_id', user.id)
      .eq('photographer_id', photographer_id)
      .single()

    if (existingConv) {
      conversationId = existingConv.id
    } else {
      const { data: newConv } = await db
        .from('conversations')
        .insert({
          client_id: user.id,
          photographer_id,
          is_frozen: false,
        })
        .select('id')
        .single()
      conversationId = newConv?.id ?? null
    }

    if (conversationId) {
      // 2a. Insert booking summary card (system info — date/time/location)
      const fmtLong = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      const dateLabel = endDate
        ? `${fmtLong(requested_date)} → ${fmtLong(endDate)}`
        : fmtLong(requested_date)
      const locationPart = location_note?.trim() ? ` · ${location_note.trim()}` : ''
      const cardBody = `📅 Booking request · ${dateLabel} · ${time_slot.trim()}${locationPart}`

      await db
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          sender_type: 'client',
          body: cardBody,
        })

      // 2b. Insert the client's actual message as a plain conversational message
      if (description?.trim()) {
        await db
          .from('messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            sender_type: 'client',
            body: description.trim(),
          })
      }

      // 3. Update conversation last_message_at
      await db
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId)

      // 4. Notify photographer
      const { data: photProfile } = await db
        .from('photographer_profiles')
        .select('user_id')
        .eq('id', photographer_id)
        .single()

      if (photProfile?.user_id) {
        // Get client name for notification body
        const { data: clientUser } = await db
          .from('users')
          .select('full_name, email')
          .eq('id', user.id)
          .single()
        const clientName: string = clientUser?.full_name ?? 'A client'

        await notify({
          db,
          userId: photProfile.user_id,
          type: 'booking_request',
          title: 'New booking request',
          body: description?.trim()
            ? `${clientName}: ${description.trim().slice(0, 100)}`
            : `${clientName} requested a booking for ${dateLabel}`,
          entityType: 'booking_request',
          entityId: data.id,
        })

        // Email photographer
        const { data: photUser } = await db
          .from('users').select('email, full_name').eq('id', photProfile.user_id).single()
        if (photUser?.email) {
          // New conversation → send "client messaged you" email
          if (!existingConv) {
            await sendEmailDirect({
              to: photUser.email,
              templateId: 'new_conversation',
              payload: {
                clientName,
                messagePreview: description?.trim()
                  ? description.trim().slice(0, 200)
                  : `Booking request for ${occasion.trim()} on ${dateLabel}`,
              },
            })
          }
          // Also send booking request email immediately
          await sendEmailDirect({
            to: photUser.email,
            templateId: 'booking_received',
            payload: {
              clientName,
              sessionType: occasion.trim(),
              date: dateLabel,
              location: location_note?.trim() ?? null,
              notes: description?.trim() ?? null,
            },
          })
        }
      }
    }
  } catch (e) {
    // Don't fail the booking if conversation/message/notify fails
    console.error('[client/bookings POST] conversation/notify error:', e)
  }

  return NextResponse.json({ ...data, conversation_id: conversationId })
}
