'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Send, Smile, Paperclip, Mic, MoreVertical,
  ExternalLink, Star, CheckCheck, Check, X,
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
  specialty: string
  avatar: string
  status: ConvStatus
  lastSeen: string
  rating: number
  rate: string
  messages: Msg[]
}

// ─── Seed data (same slugs as /messages and client dashboard) ─────────────────

const CONVERSATIONS: Record<string, Conversation> = {
  'sarah-chen': {
    slug: 'sarah-chen',
    name: 'Sarah Chen',
    initials: 'SC',
    specialty: 'Wedding · Portrait',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fit=crop&crop=face',
    status: 'online',
    lastSeen: 'Active now',
    rating: 4.9,
    rate: '$200/session',
    messages: [
      { id: 1, from: 'me', text: "Hi Sarah! I came across your profile on TrueNorth Frames and I love your work. We're looking for a wedding photographer for September 2026.", time: '10:14 AM', status: 'read' },
      { id: 2, from: 'them', text: "Hi Alex! Thank you so much — that really means a lot. Congratulations on your upcoming wedding! 🎉", time: '10:22 AM', status: 'read' },
      { id: 3, from: 'them', text: "September is actually one of my favourite months to shoot — the light is incredible here in Edmonton. Do you have a specific date in mind?", time: '10:22 AM', status: 'read' },
      { id: 4, from: 'me', text: "We're thinking September 13th. It's at the Fairmont Macdonald downtown.", time: '10:45 AM', status: 'read' },
      { id: 5, from: 'them', text: "Oh I love the Fairmont — shot there twice last year. The staircase is stunning for portraits.", time: '11:01 AM', status: 'read', reaction: '❤️' },
      { id: 6, from: 'them', text: "Let me check my calendar… yes, September 13th is available! I'd love to set up a quick 20-minute call to learn more about your vision.", time: '11:02 AM', status: 'read' },
      { id: 7, from: 'me', text: "That sounds perfect! Would Thursday afternoon work for you?", time: '2:30 PM', status: 'read' },
      { id: 8, from: 'them', text: "Thursday works great. How about 3 PM? I'll send a calendar invite.", time: '2:41 PM', status: 'read' },
      { id: 9, from: 'them', text: "Also — I have availability in September — shall we hop on a quick call to discuss packages too?", time: '2:41 PM', status: 'delivered' },
    ],
  },
  'marcus-wright': {
    slug: 'marcus-wright',
    name: 'Marcus Wright',
    initials: 'MW',
    specialty: 'Corporate · Events',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fit=crop&crop=face',
    status: 'away',
    lastSeen: 'Last seen 1h ago',
    rating: 4.7,
    rate: '$150/hr',
    messages: [
      { id: 1, from: 'me', text: "Hi Marcus, we're organizing our annual company conference in November and need a photographer for the full day. Do you do day-rate packages?", time: 'Yesterday 9:00 AM', status: 'read' },
      { id: 2, from: 'them', text: "Hi! Yes absolutely — corporate events are my bread and butter. My full-day rate is $1,200 and includes edited hi-res images delivered within 5 business days.", time: 'Yesterday 9:45 AM', status: 'read' },
      { id: 3, from: 'me', text: "That sounds reasonable. What does the package include exactly?", time: 'Yesterday 10:02 AM', status: 'read' },
      { id: 4, from: 'them', text: "Happy to send over a full package breakdown.", time: 'Yesterday 10:15 AM', status: 'delivered' },
    ],
  },
  'priya-patel': {
    slug: 'priya-patel',
    name: 'Priya Patel',
    initials: 'PP',
    specialty: 'Newborn · Family',
    avatar: '',
    status: 'offline',
    lastSeen: 'Last seen 3 days ago',
    rating: 4.8,
    rate: '$175/session',
    messages: [
      { id: 1, from: 'me', text: "Hi Priya! We're expecting our first baby in July and would love newborn photos. When do you typically schedule sessions?", time: 'May 10 · 3:00 PM', status: 'read' },
      { id: 2, from: 'them', text: "Congratulations!! 🥰 I schedule newborn sessions between 5–14 days after birth — that's the sweet spot when babies are sleepiest and most poseable.", time: 'May 10 · 4:30 PM', status: 'read' },
      { id: 3, from: 'them', text: "I'd suggest booking me now and we can put a tentative date around your due date, then adjust once baby arrives.", time: 'May 10 · 4:31 PM', status: 'read' },
      { id: 4, from: 'me', text: "Thanks Priya, I'll confirm the date by end of week.", time: 'May 11 · 9:15 AM', status: 'read' },
    ],
  },
}

const FALLBACK: Conversation = {
  slug: 'unknown',
  name: 'Photographer',
  initials: 'P',
  specialty: 'Photography',
  avatar: '',
  status: 'offline',
  lastSeen: 'Last seen recently',
  rating: 5.0,
  rate: 'Contact for pricing',
  messages: [],
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMOJIS = ['😊','😄','😍','🥰','😂','🙏','👍','❤️','🎉','🔥','✨','📸','💍','🌸','😎','🤝','💯','🙌','😮','😢']

function StatusDot({ status }: { status: ConvStatus }) {
  const color = status === 'online' ? 'bg-emerald-400' : status === 'away' ? 'bg-amber-400' : 'bg-ink-200'
  return <span className={`w-2.5 h-2.5 rounded-full border-2 border-white ${color} flex-shrink-0`} />
}

function Tick({ status }: { status: MessageStatus }) {
  if (status === 'read') return <CheckCheck className="w-3 h-3 text-emerald-500" />
  if (status === 'delivered') return <CheckCheck className="w-3 h-3 text-ink-300" />
  return <Check className="w-3 h-3 text-ink-300" />
}

function EmojiPicker({ onPick, onClose }: { onPick: (e: string) => void; onClose: () => void }) {
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

export default function ThreadPage() {
  const params = useParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const conv = CONVERSATIONS[slug] ?? FALLBACK

  const [messages, setMessages] = useState<Msg[]>(conv.messages)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [recording, setRecording] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  function sendMessage() {
    const text = input.trim()
    if (!text || text.length > MAX_MESSAGE_LENGTH) return
    setMessages(prev => [...prev, { id: Date.now(), from: 'me', text, time: 'now', status: 'sent' }])
    setInput('')
    setShowEmoji(false)
    inputRef.current?.focus()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 flex-shrink-0 px-4 sm:px-5 py-3 flex items-center gap-3">
        <Link href="/messages" className="text-ink-400 hover:text-ink transition-colors mr-1 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="relative flex-shrink-0">
          {conv.avatar ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image src={conv.avatar} alt={conv.name} width={40} height={40} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white text-xs font-bold">
              {conv.initials}
            </div>
          )}
          <div className="absolute -bottom-0.5 -right-0.5"><StatusDot status={conv.status} /></div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink text-sm">{conv.name}</p>
            <span className="text-[10px] text-ink-300 bg-ink-50 px-1.5 py-0.5 rounded hidden sm:block">{conv.specialty}</span>
          </div>
          <p className={`text-[10px] ${conv.status === 'online' ? 'text-emerald-500 font-medium' : 'text-ink-300'}`}>
            {conv.lastSeen}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/photographers/${conv.slug}`}
            className="hidden sm:flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink border border-ink-100 px-2.5 py-1.5 rounded-lg transition-colors">
            <ExternalLink className="w-3 h-3" /> Profile
          </Link>
          <div className="hidden sm:flex items-center gap-1 text-xs text-ink-400 border border-ink-100 px-2.5 py-1.5 rounded-lg">
            <Star className="w-3 h-3 fill-ink text-ink" />
            {conv.rating}
          </div>
          <button className="w-8 h-8 rounded-lg border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors">
            <MoreVertical className="w-4 h-4 text-ink-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 bg-ink-50/30 space-y-1">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center mb-4">
              {conv.avatar ? (
                <Image src={conv.avatar} alt={conv.name} width={56} height={56} className="rounded-2xl object-cover" />
              ) : (
                <span className="text-ink-300 font-bold text-lg">{conv.initials}</span>
              )}
            </div>
            <p className="font-semibold text-ink text-sm mb-1">Start a conversation with {conv.name}</p>
            <p className="text-ink-300 text-xs max-w-xs leading-relaxed">
              Ask about availability, packages, or anything about their work. They typically reply {conv.rate.includes('session') ? 'within a few hours' : 'quickly'}.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const fromMe = msg.from === 'me'
          const isLastInGroup = messages[i + 1]?.from !== msg.from
          return (
            <div key={msg.id}
              className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'} ${i > 0 && messages[i - 1].from === msg.from ? 'mt-0.5' : 'mt-4'}`}>
              {!fromMe && (
                <div className="w-7 h-7 flex-shrink-0 mb-1">
                  {isLastInGroup && (
                    conv.avatar ? (
                      <div className="w-7 h-7 rounded-lg overflow-hidden">
                        <Image src={conv.avatar} alt={conv.name} width={28} height={28} className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center text-white text-[9px] font-bold">
                        {conv.initials}
                      </div>
                    )
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
          <button type="button"
            className="w-9 h-9 rounded-xl border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors flex-shrink-0 mb-0.5">
            <Paperclip className="w-4 h-4 text-ink-400" />
          </button>

          <div className="flex-1 relative">
            {showEmoji && (
              <EmojiPicker
                onPick={e => { setInput(p => p + e); setShowEmoji(false); inputRef.current?.focus() }}
                onClose={() => setShowEmoji(false)}
              />
            )}
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
                placeholder={`Message ${conv.name}…`}
                className="flex-1 bg-transparent text-ink text-sm placeholder-ink-300 outline-none resize-none leading-relaxed"
                style={{ minHeight: 24, maxHeight: 120 }}
              />
              <button type="button" onClick={() => setShowEmoji(v => !v)}
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
  )
}
