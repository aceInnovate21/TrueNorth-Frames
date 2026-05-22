import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}
const BG_PALETTE = [
  'bg-slate-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-rose-500', 'bg-amber-600', 'bg-sky-600', 'bg-teal-600', 'bg-indigo-600',
]
function avatarBg(id: string): string {
  const code = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return BG_PALETTE[code % BG_PALETTE.length]
}
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins <= 1 ? 'Just now' : `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'Yesterday' : `${days}d ago`
}

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single()

  if (!me) return NextResponse.json({ groups: [], invites: [] })

  // Groups where I am a member (includes removed/left — so they can still read history)
  const { data: memberships, error: memErr } = await db
    .from('group_members')
    .select('group_id, is_owner, removed_at, left_at')
    .eq('photographer_id', me.id)

  if (memErr) return serverError('Failed to load group memberships')

  const groupIds = (memberships ?? []).map((m: any) => m.group_id)
  const ownerGroupIds = new Set<string>(
    (memberships ?? []).filter((m: any) => m.is_owner && !m.removed_at && !m.left_at).map((m: any) => m.group_id)
  )
  const removedGroupIds = new Set<string>(
    (memberships ?? []).filter((m: any) => m.removed_at).map((m: any) => m.group_id)
  )
  const leftGroupIds = new Set<string>(
    (memberships ?? []).filter((m: any) => m.left_at).map((m: any) => m.group_id)
  )

  // Pending group invites for me
  const { data: rawInvites } = await db
    .from('group_invites')
    .select('id, group_id, inviter_id, invited_at, status')
    .eq('invitee_id', me.id)
    .eq('status', 'pending')

  let groups: any[] = []

  if (groupIds.length > 0) {
    const { data: groupRows, error: grpErr } = await db
      .from('connection_groups')
      .select('id, name, emoji, owner_id, member_count, is_cover_group')
      .in('id', groupIds)

    if (grpErr) return serverError('Failed to load groups')

    // Fetch active members only (not removed or left) for member lists + last_read_at for me
    const { data: allMembers } = await db
      .from('group_members')
      .select('group_id, photographer_id, last_read_at')
      .in('group_id', groupIds)
      .is('removed_at', null)
      .is('left_at', null)

    // My last_read_at per group
    const myLastRead: Record<string, Date | null> = {}
    for (const m of allMembers ?? []) {
      if (m.photographer_id === me.id) {
        myLastRead[m.group_id] = m.last_read_at ? new Date(m.last_read_at) : null
      }
    }

    // Fetch pending outgoing invites so the UI knows who's already been invited
    const { data: pendingInvites } = await db
      .from('group_invites')
      .select('group_id, invitee_id')
      .in('group_id', groupIds)
      .eq('status', 'pending')

    // Fetch recent messages (last 20 per group)
    const { data: allMessages } = await db
      .from('group_messages')
      .select('id, group_id, sender_id, body, created_at, attachment_url, attachment_type, attachment_name, attachment_size')
      .in('group_id', groupIds)
      .order('created_at', { ascending: false })
      .limit(100)

    // Fetch sender display names
    const senderIds = Array.from(new Set((allMessages ?? []).map((m: any) => m.sender_id)))
    const memberProfileIds = Array.from(new Set((allMembers ?? []).map((m: any) => m.photographer_id)))
    const allProfileIds = Array.from(new Set([...senderIds, ...memberProfileIds]))

    let profileNameMap: Record<string, string> = {}
    if (allProfileIds.length > 0) {
      const { data: profiles } = await db
        .from('photographer_profiles')
        .select('id, display_name')
        .in('id', allProfileIds)
      for (const p of profiles ?? []) {
        profileNameMap[p.id] = p.display_name
      }
    }
    // Always have own name
    profileNameMap[me.id] = me.display_name

    // Group members by group_id
    const membersByGroup: Record<string, string[]> = {}
    for (const m of allMembers ?? []) {
      if (!membersByGroup[m.group_id]) membersByGroup[m.group_id] = []
      membersByGroup[m.group_id].push(m.photographer_id)
    }

    // Pending invites by group_id
    const pendingInvitesByGroup: Record<string, string[]> = {}
    for (const inv of pendingInvites ?? []) {
      if (!pendingInvitesByGroup[inv.group_id]) pendingInvitesByGroup[inv.group_id] = []
      pendingInvitesByGroup[inv.group_id].push(inv.invitee_id)
    }

    // Group messages by group_id (already sorted desc, so first = most recent)
    const messagesByGroup: Record<string, any[]> = {}
    for (const m of allMessages ?? []) {
      if (!messagesByGroup[m.group_id]) messagesByGroup[m.group_id] = []
      if (messagesByGroup[m.group_id].length < 20) {
        messagesByGroup[m.group_id].push(m)
      }
    }

    groups = (groupRows ?? []).map((g: any) => {
      const msgs = (messagesByGroup[g.id] ?? []).reverse() // oldest first for display
      const memberIds = membersByGroup[g.id] ?? []

      const mappedMessages = msgs.map((m: any, idx: number) => {
        const senderName = m.sender_id === me.id ? 'You' : (profileNameMap[m.sender_id] ?? 'Unknown')
        const senderInit = m.sender_id === me.id ? initials(me.display_name) : initials(senderName)
        const senderBg = m.sender_id === me.id ? 'bg-ink' : avatarBg(m.sender_id)
        const isSystem = (
          m.body.endsWith(' left the conversation.') ||
          m.body.startsWith('✅ You\'ve been chosen') ||
          m.body.startsWith('✅ This cover request has been filled') ||
          m.body.startsWith('❌ This cover request has been filled')
        )
        return {
          id: idx + 1,
          senderId: m.sender_id === me.id ? 'me' : m.sender_id,
          senderName,
          senderInitials: senderInit,
          senderBg,
          text: m.body,
          time: relativeTime(m.created_at),
          isSystem,
          attachmentUrl: m.attachment_url ?? null,
          attachmentType: m.attachment_type ?? null,
          attachmentName: m.attachment_name ?? null,
          attachmentSize: m.attachment_size ?? null,
        }
      })

      // Unread = messages from others sent after my last_read_at (or all if never read)
      const lastRead = myLastRead[g.id]
      const unread = msgs.filter(
        (m: any) => m.sender_id !== me.id &&
          (!lastRead || new Date(m.created_at) > lastRead)
      ).length

      const lastMsg = msgs[msgs.length - 1]
      const lastActivityAt = lastMsg?.created_at ?? null

      return {
        id: g.id,
        name: g.name,
        emoji: g.emoji ?? '👥',
        memberIds: memberIds.map((id: string) => id === me.id ? 'me' : id),
        pendingInviteIds: pendingInvitesByGroup[g.id] ?? [],
        ownerId: ownerGroupIds.has(g.id) ? 'me' : g.owner_id,
        messages: mappedMessages,
        unread,
        lastActivityAt,
        isCoverGroup: g.is_cover_group ?? false,
        isRemoved: removedGroupIds.has(g.id),
        isLeft: leftGroupIds.has(g.id),
      }
    })
  }

  // Map invites
  let invites: any[] = []
  if (rawInvites && rawInvites.length > 0) {
    const inviteGroupIds = rawInvites.map((i: any) => i.group_id)
    const inviterIds = rawInvites.map((i: any) => i.inviter_id)

    const [grpRes, inviterRes] = await Promise.all([
      db.from('connection_groups').select('id, name, emoji, member_count').in('id', inviteGroupIds),
      db.from('photographer_profiles').select('id, display_name').in('id', inviterIds),
    ])

    const inviteGroupMap: Record<string, any> = {}
    for (const g of grpRes.data ?? []) inviteGroupMap[g.id] = g

    const inviterMap: Record<string, string> = {}
    for (const p of inviterRes.data ?? []) inviterMap[p.id] = p.display_name

    invites = rawInvites.map((inv: any) => {
      const g = inviteGroupMap[inv.group_id]
      const inviterName = inviterMap[inv.inviter_id] ?? 'Unknown'
      return {
        id: inv.id,
        groupName: g?.name ?? '',
        groupEmoji: g?.emoji ?? '👥',
        invitedBy: inviterName,
        invitedByInitials: initials(inviterName),
        invitedByBg: avatarBg(inv.inviter_id),
        memberCount: g?.member_count ?? 0,
        status: inv.status,
        receivedAt: relativeTime(inv.invited_at),
      }
    })
  }

  return NextResponse.json({ groups, invites })
}

export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { name, emoji } = body
  if (!name?.trim()) return NextResponse.json({ error: 'name is required' }, { status: 400 })

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  const { cover_requester_id, initial_message } = body

  // Cover groups bypass the owned-group cap (they're auto-created, not user-initiated)
  if (!cover_requester_id) {
    const { count: ownedCount } = await db
      .from('group_members')
      .select('group_id', { count: 'exact', head: true })
      .eq('photographer_id', me.id)
      .eq('is_owner', true)

    if ((ownedCount ?? 0) >= PLATFORM_CONFIG.max_owned_groups_per_photographer) {
      return badRequest(`You can only own up to ${PLATFORM_CONFIG.max_owned_groups_per_photographer} groups`)
    }
  }

  const { data: group, error: grpErr } = await db
    .from('connection_groups')
    .insert({
      owner_id: me.id,
      name: name.trim(),
      emoji: emoji ?? '👥',
      member_count: cover_requester_id ? 2 : 1,
      is_cover_group: !!cover_requester_id,
    })
    .select('id, name, emoji, member_count, is_cover_group')
    .single()

  if (grpErr) {
    console.error('[groups POST] insert error:', grpErr)
    return serverError('Failed to create group: ' + grpErr.message)
  }

  // Add creator as member
  await db.from('group_members').insert({
    group_id: group.id,
    photographer_id: me.id,
    is_owner: true,
  })

  // For cover groups: also add the requester and send initial message
  if (cover_requester_id) {
    await db.from('group_members').insert({
      group_id: group.id,
      photographer_id: cover_requester_id,
      is_owner: false,
    })
    if (initial_message) {
      await db.from('group_messages').insert({
        group_id: group.id,
        sender_id: me.id,
        body: initial_message,
      })
    }
  }

  return NextResponse.json(group)
}

// DELETE /api/photographer/groups?id=<groupId>
// Owner: deletes the group entirely. Non-owner: leaves the group.
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const { searchParams } = new URL(request.url)
  const groupId = searchParams.get('id')
  if (!groupId) return badRequest('id is required')

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  // Fetch membership (includes already-left members)
  const { data: membership } = await db
    .from('group_members')
    .select('is_owner, left_at')
    .eq('group_id', groupId)
    .eq('photographer_id', me.id)
    .single()

  if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })

  // Check if this is a cover group — cover groups are always hard-deleted by either member
  const { data: groupRow } = await db
    .from('connection_groups')
    .select('is_cover_group')
    .eq('id', groupId)
    .single()

  const isCoverGroup = groupRow?.is_cover_group ?? false
  const alreadyLeft = !!membership.left_at
  const isOwner = !!membership.is_owner

  if (isOwner || isCoverGroup || alreadyLeft) {
    // Hard delete: remove messages, members, invites, then the group itself
    await db.from('group_messages').delete().eq('group_id', groupId)
    await db.from('group_members').delete().eq('group_id', groupId)
    await db.from('group_invites').delete().eq('group_id', groupId)
    const { error } = await db.from('connection_groups').delete().eq('id', groupId)
    if (error) return serverError('Failed to delete group')
  } else {
    // Soft-leave: keep history visible, mark left_at
    const { error } = await db
      .from('group_members')
      .update({ left_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .eq('photographer_id', me.id)
    if (error) return serverError('Failed to leave group')
  }

  return NextResponse.json({ success: true })
}

// PATCH /api/photographer/groups
// Body: { group_id, member_id? }
//   — with member_id: owner removes that member
//   — without member_id: mark group as read (update last_read_at)
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { group_id, member_id } = body
  if (!group_id) return badRequest('group_id is required')

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  // Mark-read path (no member_id)
  if (!member_id) {
    await db
      .from('group_members')
      .update({ last_read_at: new Date().toISOString() })
      .eq('group_id', group_id)
      .eq('photographer_id', me.id)
    return NextResponse.json({ success: true })
  }

  // Remove-member path
  const { data: membership } = await db
    .from('group_members')
    .select('is_owner')
    .eq('group_id', group_id)
    .eq('photographer_id', me.id)
    .is('removed_at', null)
    .single()

  if (!membership?.is_owner) return NextResponse.json({ error: 'Only the owner can remove members' }, { status: 403 })

  const { error } = await db
    .from('group_members')
    .update({ removed_at: new Date().toISOString() })
    .eq('group_id', group_id)
    .eq('photographer_id', member_id)
    .is('removed_at', null)

  if (error) {
    console.error('[groups PATCH] remove member error:', error)
    return serverError('Failed to remove member')
  }

  return NextResponse.json({ success: true })
}
