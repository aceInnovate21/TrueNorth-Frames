import { NextResponse } from 'next/server'
import { getServerSession, unauthorized } from '@/lib/api-helpers'

// GET /api/admin/stats — platform-wide stats for admin dashboard
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  // Verify admin
  const { data: me } = await db.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [
    { count: totalClients },
    { count: totalPhotographers },
    { count: pendingApprovals },
    { count: flaggedReviews },
    { count: totalBookings },
    { count: completedBookings },
    { data: recentUsers },
    { data: specialtyRows },
  ] = await Promise.all([
    db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'client'),
    db.from('users').select('*', { count: 'exact', head: true }).eq('role', 'photographer'),
    db.from('photographer_profiles').select('*', { count: 'exact', head: true }).eq('profile_status', 'pending'),
    db.from('reviews').select('*', { count: 'exact', head: true }).eq('flag_status', 'flagged'),
    db.from('booking_requests').select('*', { count: 'exact', head: true }),
    db.from('booking_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    db.from('users')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    db.from('photographer_specialties').select('specialty'),
  ])

  // Specialty distribution
  const specialtyMap: Record<string, number> = {}
  for (const row of specialtyRows ?? []) {
    specialtyMap[row.specialty] = (specialtyMap[row.specialty] ?? 0) + 1
  }
  const specialtyDist = Object.entries(specialtyMap)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 7)

  return NextResponse.json({
    totalClients:       totalClients ?? 0,
    totalPhotographers: totalPhotographers ?? 0,
    pendingApprovals:   pendingApprovals ?? 0,
    flaggedReviews:     flaggedReviews ?? 0,
    totalBookings:      totalBookings ?? 0,
    completedBookings:  completedBookings ?? 0,
    recentActivity:     recentUsers ?? [],
    specialtyDist,
  })
}
