import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

// GET /api/client/notifications
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data, error } = await db
    .from('notifications')
    .select('id, type, title, body, read_at, entity_type, entity_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) return serverError('Failed to load notifications')

  return NextResponse.json(data ?? [])
}
