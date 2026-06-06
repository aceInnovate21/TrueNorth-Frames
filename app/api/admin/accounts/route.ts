import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { sendEmail, queueEmail } from '@/lib/email/client'
import { notify } from '@/lib/notify'

// GET /api/admin/accounts?role=client|photographer&q=search&page=1
export async function GET(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: me } = await db.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const role   = searchParams.get('role') ?? 'all'
  const q      = searchParams.get('q')?.trim() ?? ''
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit  = 20
  const offset = (page - 1) * limit

  let query = db.from('users')
    .select('id, full_name, email, role, account_status, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (role !== 'all') query = query.eq('role', role)
  if (q) query = query.ilike('full_name', `%${q}%`)

  const { data: users, count, error } = await query
  if (error) return serverError('Failed to load accounts')

  // For photographers, also fetch profile status
  const photographerIds = (users ?? [])
    .filter((u: any) => u.role === 'photographer')
    .map((u: any) => u.id)

  let profileMap: Record<string, any> = {}
  if (photographerIds.length > 0) {
    const { data: profiles } = await db
      .from('photographer_profiles')
      .select('user_id, username, profile_status, trust_score, native_avg_rating, native_review_count')
      .in('user_id', photographerIds)
    for (const p of profiles ?? []) profileMap[p.user_id] = p
  }

  const result = (users ?? []).map((u: any) => ({
    ...u,
    profile: profileMap[u.id] ?? null,
  }))

  return NextResponse.json({ users: result, total: count ?? 0, page, limit })
}

// PATCH /api/admin/accounts — update account status or approve photographer
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: me } = await db.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { user_id, action } = body
  if (!user_id || !action) return badRequest('user_id and action are required')

  if (action === 'approve_photographer') {
    const { error } = await db.from('photographer_profiles')
      .update({ profile_status: 'approved', approved_at: new Date().toISOString() })
      .eq('user_id', user_id)
    if (error) return serverError('Failed to approve photographer')

    // Email + in-app notification for photographer
    try {
      const { data: photProfile } = await db
        .from('photographer_profiles').select('display_name, username').eq('user_id', user_id).single()
      const { data: photUser } = await db
        .from('users').select('email, full_name').eq('id', user_id).single()
      if (photUser?.email) {
        const firstName = (photUser.full_name ?? 'there').split(' ')[0]
        const approvedPayload = { firstName, username: photProfile?.username ?? '' }
        const sent = await sendEmail({ to: photUser.email, templateId: 'photographer_approved', payload: approvedPayload })
        if (!sent.ok) await queueEmail({ to: photUser.email, templateId: 'photographer_approved', payload: approvedPayload })
      }
      // In-app notification
      await notify({
        db,
        userId: user_id,
        type: 'profile_approved',
        title: "You're live on TrueNorth Frames! 🎉",
        body: 'Your profile has been approved and is now visible to clients. Complete your portfolio and connect your Google Business Profile to stand out.',
        expiresInDays: 30,
      })
    } catch { /* best-effort */ }

  } else if (action === 'suspend') {
    const { error } = await db.from('users')
      .update({ account_status: 'suspended' })
      .eq('id', user_id)
    if (error) return serverError('Failed to suspend account')

    // Email photographer/user about suspension
    try {
      const { data: targetUser } = await db
        .from('users').select('email, full_name, role').eq('id', user_id).single()
      if (targetUser?.email && targetUser.role === 'photographer') {
        const firstName = (targetUser.full_name ?? 'there').split(' ')[0]
        const suspendPayload = { firstName, email: targetUser.email, reason: null }
        const sent = await sendEmail({ to: targetUser.email, templateId: 'photographer_suspended', payload: suspendPayload })
        if (!sent.ok) await queueEmail({ to: targetUser.email, templateId: 'photographer_suspended', payload: suspendPayload })
      }
    } catch { /* best-effort */ }

  } else if (action === 'unsuspend') {
    const { error } = await db.from('users')
      .update({ account_status: 'active' })
      .eq('id', user_id)
    if (error) return serverError('Failed to unsuspend account')
  } else if (action === 'reject_photographer') {
    const { reason } = body
    const { error } = await db.from('photographer_profiles')
      .update({
        profile_status: 'rejected',
        ...(reason?.trim() ? { status_note: reason.trim() } : {}),
      })
      .eq('user_id', user_id)
    if (error) return serverError('Failed to reject photographer')

    // Immediately invalidate all active sessions for this user.
    // Next request they make, the middleware will catch profile_status=rejected and kill the cookie.
    // This also revokes any refresh tokens so they cannot re-authenticate silently.
    try {
      await db.auth.admin.signOut(user_id, 'global')
    } catch { /* non-fatal — middleware handles any lingering sessions */ }

    // Email photographer with rejection reason
    try {
      const { data: photUser } = await db
        .from('users').select('email, full_name').eq('id', user_id).single()
      if (photUser?.email) {
        const firstName = (photUser.full_name ?? 'there').split(' ')[0]
        const rejectedPayload = { firstName, reason: reason?.trim() || null }
        const sent = await sendEmail({ to: photUser.email, templateId: 'photographer_rejected', payload: rejectedPayload })
        if (!sent.ok) await queueEmail({ to: photUser.email, templateId: 'photographer_rejected', payload: rejectedPayload })
      }
    } catch { /* best-effort */ }
  } else {
    return badRequest('Invalid action')
  }

  return NextResponse.json({ success: true })
}
