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

  const { data: reviews, error } = await db
    .from('reviews')
    .select(`
      id,
      client_id,
      rating,
      body,
      public_reply,
      replied_at,
      flag_status,
      flag_reason,
      private_note,
      created_at
    `)
    .eq('photographer_id', profile.id)
    .order('created_at', { ascending: false })

  if (error) return serverError('Failed to load reviews')
  if (!reviews || reviews.length === 0) return NextResponse.json([])

  const clientIds = Array.from(new Set(reviews.map((r: any) => r.client_id)))
  const { data: clients } = await db
    .from('users')
    .select('id, full_name')
    .in('id', clientIds)

  const clientMap: Record<string, string> = {}
  for (const c of clients ?? []) {
    clientMap[c.id] = c.full_name
  }

  const result = reviews.map((r: any) => ({
    id: r.id,
    source: 'internal' as const,
    author: clientMap[r.client_id] ?? 'Anonymous',
    rating: r.rating,
    text: r.body ?? '',
    date: r.created_at,
    publicReply: r.public_reply ?? '',
    privateNote: r.private_note ?? '',
    flag: r.flag_status === 'none' ? 'none' : r.flag_status === 'flag_resolved' ? 'flag_resolved' : 'flagged',
    flagReason: r.flag_reason ?? '',
  }))

  return NextResponse.json(result)
}

export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { id, action, public_reply, private_note, flag_reason } = body
  if (!id || !action) return NextResponse.json({ error: 'id and action are required' }, { status: 400 })

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  let updates: Record<string, unknown> = {}

  if (action === 'reply') {
    updates = {
      public_reply: public_reply?.trim() || null,
      replied_at: public_reply?.trim() ? new Date().toISOString() : null,
    }
  } else if (action === 'note') {
    updates = { private_note: private_note?.trim() || null }
  } else if (action === 'flag') {
    updates = {
      flag_status: 'flagged',
      flag_reason: flag_reason?.trim() || null,
      flag_submitted_at: new Date().toISOString(),
    }
  } else if (action === 'unflag') {
    updates = {
      flag_status: 'none',
      flag_reason: null,
      flag_submitted_at: null,
    }
  } else {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const { error } = await db
    .from('reviews')
    .update(updates)
    .eq('id', id)
    .eq('photographer_id', profile.id)

  if (error) return serverError('Failed to update review')

  return NextResponse.json({ success: true })
}
