import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

// Mark the guided dashboard tour as seen for the current photographer, so it
// never auto-opens again. Idempotent: only stamps the timestamp once (keeps the
// original "first seen" time on repeat calls).
export async function POST() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { error } = await db
    .from('photographer_profiles')
    .update({ onboarding_tour_completed_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('onboarding_tour_completed_at', null)

  if (error) return serverError('Failed to record onboarding tour')
  return NextResponse.json({ success: true })
}
