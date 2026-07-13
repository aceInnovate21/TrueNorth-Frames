/**
 * Shared server-side helpers for client ↔ photographer messaging moderation.
 *
 * Block model (per user request, one-directional):
 *   - A client can block a photographer  → stored in `client_blocks`
 *   - Photographers CANNOT block clients → no table, no enforcement
 *
 * When a client has blocked a photographer, neither party can send new
 * messages in that conversation until the client unblocks.
 *
 * Admin freeze (`conversations.is_frozen`) also hard-stops both parties.
 */

import { createPrivateDownloadUrl } from './r2'
import { PLATFORM_CONFIG } from './platform-config'

export interface RateLimitResult {
  /** True when the sender is over the hourly cap and must be blocked. */
  exceeded: boolean
  /** Messages remaining in the current hour window (0 when exceeded). */
  remaining: number
}

/**
 * Rolling 1-hour rate limit for a sender in a conversation, counted directly
 * from the `messages` table (no separate counter table to keep in sync).
 * Returns whether the sender is over `max_messages_per_hour` and how many
 * sends remain. Caps and body-length enforcement live in the send routes.
 */
export async function checkMessageRateLimit(
  db: any,
  senderId: string
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { count } = await db
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('sender_id', senderId)
    .gte('created_at', windowStart)

  const sent = count ?? 0
  const cap = PLATFORM_CONFIG.max_messages_per_hour
  return { exceeded: sent >= cap, remaining: Math.max(0, cap - sent) }
}

/**
 * Trim a message body to the platform maximum. Returns null when there is no
 * text (attachment-only messages are valid).
 */
export function clampMessageBody(text: unknown): string {
  if (typeof text !== 'string') return ''
  return text.trim().slice(0, PLATFORM_CONFIG.max_message_length)
}

/**
 * Link a just-uploaded attachment's orphan storage_asset to its message so it
 * counts against quota and survives orphan cleanup.
 */
export async function claimMessageAttachment(
  db: any, key: string, ownerId: string, messageId: string
): Promise<void> {
  await db
    .from('storage_assets')
    .update({ orphan_expires_at: null, entity_id: messageId })
    .eq('key', key)
    .eq('owner_id', ownerId)
    .eq('entity_type', 'message_attachment')
}

/**
 * Resolve a message row's attachment to a viewable URL: a short-lived signed
 * URL for private-bucket keys, or the legacy public URL for pre-migration rows.
 */
export async function resolveAttachmentUrl(
  m: { attachment_key?: string | null; attachment_url?: string | null }
): Promise<string | null> {
  if (m.attachment_key) {
    try { return await createPrivateDownloadUrl(m.attachment_key) } catch { return null }
  }
  return m.attachment_url ?? null
}

export interface ConversationModeration {
  /** Client has blocked the photographer in this conversation. */
  blocked: boolean
  /** Conversation has been reported/flagged for admin review. */
  reported: boolean
  /** Admin has frozen the conversation. */
  frozen: boolean
}

/** True when the given client currently blocks the given photographer profile. */
export async function isPhotographerBlocked(
  db: any,
  clientUserId: string,
  photographerProfileId: string
): Promise<boolean> {
  const { data } = await db
    .from('client_blocks')
    .select('id')
    .eq('client_id', clientUserId)
    .eq('photographer_id', photographerProfileId)
    .maybeSingle()
  return !!data
}

/**
 * Returns the set of photographer profile ids a client currently blocks,
 * restricted to the provided candidate ids. Used to annotate conversation lists
 * in a single query instead of N lookups.
 */
export async function blockedPhotographerIds(
  db: any,
  clientUserId: string,
  photographerProfileIds: string[]
): Promise<Set<string>> {
  if (photographerProfileIds.length === 0) return new Set()
  const { data } = await db
    .from('client_blocks')
    .select('photographer_id')
    .eq('client_id', clientUserId)
    .in('photographer_id', photographerProfileIds)
  return new Set((data ?? []).map((r: any) => r.photographer_id))
}

/**
 * Whether a message may be sent in a conversation. Returns null when allowed,
 * or a short reason string when the send must be rejected.
 */
export function sendBlockedReason(m: {
  blocked: boolean
  frozen: boolean
}): string | null {
  if (m.frozen) return 'This conversation has been locked by an administrator.'
  if (m.blocked) return 'Messaging is unavailable while this photographer is blocked.'
  return null
}
