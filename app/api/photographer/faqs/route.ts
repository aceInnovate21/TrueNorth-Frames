import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'

export async function GET() {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return NextResponse.json([])

  const { data, error } = await db
    .from('photographer_faqs')
    .select('id, question, answer, sort_order, is_published')
    .eq('photographer_id', profile.id)
    .order('sort_order', { ascending: true })

  if (error) return serverError('Failed to load FAQs')

  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { question, answer } = body
  if (!question?.trim() || !answer?.trim()) {
    return NextResponse.json({ error: 'question and answer are required' }, { status: 400 })
  }

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  const { data: existing } = await db
    .from('photographer_faqs')
    .select('sort_order')
    .eq('photographer_id', profile.id)
    .order('sort_order', { ascending: false })
    .limit(1)

  const nextOrder = existing?.[0] ? existing[0].sort_order + 1 : 0

  const { data, error } = await db
    .from('photographer_faqs')
    .insert({
      photographer_id: profile.id,
      question: question.trim(),
      answer: answer.trim(),
      sort_order: nextOrder,
      is_published: true,
    })
    .select('id, question, answer, sort_order, is_published')
    .single()

  if (error) return serverError('Failed to create FAQ')

  return NextResponse.json(data)
}

export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const { id, question, answer, is_published } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  const { sort_order } = body
  const updates: Record<string, unknown> = {}
  if (question !== undefined) updates.question = question.trim()
  if (answer !== undefined) updates.answer = answer.trim()
  if (is_published !== undefined) updates.is_published = is_published
  if (sort_order !== undefined) updates.sort_order = sort_order

  const { error } = await db
    .from('photographer_faqs')
    .update(updates)
    .eq('id', id)
    .eq('photographer_id', profile.id)

  if (error) return serverError('Failed to update FAQ')

  return NextResponse.json({ success: true })
}

// PUT /api/photographer/faqs — bulk reorder [{ id, sort_order }]
export async function PUT(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const body = await request.json()
  const items: { id: string; sort_order: number }[] = body
  if (!Array.isArray(items)) return NextResponse.json({ error: 'array expected' }, { status: 400 })

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  await Promise.all(
    items.map(({ id, sort_order }) =>
      db.from('photographer_faqs').update({ sort_order }).eq('id', id).eq('photographer_id', profile.id)
    )
  )

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Photographer profile not found')

  const { error } = await db
    .from('photographer_faqs')
    .delete()
    .eq('id', id)
    .eq('photographer_id', profile.id)

  if (error) return serverError('Failed to delete FAQ')

  return NextResponse.json({ success: true })
}
