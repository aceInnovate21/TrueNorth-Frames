import { NextResponse } from 'next/server'
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

  // Fetch all conversations for this photographer
  const { data: conversations, error: convError } = await db
    .from('conversations')
    .select('id, client_id, last_message_at, is_frozen, created_at')
    .eq('photographer_id', profile.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (convError) return serverError('Failed to load conversations')
  if (!conversations || conversations.length === 0) return NextResponse.json([])

  const convIds = conversations.map((c: any) => c.id)
  const clientIds = Array.from(new Set(conversations.map((c: any) => c.client_id)))

  // Fetch client info and last messages in parallel
  const [clientsRes, messagesRes] = await Promise.all([
    db.from('users').select('id, full_name, avatar_url').in('id', clientIds),
    db
      .from('messages')
      .select('id, conversation_id, body, sender_type, read_at, created_at')
      .in('conversation_id', convIds)
      .order('created_at', { ascending: false }),
  ])

  const clientMap: Record<string, { full_name: string; avatar_url: string | null }> = {}
  for (const c of clientsRes.data ?? []) {
    clientMap[c.id] = { full_name: c.full_name, avatar_url: c.avatar_url }
  }

  // Group messages by conversation, keep last message and unread count
  const messagesByConv: Record<string, { last: any; unread: number }> = {}
  for (const m of messagesRes.data ?? []) {
    if (!messagesByConv[m.conversation_id]) {
      messagesByConv[m.conversation_id] = { last: m, unread: 0 }
    }
    // Count messages sent by client that photographer hasn't read
    if (m.sender_type === 'client' && !m.read_at) {
      messagesByConv[m.conversation_id].unread += 1
    }
  }

  const result = conversations.map((conv: any) => {
    const client = clientMap[conv.client_id]
    const fullName: string = client?.full_name ?? 'Unknown'
    const initials = fullName
      .split(' ')
      .filter(Boolean)
      .map((w: string) => w[0].toUpperCase())
      .slice(0, 2)
      .join('')

    const msgData = messagesByConv[conv.id]
    const lastMsg = msgData?.last

    return {
      id: conv.id,
      clientId: conv.client_id,
      clientName: fullName,
      clientInitials: initials,
      clientAvatarUrl: client?.avatar_url ?? null,
      lastMessage: lastMsg?.body ?? '',
      lastMessageAt: lastMsg?.created_at ?? conv.created_at,
      unread: msgData?.unread ?? 0,
      isFrozen: conv.is_frozen,
    }
  })

  return NextResponse.json(result)
}
