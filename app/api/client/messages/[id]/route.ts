import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { notify } from '@/lib/notify'
import { isPhotographerBlocked, sendBlockedReason } from '@/lib/messaging'

// GET /api/client/messages/[id] — fetch messages for a conversation, mark photographer messages as read
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any
  const conversationId = params.id

  // Verify conversation belongs to this client
  const { data: conv } = await db
    .from('conversations')
    .select('id, photographer_id')
    .eq('client_id', user.id)
    .eq('id', conversationId)
    .single()

  if (!conv) return NextResponse.json([], { status: 404 })

  // Mark all photographer messages as read
  await db
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('sender_type', 'photographer')
    .is('read_at', null)

  const { data: msgs, error } = await db
    .from('messages')
    .select('id, body, sender_type, created_at, attachment_url, attachment_type, attachment_name, attachment_size')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return serverError('Failed to load messages')

  return NextResponse.json(
    (msgs ?? []).map((m: any) => ({
      id: m.id,
      from: m.sender_type === 'client' ? 'me' : 'them',
      text: m.body,
      time: m.created_at,
      isSystem: (m.body as string).startsWith('📅'),
      attachmentUrl: m.attachment_url ?? null,
      attachmentType: m.attachment_type ?? null,
      attachmentName: m.attachment_name ?? null,
      attachmentSize: m.attachment_size ?? null,
    }))
  )
}

// POST /api/client/messages/[id] — send a message as client
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any
  const conversationId = params.id

  // Verify conversation ownership
  const { data: conv } = await db
    .from('conversations')
    .select('id, photographer_id, is_frozen')
    .eq('client_id', user.id)
    .eq('id', conversationId)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  // Block / freeze enforcement — reject sends when blocked or admin-frozen
  const blocked = await isPhotographerBlocked(db, user.id, conv.photographer_id)
  const blockReason = sendBlockedReason({ blocked, frozen: !!conv.is_frozen })
  if (blockReason) return NextResponse.json({ error: blockReason }, { status: 403 })

  const body = await request.json()
  const { text, attachment_url, attachment_type, attachment_name, attachment_size } = body

  if (!text?.trim() && !attachment_url) {
    return NextResponse.json({ error: 'Message body is required' }, { status: 400 })
  }

  const { data: msg, error } = await db
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_type: 'client',
      body: text?.trim() ?? '',
      attachment_url: attachment_url ?? null,
      attachment_type: attachment_type ?? null,
      attachment_name: attachment_name ?? null,
      attachment_size: attachment_size ?? null,
    })
    .select('id, body, sender_type, created_at, attachment_url, attachment_type, attachment_name, attachment_size')
    .single()

  if (error) return serverError('Failed to send message')

  // Update conversation last_message_at
  await db
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  // Notify photographer
  const { data: photProfile } = await db
    .from('photographer_profiles')
    .select('user_id')
    .eq('id', conv.photographer_id)
    .single()

  if (photProfile?.user_id) {
    const { data: clientUser } = await db
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    const clientName: string = clientUser?.full_name ?? 'A client'

    await notify({
      db,
      userId: photProfile.user_id,
      type: 'new_message',
      title: 'New message',
      body: `${clientName}: ${text.trim().slice(0, 80)}`,
      entityType: 'conversation',
      entityId: conversationId,
    })
  }

  return NextResponse.json({
    id: msg.id,
    from: 'me' as const,
    text: msg.body,
    time: msg.created_at,
    isSystem: false,
    attachmentUrl: msg.attachment_url ?? null,
    attachmentType: msg.attachment_type ?? null,
    attachmentName: msg.attachment_name ?? null,
    attachmentSize: msg.attachment_size ?? null,
  })
}
