import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

// GET /api/photographer/champions-standing
// Live current-month standing for the logged-in photographer across the
// count-based Champion categories. Powers the dashboard teaser, e.g.
// "You're #3 in Most Viewed — 12 more profile views to take the lead."
//
// Reads live (not the frozen snapshot) so the number moves through the month,
// and honours the back-to-back rule: if the photographer won a category last
// month they are sitting it out, so that category simply won't appear.

const CATEGORY_META: Record<string, { label: string; unit: string; unitOne: string }> = {
  most_viewed:    { label: 'Most Viewed',    unit: 'profile views', unitOne: 'profile view' },
  most_contacted: { label: 'Most Contacted', unit: 'new enquiries',  unitOne: 'new enquiry' },
  most_booked:    { label: 'Most Booked',    unit: 'bookings',       unitOne: 'booking' },
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

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
    return NextResponse.json({ standings: [] })
  }

  const { data, error } = await db.rpc('photographer_live_standings', {
    p_photographer_id: profile.id,
  })
  if (error) return serverError('Failed to load standings')

  const standings = (data ?? []).map((row: any) => {
    const meta = CATEGORY_META[row.category] ?? { label: row.category, unit: '', unitOne: '' }
    const rank = Number(row.my_rank)
    const gap = Number(row.gap_to_lead)
    const leading = rank === 1
    const unit = gap === 1 ? meta.unitOne : meta.unit
    const message = leading
      ? `You're leading ${meta.label} this month — keep it up!`
      : `You're ${ordinal(rank)} in ${meta.label} this month — ${gap} more ${unit} to take the lead.`
    return {
      category: row.category,
      label: meta.label,
      rank,
      value: Number(row.my_value),
      leaderValue: Number(row.leader_value),
      gapToLead: gap,
      leading,
      message,
    }
  })

  return NextResponse.json({ standings })
}
