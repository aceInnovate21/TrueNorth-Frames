'use client'

import Link from 'next/link'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, ArrowLeft, MoreVertical, MessageSquare, Loader2,
  Ban, Flag, AlertTriangle, Lock,
} from 'lucide-react'

import { PLATFORM_CONFIG } from '@/lib/platform-config'
import {
  MessageThread, MessageComposer, ConversationRow, Avatar,
  ConvMenu, BlockModal, ReportModal,
  initialsOf, timeAgo,
  type UIMessage, type ThreadPeer, type SpamReason,
} from '@/components/messaging'

const MAX_MESSAGE_LENGTH    = PLATFORM_CONFIG.max_message_length
const MAX_MESSAGES_PER_HOUR = PLATFORM_CONFIG.max_messages_per_hour
const RATE_WARN             = PLATFORM_CONFIG.rate_limit_warning_threshold
const MAX_SHOWN             = PLATFORM_CONFIG.max_unread_conversations_shown

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiConversation {
  id: string
  photographer_username: string | null
  photographer_display_name: string | null
  photographer_avatar_url: string | null
  last_message_body: string | null
  last_message_at: string | null
  unread_count: number
  blocked: boolean
  reported: boolean
  frozen: boolean
}

interface Conversation {
  id: string
  name: string
  initials: string
  avatarUrl: string | null
  photographerUsername: string | null
  lastMessage: string
  lastTime: string
  lastAt: string | null
  unread: number
  blocked: boolean
  reported: boolean
  frozen: boolean
  hourlyMessageCount: number
  messages: UIMessage[]
  messagesLoaded: boolean
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function ClientMessagesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlConv = searchParams.get('conv')

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)

  const [showMenu, setShowMenu] = useState(false)
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const active = conversations.find(c => c.id === activeId) ?? null
  const isBlocked = active?.blocked ?? false
  const isReported = active?.reported ?? false
  const isFrozen = active?.frozen ?? false
  const atRateLimit = active ? active.hourlyMessageCount >= MAX_MESSAGES_PER_HOUR : false

  // Load conversation list
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/client/conversations')
        if (res.ok) {
          const data: ApiConversation[] = await res.json()
          setConversations(data.map(c => ({
            id: c.id,
            name: c.photographer_display_name ?? 'Photographer',
            initials: initialsOf(c.photographer_display_name ?? 'P'),
            avatarUrl: c.photographer_avatar_url,
            photographerUsername: c.photographer_username,
            lastMessage: c.last_message_body ?? '',
            lastTime: timeAgo(c.last_message_at),
            lastAt: c.last_message_at,
            unread: c.unread_count,
            blocked: c.blocked,
            reported: c.reported,
            frozen: c.frozen,
            hourlyMessageCount: 0,
            messages: [],
            messagesLoaded: false,
          })))
        }
      } catch { /* silent */ }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Sync active conversation with ?conv= (deep link + first-conversation default)
  useEffect(() => {
    if (loading) return
    if (urlConv && conversations.some(c => c.id === urlConv)) {
      if (urlConv !== activeId) {
        setActiveId(urlConv)
        setMobileView('thread')
      }
    } else if (!urlConv && !activeId && conversations.length > 0) {
      setActiveId(conversations[0].id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, urlConv, conversations])

  // Load thread messages when the active conversation changes
  useEffect(() => {
    if (!activeId) return
    const conv = conversations.find(c => c.id === activeId)
    if (conv?.messagesLoaded) return

    fetch(`/api/client/messages/${activeId}`)
      .then(r => (r.ok ? r.json() : []))
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
                  status: 'read' as const,
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

  // Close menu on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    if (showMenu) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [showMenu])

  function selectConv(id: string) {
    setActiveId(id)
    setMobileView('thread')
    setShowMenu(false)
    setConversations(prev => prev.map(c => (c.id === id ? { ...c, unread: 0 } : c)))
    router.replace(`/messages?conv=${id}`, { scroll: false })
  }

  async function sendMessage() {
    const text = input.trim()
    if ((!text && !pendingFile) || isBlocked || isFrozen || !activeId || sending || uploading) return
    if (atRateLimit) return

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
          const up = await upRes.json()
          attachmentUrl = up.url; attachmentType = up.type; attachmentName = up.name; attachmentSize = up.size
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
              id: optimisticId, from: 'me', text, time: new Date().toISOString(), status: 'sent',
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
            ? { ...c, messages: c.messages.map(m => (m.id === optimisticId ? { ...msg, status: 'delivered' as const } : m)) }
            : c
        ))
      } else {
        rollback(optimisticId, text)
      }
    } catch {
      rollback(optimisticId, text)
    } finally {
      setSending(false)
    }
  }

  function rollback(optimisticId: number, text: string) {
    setConversations(prev => prev.map(c =>
      c.id === activeId
        ? { ...c, messages: c.messages.filter(m => m.id !== optimisticId), hourlyMessageCount: Math.max(0, c.hourlyMessageCount - 1) }
        : c
    ))
    setInput(text)
  }

  // ─── Moderation actions (persisted) ─────────────────────────────────────────

  function setActiveFields(fields: Partial<Conversation>) {
    setConversations(prev => prev.map(c => (c.id === activeId ? { ...c, ...fields } : c)))
  }

  async function confirmBlock() {
    if (!activeId) return
    setActiveFields({ blocked: true })
    setShowBlockModal(false)
    setShowMenu(false)
    try {
      await fetch(`/api/client/messages/${activeId}/block`, { method: 'POST' })
    } catch { setActiveFields({ blocked: false }) }
  }

  async function confirmUnblock() {
    if (!activeId) return
    setActiveFields({ blocked: false })
    setShowMenu(false)
    try {
      await fetch(`/api/client/messages/${activeId}/block`, { method: 'DELETE' })
    } catch { setActiveFields({ blocked: true }) }
  }

  async function submitReport(reason: SpamReason, note: string, alsoBlock: boolean) {
    if (!activeId) return
    setActiveFields({ reported: true, blocked: alsoBlock ? true : isBlocked })
    try {
      await fetch(`/api/client/messages/${activeId}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, note, alsoBlock }),
      })
    } catch { /* keep optimistic state; admin queue is best-effort */ }
  }

  // ─── Derived ────────────────────────────────────────────────────────────────

  const filtered = conversations
    .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .slice(0, MAX_SHOWN)
  const totalUnread = conversations.reduce((a, c) => a + c.unread, 0)

  const peer: ThreadPeer | null = active
    ? {
        name: active.name,
        initials: active.initials,
        avatarUrl: active.avatarUrl,
        handle: active.photographerUsername ? `@${active.photographerUsername}` : null,
        profileHref: active.photographerUsername ? `/photographers/${active.photographerUsername}` : null,
      }
    : null

  const composerDisabledNode = isFrozen ? (
    <div className="flex items-center justify-center gap-2 py-2">
      <Lock className="w-4 h-4 text-ink-300" />
      <p className="text-sm text-ink-300">This conversation has been locked by an administrator.</p>
    </div>
  ) : isBlocked ? (
    <div className="flex items-center justify-center gap-2 py-2">
      <Ban className="w-4 h-4 text-ink-300" />
      <p className="text-sm text-ink-300">Messaging is blocked for this conversation</p>
      <button onClick={confirmUnblock} className="text-xs font-semibold text-ink underline underline-offset-2 hover:no-underline transition-all ml-1">
        Unblock
      </button>
    </div>
  ) : undefined

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {showBlockModal && active && <BlockModal name={active.name} onConfirm={confirmBlock} onClose={() => setShowBlockModal(false)} />}
      {showReportModal && active && <ReportModal name={active.name} onSubmit={submitReport} onClose={() => setShowReportModal(false)} />}

      {/* Top nav */}
      <div className="bg-white border-b border-ink-100 flex-shrink-0 h-14 flex items-center px-4 sm:px-6 gap-4 z-10">
        <Link href="/dashboard/client" className="flex items-center gap-2 text-ink-400 hover:text-ink transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="font-semibold text-ink text-sm">Messages</span>
          {totalUnread > 0 && <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
        </div>
        <Link href="/photographers" className="text-xs font-semibold text-ink border border-ink-100 px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors hidden sm:flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5" />
          New conversation
        </Link>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Conversation list */}
        <div className={`w-full sm:w-80 lg:w-96 border-r border-ink-100 flex flex-col flex-shrink-0 bg-white ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-ink-50 flex-shrink-0">
            <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2">
              <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations…"
                className="bg-transparent text-ink text-xs placeholder-ink-300 outline-none flex-1"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-ink-300" /></div>
            )}
            {!loading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <MessageSquare className="w-8 h-8 text-ink-200 mb-3" />
                <p className="text-sm font-medium text-ink-400">No conversations yet</p>
                <p className="text-xs text-ink-300 mt-1">Book a photographer to start chatting</p>
              </div>
            )}
            {filtered.map(c => (
              <ConversationRow
                key={c.id}
                name={c.name}
                initials={c.initials}
                avatarUrl={c.avatarUrl}
                lastMsg={c.lastMessage}
                lastTime={c.lastTime}
                unread={c.unread}
                active={activeId === c.id}
                blocked={c.blocked}
                reported={c.reported}
                onClick={() => selectConv(c.id)}
              />
            ))}
            {conversations.length > MAX_SHOWN && (
              <div className="px-4 py-3 text-center">
                <p className="text-xs text-ink-300">Showing {MAX_SHOWN} of {conversations.length} conversations</p>
              </div>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-ink-50/30 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
          {!active || !peer ? (
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
                <Avatar avatarUrl={peer.avatarUrl} initials={peer.initials} size={36} dimmed={isBlocked} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink text-sm">{peer.name}</p>
                    {isBlocked && <span className="text-[10px] font-semibold bg-ink-100 text-ink-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Ban className="w-2.5 h-2.5" /> Blocked</span>}
                    {isReported && !isBlocked && <span className="text-[10px] font-semibold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1"><Flag className="w-2.5 h-2.5" /> Reported</span>}
                  </div>
                  {peer.handle && <p className="text-[10px] text-ink-300">{peer.handle}</p>}
                </div>
                <div className="relative" ref={menuRef}>
                  <button onClick={() => setShowMenu(v => !v)} className="w-8 h-8 rounded-lg border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors">
                    <MoreVertical className="w-4 h-4 text-ink-400" />
                  </button>
                  {showMenu && (
                    <ConvMenu
                      name={peer.name}
                      isBlocked={isBlocked}
                      profileHref={peer.profileHref}
                      onBlock={() => { setShowMenu(false); setShowBlockModal(true) }}
                      onUnblock={() => { confirmUnblock() }}
                      onReport={() => { setShowMenu(false); setShowReportModal(true) }}
                      onClose={() => setShowMenu(false)}
                    />
                  )}
                </div>
              </div>

              {/* Moderation banners */}
              {isBlocked && (
                <div className="bg-ink-50 border-b border-ink-100 px-5 py-3 flex items-center gap-3">
                  <Ban className="w-4 h-4 text-ink-400 flex-shrink-0" />
                  <p className="text-xs text-ink-500 flex-1">You&apos;ve blocked <span className="font-semibold">{peer.name}</span>. They can&apos;t send you new messages.</p>
                  <button onClick={confirmUnblock} className="text-xs font-semibold text-ink border border-ink-200 px-3 py-1.5 rounded-lg hover:bg-white transition-colors flex-shrink-0">Unblock</button>
                </div>
              )}
              {isReported && (
                <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center gap-2.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <p className="text-xs text-amber-700 flex-1">You&apos;ve reported this conversation. Our team is reviewing it.</p>
                </div>
              )}

              <MessageThread messages={active.messages} peer={peer} loading={!active.messagesLoaded} />

              <MessageComposer
                value={input}
                onChange={setInput}
                onSend={sendMessage}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder={`Message ${peer.name}…`}
                sending={sending}
                uploading={uploading}
                showEmoji={showEmoji}
                onToggleEmoji={setShowEmoji}
                pendingFile={pendingFile}
                onPickFile={setPendingFile}
                onRemoveFile={() => setPendingFile(null)}
                rateRemaining={active ? MAX_MESSAGES_PER_HOUR - active.hourlyMessageCount : undefined}
                rateWarnThreshold={RATE_WARN}
                atRateLimit={atRateLimit}
                disabledNode={composerDisabledNode}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ClientMessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-ink-300" /></div>}>
      <ClientMessagesInner />
    </Suspense>
  )
}
