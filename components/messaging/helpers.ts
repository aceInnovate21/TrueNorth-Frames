// ─── Shared messaging helpers ───────────────────────────────────────────────────

export const EMOJIS = [
  '😊','😄','😍','🥰','😂','🙏','👍','❤️','🎉','🔥',
  '✨','📸','💍','🌸','😎','🤝','💯','🙌','😮','😢',
]

export const AVATAR_BG_PALETTE = [
  'bg-slate-600', 'bg-violet-600', 'bg-emerald-600', 'bg-rose-500',
  'bg-amber-600', 'bg-sky-600', 'bg-teal-600', 'bg-indigo-600',
]

/** Deterministic background colour class from an id/name. */
export function avatarBg(seed: string): string {
  const code = (seed || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_BG_PALETTE[code % AVATAR_BG_PALETTE.length]
}

/** Up to two uppercase initials from a display name. */
export function initialsOf(name: string): string {
  return (name || '')
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('') || 'P'
}

/** Relative "3m ago" style timestamp for conversation rows. */
export function timeAgo(iso: string | null): string {
  if (!iso) return ''
  try {
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7) return `${days}d ago`
    return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}

/** Clock time inside a thread bubble. */
export function formatMsgTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

/** Booking template messages are prefixed with 📅 and render as a card. */
export function isBookingMessage(text: string): boolean {
  return typeof text === 'string' && text.startsWith('📅')
}
