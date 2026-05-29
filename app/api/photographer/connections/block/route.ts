import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

// POST /api/photographer/connections/block
// Body: { blocked_photographer_id }
// Blocks the photographer and deletes any existing DM group between them.
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { blocked_photographer_id } = body
  if (!blocked_photographer_id) return badRequest('blocked_photographer_id is required')

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')
  if (me.id === blocked_photographer_id) return badRequest('Cannot block yourself')

  // Insert block (upsert — idempotent)
  const { error: blockErr } = await db
    .from('photographer_blocks')
    .upsert(
      { blocker_id: me.id, blocked_id: blocked_photographer_id },
      { onConflict: 'blocker_id,blocked_id' }
    )

  if (blockErr) return serverError('Failed to block photographer')

  // Find and delete any DM group between the two
  const { data: myMemberships } = await db
    .from('group_members')
    .select('group_id')
    .eq('photographer_id', me.id)

  const myGroupIds = (myMemberships ?? []).map((m: any) => m.group_id)

  if (myGroupIds.length > 0) {
    const { data: dmGroups } = await db
      .from('connection_groups')
      .select('id')
      .in('id', myGroupIds)
      .eq('is_dm', true)

    const dmGroupIds = (dmGroups ?? []).map((g: any) => g.id)

    if (dmGroupIds.length > 0) {
      const { data: otherMembership } = await db
        .from('group_members')
        .select('group_id')
        .eq('photographer_id', blocked_photographer_id)
        .in('group_id', dmGroupIds)
        .limit(1)
        .single()

      if (otherMembership) {
        const gid = otherMembership.group_id
        await db.from('group_messages').delete().eq('group_id', gid)
        await db.from('group_members').delete().eq('group_id', gid)
        await db.from('group_invites').delete().eq('group_id', gid)
        await db.from('connection_groups').delete().eq('id', gid)
      }
    }
  }

  return NextResponse.json({ success: true })
}

// DELETE /api/photographer/connections/block
// Body: { blocked_photographer_id }
// Removes the block so the photographer can DM again.
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { blocked_photographer_id } = body
  if (!blocked_photographer_id) return badRequest('blocked_photographer_id is required')

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  await db
    .from('photographer_blocks')
    .delete()
    .eq('blocker_id', me.id)
    .eq('blocked_id', blocked_photographer_id)

  return NextResponse.json({ success: true })
}
