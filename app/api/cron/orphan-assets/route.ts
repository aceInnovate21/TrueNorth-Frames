import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { deleteFromBucket } from '@/lib/r2'

export const runtime = 'nodejs'

const BATCH_SIZE = 100

// GET /api/cron/orphan-assets
// Purges storage_assets whose orphan_expires_at has passed (upload started but
// never linked to an entity) and deletes their R2 objects. Covers portfolio,
// avatars/covers, and message attachments across both buckets.
async function run(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronHeader = request.headers.get('x-cron-secret')
  const authorized =
    authHeader?.replace('Bearer ', '') === process.env.CRON_SECRET ||
    cronHeader === process.env.CRON_SECRET
  if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  ) as any

  const nowIso = new Date().toISOString()
  const { data: orphans, error } = await db
    .from('storage_assets')
    .select('id, bucket, key')
    .not('orphan_expires_at', 'is', null)
    .lt('orphan_expires_at', nowIso)
    .limit(BATCH_SIZE)

  if (error) return NextResponse.json({ error: 'Query failed' }, { status: 500 })
  if (!orphans || orphans.length === 0) return NextResponse.json({ purged: 0 })

  let deleted = 0
  const purgedIds: string[] = []
  for (const asset of orphans) {
    try {
      if (asset.bucket && asset.key) await deleteFromBucket(asset.bucket, asset.key)
      purgedIds.push(asset.id)
      deleted++
    } catch (err) {
      // Leave the row so we retry next run; the object may already be gone.
      console.error('[cron/orphan-assets] delete failed for', asset.key, err)
      purgedIds.push(asset.id) // still drop the row — object is unreachable/gone
    }
  }

  if (purgedIds.length > 0) {
    await db.from('storage_assets').delete().in('id', purgedIds)
  }

  return NextResponse.json({ purged: purgedIds.length, objectsDeleted: deleted })
}

export async function GET(request: NextRequest) { return run(request) }
export async function POST(request: NextRequest) { return run(request) }
