'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search, MessageSquare, Shield, ShieldOff, AlertTriangle,
  Eye, X, Clock, CheckCircle2, Flag, ChevronRight, Lock,
  Unlock, Camera, Users, Filter,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ConvStatus = 'active' | 'frozen' | 'flagged'

interface Message {
  id: number
  senderRole: 'client' | 'photographer'
  senderName: string
  text: string
  time: string
}

interface Conversation {
  id: string
  client: { name: string; initials: string; bg: string }
  photographer: { name: string; initials: string; bg: string; specialty: string }
  status: ConvStatus
  messageCount: number
  lastMessage: string
  lastMessageTime: string
  started: string
  flagReason?: string
  thread: Message[]
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1a2b',
    client:       { name: 'Alex Kim',   initials: 'AK', bg: 'bg-blue-500'  },
    photographer: { name: 'Sarah Chen', initials: 'SC', bg: 'bg-rose-500',  specialty: 'Wedding'   },
    status: 'active',
    messageCount: 14,
    lastMessage: "Sounds perfect — I'll send the contract over.",
    lastMessageTime: '2h ago',
    started: 'May 10, 2026',
    thread: [
      { id: 1, senderRole: 'client',       senderName: 'Alex Kim',   text: "Hi Sarah! I'm planning a wedding for June 14th and would love to discuss your packages.",      time: 'May 10, 9:14 AM' },
      { id: 2, senderRole: 'photographer', senderName: 'Sarah Chen',  text: "Hi Alex! I'd love to help. June 14th is still available. What time does the ceremony start?", time: 'May 10, 10:02 AM' },
      { id: 3, senderRole: 'client',       senderName: 'Alex Kim',   text: "2pm ceremony, reception until 10pm. We're hoping for full-day coverage.",                     time: 'May 10, 10:20 AM' },
      { id: 4, senderRole: 'photographer', senderName: 'Sarah Chen',  text: 'Perfect, my full-day package covers exactly that. Would you like a quote?',                   time: 'May 10, 11:00 AM' },
      { id: 5, senderRole: 'client',       senderName: 'Alex Kim',   text: 'Yes please!',                                                                                  time: 'May 10, 11:05 AM' },
      { id: 6, senderRole: 'photographer', senderName: 'Sarah Chen',  text: "Sounds perfect — I'll send the contract over.",                                               time: 'May 17, 2:30 PM'  },
    ],
  },
  {
    id: 'conv_8f3a',
    client:       { name: 'Mia Santos',   initials: 'MS', bg: 'bg-red-400'    },
    photographer: { name: 'Priya Patel',  initials: 'PP', bg: 'bg-violet-600', specialty: 'Event' },
    status: 'flagged',
    messageCount: 6,
    lastMessage: 'Can we just handle payment through e-transfer to avoid the fee?',
    lastMessageTime: '3h ago',
    started: 'May 15, 2026',
    flagReason: 'Attempted off-platform payment (e-transfer request)',
    thread: [
      { id: 1, senderRole: 'client',       senderName: 'Mia Santos',  text: 'Hi Priya, I saw your portfolio and love your event work.',                    time: 'May 15, 3:10 PM' },
      { id: 2, senderRole: 'photographer', senderName: 'Priya Patel', text: 'Thank you Mia! What kind of event are you planning?',                         time: 'May 15, 3:45 PM' },
      { id: 3, senderRole: 'client',       senderName: 'Mia Santos',  text: 'A corporate dinner for ~80 people on June 3rd.',                              time: 'May 15, 4:00 PM' },
      { id: 4, senderRole: 'photographer', senderName: 'Priya Patel', text: 'That sounds great, my corporate package would suit this well.',               time: 'May 15, 4:30 PM' },
      { id: 5, senderRole: 'client',       senderName: 'Mia Santos',  text: 'Can we just handle payment through e-transfer to avoid the fee?',            time: 'May 17, 11:12 AM' },
      { id: 6, senderRole: 'photographer', senderName: 'Priya Patel', text: "I think we need to go through the platform — that's their policy.",          time: 'May 17, 11:30 AM' },
    ],
  },
  {
    id: 'conv_3c9d',
    client:       { name: 'Dana Torres',   initials: 'DT', bg: 'bg-teal-500'  },
    photographer: { name: 'Marcus Wright', initials: 'MW', bg: 'bg-slate-600', specialty: 'Portrait' },
    status: 'active',
    messageCount: 8,
    lastMessage: "I'll check my availability and get back to you.",
    lastMessageTime: '1d ago',
    started: 'May 12, 2026',
    thread: [
      { id: 1, senderRole: 'client',       senderName: 'Dana Torres',  text: 'Hi Marcus! Looking for a portrait session for my professional headshots.',  time: 'May 12, 10:00 AM' },
      { id: 2, senderRole: 'photographer', senderName: 'Marcus Wright', text: 'Hi Dana! Happy to help. Indoor or outdoor?',                               time: 'May 12, 10:30 AM' },
      { id: 3, senderRole: 'client',       senderName: 'Dana Torres',  text: 'Outdoor would be amazing — maybe the river valley?',                        time: 'May 12, 11:00 AM' },
      { id: 4, senderRole: 'photographer', senderName: 'Marcus Wright', text: "I'll check my availability and get back to you.",                          time: 'May 16, 4:00 PM'  },
    ],
  },
  {
    id: 'conv_5e1f',
    client:       { name: 'Ryan Foster',  initials: 'RF', bg: 'bg-indigo-500' },
    photographer: { name: 'Sofia Reyes', initials: 'SR', bg: 'bg-rose-400',   specialty: 'Newborn' },
    status: 'frozen',
    messageCount: 3,
    lastMessage: 'This thread has been frozen by an admin.',
    lastMessageTime: '5d ago',
    started: 'May 8, 2026',
    thread: [
      { id: 1, senderRole: 'client',       senderName: 'Ryan Foster', text: "Hi, we're expecting in August and would love a newborn session.",            time: 'May 8, 2:00 PM'  },
      { id: 2, senderRole: 'photographer', senderName: 'Sofia Reyes', text: "Congratulations! I'd love to photograph your baby. August sessions are filling up fast.", time: 'May 8, 3:30 PM'  },
      { id: 3, senderRole: 'client',       senderName: 'Ryan Foster', text: "What's your typical turnaround for edited photos?",                          time: 'May 9, 9:00 AM'  },
    ],
  },
  {
    id: 'conv_7g2h',
    client:       { name: 'Luca Romano',  initials: 'LR', bg: 'bg-orange-500' },
    photographer: { name: 'Aisha Patel',  initials: 'AP', bg: 'bg-violet-500', specialty: 'Wedding' },
    status: 'active',
    messageCount: 22,
    lastMessage: 'Looking forward to seeing you both at the venue walkthrough!',
    lastMessageTime: '4h ago',
    started: 'Apr 28, 2026',
    thread: [
      { id: 1, senderRole: 'client',       senderName: 'Luca Romano', text: "Hi Aisha! We're getting married October 12th and your portfolio is stunning.", time: 'Apr 28, 9:00 AM' },
      { id: 2, senderRole: 'photographer', senderName: 'Aisha Patel', text: 'Thank you Luca! October is a beautiful time of year. Is the venue in Edmonton?', time: 'Apr 28, 9:30 AM' },
      { id: 3, senderRole: 'client',       senderName: 'Luca Romano', text: 'Yes — the Hotel Macdonald.',                                                   time: 'Apr 28, 10:00 AM' },
      { id: 4, senderRole: 'photographer', senderName: 'Aisha Patel', text: 'Looking forward to seeing you both at the venue walkthrough!',                 time: 'May 17, 3:00 PM'  },
    ],
  },
]

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ConvStatus }) {
  const s = {
    active:  'bg-emerald-50 text-emerald-700 border-emerald-200',
    frozen:  'bg-blue-50 text-blue-700 border-blue-200',
    flagged: 'bg-red-50 text-red-700 border-red-200',
  }
  const icons = { active: CheckCircle2, frozen: Lock, flagged: Flag }
  const Icon = icons[status]
  return (
    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${s[status]}`}>
      <Icon className="w-2.5 h-2.5" />{status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Thread drawer ────────────────────────────────────────────────────────────

function ThreadDrawer({ conv, onClose, onFreeze, onUnfreeze, onFlag }: {
  conv: Conversation
  onClose: () => void
  onFreeze: (id: string) => void
  onUnfreeze: (id: string) => void
  onFlag: (id: string) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-white flex flex-col shadow-float-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-ink text-sm">{conv.client.name} ↔ {conv.photographer.name}</p>
              <StatusPill status={conv.status} />
            </div>
            <p className="text-xs text-ink-300">ID: {conv.id} · Started {conv.started}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400 hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flag reason */}
        {conv.flagReason && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            <Flag className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-800">Flag reason</p>
              <p className="text-xs text-red-600">{conv.flagReason}</p>
            </div>
          </div>
        )}

        {/* Frozen notice */}
        {conv.status === 'frozen' && (
          <div className="mx-5 mt-4 flex items-start gap-2.5 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
            <Lock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">This conversation is frozen. Neither party can send messages.</p>
          </div>
        )}

        {/* Thread — read-only */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          <p className="text-[10px] text-ink-300 uppercase tracking-widest text-center mb-4">Read-only view</p>
          {conv.thread.map(msg => {
            const isClient = msg.senderRole === 'client'
            const person = isClient ? conv.client : conv.photographer
            return (
              <div key={msg.id} className={`flex gap-2 ${isClient ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`w-7 h-7 rounded-full ${person.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-1`}>
                  {person.initials}
                </div>
                <div className={`max-w-[72%] ${isClient ? '' : ''}`}>
                  <p className={`text-[10px] font-semibold text-ink-400 mb-1 ${isClient ? 'ml-1' : 'mr-1 text-right'}`}>{msg.senderName}</p>
                  <div className={`rounded-2xl px-4 py-2.5 ${isClient ? 'bg-ink-50 text-ink rounded-bl-sm' : 'bg-ink text-white rounded-br-sm'}`}>
                    <p className="text-sm leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 ${isClient ? 'text-ink-300' : 'text-ink-300'}`}>{msg.time}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Admin actions */}
        <div className="border-t border-ink-50 px-5 py-4 flex items-center gap-2 flex-shrink-0">
          <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest mr-1">Admin</span>
          {conv.status === 'frozen' ? (
            <button onClick={() => { onUnfreeze(conv.id); onClose() }}
              className="flex items-center gap-1.5 text-xs font-semibold bg-blue-500 text-white px-3 py-2 rounded-xl hover:bg-blue-600 transition-colors">
              <Unlock className="w-3.5 h-3.5" /> Unfreeze
            </button>
          ) : (
            <button onClick={() => { onFreeze(conv.id); onClose() }}
              className="flex items-center gap-1.5 text-xs font-semibold border border-blue-200 text-blue-700 bg-blue-50 px-3 py-2 rounded-xl hover:bg-blue-100 transition-colors">
              <Lock className="w-3.5 h-3.5" /> Freeze thread
            </button>
          )}
          {conv.status !== 'flagged' && (
            <button onClick={() => { onFlag(conv.id); onClose() }}
              className="flex items-center gap-1.5 text-xs font-semibold border border-red-200 text-red-600 bg-red-50 px-3 py-2 rounded-xl hover:bg-red-100 transition-colors">
              <Flag className="w-3.5 h-3.5" /> Flag
            </button>
          )}
          {conv.status === 'flagged' && (
            <button onClick={() => { onFreeze(conv.id); onClose() }}
              className="flex items-center gap-1.5 text-xs font-semibold bg-ink text-white px-3 py-2 rounded-xl hover:bg-ink-800 transition-colors">
              <Lock className="w-3.5 h-3.5" /> Freeze & resolve
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
  const [conversations, setConversations] = useState<Conversation[]>(SEED_CONVERSATIONS)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [openConv, setOpenConv] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function freeze(id: string) {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'frozen' } : c))
    showToast('Conversation frozen')
  }
  function unfreeze(id: string) {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'active' } : c))
    showToast('Conversation unfrozen')
  }
  function flag(id: string) {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, status: 'flagged', flagReason: 'Manually flagged by admin' } : c))
    showToast('Conversation flagged')
  }

  const filtered = conversations.filter(c => {
    const q = search.toLowerCase()
    const matchQ = !q || c.client.name.toLowerCase().includes(q) || c.photographer.name.toLowerCase().includes(q) || c.id.includes(q)
    const matchS = statusFilter === 'all' || c.status === statusFilter
    return matchQ && matchS
  })

  const activeConv = conversations.find(c => c.id === openConv)

  const counts = {
    active:  conversations.filter(c => c.status === 'active').length,
    flagged: conversations.filter(c => c.status === 'flagged').length,
    frozen:  conversations.filter(c => c.status === 'frozen').length,
  }

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
            <span className="text-sm font-semibold text-ink-500">Conversations</span>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { href: '/admin', label: 'Dashboard' },
              { href: '/admin/accounts', label: 'Accounts' },
              { href: '/admin/conversations', label: 'Conversations' },
              { href: '/admin/trust-health', label: 'Trust health' },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  n.href === '/admin/conversations' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                }`}
              >{n.label}</Link>
            ))}
          </nav>
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">A</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">Conversation browser</h1>
          <p className="text-sm text-ink-300">{conversations.length} total · read-only</p>
        </div>

        {/* Summary pills */}
        <div className="flex gap-3">
          {[
            { key: 'all',     label: `All (${conversations.length})`, color: 'bg-white border-ink-100 text-ink-500' },
            { key: 'active',  label: `Active (${counts.active})`,      color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
            { key: 'flagged', label: `Flagged (${counts.flagged})`,    color: 'bg-red-50 border-red-200 text-red-700' },
            { key: 'frozen',  label: `Frozen (${counts.frozen})`,      color: 'bg-blue-50 border-blue-200 text-blue-700' },
          ].map(s => (
            <button key={s.key} onClick={() => setStatusFilter(s.key as StatusFilter)}
              className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
                statusFilter === s.key ? s.color + ' shadow-sm' : 'bg-white border-ink-100 text-ink-400 hover:text-ink'
              }`}
            >{s.label}</button>
          ))}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or ID…"
            className="w-full border border-ink-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all bg-white"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          <div className="grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-ink-50 bg-ink-50">
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Client</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Photographer</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Status</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Last message</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">View</span>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center text-ink-300 text-sm">No conversations match your filters.</div>
          ) : (
            <div className="divide-y divide-ink-50">
              {filtered.map(conv => (
                <div key={conv.id} className={`grid grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center transition-colors ${
                  conv.status === 'flagged' ? 'bg-red-50/40 hover:bg-red-50' : 'hover:bg-ink-50'
                }`}>
                  {/* Client */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full ${conv.client.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {conv.client.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{conv.client.name}</p>
                      <p className="text-[10px] text-ink-300">Client</p>
                    </div>
                  </div>

                  {/* Photographer */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-8 h-8 rounded-full ${conv.photographer.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {conv.photographer.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{conv.photographer.name}</p>
                      <p className="text-[10px] text-ink-300">{conv.photographer.specialty}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1">
                    <StatusPill status={conv.status} />
                    {conv.status === 'flagged' && conv.flagReason && (
                      <p className="text-[10px] text-red-500 leading-snug">{conv.flagReason.substring(0, 32)}…</p>
                    )}
                  </div>

                  {/* Last message */}
                  <div>
                    <p className="text-xs text-ink-400 truncate max-w-[160px]">{conv.lastMessage}</p>
                    <p className="text-[10px] text-ink-300">{conv.lastMessageTime}</p>
                  </div>

                  {/* View */}
                  <button onClick={() => setOpenConv(conv.id)}
                    className="flex items-center gap-1.5 text-xs font-medium border border-ink-100 text-ink-500 px-3 py-1.5 rounded-lg hover:bg-ink-50 hover:text-ink transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-300">Showing {filtered.length} of {conversations.length} conversations</p>
      </main>

      {/* Thread drawer */}
      {openConv && activeConv && (
        <ThreadDrawer
          conv={activeConv}
          onClose={() => setOpenConv(null)}
          onFreeze={freeze}
          onUnfreeze={unfreeze}
          onFlag={flag}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm font-medium px-5 py-3 rounded-full shadow-float">
          {toast}
        </div>
      )}
    </div>
  )
}
