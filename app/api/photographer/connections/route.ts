import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { notify } from '@/lib/notify'

// Deterministic avatar colour from photographer id
const BG_PALETTE = [
  'bg-slate-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-rose-500', 'bg-amber-600', 'bg-sky-600', 'bg-teal-600', 'bg-indigo-600',
]
function avatarBg(id: string): string {
  const code = id.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  return BG_PALETTE[code % BG_PALETTE.length]
}
function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('')
}

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id, location')
    .eq('user_id', user.id)
    .single()

  if (!me) return NextResponse.json({ connected: [], pending: [], suggested: [] })

  const myId = me.id

  // All connections involving this photographer
  const { data: connections, error: connError } = await db
    .from('photographer_connections')
    .select('id, requester_id, addressee_id, status')
    .or(`requester_id.eq.${myId},addressee_id.eq.${myId}`)

  if (connError) return serverError('Failed to load connections')

  // Collect all profile ids we need to look up
  const allOtherIds = (connections ?? []).map((c: any) =>
    c.requester_id === myId ? c.addressee_id : c.requester_id
  )

  // Fetch all approved photographers for suggestions (excluding already connected)
  const { data: allPhotographers } = await db
    .from('photographer_profiles')
    .select('id, display_name, location')
    .eq('profile_status', 'approved')
    .neq('id', myId)

  const connectedIds = new Set<string>(
    (connections ?? [])
      .filter((c: any) => c.status === 'accepted')
      .map((c: any) => c.requester_id === myId ? c.addressee_id : c.requester_id)
  )
  const pendingIds = new Set<string>(
    (connections ?? [])
      .filter((c: any) => c.status === 'pending')
      .map((c: any) => c.requester_id === myId ? c.addressee_id : c.requester_id)
  )

  // Fetch specialties for all relevant photographers
  const relevantIds = Array.from(new Set([...Array.from(connectedIds), ...Array.from(pendingIds)]))
  let specialtyMap: Record<string, string[]> = {}
  if (relevantIds.length > 0) {
    const { data: specs } = await db
      .from('photographer_specialties')
      .select('photographer_id, specialty')
      .in('photographer_id', relevantIds)
    for (const s of specs ?? []) {
      if (!specialtyMap[s.photographer_id]) specialtyMap[s.photographer_id] = []
      specialtyMap[s.photographer_id].push(s.specialty)
    }
  }

  // Build profile lookup for connected/pending
  const profilesNeeded = (allPhotographers ?? []).filter((p: any) =>
    connectedIds.has(p.id) || pendingIds.has(p.id)
  )
  const profileMap: Record<string, any> = {}
  for (const p of profilesNeeded) {
    profileMap[p.id] = p
  }

  const connected = (connections ?? [])
    .filter((c: any) => c.status === 'accepted')
    .map((c: any) => {
      const otherId = c.requester_id === myId ? c.addressee_id : c.requester_id
      const p = profileMap[otherId]
      if (!p) return null
      return {
        id: otherId,
        connectionId: c.id,
        name: p.display_name,
        initials: initials(p.display_name),
        bg: avatarBg(otherId),
        area: p.location ?? '',
        specialties: specialtyMap[otherId] ?? [],
        status: 'connected' as const,
        coverAvailable: false,
      }
    })
    .filter(Boolean)

  const pending = (connections ?? [])
    .filter((c: any) => c.status === 'pending')
    .map((c: any) => {
      const otherId = c.requester_id === myId ? c.addressee_id : c.requester_id
      const isSentByMe = c.requester_id === myId
      const p = profileMap[otherId]
      if (!p) return null
      return {
        id: otherId,
        connectionId: c.id,
        name: p.display_name,
        initials: initials(p.display_name),
        bg: avatarBg(otherId),
        area: p.location ?? '',
        specialties: specialtyMap[otherId] ?? [],
        status: isSentByMe ? ('pending_sent' as const) : ('pending_received' as const),
        coverAvailable: false,
      }
    })
    .filter(Boolean)

  // Smart suggestions — ranked by specialty overlap + same location
  const excludedIds = new Set([myId, ...Array.from(connectedIds), ...Array.from(pendingIds)])
  const candidates = (allPhotographers ?? []).filter((p: any) => !excludedIds.has(p.id))

  // Fetch my own specialties for ranking
  const { data: mySpecs } = await db
    .from('photographer_specialties')
    .select('specialty')
    .eq('photographer_id', myId)
  const mySpecialties = new Set<string>((mySpecs ?? []).map((s: any) => s.specialty as string))

  // Fetch specialties for all candidates
  const candidateIds = candidates.map((p: any) => p.id)
  let candidateSpecialtyMap: Record<string, string[]> = {}
  if (candidateIds.length > 0) {
    const { data: cspecs } = await db
      .from('photographer_specialties')
      .select('photographer_id, specialty')
      .in('photographer_id', candidateIds)
    for (const s of cspecs ?? []) {
      if (!candidateSpecialtyMap[s.photographer_id]) candidateSpecialtyMap[s.photographer_id] = []
      candidateSpecialtyMap[s.photographer_id].push(s.specialty)
    }
  }

  const myLocation = me.location ?? ''
  const totalApproved = (allPhotographers ?? []).length

  function rankScore(p: any): number {
    const specs = candidateSpecialtyMap[p.id] ?? []
    const overlap = specs.filter((s: string) => mySpecialties.has(s)).length
    const sameLocation = myLocation && p.location && p.location === myLocation ? 2 : 0
    return overlap + sameLocation
  }

  const ranked = candidates
    .map((p: any) => ({ ...p, _score: rankScore(p) }))
    .sort((a: any, b: any) => b._score - a._score)

  // Show all if fewer than 5 total approved (excluding self); otherwise top 5
  const suggestLimit = totalApproved < 5 ? ranked.length : 5
  const suggested = ranked.slice(0, suggestLimit).map((p: any) => ({
    id: p.id,
    connectionId: null,
    name: p.display_name,
    initials: initials(p.display_name),
    bg: avatarBg(p.id),
    area: p.location ?? '',
    specialties: candidateSpecialtyMap[p.id] ?? [],
    status: 'suggested' as const,
    coverAvailable: false,
  }))

  return NextResponse.json({ connected, pending, suggested })
}

export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { addressee_id, action } = body

  const db = adminDb as any

  const { data: me } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!me) return serverError('Photographer profile not found')

  if (action === 'connect') {
    const { error } = await db
      .from('photographer_connections')
      .insert({ requester_id: me.id, addressee_id, status: 'pending' })
    if (error) {
      console.error('[connections connect] error:', error)
      return serverError('Failed to send connection request')
    }

    // Notify the addressee photographer
    const { data: addresseeProfile } = await db
      .from('photographer_profiles')
      .select('user_id, display_name')
      .eq('id', addressee_id)
      .single()
    const { data: myProfile } = await db
      .from('photographer_profiles')
      .select('display_name')
      .eq('id', me.id)
      .single()

    if (addresseeProfile?.user_id) {
      await notify({
        db,
        userId: addresseeProfile.user_id,
        type: 'connection_request',
        title: 'New connection request',
        body: `${myProfile?.display_name ?? 'A photographer'} wants to connect with you.`,
        entityType: 'photographer_profile',
        entityId: me.id,
      })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'accept' || action === 'decline') {
    const status = action === 'accept' ? 'accepted' : 'declined'
    const { error } = await db
      .from('photographer_connections')
      .update({ status, responded_at: new Date().toISOString() })
      .eq('requester_id', addressee_id)
      .eq('addressee_id', me.id)
      .eq('status', 'pending')
    if (error) return serverError('Failed to update connection')

    // Notify the original requester when accepted
    if (action === 'accept') {
      const { data: requesterProfile } = await db
        .from('photographer_profiles')
        .select('user_id, display_name')
        .eq('id', addressee_id)
        .single()
      const { data: myProfile } = await db
        .from('photographer_profiles')
        .select('display_name')
        .eq('id', me.id)
        .single()

      if (requesterProfile?.user_id) {
        await notify({
          db,
          userId: requesterProfile.user_id,
          type: 'connection_accepted',
          title: 'Connection accepted',
          body: `${myProfile?.display_name ?? 'A photographer'} accepted your connection request.`,
          entityType: 'photographer_profile',
          entityId: me.id,
        })
      }
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'cancel') {
    // Cancel a pending request I sent
    const { error } = await db
      .from('photographer_connections')
      .delete()
      .eq('requester_id', me.id)
      .eq('addressee_id', addressee_id)
      .eq('status', 'pending')
    if (error) return serverError('Failed to cancel request')
    return NextResponse.json({ success: true })
  }

  if (action === 'disconnect') {
    const { error } = await db
      .from('photographer_connections')
      .delete()
      .or(`and(requester_id.eq.${me.id},addressee_id.eq.${addressee_id}),and(requester_id.eq.${addressee_id},addressee_id.eq.${me.id})`)
    if (error) {
      console.error('[connections disconnect] error:', error)
      return serverError('Failed to disconnect')
    }
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
