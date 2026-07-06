import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, notFound, serverError } from '@/lib/api-helpers'

// POST /api/client/messages/[id]/block — client blocks the photographer in this conversation
// DELETE /api/client/messages/[id]/block — client unblocks
//
// Uses the existing `client_blocks` table. Blocking is one-directional
// (client → photographer). While blocked, neither party can send messages.

async function resolveConversation(db: any, userId: string, conversationId: string) {
  const { data: conv } = await db
    .from('conversations')
    .select('id, photographer_id')
    .eq('id', conversationId)
    .eq('client_id', userId)
    .maybeSingle()
  return conv
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const conv = await resolveConversation(db, user.id, params.id)
  if (!conv) return notFound('Conversation not found')

  let reason: string | null = null
  try {
    const body = await request.json()
    if (typeof body?.reason === 'string') reason = body.reason.slice(0, 120)
  } catch {
    /* body optional */
  }

  const { error } = await db
    .from('client_blocks')
    .upsert(
      {
        client_id: user.id,
        photographer_id: conv.photographer_id,
        block_reason: reason,
        blocked_at: new Date().toISOString(),
      },
      { onConflict: 'client_id,photographer_id' }
    )

  if (error) return serverError('Failed to block photographer')
  return NextResponse.json({ blocked: true })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const conv = await resolveConversation(db, user.id, params.id)
  if (!conv) return notFound('Conversation not found')

  const { error } = await db
    .from('client_blocks')
    .delete()
    .eq('client_id', user.id)
    .eq('photographer_id', conv.photographer_id)

  if (error) return serverError('Failed to unblock photographer')
  return NextResponse.json({ blocked: false })
}
