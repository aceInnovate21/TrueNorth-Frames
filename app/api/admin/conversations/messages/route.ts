import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

async function verifyAdmin(db: any, userId: string) {
  const { data } = await db.from('users').select('role').eq('id', userId).single()
  return data?.role === 'admin'
}

// GET /api/admin/conversations/messages?conversation_id=xxx
export async function GET(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  if (!await verifyAdmin(db, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const conversationId = new URL(request.url).searchParams.get('conversation_id')
  if (!conversationId) return badRequest('conversation_id is required')

  const { data: messages, error } = await db
    .from('messages')
    .select(`
      id, body, sender_type, created_at,
      sender:users!sender_id(id, full_name)
    `)
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return serverError('Failed to load messages')

  return NextResponse.json(
    (messages ?? []).map((m: any) => ({
      id:         m.id,
      body:       m.body,
      senderType: m.sender_type,
      senderName: m.sender?.full_name ?? 'Unknown',
      createdAt:  m.created_at,
    }))
  )
}
