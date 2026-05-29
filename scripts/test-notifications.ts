/**
 * Test script: seeds one notification of each type for the first approved photographer,
 * reads them back, and verifies all types are present.
 *
 * Usage: node --env-file=.env.local --experimental-strip-types scripts/test-notifications.ts
 */

import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const db = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) as any

async function seedNotification(userId: string, type: string, title: string, body: string, entityId: string) {
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await db.from('notifications').insert({
    user_id: userId, type, title, body,
    entity_type: 'test', entity_id: entityId, expires_at: expiresAt,
  })
  if (error) console.error(`  ✗ Failed to seed [${type}]:`, error.message)
  else console.log(`  ✓ Seeded: [${type}] "${title}"`)
}

async function run() {
  // Find first approved photographer
  const { data: profile, error } = await db
    .from('photographer_profiles')
    .select('id, user_id, display_name')
    .eq('profile_status', 'approved')
    .limit(1)
    .single()

  if (error || !profile) {
    console.error('No approved photographer profile found:', error?.message ?? 'not found')
    process.exit(1)
  }

  const { user_id: userId, id: profileId, display_name } = profile
  console.log(`\nTarget: "${display_name}" (user_id: ${userId})\n`)

  // Seed all notification types
  const seeds = [
    ['connection_request',  'New connection request',   'Alex Rivera wants to connect with you.'],
    ['connection_accepted', 'Connection accepted',       'Sam Chen accepted your connection request.'],
    ['group_invite',        'Group invitation',          'Jordan Kim invited you to "Edmonton Wedding Photographers".'],
    ['booking_request',     'New booking request',       'A client has requested a session on Jun 20.'],
    ['booking_approved',    'Booking approved!',         'Your booking for Jun 20 has been confirmed.'],
    ['booking_declined',    'Booking declined',          'Your booking for Jun 20 was declined.'],
    ['booking_completed',   'Session completed',         'Your session on Jun 20 has been marked complete.'],
    ['trust_score_updated', 'Trust score updated',       'Your trust score increased from 72.0 to 78.5.'],
    ['review_received',     'New review received',       'A client left you a 5-star review.'],
    ['review_reply',        'Your review got a reply',   'The photographer replied to your review.'],
  ]

  for (const [type, title, body] of seeds) {
    await seedNotification(userId, type, title, body, profileId)
  }

  // Read back and verify
  const { data: rows, error: readErr } = await db
    .from('notifications')
    .select('id, type, title, body, read_at, created_at')
    .eq('user_id', userId)
    .is('read_at', null)
    .order('created_at', { ascending: false })
    .limit(30)

  if (readErr) {
    console.error('\nFailed to read notifications:', readErr.message)
    process.exit(1)
  }

  console.log(`\nUnread notifications read back (${rows?.length ?? 0} rows):\n`)
  for (const r of rows ?? []) {
    console.log(`  [${r.type}] "${r.title}"`)
    if (r.body) console.log(`    → ${r.body}`)
  }

  const seededTypes = seeds.map(s => s[0])
  const returnedTypes = (rows ?? []).map((r: any) => r.type as string)
  const missing = seededTypes.filter(t => !returnedTypes.includes(t))

  if (missing.length > 0) {
    console.error(`\nFAIL — missing types in response: ${missing.join(', ')}`)
    process.exit(1)
  }

  console.log(`\n✓ All ${seeds.length} notification types seeded and read back successfully.`)
  console.log('  Open the dashboard → bell icon to verify the UI renders them.\n')
}

run().catch(err => { console.error(err); process.exit(1) })
