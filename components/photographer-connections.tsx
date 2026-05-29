'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import {
  Ban, CheckCircle2, ChevronLeft, ChevronRight, LogOut, Paperclip, Plus, Search,
  Send, Shield, Trash2, UserCheck, UserMinus, UserPlus, Users, X, Zap, FileText, Play,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

// UI-layer connection states derived from DBML connection_status enum:
//   connected        → DB: accepted
//   pending_sent     → DB: pending (current user initiated)
//   pending_received → DB: pending (other user initiated)
//   suggested        → UI-only, not yet in DB (populated by recommendation algorithm)
type ConnectionStatus = 'connected' | 'pending_sent' | 'pending_received' | 'suggested'

interface Photographer {
  id: string
  name: string
  initials: string
  bg: string
  area: string
  specialties: string[]
  status: ConnectionStatus
  coverAvailable: boolean
}

export interface GroupMessage {
  id: number
  senderId: string   // 'me' or photographer id
  senderName: string
  senderInitials: string
  senderBg: string
  text: string
  time: string
  isSystem?: boolean
  attachmentUrl?: string | null
  attachmentType?: 'image' | 'video' | 'pdf' | null
  attachmentName?: string | null
  attachmentSize?: number | null
}

export interface Group {
  id: string
  name: string
  emoji: string
  memberIds: string[]        // photographer ids + 'me'
  pendingInviteIds: string[] // photographer ids with pending invites
  ownerId: string            // 'me' if current user created it
  messages: GroupMessage[]
  unread: number
  lastActivityAt?: string    // ISO timestamp of last message, for sorting
  isCoverGroup?: boolean
  isDm?: boolean             // true for private 1-1 DM groups between photographers
  dmPeerId?: string          // photographer id of the other person in a DM (not 'me')
  dmPeerName?: string        // display name of the other person
  dmPeerInitials?: string
  dmPeerBg?: string
  isRemoved?: boolean        // true if current user was removed by owner
  isLeft?: boolean           // true if current user voluntarily left
}

// Matches DBML cover_request_status enum
type CoverRequestStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn' | 'filled'

interface CoverAccepter {
  requestId: string   // the specific cover_request row id for this accepter
  photographerId: string
  name: string
  initials: string
  bg: string
  area: string
}

interface CoverRequest {
  id: string
  from: string
  fromInitials: string
  fromBg: string
  eventDate: string   // "YYYY-MM-DD"
  startTime: string   // "HH:MM"
  endTime: string     // "HH:MM"
  event: string
  area: string
  status: CoverRequestStatus
  createdAt?: string
  isOwn?: boolean
  accepters?: CoverAccepter[]  // for own requests: list of people who said yes
}

type GroupInviteStatus = 'pending' | 'accepted' | 'declined'

interface GroupInvite {
  id: string
  groupName: string
  groupEmoji: string
  invitedBy: string
  invitedByInitials: string
  invitedByBg: string
  memberCount: number
  status: GroupInviteStatus
  receivedAt: string
}

// ─── ConnectionCard ───────────────────────────────────────────────────────────

function ConnectionCard({ p, onAccept, onDecline, onConnect, onCancel, onDisconnect }: {
  p: Photographer
  onAccept?: () => void
  onDecline?: () => void
  onConnect?: () => void
  onCancel?: () => void
  onDisconnect?: () => void
}) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  return (
    <div className="flex items-center gap-3 p-3.5 bg-white rounded-2xl border border-ink-100">
      <div className={`w-10 h-10 rounded-full ${p.bg} flex items-center justify-center text-white text-sm font-bold flex-shrink-0`}>
        {p.initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold text-ink">{p.name}</p>
          {p.coverAvailable && (
            <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Zap className="w-2.5 h-2.5" /> Cover
            </span>
          )}
        </div>
        <p className="text-xs text-ink-300">{p.area} · {p.specialties.slice(0, 2).join(', ')}</p>
      </div>
      <div className="flex-shrink-0">
        {p.status === 'connected' && (
          confirmDisconnect ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-red-600 font-medium">Remove?</span>
              <button onClick={onDisconnect} className="text-[10px] font-semibold bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors">Yes</button>
              <button onClick={() => setConfirmDisconnect(false)} className="text-[10px] text-ink-400 hover:text-ink px-1.5 py-1 rounded-lg hover:bg-ink-50 transition-colors">No</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Connected</span>
              <button onClick={() => setConfirmDisconnect(true)} className="text-[10px] text-ink-200 hover:text-red-500 border border-transparent hover:border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">Remove</button>
            </div>
          )
        )}
        {p.status === 'pending_received' && (
          <div className="flex gap-1.5">
            <button onClick={onAccept} className="text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded-lg hover:bg-ink-800 transition-colors">Accept</button>
            <button onClick={onDecline} className="text-xs border border-ink-100 text-ink-400 px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors">Decline</button>
          </div>
        )}
        {p.status === 'pending_sent' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-300 font-medium">Requested</span>
            <button
              onClick={onCancel}
              className="text-[10px] text-ink-300 hover:text-red-500 border border-ink-100 hover:border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
        {p.status === 'suggested' && (
          <button onClick={onConnect} className="flex items-center gap-1 text-xs font-semibold border border-ink-100 text-ink-500 px-3 py-1.5 rounded-lg hover:bg-ink-50 hover:border-ink-300 transition-all">
            <UserPlus className="w-3.5 h-3.5" /> Connect
          </button>
        )}
      </div>
    </div>
  )
}

// ─── CoverRequestCard ─────────────────────────────────────────────────────────

function CoverRequestCard({ req, onAccept, onWithdraw, onChoose, bookedDates }: {
  req: CoverRequest
  onAccept: () => void
  onWithdraw?: () => void
  onChoose?: (accepter: CoverAccepter) => void
  bookedDates?: Record<string, string | null>
}) {
  const isResolved = req.status === 'filled' || req.status === 'withdrawn' || req.status === 'declined'
  const hasAccepters = req.isOwn && (req.accepters?.length ?? 0) > 0
  const statusLabel =
    req.status === 'filled' ? 'Filled ✓' :
    req.status === 'withdrawn' ? 'Withdrawn' :
    req.status === 'accepted' ? 'Accepted' :
    req.isOwn ? (hasAccepters ? `${req.accepters!.length} responded` : 'Posted') :
    'Needs cover'
  const statusColor =
    req.status === 'filled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    req.status === 'withdrawn' ? 'bg-ink-100 text-ink-400 border-ink-200' :
    req.status === 'accepted' && !req.isOwn ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
    hasAccepters ? 'bg-amber-50 text-amber-700 border-amber-200' :
    req.isOwn ? 'bg-blue-50 text-blue-700 border-blue-200' :
    'bg-amber-50 text-amber-700 border-amber-200'

  // Conflict check: does the viewer already have something on this date?
  const conflictStatus = (() => {
    if (req.isOwn || !req.eventDate) return null
    const d = new Date(req.eventDate)
    if (isNaN(d.getTime())) return null
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    return bookedDates?.[key] ?? null
  })()
  const hasConflict = conflictStatus === 'busy' || conflictStatus === 'tentative'

  // Format date/time for display
  const dateLabel = (() => {
    if (!req.eventDate) return ''
    const d = new Date(req.eventDate)
    if (isNaN(d.getTime())) return req.eventDate
    return d.toLocaleDateString('en-CA', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
  })()
  const timeLabel = req.startTime
    ? req.endTime ? `${req.startTime} – ${req.endTime}` : req.startTime
    : ''

  return (
    <div className={`rounded-2xl p-4 border ${isResolved ? 'bg-ink-50 border-ink-100 opacity-60' : req.isOwn ? 'bg-white border-ink-200' : 'bg-white border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-full ${req.fromBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{req.fromInitials}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-ink">{req.isOwn ? 'Your request' : req.from}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${statusColor}`}>{statusLabel}</span>
          </div>
          <p className="text-xs font-medium text-ink-600">{req.event}</p>
          {dateLabel && <p className="text-xs text-ink-400 mt-0.5">{dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}</p>}
          {req.area && <p className="text-xs text-ink-300">{req.area}</p>}
        </div>
        {/* Non-owner pending: show I can cover */}
        {!req.isOwn && req.status === 'pending' && (
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <button
              onClick={onAccept}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-colors ${
                hasConflict
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-ink text-white hover:bg-ink-800'
              }`}
              title={hasConflict ? `You already have a ${conflictStatus} booking on this date` : ''}
            >
              {hasConflict ? '⚠️' : <UserCheck className="w-3.5 h-3.5" />}
              {' '}I can cover
            </button>
            {hasConflict && (
              <span className="text-[10px] text-amber-600 font-medium">
                {conflictStatus === 'busy' ? 'Conflict: you\'re busy' : 'Tentative booking'}
              </span>
            )}
          </div>
        )}
        {/* Own pending with no accepters: withdraw */}
        {req.isOwn && req.status === 'pending' && !hasAccepters && (
          <button onClick={onWithdraw} className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-600 px-3 py-2 rounded-xl hover:bg-red-50 transition-colors">
            <X className="w-3.5 h-3.5" /> Withdraw
          </button>
        )}
      </div>

      {/* Accepters list — shown when own request has responses */}
      {req.isOwn && hasAccepters && req.status === 'pending' && (
        <div className="mt-3 pt-3 border-t border-ink-100 space-y-2">
          <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wider">Who can cover</p>
          {req.accepters!.map(a => (
            <div key={a.requestId} className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full ${a.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>{a.initials}</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-ink">{a.name}</p>
                {a.area && <p className="text-[10px] text-ink-300">{a.area}</p>}
              </div>
              <button
                onClick={() => onChoose?.(a)}
                className="text-[10px] font-semibold bg-emerald-500 text-white px-2.5 py-1 rounded-lg hover:bg-emerald-600 transition-colors flex-shrink-0"
              >
                Choose
              </button>
            </div>
          ))}
          <button onClick={onWithdraw} className="text-[10px] font-medium text-red-500 hover:text-red-700 transition-colors">
            Withdraw request instead
          </button>
        </div>
      )}
    </div>
  )
}

// ─── GroupInviteCard ──────────────────────────────────────────────────────────

function GroupInviteCard({ invite, onAccept, onDecline }: {
  invite: GroupInvite
  onAccept: () => void
  onDecline: () => void
}) {
  if (invite.status === 'declined') return null

  return (
    <div className={`rounded-2xl border p-4 ${
      invite.status === 'accepted'
        ? 'bg-emerald-50 border-emerald-100'
        : 'bg-white border-ink-100'
    }`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-ink-100 flex items-center justify-center text-xl flex-shrink-0">
          {invite.groupEmoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="text-sm font-semibold text-ink">{invite.groupName}</p>
            {invite.status === 'accepted' && (
              <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">Joined</span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div className={`w-5 h-5 rounded-full ${invite.invitedByBg} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
              {invite.invitedByInitials}
            </div>
            <p className="text-xs text-ink-400">Invited by <span className="font-medium text-ink-600">{invite.invitedBy}</span></p>
          </div>
          <p className="text-[10px] text-ink-300 mt-0.5">{invite.memberCount} members · {invite.receivedAt}</p>
        </div>
        {invite.status === 'pending' && (
          <div className="flex gap-1.5 flex-shrink-0">
            <button
              onClick={onAccept}
              className="text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded-lg hover:bg-ink-800 transition-colors"
            >
              Join
            </button>
            <button
              onClick={onDecline}
              className="text-xs border border-ink-100 text-ink-400 px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors"
            >
              Decline
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── CreateGroupModal ─────────────────────────────────────────────────────────

function CreateGroupModal({
  onClose,
  onCreate,
}: {
  onClose: () => void
  onCreate: (name: string, emoji: string) => void
}) {
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState('📸')

  const EMOJIS = ['📸', '💍', '🎉', '🌟', '🤝', '🏙️', '🌿', '🎨']

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
          <p className="font-semibold text-ink">Create a group</p>
          <button onClick={onClose} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Emoji picker */}
          <div>
            <p className="text-xs font-medium text-ink mb-2">Group icon</p>
            <div className="flex gap-2 flex-wrap">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)}
                  className={`text-xl w-10 h-10 rounded-xl border transition-all ${emoji === e ? 'border-ink bg-ink-50 scale-110' : 'border-ink-100 hover:border-ink-300'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <p className="text-xs font-medium text-ink mb-2">Group name</p>
            <input
              type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. Edmonton Wedding Crew"
              autoFocus
              className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all"
            />
          </div>

          <p className="text-xs text-ink-300">After creating, use the invite button inside the group to add your connections.</p>
        </div>

        <div className="px-5 py-4 border-t border-ink-50 flex gap-3">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 transition-colors text-ink-400">
            Cancel
          </button>
          <button
            onClick={() => { if (name.trim()) onCreate(name.trim(), emoji) }}
            disabled={!name.trim()}
            className="flex-1 text-sm font-semibold bg-ink text-white rounded-xl py-2.5 hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Create group
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── GroupChat ────────────────────────────────────────────────────────────────

function AttachmentPreview({ url, type, name, size, isMe }: {
  url: string
  type: 'image' | 'video' | 'pdf'
  name?: string | null
  size?: number | null
  isMe: boolean
}) {
  const sizeStr = size ? (size < 1024 * 1024 ? `${Math.round(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`) : ''
  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name ?? 'image'} className="max-w-[220px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity" style={{ maxHeight: 200 }} />
      </a>
    )
  }
  if (type === 'video') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl ${isMe ? 'bg-white/10' : 'bg-ink-100'}`}>
        <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
          <Play className="w-3.5 h-3.5 text-white fill-white" />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-medium truncate ${isMe ? 'text-white' : 'text-ink'}`}>{name ?? 'video.mp4'}</p>
          {sizeStr && <p className={`text-[10px] ${isMe ? 'text-ink-200' : 'text-ink-400'}`}>{sizeStr}</p>}
        </div>
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`mt-1.5 flex items-center gap-2 px-3 py-2 rounded-xl ${isMe ? 'bg-white/10' : 'bg-ink-100'}`}>
      <FileText className={`w-5 h-5 flex-shrink-0 ${isMe ? 'text-white' : 'text-ink-500'}`} />
      <div className="min-w-0">
        <p className={`text-xs font-medium truncate ${isMe ? 'text-white' : 'text-ink'}`}>{name ?? 'document.pdf'}</p>
        {sizeStr && <p className={`text-[10px] ${isMe ? 'text-ink-200' : 'text-ink-400'}`}>{sizeStr} · PDF</p>}
      </div>
    </a>
  )
}

export function GroupChat({
  group,
  allPhotographers,
  connected,
  isOwner,
  onSend,
  onClose,
  onLeave,
  onRemoveMember,
  onInviteSent,
  onBlock,
}: {
  group: Group
  allPhotographers: Photographer[]
  connected: Photographer[]
  isOwner: boolean
  onSend: (groupId: string, text: string, attachment?: { url: string; type: string; name: string; size: number }) => void
  onClose: () => void
  onLeave: (groupId: string) => void
  onRemoveMember: (groupId: string, memberId: string) => void
  onInviteSent?: (groupId: string, inviteeId: string) => void
  onBlock?: (groupId: string, peerId: string) => void
}) {
  const [draft, setDraft] = useState('')
  const [confirmLeave, setConfirmLeave] = useState(false)
  const [confirmBlock, setConfirmBlock] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Connections not already a member or pending invite
  const inviteable = connected.filter(
    p => !group.memberIds.includes(p.id) && !group.pendingInviteIds.includes(p.id)
  )

  function sendInvite(inviteeId: string) {
    onInviteSent?.(group.id, inviteeId)
    fetch('/api/photographer/groups/invites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: group.id, invitee_id: inviteeId }),
    }).catch(() => {})
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [group.messages.length])

  function send() {
    const text = draft.trim()
    if (!text) return
    onSend(group.id, text)
    setDraft('')
  }

  async function sendFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    fd.append('group_id', group.id)
    setUploading(true)
    setUploadProgress('Uploading…')
    try {
      const res = await fetch('/api/photographer/groups/messages/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setUploadProgress(err.error ?? 'Upload failed')
        setTimeout(() => setUploadProgress(null), 3000)
        return
      }
      const att = await res.json()
      onSend(group.id, draft.trim(), { url: att.url, type: att.type, name: att.name, size: att.size })
      setDraft('')
    } catch {
      setUploadProgress('Upload failed')
      setTimeout(() => setUploadProgress(null), 3000)
    } finally {
      setUploading(false)
      if (!uploadProgress?.includes('failed')) setUploadProgress(null)
    }
  }

  const members = allPhotographers.filter(p => group.memberIds.includes(p.id) && p.id !== 'me')

  const displayName = group.isDm ? (group.dmPeerName ?? group.name) : group.name
  const displayInitials = group.isDm ? (group.dmPeerInitials ?? group.name.slice(0, 2).toUpperCase()) : null
  const displayBg = group.isDm ? (group.dmPeerBg ?? 'bg-ink-300') : null

  return (
    <div className="flex flex-col h-[680px]">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-50 flex-shrink-0">
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-ink-50 text-ink-400 transition-colors">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {group.isDm ? (
          <div className={`w-9 h-9 rounded-full ${displayBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
            {displayInitials}
          </div>
        ) : (
          <div className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center text-lg flex-shrink-0">
            {group.emoji}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink">{displayName}</p>
          {group.isDm ? (
            <p className="text-[10px] text-ink-300">Photographer · Direct message</p>
          ) : (
            <button
              onClick={() => { if (isOwner) setShowMembers(v => !v) }}
              className={`text-[10px] text-ink-300 ${isOwner ? 'hover:text-ink-500 transition-colors' : ''}`}
            >
              You{members.length > 0 ? `, ${members.map(m => m.name.split(' ')[0]).join(', ')}` : ''}
              {' '}· {group.memberIds.length} member{group.memberIds.length !== 1 ? 's' : ''}
              {isOwner && <span className="ml-1 text-ink-200">{showMembers ? '▲' : '▼'}</span>}
            </button>
          )}
        </div>
        {/* Invite — owner only, not for DMs, not shown if removed/left */}
        {!group.isDm && isOwner && !group.isRemoved && !group.isLeft && (
          <button
            onClick={() => { setShowInvite(v => !v); setShowMembers(false); setConfirmLeave(false) }}
            className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${showInvite ? 'bg-ink text-white' : 'hover:bg-ink-50 text-ink-300 hover:text-ink'}`}
            title="Invite connections"
          >
            <UserPlus className="w-4 h-4" />
          </button>
        )}
        {/* Leave/Delete — not for DMs, not shown if already removed or left */}
        {!group.isDm && !group.isRemoved && !group.isLeft && (
          <button
            onClick={() => { setConfirmLeave(true); setShowMembers(false); setShowInvite(false) }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-ink-300 hover:text-red-500 transition-colors flex-shrink-0"
            title={isOwner ? 'Delete group' : 'Leave group'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
        {/* DM-specific actions: Delete chat + Block */}
        {group.isDm && (
          <>
            <button
              onClick={() => { setConfirmLeave(true); setConfirmBlock(false) }}
              className="p-1.5 rounded-lg hover:bg-red-50 text-ink-300 hover:text-red-500 transition-colors flex-shrink-0"
              title="Delete conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            {onBlock && group.dmPeerId && (
              <button
                onClick={() => { setConfirmBlock(true); setConfirmLeave(false) }}
                className="p-1.5 rounded-lg hover:bg-red-50 text-ink-300 hover:text-red-500 transition-colors flex-shrink-0"
                title="Block this photographer"
              >
                <Ban className="w-4 h-4" />
              </button>
            )}
          </>
        )}
        {/* Dismiss — only for removed users (non-DM groups) */}
        {!group.isDm && group.isRemoved && (
          <button
            onClick={() => onLeave(group.id)}
            className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-300 hover:text-ink transition-colors flex-shrink-0"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {/* Delete — for users who left (non-DM groups) */}
        {!group.isDm && group.isLeft && (
          <button
            onClick={() => onLeave(group.id)}
            className="p-1.5 rounded-lg hover:bg-red-50 text-ink-300 hover:text-red-500 transition-colors flex-shrink-0"
            title="Delete conversation"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Members panel — owner only */}
      {isOwner && showMembers && (
        <div className="border-b border-ink-50 bg-ink-50/60 px-4 py-3 flex-shrink-0 space-y-2">
          <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest">Members</p>
          {/* Current user row — non-removable */}
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">YO</div>
            <span className="text-xs text-ink flex-1 font-medium">You <span className="text-ink-300 font-normal">(owner)</span></span>
          </div>
          {members.map(m => (
            <div key={m.id} className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full ${m.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>{m.initials}</div>
              <span className="text-xs text-ink flex-1">{m.name}</span>
              {confirmRemoveId === m.id ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-red-600">Remove?</span>
                  <button
                    onClick={() => { onRemoveMember(group.id, m.id); setConfirmRemoveId(null) }}
                    className="text-[10px] font-semibold bg-red-500 text-white px-2 py-1 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmRemoveId(null)}
                    className="text-[10px] text-ink-400 hover:text-ink px-1"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmRemoveId(m.id)}
                  className="p-1 rounded-lg text-ink-200 hover:text-red-500 hover:bg-red-50 transition-all"
                  title={`Remove ${m.name.split(' ')[0]}`}
                >
                  <UserMinus className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {members.length === 0 && (
            <p className="text-[10px] text-ink-300">No other members yet.</p>
          )}
        </div>
      )}

      {/* Invite panel */}
      {showInvite && (
        <div className="border-b border-ink-50 bg-ink-50/60 px-4 py-3 flex-shrink-0 space-y-2">
          <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-2">Invite connections</p>
          {inviteable.map(p => (
            <div key={p.id} className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-full ${p.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>{p.initials}</div>
              <span className="text-xs text-ink flex-1">{p.name}</span>
              <button
                onClick={() => sendInvite(p.id)}
                className="text-[10px] font-semibold border border-ink-200 text-ink-500 px-2.5 py-1 rounded-lg hover:bg-white hover:border-ink transition-colors"
              >
                Invite
              </button>
            </div>
          ))}
          {/* Already-invited connections shown as pending */}
          {connected.filter(p => group.pendingInviteIds.includes(p.id)).map(p => (
            <div key={p.id} className="flex items-center gap-2.5 opacity-60">
              <div className={`w-7 h-7 rounded-full ${p.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>{p.initials}</div>
              <span className="text-xs text-ink flex-1">{p.name}</span>
              <span className="text-[10px] text-emerald-600 font-medium">Invited ✓</span>
            </div>
          ))}
          {inviteable.length === 0 && connected.length === 0 && (
            <p className="text-[10px] text-ink-300">Connect with other photographers first to invite them.</p>
          )}
          {inviteable.length === 0 && connected.length > 0 && (
            <p className="text-[10px] text-ink-300">All your connections are already in this group.</p>
          )}
        </div>
      )}

      {/* Leave / delete confirm strip */}
      {confirmLeave && (
        <div className="bg-red-50 border-b border-red-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <p className="text-xs text-red-700 flex-1">
            {group.isDm
              ? 'Delete this conversation? This cannot be undone.'
              : group.isCoverGroup
              ? 'Leave this cover chat? The other person will be notified.'
              : isOwner
              ? 'You created this group. Leaving will delete it for everyone.'
              : 'Are you sure you want to leave this group?'}
          </p>
          <button
            onClick={() => onLeave(group.id)}
            className="text-xs font-semibold bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors flex-shrink-0"
          >
            {group.isDm ? 'Delete' : group.isCoverGroup ? 'Leave' : isOwner ? 'Delete group' : 'Leave'}
          </button>
          <button
            onClick={() => setConfirmLeave(false)}
            className="text-xs text-ink-400 hover:text-ink px-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Block confirm strip — DMs only */}
      {confirmBlock && group.isDm && group.dmPeerId && (
        <div className="bg-orange-50 border-b border-orange-100 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <p className="text-xs text-orange-800 flex-1">
            Block <strong>{group.dmPeerName ?? 'this photographer'}</strong>? They won't be able to start a new conversation with you. This will also delete the chat.
          </p>
          <button
            onClick={() => { onBlock?.(group.id, group.dmPeerId!); setConfirmBlock(false) }}
            className="text-xs font-semibold bg-orange-500 text-white px-3 py-1.5 rounded-lg hover:bg-orange-600 transition-colors flex-shrink-0"
          >
            Block
          </button>
          <button
            onClick={() => setConfirmBlock(false)}
            className="text-xs text-ink-400 hover:text-ink px-2"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {group.messages.map((msg, i) => {
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="text-[11px] text-ink-400 bg-ink-100 px-3 py-1 rounded-full">{msg.text}</span>
              </div>
            )
          }

          const isMe = msg.senderId === 'me'
          const prevMsg = group.messages[i - 1]
          const nextMsg = group.messages[i + 1]
          const showSender = !isMe && (!prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.isSystem)
          const isLast = !nextMsg || nextMsg.senderId !== msg.senderId || nextMsg.isSystem
          const hasAttach = !!msg.attachmentUrl && !!msg.attachmentType

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} gap-2 items-end`}>
              {!isMe && (
                <div className={`w-7 h-7 rounded-full ${msg.senderBg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${!isLast ? 'opacity-0' : ''}`}>
                  {msg.senderInitials}
                </div>
              )}
              <div className={`max-w-[72%]`}>
                {showSender && !isMe && (
                  <p className="text-[10px] font-semibold text-ink-400 mb-1 ml-1">{msg.senderName}</p>
                )}
                <div className={`rounded-2xl px-4 py-2.5 ${
                  hasAttach && !msg.text ? 'p-1.5' : ''
                } ${isMe
                  ? 'bg-ink text-white rounded-br-sm'
                  : 'bg-ink-50 text-ink rounded-bl-sm'
                }`}>
                  {hasAttach && (
                    <AttachmentPreview
                      url={msg.attachmentUrl!}
                      type={msg.attachmentType!}
                      name={msg.attachmentName}
                      size={msg.attachmentSize}
                      isMe={isMe}
                    />
                  )}
                  {msg.text && <p className="text-sm leading-relaxed mt-1">{msg.text}</p>}
                  <p className={`text-[10px] mt-1 ${isMe ? 'text-white/50' : 'text-ink-300'} text-right`}>{msg.time}</p>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Removed / left notice OR input */}
      {group.isRemoved ? (
        <div className="px-4 py-3 border-t border-red-100 bg-red-50 flex-shrink-0">
          <p className="text-xs text-red-600 text-center font-medium">You were removed from this group and can no longer send messages.</p>
        </div>
      ) : group.isLeft ? (
        <div className="px-4 py-3 border-t border-ink-100 bg-ink-50 flex-shrink-0 flex items-center justify-between gap-3">
          <p className="text-xs text-ink-400 font-medium">You left this group and can no longer send messages.</p>
          <button
            onClick={() => onLeave(group.id)}
            className="text-xs text-red-500 hover:text-red-600 font-medium flex-shrink-0"
          >
            Delete
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-ink-50 flex-shrink-0">
          {uploadProgress && (
            <p className="text-[11px] text-ink-400 mb-1.5 text-center">{uploadProgress}</p>
          )}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,application/pdf"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value = '' }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-9 h-9 rounded-xl hover:bg-ink-50 text-ink-300 hover:text-ink flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
              title="Attach photo, video, or PDF"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <textarea
              value={draft}
              onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_message_length) setDraft(e.target.value) }}
              maxLength={PLATFORM_CONFIG.max_message_length}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Message the group…"
              rows={1}
              style={{ maxHeight: 100 }}
              className="flex-1 border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
            />
            <button
              onClick={send}
              disabled={!draft.trim() || uploading}
              className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

type ConnTab = 'groups' | 'network' | 'cover'

// dateKey format matches DayStatus record: "YYYY-M-D"
export function PhotographerConnections({
  onCoverAccepted,
  bookedDates = {},
}: {
  onCoverAccepted?: (dateKey: string) => void
  bookedDates?: Record<string, string | null>
}) {
  const [connTab, setConnTab] = useState<ConnTab>('groups')
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [coverRequests, setCoverRequests] = useState<CoverRequest[]>([])
  const [groupInvites, setGroupInvites] = useState<GroupInvite[]>([])
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [search, setSearch] = useState('')
  const [acceptedCoverIds, setAcceptedCoverIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(() => {
    setLoading(true)
    Promise.all([
      fetch('/api/photographer/connections').then(r => r.ok ? r.json() : { connected: [], pending: [], suggested: [] }),
      fetch('/api/photographer/cover-requests').then(r => r.ok ? r.json() : []),
      fetch('/api/photographer/groups').then(r => r.ok ? r.json() : { groups: [], invites: [] }),
    ])
      .then(([connData, coverData, groupData]) => {
        const all: Photographer[] = [
          ...(connData.connected ?? []),
          ...(connData.pending ?? []),
          ...(connData.suggested ?? []),
        ]
        setPhotographers(all)
        setCoverRequests(Array.isArray(coverData) ? coverData : [])
        setGroups(groupData.groups ?? [])
        setGroupInvites(groupData.invites ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Cover request form state
  const [coverEvent, setCoverEvent] = useState('')
  const [coverDate, setCoverDate] = useState('')   // "YYYY-MM-DD"
  const [coverStartTime, setCoverStartTime] = useState('')
  const [coverEndTime, setCoverEndTime] = useState('')

  const connected = photographers.filter(p => p.status === 'connected')
  const pending = photographers.filter(p => p.status === 'pending_received')
  const suggested = photographers.filter(p =>
    (p.status === 'suggested' || p.status === 'pending_sent') &&
    (search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.area.toLowerCase().includes(search.toLowerCase()))
  )
  const openCoverCount = coverRequests.filter(r => r.status === 'pending').length
  const pendingInvites = groupInvites.filter(i => i.status === 'pending')
  const totalRequests = pending.length + pendingInvites.length
  const activeGroup = groups.find(g => g.id === openGroup)

  function acceptGroupInvite(id: string) {
    setGroupInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'accepted' as GroupInviteStatus } : i))
    fetch('/api/photographer/groups/invites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: id, action: 'accept' }),
    })
      .then(r => r.ok ? loadData() : null)
      .catch(() => {})
  }

  function declineGroupInvite(id: string) {
    setGroupInvites(prev => prev.map(i => i.id === id ? { ...i, status: 'declined' as GroupInviteStatus } : i))
    fetch('/api/photographer/groups/invites', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_id: id, action: 'decline' }),
    }).catch(() => {})
  }

  const MAX_OWNED_GROUPS = PLATFORM_CONFIG.max_owned_groups_per_photographer
  const ownedGroupCount = groups.filter(g => g.ownerId === 'me' && !g.isCoverGroup && !g.isDm).length

  function acceptRequest(id: string) {
    setPhotographers(prev => prev.map(p => p.id === id ? { ...p, status: 'connected' as ConnectionStatus } : p))
    fetch('/api/photographer/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressee_id: id, action: 'accept' }),
    }).catch(() => {})
  }

  function declineRequest(id: string) {
    setPhotographers(prev => prev.filter(p => p.id !== id))
    fetch('/api/photographer/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressee_id: id, action: 'decline' }),
    }).catch(() => {})
  }

  function disconnectConnection(id: string) {
    setPhotographers(prev => prev.map(p => p.id === id ? { ...p, status: 'suggested' as ConnectionStatus } : p))
    fetch('/api/photographer/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressee_id: id, action: 'disconnect' }),
    }).catch(() => {})
  }

  function sendConnect(id: string) {
    setPhotographers(prev => prev.map(p => p.id === id ? { ...p, status: 'pending_sent' } : p))
    fetch('/api/photographer/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressee_id: id, action: 'connect' }),
    }).catch(() => {})
  }

  function cancelRequest(id: string) {
    setPhotographers(prev => prev.map(p => p.id === id ? { ...p, status: 'suggested' as ConnectionStatus } : p))
    fetch('/api/photographer/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ addressee_id: id, action: 'cancel' }),
    }).catch(() => {})
  }

  function createGroup(name: string, emoji: string) {
    if (ownedGroupCount >= MAX_OWNED_GROUPS) return
    fetch('/api/photographer/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, emoji }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(group => {
        if (!group) return
        const newGroup: Group = {
          id: group.id,
          name: group.name,
          emoji: group.emoji ?? '👥',
          memberIds: ['me'],
          pendingInviteIds: [],
          ownerId: 'me',
          messages: [],
          unread: 0,
          isRemoved: false,
        }
        setGroups(prev => [...prev, newGroup])
        setShowCreateModal(false)
        setOpenGroup(newGroup.id)
      })
      .catch(() => {})
  }

  async function leaveGroup(groupId: string) {
    const g = groups.find(x => x.id === groupId)
    if (!g) return

    // Already left — remove from UI and hard-delete from DB
    if (g.isLeft) {
      setGroups(prev => prev.filter(x => x.id !== groupId))
      setOpenGroup(null)
      fetch(`/api/photographer/groups?id=${groupId}`, { method: 'DELETE' }).catch(() => {})
      return
    }

    // For cover groups: post system message then remove from view entirely
    if (g.isCoverGroup) {
      await fetch('/api/photographer/groups/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: groupId, body: 'left the conversation.', is_system: true, is_leave: true }),
      }).catch(() => {})
      setGroups(prev => prev.filter(x => x.id !== groupId))
      setOpenGroup(null)
      fetch(`/api/photographer/groups?id=${groupId}`, { method: 'DELETE' }).catch(() => {})
      return
    }

    // Regular groups
    if (g.ownerId === 'me' || g.isRemoved) {
      setGroups(prev => prev.filter(x => x.id !== groupId))
    } else {
      setGroups(prev => prev.map(x => x.id === groupId
        ? { ...x, isLeft: true, memberIds: x.memberIds.filter(id => id !== 'me') }
        : x
      ))
    }
    setOpenGroup(null)
    fetch(`/api/photographer/groups?id=${groupId}`, { method: 'DELETE' }).catch(() => {})
  }

  function removeMember(groupId: string, memberId: string) {
    setGroups(prev => prev.map(g =>
      g.id === groupId ? { ...g, memberIds: g.memberIds.filter(id => id !== memberId) } : g
    ))
    fetch('/api/photographer/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: groupId, member_id: memberId }),
    }).catch(() => {})
  }

  function sendMessage(groupId: string, text: string, attachment?: { url: string; type: string; name: string; size: number }) {
    setGroups(prev => prev.map(g =>
      g.id === groupId
        ? {
            ...g,
            messages: [...g.messages, {
              id: Date.now(),
              senderId: 'me',
              senderName: 'You',
              senderInitials: 'YO',
              senderBg: 'bg-ink',
              text,
              time: new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
              attachmentUrl: attachment?.url ?? null,
              attachmentType: (attachment?.type ?? null) as GroupMessage['attachmentType'],
              attachmentName: attachment?.name ?? null,
              attachmentSize: attachment?.size ?? null,
            }],
          }
        : g
    ))
    fetch('/api/photographer/groups/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id: groupId,
        body: text,
        attachment_url: attachment?.url ?? null,
        attachment_type: attachment?.type ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_size: attachment?.size ?? null,
      }),
    }).catch(() => {})
  }

  function openGroupChat(id: string) {
    setOpenGroup(id)
    setGroups(prev => prev.map(g => g.id === id ? { ...g, unread: 0 } : g))
    fetch('/api/photographer/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: id }),
    }).catch(() => {})
  }

  async function acceptCover(id: string) {
    const req = coverRequests.find(r => r.id === id)
    setCoverRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'accepted' as CoverRequestStatus } : r))
    setAcceptedCoverIds(s => new Set(Array.from(s).concat(id)))

    // Mark accepted and get the requester's photographer_id back
    const patchRes = await fetch('/api/photographer/cover-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'accepted' }),
    }).catch(() => null)

    if (patchRes?.ok) {
      const patchData = await patchRes.json().catch(() => ({}))
      const requesterPhotographerId: string | undefined = patchData.requester_id
      const coverMessage: string = patchData.message ?? req?.event ?? 'Cover request'

      if (requesterPhotographerId) {
        // Create a private cover group between the two photographers
        const groupRes = await fetch('/api/photographer/groups', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: `Cover: ${coverMessage.slice(0, 40)}`,
            emoji: '🛡️',
            cover_requester_id: requesterPhotographerId,
          }),
        }).catch(() => null)

        if (groupRes?.ok) {
          const group = await groupRes.json().catch(() => null)
          if (group?.id) {
            // Send "I can cover" template message into the group
            const dateStr = req?.eventDate ? ` on ${req.eventDate}` : ''
            const timeStr = req?.startTime ? ` (${req.startTime}${req.endTime ? `–${req.endTime}` : ''})` : ''
            const templateMsg = `Hi! I can cover this — ${coverMessage}${dateStr}${timeStr}. Happy to discuss the handoff details with you.`
            await fetch('/api/photographer/groups/messages', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ group_id: group.id, body: templateMsg }),
            }).catch(() => {})

            const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
            const introMessage: GroupMessage = {
              id: Date.now(),
              senderId: 'me',
              senderName: 'You',
              senderInitials: 'YO',
              senderBg: 'bg-ink',
              text: templateMsg,
              time: now,
            }
            const newGroup: Group = {
              id: group.id,
              name: group.name,
              emoji: group.emoji ?? '🛡️',
              memberIds: ['me', requesterPhotographerId],
              pendingInviteIds: [],
              ownerId: 'me',
              isCoverGroup: true,
              isRemoved: false,
              isLeft: false,
              messages: [introMessage],
              unread: 0,
            }
            setGroups(prev => [newGroup, ...prev])
            setConnTab('groups')
            setOpenGroup(group.id)
          }
        }
      }
    }
  }

  function postCoverRequest() {
    if (!coverEvent.trim() || !coverDate.trim() || !coverStartTime.trim() || !coverEndTime.trim()) return
    const tempId = `cr-${Date.now()}`
    const tempReq: CoverRequest = {
      id: tempId,
      from: 'You', fromInitials: 'ME', fromBg: 'bg-ink',
      eventDate: coverDate, startTime: coverStartTime, endTime: coverEndTime,
      event: coverEvent, area: '',
      status: 'pending', isOwn: true,
      createdAt: new Date().toISOString(),
    }
    setCoverRequests(prev => [tempReq, ...prev])
    const saved = { event: coverEvent, date: coverDate, start: coverStartTime, end: coverEndTime }
    setCoverEvent(''); setCoverDate(''); setCoverStartTime(''); setCoverEndTime('')
    fetch('/api/photographer/cover-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: saved.event,
        event_date: saved.date,
        start_time: saved.start,
        end_time: saved.end,
        message: `${saved.event} — ${saved.date} ${saved.start}–${saved.end}`,
      }),
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.id) {
          setCoverRequests(prev => prev.map(r => r.id === tempId ? { ...r, id: data.id } : r))
        }
      })
      .catch(() => {})
  }

  function withdrawCover(id: string) {
    setCoverRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'withdrawn' as CoverRequestStatus } : r))
    fetch('/api/photographer/cover-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'withdrawn' }),
    }).catch(() => {})
  }

  async function chooseCover(parentReqId: string, accepter: CoverAccepter) {
    const parentReq = coverRequests.find(r => r.id === parentReqId)

    // Optimistically mark filled and clear accepters
    setCoverRequests(prev => prev.map(r =>
      r.id === parentReqId ? { ...r, status: 'filled' as CoverRequestStatus, accepters: [] } : r
    ))

    const patchRes = await fetch('/api/photographer/cover-requests', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: accepter.requestId, status: 'filled' }),
    }).catch(() => null)

    if (!patchRes?.ok) return
    const patchData = await patchRes.json().catch(() => ({}))
    const recipientId: string | undefined = patchData.recipient_id
    const coverMessage: string = patchData.message ?? accepter.name
    const declinedRecipientIds: string[] = patchData.declined_recipient_ids ?? []

    if (!recipientId) return

    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })

    const addSystemMsg = (groupId: string, text: string) => {
      setGroups(prev => prev.map(g => g.id !== groupId ? g : {
        ...g,
        messages: [...g.messages, {
          id: Date.now() + Math.random(),
          senderId: 'system', senderName: '', senderInitials: '', senderBg: '',
          text, time: now, isSystem: true,
        }],
      }))
    }

    // ── Find existing cover groups by member id ──
    // Each cover group has ['me', photographerId] as memberIds
    const chosenGroup = groups.find(g => g.isCoverGroup && g.memberIds.includes(recipientId))

    // ── Send "chosen" message into the existing group with Person B ──
    const chosenMsg = `✅ You've been chosen as the cover photographer for this booking. Let's coordinate the handoff!`
    if (chosenGroup) {
      fetch('/api/photographer/groups/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: chosenGroup.id, body: chosenMsg, is_system: true }),
      }).catch(() => {})
      addSystemMsg(chosenGroup.id, chosenMsg)
      setConnTab('groups')
      setOpenGroup(chosenGroup.id)
    }

    // ── Send "declined" message into each existing group with Person C, D, etc. ──
    const declinedMsg = `❌ This cover request has been filled by another photographer. Thank you for your willingness to help!`
    for (const declinedId of declinedRecipientIds) {
      const declinedGroup = groups.find(g => g.isCoverGroup && g.memberIds.includes(declinedId))
      if (declinedGroup) {
        fetch('/api/photographer/groups/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ group_id: declinedGroup.id, body: declinedMsg, is_system: true }),
        }).catch(() => {})
        addSystemMsg(declinedGroup.id, declinedMsg)
      }
    }

    // Person B's calendar is marked busy server-side in the PATCH /cover-requests handler.
  }

  return (
    <div className="space-y-5">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Connections',   value: connected.length.toString(),                                                                               icon: Users  },
          { label: 'Groups owned', value: `${ownedGroupCount}/${MAX_OWNED_GROUPS}`,                                                              icon: Users  },
          { label: 'Open cover',  value: openCoverCount.toString(),                                                                              icon: Shield },
        ].map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-white rounded-xl px-3 py-3 text-center border border-ink-100">
              <Icon className="w-4 h-4 text-ink-300 mx-auto mb-1" />
              <p className="font-bold text-ink text-lg">{s.value}</p>
              <p className="text-ink-300 text-xs">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-ink-100">
        {([
          { key: 'groups',  label: 'Groups' },
          { key: 'network', label: totalRequests > 0 ? `My network (${totalRequests})` : 'My network' },
          { key: 'cover',   label: openCoverCount > 0 ? `Cover (${openCoverCount})` : 'Cover requests' },
        ] as { key: ConnTab; label: string }[]).map(t => (
          <button key={t.key} onClick={() => { setConnTab(t.key); setOpenGroup(null) }}
            className={`flex-1 text-xs font-medium py-2 px-2 rounded-lg transition-all whitespace-nowrap ${
              connTab === t.key ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Groups tab ───────────────────────────────────────────────── */}
      {connTab === 'groups' && (
        <>
          {/* Group chat open */}
          {openGroup && activeGroup ? (
            <div className="bg-white rounded-2xl overflow-hidden border border-ink-100">
              <GroupChat
                group={activeGroup}
                allPhotographers={photographers}
                connected={connected}
                isOwner={activeGroup.ownerId === 'me'}
                onSend={sendMessage}
                onClose={() => setOpenGroup(null)}
                onLeave={leaveGroup}
                onRemoveMember={removeMember}
                onInviteSent={(groupId, inviteeId) => {
                  setGroups(prev => prev.map(g => g.id !== groupId ? g : {
                    ...g, pendingInviteIds: Array.from(new Set([...g.pendingInviteIds, inviteeId]))
                  }))
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Group list */}
              {groups.filter(g => !g.isDm).map(g => {
                const lastMsg = g.messages[g.messages.length - 1]
                const members = photographers.filter(p => g.memberIds.includes(p.id))
                return (
                  <button
                    key={g.id}
                    onClick={() => openGroupChat(g.id)}
                    className="w-full flex items-center gap-3 p-4 bg-white rounded-2xl border border-ink-100 hover:bg-ink-50 transition-colors text-left"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-ink-100 flex items-center justify-center text-2xl flex-shrink-0">
                      {g.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-ink">{g.name}</p>
                          {g.isCoverGroup
                            ? <span className="text-[9px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full">🛡️ Cover</span>
                            : g.ownerId === 'me'
                              ? <span className="text-[9px] font-semibold bg-ink-100 text-ink-400 px-1.5 py-0.5 rounded-full">Owner</span>
                              : <span className="text-[9px] font-semibold bg-ink-50 text-ink-300 px-1.5 py-0.5 rounded-full">Member</span>
                          }
                        </div>
                        {lastMsg && <span className="text-[10px] text-ink-300">{lastMsg.time}</span>}
                      </div>
                      <p className="text-xs text-ink-300 mb-1">{g.memberIds.length} members · {members.map(m => m.name.split(' ')[0]).join(', ') || 'Just you'}</p>
                      {lastMsg && (
                        <p className="text-xs text-ink-400 truncate">
                          <span className="font-medium">{lastMsg.senderId === 'me' ? 'You' : lastMsg.senderName.split(' ')[0]}:</span> {lastMsg.text}
                        </p>
                      )}
                    </div>
                    {g.unread > 0 && (
                      <span className="w-5 h-5 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                        {g.unread}
                      </span>
                    )}
                  </button>
                )
              })}

              {/* Create group button / limit notice */}
              {ownedGroupCount < MAX_OWNED_GROUPS ? (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="w-full flex items-center gap-3 p-4 border-2 border-dashed border-ink-200 rounded-2xl hover:border-ink-400 hover:bg-ink-50 transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-ink-50 flex items-center justify-center flex-shrink-0">
                    <Plus className="w-5 h-5 text-ink-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink-500">Create a group</p>
                    <p className="text-xs text-ink-300">{MAX_OWNED_GROUPS - ownedGroupCount} group{MAX_OWNED_GROUPS - ownedGroupCount !== 1 ? 's' : ''} you can still create</p>
                  </div>
                </button>
              ) : (
                <div className="bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700 border border-amber-200">
                  You've created the maximum of {MAX_OWNED_GROUPS} groups. Delete one to create another. You can still join groups others create.
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Network tab ──────────────────────────────────────────────── */}
      {connTab === 'network' && (
        <div className="space-y-4">
          {totalRequests > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Requests ({totalRequests})</p>
              <div className="space-y-2">
                {pending.map(p => (
                  <ConnectionCard key={p.id} p={p} onAccept={() => acceptRequest(p.id)} onDecline={() => declineRequest(p.id)} />
                ))}
                {groupInvites.filter(i => i.status !== 'declined').map(invite => (
                  <GroupInviteCard
                    key={invite.id}
                    invite={invite}
                    onAccept={() => acceptGroupInvite(invite.id)}
                    onDecline={() => declineGroupInvite(invite.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {connected.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Connected ({connected.length})</p>
              <div className="space-y-2">{connected.map(p => <ConnectionCard key={p.id} p={p} onDisconnect={() => disconnectConnection(p.id)} />)}</div>
            </div>
          )}

          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Find photographers</p>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or area…"
                className="w-full border border-ink-100 rounded-xl pl-9 pr-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all"
              />
            </div>
            <div className="space-y-2">
              {suggested.map(p => (
                <ConnectionCard
                  key={p.id}
                  p={p}
                  onConnect={() => sendConnect(p.id)}
                  onCancel={() => cancelRequest(p.id)}
                />
              ))}
              {suggested.length === 0 && search && <p className="text-sm text-ink-300 text-center py-4">No photographers found for "{search}"</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── Cover requests tab ────────────────────────────────────────── */}
      {connTab === 'cover' && (
        <div className="space-y-4">
          <div className="bg-amber-50 rounded-xl px-4 py-3 text-xs text-amber-700 border border-amber-200 leading-relaxed">
            <strong>Cover requests</strong> — when you can't make a booking, post here and a network peer can step in. If they accept, you're connected to discuss the handoff.
          </div>

          <div className="bg-white rounded-2xl p-4 border border-ink-100 space-y-3">
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Post a cover request</p>
            {/* Quick-select templates */}
            <div className="flex flex-wrap gap-1.5">
              {['Wedding', 'Corporate headshots', 'Family portraits', 'Engagement session', 'Event photography', 'Product shoot'].map(t => (
                <button
                  key={t}
                  onClick={() => setCoverEvent(t)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors ${coverEvent === t ? 'bg-ink text-white border-ink' : 'border-ink-200 text-ink-400 hover:border-ink hover:text-ink'}`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Event type free text */}
            <input type="text" value={coverEvent}
              onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_cover_request_message_length) setCoverEvent(e.target.value) }}
              maxLength={PLATFORM_CONFIG.max_cover_request_message_length}
              placeholder="Or type event type…"
              className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all"
            />
            {/* Date picker */}
            <input type="date" value={coverDate} onChange={e => setCoverDate(e.target.value)}
              className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all"
            />
            {/* Time pickers */}
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-[10px] text-ink-400 font-medium uppercase tracking-wider block mb-1">Start time</label>
                <input type="time" value={coverStartTime} onChange={e => setCoverStartTime(e.target.value)}
                  className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-ink-400 font-medium uppercase tracking-wider block mb-1">End time</label>
                <input type="time" value={coverEndTime} onChange={e => setCoverEndTime(e.target.value)}
                  className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all"
                />
              </div>
            </div>
            <button onClick={postCoverRequest} disabled={!coverEvent.trim() || !coverDate.trim() || !coverStartTime.trim() || !coverEndTime.trim()}
              className="flex items-center gap-2 text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" /> Post cover request
            </button>
          </div>

          <div>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">From your network</p>
            {acceptedCoverIds.size > 0 && (
              <div className="mb-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-2 text-xs text-emerald-700">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Cover accepted — that date has been automatically marked as <strong>busy</strong> on your availability calendar.</span>
              </div>
            )}
            <div className="space-y-3">
              {[...coverRequests].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()).map(req => (
                <CoverRequestCard
                  key={req.id}
                  req={req}
                  onAccept={() => acceptCover(req.id)}
                  onWithdraw={() => withdrawCover(req.id)}
                  onChoose={a => chooseCover(req.id, a)}
                  bookedDates={bookedDates}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create group modal */}
      {showCreateModal && (
        <CreateGroupModal
          onClose={() => setShowCreateModal(false)}
          onCreate={createGroup}
        />
      )}
    </div>
  )
}
