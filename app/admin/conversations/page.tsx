'use client'

import { useState, useEffect, useCallback } from 'react'
import { AdminNav } from '@/components/admin-nav'
import {
  Search, MessageSquare, Flag, X, Lock, Unlock,
  Eye, CheckCircle2, Loader2, RefreshCw, AlertTriangle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConvStatus = 'active' | 'frozen' | 'flagged'

interface ConvRow {
  id:            string
  status:        ConvStatus
  flagReason:    string | null
  createdAt:     string
  lastMessageAt: string
  messageCount:  number
  client:       { id: string; name: string }
  photographer: { id: string; name: string; username: string; specialty: string }
}

interface Counts { total: number; active: number; frozen: number; flagged: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

const AVATAR_COLORS = [
  'bg-blue-500','bg-violet-600','bg-teal-500','bg-slate-600',
  'bg-orange-500','bg-rose-400','bg-emerald-600','bg-amber-500',
]
function avatarColor(id: string) {
  let n = 0; for (const c of id) n = (n * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}
function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

function StatusPill({ status }: { status: ConvStatus }) {
  const cfg = {
    active:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', Icon: CheckCircle2, label: 'Active'  },
    frozen:  { cls: 'bg-blue-50 text-blue-700 border-blue-200',          Icon: Lock,         label: 'Frozen'  },
    flagged: { cls: 'bg-red-50 text-red-700 border-red-200',             Icon: Flag,         label: 'Flagged' },
  }[status]
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cfg.cls}`}>
      <cfg.Icon className="w-2.5 h-2.5" />{cfg.label}
    </span>
  )
}

// ─── Thread drawer ────────────────────────────────────────────────────────────

function ThreadDrawer({ conv, onClose, onAction }: {
  conv:     ConvRow
  onClose:  () => void
  onAction: (id: string, action: string, flagReason?: string) => Promise<void>
}) {
  const [acting, setActing]       = useState('')
  const [flagInput, setFlagInput] = useState('')
  const [showFlag, setShowFlag]   = useState(false)

  async function act(action: string, flagReason?: string) {
    setActing(action)
    await onAction(conv.id, action, flagReason)
    setActing('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-ink-50 flex-shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <p className="font-semibold text-ink text-sm truncate">
                {conv.client.name} ↔ {conv.photographer.name}
              </p>
              <StatusPill status={conv.status} />
            </div>
            <p className="text-xs text-ink-300">
              {conv.messageCount} messages · started {relTime(conv.createdAt)}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400 ml-3 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flag reason */}
        {conv.flagReason && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-shrink-0">
            <Flag className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-800">Flagged</p>
              <p className="text-xs text-red-600">{conv.flagReason}</p>
            </div>
          </div>
        )}
        {conv.status === 'frozen' && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex-shrink-0">
            <Lock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">This conversation is frozen — neither party can send messages.</p>
          </div>
        )}

        {/* Message content is intentionally not shown — admins moderate
            without reading private conversations. */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0 flex items-center justify-center">
          <div className="text-center max-w-xs">
            <div className="w-10 h-10 rounded-full bg-ink-50 flex items-center justify-center mx-auto mb-3">
              <Lock className="w-4 h-4 text-ink-300" />
            </div>
            <p className="text-sm font-semibold text-ink mb-1">Message content is private</p>
            <p className="text-xs text-ink-400 leading-relaxed">
              This conversation has {conv.messageCount} {conv.messageCount === 1 ? 'message' : 'messages'}.
              Admins can freeze or flag a thread without reading it.
            </p>
          </div>
        </div>

        {/* Flag input */}
        {showFlag && (
          <div className="px-5 pb-3 flex-shrink-0 space-y-2">
            <textarea
              value={flagInput}
              onChange={e => setFlagInput(e.target.value)}
              placeholder="Flag reason (e.g. off-platform payment attempt)…"
              rows={2}
              className="w-full border border-red-200 rounded-xl px-3 py-2.5 text-xs text-ink outline-none focus:border-red-400 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => act('flag', flagInput || 'Flagged by admin')} disabled={!!acting}
                className="flex-1 text-xs font-semibold bg-red-600 text-white py-2 rounded-xl hover:bg-red-700 disabled:opacity-50">
                {acting === 'flag' ? 'Flagging…' : 'Confirm flag'}
              </button>
              <button onClick={() => { setShowFlag(false); setFlagInput('') }}
                className="text-xs text-ink-400 px-3 py-2 rounded-xl hover:bg-ink-50">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Admin actions */}
        <div className="border-t border-ink-50 px-5 py-4 flex items-center gap-2 flex-wrap flex-shrink-0">
          <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Admin</span>
          {conv.status === 'frozen' ? (
            <button onClick={() => act('unfreeze')} disabled={!!acting}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-500 text-white px-3 py-2 rounded-xl hover:bg-blue-600 disabled:opacity-50">
              <Unlock className="w-3.5 h-3.5" />
              {acting === 'unfreeze' ? 'Unfreezing…' : 'Unfreeze'}
            </button>
          ) : (
            <button onClick={() => act('freeze')} disabled={!!acting}
              className="flex items-center gap-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 disabled:opacity-50">
              <Lock className="w-3.5 h-3.5" />
              {acting === 'freeze' ? 'Freezing…' : 'Freeze thread'}
            </button>
          )}
          {conv.status !== 'flagged' && !showFlag && (
            <button onClick={() => setShowFlag(true)}
              className="flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-600 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100">
              <Flag className="w-3.5 h-3.5" /> Flag
            </button>
          )}
          {conv.status === 'flagged' && (
            <button onClick={() => act('unflag')} disabled={!!acting}
              className="flex items-center gap-1.5 text-xs font-semibold border border-ink-100 text-ink-500 px-3 py-2 rounded-xl hover:bg-ink-50 disabled:opacity-50">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {acting === 'unflag' ? 'Clearing…' : 'Clear flag'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | ConvStatus

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConvRow[]>([])
  const [counts, setCounts]               = useState<Counts>({ total: 0, active: 0, frozen: 0, flagged: 0 })
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState('')
  const [search, setSearch]               = useState('')
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>('all')
  const [openId, setOpenId]               = useState<string | null>(null)
  const [toast, setToast]                 = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const params = new URLSearchParams({ status: statusFilter })
      if (search.trim()) params.set('q', search.trim())
      const res = await fetch(`/api/admin/conversations?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setConversations(data.conversations ?? [])
      setCounts(data.counts ?? { total: 0, active: 0, frozen: 0, flagged: 0 })
    } catch { setError('Could not load conversations.') }
    finally { setLoading(false) }
  }, [statusFilter, search])

  useEffect(() => { load() }, [load])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function handleAction(id: string, action: string, flagReason?: string) {
    const res = await fetch('/api/admin/conversations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action, flag_reason: flagReason }),
    })
    if (!res.ok) return
    const labels: Record<string, string> = {
      freeze: 'Conversation frozen',
      unfreeze: 'Conversation unfrozen',
      flag: 'Conversation flagged',
      unflag: 'Flag cleared',
    }
    showToast(labels[action] ?? 'Updated')
    await load()
  }

  const openConv = conversations.find(c => c.id === openId) ?? null

  return (
    <div className="min-h-screen bg-ink-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">Conversations</h1>
            <p className="text-sm text-ink-300 mt-0.5">{counts.total} total · read-only view</p>
          </div>
          <button onClick={load} disabled={loading}
            className="flex items-center gap-2 text-sm font-medium border border-ink-100 bg-white text-ink-500 px-4 py-2 rounded-xl hover:bg-ink-50 disabled:opacity-50 transition-colors">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </button>
        </div>

        {/* Status filter pills */}
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'all',     label: `All (${counts.total})`,       cls: 'border-ink-200 text-ink-600'        },
            { key: 'active',  label: `Active (${counts.active})`,    cls: 'border-emerald-200 text-emerald-700 bg-emerald-50' },
            { key: 'flagged', label: `Flagged (${counts.flagged})`,  cls: 'border-red-200 text-red-700 bg-red-50'             },
            { key: 'frozen',  label: `Frozen (${counts.frozen})`,    cls: 'border-blue-200 text-blue-700 bg-blue-50'          },
          ] as const).map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key as StatusFilter)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
                statusFilter === s.key ? s.cls + ' shadow-sm' : 'bg-white border-ink-100 text-ink-400 hover:text-ink'
              }`}
            >{s.label}</button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by client or photographer name…"
            className="w-full border border-ink-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all bg-white"
          />
        </div>

        {/* Table */}
        {loading && !conversations.length ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-ink-300" /></div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-2xl py-10 text-center">
            <p className="text-sm text-red-600">{error}</p>
            <button onClick={load} className="mt-3 text-xs text-red-600 underline">Retry</button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
            <div className="grid grid-cols-[2fr_2fr_1fr_2fr_auto] gap-4 px-6 py-3 border-b border-ink-50 bg-ink-50">
              {['Client', 'Photographer', 'Status', 'Last message', 'View'].map(h => (
                <span key={h} className="text-xs font-semibold text-ink-400 uppercase tracking-widest">{h}</span>
              ))}
            </div>

            {conversations.length === 0 ? (
              <div className="py-16 text-center">
                <MessageSquare className="w-8 h-8 text-ink-200 mx-auto mb-3" />
                <p className="text-sm text-ink-300">No conversations match your filters</p>
              </div>
            ) : (
              <div className="divide-y divide-ink-50">
                {conversations.map(conv => (
                  <div key={conv.id}
                    className={`grid grid-cols-[2fr_2fr_1fr_2fr_auto] gap-4 px-6 py-4 items-center transition-colors ${
                      conv.status === 'flagged' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-ink-50'
                    }`}
                  >
                    {/* Client */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${avatarColor(conv.client.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {initials(conv.client.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{conv.client.name}</p>
                        <p className="text-[10px] text-ink-300">{conv.messageCount} msg · {relTime(conv.lastMessageAt)}</p>
                      </div>
                    </div>

                    {/* Photographer */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-full ${avatarColor(conv.photographer.id)} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {initials(conv.photographer.name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{conv.photographer.name}</p>
                        <p className="text-[10px] text-ink-300">{conv.photographer.specialty || 'Photographer'}</p>
                      </div>
                    </div>

                    {/* Status */}
                    <div className="flex flex-col gap-1">
                      <StatusPill status={conv.status} />
                      {conv.status === 'flagged' && conv.flagReason && (
                        <p className="text-[10px] text-red-500 leading-snug line-clamp-1">{conv.flagReason}</p>
                      )}
                    </div>

                    {/* Activity — message content is deliberately not surfaced */}
                    <div className="min-w-0">
                      <p className="text-xs text-ink-400">
                        {conv.messageCount} {conv.messageCount === 1 ? 'message' : 'messages'}
                      </p>
                      <p className="text-[10px] text-ink-300 mt-0.5">{relTime(conv.lastMessageAt)}</p>
                    </div>

                    {/* View */}
                    <button onClick={() => setOpenId(conv.id)}
                      className="flex items-center gap-1.5 text-xs font-medium border border-ink-100 text-ink-500 px-3 py-1.5 rounded-lg hover:bg-ink-50 hover:text-ink transition-all whitespace-nowrap">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <p className="text-center text-xs text-ink-300">
          Showing {conversations.length} conversations
        </p>
      </main>

      {/* Thread drawer */}
      {openId && openConv && (
        <ThreadDrawer conv={openConv} onClose={() => setOpenId(null)} onAction={handleAction} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm font-medium px-5 py-3 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  )
}
