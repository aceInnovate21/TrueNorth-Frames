import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { sendEmailDirect } from '@/lib/email/client'

async function verifyAdmin(db: any, userId: string) {
  const { data } = await db.from('users').select('role').eq('id', userId).single()
  return data?.role === 'admin'
}

// POST /api/admin/support — submit a support ticket (any authenticated user)
// Body: { category, subject, description, review_id?, conversation_id?, reported_user_id? }
export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json()
  const { category, subject, description, review_id, conversation_id, reported_user_id } = body

  if (!category) return badRequest('category is required')
  if (!subject?.trim()) return badRequest('subject is required')
  if (!description?.trim()) return badRequest('description is required')

  const validCategories = ['fake_review', 'inappropriate_content', 'spam_report', 'billing_dispute', 'account_issue', 'other']
  if (!validCategories.includes(category)) return badRequest('invalid category')

  const payload: Record<string, any> = {
    submitted_by:  user.id,
    category,
    subject:       subject.trim().slice(0, 200),
    description:   description.trim().slice(0, 2000),
    status:        'open',
  }
  if (review_id)       payload.review_id       = review_id
  if (conversation_id) payload.conversation_id = conversation_id
  if (reported_user_id) payload.reported_user_id = reported_user_id

  const { data: ticket, error } = await db.from('support_tickets').insert(payload).select('id').single()
  if (error) return serverError('Failed to create ticket')

  // Notify admin email about new ticket
  try {
    const { data: submitter } = await db
      .from('users').select('full_name, email, role').eq('id', user.id).single()
    const adminEmail = process.env.ADMIN_EMAIL ?? 'aceinnovate21@gmail.com'
    await sendEmailDirect({
      to: adminEmail,
      templateId: 'support_ticket_created',
      payload: {
        ticketId:      ticket?.id ?? 'N/A',
        subject:       subject.trim(),
        category,
        submitterName: submitter?.full_name ?? 'Unknown',
        submitterRole: submitter?.role ?? 'unknown',
        description:   description.trim().slice(0, 500),
      },
    })
  } catch { /* best-effort */ }

  return NextResponse.json({ success: true })
}

// GET /api/admin/support?status=open&role=all&q=&page=1
export async function GET(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  if (!await verifyAdmin(db, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') ?? 'all'
  const role   = searchParams.get('role')   ?? 'all'
  const q      = searchParams.get('q')?.trim() ?? ''
  const page   = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit  = 20
  const offset = (page - 1) * limit

  let query = db
    .from('support_tickets')
    .select(`
      id, category, subject, description, status, resolution_note,
      review_id, created_at, updated_at, resolved_at,
      submitter:users!submitted_by(id, full_name, email, role)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') query = query.eq('status', status)

  const { data: tickets, count, error } = await query
  if (error) return serverError('Failed to load tickets')

  // Filter by role and search client-side (since role is on joined table)
  let result = (tickets ?? []).map((t: any) => ({
    id:             t.id,
    submittedBy:    t.submitter?.full_name ?? 'Unknown',
    email:          t.submitter?.email ?? '',
    role:           t.submitter?.role ?? 'client',
    category:       t.category,
    subject:        t.subject,
    message:        t.description,
    status:         t.status,
    adminReply:     t.resolution_note ?? '',
    submittedAt:    t.created_at,
    resolvedAt:     t.resolved_at ?? null,
    updatedAt:      t.updated_at,
    reviewId:       t.review_id ?? null,
  }))

  if (role !== 'all') result = result.filter((t: any) => t.role === role)
  if (q) {
    const lq = q.toLowerCase()
    result = result.filter((t: any) =>
      t.submittedBy.toLowerCase().includes(lq) ||
      t.subject.toLowerCase().includes(lq) ||
      t.message.toLowerCase().includes(lq)
    )
  }

  // Status counts across ALL tickets (not filtered)
  const { data: allStatuses } = await db
    .from('support_tickets')
    .select('status')
  const counts = { open: 0, in_review: 0, resolved: 0, closed: 0 }
  for (const t of allStatuses ?? []) {
    if (t.status in counts) counts[t.status as keyof typeof counts]++
  }

  return NextResponse.json({ tickets: result, total: count ?? 0, counts, page, limit })
}

// PATCH /api/admin/support — update ticket status + reply
export async function PATCH(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any
  if (!await verifyAdmin(db, user.id)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { id, status, resolution_note } = body
  if (!id || !status) return badRequest('id and status are required')

  const updates: Record<string, any> = {
    status,
    updated_at: new Date().toISOString(),
  }
  if (resolution_note !== undefined) updates.resolution_note = resolution_note?.trim() || null
  if (status === 'resolved') updates.resolved_at = new Date().toISOString()
  if (status === 'open') updates.resolved_at = null

  const { error } = await db.from('support_tickets').update(updates).eq('id', id)
  if (error) return serverError('Failed to update ticket')

  // When resolved → email the submitter
  if (status === 'resolved') {
    try {
      const { data: ticket } = await db
        .from('support_tickets')
        .select('submitted_by, subject, resolution_note')
        .eq('id', id)
        .single()
      if (ticket?.submitted_by) {
        const { data: submitter } = await db
          .from('users').select('email, full_name, role').eq('id', ticket.submitted_by).single()
        if (submitter?.email) {
          const firstName = (submitter.full_name ?? 'there').split(' ')[0]
          await sendEmailDirect({
            to: submitter.email,
            templateId: 'support_ticket_resolved',
            payload: {
              ticketId:       id,
              subject:        ticket.subject,
              firstName,
              role:           submitter.role,
              resolutionNote: resolution_note?.trim() ?? ticket.resolution_note ?? null,
            },
          })
        }
      }
    } catch { /* best-effort */ }
  }

  return NextResponse.json({ success: true })
}
