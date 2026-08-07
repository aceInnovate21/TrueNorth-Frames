import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getAchievements } from '@/lib/champions'

export const revalidate = 300 // 5-minute edge cache

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
}

// GET /api/photographer/[username]/achievements
// Public list of a photographer's Champion podium placements for their profile.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params
  const db = getDb()

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()

  if (!profile?.id) {
    return NextResponse.json({ totalWins: 0, categoriesWon: [], achievements: [] })
  }

  const summary = await getAchievements(db, profile.id)
  return NextResponse.json(summary)
}
