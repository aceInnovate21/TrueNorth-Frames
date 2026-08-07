import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized } from '@/lib/api-helpers'
import { CHAMPION_LABELS } from '@/lib/champions'

const LABEL_MODE_KEY = 'champions_booked_label_mode' // 'auto' | 'booked' | 'contacted'

async function requireAdmin() {
  const { adminDb, user } = await getServerSession()
  if (!user) return { error: unauthorized() }
  const db = adminDb as any
  const { data: me } = await db.from('users').select('role').eq('id', user.id).single()
  if (me?.role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
  }
  return { db, user }
}

// GET /api/admin/champions
// Returns the latest frozen leaderboard (all ranks per category), lock state,
// the Most Booked/Contacted label mode, and the roster of approved photographers
// for the winner picker.
export async function GET() {
  const { db, error } = await requireAdmin()
  if (error) return error

  const { data: latest } = await db
    .from('monthly_champions')
    .select('period')
    .order('period', { ascending: false })
    .limit(1)
    .maybeSingle()

  const period: string | null = latest?.period ?? null

  let rows: any[] = []
  let locked = false
  if (period) {
    const [{ data: r }, { data: lock }] = await Promise.all([
      db.from('monthly_champions')
        .select(`category, rank, metric_value, metric_label,
                 photographer:photographer_profiles!photographer_id(id, username, display_name, avatar_url)`)
        .eq('period', period)
        .order('rank', { ascending: true }),
      db.from('champion_locks').select('period').eq('period', period).maybeSingle(),
    ])
    rows = r ?? []
    locked = !!lock
  }

  const categories: Record<string, any[]> = {}
  for (const key of Object.keys(CHAMPION_LABELS)) categories[key] = []
  for (const row of rows) {
    if (!row.photographer) continue
    ;(categories[row.category] ??= []).push({
      rank: row.rank,
      metricValue: Number(row.metric_value),
      metricLabel: row.metric_label,
      photographerId: row.photographer.id,
      username: row.photographer.username,
      displayName: row.photographer.display_name,
      avatarUrl: row.photographer.avatar_url,
    })
  }

  const { data: modeRow } = await db
    .from('platform_config').select('value').eq('key', LABEL_MODE_KEY).maybeSingle()
  const labelMode = modeRow?.value ?? 'auto'

  const { data: roster } = await db
    .from('photographer_profiles')
    .select('id, username, display_name')
    .eq('profile_status', 'approved')
    .order('display_name', { ascending: true })

  return NextResponse.json({ period, locked, labelMode, labels: CHAMPION_LABELS, categories, roster: roster ?? [] })
}

// POST /api/admin/champions
// Body: { action, ...args }. Actions:
//   set_winner   { period, category, photographerId }
//   remove_entry { period, category, photographerId }
//   set_lock     { period, locked }
//   set_label    { mode }               // 'auto' | 'booked' | 'contacted'
//   recompute    { period }             // respects the lock
export async function POST(req: NextRequest) {
  const { db, user, error } = await requireAdmin()
  if (error) return error

  const body = await req.json().catch(() => ({}))
  const { action } = body

  switch (action) {
    case 'set_winner': {
      const { period, category, photographerId } = body
      if (!period || !category || !photographerId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      const { error: e } = await db.rpc('champion_set_winner', {
        p_period: period, p_category: category, p_photographer_id: photographerId,
      })
      if (e) return NextResponse.json({ error: e.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    case 'remove_entry': {
      const { period, category, photographerId } = body
      if (!period || !category || !photographerId) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      const { error: e } = await db.rpc('champion_remove_entry', {
        p_period: period, p_category: category, p_photographer_id: photographerId,
      })
      if (e) return NextResponse.json({ error: e.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    case 'set_lock': {
      const { period, locked } = body
      if (!period) return NextResponse.json({ error: 'Missing period' }, { status: 400 })
      if (locked) {
        const { error: e } = await db.from('champion_locks')
          .upsert({ period, locked_by: user.id }, { onConflict: 'period' })
        if (e) return NextResponse.json({ error: e.message }, { status: 500 })
      } else {
        const { error: e } = await db.from('champion_locks').delete().eq('period', period)
        if (e) return NextResponse.json({ error: e.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true })
    }
    case 'set_label': {
      const { mode } = body
      if (!['auto', 'booked', 'contacted'].includes(mode)) return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
      const { error: e } = await db.from('platform_config')
        .upsert({ key: LABEL_MODE_KEY, value: mode, value_type: 'text' }, { onConflict: 'key' })
      if (e) return NextResponse.json({ error: e.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    case 'recompute': {
      const { period } = body
      if (!period) return NextResponse.json({ error: 'Missing period' }, { status: 400 })
      const { data: lock } = await db.from('champion_locks').select('period').eq('period', period).maybeSingle()
      if (lock) return NextResponse.json({ error: 'Month is locked — unlock before recomputing.' }, { status: 409 })
      const { error: e } = await db.rpc('refresh_monthly_champions', { p_period: period })
      if (e) return NextResponse.json({ error: e.message }, { status: 500 })
      return NextResponse.json({ ok: true })
    }
    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
