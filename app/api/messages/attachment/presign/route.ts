import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, badRequest, serverError } from '@/lib/api-helpers'
import { createPrivateUploadUrl, PRIVATE_BUCKET } from '@/lib/r2'
import { checkQuota } from '@/lib/storage-quota'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { randomUUID } from 'crypto'

// POST /api/messages/attachment/presign
// Body: { target_type: 'conversation'|'group', target_id, attach_type: 'image'|'video'|'pdf', content_type, size_bytes }
//
// Shared, role-aware presign for message attachments. Verifies the sender may
// post to the target, enforces per-attach-type size + the sender's storage
// quota, issues a private-bucket presigned PUT, and registers an orphan asset.

const SIZE_LIMIT: Record<string, number> = {
  image: PLATFORM_CONFIG.max_message_image_bytes,
  video: PLATFORM_CONFIG.max_message_video_bytes,
  pdf:   PLATFORM_CONFIG.max_message_pdf_bytes,
}

function extFor(attachType: string, contentType: string): string {
  if (attachType === 'image') return 'webp'
  if (attachType === 'pdf') return 'pdf'
  return (contentType.split('/')[1] || 'mp4')
    .replace('quicktime', 'mov')
    .replace('x-msvideo', 'avi')
    .replace('x-matroska', 'mkv')
}

export async function POST(request: NextRequest) {
  const { adminDb, user } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const body = await request.json().catch(() => ({}))
  const { target_type, target_id, attach_type, content_type, size_bytes } = body

  if (target_type !== 'conversation' && target_type !== 'group') return badRequest('invalid target_type')
  if (!target_id) return badRequest('target_id is required')
  if (!['image', 'video', 'pdf'].includes(attach_type)) return badRequest('invalid attach_type')
  if (typeof content_type !== 'string') return badRequest('content_type is required')

  const incoming = Number(size_bytes) || 0
  if (incoming <= 0) return badRequest('size_bytes is required')
  if (incoming > SIZE_LIMIT[attach_type]) {
    return NextResponse.json(
      { error: `File too large. Max for ${attach_type}: ${Math.round(SIZE_LIMIT[attach_type] / 1024 / 1024)} MB` },
      { status: 413 }
    )
  }

  // ── Authorize the sender against the target ────────────────────────────────
  if (target_type === 'conversation') {
    const { data: conv } = await db
      .from('conversations')
      .select('id, client_id, photographer_id')
      .eq('id', target_id)
      .maybeSingle()
    if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    let allowed = conv.client_id === user.id
    if (!allowed) {
      const { data: prof } = await db
        .from('photographer_profiles').select('id').eq('user_id', user.id).maybeSingle()
      allowed = !!prof && prof.id === conv.photographer_id
    }
    if (!allowed) return NextResponse.json({ error: 'Not a participant' }, { status: 403 })
  } else {
    const { data: prof } = await db
      .from('photographer_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!prof) return NextResponse.json({ error: 'Photographer profile not found' }, { status: 403 })
    const { data: membership } = await db
      .from('group_members').select('group_id')
      .eq('group_id', target_id).eq('photographer_id', prof.id).maybeSingle()
    if (!membership) return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 })
  }

  // ── Storage quota (the sender's own quota) ─────────────────────────────────
  const quotaError = await checkQuota(db, user.id, incoming)
  if (quotaError) return NextResponse.json({ error: quotaError }, { status: 413 })

  const ext = extFor(attach_type, content_type)
  const key = `message-attachments/${target_type}/${target_id}/${randomUUID()}.${ext}`

  let uploadUrl: string
  try {
    uploadUrl = await createPrivateUploadUrl(key, content_type, PLATFORM_CONFIG.r2_presigned_url_expiry_seconds)
  } catch {
    return serverError('Failed to create upload URL')
  }

  const orphanExpiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()
  const { data: asset, error } = await db
    .from('storage_assets')
    .insert({
      owner_id: user.id,
      bucket: PRIVATE_BUCKET,
      key,
      content_type,
      size_bytes: incoming,
      entity_type: 'message_attachment',
      orphan_expires_at: orphanExpiresAt,
    })
    .select('id')
    .single()

  if (error || !asset) return serverError('Failed to register attachment')

  return NextResponse.json({ upload_url: uploadUrl, key, asset_id: asset.id })
}
