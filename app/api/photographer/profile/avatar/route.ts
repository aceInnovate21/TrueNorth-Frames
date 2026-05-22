import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { uploadToR2 } from '@/lib/r2'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id, avatar_url')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return badRequest('file is required')
  if (!ALLOWED_TYPES.includes(file.type)) return badRequest('Only JPEG, PNG, or WebP images are allowed')
  if (file.size > PLATFORM_CONFIG.max_avatar_bytes) {
    return badRequest(`File exceeds ${PLATFORM_CONFIG.max_avatar_bytes / 1024 / 1024} MB limit`)
  }

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const key = `avatars/${user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await uploadToR2(key, buffer, file.type)
  } catch {
    return serverError('Failed to upload avatar')
  }

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  // Update both tables in parallel
  await Promise.all([
    db.from('photographer_profiles')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', profile.id),
    db.from('users')
      .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', user.id),
  ])

  return NextResponse.json({ avatar_url: publicUrl })
}

export async function DELETE() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  await Promise.all([
    db.from('photographer_profiles')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('user_id', user.id),
    db.from('users')
      .update({ avatar_url: null, updated_at: new Date().toISOString() })
      .eq('id', user.id),
  ])

  return NextResponse.json({ success: true })
}
