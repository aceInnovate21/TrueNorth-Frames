import { NextResponse } from 'next/server'
import { getServerSession, unauthorized } from '@/lib/api-helpers'

// GET /api/admin/me — verify current user has admin role
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any
  const { data } = await db
    .from('users')
    .select('id, full_name, email, role')
    .eq('id', user.id)
    .single()

  if (!data || data.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ id: data.id, name: data.full_name, email: data.email })
}
