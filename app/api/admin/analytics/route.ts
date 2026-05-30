import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: me } = await db.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    // ── Platform launch date — first user ever signed up ───────────────────────
    const { data: firstUser } = await db
      .from('users')
      .select('created_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
    const platformSince: string | null = firstUser?.created_at ?? null

    // ── Core counts ────────────────────────────────────────────────────────────
    const [
      { count: totalClients },
      { count: totalPhotographers },
      { count: pendingApprovals },
      { count: totalBookings },
      { count: completedBookings },
      { count: totalMessages },
      { count: totalConversations },
      { count: totalReviews },
      { count: savedCount },
    ] = await Promise.all([
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client'),
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'photographer'),
      db.from('photographer_profiles').select('*', { count: 'exact', head: true }).eq('profile_status', 'pending'),
      db.from('booking_requests').select('*', { count: 'exact', head: true }),
      db.from('booking_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      db.from('messages').select('*', { count: 'exact', head: true }),
      db.from('conversations').select('*', { count: 'exact', head: true }),
      db.from('reviews').select('*', { count: 'exact', head: true }).eq('flag_status', 'none'),
      db.from('saved_photographers').select('*', { count: 'exact', head: true }),
    ])

    // ── 7-day vs prior-7-day deltas ───────────────────────────────────────────
    const sevenDaysAgo    = new Date(Date.now() -  7 * 24 * 60 * 60 * 1000).toISOString()
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()

    const [
      { count: newClientsThisWeek },
      { count: newClientsLastWeek },
      { count: newPhotographersThisWeek },
      { count: newPhotographersLastWeek },
      { count: newMessagesThisWeek },
      { count: newMessagesLastWeek },
      { count: newBookingsThisWeek },
      { count: newBookingsLastWeek },
    ] = await Promise.all([
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client').gte('created_at', sevenDaysAgo),
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client').gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'photographer').gte('created_at', sevenDaysAgo),
      db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'photographer').gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
      db.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      db.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
      db.from('booking_requests').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo),
      db.from('booking_requests').select('*', { count: 'exact', head: true }).gte('created_at', fourteenDaysAgo).lt('created_at', sevenDaysAgo),
    ])

    const weekDelta = (a: number, b: number): number | null =>
      b ? Math.round(((a - b) / b) * 100) : null

    // ── Specialty distribution ─────────────────────────────────────────────────
    const { data: specialtyRows } = await db
      .from('photographer_specialties')
      .select('specialty, photographer_id')

    const specialtyMap: Record<string, number> = {}
    for (const row of specialtyRows ?? []) {
      specialtyMap[row.specialty] = (specialtyMap[row.specialty] ?? 0) + 1
    }
    const specialtyDist = Object.entries(specialtyMap)
      .map(([label, supply]) => ({ label, supply }))
      .sort((a, b) => b.supply - a.supply)
      .slice(0, 10)

    // ── Area / neighbourhood metrics ──────────────────────────────────────────
    // Pull location from photographer_profiles and client_profiles
    const { data: photographerLocationRows } = await db
      .from('photographer_profiles')
      .select('location')
      .not('location', 'is', null)

    const areaPhotographerMap: Record<string, number> = {}
    for (const r of photographerLocationRows ?? []) {
      const area = extractNeighbourhood(r.location)
      if (area) areaPhotographerMap[area] = (areaPhotographerMap[area] ?? 0) + 1
    }

    const { data: clientLocationRows } = await db
      .from('client_profiles')
      .select('location')
      .not('location', 'is', null)

    const areaClientMap: Record<string, number> = {}
    for (const r of clientLocationRows ?? []) {
      const area = extractNeighbourhood(r.location)
      if (area) areaClientMap[area] = (areaClientMap[area] ?? 0) + 1
    }

    const allAreas = new Set([
      ...Object.keys(areaPhotographerMap),
      ...Object.keys(areaClientMap),
    ])
    const areaMetrics = Array.from(allAreas)
      .map(area => ({
        area,
        photographers: areaPhotographerMap[area] ?? 0,
        clients:       areaClientMap[area] ?? 0,
      }))
      .filter(a => a.photographers > 0 || a.clients > 0)
      .sort((a, b) => (b.photographers + b.clients) - (a.photographers + a.clients))
      .slice(0, 8)

    // ── Top photographers by conversation count ───────────────────────────────
    const { data: convRows } = await db
      .from('conversations')
      .select('photographer_id')

    const convByPhotographer: Record<string, number> = {}
    for (const row of convRows ?? []) {
      convByPhotographer[row.photographer_id] = (convByPhotographer[row.photographer_id] ?? 0) + 1
    }

    const topPhotographerIds = Object.entries(convByPhotographer)
      .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id)

    let topPhotographers: any[] = []
    if (topPhotographerIds.length > 0) {
      const { data: profRows } = await db
        .from('photographer_profiles')
        .select('id, display_name, location, trust_score, completeness_score, profile_status')
        .in('id', topPhotographerIds)

      const { data: specRows } = await db
        .from('photographer_specialties')
        .select('photographer_id, specialty')
        .in('photographer_id', topPhotographerIds)

      const specMap: Record<string, string[]> = {}
      for (const s of specRows ?? []) {
        if (!specMap[s.photographer_id]) specMap[s.photographer_id] = []
        specMap[s.photographer_id].push(s.specialty)
      }

      topPhotographers = (profRows ?? []).map((p: any) => ({
        id:            p.id,
        displayName:   p.display_name,
        location:      p.location ?? '',
        trustScore:    p.trust_score ?? 0,
        completeness:  p.completeness_score ?? 0,
        profileStatus: p.profile_status,
        specialties:   specMap[p.id] ?? [],
        conversations: convByPhotographer[p.id] ?? 0,
      })).sort((a: any, b: any) => b.conversations - a.conversations)
    }

    // ── Top clients by message count ──────────────────────────────────────────
    const { data: msgRows } = await db
      .from('messages').select('sender_id, sender_type').eq('sender_type', 'client')

    const msgByClient: Record<string, number> = {}
    for (const row of msgRows ?? []) {
      msgByClient[row.sender_id] = (msgByClient[row.sender_id] ?? 0) + 1
    }

    const topClientIds = Object.entries(msgByClient)
      .sort((a, b) => b[1] - a[1]).slice(0, 8).map(([id]) => id)

    let topClients: any[] = []
    if (topClientIds.length > 0) {
      const { data: clientRows } = await db
        .from('users').select('id, full_name, created_at').in('id', topClientIds)

      const { data: savedRows } = await db
        .from('saved_photographers').select('client_id').in('client_id', topClientIds)

      const savedByClient: Record<string, number> = {}
      for (const s of savedRows ?? []) {
        savedByClient[s.client_id] = (savedByClient[s.client_id] ?? 0) + 1
      }

      topClients = (clientRows ?? []).map((c: any) => ({
        id:           c.id,
        fullName:     c.full_name,
        createdAt:    c.created_at,
        messagesSent: msgByClient[c.id] ?? 0,
        saves:        savedByClient[c.id] ?? 0,
      })).sort((a: any, b: any) => b.messagesSent - a.messagesSent)
    }

    // ── Profile completeness (fixed: portfolio = distinct photographers with ≥1 photo) ──
    const { data: profileRows } = await db
      .from('photographer_profiles')
      .select('id, display_name, bio, location, rate_display, completeness_score, avatar_url, cover_image_url, profile_status')

    const total = profileRows?.length ?? 0

    // Distinct photographers who have uploaded at least one photo
    const { data: portfolioDistinct } = await db
      .from('portfolio_photos')
      .select('photographer_id')
    const photographersWithPortfolio = new Set((portfolioDistinct ?? []).map((r: any) => r.photographer_id)).size

    const { data: googleLinks } = await db
      .from('external_platform_links')
      .select('photographer_id').eq('platform', 'google')
    const photographersWithGoogle = new Set((googleLinks ?? []).map((r: any) => r.photographer_id)).size

    const completeness = {
      hasDisplayName: (profileRows ?? []).filter((p: any) => p.display_name).length,
      hasBio:         (profileRows ?? []).filter((p: any) => p.bio).length,
      hasLocation:    (profileRows ?? []).filter((p: any) => p.location).length,
      hasRate:        (profileRows ?? []).filter((p: any) => p.rate_display).length,
      hasAvatar:      (profileRows ?? []).filter((p: any) => p.avatar_url).length,
      hasCover:       (profileRows ?? []).filter((p: any) => p.cover_image_url).length,
      hasPortfolio:   photographersWithPortfolio,
      hasGoogleLinked: photographersWithGoogle,
      total,
    }

    // ── Avg trust score ────────────────────────────────────────────────────────
    const { data: trustRows } = await db
      .from('photographer_profiles')
      .select('trust_score').gt('trust_score', 0).eq('profile_status', 'approved')

    const avgTrust = trustRows && trustRows.length > 0
      ? (trustRows.reduce((s: number, r: any) => s + Number(r.trust_score), 0) / trustRows.length).toFixed(1)
      : null

    const fullyOnboarded = (profileRows ?? []).filter((p: any) => (p.completeness_score ?? 0) >= 80).length

    return NextResponse.json({
      platformSince,
      totalClients:       totalClients       ?? 0,
      totalPhotographers: totalPhotographers ?? 0,
      pendingApprovals:   pendingApprovals   ?? 0,
      totalBookings:      totalBookings      ?? 0,
      completedBookings:  completedBookings  ?? 0,
      totalMessages:      totalMessages      ?? 0,
      totalConversations: totalConversations ?? 0,
      totalReviews:       totalReviews       ?? 0,
      totalSaves:         savedCount         ?? 0,
      avgTrustScore:      avgTrust,
      fullyOnboarded,
      newClientsThisWeek:        newClientsThisWeek        ?? 0,
      newPhotographersThisWeek:  newPhotographersThisWeek  ?? 0,
      newMessagesThisWeek:       newMessagesThisWeek       ?? 0,
      newBookingsThisWeek:       newBookingsThisWeek       ?? 0,
      clientDelta:       weekDelta(newClientsThisWeek       ?? 0, newClientsLastWeek       ?? 0),
      photographerDelta: weekDelta(newPhotographersThisWeek ?? 0, newPhotographersLastWeek ?? 0),
      messageDelta:      weekDelta(newMessagesThisWeek      ?? 0, newMessagesLastWeek      ?? 0),
      bookingDelta:      weekDelta(newBookingsThisWeek      ?? 0, newBookingsLastWeek      ?? 0),
      specialtyDist,
      areaMetrics,
      topPhotographers,
      topClients,
      completeness,
    })
  } catch (e: any) {
    return serverError(e?.message ?? 'Analytics query failed')
  }
}

// Extract a neighbourhood name from a location string like "Oliver, Edmonton"
function extractNeighbourhood(location: string): string | null {
  if (!location) return null
  const parts = location.split(',').map(s => s.trim())
  // If first part is not "Edmonton" and is a real neighbourhood, use it
  if (parts.length >= 2 && parts[0].toLowerCase() !== 'edmonton') return parts[0]
  if (parts.length === 1 && parts[0].toLowerCase() !== 'edmonton') return parts[0]
  return null
}
