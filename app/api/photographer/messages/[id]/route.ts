import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { isPhotographerBlocked, sendBlockedReason, claimMessageAttachment, resolveAttachmentUrl } from '@/lib/messaging'

// GET /api/photographer/messages/[id] — fetch full thread for a conversation
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any
  const conversationId = params.id

  // Verify this conversation belongs to the photographer
  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json([])

  const { data: conv } = await db
    .from('conversations')
    .select('id, client_id')
    .eq('id', conversationId)
    .eq('photographer_id', profile.id)
    .single()

  if (!conv) return NextResponse.json([], { status: 404 })

  // Mark all client messages as read
  await db
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('sender_type', 'client')
    .is('read_at', null)

  const { data: msgs, error } = await db
    .from('messages')
    .select('id, body, sender_type, created_at, attachment_key, attachment_url, attachment_type, attachment_name, attachment_size')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) return serverError('Failed to load messages')

  return NextResponse.json(
    await Promise.all((msgs ?? []).map(async (m: any) => ({
      id: m.id,
      from: m.sender_type === 'photographer' ? 'me' : 'them',
      text: m.body,
      time: m.created_at,
      isSystem: (m.body as string).startsWith('📅'),
      attachmentUrl: await resolveAttachmentUrl(m),
      attachmentType: m.attachment_type ?? null,
      attachmentName: m.attachment_name ?? null,
      attachmentSize: m.attachment_size ?? null,
    })))
  )
}

// POST /api/photographer/messages/[id] — send a message in a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any
  const conversationId = params.id

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  const { data: conv } = await db
    .from('conversations')
    .select('id, client_id, is_frozen')
    .eq('id', conversationId)
    .eq('photographer_id', profile.id)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  // Block / freeze enforcement — a client who blocked this photographer
  // (or an admin freeze) stops the photographer from sending.
  const blocked = await isPhotographerBlocked(db, conv.client_id, profile.id)
  const blockReason = sendBlockedReason({ blocked, frozen: !!conv.is_frozen })
  if (blockReason) {
    const msg = blocked
      ? 'You can no longer message this client.'
      : blockReason
    return NextResponse.json({ error: msg }, { status: 403 })
  }

  const body = await request.json()
  const { text, attachment_key, attachment_type, attachment_name, attachment_size } = body

  if (!text?.trim() && !attachment_key) {
    return NextResponse.json({ error: 'Message body or attachment required' }, { status: 400 })
  }

  const { data: msg, error } = await db
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      sender_type: 'photographer',
      body: text?.trim() ?? '',
      attachment_key: attachment_key ?? null,
      attachment_type: attachment_type ?? null,
      attachment_name: attachment_name ?? null,
      attachment_size: attachment_size ?? null,
    })
    .select('id, body, sender_type, created_at, attachment_key, attachment_url, attachment_type, attachment_name, attachment_size')
    .single()

  if (error) return serverError('Failed to send message')

  if (attachment_key) await claimMessageAttachment(db, attachment_key, user.id, msg.id)

  // Update conversation last_message_at
  await db
    .from('conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId)

  return NextResponse.json({
    id: msg.id,
    from: 'me' as const,
    text: msg.body,
    time: msg.created_at,
    attachmentUrl: await resolveAttachmentUrl(msg),
    attachmentType: msg.attachment_type ?? null,
    attachmentName: msg.attachment_name ?? null,
    attachmentSize: msg.attachment_size ?? null,
  })
}
