import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/api-helpers'

export async function POST() {
  const { supabase } = await getServerSession()
  await supabase.auth.signOut()
  return NextResponse.json({ success: true })
}
