import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, notFound, badRequest, serverError } from '@/lib/api-helpers'

// POST /api/client/messages/[id]/report
// Body: { reason: string, note?: string, alsoBlock?: boolean }
//
// Files a spam/abuse report against the photographer in this conversation:
//   - creates a `support_tickets` row (category 'spam_report') for admin review
//   - flags the conversation (is_flagged) so it surfaces in the admin queue
//   - optionally blocks the photographer as well (client_blocks)

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  const conversationId = params.id

  const { data: conv } = await db
    .from('conversations')
    .select('id, photographer_id')
    .eq('id', conversationId)
    .eq('client_id', user.id)
    .maybeSingle()
  if (!conv) return notFound('Conversation not found')

  const body = await request.json().catch(() => ({}))
  const reason: string = typeof body?.reason === 'string' ? body.reason.slice(0, 120) : ''
  const note: string = typeof body?.note === 'string' ? body.note.slice(0, 1000) : ''
  const alsoBlock: boolean = body?.alsoBlock === true
  if (!reason) return badRequest('reason is required')

  // Resolve the photographer's user id for reported_user_id
  const { data: photProfile } = await db
    .from('photographer_profiles')
    .select('user_id, display_name')
    .eq('id', conv.photographer_id)
    .maybeSingle()

  const now = new Date().toISOString()

  // 1. Create the support ticket
  const { error: ticketErr } = await db.from('support_tickets').insert({
    submitted_by: user.id,
    conversation_id: conversationId,
    reported_user_id: photProfile?.user_id ?? null,
    spam_reason: reason,
    category: 'spam_report',
    subject: `Reported conversation: ${photProfile?.display_name ?? 'photographer'}`,
    description: note || reason,
    status: 'open',
  })
  if (ticketErr) return serverError('Failed to submit report')

  // 2. Flag the conversation for admin review
  await db
    .from('conversations')
    .update({
      is_flagged: true,
      flag_reason: reason,
      flagged_at: now,
      flagged_by: user.id,
    })
    .eq('id', conversationId)

  // 3. Optionally block
  if (alsoBlock) {
    await db.from('client_blocks').upsert(
      {
        client_id: user.id,
        photographer_id: conv.photographer_id,
        block_reason: reason,
        blocked_at: now,
      },
      { onConflict: 'client_id,photographer_id' }
    )
  }

  return NextResponse.json({ reported: true, blocked: alsoBlock })
}
