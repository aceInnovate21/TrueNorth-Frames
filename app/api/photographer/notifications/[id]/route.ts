import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

// DELETE — dismiss a single notification (marks read; owned by session user)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { error } = await db
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return serverError('Failed to dismiss notification')

  return NextResponse.json({ success: true })
}
