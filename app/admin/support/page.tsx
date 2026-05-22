'use client'

import { useState } from 'react'
import { PLATFORM_CONFIG } from '@/lib/platform-config'
import Link from 'next/link'
import {
  HelpCircle, Search, Filter, CheckCircle2, Clock, AlertTriangle,
  X, ChevronDown, ChevronUp, Send, Camera, Users, Tag,
  MessageSquare, ArrowRight, Circle,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

// Matches DBML support_ticket_status enum
type TicketStatus = 'open' | 'in_review' | 'resolved' | 'closed'
type TicketRole   = 'client' | 'photographer'
// Matches DBML support_ticket_category enum
type TicketCategory = 'fake_review' | 'inappropriate_content' | 'spam_report' | 'billing_dispute' | 'account_issue' | 'other'

interface Ticket {
  id: string
  submittedBy: string
  initials: string
  bg: string
  role: TicketRole
  category: TicketCategory
  subject: string
  message: string
  submittedAt: string
  status: TicketStatus
  adminReply: string
  resolvedAt?: string
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_TICKETS: Ticket[] = [
  {
    id: 'tkt_001',
    submittedBy: 'Alex Kim',
    initials: 'AK',
    bg: 'bg-blue-500',
    role: 'client',
    category: 'other',
    subject: 'Booking request no response after 3 days',
    message: "I submitted a booking request to Sarah Chen 3 days ago but haven't heard back. The time slot still shows as tentative. Can you check what's happening?",
    submittedAt: 'May 15, 2026 · 11:32 AM',
    status: 'open',
    adminReply: '',
  },
  {
    id: 'tkt_002',
    submittedBy: 'Priya Patel',
    initials: 'PP',
    bg: 'bg-violet-600',
    role: 'photographer',
    category: 'account_issue',
    subject: 'Trust score not reflecting Google reviews',
    message: "My Google reviews are showing 4.8 stars with 42 reviews but my trust score on the platform shows 3.9. Something seems off with the sync. Last sync was 2 days ago.",
    submittedAt: 'May 14, 2026 · 3:18 PM',
    status: 'in_review',
    adminReply: "Hi Priya, we've identified an issue with the Google sync for accounts linked after April 30. We're running a manual re-sync and your score should update within 24 hours.",
  },
  {
    id: 'tkt_003',
    submittedBy: 'Dana Torres',
    initials: 'DT',
    bg: 'bg-teal-500',
    role: 'client',
    category: 'billing_dispute',
    subject: 'Photographer requested direct e-transfer payment',
    message: "The photographer I booked asked me to pay them directly via e-transfer instead of through the platform. I wasn't sure if that was allowed so I wanted to flag it.",
    submittedAt: 'May 13, 2026 · 8:50 AM',
    status: 'resolved',
    adminReply: "Thank you for flagging this Dana. All payments must go through TrueNorth Frames — this protects both you and the photographer. We've sent a reminder to the photographer and the booking is still valid. Please proceed through the platform.",
    resolvedAt: 'May 13, 2026 · 2:45 PM',
  },
  {
    id: 'tkt_004',
    submittedBy: 'Marcus Wright',
    initials: 'MW',
    bg: 'bg-slate-600',
    role: 'photographer',
    category: 'account_issue',
    subject: 'Still locked out after password reset',
    message: "I reset my password yesterday but I'm still getting locked out. The reset email arrives fine but after I set the new password it says invalid credentials on the next login.",
    submittedAt: 'May 12, 2026 · 6:10 PM',
    status: 'resolved',
    adminReply: "Hi Marcus, this was caused by a cached session token. We've cleared it on our end. Please try logging in again — it should work now. Let us know if you have any trouble.",
    resolvedAt: 'May 12, 2026 · 7:22 PM',
  },
  {
    id: 'tkt_005',
    submittedBy: 'Luca Romano',
    initials: 'LR',
    bg: 'bg-orange-500',
    role: 'client',
    category: 'other',
    subject: 'Can I message multiple photographers for same date?',
    message: "Is it possible to message two photographers at the same time about the same date? I want to compare availability before committing. Or does messaging one lock me in?",
    submittedAt: 'May 17, 2026 · 9:05 AM',
    status: 'open',
    adminReply: '',
  },
  {
    id: 'tkt_006',
    submittedBy: 'Sofia Reyes',
    initials: 'SR',
    bg: 'bg-rose-400',
    role: 'photographer',
    category: 'account_issue',
    subject: 'Profile not appearing in search results',
    message: "My profile isn't showing up when I search for 'newborn photographer Edmonton'. I've had it live for 2 weeks. Is there a delay or something I'm missing in my profile?",
    submittedAt: 'May 16, 2026 · 1:44 PM',
    status: 'in_review',
    adminReply: "Hi Sofia, your profile is indexed but the search ranking is weighted partly by trust score and completeness. Your profile is at 72% — adding your Google URL would push it to 87% and should significantly improve your position.",
  },
  {
    id: 'tkt_007',
    submittedBy: 'Alex Kim',
    initials: 'AK',
    bg: 'bg-blue-500',
    role: 'client',
    category: 'spam_report',
    subject: 'Photographer sending repeated unsolicited messages',
    message: "Ben Nakamura has sent me 6 messages in the last hour advertising his packages even though I never contacted him. This feels like spam.",
    submittedAt: 'May 17, 2026 · 4:30 PM',
    status: 'open',
    adminReply: '',
  },
]

// Display labels for DBML category enum values
const CATEGORY_LABELS: Record<TicketCategory, string> = {
  fake_review:           'Fake review',
  inappropriate_content: 'Inappropriate content',
  spam_report:           'Spam report',
  billing_dispute:       'Billing dispute',
  account_issue:         'Account issue',
  other:                 'Other',
}

const CATEGORIES = ['All categories', ...Object.values(CATEGORY_LABELS)]

// ─── Status helpers ───────────────────────────────────────────────────────────

function statusStyle(s: TicketStatus) {
  return {
    open:      { pill: 'bg-amber-50 text-amber-700 border-amber-200',       dot: 'bg-amber-400',   label: 'Open',      icon: Clock         },
    in_review: { pill: 'bg-blue-50 text-blue-700 border-blue-200',          dot: 'bg-blue-400',    label: 'In review', icon: MessageSquare },
    resolved:  { pill: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Resolved',  icon: CheckCircle2  },
    closed:    { pill: 'bg-ink-50 text-ink-400 border-ink-200',             dot: 'bg-ink-300',     label: 'Closed',    icon: X             },
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

// ─── Ticket card ──────────────────────────────────────────────────────────────

function TicketCard({ ticket, onUpdate }: {
  ticket: Ticket
  onUpdate: (id: string, reply: string, status: TicketStatus) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [reply, setReply] = useState(ticket.adminReply)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save(status: TicketStatus) {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    onUpdate(ticket.id, reply, status)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); setExpanded(false) }, 1200)
  }

  const s = statusStyle(ticket.status)

  return (
    <div className={`bg-white rounded-2xl border overflow-hidden transition-all ${
      ticket.status === 'open'      ? 'border-amber-200' :
      ticket.status === 'in_review' ? 'border-blue-200'  : 'border-ink-100'
    }`}>
      {/* Header row */}
      <button className="w-full flex items-start gap-4 px-6 py-4 text-left hover:bg-ink-50/50 transition-colors" onClick={() => setExpanded(e => !e)}>
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full ${ticket.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5`}>
          {ticket.initials}
        </div>

        {/* Meta */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-ink">{ticket.submittedBy}</p>
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
              ticket.role === 'photographer' ? 'bg-violet-50 text-violet-600 border border-violet-200' : 'bg-blue-50 text-blue-600 border border-blue-200'
            }`}>
              {ticket.role === 'photographer' ? 'Photographer' : 'Client'}
            </span>
            <span className="text-[10px] font-medium bg-ink-50 text-ink-400 border border-ink-100 px-1.5 py-0.5 rounded-full">{CATEGORY_LABELS[ticket.category]}</span>
            <StatusPill status={ticket.status} />
          </div>
          <p className="text-xs text-ink-500 line-clamp-1">{ticket.message}</p>
          <p className="text-[10px] text-ink-300 mt-1">{ticket.submittedAt}</p>
        </div>

        {expanded ? <ChevronUp className="w-4 h-4 text-ink-300 flex-shrink-0 mt-1" /> : <ChevronDown className="w-4 h-4 text-ink-300 flex-shrink-0 mt-1" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-ink-50 px-6 py-5 space-y-4">
          {/* Full message */}
          <div className="bg-ink-50 rounded-xl p-4">
            <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-2">User message</p>
            <p className="text-sm text-ink-600 leading-relaxed">{ticket.message}</p>
          </div>

          {/* Reply box */}
          <div>
            <label className="block text-xs font-semibold text-ink mb-2">Admin reply</label>
            <div className="relative">
              <textarea
                value={reply}
                onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_ticket_resolution_note_length) setReply(e.target.value) }}
                maxLength={PLATFORM_CONFIG.max_ticket_resolution_note_length}
                placeholder="Write your reply to the user…"
                rows={4}
                className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
              />
              {reply.length > PLATFORM_CONFIG.max_ticket_resolution_note_length - 100 && (
                <span className={`absolute bottom-2 right-3 text-[10px] ${reply.length >= PLATFORM_CONFIG.max_ticket_resolution_note_length ? 'text-red-500' : 'text-amber-500'}`}>
                  {reply.length}/{PLATFORM_CONFIG.max_ticket_resolution_note_length}
                </span>
              )}
            </div>
          </div>

          {/* Action buttons */}
          {saved ? (
            <div className="flex items-center gap-2 text-emerald-600 text-sm font-medium">
              <CheckCircle2 className="w-4 h-4" /> Saved successfully
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              {ticket.status !== 'resolved' && (
                <button onClick={() => save('resolved')} disabled={saving || !reply.trim()}
                  className="flex items-center gap-2 text-sm font-semibold bg-emerald-600 text-white px-4 py-2.5 rounded-xl hover:bg-emerald-700 disabled:opacity-40 transition-all"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Reply & resolve'}
                </button>
              )}
              {ticket.status === 'open' && (
                <button onClick={() => save('in_review')} disabled={saving}
                  className="flex items-center gap-2 text-sm font-semibold border border-blue-200 bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 disabled:opacity-40 transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Mark in review'}
                </button>
              )}
              {ticket.status === 'resolved' && (
                <button onClick={() => save('open')} disabled={saving}
                  className="flex items-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 px-4 py-2.5 rounded-xl hover:bg-ink-50 transition-all"
                >
                  Reopen ticket
                </button>
              )}
              <button onClick={() => { setExpanded(false); setReply(ticket.adminReply) }}
                className="text-sm font-medium text-ink-400 px-4 py-2.5 rounded-xl hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {ticket.resolvedAt && (
            <p className="text-[10px] text-ink-300">Resolved {ticket.resolvedAt}</p>
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
  const [tickets, setTickets] = useState<Ticket[]>(SEED_TICKETS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('All categories')

  function updateTicket(id: string, reply: string, status: TicketStatus) {
    setTickets(prev => prev.map(t => t.id === id
      ? { ...t, adminReply: reply, status, resolvedAt: status === 'resolved' ? 'Just now' : t.resolvedAt }
      : t
    ))
  }

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase()
    const matchQ = !q || t.submittedBy.toLowerCase().includes(q) || t.message.toLowerCase().includes(q) || t.subject.toLowerCase().includes(q) || CATEGORY_LABELS[t.category].toLowerCase().includes(q)
    const matchS = statusFilter === 'all' || t.status === statusFilter
    const matchR = roleFilter === 'all' || t.role === roleFilter
    const matchC = categoryFilter === 'All categories' || CATEGORY_LABELS[t.category] === categoryFilter
    return matchQ && matchS && matchR && matchC
  })

  const counts = {
    open:      tickets.filter(t => t.status === 'open').length,
    in_review: tickets.filter(t => t.status === 'in_review').length,
    resolved:  tickets.filter(t => t.status === 'resolved').length,
    closed:    tickets.filter(t => t.status === 'closed').length,
  }

  const NAV = [
    { href: '/admin',          label: 'Dashboard'    },
    { href: '/admin/analytics', label: 'Analytics'   },
    { href: '/admin/accounts', label: 'Accounts'     },
    { href: '/admin/support',  label: 'Support'      },
    { href: '/admin/trust-health', label: 'Trust health' },
  ]

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Nav */}
      <header className="bg-white border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="font-serif font-bold text-ink text-lg">TrueNorth</Link>
            <span className="text-ink-200 text-lg">/</span>
            <Link href="/admin" className="text-sm font-medium text-ink-400 hover:text-ink transition-colors">Admin</Link>
            <span className="text-ink-200 text-lg">/</span>
            <span className="text-sm font-semibold text-ink-500">Support</span>
          </div>
          <nav className="flex items-center gap-1">
            {NAV.map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  n.href === '/admin/support' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                }`}
              >
                {n.label}
                {n.href === '/admin/support' && counts.open > 0 && (
                  <span className="ml-1.5 bg-amber-400 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{counts.open}</span>
                )}
              </Link>
            ))}
          </nav>
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">A</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink">User support</h1>
            <p className="text-sm text-ink-300 mt-0.5">{tickets.length} total tickets · submitted via client & photographer dashboards</p>
          </div>
        </div>

        {/* Status summary cards */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { key: 'open',      label: 'Open',      value: counts.open,      color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',    icon: Clock         },
            { key: 'in_review', label: 'In review', value: counts.in_review, color: 'text-blue-600',    bg: 'bg-blue-50 border-blue-200',      icon: MessageSquare },
            { key: 'resolved',  label: 'Resolved',  value: counts.resolved,  color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2  },
            { key: 'closed',    label: 'Closed',    value: counts.closed,    color: 'text-ink-400',     bg: 'bg-ink-50 border-ink-200',         icon: X             },
          ].map(s => (
            <button key={s.key} onClick={() => setStatusFilter(statusFilter === s.key ? 'all' : s.key as StatusFilter)}
              className={`flex items-center gap-4 p-5 rounded-2xl border transition-all hover:opacity-90 ${
                statusFilter === s.key ? s.bg : 'bg-white border-ink-100'
              }`}
            >
              <s.icon className={`w-5 h-5 flex-shrink-0 ${s.color}`} />
              <div className="text-left">
                <p className={`text-2xl font-bold ${statusFilter === s.key ? s.color : 'text-ink'}`}>{s.value}</p>
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
              placeholder="Search by name, message, or category…"
              className="w-full border border-ink-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all bg-white"
            />
          </div>

          <div className="flex gap-1 bg-white border border-ink-100 p-1 rounded-xl">
            {(['all', 'client', 'photographer'] as ('all' | RoleFilter)[]).map(r => (
              <button key={r} onClick={() => setRoleFilter(r as RoleFilter)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all capitalize ${
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
          {filtered.length === 0 ? (
            <div className="bg-white rounded-2xl border border-ink-100 py-16 text-center">
              <HelpCircle className="w-8 h-8 text-ink-200 mx-auto mb-3" />
              <p className="text-sm text-ink-400 font-medium">No tickets match your filters</p>
            </div>
          ) : (
            filtered.map(t => <TicketCard key={t.id} ticket={t} onUpdate={updateTicket} />)
          )}
        </div>

        <p className="text-center text-xs text-ink-300">Showing {filtered.length} of {tickets.length} tickets</p>
      </main>
    </div>
  )
}
