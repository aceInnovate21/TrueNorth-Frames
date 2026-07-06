import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { blockedPhotographerIds } from '@/lib/messaging'

// GET /api/client/conversations
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: conversations, error } = await db
    .from('conversations')
    .select('id, photographer_id, last_message_at, created_at, is_frozen, is_flagged')
    .eq('client_id', user.id)
    .order('last_message_at', { ascending: false, nullsFirst: false })

  if (error) return serverError('Failed to load conversations')
  if (!conversations || conversations.length === 0) return NextResponse.json([])

  const photographerIds: string[] = conversations.map((c: any) => c.photographer_id)

  // Which of these photographers has this client blocked?
  const blockedIds = await blockedPhotographerIds(db, user.id, photographerIds)

  const { data: profiles } = await db
    .from('photographer_profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', photographerIds)

  const profileMap: Record<string, any> = {}
  for (const p of profiles ?? []) profileMap[p.id] = p

  const conversationIds: string[] = conversations.map((c: any) => c.id)

  const { data: allMessages } = await db
    .from('messages')
    .select('id, conversation_id, body, sender_type, read_at, created_at')
    .in('conversation_id', conversationIds)
    .order('created_at', { ascending: false })

  const latestMessageMap: Record<string, any> = {}
  const unreadCountMap: Record<string, number> = {}

  for (const msg of allMessages ?? []) {
    if (!latestMessageMap[msg.conversation_id]) {
      latestMessageMap[msg.conversation_id] = msg
    }
    if (msg.sender_type === 'photographer' && !msg.read_at) {
      unreadCountMap[msg.conversation_id] = (unreadCountMap[msg.conversation_id] ?? 0) + 1
    }
  }

  const result = conversations.map((c: any) => {
    const profile = profileMap[c.photographer_id] ?? {}
    const latest = latestMessageMap[c.id]
    return {
      id: c.id,
      photographer_id: c.photographer_id,
      photographer_username: profile.username ?? null,
      photographer_display_name: profile.display_name ?? null,
      photographer_avatar_url: profile.avatar_url ?? null,
      last_message_body: latest?.body ?? null,
      last_message_at: latest?.created_at ?? c.last_message_at ?? c.created_at,
      unread_count: unreadCountMap[c.id] ?? 0,
      blocked: blockedIds.has(c.photographer_id),
      reported: !!c.is_flagged,
      frozen: !!c.is_frozen,
    }
  })

  return NextResponse.json(result)
}
