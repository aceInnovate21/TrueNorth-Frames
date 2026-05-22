import { NextResponse } from 'next/server'
import { getServerSession, unauthorized } from '@/lib/api-helpers'

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const { data, error } = await (adminDb as any)
    .from('users')
    .select('id, email, role, full_name, avatar_url, account_status, is_verified, created_at')
    .eq('id', user.id)
    .single() as { data: { id: string; email: string; role: string; full_name: string; avatar_url: string | null; account_status: string; is_verified: boolean; created_at: string } | null; error: unknown }

  if (error || !data) return unauthorized()

  return NextResponse.json({ user: data })
}
