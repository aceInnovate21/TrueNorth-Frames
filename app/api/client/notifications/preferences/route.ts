import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

const DEFAULTS = {
  email_booking:       true,
  email_messages:      true,
  email_reviews:       true,
  email_trust_updates: false,
  push_booking:        true,
  push_messages:       true,
}

// GET /api/client/notifications/preferences
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data, error } = await db
    .from('notification_preferences')
    .select('email_booking, email_messages, email_reviews, email_trust_updates, push_booking, push_messages')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) return serverError('Failed to load preferences')

  // Return existing row or defaults (row gets created on first PATCH)
  return NextResponse.json(data ?? DEFAULTS)
}

// PATCH /api/client/notifications/preferences
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()

  // Only allow known preference keys
  const allowed = new Set(Object.keys(DEFAULTS))
  const updates: Record<string, boolean> = {}
  for (const [k, v] of Object.entries(body)) {
    if (allowed.has(k) && typeof v === 'boolean') updates[k] = v
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid preferences provided' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString() as any

  const { error } = await db
    .from('notification_preferences')
    .upsert({ user_id: user.id, ...DEFAULTS, ...updates }, { onConflict: 'user_id' })

  if (error) {
    console.error('[notifications/preferences PATCH]', error)
    return serverError('Failed to save preferences')
  }

  return NextResponse.json({ success: true })
}
