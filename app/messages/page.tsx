'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Send, Smile, MoreVertical, Paperclip,
  ArrowLeft, CheckCheck, Check, X, Flag, AlertTriangle,
  Ban, ShieldAlert, Clock, MessageSquare, Loader2, Calendar,
} from 'lucide-react'

import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { AttachmentBubble, AttachmentPreview } from '@/components/message-attachment'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_MESSAGE_LENGTH    = PLATFORM_CONFIG.max_message_length
const MAX_MESSAGES_PER_HOUR = PLATFORM_CONFIG.max_messages_per_hour
const MAX_UNREAD_SHOWN      = PLATFORM_CONFIG.max_unread_conversations_shown

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageStatus = 'sent' | 'delivered' | 'read'
type ConvModerationState = 'normal' | 'blocked' | 'reported' | 'reported_and_blocked'

type SpamReason =
  | 'Unsolicited promotional content'
  | 'Harassing or threatening messages'
  | 'Fake photographer / scam'
  | 'Repeated unwanted contact'
  | 'Other'

const SPAM_REASONS: SpamReason[] = [
  'Unsolicited promotional content',
  'Harassing or threatening messages',
  'Fake photographer / scam',
  'Repeated unwanted contact',
  'Other',
]

interface ApiConversation {
  id: string
  photographer_username: string | null
  photographer_display_name: string | null
  photographer_avatar_url: string | null
  last_message_body: string | null
  last_message_at: string | null
  unread_count: number
}

interface Message {
  id: string | number
  from: 'me' | 'them'
  text: string
  time: string
  status: MessageStatus
  isSystem?: boolean
  attachmentUrl: string | null
  attachmentType: string | null
  attachmentName: string | null
  attachmentSize: number | null
}

interface Conversation {
  id: string
  name: string
  initials: string
  avatarUrl: string | null
  photographerUsername: string | null
  lastMessage: string
  lastTime: string
  unread: number
  moderation: ConvModerationState
  hourlyMessageCount: number
  messages: Message[]
  messagesLoaded: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMOJIS = ['😊','😄','😍','🥰','😂','🙏','👍','❤️','🎉','🔥','✨','📸','💍','🌸','😎','🤝','💯','🙌','😮','😢']

function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  return (
    <div
      className="absolute bottom-full mb-2 left-0 bg-white rounded-2xl p-3 grid grid-cols-5 gap-1.5 z-20"
      style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)', width: 196 }}
    >
      {EMOJIS.map((e) => (
        <button key={e} type="button" onClick={() => onPick(e)}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-ink-50 rounded-lg transition-colors">
          {e}
        </button>
      ))}
    </div>
  )
}

function Tick({ status }: { status: MessageStatus }) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-emerald-500" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-ink-300" />
  return <Check className="w-3 h-3 text-ink-300" />
}

function timeAgo(iso: string | null): string {
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
  } catch { return '' }
}

function formatMsgTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
  } catch { return iso }
}

// ─── Booking card bubble ──────────────────────────────────────────────────────

function BookingBubble({ text }: { text: string }) {
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

// ─── Report Modal ─────────────────────────────────────────────────────────────

function ReportModal({
  name, onSubmit, onClose,
}: {
  name: string
  onSubmit: (reason: SpamReason, note: string, alsoBlock: boolean) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState<SpamReason | null>(null)
  const [note, setNote] = useState('')
  const [alsoBlock, setAlsoBlock] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  function submit() {
    if (!reason) return
    setSubmitted(true)
    setTimeout(() => { onSubmit(reason, note, alsoBlock) }, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7 text-amber-500" />
            </div>
            <p className="font-semibold text-ink text-base mb-2">Report submitted</p>
            <p className="text-ink-400 text-sm leading-relaxed">Our team will review this conversation and take appropriate action. Thank you for keeping TrueNorth Frames safe.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
              <div className="flex items-center gap-2.5">
                <Flag className="w-4 h-4 text-red-500" />
                <p className="font-semibold text-ink text-sm">Report {name}</p>
              </div>
              <button onClick={onClose} className="text-ink-300 hover:text-ink transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2.5">Why are you reporting this conversation?</p>
                <div className="space-y-2">
                  {SPAM_REASONS.map(r => (
                    <button key={r} onClick={() => setReason(r)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all ${reason === r ? 'border-red-400 bg-red-50 text-red-700 font-medium' : 'border-ink-100 text-ink-500 hover:border-ink-200 hover:bg-ink-50'}`}>
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${reason === r ? 'border-red-500 bg-red-500' : 'border-ink-200'}`}>
                        {reason === r && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Additional details <span className="font-normal text-ink-200 normal-case">(optional)</span></p>
                <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={3}
                  placeholder="Describe what happened…"
                  className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all resize-none" />
              </div>
              <button onClick={() => setAlsoBlock(v => !v)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${alsoBlock ? 'border-ink bg-ink-50' : 'border-ink-100 hover:bg-ink-50'}`}>
                <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-colors ${alsoBlock ? 'bg-ink' : 'border-2 border-ink-200'}`}>
                  {alsoBlock && <Check className="w-3 h-3 text-white" />}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Also block {name}</p>
                  <p className="text-xs text-ink-300">They won't be able to send you new messages</p>
                </div>
              </button>
            </div>
            <div className="px-5 pb-5 flex gap-2.5">
              <button onClick={submit} disabled={!reason}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40">
                Submit report
              </button>
              <button onClick={onClose} className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Block Confirm Modal ──────────────────────────────────────────────────────

function BlockModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ban className="w-6 h-6 text-ink-400" />
        </div>
        <p className="font-semibold text-ink text-base text-center mb-2">Block {name}?</p>
        <p className="text-ink-400 text-sm text-center leading-relaxed mb-5">
          They won't be able to send you new messages. You can unblock them at any time.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onConfirm} className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors">Block</button>
          <button onClick={onClose} className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">Cancel</button>
        </div>
      </div>
    </div>
  )
}

// ─── Conversation menu ────────────────────────────────────────────────────────

function ConvMenu({ name, moderation, photographerUsername, onBlock, onUnblock, onReport, onClose }: {
  name: string
  moderation: ConvModerationState
  photographerUsername: string | null
  onBlock: () => void
  onUnblock: () => void
  onReport: () => void
  onClose: () => void
}) {
  const isBlocked = moderation === 'blocked' || moderation === 'reported_and_blocked'
  return (
    <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl border border-ink-100 z-30 overflow-hidden py-1"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}>
      {photographerUsername && (
        <Link href={`/photographers/${photographerUsername}`} onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-500 hover:bg-ink-50 transition-colors">
          View profile
        </Link>
      )}
      <div className="border-t border-ink-50 mt-1 pt-1">
        {isBlocked ? (
          <button onClick={onUnblock}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors text-left">
            <Ban className="w-3.5 h-3.5" /> Unblock {name.split(' ')[0]}
          </button>
        ) : (
          <button onClick={onBlock}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-500 hover:bg-ink-50 transition-colors text-left">
            <Ban className="w-3.5 h-3.5" /> Block {name.split(' ')[0]}
          </button>
        )}
        <button onClick={onReport}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left">
          <Flag className="w-3.5 h-3.5" /> Report as spam
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const router = useRouter()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const [sending, setSending] = useState(false)

  // Modals
  const [showMenu, setShowMenu] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  // Rate limit toast
  const [rateLimitHit, setRateLimitHit] = useState(false)

  // Attachment state
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollPaneRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const active = conversations.find((c) => c.id === activeId) ?? null
  const isBlocked = active ? (active.moderation === 'blocked' || active.moderation === 'reported_and_blocked') : false
  const isReported = active ? (active.moderation === 'reported' || active.moderation === 'reported_and_blocked') : false
  const atRateLimit = active ? active.hourlyMessageCount >= MAX_MESSAGES_PER_HOUR : false
  const charsLeft = MAX_MESSAGE_LENGTH - input.length
  const nearLimit = charsLeft <= 100

  // Load conversations on mount only
  useEffect(() => {
    async function loadConversations() {
      try {
        const res = await fetch('/api/client/conversations')
        if (res.ok) {
          const data: ApiConversation[] = await res.json()
          setConversations(data.map(c => ({
            id: c.id,
            name: c.photographer_display_name ?? 'Photographer',
            initials: (c.photographer_display_name ?? 'P')
              .split(' ')
              .filter(Boolean)
              .map(w => w[0].toUpperCase())
              .slice(0, 2)
              .join(''),
            avatarUrl: c.photographer_avatar_url,
            photographerUsername: c.photographer_username,
            lastMessage: c.last_message_body ?? '',
            lastTime: timeAgo(c.last_message_at),
            unread: c.unread_count,
            moderation: 'normal' as ConvModerationState,
            hourlyMessageCount: 0,
            messages: [],
            messagesLoaded: false,
          })))
          // Auto-select first conversation
          if (data.length > 0) {
            setActiveId(prev => prev ?? data[0].id)
          }
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    loadConversations()
  }, [])

  // Load thread messages when active conversation changes
  // NOTE: intentionally NOT including `conversations` in deps — we read it via
  // functional updater in setConversations so we don't need the stale value
  useEffect(() => {
    if (!activeId) return

    // Check via functional read to avoid stale closure
    setConversations(prev => {
      const conv = prev.find(c => c.id === activeId)
      if (!conv || conv.messagesLoaded) return prev // already loaded or not found
      return prev // return unchanged — actual fetch is below
    })

    // We always attempt the fetch; the API is idempotent (just marks read + returns msgs)
    fetch(`/api/client/messages/${activeId}`)
      .then(r => r.ok ? r.json() : [])
      .then((msgs: any[]) => {
        setConversations(prev => prev.map(c =>
          c.id === activeId
            ? {
                ...c,
                messagesLoaded: true,
                messages: msgs.map((m: any) => ({
                  id: m.id,
                  from: m.from as 'me' | 'them',
                  text: m.text,
                  time: m.time,
                  status: 'read' as MessageStatus,
                  isSystem: m.isSystem ?? false,
                  attachmentUrl: m.attachmentUrl ?? null,
                  attachmentType: m.attachmentType ?? null,
                  attachmentName: m.attachmentName ?? null,
                  attachmentSize: m.attachmentSize ?? null,
                })),
              }
            : c
        ))
      })
      .catch(() => {})
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId])

  useEffect(() => {
    if (scrollPaneRef.current) {
      scrollPaneRef.current.scrollTop = scrollPaneRef.current.scrollHeight
    }
  }, [activeId, active?.messages.length])

  // Close menu on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showMenu])

  function selectConv(id: string) {
    setActiveId(id)
    setMobileView('thread')
    setShowMenu(false)
    setConversations(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }

  async function sendMessage() {
    const text = input.trim()
    if ((!text && !pendingFile) || isBlocked || !activeId || sending || uploading) return

    if (atRateLimit) {
      setRateLimitHit(true)
      setTimeout(() => setRateLimitHit(false), 3000)
      return
    }

    setSending(true)
    setInput('')
    setShowEmoji(false)

    let attachmentUrl: string | null = null
    let attachmentType: string | null = null
    let attachmentName: string | null = null
    let attachmentSize: number | null = null

    if (pendingFile) {
      setUploading(true)
      try {
        const fd = new FormData()
        fd.append('file', pendingFile)
        fd.append('conversation_id', activeId)
        const upRes = await fetch('/api/client/messages/upload', { method: 'POST', body: fd })
        if (upRes.ok) {
          const upData = await upRes.json()
          attachmentUrl = upData.url
          attachmentType = upData.type
          attachmentName = upData.name
          attachmentSize = upData.size
        }
      } finally {
        setPendingFile(null)
        setUploading(false)
      }
    }

    const optimisticId = Date.now()
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? {
            ...c,
            lastMessage: text,
            lastTime: 'now',
            hourlyMessageCount: c.hourlyMessageCount + 1,
            messages: [...c.messages, {
              id: optimisticId, from: 'me' as const, text, time: new Date().toISOString(), status: 'sent' as MessageStatus,
              attachmentUrl, attachmentType, attachmentName, attachmentSize,
            }],
          }
        : c
    ))

    try {
      const res = await fetch(`/api/client/messages/${activeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, attachment_url: attachmentUrl, attachment_type: attachmentType, attachment_name: attachmentName, attachment_size: attachmentSize }),
      })
      if (res.ok) {
        const msg = await res.json()
        setConversations(prev => prev.map(c =>
          c.id === activeId
            ? { ...c, messages: c.messages.map(m => m.id === optimisticId ? { ...msg, status: 'delivered' as MessageStatus } : m) }
            : c
        ))
      } else {
        // Roll back optimistic
        setConversations(prev => prev.map(c =>
          c.id === activeId
            ? { ...c, messages: c.messages.filter(m => m.id !== optimisticId), hourlyMessageCount: c.hourlyMessageCount - 1 }
            : c
        ))
        setInput(text)
      }
    } catch {
      setConversations(prev => prev.map(c =>
        c.id === activeId
          ? { ...c, messages: c.messages.filter(m => m.id !== optimisticId), hourlyMessageCount: c.hourlyMessageCount - 1 }
          : c
      ))
      setInput(text)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  function appendEmoji(emoji: string) {
    if (input.length < MAX_MESSAGE_LENGTH) setInput(prev => prev + emoji)
    inputRef.current?.focus()
  }

  function confirmBlock() {
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, moderation: c.moderation === 'reported' ? 'reported_and_blocked' : 'blocked' }
        : c
    ))
    setShowBlockModal(false)
    setShowMenu(false)
  }

  function confirmUnblock() {
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, moderation: c.moderation === 'reported_and_blocked' ? 'reported' : 'normal' }
        : c
    ))
    setShowMenu(false)
  }

  function submitReport(_reason: SpamReason, _note: string, alsoBlock: boolean) {
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, moderation: alsoBlock ? 'reported_and_blocked' : 'reported' }
        : c
    ))
    setTimeout(() => setShowReportModal(false), 800)
  }

  const filteredConvs = conversations
    .filter(c =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, MAX_UNREAD_SHOWN)

  const totalUnread = conversations.reduce((a, c) => a + c.unread, 0)

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      {/* Modals */}
      {showBlockModal && active && (
        <BlockModal name={active.name} onConfirm={confirmBlock} onClose={() => setShowBlockModal(false)} />
      )}
      {showReportModal && active && (
        <ReportModal name={active.name} onSubmit={submitReport} onClose={() => setShowReportModal(false)} />
      )}

      {/* Top nav */}
      <div className="bg-white border-b border-ink-100 flex-shrink-0 h-14 flex items-center px-4 sm:px-6 gap-4 z-10">
        <Link href="/dashboard/client" className="flex items-center gap-2 text-ink-400 hover:text-ink transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="font-semibold text-ink text-sm">Messages</span>
          {totalUnread > 0 && (
            <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>
          )}
        </div>
        <Link href="/photographers" className="text-xs font-semibold text-ink border border-ink-100 px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors hidden sm:flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" />
          New conversation
        </Link>
      </div>

      {/* Main split */}
      <div className="flex flex-1 overflow-hidden">

        {/* Conversation list */}
        <div className={`w-full sm:w-80 lg:w-96 border-r border-ink-100 flex flex-col flex-shrink-0 bg-white ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-ink-50 flex-shrink-0">
            <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className="bg-transparent text-ink text-xs placeholder-ink-300 outline-none flex-1"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
              </div>
            )}

            {!loading && filteredConvs.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <MessageSquare className="w-8 h-8 text-ink-200 mb-3" />
                <p className="text-sm font-medium text-ink-400">No conversations yet</p>
                <p className="text-xs text-ink-300 mt-1">Book a photographer to start chatting</p>
              </div>
            )}

            {filteredConvs.map((c) => {
              const convBlocked = c.moderation === 'blocked' || c.moderation === 'reported_and_blocked'
              const convReported = c.moderation === 'reported' || c.moderation === 'reported_and_blocked'
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectConv(c.id)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-ink-50 text-left transition-colors ${
                    activeId === c.id ? 'bg-ink-50' : 'hover:bg-ink-50/60'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {c.avatarUrl ? (
                      <div className={`w-11 h-11 rounded-xl overflow-hidden ${convBlocked ? 'opacity-50 grayscale' : ''}`}>
                        <Image src={c.avatarUrl} alt={c.name} width={44} height={44} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className={`w-11 h-11 rounded-xl bg-ink flex items-center justify-center text-white text-xs font-bold ${convBlocked ? 'opacity-40' : ''}`}>
                        {c.initials}
                      </div>
                    )}
                    {convBlocked && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-ink-400 rounded-full flex items-center justify-center">
                        <Ban className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className={`text-sm leading-tight truncate font-semibold ${convBlocked ? 'text-ink-400' : 'text-ink'}`}>
                        {c.name}
                      </p>
                      <p className="text-[10px] text-ink-200 flex-shrink-0 ml-2">{c.lastTime}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      {convBlocked && <span className="text-[9px] font-semibold bg-ink-100 text-ink-400 px-1.5 py-0.5 rounded-full">Blocked</span>}
                      {convReported && !convBlocked && <span className="text-[9px] font-semibold bg-amber-50 text-amber-600 px-1.5 py-0.5 rounded-full">Reported</span>}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-ink-400 text-xs truncate leading-tight">{c.lastMessage}</p>
                      {c.unread > 0 && (
                        <span className="w-4 h-4 bg-ink rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}

            {conversations.length > MAX_UNREAD_SHOWN && (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-ink-300">Showing {MAX_UNREAD_SHOWN} of {conversations.length} conversations</p>
              </div>
            )}
          </div>
        </div>

        {/* Thread view */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-ink-50/30 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>

          {!active ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <MessageSquare className="w-10 h-10 text-ink-200 mb-3" />
              <p className="font-semibold text-ink text-sm mb-1">Select a conversation</p>
              <p className="text-ink-300 text-xs">Choose a conversation from the left to view messages</p>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="bg-white border-b border-ink-100 px-4 sm:px-5 py-3 flex items-center gap-3 flex-shrink-0">
                <button type="button" onClick={() => setMobileView('list')} className="sm:hidden text-ink-400 hover:text-ink transition-colors mr-1">
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="relative flex-shrink-0">
                  {active.avatarUrl ? (
                    <div className={`w-9 h-9 rounded-xl overflow-hidden ${isBlocked ? 'opacity-50 grayscale' : ''}`}>
                      <Image src={active.avatarUrl} alt={active.name} width={36} height={36} className="object-cover w-full h-full" />
                    </div>
                  ) : (
                    <div className={`w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-white text-[11px] font-bold ${isBlocked ? 'opacity-40' : ''}`}>
                      {active.initials}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink text-sm">{active.name}</p>
                    {isBlocked && <span className="text-[10px] font-semibold bg-ink-100 text-ink-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Ban className="w-2.5 h-2.5" /> Blocked</span>}
                    {isReported && !isBlocked && <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Flag className="w-2.5 h-2.5" /> Reported</span>}
                  </div>
                  {active.photographerUsername && (
                    <p className="text-[10px] text-ink-300">@{active.photographerUsername}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {/* Navigate to full thread page */}
                  <button
                    type="button"
                    onClick={() => router.push(`/messages/${active.id}`)}
                    className="hidden sm:flex items-center gap-1.5 text-xs text-ink-400 border border-ink-100 px-2.5 py-1.5 rounded-lg hover:bg-ink-50 transition-colors"
                  >
                    Full view
                  </button>
                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(v => !v)}
                      className="w-8 h-8 rounded-lg border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-ink-400" />
                    </button>
                    {showMenu && (
                      <ConvMenu
                        name={active.name}
                        moderation={active.moderation}
                        photographerUsername={active.photographerUsername}
                        onBlock={() => { setShowMenu(false); setShowBlockModal(true) }}
                        onUnblock={() => { confirmUnblock(); setShowMenu(false) }}
                        onReport={() => { setShowMenu(false); setShowReportModal(true) }}
                        onClose={() => setShowMenu(false)}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Blocked banner */}
              {isBlocked && (
                <div className="bg-ink-50 border-b border-ink-100 px-5 py-3 flex items-center gap-3">
                  <Ban className="w-4 h-4 text-ink-400 flex-shrink-0" />
                  <p className="text-xs text-ink-500 flex-1">
                    You've blocked <span className="font-semibold">{active.name}</span>. They can't send you new messages.
                  </p>
                  <button onClick={confirmUnblock}
                    className="text-xs font-semibold text-ink border border-ink-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors flex-shrink-0">
                    Unblock
                  </button>
                </div>
              )}

              {/* Reported banner */}
              {isReported && (
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700 flex-1">You've reported this conversation. Our team is reviewing it.</p>
                </div>
              )}

              {/* Rate limit toast */}
              {rateLimitHit && (
                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg">
                  <Clock className="w-3.5 h-3.5" />
                  Message limit reached ({MAX_MESSAGES_PER_HOUR}/hr). Try again shortly.
                </div>
              )}

              {/* Messages */}
              <div ref={scrollPaneRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-1">
                {!active.messagesLoaded && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin text-ink-300" />
                  </div>
                )}

                {active.messages.map((msg, i) => {
                  const fromMe = msg.from === 'me'
                  const isLastInGroup = active.messages[i + 1]?.from !== msg.from

                  if (msg.isSystem) {
                    return (
                      <div key={msg.id} className="flex justify-center my-3">
                        <BookingBubble text={msg.text} />
                      </div>
                    )
                  }

                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'} ${i > 0 && active.messages[i-1].from === msg.from ? 'mt-0.5' : 'mt-4'}`}>
                      {!fromMe && (
                        <div className="w-7 h-7 flex-shrink-0 mb-1">
                          {isLastInGroup && (
                            active.avatarUrl ? (
                              <div className="w-7 h-7 rounded-lg overflow-hidden">
                                <Image src={active.avatarUrl} alt={active.name} width={28} height={28} className="object-cover" />
                              </div>
                            ) : (
                              <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center text-white text-[9px] font-bold">
                                {active.initials}
                              </div>
                            )
                          )}
                        </div>
                      )}

                      <div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'} max-w-[72%] sm:max-w-[60%]`}>
                        <div
                          className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative ${
                            fromMe ? 'bg-ink text-white rounded-br-sm' : 'bg-white text-ink border border-ink-100 rounded-bl-sm'
                          }`}
                          style={{ boxShadow: fromMe ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}
                        >
                          {msg.text}
                          {msg.attachmentUrl && (
                            <AttachmentBubble
                              url={msg.attachmentUrl}
                              type={msg.attachmentType ?? ''}
                              name={msg.attachmentName}
                              size={msg.attachmentSize}
                              fromMe={fromMe}
                            />
                          )}
                        </div>

                        {isLastInGroup && (
                          <div className={`flex items-center gap-1 mt-1.5 ${fromMe ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-ink-200">{formatMsgTime(msg.time)}</span>
                            {fromMe && <Tick status={msg.status} />}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Composer */}
              <div className="bg-white border-t border-ink-100 px-4 sm:px-5 py-3 flex-shrink-0">
                {isBlocked ? (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <Ban className="w-4 h-4 text-ink-300" />
                    <p className="text-sm text-ink-300">Messaging is blocked for this conversation</p>
                    <button onClick={confirmUnblock} className="text-xs font-semibold text-ink underline underline-offset-2 hover:no-underline transition-all ml-1">Unblock</button>
                  </div>
                ) : (
                  <>
                    {active.hourlyMessageCount >= MAX_MESSAGES_PER_HOUR - 3 && (
                      <div className="flex items-center gap-1.5 mb-2.5 px-1">
                        <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
                        <p className="text-[11px] text-amber-600">
                          {atRateLimit
                            ? `Hourly limit reached (${MAX_MESSAGES_PER_HOUR} messages). Reset in under an hour.`
                            : `${MAX_MESSAGES_PER_HOUR - active.hourlyMessageCount} messages remaining this hour`}
                        </p>
                      </div>
                    )}

                    {pendingFile && (
                      <AttachmentPreview file={pendingFile} onRemove={() => setPendingFile(null)} />
                    )}

                    <div className="flex items-end gap-2.5">
                      <button type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-9 h-9 rounded-xl border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors flex-shrink-0 mb-0.5">
                        <Paperclip className="w-4 h-4 text-ink-400" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,video/*,.pdf"
                        className="hidden"
                        onChange={e => {
                          const f = e.target.files?.[0]
                          if (f) setPendingFile(f)
                          e.target.value = ''
                        }}
                      />
                      <div className="flex-1 relative">
                        {showEmoji && <EmojiPicker onPick={appendEmoji} />}
                        <div
                          className={`flex items-end gap-2 border rounded-2xl px-4 py-2.5 focus-within:ring-2 transition-all ${
                            atRateLimit
                              ? 'border-amber-200 bg-amber-50/50 focus-within:ring-amber-100'
                              : 'border-ink-100 focus-within:border-ink focus-within:ring-ink/10'
                          }`}
                          style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
                        >
                          <textarea
                            ref={inputRef}
                            rows={1}
                            value={input}
                            onChange={(e) => {
                              const val = e.target.value
                              if (val.length <= MAX_MESSAGE_LENGTH) {
                                setInput(val)
                                e.target.style.height = 'auto'
                                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                              }
                            }}
                            onKeyDown={handleKey}
                            disabled={atRateLimit}
                            placeholder={atRateLimit ? 'Hourly limit reached — try again shortly' : `Message ${active.name}…`}
                            className="flex-1 bg-transparent text-ink text-sm placeholder-ink-300 outline-none resize-none leading-relaxed disabled:cursor-not-allowed"
                            style={{ minHeight: 24, maxHeight: 120 }}
                          />
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {nearLimit && (
                              <span className={`text-[10px] font-medium tabular-nums ${charsLeft <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                                {charsLeft}
                              </span>
                            )}
                            <button type="button" onClick={() => setShowEmoji(!showEmoji)}
                              className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${showEmoji ? 'bg-ink-100 text-ink' : 'text-ink-300 hover:text-ink hover:bg-ink-50'}`}>
                              <Smile className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>

                      <button type="button" onClick={sendMessage} disabled={(!input.trim() && !pendingFile) || atRateLimit || sending || uploading}
                        className="w-9 h-9 rounded-xl bg-ink hover:bg-ink-800 flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 disabled:opacity-30 disabled:cursor-not-allowed">
                        {(sending || uploading) ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                      </button>
                    </div>

                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
