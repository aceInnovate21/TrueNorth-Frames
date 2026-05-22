import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

// POST /api/photographer/groups/messages — send a message to a group
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { group_id, body: messageBody, is_system, is_leave, attachment_url, attachment_type, attachment_name, attachment_size } = body
  if (!group_id) return badRequest('group_id is required')
  if (!messageBody?.trim() && !attachment_url) return badRequest('body or attachment is required')

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  // System messages bypass removed/left check; regular messages require active membership
  if (!is_system) {
    const { data: membership } = await db
      .from('group_members')
      .select('group_id')
      .eq('group_id', group_id)
      .eq('photographer_id', me.id)
      .is('removed_at', null)
      .is('left_at', null)
      .single()

    if (!membership) return NextResponse.json({ error: 'Not an active member of this group' }, { status: 403 })
  }

  // Leave messages substitute the real display name; other system messages use their custom body
  const finalBody = is_leave
    ? `${me.display_name} left the conversation.`
    : (messageBody ?? '').trim().slice(0, PLATFORM_CONFIG.max_message_length)

  const { data, error } = await db
    .from('group_messages')
    .insert({
      group_id,
      sender_id: me.id,
      body: finalBody,
      attachment_url: attachment_url ?? null,
      attachment_type: attachment_type ?? null,
      attachment_name: attachment_name ?? null,
      attachment_size: attachment_size ?? null,
    })
    .select('id, group_id, sender_id, body, created_at, attachment_url, attachment_type, attachment_name, attachment_size')
    .single()

  if (error) return serverError('Failed to send message')

  return NextResponse.json(data)
}
