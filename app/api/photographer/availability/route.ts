import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// GET /api/photographer/availability — weekly slots + day overrides
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const [{ data: slots }, { data: dayStatuses }] = await Promise.all([
    db.from('weekly_time_slots')
      .select('id, day_of_week, start_time, end_time, slot_label, is_active')
      .eq('photographer_id', photographerId)
      .order('day_of_week')
      .order('start_time'),
    db.from('availability_day_status')
      .select('id, date, status, note')
      .eq('photographer_id', photographerId)
      .gte('date', new Date().toISOString().slice(0, 10)),
  ])

  const weekly: Record<number, { id: string; start_time: string; end_time: string; slot_label: string; is_active: boolean }[]> = {}
  for (const slot of slots ?? []) {
    if (!weekly[slot.day_of_week]) weekly[slot.day_of_week] = []
    weekly[slot.day_of_week].push({
      id: slot.id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      slot_label: slot.slot_label,
      is_active: slot.is_active,
    })
  }

  return NextResponse.json({ weekly, day_statuses: dayStatuses ?? [] })
}

// POST /api/photographer/availability — save weekly schedule (full replace per day)
// Body: { day_of_week: number, slots: [{ start_time, end_time, slot_label }] }
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const body = await request.json()
  const { day_of_week, slots } = body

  if (day_of_week === undefined || !Array.isArray(slots)) {
    return badRequest('day_of_week and slots are required')
  }
  if (day_of_week < 0 || day_of_week > 6) return badRequest('day_of_week must be 0-6')

  await db
    .from('weekly_time_slots')
    .delete()
    .eq('photographer_id', photographerId)
    .eq('day_of_week', day_of_week)

  if (slots.length > 0) {
    const rows = slots.map((s: { start_time: string; end_time: string; slot_label: string }) => ({
      photographer_id: photographerId,
      day_of_week,
      start_time: s.start_time,
      end_time: s.end_time,
      slot_label: s.slot_label || `${s.start_time} – ${s.end_time}`,
      is_active: true,
    }))
    const { error } = await db.from('weekly_time_slots').insert(rows)
    if (error) return serverError('Failed to save slots')
  }

  return NextResponse.json({ success: true })
}

// PATCH /api/photographer/availability — set a day override status
// Body: { date: "YYYY-MM-DD", status: "available"|"busy"|"tentative" }
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const body = await request.json()
  const { date, status, note } = body
  if (!date || !status) return badRequest('date and status are required')

  const { error } = await db
    .from('availability_day_status')
    .upsert(
      { photographer_id: photographerId, date, status, note: note?.trim() || null },
      { onConflict: 'photographer_id,date' }
    )

  if (error) return serverError('Failed to update day status')
  return NextResponse.json({ success: true })
}

// DELETE /api/photographer/availability — remove a day override
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const { searchParams } = new URL(request.url)
  const date = searchParams.get('date')
  if (!date) return badRequest('date is required')

  await db
    .from('availability_day_status')
    .delete()
    .eq('photographer_id', photographerId)
    .eq('date', date)

  return NextResponse.json({ success: true })
}
