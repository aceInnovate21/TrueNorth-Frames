import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

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

  const allowed = ['approved', 'declined', 'completed']
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

  return NextResponse.json({ success: true })
}
