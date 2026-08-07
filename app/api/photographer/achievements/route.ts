import { NextResponse } from 'next/server'
import { getServerSession, unauthorized } from '@/lib/api-helpers'
import { getAchievements } from '@/lib/champions'

// GET /api/photographer/achievements
// The logged-in photographer's own Champion achievements (for the dashboard
// Achievements tab). Same shape as the public per-username endpoint.
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile?.id) {
    return NextResponse.json({ totalWins: 0, categoriesWon: [], achievements: [] })
  }

  const summary = await getAchievements(db, profile.id)
  return NextResponse.json(summary)
}
