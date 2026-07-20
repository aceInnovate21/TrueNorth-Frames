/**
 * Server-side helper to insert a row into the notifications table.
 * Always fire-and-forget — never throw; a failed notification must not break the calling request.
 *
 * Respects the recipient's in-app notification preferences (push_* columns):
 * a category the user has explicitly turned off is silently skipped. Default is
 * to send (see lib/notification-preferences.ts for the opt-out semantics).
 */

import { pushAllowedForType } from './notification-preferences'

type NotificationType =
  | 'booking_request'
  | 'booking_approved'
  | 'booking_declined'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'new_message'
  | 'connection_request'
  | 'connection_accepted'
  | 'group_invite'
  | 'review_received'
  | 'review_reply'
  | 'trust_score_updated'
  | 'welcome'
  | 'profile_approved'

interface NotifyParams {
  db: any
  userId: string          // recipient's users.id
  type: NotificationType
  title: string
  body?: string
  entityType?: string
  entityId?: string
  expiresInDays?: number  // default: 30
}

export async function notify({
  db,
  userId,
  type,
  title,
  body,
  entityType,
  entityId,
  expiresInDays = 30,
}: NotifyParams): Promise<void> {
  try {
    // Honour the recipient's in-app preferences (opt-out only; default-on).
    if (!(await pushAllowedForType(db, userId, type))) return

    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString()
    await db.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      entity_type: entityType ?? null,
      entity_id: entityId ?? null,
      expires_at: expiresAt,
    })
  } catch {
    // Never propagate — notifications are best-effort
  }
}
