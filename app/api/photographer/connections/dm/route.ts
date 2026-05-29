import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

// POST /api/photographer/connections/dm
// Body: { connection_photographer_id }
// Finds or creates a private 1:1 DM group between the caller and a connection.
// Returns { group_id, is_new }
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { connection_photographer_id } = body
  if (!connection_photographer_id) return badRequest('connection_photographer_id is required')

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')
  if (me.id === connection_photographer_id) return badRequest('Cannot DM yourself')

  // Verify an accepted connection exists between the two photographers
  const { data: conn } = await db
    .from('photographer_connections')
    .select('id')
    .or(
      `and(requester_id.eq.${me.id},addressee_id.eq.${connection_photographer_id}),` +
      `and(requester_id.eq.${connection_photographer_id},addressee_id.eq.${me.id})`
    )
    .eq('status', 'accepted')
    .single()

  if (!conn) return NextResponse.json({ error: 'Not connected with this photographer' }, { status: 403 })

  // Check neither party has blocked the other
  const { data: block } = await db
    .from('photographer_blocks')
    .select('id')
    .or(
      `and(blocker_id.eq.${me.id},blocked_id.eq.${connection_photographer_id}),` +
      `and(blocker_id.eq.${connection_photographer_id},blocked_id.eq.${me.id})`
    )
    .limit(1)
    .single()

  if (block) return NextResponse.json({ error: 'Cannot start a conversation with this photographer' }, { status: 403 })

  // Look for an existing DM group that contains exactly these two members
  // Strategy: find all DM groups where I am a member, then check if the other person is also in it
  const { data: myDmMemberships } = await db
    .from('group_members')
    .select('group_id')
    .eq('photographer_id', me.id)

  const myDmGroupIds = (myDmMemberships ?? []).map((m: any) => m.group_id)

  let existingGroupId: string | null = null

  if (myDmGroupIds.length > 0) {
    // Find DM groups (is_dm = true) among my groups
    const { data: dmGroups } = await db
      .from('connection_groups')
      .select('id')
      .in('id', myDmGroupIds)
      .eq('is_dm', true)

    const dmGroupIds = (dmGroups ?? []).map((g: any) => g.id)

    if (dmGroupIds.length > 0) {
      // Check if the other photographer is also in one of those groups
      const { data: otherMembership } = await db
        .from('group_members')
        .select('group_id')
        .eq('photographer_id', connection_photographer_id)
        .in('group_id', dmGroupIds)
        .limit(1)
        .single()

      if (otherMembership) {
        existingGroupId = otherMembership.group_id
      }
    }
  }

  if (existingGroupId) {
    return NextResponse.json({ group_id: existingGroupId, is_new: false })
  }

  // Create a new private DM group
  const { data: otherProfile } = await db
    .from('photographer_profiles')
    .select('display_name')
    .eq('id', connection_photographer_id)
    .single()

  const groupName = otherProfile?.display_name ?? 'Direct Message'

  const { data: group, error: grpErr } = await db
    .from('connection_groups')
    .insert({
      owner_id: me.id,
      name: groupName,
      emoji: '💬',
      member_count: 2,
      is_cover_group: false,
      is_dm: true,
    })
    .select('id')
    .single()

  if (grpErr) return serverError('Failed to create DM group')

  // Add both members
  await db.from('group_members').insert([
    { group_id: group.id, photographer_id: me.id, is_owner: true },
    { group_id: group.id, photographer_id: connection_photographer_id, is_owner: false },
  ])

  return NextResponse.json({ group_id: group.id, is_new: true })
}
