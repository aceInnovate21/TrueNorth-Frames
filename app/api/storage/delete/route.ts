import { NextRequest, NextResponse } from 'next/server'
import { deleteFromR2 } from '@/lib/r2'
import { createServiceClient } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  const supabase = createServiceClient()
  const { data: { user } } = await supabase.auth.getUser(
    request.headers.get('authorization')?.replace('Bearer ', '') ?? ''
  )

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { asset_id } = await request.json()
  if (!asset_id) {
    return NextResponse.json({ error: 'asset_id required' }, { status: 400 })
  }

  // Verify ownership before deleting
  const { data: asset } = await supabase
    .from('storage_assets')
    .select('key, owner_id')
    .eq('id', asset_id)
    .single() as { data: { key: string; owner_id: string } | null; error: unknown }

  if (!asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  if (asset.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await deleteFromR2(asset.key)

  await supabase.from('storage_assets').delete().eq('id', asset_id)

  return NextResponse.json({ success: true })
}
