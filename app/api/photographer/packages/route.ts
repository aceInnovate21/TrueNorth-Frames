import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError, notFound } from '@/lib/api-helpers'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

async function getPhotographerId(db: any, userId: string): Promise<string | null> {
  const { data } = await db.from('photographer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

// GET /api/photographer/packages
export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const { data, error } = await db
    .from('packages')
    .select('id, name, description, billing_type, price, deliverables, is_active, is_popular, sort_order, banner_url, specialty')
    .eq('photographer_id', photographerId)
    .order('sort_order', { ascending: true })

  if (error) return serverError('Failed to load packages')
  return NextResponse.json(data ?? [])
}

// POST /api/photographer/packages — create
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const { count } = await db
    .from('packages')
    .select('id', { count: 'exact', head: true })
    .eq('photographer_id', photographerId)

  if ((count ?? 0) >= PLATFORM_CONFIG.max_packages_per_photographer) {
    return badRequest(`Maximum ${PLATFORM_CONFIG.max_packages_per_photographer} packages allowed`)
  }

  const body = await request.json()
  const { name, description, billing_type, price, deliverables, specialty } = body
  if (!name?.trim()) return badRequest('name is required')
  if (price == null || price === '' || isNaN(parseFloat(String(price)))) return badRequest('price is required')
  if (!['hourly', 'package'].includes(billing_type)) return badRequest('billing_type must be hourly or package')

  const { data: existing } = await db
    .from('packages')
    .select('sort_order')
    .eq('photographer_id', photographerId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const sortOrder = existing?.[0]?.sort_order != null ? existing[0].sort_order + 1 : 0

  const { data, error } = await db
    .from('packages')
    .insert({
      photographer_id: photographerId,
      name: name.trim().slice(0, PLATFORM_CONFIG.max_package_name_length),
      description: description?.trim().slice(0, PLATFORM_CONFIG.max_package_description_length) || null,
      billing_type,
      price: parseFloat(price),
      deliverables: Array.isArray(deliverables) ? deliverables.filter(Boolean) : [],
      specialty: specialty ?? null,
      is_active: true,
      sort_order: sortOrder,
    })
    .select('id, name, description, billing_type, price, deliverables, is_active, is_popular, sort_order, banner_url, specialty')
    .single()

  if (error || !data) {
    console.error('[packages POST] insert error:', error)
    return serverError('Failed to create package')
  }
  return NextResponse.json(data)
}

// PATCH /api/photographer/packages — update
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const body = await request.json()
  const { id, name, description, billing_type, price, deliverables, is_active, is_popular, specialty } = body
  if (!id) return badRequest('id is required')

  const updates: Record<string, unknown> = {}
  if (name !== undefined) updates.name = name.trim().slice(0, PLATFORM_CONFIG.max_package_name_length)
  if (description !== undefined) updates.description = description?.trim().slice(0, PLATFORM_CONFIG.max_package_description_length) || null
  if (billing_type !== undefined) updates.billing_type = billing_type
  if (price !== undefined) updates.price = parseFloat(String(price))
  if (deliverables !== undefined) updates.deliverables = Array.isArray(deliverables) ? deliverables.filter(Boolean) : []
  if (is_active !== undefined) updates.is_active = is_active
  if (is_popular !== undefined) updates.is_popular = is_popular
  if (specialty !== undefined) updates.specialty = specialty ?? null

  if (Object.keys(updates).length === 0) return badRequest('no fields to update')

  const { error } = await db
    .from('packages')
    .update(updates)
    .eq('id', id)
    .eq('photographer_id', photographerId)

  if (error) {
    console.error('[packages PATCH] update error:', error)
    return serverError('Failed to update package')
  }
  return NextResponse.json({ success: true })
}

// DELETE /api/photographer/packages
export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const photographerId = await getPhotographerId(db, user.id)
  if (!photographerId) return notFound('Photographer profile not found')

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return badRequest('id is required')

  const { error } = await db
    .from('packages')
    .delete()
    .eq('id', id)
    .eq('photographer_id', photographerId)

  if (error) return serverError('Failed to delete package')
  return NextResponse.json({ success: true })
}
