'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import {
  Search, Send, Smile, ArrowLeft, CheckCheck, Check, MoreVertical,
  ExternalLink, Star, Calendar, Clock, X, Paperclip, Mic,
} from 'lucide-react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'

const MAX_MESSAGE_LENGTH = PLATFORM_CONFIG.max_message_length

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageStatus = 'sent' | 'delivered' | 'read'
type ConvStatus = 'online' | 'away' | 'offline'

interface Msg {
  id: number
  from: 'me' | 'them'
  text: string
  time: string
  status: MessageStatus
  reaction?: string
}

interface Conversation {
  slug: string
  name: string
  initials: string
  bg: string
  role: string
  avatar: string
  status: ConvStatus
  lastSeen: string
  lastMessage: string
  lastTime: string
  unread: number
  bookedDate?: string
  messages: Msg[]
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED: Conversation[] = [
  {
    slug: 'emily-r',
    name: 'Emily R.',
    initials: 'ER',
    bg: 'bg-slate-500',
    role: 'Client · Wedding enquiry',
    avatar: '',
    status: 'online',
    lastSeen: 'Active now',
    lastMessage: "We're thinking the Fairmont Hotel Macdonald. It's an outdoor ceremony.",
    lastTime: '45m ago',
    unread: 2,
    bookedDate: 'May 24, 2026',
    messages: [
      { id: 1, from: 'them', text: "Hi! I'm looking for a wedding photographer for June 14th. Do you have availability?", time: '10:14 AM', status: 'read' },
      { id: 2, from: 'me', text: "Hi Emily! June 14th looks open for me. What venue are you considering?", time: '10:22 AM', status: 'read' },
      { id: 3, from: 'them', text: "We're thinking the Fairmont Hotel Macdonald. It's an outdoor ceremony.", time: '10:45 AM', status: 'delivered' },
    ],
  },
  {
    slug: 'james-k',
    name: 'James K.',
    initials: 'JK',
    bg: 'bg-zinc-600',
    role: 'Client · Corporate',
    avatar: '',
    status: 'away',
    lastSeen: 'Last seen 1h ago',
    lastMessage: 'Do you do corporate headshots? Our team of 8 needs updated photos.',
    lastTime: '5h ago',
    unread: 1,
    messages: [
      { id: 1, from: 'them', text: 'Do you do corporate headshots? Our team of 8 needs updated photos for our website.', time: '9:00 AM', status: 'read' },
      { id: 2, from: 'me', text: 'Absolutely — corporate headshots are one of my specialties. For a team of 8, I typically block 2–3 hours. Would you like a quote?', time: '9:30 AM', status: 'read' },
      { id: 3, from: 'them', text: 'Yes please! What does your package include?', time: '9:45 AM', status: 'delivered' },
    ],
  },
  {
    slug: 'priya-s',
    name: 'Priya S.',
    initials: 'PS',
    bg: 'bg-neutral-500',
    role: 'Client · Family',
    avatar: '',
    status: 'offline',
    lastSeen: 'Last seen yesterday',
    lastMessage: "Loved your portfolio! Would you be available for a family shoot in August?",
    lastTime: 'Yesterday',
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: "Loved your portfolio! Would you be available for a family shoot in August?", time: 'Yesterday 2:00 PM', status: 'read' },
      { id: 2, from: 'me', text: "Thank you so much! August works great — I have weekends available. What area do you have in mind?", time: 'Yesterday 3:15 PM', status: 'read' },
      { id: 3, from: 'them', text: "We were thinking the river valley. Family of 5 including a toddler!", time: 'Yesterday 4:00 PM', status: 'read' },
      { id: 4, from: 'me', text: "Perfect — river valley light in August is beautiful. I usually suggest 7:00 AM for golden hour so toddlers are still fresh! Want me to send a booking link?", time: 'Yesterday 4:30 PM', status: 'read' },
    ],
  },
  {
    slug: 'lena-t',
    name: 'Lena T.',
    initials: 'LT',
    bg: 'bg-rose-500',
    role: 'Client · Newborn',
    avatar: '',
    status: 'offline',
    lastSeen: 'Last seen 3 days ago',
    lastMessage: "You: Sorry — already booked that slot. Please check my other times!",
    lastTime: '3 days ago',
    unread: 0,
    messages: [
      { id: 1, from: 'them', text: "Hi! Baby is 2 weeks old now — are you available this weekend for a newborn session?", time: 'May 14 · 10:00 AM', status: 'read' },
      { id: 2, from: 'me', text: "Congratulations! Unfortunately this weekend is already booked. I have Tuesday May 19th open at 9 AM — does that work?", time: 'May 14 · 11:00 AM', status: 'read' },
      { id: 3, from: 'them', text: "Tuesday works! How long does a newborn session usually take?", time: 'May 14 · 11:30 AM', status: 'read' },
      { id: 4, from: 'me', text: "Usually 2–3 hours — we go at baby's pace. I'll send a prep guide before the session. Looking forward to it!", time: 'May 14 · 12:00 PM', status: 'read' },
    ],
  },
]

const EMOJIS = ['😊','😄','😍','🥰','😂','🙏','👍','❤️','🎉','🔥','✨','📸','💍','🌸','😎','🤝','💯','🙌','😮','😢']

// ─── Helpers ──────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: ConvStatus }) {
  const color = status === 'online' ? 'bg-emerald-400' : status === 'away' ? 'bg-amber-400' : 'bg-ink-200'
  return <span className={`w-2.5 h-2.5 rounded-full border-2 border-white ${color} flex-shrink-0`} />
}

function Tick({ status }: { status: MessageStatus }) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-emerald-500" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-ink-300" />
  return <Check className="w-3 h-3 text-ink-300" />
}

function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  return (
    <div
      className="absolute bottom-full mb-2 left-0 bg-white rounded-2xl p-3 grid grid-cols-5 gap-1.5 z-20"
      style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 24px rgba(0,0,0,0.12)', width: 196 }}
    >
      {EMOJIS.map(e => (
        <button key={e} type="button" onClick={() => onPick(e)}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-ink-50 rounded-lg transition-colors">
          {e}
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhotographerMessagesPage() {
  const [conversations, setConversations] = useState(SEED)
  const [activeSlug, setActiveSlug] = useState('emily-r')
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [recording, setRecording] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const active = conversations.find(c => c.slug === activeSlug)!
  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const totalUnread = conversations.reduce((a, c) => a + c.unread, 0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [activeSlug, active?.messages.length])

  function selectConv(slug: string) {
    setActiveSlug(slug)
    setMobileView('thread')
    setConversations(prev => prev.map(c => c.slug === slug ? { ...c, unread: 0 } : c))
  }

  function sendMessage() {
    const text = input.trim()
    if (!text || text.length > MAX_MESSAGE_LENGTH) return
    setConversations(prev => prev.map(c =>
      c.slug === activeSlug
        ? { ...c, lastMessage: text, lastTime: 'now', messages: [...c.messages, { id: Date.now(), from: 'me', text, time: 'now', status: 'sent' }] }
        : c
    ))
    setInput('')
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Nav */}
      <div className="bg-white border-b border-ink-100 flex-shrink-0 h-14 flex items-center px-4 sm:px-6 gap-4 z-10">
        <Link href="/dashboard/photographer" className="flex items-center gap-2 text-ink-400 hover:text-ink transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="font-semibold text-ink text-sm">Client Messages</span>
          {totalUnread > 0 && (
            <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>
          )}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className={`w-full sm:w-80 lg:w-96 border-r border-ink-100 flex flex-col flex-shrink-0 bg-white ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-ink-50 flex-shrink-0">
            <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
              <input
                type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search clients…"
                className="bg-transparent text-ink text-xs placeholder-ink-300 outline-none flex-1"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {filtered.map(c => (
              <button key={c.slug} type="button" onClick={() => selectConv(c.slug)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-ink-50 text-left transition-colors ${activeSlug === c.slug ? 'bg-ink-50' : 'hover:bg-ink-50/60'}`}
              >
                <div className="relative flex-shrink-0">
                  <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center text-white text-xs font-bold`}>
                    {c.initials}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5">
                    <StatusDot status={c.status} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className={`text-sm leading-tight truncate ${c.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{c.name}</p>
                    <p className="text-[10px] text-ink-200 flex-shrink-0 ml-2">{c.lastTime}</p>
                  </div>
                  <p className="text-ink-300 text-[10px] mb-1">{c.role}</p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-ink-400 text-xs truncate leading-tight">{c.lastMessage}</p>
                    {c.unread > 0 && (
                      <span className="w-4 h-4 bg-ink rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">{c.unread}</span>
                    )}
                  </div>
                  {c.bookedDate && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] text-amber-600 font-medium">Booking: {c.bookedDate}</span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Thread view */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-ink-50/30 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
          {/* Thread header */}
          <div className="bg-white border-b border-ink-100 px-4 sm:px-5 py-3 flex items-center gap-3 flex-shrink-0">
            <button type="button" onClick={() => setMobileView('list')} className="sm:hidden text-ink-400 hover:text-ink mr-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="relative flex-shrink-0">
              <div className={`w-9 h-9 rounded-xl ${active.bg} flex items-center justify-center text-white text-[11px] font-bold`}>
                {active.initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5"><StatusDot status={active.status} /></div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-ink text-sm">{active.name}</p>
                <span className="text-[10px] text-ink-300 bg-ink-50 px-1.5 py-0.5 rounded hidden sm:block">{active.role}</span>
              </div>
              <p className={`text-[10px] ${active.status === 'online' ? 'text-emerald-500 font-medium' : 'text-ink-300'}`}>
                {active.lastSeen}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {active.bookedDate && (
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg">
                  <Calendar className="w-3 h-3" />
                  {active.bookedDate}
                </div>
              )}
              <button className="w-8 h-8 rounded-lg border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors">
                <MoreVertical className="w-4 h-4 text-ink-400" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-1">
            {active.messages.map((msg, i) => {
              const fromMe = msg.from === 'me'
              const isLastInGroup = active.messages[i + 1]?.from !== msg.from
              return (
                <div key={msg.id}
                  className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'} ${i > 0 && active.messages[i - 1].from === msg.from ? 'mt-0.5' : 'mt-4'}`}
                >
                  {!fromMe && (
                    <div className="w-7 h-7 flex-shrink-0 mb-1">
                      {isLastInGroup && (
                        <div className={`w-7 h-7 rounded-lg ${active.bg} flex items-center justify-center text-white text-[9px] font-bold`}>
                          {active.initials}
                        </div>
                      )}
                    </div>
                  )}
                  <div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'} max-w-[72%] sm:max-w-[60%]`}>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative ${
                      fromMe ? 'bg-ink text-white rounded-br-sm' : 'bg-white text-ink border border-ink-100 rounded-bl-sm'
                    }`} style={{ boxShadow: fromMe ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}>
                      {msg.text}
                      {msg.reaction && (
                        <span className="absolute -bottom-3 -right-1 text-sm bg-white border border-ink-100 rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                          {msg.reaction}
                        </span>
                      )}
                    </div>
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

          {/* Composer */}
          <div className="bg-white border-t border-ink-100 px-4 sm:px-5 py-3 flex-shrink-0">
            <div className="flex items-end gap-2.5">
              <button type="button" className="w-9 h-9 rounded-xl border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors flex-shrink-0 mb-0.5">
                <Paperclip className="w-4 h-4 text-ink-400" />
              </button>
              <div className="flex-1 relative">
                {showEmoji && <EmojiPicker onPick={e => { setInput(p => p + e); inputRef.current?.focus() }} />}
                <div className="flex items-end gap-2 border border-ink-100 rounded-2xl px-4 py-2.5 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10 transition-all"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                  <textarea
                    ref={inputRef} rows={1} value={input}
                    onChange={e => {
                      if (e.target.value.length > MAX_MESSAGE_LENGTH) return
                      setInput(e.target.value)
                      e.target.style.height = 'auto'
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
                    }}
                    onKeyDown={handleKey}
                    maxLength={MAX_MESSAGE_LENGTH}
                    placeholder={`Reply to ${active.name}…`}
                    className="flex-1 bg-transparent text-ink text-sm placeholder-ink-300 outline-none resize-none leading-relaxed"
                    style={{ minHeight: 24, maxHeight: 120 }}
                  />
                  <button type="button" onClick={() => setShowEmoji(!showEmoji)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${showEmoji ? 'bg-ink-100 text-ink' : 'text-ink-300 hover:text-ink hover:bg-ink-50'}`}>
                    <Smile className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {input.trim() ? (
                <button type="button" onClick={sendMessage}
                  className="w-9 h-9 rounded-xl bg-ink hover:bg-ink-800 flex items-center justify-center transition-colors flex-shrink-0 mb-0.5">
                  <Send className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button type="button"
                  onMouseDown={() => setRecording(true)}
                  onMouseUp={() => setRecording(false)}
                  onMouseLeave={() => setRecording(false)}
                  className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all flex-shrink-0 mb-0.5 ${recording ? 'bg-ink border-ink scale-110' : 'border-ink-100 hover:bg-ink-50'}`}>
                  <Mic className={`w-4 h-4 ${recording ? 'text-white' : 'text-ink-400'}`} />
                </button>
              )}
            </div>
            {recording && (
              <div className="flex items-center gap-2 mt-2 px-1">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs text-ink-400">Hold to record · Release to send</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
