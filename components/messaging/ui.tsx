'use client'

import Image from 'next/image'
import { Calendar, Check, CheckCheck, Ban, Flag } from 'lucide-react'
import { EMOJIS } from './helpers'
import type { MessageStatus } from './types'

// ─── Emoji picker ───────────────────────────────────────────────────────────────

export function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose?: () => void }) {
  return (
    <div
      className="absolute bottom-full mb-2 left-0 bg-white rounded-2xl p-3 grid grid-cols-5 gap-1.5 z-20"
      style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)', width: 196 }}
    >
      {EMOJIS.map(e => (
        <button
          key={e}
          type="button"
          onClick={() => onPick(e)}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-ink-50 rounded-lg transition-colors"
        >
          {e}
        </button>
      ))}
      {onClose && (
        <button type="button" onClick={onClose} className="col-span-5 text-xs text-ink-300 mt-1 hover:text-ink">
          Close
        </button>
      )}
    </div>
  )
}

// ─── Delivery tick ──────────────────────────────────────────────────────────────

export function Tick({ status }: { status: MessageStatus }) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-emerald-500" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-ink-300" />
  return <Check className="w-3 h-3 text-ink-300" />
}

// ─── Booking request card bubble ────────────────────────────────────────────────
// Parses "📅 Booking request · {date} · {timeSlot}[\n\n{description}]"

export function BookingBubble({ text }: { text: string }) {
  const lines = text.split('\n\n')
  const header = lines[0] ?? ''
  const desc = lines.slice(1).join('\n\n').trim()
  const parts = header.split(' · ')
  const datePart = parts[1] ?? ''
  const timePart = parts.slice(2).join(' · ')

  return (
    <div className="bg-ink-50 border border-ink-100 rounded-2xl px-4 py-3 max-w-xs">
      <div className="flex items-center gap-2 mb-2">
        <Calendar className="w-4 h-4 text-ink-400 flex-shrink-0" />
        <span className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Booking request</span>
      </div>
      {datePart && <p className="text-sm font-semibold text-ink leading-tight">{datePart}</p>}
      {timePart && <p className="text-xs text-ink-400 mt-0.5">{timePart}</p>}
      {desc && <p className="text-sm text-ink-500 mt-2 leading-relaxed border-t border-ink-100 pt-2">{desc}</p>}
    </div>
  )
}

// ─── Avatar (image or initials/emoji chip) ──────────────────────────────────────

export function Avatar({
  avatarUrl, initials, bg, size = 44, dimmed = false, rounded = 'rounded-xl',
}: {
  avatarUrl?: string | null
  initials: string
  bg?: string
  size?: number
  dimmed?: boolean
  rounded?: string
}) {
  if (avatarUrl) {
    return (
      <div className={`${rounded} overflow-hidden ${dimmed ? 'opacity-50 grayscale' : ''}`} style={{ width: size, height: size }}>
        <Image src={avatarUrl} alt={initials} width={size} height={size} className="object-cover w-full h-full" />
      </div>
    )
  }
  return (
    <div
      className={`${rounded} ${bg ?? 'bg-ink'} flex items-center justify-center text-white font-bold ${dimmed ? 'opacity-40' : ''}`}
      style={{ width: size, height: size, fontSize: Math.max(9, Math.round(size / 3.6)) }}
    >
      {initials}
    </div>
  )
}

// ─── Conversation list row ──────────────────────────────────────────────────────

export function ConversationRow({
  name, sub, initials, avatarUrl, bg, lastMsg, lastTime, unread, active, blocked, reported, onClick,
}: {
  name: string
  sub?: string | null
  initials: string
  avatarUrl?: string | null
  bg?: string
  lastMsg: string
  lastTime: string
  unread: number
  active: boolean
  blocked?: boolean
  reported?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-ink-50 text-left transition-colors ${
        active ? 'bg-ink-50' : 'hover:bg-ink-50/60'
      }`}
    >
      <div className="relative flex-shrink-0">
        <Avatar avatarUrl={avatarUrl} initials={initials} bg={bg} size={44} dimmed={blocked} />
        {blocked && (
          <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-ink-400 rounded-full flex items-center justify-center">
            <Ban className="w-2 h-2 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm leading-tight truncate font-semibold ${blocked ? 'text-ink-400' : 'text-ink'}`}>{name}</p>
          <p className="text-[10px] text-ink-200 flex-shrink-0 ml-2">{lastTime}</p>
        </div>
        {sub && <p className="text-ink-300 text-[10px] mb-1">{sub}</p>}
        {(blocked || reported) && (
          <div className="flex items-center gap-1.5 mb-1">
            {blocked && <span className="text-[9px] font-semibold bg-ink-100 text-ink-400 px-1.5 py-0.5 rounded-full">Blocked</span>}
            {reported && !blocked && (
              <span className="text-[9px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Flag className="w-2 h-2" /> Reported
              </span>
            )}
          </div>
        )}
        <div className="flex items-center justify-between gap-2">
          <p className="text-ink-400 text-xs truncate leading-tight">{lastMsg || 'No messages yet'}</p>
          {unread > 0 && (
            <span className="w-4 h-4 bg-ink rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
              {unread}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
