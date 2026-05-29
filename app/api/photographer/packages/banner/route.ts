import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { uploadToR2 } from '@/lib/r2'
import { randomUUID } from 'crypto'

const MAX_BANNER_BYTES = 5 * 1024 * 1024 // 5 MB

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// POST /api/photographer/packages/banner
// multipart/form-data: file (image), package_id
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const formData = await request.formData()
  const file = formData.get('file') as File | null
  const packageId = (formData.get('package_id') as string | null)?.trim()

  if (!file) return badRequest('file is required')
  if (!packageId) return badRequest('package_id is required')
  if (!file.type.startsWith('image/')) return badRequest('Only image files are allowed')
  if (file.size > MAX_BANNER_BYTES) return badRequest('Banner image must be under 5 MB')

  // Verify the package belongs to this photographer
  const { data: pkg } = await db
    .from('packages')
    .select('id')
    .eq('id', packageId)
    .eq('photographer_id', photographerId)
    .single()
  if (!pkg) return notFound('Package not found')

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg')
  const key = `package_banners/${user.id}/${randomUUID()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    await uploadToR2(key, buffer, file.type)
  } catch {
    return serverError('Failed to upload banner')
  }

  const r2PublicBase = process.env.R2_PUBLIC_URL ?? ''
  const bannerUrl = `${r2PublicBase}/${key}`

  const { error } = await db
    .from('packages')
    .update({ banner_url: bannerUrl })
    .eq('id', packageId)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to save banner URL')

  return NextResponse.json({ banner_url: bannerUrl })
}

// DELETE /api/photographer/packages/banner?package_id=xxx
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const packageId = request.nextUrl.searchParams.get('package_id')
  if (!packageId) return badRequest('package_id is required')

  const { error } = await db
    .from('packages')
    .update({ banner_url: null })
    .eq('id', packageId)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to remove banner')

  return NextResponse.json({ success: true })
}
