'use client'

import { useState, useEffect, useCallback } from 'react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import Link from 'next/link'
import {
  HelpCircle, Search, CheckCircle2, Clock,
  X, ChevronDown, ChevronUp, Star,
  MessageSquare, Loader2, AlertTriangle, ShieldX, ShieldCheck,
} from 'lucide-react'
import { AdminNav } from '@/components/admin-nav'

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketStatus   = 'open' | 'in_review' | 'resolved' | 'closed'
type TicketRole     = 'client' | 'photographer'
type TicketCategory = 'fake_review' | 'inappropriate_content' | 'spam_report' | 'billing_dispute' | 'account_issue' | 'other'

interface Ticket {
  id:          string
  submittedBy: string
  email:       string
  role:        TicketRole
  category:    TicketCategory
  subject:     string
  message:     string
  submittedAt: string
  updatedAt:   string
  resolvedAt:  string | null
  status:      TicketStatus
  adminReply:  string
  reviewId:    string | null
}

interface ReviewDetail {
  id:                  string
  rating:              number
  body:                string
  flagStatus:          string
  flagReason:          string
  createdAt:           string
  reviewerName:        string
  reviewerEmail:       string
  photographerName:    string
  photographerUsername: string
}

interface StatusCounts { open: number; in_review: number; resolved: number; closed: number }

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  fake_review:           'Fake review',
  inappropriate_content: 'Inappropriate content',
  spam_report:           'Spam report',
  billing_dispute:       'Billing dispute',
  account_issue:         'Account issue',
  other:                 'Other',
}

const CATEGORIES = ['All categories', ...Object.values(CATEGORY_LABELS)]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusStyle(s: TicketStatus) {
  return {
    open:      { pill: 'bg-amber-50 text-amber-700 border-amber-200',       label: 'Open',      icon: Clock         },
    in_review: { pill: 'bg-blue-50 text-blue-700 border-blue-200',          label: 'In review', icon: MessageSquare },
    resolved:  { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Resolved',  icon: CheckCircle2  },
    closed:    { pill: 'bg-ink-50 text-ink-400 border-ink-200',             label: 'Closed',    icon: X             },
  }[s]
}

function StatusPill({ status }: { status: TicketStatus }) {
  const s = statusStyle(status)
  const Icon = s.icon
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s.pill}`}>
      <Icon className="w-2.5 h-2.5" />{s.label}
    </span>
  )
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
}

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-600', 'bg-teal-500', 'bg-slate-600',
  'bg-orange-500', 'bg-rose-400', 'bg-emerald-600', 'bg-amber-500',
]
function avatarColor(id: string) {
  let n = 0
  for (const c of id) n = (n * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_COLORS[n % AVATAR_COLORS.length]
}

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-3 h-3 ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-ink-100 fill-ink-100'}`} />
      ))}
      <span className="text-xs font-semibold text-ink ml-1">{rating}.0</span>
    </div>
  )
}

// ─── Flagged review inline panel ───────────────────────────────────────────────

function ReviewPanel({ reviewId, ticketId, ticketStatus, onAction }: {
  reviewId:     string
  ticketId:     string
  ticketStatus: TicketStatus
  onAction:     (action: 'remove' | 'dismiss') => void
}) {
  const [review, setReview]   = useState<ReviewDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing]   = useState<'remove' | 'dismiss' | null>(null)
  const [done, setDone]       = useState<'remove' | 'dismiss' | null>(null)
  const [err, setErr]         = useState('')

  useEffect(() => {
    fetch(`/api/admin/reviews?id=${reviewId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setReview(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [reviewId])

  async function handleAction(action: 'remove' | 'dismiss') {
    setActing(action)
    setErr('')
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review_id: reviewId, action, ticket_id: ticketId }),
      })
      if (!res.ok) throw new Error()
      setDone(action)
      onAction(action)
    } catch {
      setErr('Action failed — please try again.')
    } finally {
      setActing(null)
    }
  }

  if (loading) return (
    <div className="flex items-center gap-2 py-3 text-xs text-ink-300">
      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading review…
    </div>
  )

  if (!review) return (
    <div className="text-xs text-ink-300 py-2">Review not found or already deleted.</div>
  )

  const alreadyRemoved = review.flagStatus === 'flag_resolved'

  return (
    <div className="border border-red-100 rounded-xl overflow-hidden bg-red-50/30">
      {/* Review header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-red-50 border-b border-red-100">
        <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
        <p className="text-xs font-semibold text-red-700">Flagged review</p>
        {alreadyRemoved && (
          <span className="ml-auto text-[10px] font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
            Already removed
          </span>
        )}
      </div>

      {/* Review body */}
      <div className="px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-ink">{review.reviewerName}</p>
            <p className="text-[10px] text-ink-300">{review.reviewerEmail}</p>
          </div>
          <StarRow rating={review.rating} />
        </div>
        {review.body && (
          <p className="text-xs text-ink-600 leading-relaxed bg-white rounded-lg px-3 py-2.5 border border-red-100">
            "{review.body}"
          </p>
        )}
        {review.flagReason && (
          <div className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <span className="font-semibold">Photographer's reason: </span>{review.flagReason}
          </div>
        )}
        <p className="text-[10px] text-ink-300">
          Left for <span className="font-medium text-ink-500">{review.photographerName}</span> · {relTime(review.createdAt)}
        </p>
      </div>

      {/* Admin actions */}
      {!alreadyRemoved && ticketStatus !== 'resolved' && (
        <div className="px-4 pb-4 pt-2 border-t border-red-100 flex items-center gap-2 flex-wrap">
          {done ? (
            <div className={`flex items-center gap-2 text-xs font-semibold ${done === 'remove' ? 'text-red-600' : 'text-emerald-600'}`}>
              {done === 'remove'
                ? <><ShieldX className="w-4 h-4" /> Review removed from public profile</>
                : <><ShieldCheck className="w-4 h-4" /> Review kept — flag dismissed</>
              }
            </div>
          ) : (
            <>
              <button
                onClick={() => handleAction('remove')}
                disabled={!!acting}
                className="flex items-center gap-1.5 text-xs font-semibold bg-red-600 text-white px-3.5 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-all"
              >
                <ShieldX className="w-3.5 h-3.5" />
                {acting === 'remove' ? 'Removing…' : 'Remove review'}
              </button>
              <button
                onClick={() => handleAction('dismiss')}
                disabled={!!acting}
                className="flex items-center gap-1.5 text-xs font-semibold border border-emerald-200 bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl hover:bg-emerald-100 disabled:opacity-50 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {acting === 'dismiss' ? 'Dismissing…' : 'Dismiss flag (keep review)'}
              </button>
              {err && <p className="text-xs text-red-500 w-full">{err}</p>}
            </>
          )}
        </div>
      )}

      {alreadyRemoved && (
        <div className="px-4 pb-3 pt-1">
          <p className="text-[10px] text-red-500">This review has been removed from the public profile.</p>
        </div>
      )}
    </div>
  )
}

// ─── Ticket card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, onUpdate, onReviewAction }: {
  ticket:         Ticket
  onUpdate:       (id: string, reply: string, status: TicketStatus) => Promise<void>
  onReviewAction: (ticketId: string, action: 'remove' | 'dismiss') => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [reply, setReply]       = useState(ticket.adminReply)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [error, setError]       = useState('')

  const isFakeReview = ticket.category === 'fake_review' && !!ticket.reviewId

  async function save(status: TicketStatus) {
    setSaving(true)
    setError('')
    try {
      await onUpdate(ticket.id, reply, status)
      setSaved(true)
      setTimeout(() => { setSaved(false); setExpanded(false) }, 1200)
    } catch {
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const bg = avatarColor(ticket.id)

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      ticket.status === 'open'      ? 'border-amber-200' :
      ticket.status === 'in_review' ? 'border-blue-200'  : 'border-ink-100'
    }`}>
      {/* Header row */}
      <button
        className="w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-ink-50/50 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className={`w-9 h-9 rounded-full ${bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
          {initials(ticket.submittedBy)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-ink">{ticket.submittedBy}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
              ticket.role === 'photographer'
                ? 'bg-violet-50 text-violet-600 border-violet-200'
                : 'bg-blue-50 text-blue-600 border-blue-200'
            }`}>
              {ticket.role === 'photographer' ? 'Photographer' : 'Client'}
            </span>
            <span className="text-[10px] font-medium bg-ink-50 text-ink-400 border border-ink-100 px-1.5 py-0.5 rounded-full">
              {CATEGORY_LABELS[ticket.category]}
            </span>
            {isFakeReview && (
              <span className="text-[10px] font-semibold bg-red-50 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-2.5 h-2.5" /> Review attached
              </span>
            )}
            <StatusPill status={ticket.status} />
          </div>
          <p className="text-xs font-medium text-ink-600 mb-0.5 line-clamp-1">{ticket.subject}</p>
          <p className="text-xs text-ink-400 line-clamp-1">{ticket.message}</p>
          <p className="text-[10px] text-ink-300 mt-1">{relTime(ticket.submittedAt)}</p>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-ink-300 flex-shrink-0 mt-1" />
          : <ChevronDown className="w-4 h-4 text-ink-300 flex-shrink-0 mt-1" />
        }
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-ink-50 px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 text-xs text-ink-400 flex-wrap">
            <span>{ticket.email}</span>
            <span>·</span>
            <span>Submitted {relTime(ticket.submittedAt)}</span>
            {ticket.resolvedAt && <><span>·</span><span>Resolved {relTime(ticket.resolvedAt)}</span></>}
          </div>

          {/* User message */}
          <div className="bg-ink-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-2">User message</p>
            <p className="text-sm text-ink-600 leading-relaxed">{ticket.message}</p>
          </div>

          {/* Flagged review panel — only for fake_review tickets with a review_id */}
          {isFakeReview && (
            <ReviewPanel
              reviewId={ticket.reviewId!}
              ticketId={ticket.id}
              ticketStatus={ticket.status}
              onAction={(action) => onReviewAction(ticket.id, action)}
            />
          )}

          {/* Admin reply */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2">Admin reply</label>
            <div className="relative">
              <textarea
                value={reply}
                onChange={e => {
                  if (e.target.value.length <= PLATFORM_CONFIG.max_ticket_resolution_note_length)
                    setReply(e.target.value)
                }}
                placeholder="Write your reply to the user…"
                rows={4}
                className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
              />
              {reply.length > PLATFORM_CONFIG.max_ticket_resolution_note_length - 100 && (
                <span className={`absolute bottom-2 right-3 text-[10px] ${
                  reply.length >= PLATFORM_CONFIG.max_ticket_resolution_note_length ? 'text-red-500' : 'text-amber-500'
                }`}>
                  {reply.length}/{PLATFORM_CONFIG.max_ticket_resolution_note_length}
                </span>
              )}
            </div>
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          {/* Ticket status actions */}
          {saved ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {ticket.status !== 'resolved' && (
                <button
                  onClick={() => save('resolved')}
                  disabled={saving || !reply.trim()}
                  className="flex items-center gap-2 text-sm font-semibold bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Reply & resolve'}
                </button>
              )}
              {ticket.status === 'open' && (
                <button
                  onClick={() => save('in_review')}
                  disabled={saving}
                  className="flex items-center gap-2 text-sm font-semibold border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 disabled:opacity-40 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Mark in review'}
                </button>
              )}
              {ticket.status === 'resolved' && (
                <button
                  onClick={() => save('open')}
                  disabled={saving}
                  className="flex items-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 px-4 py-2.5 rounded-xl hover:bg-ink-50 transition-all"
                >
                  Reopen ticket
                </button>
              )}
              {ticket.status === 'in_review' && (
                <button
                  onClick={() => save('closed')}
                  disabled={saving}
                  className="flex items-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 px-4 py-2.5 rounded-xl hover:bg-ink-50 transition-all"
                >
                  Close ticket
                </button>
              )}
              <button
                onClick={() => { setExpanded(false); setReply(ticket.adminReply) }}
                className="text-sm font-medium text-ink-400 px-4 py-2.5 rounded-xl hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type StatusFilter = 'all' | TicketStatus
type RoleFilter   = 'all' | TicketRole


export default function SupportPage() {
  const [tickets, setTickets]           = useState<Ticket[]>([])
  const [counts, setCounts]             = useState<StatusCounts>({ open: 0, in_review: 0, resolved: 0, closed: 0 })
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter]     = useState<RoleFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('All categories')

  const loadTickets = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ status: statusFilter, role: roleFilter })
      if (search.trim()) params.set('q', search.trim())
      const res = await fetch(`/api/admin/support?${params}`)
      if (!res.ok) throw new Error('Failed to load tickets')
      const data = await res.json()
      setTickets(data.tickets ?? [])
      setCounts(data.counts ?? { open: 0, in_review: 0, resolved: 0, closed: 0 })
    } catch {
      setError('Could not load support tickets.')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, roleFilter, search])

  useEffect(() => { loadTickets() }, [loadTickets])

  async function handleUpdate(id: string, reply: string, status: TicketStatus) {
    const res = await fetch('/api/admin/support', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status, resolution_note: reply }),
    })
    if (!res.ok) throw new Error('Save failed')
    setTickets(prev => prev.map(t => t.id === id
      ? { ...t, status, adminReply: reply, resolvedAt: status === 'resolved' ? new Date().toISOString() : t.resolvedAt }
      : t
    ))
    setCounts(prev => {
      const next = { ...prev }
      const old = tickets.find(t => t.id === id)?.status
      if (old && old in next) next[old] = Math.max(0, next[old] - 1)
      if (status in next) next[status] = next[status] + 1
      return next
    })
  }

  // When a review action (remove/dismiss) happens, auto-update ticket to resolved in local state
  function handleReviewAction(ticketId: string, _action: 'remove' | 'dismiss') {
    setTickets(prev => prev.map(t => t.id === ticketId
      ? { ...t, status: 'resolved', resolvedAt: new Date().toISOString() }
      : t
    ))
    setCounts(prev => {
      const ticket = tickets.find(t => t.id === ticketId)
      if (!ticket) return prev
      const next = { ...prev }
      if (ticket.status in next) next[ticket.status as keyof StatusCounts] = Math.max(0, next[ticket.status as keyof StatusCounts] - 1)
      next.resolved = next.resolved + 1
      return next
    })
  }

  const filtered = categoryFilter === 'All categories'
    ? tickets
    : tickets.filter(t => CATEGORY_LABELS[t.category] === categoryFilter)

  return (
    <div className="min-h-screen bg-ink-50">
      <AdminNav openCount={counts.open} />

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">User support</h1>
            <p className="text-sm text-ink-300 mt-0.5">Submitted via client &amp; photographer dashboards</p>
          </div>
          <button onClick={loadTickets} disabled={loading}
            className="flex items-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 px-4 py-2 rounded-xl hover:bg-ink-50 disabled:opacity-50 transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            Refresh
          </button>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {([
            { key: 'open',      label: 'Open',      color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',    icon: Clock         },
            { key: 'in_review', label: 'In review', color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',      icon: MessageSquare },
            { key: 'resolved',  label: 'Resolved',  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200',icon: CheckCircle2  },
            { key: 'closed',    label: 'Closed',    color: 'text-ink-400',     bg: 'bg-ink-50 border-ink-200',        icon: X             },
          ] as const).map(s => (
            <button key={s.key} onClick={() => setStatusFilter(statusFilter === s.key ? 'all' : s.key)}
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:opacity-90 ${
                statusFilter === s.key ? s.bg : 'bg-white border-ink-100'
              }`}
            >
              <s.icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} />
              <div className="text-left">
                <p className={`text-2xl font-bold ${statusFilter === s.key ? s.color : 'text-ink'}`}>
                  {counts[s.key]}
                </p>
                <p className="text-xs text-ink-300">{s.label}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, message, or subject…"
              className="w-full border border-ink-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all bg-white"
            />
          </div>

          <div className="flex gap-1 bg-white border border-ink-100 p-1 rounded-xl">
            {(['all', 'client', 'photographer'] as const).map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${
                  roleFilter === r ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'
                }`}
              >
                {r === 'all' ? 'All roles' : r === 'client' ? 'Clients' : 'Photographers'}
              </button>
            ))}
          </div>

          <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
            className="border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink bg-white outline-none focus:border-ink transition-all"
          >
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          {(statusFilter !== 'all' || roleFilter !== 'all' || categoryFilter !== 'All categories') && (
            <button onClick={() => { setStatusFilter('all'); setRoleFilter('all'); setCategoryFilter('All categories') }}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-500 border border-ink-100 px-3 py-2.5 rounded-xl bg-white hover:bg-ink-50 transition-colors"
            >
              <X className="w-3 h-3" /> Clear filters
            </button>
          )}
        </div>

        {/* Ticket list */}
        <div className="space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl py-10 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <button onClick={loadTickets} className="mt-3 text-xs font-medium text-red-600 underline">Retry</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-ink-100 py-16 text-center">
              <HelpCircle className="w-8 h-8 text-ink-200 mx-auto mb-3" />
              <p className="text-sm text-ink-400 font-medium">No tickets match your filters</p>
            </div>
          ) : (
            filtered.map(t => (
              <TicketCard
                key={t.id}
                ticket={t}
                onUpdate={handleUpdate}
                onReviewAction={handleReviewAction}
              />
            ))
          )}
        </div>

        {!loading && !error && (
          <p className="text-center text-xs text-ink-300">
            Showing {filtered.length} ticket{filtered.length !== 1 ? 's' : ''}
          </p>
        )}
      </main>
    </div>
  )
}
