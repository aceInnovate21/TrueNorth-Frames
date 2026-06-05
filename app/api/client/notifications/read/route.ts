import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

// POST /api/client/notifications/read — mark one or all as read
// Body: { ids: string[] } or { all: true }
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { ids, all } = body

  if (!all && (!Array.isArray(ids) || ids.length === 0)) {
    return badRequest('Provide ids array or all: true')
  }

  let query = db
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null)

  if (!all) query = query.in('id', ids)

  const { error } = await query

  if (error) return serverError('Failed to mark notifications as read')

  return NextResponse.json({ success: true })
}

// DELETE /api/client/notifications/read?id=xxx — dismiss (hard-delete) a single notification
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return badRequest('id is required')

  const { error } = await db
    .from('notifications')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return serverError('Failed to dismiss notification')

  return NextResponse.json({ success: true })
}
