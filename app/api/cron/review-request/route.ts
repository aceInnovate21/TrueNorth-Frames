import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailDirect } from '@/lib/email/client'

// GET/POST /api/cron/review-request
// Runs daily. Sends ONE review reminder for bookings completed ~3 days ago that
// still have no review. The [3d, 4d) window means each booking passes through
// exactly once across daily runs, so no per-booking "reminded" flag is needed.
async function processReviewReminders(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  const isAuthorized =
    authHeader?.replace('Bearer ', '') === process.env.CRON_SECRET ||
    cronHeader === process.env.CRON_SECRET
  if (!isAuthorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ) as any

  const now = Date.now()
  const windowEnd = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()   // completed ≤ 3 days ago
  const windowStart = new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString() // …but > 4 days ago

  const { data: bookings, error } = await db
    .from('booking_requests')
    .select(`
      id, occasion, requested_date, completed_at,
      client:users!client_id(id, email, full_name),
      photographer_profile:photographer_profiles!photographer_id(display_name)
    `)
    .eq('status', 'completed')
    .gte('completed_at', windowStart)
    .lt('completed_at', windowEnd)

  if (error) return NextResponse.json({ error: 'DB query failed' }, { status: 500 })
  if (!bookings || bookings.length === 0) return NextResponse.json({ bookings: 0, sent: 0 })

  // Exclude bookings that already have a review.
  const ids = bookings.map((b: any) => b.id)
  const { data: reviewed } = await db.from('reviews').select('booking_id').in('booking_id', ids)
  const reviewedSet = new Set<string>((reviewed ?? []).map((r: any) => r.booking_id))

  let sent = 0
  for (const b of bookings) {
    if (reviewedSet.has(b.id)) continue
    const clientEmail: string | undefined = b.client?.email
    if (!clientEmail) continue

    const dateLabel = b.requested_date
      ? new Date(b.requested_date + 'T00:00:00').toLocaleDateString('en-CA', { month: 'long', day: 'numeric' })
      : 'your session'

    await sendEmailDirect({
      to: clientEmail,
      templateId: 'booking_completed',
      payload: {
        photographerName: b.photographer_profile?.display_name ?? 'your photographer',
        date: dateLabel,
        bookingId: b.id,
      },
    })
    sent++
  }

  return NextResponse.json({ bookings: bookings.length, sent })
}

export async function GET(request: NextRequest)  { return processReviewReminders(request) }
export async function POST(request: NextRequest) { return processReviewReminders(request) }
