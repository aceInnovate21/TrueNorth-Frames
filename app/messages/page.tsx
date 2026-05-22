'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import {
  Search, Send, Paperclip, Smile, Mic, MoreVertical,
  ArrowLeft, CheckCheck, Check, X, Star, ExternalLink,
  Ban, Flag, AlertTriangle, ShieldAlert, ChevronDown,
  Clock, MessageSquare,
} from 'lucide-react'

import { PLATFORM_CONFIG } from '@/lib/platform-config'

// ─── Constants (aliased from platform-config for readability) ─────────────────

const MAX_MESSAGE_LENGTH    = PLATFORM_CONFIG.max_message_length
const MAX_MESSAGES_PER_HOUR = PLATFORM_CONFIG.max_messages_per_hour
const MAX_UNREAD_SHOWN      = PLATFORM_CONFIG.max_unread_conversations_shown

// ─── Types ────────────────────────────────────────────────────────────────────

// UI-layer read states derived from DBML messages.read_at:
//   read      → read_at IS NOT NULL
//   delivered → read_at IS NULL, message received by server
//   sent      → read_at IS NULL, optimistic local state before server ack
type MessageStatus = 'sent' | 'delivered' | 'read'
type ConvStatus = 'online' | 'away' | 'offline'
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

interface Message {
  id: number
  from: 'me' | 'them'
  text?: string
  image?: string
  voice?: { duration: string }
  time: string
  status: MessageStatus
  reaction?: string
}

interface Conversation {
  slug: string
  name: string
  initials: string
  specialty: string
  avatar: string
  status: ConvStatus
  lastSeen: string
  lastMessage: string
  lastTime: string
  unread: number
  rating: number
  rate: string
  messages: Message[]
  moderation: ConvModerationState
  hourlyMessageCount: number   // messages sent this hour (mock)
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const CONVERSATIONS: Conversation[] = [
  {
    slug: 'sarah-chen',
    name: 'Sarah Chen',
    initials: 'SC',
    specialty: 'Wedding · Portrait',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fit=crop&crop=face',
    status: 'online',
    lastSeen: 'Active now',
    lastMessage: "I have availability in September — shall we hop on a quick call?",
    lastTime: '2h ago',
    unread: 2,
    rating: 4.9,
    rate: '$200/session',
    moderation: 'normal',
    hourlyMessageCount: 3,
    messages: [
      { id: 1, from: 'me', text: "Hi Sarah! I came across your profile on TrueNorth Frames and I love your work. We're looking for a wedding photographer for September 2026.", time: '10:14 AM', status: 'read' },
      { id: 2, from: 'them', text: "Hi Alex! Thank you so much — that really means a lot. Congratulations on your upcoming wedding! 🎉", time: '10:22 AM', status: 'read' },
      { id: 3, from: 'them', text: "September is actually one of my favourite months to shoot — the light is incredible here in Edmonton. Do you have a specific date in mind?", time: '10:22 AM', status: 'read' },
      { id: 4, from: 'me', text: "We're thinking September 13th. It's at the Fairmont Macdonald downtown.", time: '10:45 AM', status: 'read' },
      { id: 5, from: 'them', text: "Oh I love the Fairmont — shot there twice last year. The staircase is stunning for portraits.", time: '11:01 AM', status: 'read', reaction: '❤️' },
      { id: 6, from: 'them', text: "Let me check my calendar… yes, September 13th is available! I'd love to set up a quick 20-minute call to learn more about your vision. Does that work?", time: '11:02 AM', status: 'read' },
      { id: 7, from: 'me', text: "That sounds perfect! Would Thursday afternoon work for you?", time: '2:30 PM', status: 'read' },
      { id: 8, from: 'them', text: "Thursday works great. How about 3 PM? I'll send a calendar invite.", time: '2:41 PM', status: 'read' },
      { id: 9, from: 'them', text: "Also — I have availability in September — shall we hop on a quick call to discuss packages too?", time: '2:41 PM', status: 'delivered' },
    ],
  },
  {
    slug: 'marcus-wright',
    name: 'Marcus Wright',
    initials: 'MW',
    specialty: 'Corporate · Events',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fit=crop&crop=face',
    status: 'away',
    lastSeen: 'Last seen 1h ago',
    lastMessage: "Happy to send over a full package breakdown.",
    lastTime: '1d ago',
    unread: 1,
    rating: 4.7,
    rate: '$150/hr',
    moderation: 'normal',
    hourlyMessageCount: 0,
    messages: [
      { id: 1, from: 'me', text: "Hi Marcus, we're organizing our annual company conference in November and need a photographer for the full day. Do you do day-rate packages?", time: 'Yesterday 9:00 AM', status: 'read' },
      { id: 2, from: 'them', text: "Hi! Yes absolutely — corporate events are my bread and butter. My full-day rate is $1,200 and includes edited hi-res images delivered within 5 business days.", time: 'Yesterday 9:45 AM', status: 'read' },
      { id: 3, from: 'me', text: "That sounds reasonable. What does the package include exactly?", time: 'Yesterday 10:02 AM', status: 'read' },
      { id: 4, from: 'them', text: "Happy to send over a full package breakdown.", time: 'Yesterday 10:15 AM', status: 'delivered' },
    ],
  },
  {
    slug: 'priya-patel',
    name: 'Priya Patel',
    initials: 'PP',
    specialty: 'Newborn · Family',
    avatar: '',
    status: 'offline',
    lastSeen: 'Last seen 3 days ago',
    lastMessage: "You: Thanks Priya, I'll confirm the date by end of week.",
    lastTime: '1w ago',
    unread: 0,
    rating: 4.8,
    rate: '$175/session',
    moderation: 'normal',
    hourlyMessageCount: 0,
    messages: [
      { id: 1, from: 'me', text: "Hi Priya! We're expecting our first baby in July and would love newborn photos. When do you typically schedule sessions?", time: 'May 10 · 3:00 PM', status: 'read' },
      { id: 2, from: 'them', text: "Congratulations!! 🥰 I schedule newborn sessions between 5–14 days after birth — that's the sweet spot when babies are sleepiest and most poseable.", time: 'May 10 · 4:30 PM', status: 'read' },
      { id: 3, from: 'them', text: "I'd suggest booking me now and we can put a tentative date around your due date, then adjust once baby arrives.", time: 'May 10 · 4:31 PM', status: 'read' },
      { id: 4, from: 'me', text: "Thanks Priya, I'll confirm the date by end of week.", time: 'May 11 · 9:15 AM', status: 'read' },
    ],
  },
]

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

function StatusDot({ status }: { status: ConvStatus }) {
  const color = status === 'online' ? 'bg-emerald-400' : status === 'away' ? 'bg-amber-400' : 'bg-ink-200'
  return <span className={`w-2.5 h-2.5 rounded-full border-2 border-white ${color} flex-shrink-0`} />
}

function Tick({ status }: { status: MessageStatus }) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-emerald-500" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-ink-300" />
  return <Check className="w-3 h-3 text-ink-300" />
}

function VoiceNote({ duration, fromMe }: { duration: string; fromMe: boolean }) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl min-w-[160px] ${fromMe ? 'bg-ink text-white' : 'bg-white border border-ink-100'}`}>
      <button type="button" onClick={() => setPlaying(!playing)}
        className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${fromMe ? 'bg-white/20 hover:bg-white/30' : 'bg-ink hover:bg-ink-800'}`}>
        {playing
          ? <span className={`w-2.5 h-2.5 rounded-sm ${fromMe ? 'bg-white' : 'bg-white'}`} />
          : <span className={`ml-0.5 border-l-[10px] border-y-[6px] border-y-transparent ${fromMe ? 'border-l-white' : 'border-l-white'}`} />
        }
      </button>
      <div className="flex items-center gap-0.5 flex-1">
        {[3,5,8,4,7,6,9,4,6,3,5,8,5,3].map((h, i) => (
          <div key={i} className={`w-0.5 rounded-full ${fromMe ? 'bg-white/60' : 'bg-ink-300'}`} style={{ height: h * 2 }} />
        ))}
      </div>
      <span className={`text-[10px] flex-shrink-0 ${fromMe ? 'text-white/70' : 'text-ink-300'}`}>{duration}</span>
      <Mic className={`w-3 h-3 flex-shrink-0 ${fromMe ? 'text-white/60' : 'text-ink-300'}`} />
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
    setTimeout(() => {
      onSubmit(reason, note, alsoBlock)
    }, 1200)
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
              <button onClick={onClose} className="text-ink-300 hover:text-ink transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2.5">Why are you reporting this conversation?</p>
                <div className="space-y-2">
                  {SPAM_REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all ${
                        reason === r
                          ? 'border-red-400 bg-red-50 text-red-700 font-medium'
                          : 'border-ink-100 text-ink-500 hover:border-ink-200 hover:bg-ink-50'
                      }`}
                    >
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
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Describe what happened…"
                  className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all resize-none"
                />
              </div>

              {/* Also block toggle */}
              <button
                onClick={() => setAlsoBlock(v => !v)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${
                  alsoBlock ? 'border-ink bg-ink-50' : 'border-ink-100 hover:bg-ink-50'
                }`}
              >
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
              <button
                onClick={submit}
                disabled={!reason}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40"
              >
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

function BlockModal({
  name, onConfirm, onClose,
}: {
  name: string
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ban className="w-6 h-6 text-ink-400" />
        </div>
        <p className="font-semibold text-ink text-base text-center mb-2">Block {name}?</p>
        <p className="text-ink-400 text-sm text-center leading-relaxed mb-5">
          They won't be able to send you new messages. You can unblock them at any time from this conversation.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onConfirm} className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors">
            Block
          </button>
          <button onClick={onClose} className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Conversation menu ────────────────────────────────────────────────────────

function ConvMenu({
  name, moderation, onBlock, onUnblock, onReport, onClose,
}: {
  name: string
  moderation: ConvModerationState
  onBlock: () => void
  onUnblock: () => void
  onReport: () => void
  onClose: () => void
}) {
  const isBlocked = moderation === 'blocked' || moderation === 'reported_and_blocked'

  return (
    <div
      className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl border border-ink-100 z-30 overflow-hidden py-1"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}
    >
      <Link
        href={`/photographers/${name.toLowerCase().replace(' ', '-')}`}
        onClick={onClose}
        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-500 hover:bg-ink-50 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" /> View profile
      </Link>

      <div className="border-t border-ink-50 mt-1 pt-1">
        {isBlocked ? (
          <button
            onClick={onUnblock}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors text-left"
          >
            <Ban className="w-3.5 h-3.5" /> Unblock {name.split(' ')[0]}
          </button>
        ) : (
          <button
            onClick={onBlock}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-500 hover:bg-ink-50 transition-colors text-left"
          >
            <Ban className="w-3.5 h-3.5" /> Block {name.split(' ')[0]}
          </button>
        )}

        <button
          onClick={onReport}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
        >
          <Flag className="w-3.5 h-3.5" /> Report as spam
        </button>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [activeSlug, setActiveSlug] = useState('sarah-chen')
  const [conversations, setConversations] = useState(CONVERSATIONS)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [recording, setRecording] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  // Modals
  const [showMenu, setShowMenu] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)

  // Rate limit toast
  const [rateLimitHit, setRateLimitHit] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollPaneRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const active = conversations.find((c) => c.slug === activeSlug)!
  const isBlocked = active.moderation === 'blocked' || active.moderation === 'reported_and_blocked'
  const isReported = active.moderation === 'reported' || active.moderation === 'reported_and_blocked'
  const atRateLimit = active.hourlyMessageCount >= MAX_MESSAGES_PER_HOUR
  const charsLeft = MAX_MESSAGE_LENGTH - input.length
  const nearLimit = charsLeft <= 100

  // Unread cap: only show MAX_UNREAD_SHOWN conversations with unread
  const filteredConvs = conversations
    .filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.specialty.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .slice(0, MAX_UNREAD_SHOWN)

  useEffect(() => {
    if (scrollPaneRef.current) {
      scrollPaneRef.current.scrollTop = scrollPaneRef.current.scrollHeight
    }
  }, [activeSlug, active?.messages.length])

  // Close menu on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showMenu])

  function selectConv(slug: string) {
    setActiveSlug(slug)
    setMobileView('thread')
    setShowMenu(false)
    setConversations((prev) =>
      prev.map((c) => (c.slug === slug ? { ...c, unread: 0 } : c))
    )
  }

  function sendMessage() {
    const text = input.trim()
    if (!text || isBlocked) return

    if (atRateLimit) {
      setRateLimitHit(true)
      setTimeout(() => setRateLimitHit(false), 3000)
      return
    }

    setConversations((prev) =>
      prev.map((c) =>
        c.slug === activeSlug
          ? {
              ...c,
              lastMessage: text,
              lastTime: 'now',
              hourlyMessageCount: c.hourlyMessageCount + 1,
              messages: [
                ...c.messages,
                { id: Date.now(), from: 'me', text, time: 'now', status: 'sent' },
              ],
            }
          : c
      )
    )
    setInput('')
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function appendEmoji(emoji: string) {
    if (input.length < MAX_MESSAGE_LENGTH) {
      setInput((prev) => prev + emoji)
    }
    inputRef.current?.focus()
  }

  // ── Block / Unblock ──────────────────────────────────────────────────────────

  function confirmBlock() {
    setConversations(prev => prev.map(c =>
      c.slug === activeSlug
        ? { ...c, moderation: c.moderation === 'reported' ? 'reported_and_blocked' : 'blocked' }
        : c
    ))
    setShowBlockModal(false)
    setShowMenu(false)
  }

  function confirmUnblock() {
    setConversations(prev => prev.map(c =>
      c.slug === activeSlug
        ? { ...c, moderation: c.moderation === 'reported_and_blocked' ? 'reported' : 'normal' }
        : c
    ))
    setShowMenu(false)
  }

  // ── Report ───────────────────────────────────────────────────────────────────

  function submitReport(_reason: SpamReason, _note: string, alsoBlock: boolean) {
    setConversations(prev => prev.map(c =>
      c.slug === activeSlug
        ? {
            ...c,
            moderation: alsoBlock
              ? 'reported_and_blocked'
              : 'reported',
          }
        : c
    ))
    // In production: POST /api/reports with reason, note, conversationId
    setTimeout(() => setShowReportModal(false), 800)
  }

  const totalUnread = conversations.reduce((a, c) => a + c.unread, 0)

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">

      {/* Modals */}
      {showBlockModal && (
        <BlockModal
          name={active.name}
          onConfirm={confirmBlock}
          onClose={() => setShowBlockModal(false)}
        />
      )}
      {showReportModal && (
        <ReportModal
          name={active.name}
          onSubmit={submitReport}
          onClose={() => setShowReportModal(false)}
        />
      )}

      {/* ── Top nav ───────────────────────────────────────────────── */}
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

      {/* ── Main split ────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Conversation list ──────────────────────────────────── */}
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
            {filteredConvs.map((c) => {
              const convBlocked = c.moderation === 'blocked' || c.moderation === 'reported_and_blocked'
              const convReported = c.moderation === 'reported' || c.moderation === 'reported_and_blocked'
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => selectConv(c.slug)}
                  className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-ink-50 text-left transition-colors ${
                    activeSlug === c.slug ? 'bg-ink-50' : 'hover:bg-ink-50/60'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {c.avatar ? (
                      <div className={`w-11 h-11 rounded-xl overflow-hidden ${convBlocked ? 'opacity-50 grayscale' : ''}`}>
                        <Image src={c.avatar} alt={c.name} width={44} height={44} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className={`w-11 h-11 rounded-xl bg-ink flex items-center justify-center text-white text-xs font-bold ${convBlocked ? 'opacity-40' : ''}`}>
                        {c.initials}
                      </div>
                    )}
                    {!convBlocked && (
                      <div className="absolute -bottom-0.5 -right-0.5">
                        <StatusDot status={c.status} />
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
                      <p className={`text-sm leading-tight truncate ${c.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'} ${convBlocked ? 'text-ink-400' : ''}`}>
                        {c.name}
                      </p>
                      <p className="text-[10px] text-ink-200 flex-shrink-0 ml-2">{c.lastTime}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <p className="text-ink-300 text-[10px]">{c.specialty}</p>
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

        {/* ── Thread view ───────────────────────────────────────────── */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-ink-50/30 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>

          {/* Thread header */}
          <div className="bg-white border-b border-ink-100 px-4 sm:px-5 py-3 flex items-center gap-3 flex-shrink-0">
            <button type="button" onClick={() => setMobileView('list')} className="sm:hidden text-ink-400 hover:text-ink transition-colors mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative flex-shrink-0">
              {active.avatar ? (
                <div className={`w-9 h-9 rounded-xl overflow-hidden ${isBlocked ? 'opacity-50 grayscale' : ''}`}>
                  <Image src={active.avatar} alt={active.name} width={36} height={36} className="object-cover w-full h-full" />
                </div>
              ) : (
                <div className={`w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-white text-[11px] font-bold ${isBlocked ? 'opacity-40' : ''}`}>
                  {active.initials}
                </div>
              )}
              {!isBlocked && (
                <div className="absolute -bottom-0.5 -right-0.5">
                  <StatusDot status={active.status} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink text-sm">{active.name}</p>
                {isBlocked && <span className="text-[10px] font-semibold bg-ink-100 text-ink-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Ban className="w-2.5 h-2.5" /> Blocked</span>}
                {isReported && !isBlocked && <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Flag className="w-2.5 h-2.5" /> Reported</span>}
              </div>
              <p className={`text-[10px] ${active.status === 'online' && !isBlocked ? 'text-emerald-500 font-medium' : 'text-ink-300'}`}>
                {isBlocked ? 'Messaging blocked' : active.lastSeen}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 text-xs text-ink-400 border border-ink-100 px-2.5 py-1.5 rounded-lg">
                <Star className="w-3 h-3 fill-ink text-ink" />
                {active.rating}
              </div>
              {/* 3-dot menu */}
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
                    onBlock={() => { setShowMenu(false); setShowBlockModal(true) }}
                    onUnblock={() => { confirmUnblock(); setShowMenu(false) }}
                    onReport={() => { setShowMenu(false); setShowReportModal(true) }}
                    onClose={() => setShowMenu(false)}
                  />
                )}
              </div>
            </div>
          </div>

          {/* ── Blocked banner ─────────────────────────────────────── */}
          {isBlocked && (
            <div className="bg-ink-50 border-b border-ink-100 px-5 py-3 flex items-center gap-3">
              <Ban className="w-4 h-4 text-ink-400 flex-shrink-0" />
              <p className="text-xs text-ink-500 flex-1">
                You've blocked <span className="font-semibold">{active.name}</span>. They can't send you new messages.
              </p>
              <button
                onClick={confirmUnblock}
                className="text-xs font-semibold text-ink border border-ink-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors flex-shrink-0"
              >
                Unblock
              </button>
            </div>
          )}

          {/* ── Reported banner ────────────────────────────────────── */}
          {isReported && (
            <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center gap-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <p className="text-xs text-amber-700 flex-1">
                You've reported this conversation. Our team is reviewing it.
              </p>
            </div>
          )}

          {/* ── Rate limit toast ───────────────────────────────────── */}
          {rateLimitHit && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 bg-ink text-white text-xs font-medium px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg">
              <Clock className="w-3.5 h-3.5" />
              Message limit reached ({MAX_MESSAGES_PER_HOUR}/hr). Try again shortly.
            </div>
          )}

          {/* Messages */}
          <div ref={scrollPaneRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-1">
            {active.messages.map((msg, i) => {
              const fromMe = msg.from === 'me'
              const isLastInGroup = active.messages[i + 1]?.from !== msg.from

              return (
                <div key={msg.id} className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'} ${i > 0 && active.messages[i-1].from === msg.from ? 'mt-0.5' : 'mt-4'}`}>
                  {!fromMe && (
                    <div className="w-7 h-7 flex-shrink-0 mb-1">
                      {isLastInGroup && (
                        active.avatar ? (
                          <div className="w-7 h-7 rounded-lg overflow-hidden">
                            <Image src={active.avatar} alt={active.name} width={28} height={28} className="object-cover" />
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
                    {msg.voice ? (
                      <VoiceNote duration={msg.voice.duration} fromMe={fromMe} />
                    ) : msg.image ? (
                      <div className="rounded-2xl overflow-hidden" style={{ maxWidth: 240 }}>
                        <Image src={msg.image} alt="attachment" width={240} height={160} className="object-cover" />
                      </div>
                    ) : (
                      <div
                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative ${
                          fromMe ? 'bg-ink text-white rounded-br-sm' : 'bg-white text-ink border border-ink-100 rounded-bl-sm'
                        }`}
                        style={{ boxShadow: fromMe ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}
                      >
                        {msg.text}
                        {msg.reaction && (
                          <span className="absolute -bottom-3 -right-1 text-sm bg-white border border-ink-100 rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                            {msg.reaction}
                          </span>
                        )}
                      </div>
                    )}

                    {isLastInGroup && (
                      <div className={`flex items-center gap-1 mt-1.5 ${fromMe ? 'flex-row-reverse' : ''}`}>
                        <span className="text-[10px] text-ink-200">{msg.time}</span>
                        {fromMe && <Tick status={msg.status} />}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* ── Composer ──────────────────────────────────────────── */}
          <div className="bg-white border-t border-ink-100 px-4 sm:px-5 py-3 flex-shrink-0">

            {isBlocked ? (
              /* Blocked state — no composer */
              <div className="flex items-center justify-center gap-2 py-2">
                <Ban className="w-4 h-4 text-ink-300" />
                <p className="text-sm text-ink-300">Messaging is blocked for this conversation</p>
                <button onClick={confirmUnblock} className="text-xs font-semibold text-ink underline underline-offset-2 hover:no-underline transition-all ml-1">
                  Unblock
                </button>
              </div>
            ) : (
              <>
                {/* Rate limit warning bar */}
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

                <div className="flex items-end gap-2.5">
                  <button type="button"
                    className="w-9 h-9 rounded-xl border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors flex-shrink-0 mb-0.5"
                    title="Attach file">
                    <Paperclip className="w-4 h-4 text-ink-400" />
                  </button>

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
                        {/* Char counter — only near limit */}
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

                  {input.trim() ? (
                    <button type="button" onClick={sendMessage} disabled={atRateLimit}
                      className="w-9 h-9 rounded-xl bg-ink hover:bg-ink-800 flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 disabled:opacity-40 disabled:cursor-not-allowed">
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  ) : (
                    <button type="button"
                      onMouseDown={() => setRecording(true)}
                      onMouseUp={() => setRecording(false)}
                      onMouseLeave={() => setRecording(false)}
                      className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 mb-0.5 ${
                        recording ? 'bg-ink border-ink scale-110' : 'border-ink-100 hover:bg-ink-50'
                      }`}>
                      <Mic className={`w-4 h-4 transition-colors ${recording ? 'text-white' : 'text-ink-400'}`} />
                    </button>
                  )}
                </div>

                {recording && (
                  <div className="flex items-center gap-2 mt-2 px-1">
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs text-ink-400">Hold to record · Release to send</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
