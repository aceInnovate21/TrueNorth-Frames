import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { notify } from '@/lib/notify'

// POST /api/photographer/groups/invites — invite a photographer to a group
// Body: { group_id, invitee_id }
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { group_id, invitee_id } = body
  if (!group_id || !invitee_id) return badRequest('group_id and invitee_id are required')

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  // Verify inviter is a member of the group
  const { data: membership } = await db
    .from('group_members')
    .select('group_id')
    .eq('group_id', group_id)
    .eq('photographer_id', me.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })

  // Check invitee is not already a member
  const { data: existing } = await db
    .from('group_members')
    .select('group_id')
    .eq('group_id', group_id)
    .eq('photographer_id', invitee_id)
    .single()

  if (existing) return NextResponse.json({ error: 'Already a member' }, { status: 409 })

  // Upsert invite (idempotent — re-invite resets to pending)
  const { error } = await db
    .from('group_invites')
    .upsert(
      {
        group_id,
        inviter_id: me.id,
        invitee_id,
        status: 'pending',
        invited_at: new Date().toISOString(),
      },
      { onConflict: 'group_id,invitee_id' }
    )

  if (error) return serverError('Failed to send invite')

  // Notify invitee photographer
  const { data: inviteeProfile } = await db
    .from('photographer_profiles')
    .select('user_id')
    .eq('id', invitee_id)
    .single()
  const { data: group } = await db
    .from('photographer_groups')
    .select('name')
    .eq('id', group_id)
    .single()
  const { data: inviterProfile } = await db
    .from('photographer_profiles')
    .select('display_name')
    .eq('id', me.id)
    .single()

  if (inviteeProfile?.user_id) {
    await notify({
      db,
      userId: inviteeProfile.user_id,
      type: 'group_invite',
      title: 'Group invitation',
      body: `${inviterProfile?.display_name ?? 'A photographer'} invited you to join "${group?.name ?? 'a group'}".`,
      entityType: 'photographer_group',
      entityId: group_id,
    })
  }

  return NextResponse.json({ success: true })
}

// PATCH /api/photographer/groups/invites — accept or decline an invite
// Body: { invite_id, action: 'accept' | 'decline' }
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { invite_id, action } = body
  if (!invite_id || !['accept', 'decline'].includes(action)) {
    return badRequest('invite_id and action (accept|decline) are required')
  }

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  const { data: invite } = await db
    .from('group_invites')
    .select('id, group_id, status')
    .eq('id', invite_id)
    .eq('invitee_id', me.id)
    .single()

  if (!invite) return NextResponse.json({ error: 'Invite not found' }, { status: 404 })
  if (invite.status !== 'pending') return NextResponse.json({ error: 'Invite already responded' }, { status: 409 })

  await db
    .from('group_invites')
    .update({ status: action === 'accept' ? 'accepted' : 'declined' })
    .eq('id', invite_id)

  if (action === 'accept') {
    await db.from('group_members').insert({
      group_id: invite.group_id,
      photographer_id: me.id,
      is_owner: false,
    })
  }

  return NextResponse.json({ success: true })
}
