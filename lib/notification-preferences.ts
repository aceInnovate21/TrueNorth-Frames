/**
 * Notification-preference enforcement.
 *
 * The `notification_preferences` table stores per-user opt-outs across two
 * channels: email (`email_*`) and in-app/push (`push_*`), grouped into
 * categories (booking, messages, connections, reviews, trust_updates).
 *
 * Semantics — opt-OUT only:
 *   - No preferences row            → send everything (default-on).
 *   - Row exists, column is true    → send.
 *   - Row exists, column is false   → suppress.
 *
 * This is deliberately fail-open: any lookup error, missing row, or unknown
 * category results in the notification being SENT. A preference must be
 * explicitly turned off to suppress — we never silently drop a transactional
 * message because of a read glitch.
 *
 * Currently only clients have a preferences UI; photographers/admins have no
 * row, so they always receive everything (default-on) — which is the intended
 * behaviour until a photographer UI ships.
 */

export type NotificationCategory =
  | 'booking'
  | 'messages'
  | 'connections'
  | 'reviews'
  | 'trust_updates'

type Channel = 'email' | 'push'

// Map in-app notification `type` → preference category.
// Types with no sensible category (e.g. welcome, profile_approved) are treated
// as always-on transactional and are intentionally absent → never suppressed.
const NOTIFICATION_TYPE_CATEGORY: Record<string, NotificationCategory> = {
  booking_request:    'booking',
  booking_approved:   'booking',
  booking_declined:   'booking',
  booking_cancelled:  'booking',
  booking_completed:  'booking',
  new_message:        'messages',
  connection_request: 'connections',
  connection_accepted:'connections',
  group_invite:       'connections',
  review_received:    'reviews',
  review_reply:       'reviews',
  trust_score_updated:'trust_updates',
}

// Map email template id → preference category. Absent templates (welcome,
// approvals, support, moderation, etc.) are always-on transactional mail.
const EMAIL_TEMPLATE_CATEGORY: Record<string, NotificationCategory> = {
  booking_received:                'booking',
  booking_confirmed:               'booking',
  booking_declined:                'booking',
  booking_completed:               'booking',
  booking_cancelled_by_client:     'booking',
  booking_cancellation_confirmed:  'booking',
  booking_reminder_client:         'booking',
  booking_reminder_photographer:   'booking',
  review_received:                 'reviews',
  review_reply:                    'reviews',
}

function columnFor(channel: Channel, category: NotificationCategory): string | null {
  // Only categories that have a real column on the table are gate-able.
  const emailCols: Record<NotificationCategory, string> = {
    booking:       'email_booking',
    messages:      'email_messages',
    connections:   'email_connections',
    reviews:       'email_reviews',
    trust_updates: 'email_trust_updates',
  }
  const pushCols: Partial<Record<NotificationCategory, string>> = {
    booking:     'push_booking',
    messages:    'push_messages',
    connections: 'push_connections',
    // reviews / trust_updates have no push_* column → always-on for in-app
  }
  return channel === 'email' ? emailCols[category] : (pushCols[category] ?? null)
}

/**
 * Returns true if the given user should receive a notification of this
 * category on this channel. Fail-open: unknown category, no column, no row,
 * or any error → true (send).
 */
async function isAllowed(
  db: any,
  userId: string,
  channel: Channel,
  category: NotificationCategory | undefined
): Promise<boolean> {
  if (!category) return true
  const column = columnFor(channel, category)
  if (!column) return true

  try {
    const { data } = await db
      .from('notification_preferences')
      .select(column)
      .eq('user_id', userId)
      .maybeSingle()

    if (!data) return true          // no row → default-on
    return data[column] !== false   // explicit false → suppress; true/null → send
  } catch {
    return true                     // fail-open
  }
}

/** In-app / push channel gate, keyed by the notification `type`. */
export function pushAllowedForType(db: any, userId: string, type: string): Promise<boolean> {
  return isAllowed(db, userId, 'push', NOTIFICATION_TYPE_CATEGORY[type])
}

/** Email channel gate, keyed by the email `templateId`. */
export function emailAllowedForTemplate(db: any, userId: string, templateId: string): Promise<boolean> {
  return isAllowed(db, userId, 'email', EMAIL_TEMPLATE_CATEGORY[templateId])
}
