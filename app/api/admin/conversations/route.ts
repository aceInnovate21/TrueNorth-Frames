import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

async function verifyAdmin(db: any, userId: string) {
  const { data } = await db.from('users').select('role').eq('id', userId).single()
  return data?.role === 'admin'
}

// GET /api/admin/conversations?status=all|active|frozen|flagged&q=&page=1
export async function GET(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  if (!await verifyAdmin(db, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'all'
  const q      = searchParams.get('q')?.trim().toLowerCase() ?? ''
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit  = 30
  const offset = (page - 1) * limit

  let query = db
    .from('conversations')
    .select(`
      id, is_frozen, is_flagged, flag_reason, last_message_at, created_at,
      client:users!client_id(id, full_name),
      photographer:photographer_profiles!photographer_id(id, display_name, username)
    `, { count: 'exact' })
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .range(offset, offset + limit - 1)

  if (status === 'active')  query = query.eq('is_frozen', false).eq('is_flagged', false)
  if (status === 'frozen')  query = query.eq('is_frozen', true)
  if (status === 'flagged') query = query.eq('is_flagged', true)

  const { data: rows, count, error } = await query
  if (error) return serverError('Failed to load conversations')

  // Message counts per conversation
  const convIds = (rows ?? []).map((r: any) => r.id)
  let msgCountMap: Record<string, number> = {}
  if (convIds.length > 0) {
    const { data: msgRows } = await db
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', convIds)
    for (const m of msgRows ?? []) {
      msgCountMap[m.conversation_id] = (msgCountMap[m.conversation_id] ?? 0) + 1
    }
  }

  // Last message per conversation
  let lastMsgMap: Record<string, { body: string; sender_type: string; created_at: string }> = {}
  if (convIds.length > 0) {
    const { data: lastMsgs } = await db
      .from('messages')
      .select('conversation_id, body, sender_type, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false })
    for (const m of lastMsgs ?? []) {
      if (!lastMsgMap[m.conversation_id]) lastMsgMap[m.conversation_id] = m
    }
  }

  // Specialty for each photographer
  const photogIdsRaw = (rows ?? []).map((r: any) => r.photographer?.id).filter(Boolean) as string[]
  const photogIds = photogIdsRaw.filter((id, i) => photogIdsRaw.indexOf(id) === i)
  let specialtyMap: Record<string, string> = {}
  if (photogIds.length > 0) {
    const { data: specRows } = await db
      .from('photographer_specialties')
      .select('photographer_id, specialty')
      .in('photographer_id', photogIds)
    for (const s of specRows ?? []) {
      if (!specialtyMap[s.photographer_id]) specialtyMap[s.photographer_id] = s.specialty
    }
  }

  const conversations = (rows ?? [])
    .filter((r: any) => {
      if (!q) return true
      const clientName = r.client?.full_name?.toLowerCase() ?? ''
      const photogName = r.photographer?.display_name?.toLowerCase() ?? ''
      return clientName.includes(q) || photogName.includes(q) || r.id.includes(q)
    })
    .map((r: any) => {
      const lastMsg = lastMsgMap[r.id]
      const status: 'active' | 'frozen' | 'flagged' =
        r.is_flagged ? 'flagged' : r.is_frozen ? 'frozen' : 'active'
      return {
        id:            r.id,
        status,
        flagReason:    r.flag_reason ?? null,
        createdAt:     r.created_at,
        lastMessageAt: r.last_message_at ?? r.created_at,
        messageCount:  msgCountMap[r.id] ?? 0,
        lastMessageBody:       lastMsg?.body ?? '',
        lastMessageSenderType: lastMsg?.sender_type ?? '',
        client: {
          id:   r.client?.id ?? '',
          name: r.client?.full_name ?? 'Unknown',
        },
        photographer: {
          id:       r.photographer?.id ?? '',
          name:     r.photographer?.display_name ?? 'Unknown',
          username: r.photographer?.username ?? '',
          specialty: specialtyMap[r.photographer?.id] ?? '',
        },
      }
    })

  const allRows = await db.from('conversations').select('is_frozen, is_flagged', { count: 'exact' })
  const allData = allRows.data ?? []
  const counts = {
    total:   allData.length,
    active:  allData.filter((r: any) => !r.is_frozen && !r.is_flagged).length,
    frozen:  allData.filter((r: any) => r.is_frozen).length,
    flagged: allData.filter((r: any) => r.is_flagged).length,
  }

  return NextResponse.json({ conversations, total: count ?? 0, counts, page, limit })
}

// GET /api/admin/conversations/[id]/messages — read thread
// PATCH /api/admin/conversations — freeze, unfreeze, flag
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  if (!await verifyAdmin(db, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, action, flag_reason } = body
  if (!id || !action) return badRequest('id and action required')

  const now = new Date().toISOString()
  let updates: Record<string, any> = {}

  if (action === 'freeze') {
    updates = { is_frozen: true, frozen_at: now, frozen_by: user.id }
  } else if (action === 'unfreeze') {
    updates = { is_frozen: false }
  } else if (action === 'flag') {
    updates = { is_flagged: true, flag_reason: flag_reason?.trim() ?? 'Flagged by admin', flagged_at: now, flagged_by: user.id }
  } else if (action === 'unflag') {
    updates = { is_flagged: false, flag_reason: null }
  } else {
    return badRequest('Invalid action')
  }

  const { error } = await db.from('conversations').update(updates).eq('id', id)
  if (error) return serverError('Failed to update conversation')

  return NextResponse.json({ success: true })
}
