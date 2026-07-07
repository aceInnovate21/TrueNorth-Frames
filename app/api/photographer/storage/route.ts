import { NextResponse } from 'next/server'
import { getServerSession, unauthorized } from '@/lib/api-helpers'
import { getStorageUsage } from '@/lib/storage-quota'

// GET /api/photographer/storage — live storage usage for the portfolio quota meter
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const usage = await getStorageUsage(adminDb as any, user.id)
  return NextResponse.json(usage)
}
