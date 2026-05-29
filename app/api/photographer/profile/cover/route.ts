import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { uploadToR2 } from '@/lib/r2'
import { randomUUID } from 'crypto'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_COVER_BYTES = 8 * 1024 * 1024 // 8 MB

export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) return badRequest('file is required')
  if (!ALLOWED_TYPES.includes(file.type)) return badRequest('Only JPEG, PNG, or WebP images are allowed')
  if (file.size > MAX_COVER_BYTES) return badRequest(`File exceeds ${MAX_COVER_BYTES / 1024 / 1024} MB limit`)

  const ext = file.type === 'image/jpeg' ? 'jpg' : file.type === 'image/png' ? 'png' : 'webp'
  const key = `covers/${user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await uploadToR2(key, buffer, file.type)
  } catch {
    return serverError('Failed to upload cover image')
  }

  const publicUrl = `${process.env.R2_PUBLIC_URL}/${key}`

  await db
    .from('photographer_profiles')
    .update({ cover_image_url: publicUrl, updated_at: new Date().toISOString() })
    .eq('id', profile.id)

  return NextResponse.json({ cover_image_url: publicUrl })
}

export async function DELETE() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  await db
    .from('photographer_profiles')
    .update({ cover_image_url: null, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true })
}
