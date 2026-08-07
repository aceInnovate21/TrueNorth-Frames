import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getServerSession } from '@/lib/api-helpers'

// POST /api/photographer/[username]/view
// Records a deduped daily profile view (fire-and-forget from the profile page).
// - Logged-in viewers are fingerprinted by user id (stable across devices).
// - Anonymous viewers by a salted hash of IP + user-agent.
// - Self-views (the photographer viewing their own profile) are ignored.
// The DB function enforces one-view-per-day dedup and bumps the cached counter.

function classifyReferrer(referer: string | null, host: string | null): string {
  if (!referer) return 'direct'
  try {
    const refHost = new URL(referer).host
    if (host && refHost === host) return 'internal'
    if (/google\.|bing\.|duckduckgo\.|yahoo\./.test(refHost)) return 'search'
    return 'external'
  } catch {
    return 'direct'
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const { user, adminDb } = await getServerSession()
  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id, user_id')
    .eq('username', username)
    .maybeSingle()

  // Only approved-or-not, we still record views; but no profile = nothing to do.
  if (!profile?.id) return NextResponse.json({ counted: false })

  // Ignore self-views.
  if (user && user.id === profile.user_id) {
    return NextResponse.json({ counted: false, reason: 'self' })
  }

  // Fingerprint + viewer role.
  let fingerprint: string
  let viewerId: string | null = null
  let viewerRole = ''

  if (user) {
    viewerId = user.id
    fingerprint = `u:${user.id}`
    const { data: u } = await db.from('users').select('role').eq('id', user.id).maybeSingle()
    viewerRole = u?.role ?? ''
  } else {
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'
    const ua = req.headers.get('user-agent') ?? 'unknown'
    fingerprint = createHash('sha256').update(`${ip}|${ua}`).digest('hex') // 64 chars
    viewerRole = 'anon'
  }

  const referrerType = classifyReferrer(req.headers.get('referer'), req.headers.get('host'))

  const { data: counted, error } = await db.rpc('record_profile_view', {
    p_photographer_id: profile.id,
    p_viewer_id: viewerId,
    p_viewer_role: viewerRole,
    p_fingerprint: fingerprint,
    p_referrer_type: referrerType,
  })

  if (error) return NextResponse.json({ counted: false }, { status: 200 })
  return NextResponse.json({ counted: !!counted })
}
