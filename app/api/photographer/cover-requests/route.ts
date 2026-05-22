import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

const BG_PALETTE = [
  'bg-slate-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-rose-500', 'bg-amber-600', 'bg-sky-600', 'bg-teal-600', 'bg-indigo-600',
]
function avatarBg(id: string): string {
  const code = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return BG_PALETTE[code % BG_PALETTE.length]
}
function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return NextResponse.json([])

  // Find my connected photographer IDs so we can show their open cover requests too
  const { data: myConnections } = await db
    .from('photographer_connections')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`)
    .eq('status', 'accepted')

  const connectedPhotographerIds: string[] = (myConnections ?? []).map((c: any) =>
    c.requester_id === me.id ? c.addressee_id : c.requester_id
  )

  const coverSelect = 'id, requester_id, booking_id, message, event_type, event_date, start_time, end_time, status, created_at'

  // Received requests: explicitly addressed to me OR open requests from my connections
  let receivedQuery = db
    .from('cover_requests')
    .select(coverSelect)
    .neq('requester_id', me.id)   // never show own posts as incoming
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (connectedPhotographerIds.length > 0) {
    // Show requests explicitly addressed to me OR pending requests from connections
    receivedQuery = db
      .from('cover_requests')
      .select(coverSelect)
      .neq('requester_id', me.id)
      .eq('status', 'pending')
      .or(`recipient_id.eq.${me.id},requester_id.in.(${connectedPhotographerIds.join(',')})`)
      .order('created_at', { ascending: false })
  } else {
    receivedQuery = receivedQuery.eq('recipient_id', me.id)
  }

  const { data: requests, error } = await receivedQuery

  if (error) return serverError('Failed to load cover requests')

  // Fetch requester profile info
  const requesterIds = Array.from(new Set((requests ?? []).map((r: any) => r.requester_id)))
  const { data: profiles } = await db
    .from('photographer_profiles')
    .select('id, display_name, location')
    .in('id', requesterIds)

  const profileMap: Record<string, any> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = p
  }

  // Fetch booking info if present
  const bookingIds = (requests ?? []).filter((r: any) => r.booking_id).map((r: any) => r.booking_id)
  const bookingMap: Record<string, any> = {}
  if (bookingIds.length > 0) {
    const { data: bookings } = await db
      .from('booking_requests')
      .select('id, requested_date, occasion, location_note')
      .in('id', bookingIds)
    for (const b of bookings ?? []) {
      bookingMap[b.id] = b
    }
  }

  const received = (requests ?? []).map((r: any) => {
    const p = profileMap[r.requester_id]
    const booking = r.booking_id ? bookingMap[r.booking_id] : null
    const fromName: string = p?.display_name ?? 'Unknown'
    return {
      id: r.id,
      from: fromName,
      fromInitials: initials(fromName),
      fromBg: avatarBg(r.requester_id),
      eventDate: r.event_date ?? booking?.requested_date ?? '',
      startTime: r.start_time ?? '',
      endTime: r.end_time ?? '',
      event: r.event_type ?? booking?.occasion ?? r.message ?? '',
      area: booking?.location_note ?? p?.location ?? '',
      status: r.status,
      createdAt: r.created_at,
      isOwn: false,
    }
  })

  // Also fetch own posted requests — deduplicate by message+created_at
  // (one post creates N rows, one per recipient)
  const { data: ownRequests } = await db
    .from('cover_requests')
    .select('id, message, event_type, event_date, start_time, end_time, status, created_at, recipient_id')
    .eq('requester_id', me.id)
    .order('created_at', { ascending: false })

  // Find accepted rows so requester can see who said yes and pick one
  const acceptedRows = (ownRequests ?? []).filter((r: any) => r.status === 'accepted')
  const accepterIds = Array.from(new Set(acceptedRows.map((r: any) => r.recipient_id)))
  let accepterProfileMap: Record<string, any> = {}
  if (accepterIds.length > 0) {
    const { data: accepterProfiles } = await db
      .from('photographer_profiles')
      .select('id, display_name, location')
      .in('id', accepterIds)
    for (const p of accepterProfiles ?? []) accepterProfileMap[p.id] = p
  }

  // Group rows by message+minute into one card per post.
  // Terminal statuses (filled/withdrawn) take priority; otherwise the requester's
  // card stays 'pending' so they can choose — even if one or all recipients accepted.
  const terminalRank: Record<string, number> = { filled: 2, withdrawn: 1 }
  const seenMessages = new Map<string, any>()
  const acceptersByKey = new Map<string, any[]>()

  for (const r of ownRequests ?? []) {
    const key = `${r.message}__${r.created_at?.slice(0, 16)}`
    const existing = seenMessages.get(key)
    const rTerminal = terminalRank[r.status] ?? 0
    const existingTerminal = existing ? (terminalRank[existing.status] ?? 0) : -1
    // Replace only if current row has a higher terminal rank (filled beats withdrawn beats pending/accepted)
    if (!existing || rTerminal > existingTerminal) {
      seenMessages.set(key, r)
    }
    // Collect all who said yes so requester can pick
    if (r.status === 'accepted') {
      if (!acceptersByKey.has(key)) acceptersByKey.set(key, [])
      acceptersByKey.get(key)!.push({
        requestId: r.id,
        photographerId: r.recipient_id,
        name: accepterProfileMap[r.recipient_id]?.display_name ?? 'Unknown',
        initials: (accepterProfileMap[r.recipient_id]?.display_name ?? 'UN').split(' ').filter(Boolean).map((w: string) => w[0].toUpperCase()).slice(0, 2).join(''),
        bg: (['bg-slate-600','bg-violet-600','bg-emerald-600','bg-rose-500','bg-amber-600','bg-sky-600','bg-teal-600','bg-indigo-600'])[r.recipient_id.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 8],
        area: accepterProfileMap[r.recipient_id]?.location ?? '',
      })
    }
  }

  const own = Array.from(seenMessages.entries()).map(([key, r]) => {
    const accepters = acceptersByKey.get(key) ?? []
    // Keep as 'pending' from requester's view unless truly terminal
    const displayStatus = terminalRank[r.status] ? r.status : 'pending'
    return {
      id: r.id,
      from: 'You',
      fromInitials: 'ME',
      fromBg: 'bg-ink',
      eventDate: r.event_date ?? '',
      startTime: r.start_time ?? '',
      endTime: r.end_time ?? '',
      event: r.event_type ?? r.message ?? '',
      area: '',
      status: displayStatus,
      createdAt: r.created_at,
      isOwn: true,
      accepters,
    }
  })

  return NextResponse.json([...own, ...received])
}

export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { id, status } = body
  if (!id || !status) return NextResponse.json({ error: 'id and status are required' }, { status: 400 })

  const allowed = ['accepted', 'declined', 'withdrawn', 'filled']
  if (!allowed.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  // 'filled' = requester chose this accepter; auto-decline all other accepters
  if (status === 'filled') {
    // Get the chosen request row to find its message (used to group sibling rows)
    const { data: chosen } = await db
      .from('cover_requests')
      .select('id, recipient_id, message, event_type, event_date, start_time, end_time, requester_id')
      .eq('id', id)
      .eq('requester_id', me.id)
      .single()

    if (!chosen) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

    // Mark chosen as filled
    await db
      .from('cover_requests')
      .update({ status: 'filled', responded_at: new Date().toISOString() })
      .eq('id', id)

    // Auto-decline all other pending/accepted rows from the same requester with same message
    const { data: declinedRows } = await db
      .from('cover_requests')
      .update({ status: 'declined', responded_at: new Date().toISOString() })
      .eq('requester_id', me.id)
      .eq('message', chosen.message)
      .neq('id', id)
      .in('status', ['pending', 'accepted'])
      .select('recipient_id')

    const declinedRecipientIds: string[] = (declinedRows ?? []).map((r: any) => r.recipient_id)

    // Mark Person B's (chosen cover photographer's) calendar as busy server-side
    if (chosen.event_date) {
      await db
        .from('availability_day_status')
        .upsert(
          { photographer_id: chosen.recipient_id, date: chosen.event_date, status: 'busy' },
          { onConflict: 'photographer_id,date' }
        )
    }

    return NextResponse.json({
      success: true,
      recipient_id: chosen.recipient_id,
      message: chosen.message,
      event_date: chosen.event_date ?? null,
      start_time: chosen.start_time ?? null,
      end_time: chosen.end_time ?? null,
      declined_recipient_ids: declinedRecipientIds,
    })
  }

  let query = db
    .from('cover_requests')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', id)
    .select('id, requester_id, message')
  // 'withdrawn' is the requester withdrawing their own request
  if (status === 'withdrawn') {
    query = query.eq('requester_id', me.id)
  } else {
    query = query.eq('recipient_id', me.id)
  }

  const { data: updated, error } = await query.single()
  if (error) return serverError('Failed to update cover request')

  return NextResponse.json({ success: true, requester_id: updated?.requester_id, message: updated?.message })
}

// POST /api/photographer/cover-requests — create a new cover request
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { message, event_type, event_date, start_time, end_time } = body
  if (!event_type?.trim() && !message?.trim()) return badRequest('event_type is required')

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  // Find all connected photographers to notify
  const { data: connections } = await db
    .from('photographer_connections')
    .select('requester_id, addressee_id')
    .or(`requester_id.eq.${me.id},addressee_id.eq.${me.id}`)
    .eq('status', 'accepted')

  const connectedIds: string[] = (connections ?? []).map((c: any) =>
    c.requester_id === me.id ? c.addressee_id : c.requester_id
  )

  const eventLabel = (event_type ?? message ?? '').trim()
  const baseRow = {
    message: eventLabel,
    event_type: event_type?.trim() ?? null,
    event_date: event_date ?? null,
    start_time: start_time ?? null,
    end_time: end_time ?? null,
    status: 'pending',
  }

  if (connectedIds.length === 0) {
    // No connections yet — persist for own tracking; recipient_id = me.id so it's
    // excluded from incoming-requests query (.neq requester_id) but found by own-requests query
    const { data, error } = await db
      .from('cover_requests')
      .insert({ requester_id: me.id, recipient_id: me.id, ...baseRow })
      .select('id, message, event_type, event_date, start_time, end_time, status, created_at')
      .single()
    if (error) return serverError('Failed to create cover request')
    return NextResponse.json({ id: data.id, message: data.message, event_type: data.event_type, event_date: data.event_date, start_time: data.start_time, end_time: data.end_time, status: data.status })
  }

  // Create one request row per connected photographer
  const rows = connectedIds.map((recipientId: string) => ({
    requester_id: me.id,
    recipient_id: recipientId,
    ...baseRow,
  }))

  const { data: inserted, error } = await db
    .from('cover_requests')
    .insert(rows)
    .select('id, message, event_type, event_date, start_time, end_time, status, created_at')
    .limit(1)
    .single()

  if (error) return serverError('Failed to create cover request')
  return NextResponse.json({ id: inserted.id, message: inserted.message, event_type: inserted.event_type, event_date: inserted.event_date, start_time: inserted.start_time, end_time: inserted.end_time, status: inserted.status })
}
