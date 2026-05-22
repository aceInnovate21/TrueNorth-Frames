import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const revalidate = 300 // 5-minute edge cache

function getDb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
}

export async function GET() {
  const db = getDb()
  const { data, error } = await db
    .from('platform_config')
    .select('key, value, value_type')

  if (error) {
    return NextResponse.json({ error: 'Failed to load config' }, { status: 500 })
  }

  const config: Record<string, number | string | boolean> = {}
  for (const row of data ?? []) {
    const raw = row.value as string
    switch (row.value_type) {
      case 'integer':
        config[row.key] = parseInt(raw, 10)
        break
      case 'float':
        config[row.key] = parseFloat(raw)
        break
      case 'boolean':
        config[row.key] = raw === 'true'
        break
      default:
        config[row.key] = raw
    }
  }

  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  })
}
