import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET/POST /api/cron/monthly-champions
// Runs on the 1st of each month. Recomputes the Champions leaderboard for the
// month that just ended AND the current month, so the homepage always has a
// freshly frozen snapshot to read. Idempotent — safe to re-run.
async function run(request: NextRequest) {
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

  // First day of this month and of last month (UTC).
  const now = new Date()
  const thisMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const lastMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))
  const periods = [lastMonth, thisMonth].map((d) => d.toISOString().slice(0, 10))

  const results: Record<string, string> = {}
  for (const period of periods) {
    const { error } = await db.rpc('refresh_monthly_champions', { p_period: period })
    results[period] = error ? `error: ${error.message}` : 'ok'
  }

  const failed = Object.values(results).some((r) => r.startsWith('error'))
  return NextResponse.json({ periods: results }, { status: failed ? 500 : 200 })
}

export async function GET(request: NextRequest) {
  return run(request)
}

export async function POST(request: NextRequest) {
  return run(request)
}
