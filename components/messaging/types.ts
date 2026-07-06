// ─── Shared messaging types (client + photographer) ────────────────────────────

export type MessageStatus = 'sent' | 'delivered' | 'read'

/** Moderation state of a client↔photographer conversation. */
export type ConvModerationState =
  | 'normal'
  | 'blocked'
  | 'reported'
  | 'reported_and_blocked'
  | 'frozen'

/** A single rendered message, used by every thread view. */
export interface UIMessage {
  id: string | number
  from: 'me' | 'them'
  text: string
  time: string
  status?: MessageStatus
  isSystem?: boolean
  // Group threads carry per-message sender identity; 1:1 threads leave these unset.
  senderName?: string
  senderInitials?: string
  senderBg?: string
  attachmentUrl: string | null
  attachmentType: string | null
  attachmentName: string | null
  attachmentSize: number | null
}

/** Identity of the person/thread on the other side of a 1:1 thread. */
export interface ThreadPeer {
  name: string
  initials: string
  avatarUrl: string | null
  /** For groups: a solid bg class instead of an avatar. */
  bg?: string
  /** Optional @handle shown under the name (photographer username). */
  handle?: string | null
  /** Optional profile link target. */
  profileHref?: string | null
  /** Sub-label, e.g. "Client" / "Direct message" / "Group · 4 members". */
  subLabel?: string | null
}
