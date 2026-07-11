'use client'

import Link from 'next/link'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search, ArrowLeft, MoreVertical, X, Users, MessageSquare,
  Plus, UserPlus, Loader2, Ban,
} from 'lucide-react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import { uploadMessageAttachment } from '@/lib/message-attachment-upload'
import {
  MessageThread, MessageComposer, ConversationRow, Avatar,
  initialsOf, avatarBg, timeAgo,
  type UIMessage, type ThreadPeer,
} from '@/components/messaging'

const MAX_MESSAGE_LENGTH = PLATFORM_CONFIG.max_message_length

// ─── Types ──────────────────────────────────────────────────────────────────────

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
  blockedByClient: boolean
}

interface GroupMsg {
  id: number | string
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
  id: string | number
  from: 'me' | 'them'
  text: string
  time: string
  isSystem?: boolean
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

// ─── Contact picker modal ───────────────────────────────────────────────────────

function NewMessageModal({
  connections, starting, onStart, onClose,
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
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06),0 24px 48px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-ink-100">
          <p className="font-semibold text-ink text-sm">New message</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-ink-50 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>
        <div className="px-4 py-3 border-b border-ink-50">
          <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2">
            <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
            <input autoFocus type="text" value={q} onChange={e => setQ(e.target.value)} placeholder="Search connections…" className="bg-transparent text-ink text-xs placeholder-ink-300 outline-none flex-1" />
          </div>
        </div>
        <div className="overflow-y-auto max-h-72">
          {filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="w-8 h-8 text-ink-200 mx-auto mb-2" />
              <p className="text-xs text-ink-400">{connections.length === 0 ? 'No connections yet' : 'No matches found'}</p>
            </div>
          ) : filtered.map(c => (
            <button key={c.id} type="button" onClick={() => onStart(c.id)} disabled={starting === c.id}
              className="w-full flex items-center gap-3 px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors text-left disabled:opacity-60">
              <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{c.initials}</div>
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

// ─── Page ───────────────────────────────────────────────────────────────────────

function PhotographerMessagesInner() {
  const searchParams = useSearchParams()
  const deepLinkConvId = searchParams.get('conv')

  const [clientConvs, setClientConvs] = useState<ClientConv[]>([])
  const [groups, setGroups] = useState<GroupConv[]>([])
  const [connections, setConnections] = useState<Connection[]>([])

  const [activeKind, setActiveKind] = useState<ThreadKind | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [clientThread, setClientThread] = useState<ClientMsg[]>([])
  const [loadingThread, setLoadingThread] = useState(false)

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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const uploadAbortRef = useRef<AbortController | null>(null)

  // Load list + connections
  useEffect(() => {
    async function load() {
      setLoadingList(true)
      const [convRes, grpRes, connRes] = await Promise.all([
        fetch('/api/photographer/messages').then(r => (r.ok ? r.json() : [])),
        fetch('/api/photographer/groups').then(r => (r.ok ? r.json() : { groups: [] })),
        fetch('/api/photographer/connections').then(r => (r.ok ? r.json() : { connected: [] })),
      ])
      setClientConvs((convRes as any[]).map(c => ({ ...c, kind: 'client' as const, blockedByClient: c.blockedByClient ?? false })))
      setGroups(((grpRes.groups ?? []) as any[]).map((g: any) => ({
        kind: 'group' as const,
        id: g.id, name: g.name, emoji: g.emoji ?? '👥', memberIds: g.memberIds ?? [],
        messages: g.messages ?? [], unread: g.unread ?? 0, lastActivityAt: g.lastActivityAt ?? null,
        isCoverGroup: g.isCoverGroup ?? false, isRemoved: g.isRemoved ?? false, isLeft: g.isLeft ?? false, isDm: g.isDm ?? false,
      })))
      setConnections(((connRes.connected ?? []) as any[]).map((c: any) => ({
        id: c.id, name: c.name, initials: c.initials ?? initialsOf(c.name), bg: c.bg ?? avatarBg(c.id), area: c.area ?? '',
      })))
      setLoadingList(false)
    }
    load()
  }, [])

  const sortedClients = [...clientConvs].sort((a, b) => (a.lastMessageAt > b.lastMessageAt ? -1 : 1))
  const sortedGroups = [...groups].sort((a, b) => ((a.lastActivityAt ?? '') > (b.lastActivityAt ?? '') ? -1 : 1))
  const allConvs: Array<ClientConv | GroupConv> = [...sortedClients, ...sortedGroups]
  const filtered = allConvs.filter(c => (c.kind === 'client' ? c.clientName : c.name).toLowerCase().includes(searchQuery.toLowerCase()))
  const totalUnread = allConvs.reduce((n, c) => n + (c.unread ?? 0), 0)

  const activeGroup = activeKind === 'group' ? groups.find(g => g.id === activeId) : null
  const activeClientConv = activeKind === 'client' ? clientConvs.find(c => c.id === activeId) : null

  const openClientConv = useCallback(async (id: string) => {
    setActiveId(id); setActiveKind('client'); setMobileView('thread'); setClientThread([]); setLoadingThread(true)
    const res = await fetch(`/api/photographer/messages/${id}`)
    if (res.ok) setClientThread(await res.json())
    setLoadingThread(false)
    setClientConvs(prev => prev.map(c => (c.id === id ? { ...c, unread: 0 } : c)))
  }, [])

  const openGroupConv = useCallback((id: string) => {
    setActiveId(id); setActiveKind('group'); setMobileView('thread')
    fetch('/api/photographer/groups', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ group_id: id }),
    })
    setGroups(prev => prev.map(g => (g.id === id ? { ...g, unread: 0 } : g)))
  }, [])

  // Auto-open from ?conv=
  useEffect(() => {
    if (!deepLinkConvId || loadingList) return
    if (clientConvs.some(c => c.id === deepLinkConvId)) { openClientConv(deepLinkConvId); return }
    if (groups.some(g => g.id === deepLinkConvId)) openGroupConv(deepLinkConvId)
  }, [deepLinkConvId, loadingList, clientConvs, groups, openClientConv, openGroupConv])

  const blockedByClient = activeClientConv?.blockedByClient ?? false
  const frozen = activeClientConv?.isFrozen ?? false

  async function sendMessage() {
    const text = input.trim()
    if ((!text && !pendingFile) || text.length > MAX_MESSAGE_LENGTH || sending || uploading) return
    if (activeKind === 'client' && (blockedByClient || frozen)) return
    setSending(true); setShowEmoji(false)

    let attachmentKey: string | null = null, attachmentType: string | null = null, attachmentName: string | null = null, attachmentSize: number | null = null, attachmentPreview: string | null = null

    if (pendingFile && activeId) {
      setUploading(true); setUploadProgress(0)
      const controller = new AbortController(); uploadAbortRef.current = controller
      const target = activeKind === 'group'
        ? { type: 'group' as const, id: activeId }
        : { type: 'conversation' as const, id: activeId }
      try {
        const up = await uploadMessageAttachment(pendingFile, target, { onProgress: setUploadProgress, signal: controller.signal })
        attachmentKey = up.key; attachmentType = up.type; attachmentName = up.name; attachmentSize = up.size
        if (up.type === 'image') attachmentPreview = URL.createObjectURL(pendingFile)
      } catch (err: any) {
        setUploading(false); setUploadProgress(null); uploadAbortRef.current = null; setSending(false)
        if (err?.name !== 'AbortError') setUploadError(err?.message ?? 'Attachment failed. Try again.')
        return
      }
      setPendingFile(null); setUploading(false); setUploadProgress(null); uploadAbortRef.current = null
    }

    setInput('')

    if (activeKind === 'client' && activeId) {
      const optimistic: ClientMsg = { id: `opt-${Date.now()}`, from: 'me', text, time: new Date().toISOString(), attachmentUrl: attachmentPreview, attachmentType, attachmentName, attachmentSize }
      setClientThread(prev => [...prev, optimistic])
      const res = await fetch(`/api/photographer/messages/${activeId}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, attachment_key: attachmentKey, attachment_type: attachmentType, attachment_name: attachmentName, attachment_size: attachmentSize }),
      })
      if (res.ok) {
        const msg = await res.json()
        setClientThread(prev => prev.map(m => (m.id === optimistic.id ? msg : m)))
        setClientConvs(prev => prev.map(c => (c.id === activeId ? { ...c, lastMessage: text || (attachmentName ? `📎 ${attachmentName}` : ''), lastMessageAt: new Date().toISOString() } : c)))
      } else {
        setClientThread(prev => prev.filter(m => m.id !== optimistic.id))
        setInput(text)
      }
    } else if (activeKind === 'group' && activeId) {
      const tempId = -Date.now()
      const optimistic: GroupMsg = { id: tempId, senderId: 'me', senderName: 'You', senderInitials: '?', senderBg: 'bg-ink', text, time: new Date().toISOString(), isSystem: false, attachmentUrl: attachmentPreview, attachmentType, attachmentName, attachmentSize }
      setGroups(prev => prev.map(g => (g.id === activeId ? { ...g, messages: [...g.messages, optimistic], lastActivityAt: new Date().toISOString() } : g)))
      const res = await fetch('/api/photographer/groups/messages', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ group_id: activeId, body: text, attachment_key: attachmentKey, attachment_type: attachmentType, attachment_name: attachmentName, attachment_size: attachmentSize }),
      })
      if (res.ok) {
        const msg = await res.json()
        setGroups(prev => prev.map(g => (g.id === activeId ? { ...g, messages: g.messages.map(m => (m.id === tempId ? { ...optimistic, id: msg.id, time: msg.created_at } : m)) } : g)))
      } else {
        setGroups(prev => prev.map(g => (g.id === activeId ? { ...g, messages: g.messages.filter(m => m.id !== tempId) } : g)))
      }
    }
    setSending(false)
  }

  async function startDm(connectionId: string) {
    setStartingDm(connectionId)
    const res = await fetch('/api/photographer/connections/dm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ connection_photographer_id: connectionId }),
    })
    if (res.ok) {
      const { group_id } = await res.json()
      setShowNewMsg(false)
      const grpRes = await fetch('/api/photographer/groups')
      if (grpRes.ok) {
        const data = await grpRes.json()
        setGroups(((data.groups ?? []) as any[]).map((g: any) => ({
          kind: 'group' as const, id: g.id, name: g.name, emoji: g.emoji ?? '👥', memberIds: g.memberIds ?? [],
          messages: g.messages ?? [], unread: g.unread ?? 0, lastActivityAt: g.lastActivityAt ?? null,
          isCoverGroup: g.isCoverGroup ?? false, isRemoved: g.isRemoved ?? false, isLeft: g.isLeft ?? false, isDm: g.isDm ?? false,
        })))
      }
      openGroupConv(group_id)
    }
    setStartingDm(null)
  }

  const hasActiveThread = activeId !== null

  // Build shared thread props for the active thread
  const threadMessages: UIMessage[] = activeKind === 'client'
    ? clientThread.map(m => ({
        id: m.id, from: m.from, text: m.text, time: m.time, isSystem: m.isSystem, status: 'read',
        attachmentUrl: m.attachmentUrl, attachmentType: m.attachmentType, attachmentName: m.attachmentName, attachmentSize: m.attachmentSize,
      }))
    : (activeGroup?.messages ?? []).map(m => ({
        id: m.id, from: m.senderId === 'me' ? 'me' : 'them', text: m.text, time: m.time, isSystem: m.isSystem, status: 'read',
        senderName: m.senderId === 'me' ? undefined : m.senderName, senderInitials: m.senderInitials, senderBg: m.senderBg,
        attachmentUrl: m.attachmentUrl, attachmentType: m.attachmentType, attachmentName: m.attachmentName, attachmentSize: m.attachmentSize,
      }))

  const peer: ThreadPeer | null = activeKind === 'client' && activeClientConv
    ? { name: activeClientConv.clientName, initials: activeClientConv.clientInitials || initialsOf(activeClientConv.clientName), avatarUrl: activeClientConv.clientAvatarUrl, bg: avatarBg(activeClientConv.clientId), subLabel: 'Client' }
    : activeKind === 'group' && activeGroup
    ? { name: activeGroup.name, initials: activeGroup.isDm ? initialsOf(activeGroup.name) : activeGroup.emoji, avatarUrl: null, bg: activeGroup.isDm ? avatarBg(activeGroup.id) : 'bg-violet-600', subLabel: activeGroup.isDm ? 'Direct message' : `Group · ${activeGroup.memberIds.length} members` }
    : null

  const composerDisabledNode = activeKind === 'client' && frozen ? (
    <div className="flex items-center justify-center gap-2 py-2">
      <Ban className="w-4 h-4 text-ink-300" />
      <p className="text-sm text-ink-300">This conversation has been locked by an administrator.</p>
    </div>
  ) : activeKind === 'client' && blockedByClient ? (
    <div className="flex items-center justify-center gap-2 py-2">
      <Ban className="w-4 h-4 text-ink-300" />
      <p className="text-sm text-ink-300">You can no longer message this client.</p>
    </div>
  ) : undefined

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <div className="bg-white border-b border-ink-100 flex-shrink-0 h-14 flex items-center px-4 sm:px-6 gap-4 z-10">
        <Link href="/dashboard/photographer" className="flex items-center gap-2 text-ink-400 hover:text-ink transition-colors flex-shrink-0">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium hidden sm:block">Dashboard</span>
        </Link>
        <div className="flex items-center gap-2 flex-1">
          <span className="font-semibold text-ink text-sm">Messages</span>
          {totalUnread > 0 && <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{totalUnread}</span>}
        </div>
        <button type="button" onClick={() => setShowNewMsg(true)} className="sm:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-ink hover:bg-ink-800 transition-colors" title="New message">
          <Plus className="w-4 h-4 text-white" />
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className={`w-full sm:w-80 lg:w-96 border-r border-ink-100 flex flex-col flex-shrink-0 bg-white ${mobileView === 'thread' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="px-4 py-3 border-b border-ink-50 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2 flex-1">
                <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search conversations…" className="bg-transparent text-ink text-xs placeholder-ink-300 outline-none flex-1" />
              </div>
              <button type="button" onClick={() => setShowNewMsg(true)} className="w-9 h-9 rounded-xl bg-ink hover:bg-ink-800 transition-colors flex items-center justify-center flex-shrink-0" title="Start a new conversation">
                <UserPlus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingList ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <span className="w-6 h-6 border-2 border-ink-200 border-t-ink rounded-full animate-spin" />
                <p className="text-xs text-ink-400">Loading conversations…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="py-12 text-center px-6">
                <MessageSquare className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-ink-400 mb-1">{searchQuery ? 'No matches found' : 'No messages yet'}</p>
                {!searchQuery && <p className="text-xs text-ink-300">Clients will appear here when they message you. You can also start a conversation with a connection.</p>}
              </div>
            ) : (
              <>
                {filtered.filter(c => c.kind === 'client').length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Clients</p>
                    {(filtered.filter(c => c.kind === 'client') as ClientConv[]).map(cc => (
                      <ConversationRow key={cc.id} name={cc.clientName} sub="Client" initials={cc.clientInitials || initialsOf(cc.clientName)}
                        avatarUrl={cc.clientAvatarUrl} bg={avatarBg(cc.clientId)} lastMsg={cc.lastMessage} lastTime={timeAgo(cc.lastMessageAt)}
                        unread={cc.unread} active={activeId === cc.id} blocked={cc.blockedByClient} onClick={() => openClientConv(cc.id)} />
                    ))}
                  </>
                )}
                {filtered.filter(c => c.kind === 'group').length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Connections &amp; Groups</p>
                    {(filtered.filter(c => c.kind === 'group') as GroupConv[]).map(gc => {
                      const last = gc.messages[gc.messages.length - 1]
                      return (
                        <ConversationRow key={gc.id} name={gc.name} sub={gc.isDm ? 'Direct message' : `Group · ${gc.memberIds.length} members`}
                          initials={gc.isDm ? initialsOf(gc.name) : gc.emoji} bg={gc.isDm ? avatarBg(gc.id) : 'bg-violet-600'}
                          lastMsg={last ? (last.senderId === 'me' ? `You: ${last.text}` : last.text) : ''} lastTime={timeAgo(gc.lastActivityAt)}
                          unread={gc.unread} active={activeId === gc.id} onClick={() => openGroupConv(gc.id)} />
                      )
                    })}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Thread */}
        <div className={`flex-1 flex flex-col overflow-hidden bg-ink-50/30 ${mobileView === 'list' ? 'hidden sm:flex' : 'flex'}`}>
          {!hasActiveThread || !peer ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-ink-50 flex items-center justify-center"><MessageSquare className="w-8 h-8 text-ink-200" /></div>
              <p className="font-semibold text-ink">Select a conversation</p>
              <p className="text-sm text-ink-400 max-w-xs">Choose a conversation from the left, or start a new direct message with one of your connections.</p>
              <button type="button" onClick={() => setShowNewMsg(true)} className="mt-2 flex items-center gap-2 px-4 py-2.5 bg-ink hover:bg-ink-800 text-white text-sm font-semibold rounded-xl transition-colors">
                <UserPlus className="w-4 h-4" /> Message a connection
              </button>
            </div>
          ) : (
            <>
              <div className="bg-white border-b border-ink-100 px-4 sm:px-5 py-3 flex items-center gap-3 flex-shrink-0">
                <button type="button" onClick={() => setMobileView('list')} className="sm:hidden text-ink-400 hover:text-ink mr-1"><ArrowLeft className="w-5 h-5" /></button>
                <Avatar avatarUrl={peer.avatarUrl} initials={peer.initials} bg={peer.bg} size={36} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-ink text-sm">{peer.name}</p>
                    {blockedByClient && <span className="text-[10px] font-semibold bg-ink-100 text-ink-400 px-2 py-0.5 rounded-full flex items-center gap-1"><Ban className="w-2.5 h-2.5" /> Blocked you</span>}
                  </div>
                  {peer.subLabel && <p className="text-[10px] text-ink-300">{peer.subLabel}</p>}
                </div>
                <button className="w-8 h-8 rounded-lg border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors flex-shrink-0">
                  <MoreVertical className="w-4 h-4 text-ink-400" />
                </button>
              </div>

              {blockedByClient && (
                <div className="bg-ink-50 border-b border-ink-100 px-5 py-2.5 flex items-center gap-2.5">
                  <Ban className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                  <p className="text-xs text-ink-500 flex-1">This client has blocked you. You can view the history but can&apos;t send new messages.</p>
                </div>
              )}

              <MessageThread
                messages={threadMessages}
                peer={peer}
                loading={activeKind === 'client' && loadingThread}
                emptyState={<p className="text-center text-xs text-ink-300 pt-8">{activeKind === 'group' ? 'No messages yet — say hello!' : 'No messages yet'}</p>}
              />

              {uploadError && (
                <button type="button" onClick={() => setUploadError(null)}
                  className="w-full text-left px-4 py-2 bg-red-50 border-t border-red-100 flex items-center gap-2">
                  <span className="text-xs text-red-600 flex-1">{uploadError}</span>
                  <span className="text-[10px] text-red-400">dismiss</span>
                </button>
              )}
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
                onPickFile={(f) => { setUploadError(null); setPendingFile(f) }}
                onRemoveFile={() => setPendingFile(null)}
                uploadProgress={uploadProgress}
                onCancelUpload={() => uploadAbortRef.current?.abort()}
                disabledNode={composerDisabledNode}
              />
            </>
          )}
        </div>
      </div>

      {showNewMsg && <NewMessageModal connections={connections} starting={startingDm} onStart={startDm} onClose={() => setShowNewMsg(false)} />}
    </div>
  )
}

export default function PhotographerMessagesPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-ink-300" /></div>}>
      <PhotographerMessagesInner />
    </Suspense>
  )
}
