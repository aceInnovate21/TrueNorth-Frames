import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { queueEmail } from '@/lib/email/client'

// GET /api/cron/booking-reminder
// Runs daily at 9 AM MT via Vercel Cron.
// Finds all approved bookings with requested_date = tomorrow and queues
// reminder emails to both the client and the photographer.
async function processReminders(request: NextRequest) {
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

  // Tomorrow's date in YYYY-MM-DD (UTC — adjust if sessions are stored in local time)
  const tomorrow = new Date()
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)
  const tomorrowStr = tomorrow.toISOString().slice(0, 10)

  const { data: bookings, error } = await db
    .from('booking_requests')
    .select(`
      id, occasion, time_slot, location_note, description, requested_date,
      client:users!client_id(id, email, full_name),
      photographer_profile:photographer_profiles!photographer_id(
        id, display_name,
        photographer_user:users!user_id(id, email)
      )
    `)
    .eq('status', 'approved')
    .eq('requested_date', tomorrowStr)

  if (error) return NextResponse.json({ error: 'DB query failed' }, { status: 500 })

  let queued = 0
  const dateLabel = tomorrow.toLocaleDateString('en-CA', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  for (const b of bookings ?? []) {
    const clientEmail: string = b.client?.email
    const clientName: string  = b.client?.full_name ?? 'Client'
    const photogName: string  = b.photographer_profile?.display_name ?? 'Your photographer'
    const photogEmail: string = b.photographer_profile?.photographer_user?.email

    // Reminder to client
    if (clientEmail) {
      await queueEmail({
        to:         clientEmail,
        templateId: 'booking_reminder_client',
        payload: {
          photographerName: photogName,
          date:             dateLabel,
          timeSlot:         b.time_slot ?? 'TBD',
          location:         b.location_note ?? null,
          sessionType:      b.occasion,
        },
      })
      queued++
    }

    // Reminder to photographer
    if (photogEmail) {
      await queueEmail({
        to:         photogEmail,
        templateId: 'booking_reminder_photographer',
        payload: {
          clientName,
          date:        dateLabel,
          timeSlot:    b.time_slot ?? 'TBD',
          location:    b.location_note ?? null,
          sessionType: b.occasion,
          clientNote:  b.description ?? null,
        },
      })
      queued++
    }
  }

  return NextResponse.json({ bookings: (bookings ?? []).length, queued })
}

export async function GET(request: NextRequest)  { return processReminders(request) }
export async function POST(request: NextRequest) { return processReminders(request) }
