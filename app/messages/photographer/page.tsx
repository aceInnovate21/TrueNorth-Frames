'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search, Send, Smile, ArrowLeft, CheckCheck, Check, MoreVertical,
  X, Paperclip, Users, MessageSquare, Plus, UserPlus, Loader2,
} from 'lucide-react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { AttachmentBubble, AttachmentPreview } from '@/components/message-attachment'

const MAX_MESSAGE_LENGTH = PLATFORM_CONFIG.max_message_length

// ─── Types ────────────────────────────────────────────────────────────────────

type ThreadKind = 'client' | 'group'

interface ClientConv {
  kind: 'client'
  id: string
  clientId: string
  clientName: string
  clientInitials: string
  clientAvatarUrl: string | null
  lastMessage: string
  lastMessageAt: string
  unread: number
  isFrozen: boolean
}

interface GroupConv {
  kind: 'group'
  id: string
  name: string
  emoji: string
  memberIds: string[]
  messages: GroupMsg[]
  unread: number
  lastActivityAt: string | null
  isCoverGroup: boolean
  isRemoved: boolean
  isLeft: boolean
  isDm: boolean
}

interface ClientMsg {
  id: string
  from: 'me' | 'them'
  text: string
  time: string
  isSystem?: boolean
  attachmentUrl: string | null
  attachmentType: string | null
  attachmentName: string | null
  attachmentSize: number | null
}

interface GroupMsg {
  id: number
  senderId: string
  senderName: string
  senderInitials: string
  senderBg: string
  text: string
  time: string
  isSystem: boolean
  attachmentUrl: string | null
  attachmentType: string | null
  attachmentName: string | null
  attachmentSize: number | null
}

interface Connection {
  id: string
  name: string
  initials: string
  bg: string
  area: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BG_PALETTE = [
  'bg-slate-600', 'bg-violet-600', 'bg-emerald-600',
  'bg-rose-500', 'bg-amber-600', 'bg-sky-600', 'bg-teal-600', 'bg-indigo-600',
]
function avatarBg(id: string): string {
  const code = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return BG_PALETTE[code % BG_PALETTE.length]
}
function initials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}
function relTime(iso: string | null): string {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

const EMOJIS = ['😊','😄','😍','🥰','😂','🙏','👍','❤️','🎉','🔥','✨','📸','💍','🌸','😎','🤝','💯','🙌','😮','😢']

function EmojiPicker({ onPick }: { onPick: (e: string) => void }) {
  return (
    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-2xl p-3 grid grid-cols-5 gap-1.5 z-20"
      style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08),0 8px 24px rgba(0,0,0,0.12)', width: 196 }}>
      {EMOJIS.map(e => (
        <button key={e} type="button" onClick={() => onPick(e)}
          className="w-8 h-8 flex items-center justify-center text-lg hover:bg-ink-50 rounded-lg transition-colors">
          {e}
        </button>
      ))}
    </div>
  )
}

// ─── Contact picker modal ─────────────────────────────────────────────────────

function NewMessageModal({
  connections, starting,
  onStart, onClose,
}: {
  connections: Connection[]
  starting: string | null
  onStart: (id: string) => void
  onClose: () => void
}) {
  const [q, setQ] = useState('')
  const filtered = connections.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
        style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06),0 24px 48px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-ink-100">
          <p className="font-semibold text-ink text-sm">New message</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-ink-50 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-ink-50">
          <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
            <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)}
              placeholder="Search connections…"
              className="bg-transparent text-ink text-xs placeholder-ink-300 outline-none flex-1" />
          </div>
        </div>
        <div className="overflow-y-auto max-h-72">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 text-ink-200 mx-auto mb-2" />
              <p className="text-xs text-ink-400">
                {connections.length === 0 ? 'No connections yet' : 'No matches found'}
              </p>
            </div>
          ) : filtered.map(c => (
            <button key={c.id} type="button" onClick={() => onStart(c.id)}
              disabled={starting === c.id}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors text-left disabled:opacity-60">
              <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink truncate">{c.name}</p>
                {c.area && <p className="text-[10px] text-ink-300 truncate">{c.area}</p>}
              </div>
              {starting === c.id
                ? <span className="w-4 h-4 border-2 border-ink-300 border-t-ink rounded-full animate-spin flex-shrink-0" />
                : <MessageSquare className="w-4 h-4 text-ink-300 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Conversation row ─────────────────────────────────────────────────────────

function ConvRow({
  name, sub, initials: inits, bg, lastMsg, lastTime, unread, active, onClick,
}: {
  name: string; sub: string; initials: string; bg: string
  lastMsg: string; lastTime: string; unread: number; active: boolean; onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3.5 border-b border-ink-50 text-left transition-colors ${active ? 'bg-ink-50' : 'hover:bg-ink-50/60'}`}>
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
        {inits}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className={`text-sm leading-tight truncate ${unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{name}</p>
          <p className="text-[10px] text-ink-200 flex-shrink-0 ml-2">{lastTime}</p>
        </div>
        <p className="text-ink-300 text-[10px] mb-1">{sub}</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-ink-400 text-xs truncate leading-tight">{lastMsg || 'No messages yet'}</p>
          {unread > 0 && (
            <span className="w-4 h-4 bg-ink rounded-full text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0">{unread}</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

function PhotographerMessagesInner() {
  const searchParams = useSearchParams()
  const deepLinkConvId = searchParams.get('conv')

  // Raw data
  const [clientConvs, setClientConvs] = useState<ClientConv[]>([])
  const [groups, setGroups] = useState<GroupConv[]>([])
  const [connections, setConnections] = useState<Connection[]>([])

  // Thread state
  const [activeKind, setActiveKind] = useState<ThreadKind | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [clientThread, setClientThread] = useState<ClientMsg[]>([])
  const [loadingThread, setLoadingThread] = useState(false)

  // UI
  const [input, setInput] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [startingDm, setStartingDm] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load conversation list + connections
  useEffect(() => {
    async function load() {
      setLoadingList(true)
      const [convRes, grpRes, connRes] = await Promise.all([
        fetch('/api/photographer/messages').then(r => r.ok ? r.json() : []),
        fetch('/api/photographer/groups').then(r => r.ok ? r.json() : { groups: [] }),
        fetch('/api/photographer/connections').then(r => r.ok ? r.json() : { connected: [] }),
      ])

      setClientConvs(
        (convRes as any[]).map(c => ({ ...c, kind: 'client' as const }))
      )
      setGroups(
        ((grpRes.groups ?? []) as any[]).map((g: any) => ({
          kind: 'group' as const,
          id: g.id,
          name: g.name,
          emoji: g.emoji ?? '👥',
          memberIds: g.memberIds ?? [],
          messages: g.messages ?? [],
          unread: g.unread ?? 0,
          lastActivityAt: g.lastActivityAt ?? null,
          isCoverGroup: g.isCoverGroup ?? false,
          isRemoved: g.isRemoved ?? false,
          isLeft: g.isLeft ?? false,
          isDm: g.isDm ?? false,
        }))
      )
      setConnections(
        ((connRes.connected ?? []) as any[]).map((c: any) => ({
          id: c.id,
          name: c.name,
          initials: c.initials ?? initials(c.name),
          bg: c.bg ?? avatarBg(c.id),
          area: c.area ?? '',
        }))
      )
      setLoadingList(false)
    }
    load()
  }, [])

  // Scroll to bottom on thread change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [clientThread, activeId])

  // Sort each section by recency independently — section order is fixed: Clients → Groups
  const sortedClients = [...clientConvs].sort((a, b) =>
    (a.lastMessageAt > b.lastMessageAt ? -1 : 1)
  )
  const sortedGroups = [...groups].sort((a, b) => {
    const ta = a.lastActivityAt ?? ''
    const tb = b.lastActivityAt ?? ''
    return ta > tb ? -1 : 1
  })

  const allConvs: Array<ClientConv | GroupConv> = [...sortedClients, ...sortedGroups]

  const filtered = allConvs.filter(c => {
    const name = c.kind === 'client' ? c.clientName : c.name
    return name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  const totalUnread = allConvs.reduce((n, c) => n + (c.unread ?? 0), 0)

  // Active thread data
  const activeGroup = activeKind === 'group' ? groups.find(g => g.id === activeId) : null
  const activeClientConv = activeKind === 'client' ? clientConvs.find(c => c.id === activeId) : null

  const activeThreadName = activeKind === 'client'
    ? (activeClientConv?.clientName ?? '')
    : (activeGroup?.name ?? '')
  const activeThreadInitials = activeKind === 'client'
    ? (activeClientConv?.clientInitials ?? '')
    : initials(activeGroup?.name ?? '')
  const activeThreadBg = activeKind === 'client'
    ? avatarBg(activeClientConv?.clientId ?? '')
    : avatarBg(activeId ?? '')
  const activeThreadSub = activeKind === 'client' ? 'Client' : (activeGroup?.isDm ? 'Connection · Direct message' : 'Group')

  // Open a client conversation
  const openClientConv = useCallback(async (id: string) => {
    setActiveId(id)
    setActiveKind('client')
    setMobileView('thread')
    setClientThread([])
    setLoadingThread(true)
    const res = await fetch(`/api/photographer/messages/${id}`)
    if (res.ok) setClientThread(await res.json())
    setLoadingThread(false)
    // Mark as read locally
    setClientConvs(prev => prev.map(c => c.id === id ? { ...c, unread: 0 } : c))
  }, [])

  // Open a group conversation
  const openGroupConv = useCallback((id: string) => {
    setActiveId(id)
    setActiveKind('group')
    setMobileView('thread')
    // Mark group as read
    fetch('/api/photographer/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: id }),
    })
    setGroups(prev => prev.map(g => g.id === id ? { ...g, unread: 0 } : g))
  }, [])

  // Auto-open conversation from ?conv= URL param once data is loaded
  useEffect(() => {
    if (!deepLinkConvId || loadingList) return
    const clientMatch = clientConvs.find(c => c.id === deepLinkConvId)
    if (clientMatch) { openClientConv(deepLinkConvId); return }
    const groupMatch = groups.find(g => g.id === deepLinkConvId)
    if (groupMatch) openGroupConv(deepLinkConvId)
  }, [deepLinkConvId, loadingList, clientConvs, groups, openClientConv, openGroupConv])

  const charsLeft = MAX_MESSAGE_LENGTH - input.length
  const nearLimit = charsLeft <= 100

  // Send message
  async function sendMessage() {
    const text = input.trim()
    if ((!text && !pendingFile) || text.length > MAX_MESSAGE_LENGTH || sending || uploading) return
    setSending(true)
    setInput('')
    setShowEmoji(false)

    if (activeKind === 'client' && activeId) {
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
          const upRes = await fetch('/api/photographer/messages/upload', { method: 'POST', body: fd })
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

      const optimistic: ClientMsg = {
        id: `opt-${Date.now()}`,
        from: 'me',
        text,
        time: new Date().toISOString(),
        attachmentUrl, attachmentType, attachmentName, attachmentSize,
      }
      setClientThread(prev => [...prev, optimistic])
      const res = await fetch(`/api/photographer/messages/${activeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, attachment_url: attachmentUrl, attachment_type: attachmentType, attachment_name: attachmentName, attachment_size: attachmentSize }),
      })
      if (res.ok) {
        const msg = await res.json()
        setClientThread(prev => prev.map(m => m.id === optimistic.id ? msg : m))
        setClientConvs(prev => prev.map(c => c.id === activeId ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() } : c))
      }
    } else if (activeKind === 'group' && activeId) {
      let attachmentUrl: string | null = null
      let attachmentType: string | null = null
      let attachmentName: string | null = null
      let attachmentSize: number | null = null

      if (pendingFile) {
        setUploading(true)
        try {
          const fd = new FormData()
          fd.append('file', pendingFile)
          fd.append('group_id', activeId)
          const upRes = await fetch('/api/photographer/groups/messages/upload', { method: 'POST', body: fd })
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

      const tempId = -Date.now()
      const optimisticGroup: GroupMsg = {
        id: tempId,
        senderId: 'me',
        senderName: 'You',
        senderInitials: '?',
        senderBg: 'bg-ink',
        text,
        time: new Date().toISOString(),
        isSystem: false,
        attachmentUrl, attachmentType, attachmentName, attachmentSize,
      }
      setGroups(prev => prev.map(g => g.id === activeId
        ? { ...g, messages: [...g.messages, optimisticGroup], lastActivityAt: new Date().toISOString() }
        : g
      ))

      const res = await fetch('/api/photographer/groups/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: activeId, body: text, attachment_url: attachmentUrl, attachment_type: attachmentType, attachment_name: attachmentName, attachment_size: attachmentSize }),
      })

      if (res.ok) {
        const msg = await res.json()
        setGroups(prev => prev.map(g => g.id === activeId
          ? { ...g, messages: g.messages.map(m => m.id === tempId ? { ...optimisticGroup, id: msg.id, time: msg.created_at } : m) }
          : g
        ))
      } else {
        // Rollback optimistic message on failure
        setGroups(prev => prev.map(g => g.id === activeId
          ? { ...g, messages: g.messages.filter(m => m.id !== tempId) }
          : g
        ))
      }
    }

    setSending(false)
    inputRef.current?.focus()
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  // Start a new DM with a connection
  async function startDm(connectionId: string) {
    setStartingDm(connectionId)
    const res = await fetch('/api/photographer/connections/dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connection_photographer_id: connectionId }),
    })
    if (res.ok) {
      const { group_id } = await res.json()
      setShowNewMsg(false)
      // Refresh groups list to include newly created DM
      const grpRes = await fetch('/api/photographer/groups')
      if (grpRes.ok) {
        const data = await grpRes.json()
        setGroups(
          ((data.groups ?? []) as any[]).map((g: any) => ({
            kind: 'group' as const,
            id: g.id,
            name: g.name,
            emoji: g.emoji ?? '👥',
            memberIds: g.memberIds ?? [],
            messages: g.messages ?? [],
            unread: g.unread ?? 0,
            lastActivityAt: g.lastActivityAt ?? null,
            isCoverGroup: g.isCoverGroup ?? false,
            isRemoved: g.isRemoved ?? false,
            isLeft: g.isLeft ?? false,
            isDm: g.isDm ?? false,
          }))
        )
      }
      openGroupConv(group_id)
    }
    setStartingDm(null)
  }

  const hasActiveThread = activeId !== null

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      {/* Nav */}
      <div className="bg-white border-b border-ink-100 flex-shrink-0 h-14 flex items-center px-4 sm:px-6 gap-4 z-10">
        <Link href="/dashboard/photographer"
          className="flex items-center gap-2 text-ink-400 hover:text-ink transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="font-semibold text-ink text-sm">Messages</span>
          {totalUnread > 0 && (
            <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>
          )}
        </div>
        {/* New message button — visible in nav on mobile when showing list */}
        <button
          type="button"
          onClick={() => setShowNewMsg(true)}
          className="sm:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-ink hover:bg-ink-800 transition-colors"
          title="New message">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — conversation list */}
        <div className={`w-full sm:w-80 lg:w-96 border-r border-ink-100 flex flex-col flex-shrink-0 bg-white ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>
          {/* Search + New message button */}
          <div className="px-4 py-3 border-b border-ink-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2 flex-1">
                <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
                <input
                  type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search conversations…"
                  className="bg-transparent text-ink text-xs placeholder-ink-300 outline-none flex-1"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNewMsg(true)}
                className="w-9 h-9 rounded-xl bg-ink hover:bg-ink-800 transition-colors flex items-center justify-center flex-shrink-0"
                title="Start a new conversation">
                <UserPlus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          {/* Section labels */}
          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <span className="w-6 h-6 border-2 border-ink-200 border-t-ink rounded-full animate-spin" />
                <p className="text-xs text-ink-400">Loading conversations…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center px-6">
                <MessageSquare className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-ink-400 mb-1">
                  {searchQuery ? 'No matches found' : 'No messages yet'}
                </p>
                {!searchQuery && (
                  <p className="text-xs text-ink-300">
                    Clients will appear here when they message you.
                    You can also start a conversation with a connection.
                  </p>
                )}
              </div>
            ) : (
              <>
                {/* Client conversations */}
                {filtered.filter(c => c.kind === 'client').length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">
                      Clients
                    </p>
                    {filtered.filter(c => c.kind === 'client').map(c => {
                      const cc = c as ClientConv
                      return (
                        <ConvRow
                          key={cc.id}
                          name={cc.clientName}
                          sub="Client"
                          initials={cc.clientInitials || initials(cc.clientName)}
                          bg={avatarBg(cc.clientId)}
                          lastMsg={cc.lastMessage}
                          lastTime={relTime(cc.lastMessageAt)}
                          unread={cc.unread}
                          active={activeId === cc.id}
                          onClick={() => openClientConv(cc.id)}
                        />
                      )
                    })}
                  </>
                )}

                {/* Group / DM conversations */}
                {filtered.filter(c => c.kind === 'group').length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">
                      Connections &amp; Groups
                    </p>
                    {filtered.filter(c => c.kind === 'group').map(c => {
                      const gc = c as GroupConv
                      const lastGroupMsg = gc.messages[gc.messages.length - 1]
                      return (
                        <ConvRow
                          key={gc.id}
                          name={gc.name}
                          sub={gc.isDm ? 'Direct message' : `Group · ${gc.memberIds.length} members`}
                          initials={gc.isDm ? initials(gc.name) : gc.emoji}
                          bg={gc.isDm ? avatarBg(gc.id) : 'bg-violet-600'}
                          lastMsg={lastGroupMsg ? (lastGroupMsg.senderId === 'me' ? `You: ${lastGroupMsg.text}` : lastGroupMsg.text) : ''}
                          lastTime={relTime(gc.lastActivityAt)}
                          unread={gc.unread}
                          active={activeId === gc.id}
                          onClick={() => openGroupConv(gc.id)}
                        />
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right panel — thread */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-ink-50/30 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
          {!hasActiveThread ? (
            // Empty state on desktop
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-ink-50 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-ink-200" />
              </div>
              <p className="font-semibold text-ink">Select a conversation</p>
              <p className="text-sm text-ink-400 max-w-xs">
                Choose a conversation from the left, or start a new direct message with one of your connections.
              </p>
              <button
                type="button"
                onClick={() => setShowNewMsg(true)}
                className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-ink hover:bg-ink-800 text-white text-sm font-semibold rounded-xl transition-colors">
                <UserPlus className="w-4 h-4" />
                Message a connection
              </button>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="bg-white border-b border-ink-100 px-4 sm:px-5 py-3 flex items-center gap-3 flex-shrink-0">
                <button type="button" onClick={() => setMobileView('list')} className="sm:hidden text-ink-400 hover:text-ink mr-1">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className={`w-9 h-9 rounded-xl ${activeThreadBg} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0`}>
                  {activeThreadInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink text-sm">{activeThreadName}</p>
                  <p className="text-[10px] text-ink-300">{activeThreadSub}</p>
                </div>
                <button className="w-8 h-8 rounded-lg border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors flex-shrink-0">
                  <MoreVertical className="w-4 h-4 text-ink-400" />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-1">
                {loadingThread ? (
                  <div className="flex justify-center pt-10">
                    <span className="w-5 h-5 border-2 border-ink-200 border-t-ink rounded-full animate-spin" />
                  </div>
                ) : activeKind === 'client' ? (
                  clientThread.length === 0 ? (
                    <p className="text-center text-xs text-ink-300 pt-8">No messages yet</p>
                  ) : clientThread.map((msg, i) => {
                    if (msg.isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center py-2 mt-4">
                          <span className="text-[11px] text-ink-400 bg-ink-50 border border-ink-100 px-3 py-1.5 rounded-full text-center max-w-xs">
                            {msg.text}
                          </span>
                        </div>
                      )
                    }
                    const fromMe = msg.from === 'me'
                    const isLastInGroup = clientThread[i + 1]?.from !== msg.from && !clientThread[i + 1]?.isSystem
                    return (
                      <div key={msg.id}
                        className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'} ${i > 0 && clientThread[i - 1].from === msg.from && !clientThread[i - 1].isSystem ? 'mt-0.5' : 'mt-4'}`}>
                        {!fromMe && (
                          <div className="w-7 h-7 flex-shrink-0 mb-1">
                            {isLastInGroup && (
                              <div className={`w-7 h-7 rounded-lg ${activeThreadBg} flex items-center justify-center text-white text-[9px] font-bold`}>
                                {activeThreadInitials}
                              </div>
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
                              <span className="text-[10px] text-ink-200">{relTime(msg.time)}</span>
                              {fromMe && <CheckCheck className="w-3 h-3 text-ink-300" />}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  // Group messages
                  (activeGroup?.messages ?? []).length === 0 ? (
                    <p className="text-center text-xs text-ink-300 pt-8">No messages yet — say hello!</p>
                  ) : (activeGroup?.messages ?? []).map((msg, i) => {
                    const fromMe = msg.senderId === 'me'
                    if (msg.isSystem) {
                      return (
                        <div key={msg.id} className="flex justify-center py-2">
                          <span className="text-[10px] text-ink-300 bg-ink-50 px-3 py-1 rounded-full">{msg.text}</span>
                        </div>
                      )
                    }
                    const msgs = activeGroup?.messages ?? []
                    const isLastInGroup = msgs[i + 1]?.senderId !== msg.senderId
                    return (
                      <div key={msg.id}
                        className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'} ${i > 0 && msgs[i - 1].senderId === msg.senderId ? 'mt-0.5' : 'mt-4'}`}>
                        {!fromMe && (
                          <div className="w-7 h-7 flex-shrink-0 mb-1">
                            {isLastInGroup && (
                              <div className={`w-7 h-7 rounded-lg ${msg.senderBg} flex items-center justify-center text-white text-[9px] font-bold`}>
                                {msg.senderInitials}
                              </div>
                            )}
                          </div>
                        )}
                        <div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'} max-w-[72%] sm:max-w-[60%]`}>
                          {!fromMe && i > 0 && msgs[i - 1].senderId !== msg.senderId && (
                            <p className="text-[10px] text-ink-400 mb-0.5 px-1">{msg.senderName}</p>
                          )}
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
                              <span className="text-[10px] text-ink-200">{relTime(msg.time) || msg.time}</span>
                              {fromMe && <CheckCheck className="w-3 h-3 text-ink-300" />}
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
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
                        placeholder={`Message ${activeThreadName}…`}
                        className="flex-1 bg-transparent text-ink text-sm placeholder-ink-300 outline-none resize-none leading-relaxed"
                        style={{ minHeight: 24, maxHeight: 120 }}
                      />
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {nearLimit && (
                          <span className={`text-[10px] font-medium tabular-nums ${charsLeft <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                            {charsLeft}
                          </span>
                        )}
                        <button type="button" onClick={() => setShowEmoji(v => !v)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${showEmoji ? 'bg-ink-100 text-ink' : 'text-ink-300 hover:text-ink hover:bg-ink-50'}`}>
                          <Smile className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={sendMessage} disabled={(!input.trim() && !pendingFile) || sending || uploading}
                    className="w-9 h-9 rounded-xl bg-ink hover:bg-ink-800 flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 disabled:opacity-30">
                    {(sending || uploading)
                      ? <Loader2 className="w-4 h-4 text-white animate-spin" />
                      : <Send className="w-4 h-4 text-white" />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New message modal */}
      {showNewMsg && (
        <NewMessageModal
          connections={connections}
          starting={startingDm}
          onStart={startDm}
          onClose={() => setShowNewMsg(false)}
        />
      )}
    </div>
  )
}

export default function PhotographerMessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><div className="w-6 h-6 border-2 border-ink-200 border-t-ink rounded-full animate-spin" /></div>}>
      <PhotographerMessagesInner />
    </Suspense>
  )
}
