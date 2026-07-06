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
