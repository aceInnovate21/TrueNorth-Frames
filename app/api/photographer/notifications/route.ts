import { NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data, error } = await db
    .from('notifications')
    .select('id, type, title, body, read_at, entity_type, entity_id, created_at')
    .eq('user_id', user.id)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('read_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return serverError('Failed to load notifications')

  return NextResponse.json(data ?? [])
}

export async function PATCH() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { error } = await db
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (error) return serverError('Failed to mark notifications as read')

  return NextResponse.json({ success: true })
}
