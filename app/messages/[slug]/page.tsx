'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft, Send, Smile, Paperclip, MoreVertical,
  ExternalLink, CheckCheck, Check, Calendar, Loader2,
} from 'lucide-react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { AttachmentBubble, AttachmentPreview } from '@/components/message-attachment'

const MAX_MESSAGE_LENGTH = PLATFORM_CONFIG.max_message_length

// ─── Types ────────────────────────────────────────────────────────────────────

type MessageStatus = 'sent' | 'delivered' | 'read'

interface Msg {
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

interface ConvMeta {
  id: string
  photographer_username: string | null
  photographer_display_name: string | null
  photographer_avatar_url: string | null
  unread_count: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMOJIS = ['😊','😄','😍','🥰','😂','🙏','👍','❤️','🎉','🔥','✨','📸','💍','🌸','😎','🤝','💯','🙌','😮','😢']

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
      <button type="button" onClick={onClose} className="col-span-5 text-xs text-ink-300 mt-1 hover:text-ink">Close</button>
    </div>
  )
}

// ─── Booking card bubble ──────────────────────────────────────────────────────

function BookingBubble({ text }: { text: string }) {
  // Parse: "📅 Booking request · {date} · {timeSlot}[\n\n{description}]"
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThreadPage() {
  const params = useParams()
  // params.slug is actually the conversation UUID
  const conversationId = typeof params.slug === 'string' ? params.slug : ''

  const [conv, setConv] = useState<ConvMeta | null>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [loading, setLoading] = useState(true)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
const [sending, setSending] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadThread = useCallback(async () => {
    if (!conversationId) return
    try {
      const [msgsRes, convsRes] = await Promise.all([
        fetch(`/api/client/messages/${conversationId}`),
        fetch('/api/client/conversations'),
      ])
      if (msgsRes.ok) {
        const data = await msgsRes.json()
        setMessages(
          (data as any[]).map((m: any) => ({
            id: m.id,
            from: m.from,
            text: m.text,
            time: m.time,
            status: 'read' as MessageStatus,
            isSystem: m.isSystem ?? false,
            attachmentUrl: m.attachmentUrl ?? null,
            attachmentType: m.attachmentType ?? null,
            attachmentName: m.attachmentName ?? null,
            attachmentSize: m.attachmentSize ?? null,
          }))
        )
      }
      if (convsRes.ok) {
        const convs: ConvMeta[] = await convsRes.json()
        const found = convs.find((c: ConvMeta) => c.id === conversationId)
        if (found) setConv(found)
      }
    } catch { /* silent */ }
    finally { setLoading(false) }
  }, [conversationId])

  useEffect(() => {
    loadThread()
  }, [loadThread])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function sendMessage() {
    const text = input.trim()
    if ((!text && !pendingFile) || text.length > MAX_MESSAGE_LENGTH || sending || uploading) return
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
        fd.append('conversation_id', conversationId)
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
    setMessages(prev => [...prev, {
      id: optimisticId, from: 'me', text, time: new Date().toISOString(), status: 'sent',
      attachmentUrl, attachmentType, attachmentName, attachmentSize,
    }])

    try {
      const res = await fetch(`/api/client/messages/${conversationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, attachment_url: attachmentUrl, attachment_type: attachmentType, attachment_name: attachmentName, attachment_size: attachmentSize }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => prev.map(m => m.id === optimisticId ? { ...msg, status: 'delivered' as MessageStatus } : m))
      } else {
        // Remove optimistic on failure
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        setInput(text)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setInput(text)
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const photographerName = conv?.photographer_display_name ?? 'Photographer'
  const photographerUsername = conv?.photographer_username ?? null
  const avatarUrl = conv?.photographer_avatar_url ?? null
  const initials = photographerName
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase())
    .slice(0, 2)
    .join('')

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-ink-100 flex-shrink-0 px-4 sm:px-5 py-3 flex items-center gap-3">
        <Link href="/messages" className="text-ink-400 hover:text-ink transition-colors mr-1 flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden">
              <Image src={avatarUrl} alt={photographerName} width={40} height={40} className="object-cover w-full h-full" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-ink text-sm">{photographerName}</p>
          </div>
          {photographerUsername && (
            <p className="text-[10px] text-ink-300">@{photographerUsername}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {photographerUsername && (
            <Link href={`/photographers/${photographerUsername}`}
              className="hidden sm:flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink border border-ink-100 px-2.5 py-1.5 rounded-lg transition-colors">
              <ExternalLink className="w-3 h-3" /> Profile
            </Link>
          )}
          <button className="w-8 h-8 rounded-lg border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors">
            <MoreVertical className="w-4 h-4 text-ink-400" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 bg-ink-50/30 space-y-1">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center mb-4">
              {avatarUrl ? (
                <Image src={avatarUrl} alt={photographerName} width={56} height={56} className="rounded-2xl object-cover" />
              ) : (
                <span className="text-ink-300 font-bold text-lg">{initials}</span>
              )}
            </div>
            <p className="font-semibold text-ink text-sm mb-1">Start a conversation with {photographerName}</p>
            <p className="text-ink-300 text-xs max-w-xs leading-relaxed">
              Ask about availability, packages, or anything about their work.
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          const fromMe = msg.from === 'me'
          const isLastInGroup = messages[i + 1]?.from !== msg.from

          // Booking card bubble
          if (msg.isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-3">
                <BookingBubble text={msg.text} />
              </div>
            )
          }

          return (
            <div key={msg.id}
              className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'} ${i > 0 && messages[i - 1].from === msg.from ? 'mt-0.5' : 'mt-4'}`}>
              {!fromMe && (
                <div className="w-7 h-7 flex-shrink-0 mb-1">
                  {isLastInGroup && (
                    avatarUrl ? (
                      <div className="w-7 h-7 rounded-lg overflow-hidden">
                        <Image src={avatarUrl} alt={photographerName} width={28} height={28} className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-ink flex items-center justify-center text-white text-[9px] font-bold">
                        {initials}
                      </div>
                    )
                  )}
                </div>
              )}

              <div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'} max-w-[72%] sm:max-w-[60%]`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  fromMe ? 'bg-ink text-white rounded-br-sm' : 'bg-white text-ink border border-ink-100 rounded-bl-sm'
                }`} style={{ boxShadow: fromMe ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}>
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
                    <span className="text-[10px] text-ink-200">
                      {(() => {
                        try {
                          return new Date(msg.time).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
                        } catch { return msg.time }
                      })()}
                    </span>
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
                placeholder={`Message ${photographerName}…`}
                className="flex-1 bg-transparent text-ink text-sm placeholder-ink-300 outline-none resize-none leading-relaxed"
                style={{ minHeight: 24, maxHeight: 120 }}
              />
              <button type="button" onClick={() => setShowEmoji(v => !v)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${showEmoji ? 'bg-ink-100 text-ink' : 'text-ink-300 hover:text-ink hover:bg-ink-50'}`}>
                <Smile className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button type="button" onClick={sendMessage} disabled={(!input.trim() && !pendingFile) || sending || uploading}
            className="w-9 h-9 rounded-xl bg-ink hover:bg-ink-800 flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 disabled:opacity-30 disabled:cursor-not-allowed">
            {(sending || uploading) ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>
    </div>
  )
}
