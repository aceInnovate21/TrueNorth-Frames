import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { syncTrustScore, syncAllPhotographers } from '@/lib/trust/sync'

// POST /api/admin/trust-sync
// Body: { photographerId?: string }  — omit to sync ALL
// Protected: admin-only or internal cron (via CRON_SECRET header)

export async function POST(request: NextRequest) {
  // Allow internal cron calls via secret header
  const cronSecret = request.headers.get('x-cron-secret')
  const isCron = cronSecret && cronSecret === process.env.CRON_SECRET

  if (!isCron) {
    const { user, adminDb } = await getServerSession()
    if (!user) return unauthorized()
    const db = adminDb as any
    const { data: me } = await db.from('users').select('role').eq('id', user.id).single()
    if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const { photographerId } = body

  try {
    if (photographerId) {
      const score = await syncTrustScore(photographerId)
      return NextResponse.json({ success: true, results: [{ photographerId, score }] })
    }

    const results = await syncAllPhotographers()
    return NextResponse.json({ success: true, results })
  } catch (e: any) {
    return serverError(e?.message ?? 'Sync failed')
  }
}
