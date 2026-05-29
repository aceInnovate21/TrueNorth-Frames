import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'

// GET /api/client/saved
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: saved, error } = await db
    .from('saved_photographers')
    .select('id, photographer_id, saved_at')
    .eq('client_id', user.id)
    .order('saved_at', { ascending: false })

  if (error) return serverError('Failed to load saved photographers')
  if (!saved || saved.length === 0) return NextResponse.json([])

  const photographerIds: string[] = saved.map((s: any) => s.photographer_id)

  const { data: profiles } = await db
    .from('photographer_profiles')
    .select('id, username, display_name, avatar_url, rate_display, native_avg_rating')
    .in('id', photographerIds)

  const profileMap: Record<string, any> = {}
  for (const p of profiles ?? []) profileMap[p.id] = p

  const result = saved.map((s: any) => {
    const p = profileMap[s.photographer_id] ?? {}
    return {
      id: s.id,
      photographer_id: s.photographer_id,
      username: p.username ?? null,
      display_name: p.display_name ?? null,
      avatar_url: p.avatar_url ?? null,
      rate_display: p.rate_display ?? null,
      native_avg_rating: Number(p.native_avg_rating ?? 0),
    }
  })

  return NextResponse.json(result)
}

// POST /api/client/saved
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { photographer_id } = body
  if (!photographer_id) return badRequest('photographer_id is required')

  const { error } = await db
    .from('saved_photographers')
    .upsert({ client_id: user.id, photographer_id }, { onConflict: 'client_id,photographer_id' })

  if (error) return serverError('Failed to save photographer')

  return NextResponse.json({ success: true })
}

// DELETE /api/client/saved?photographer_id=xxx
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { searchParams } = new URL(request.url)
  const photographer_id = searchParams.get('photographer_id')
  if (!photographer_id) return badRequest('photographer_id query param is required')

  const { error } = await db
    .from('saved_photographers')
    .delete()
    .eq('client_id', user.id)
    .eq('photographer_id', photographer_id)

  if (error) return serverError('Failed to unsave photographer')

  return NextResponse.json({ success: true })
}
