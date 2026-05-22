'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search, Filter, ChevronDown, MoreHorizontal, Shield,
  Camera, Users, Ban, AlertTriangle, CheckCircle2, Clock,
  Eye, X, Star, Globe, Instagram, MessageSquare, Trash2,
  UserX, RefreshCw,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Role = 'client' | 'photographer'
// Matches DBML account_status enum: active | suspended | banned | deactivated
type AccountStatus = 'active' | 'suspended' | 'banned' | 'deactivated'
// Matches DBML photographer_profile_status enum — only relevant for photographers
type ProfileStatus = 'draft' | 'pending' | 'approved' | 'suspended' | 'banned'

interface Account {
  id: string
  name: string
  email: string
  role: Role
  status: AccountStatus
  profileStatus?: ProfileStatus  // photographer only — profile approval lifecycle
  joined: string
  lastSeen: string
  initials: string
  bg: string
  // photographer extras
  specialty?: string
  trustScore?: number
  area?: string
  googleLinked?: boolean
  instagramLinked?: boolean
  messageCount?: number
  // moderation
  flagCount: number
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_ACCOUNTS: Account[] = [
  { id: 'a1',  name: 'Sarah Chen',      email: 'sarah@example.com',   role: 'photographer', status: 'active',    joined: 'Apr 2, 2026',  lastSeen: '2h ago',      initials: 'SC', bg: 'bg-rose-500',    specialty: 'Wedding',    trustScore: 4.8, area: 'Strathcona',  googleLinked: true,  instagramLinked: true,  messageCount: 42, flagCount: 0 },
  { id: 'a2',  name: 'Marcus Wright',   email: 'marcus@example.com',  role: 'photographer', status: 'active',    joined: 'Mar 18, 2026', lastSeen: '1d ago',      initials: 'MW', bg: 'bg-slate-600',   specialty: 'Portrait',   trustScore: 4.5, area: 'Oliver',      googleLinked: true,  instagramLinked: false, messageCount: 31, flagCount: 0 },
  { id: 'a3',  name: 'Jordan Lee',      email: 'jordan@example.com',  role: 'photographer', status: 'active', profileStatus: 'pending',   joined: 'May 15, 2026', lastSeen: 'Just now',    initials: 'JL', bg: 'bg-emerald-600', specialty: 'Family',     trustScore: 3.9, area: 'West End',    googleLinked: false, instagramLinked: true,  messageCount: 0,  flagCount: 0 },
  { id: 'a4',  name: 'Sofia Reyes',     email: 'sofia@example.com',   role: 'photographer', status: 'active',    joined: 'Feb 28, 2026', lastSeen: '3d ago',      initials: 'SR', bg: 'bg-rose-400',    specialty: 'Newborn',    trustScore: 4.2, area: 'Windermere',  googleLinked: true,  instagramLinked: true,  messageCount: 18, flagCount: 0 },
  { id: 'a5',  name: 'Ben Nakamura',    email: 'ben@example.com',     role: 'photographer', status: 'suspended', joined: 'Jan 10, 2026', lastSeen: '12d ago',     initials: 'BN', bg: 'bg-amber-600',   specialty: 'Corporate',  trustScore: 2.8, area: 'Glenora',     googleLinked: false, instagramLinked: false, messageCount: 7,  flagCount: 3 },
  { id: 'a6',  name: 'Priya Patel',     email: 'priya@example.com',   role: 'photographer', status: 'active',    joined: 'Mar 5, 2026',  lastSeen: '5h ago',      initials: 'PP', bg: 'bg-violet-600',  specialty: 'Event',      trustScore: 4.0, area: 'Downtown',    googleLinked: true,  instagramLinked: false, messageCount: 24, flagCount: 1 },
  { id: 'a7',  name: 'Alex Kim',        email: 'alex@example.com',    role: 'client',       status: 'active',    joined: 'Apr 14, 2026', lastSeen: '1h ago',      initials: 'AK', bg: 'bg-blue-500',                                                                                                                                         messageCount: 8,  flagCount: 0 },
  { id: 'a8',  name: 'Dana Torres',     email: 'dana@example.com',    role: 'client',       status: 'active',    joined: 'May 1, 2026',  lastSeen: '30m ago',     initials: 'DT', bg: 'bg-teal-500',                                                                                                                                         messageCount: 3,  flagCount: 0 },
  { id: 'a9',  name: 'Ryan Foster',     email: 'ryan@example.com',    role: 'client',       status: 'active',    joined: 'May 10, 2026', lastSeen: 'Just now',    initials: 'RF', bg: 'bg-indigo-500',                                                                                                                                        messageCount: 1,  flagCount: 0 },
  { id: 'a10', name: 'Mia Santos',      email: 'mia@example.com',     role: 'client',       status: 'banned',    joined: 'Mar 22, 2026', lastSeen: '20d ago',     initials: 'MS', bg: 'bg-red-400',                                                                                                                                          messageCount: 0,  flagCount: 5 },
  { id: 'a11', name: 'Luca Romano',     email: 'luca@example.com',    role: 'client',       status: 'active',    joined: 'Apr 28, 2026', lastSeen: '2d ago',      initials: 'LR', bg: 'bg-orange-500',                                                                                                                                       messageCount: 12, flagCount: 0 },
  { id: 'a12', name: 'Aisha Patel',     email: 'aisha@example.com',   role: 'photographer', status: 'active',    joined: 'Feb 10, 2026', lastSeen: '4h ago',      initials: 'AP', bg: 'bg-violet-500',  specialty: 'Wedding',    trustScore: 4.6, area: 'Downtown',    googleLinked: true,  instagramLinked: true,  messageCount: 55, flagCount: 0 },
]

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({ status, profileStatus }: { status: AccountStatus; profileStatus?: ProfileStatus }) {
  const accountStyles: Record<AccountStatus, string> = {
    active:      'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspended:   'bg-orange-50 text-orange-700 border-orange-200',
    banned:      'bg-red-50 text-red-700 border-red-200',
    deactivated: 'bg-ink-50 text-ink-400 border-ink-200',
  }
  // Profile pending overrides the account active pill for photographers awaiting approval
  if (profileStatus === 'pending') {
    return <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200">Profile pending</span>
  }
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${accountStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

// ─── Action menu ──────────────────────────────────────────────────────────────

function ActionMenu({ account, onAction }: {
  account: Account
  onAction: (id: string, action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'delete') => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)} className="p-1.5 rounded-lg hover:bg-ink-50 text-ink-400 hover:text-ink transition-colors">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-ink-100 rounded-xl shadow-float w-44 py-1.5 overflow-hidden">
            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-ink-50 transition-colors">
              <Eye className="w-3.5 h-3.5 text-ink-400" /> View profile
            </button>
            <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-ink hover:bg-ink-50 transition-colors">
              <MessageSquare className="w-3.5 h-3.5 text-ink-400" /> View messages
            </button>
            <div className="h-px bg-ink-50 my-1" />
            {account.status === 'suspended' ? (
              <button onClick={() => { onAction(account.id, 'unsuspend'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Reinstate
              </button>
            ) : account.status !== 'banned' ? (
              <button onClick={() => { onAction(account.id, 'suspend'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                <AlertTriangle className="w-3.5 h-3.5" /> Suspend
              </button>
            ) : null}
            {account.status === 'banned' ? (
              <button onClick={() => { onAction(account.id, 'unban'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors">
                <CheckCircle2 className="w-3.5 h-3.5" /> Unban
              </button>
            ) : (
              <button onClick={() => { onAction(account.id, 'ban'); setOpen(false) }}
                className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                <Ban className="w-3.5 h-3.5" /> Ban account
              </button>
            )}
            <div className="h-px bg-ink-50 my-1" />
            <button onClick={() => { onAction(account.id, 'delete'); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
              <Trash2 className="w-3.5 h-3.5" /> Delete account
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Confirm modal ────────────────────────────────────────────────────────────

type PendingAction = { id: string; action: 'suspend' | 'unsuspend' | 'ban' | 'unban' | 'delete' }

function ConfirmModal({ pending, accounts, onConfirm, onCancel }: {
  pending: PendingAction
  accounts: Account[]
  onConfirm: () => void
  onCancel: () => void
}) {
  const account = accounts.find(a => a.id === pending.id)
  if (!account) return null

  const CONFIG = {
    suspend:   { title: 'Suspend account',   body: `${account.name}'s account will be temporarily disabled. They can no longer log in until reinstated.`, cta: 'Suspend', danger: false },
    unsuspend: { title: 'Reinstate account', body: `${account.name}'s account will be restored to active status.`, cta: 'Reinstate', danger: false },
    ban:       { title: 'Permanently ban',   body: `${account.name}'s account will be permanently banned. This cannot be undone without admin action.`, cta: 'Ban permanently', danger: true },
    unban:     { title: 'Lift ban',          body: `${account.name}'s account will be restored to active status.`, cta: 'Lift ban', danger: false },
    delete:    { title: 'Delete account',    body: `This will permanently delete ${account.name}'s account and all associated data. This cannot be undone.`, cta: 'Delete permanently', danger: true },
  }
  const cfg = CONFIG[pending.action]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-float-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
          <p className="font-semibold text-ink">{cfg.title}</p>
          <button onClick={onCancel} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-ink-500 leading-relaxed">{cfg.body}</p>
        </div>
        <div className="px-5 py-4 border-t border-ink-50 flex gap-3">
          <button onClick={onCancel} className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 text-ink-400 transition-colors">Cancel</button>
          <button onClick={onConfirm}
            className={`flex-1 text-sm font-semibold rounded-xl py-2.5 transition-colors ${
              cfg.danger ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-ink text-white hover:bg-ink-800'
            }`}
          >{cfg.cta}</button>
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type RoleFilter = 'all' | 'client' | 'photographer'
type StatusFilter = 'all' | 'active' | 'profile_pending' | 'suspended' | 'banned'

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(SEED_ACCOUNTS)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  function filtered() {
    return accounts.filter(a => {
      const q = search.toLowerCase()
      const matchSearch = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q)
      const matchRole = roleFilter === 'all' || a.role === roleFilter
      const matchStatus =
        statusFilter === 'all'             ? true :
        statusFilter === 'profile_pending' ? a.profileStatus === 'pending' :
        a.status === statusFilter
      return matchSearch && matchRole && matchStatus
    })
  }

  function handleAction(id: string, action: PendingAction['action']) {
    setPendingAction({ id, action })
  }

  function confirmAction() {
    if (!pendingAction) return
    const { id, action } = pendingAction

    setAccounts(prev => prev.map(a => {
      if (a.id !== id) return a
      if (action === 'suspend')   return { ...a, status: 'suspended' as AccountStatus }
      if (action === 'unsuspend') return { ...a, status: 'active'    as AccountStatus }
      if (action === 'ban')       return { ...a, status: 'banned'    as AccountStatus }
      if (action === 'unban')     return { ...a, status: 'active'    as AccountStatus }
      return a
    }).filter(a => {
      if (pendingAction.action === 'delete' && a.id === id) return false
      return true
    }))

    const labels: Record<string, string> = {
      suspend: 'Account suspended', unsuspend: 'Account reinstated',
      ban: 'Account permanently banned', unban: 'Ban lifted',
      delete: 'Account deleted',
    }
    setToast(labels[action])
    setTimeout(() => setToast(null), 3000)
    setPendingAction(null)
  }

  const list = filtered()
  const totals = {
    active:         accounts.filter(a => a.status === 'active' && a.profileStatus !== 'pending').length,
    profile_pending: accounts.filter(a => a.profileStatus === 'pending').length,
    suspended:      accounts.filter(a => a.status === 'suspended').length,
    banned:         accounts.filter(a => a.status === 'banned').length,
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
            <span className="text-sm font-semibold text-ink-500">Accounts</span>
          </div>
          <nav className="flex items-center gap-1">
            {[
              { href: '/admin', label: 'Dashboard' },
              { href: '/admin/accounts', label: 'Accounts' },
              { href: '/admin/support', label: 'Support' },
              { href: '/admin/trust-health', label: 'Trust health' },
            ].map(n => (
              <Link key={n.href} href={n.href}
                className={`text-sm px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  n.href === '/admin/accounts' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-50'
                }`}
              >{n.label}</Link>
            ))}
          </nav>
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center text-white text-xs font-bold">A</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-6">

        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-ink">Account manager</h1>
          <span className="text-sm text-ink-300">{accounts.length} total accounts</span>
        </div>

        {/* Status summary */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Active',          key: 'active',          value: totals.active,          color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle2 },
            { label: 'Profile pending', key: 'profile_pending', value: totals.profile_pending, color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-200',     icon: Clock        },
            { label: 'Suspended',       key: 'suspended',       value: totals.suspended,       color: 'text-orange-600',  bg: 'bg-orange-50 border-orange-200',   icon: UserX        },
            { label: 'Banned',          key: 'banned',          value: totals.banned,          color: 'text-red-600',     bg: 'bg-red-50 border-red-200',         icon: Ban          },
          ].map(s => (
            <button key={s.label} onClick={() => setStatusFilter(s.key as StatusFilter)}
              className={`flex items-center gap-3 p-4 rounded-2xl border transition-all hover:opacity-90 ${
                statusFilter === s.key ? s.bg : 'bg-white border-ink-100'
              }`}
            >
              <s.icon className={`w-4 h-4 flex-shrink-0 ${s.color}`} />
              <div className="text-left">
                <p className={`text-xl font-bold ${statusFilter === s.key ? s.color : 'text-ink'}`}>{s.value}</p>
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
              placeholder="Search name or email…"
              className="w-full border border-ink-100 rounded-xl pl-10 pr-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all bg-white"
            />
          </div>

          <div className="flex gap-1 bg-white border border-ink-100 p-1 rounded-xl">
            {(['all', 'client', 'photographer'] as RoleFilter[]).map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all capitalize ${
                  roleFilter === r ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'
                }`}
              >
                {r === 'all' ? 'All roles' : r === 'client' ? 'Clients' : 'Photographers'}
              </button>
            ))}
          </div>

          {statusFilter !== 'all' && (
            <button onClick={() => setStatusFilter('all')}
              className="flex items-center gap-1.5 text-xs font-medium text-ink-500 border border-ink-100 px-3 py-2 rounded-xl bg-white hover:bg-ink-50 transition-colors"
            >
              <X className="w-3 h-3" /> Clear filter
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          {/* Header */}
          <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-ink-50 bg-ink-50">
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Account</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Email</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Role</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Status</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Joined</span>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Actions</span>
          </div>

          {list.length === 0 ? (
            <div className="py-16 text-center text-ink-300 text-sm">No accounts match your filters.</div>
          ) : (
            <div className="divide-y divide-ink-50">
              {list.map(a => (
                <div key={a.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-ink-50 transition-colors">
                  {/* Name + avatar */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-full ${a.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                      {a.initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{a.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {a.role === 'photographer' && a.trustScore !== undefined && (
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-medium">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />{a.trustScore}
                          </span>
                        )}
                        {a.role === 'photographer' && a.googleLinked && <Globe className="w-3 h-3 text-blue-400" />}
                        {a.role === 'photographer' && a.instagramLinked && <Instagram className="w-3 h-3 text-pink-400" />}
                        {a.flagCount > 0 && (
                          <span className="text-[10px] text-red-500 font-medium flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />{a.flagCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs text-ink-400 truncate">{a.email}</span>

                  <div className="flex items-center gap-1.5">
                    {a.role === 'photographer' ? (
                      <><Camera className="w-3.5 h-3.5 text-violet-500" /><span className="text-xs text-ink-500">Photographer</span></>
                    ) : (
                      <><Users className="w-3.5 h-3.5 text-blue-500" /><span className="text-xs text-ink-500">Client</span></>
                    )}
                  </div>

                  <StatusPill status={a.status} profileStatus={a.profileStatus} />

                  <div>
                    <p className="text-xs text-ink-400">{a.joined}</p>
                    <p className="text-[10px] text-ink-300">{a.lastSeen}</p>
                  </div>

                  <ActionMenu account={a} onAction={handleAction} />
                </div>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-xs text-ink-300">
          Showing {list.length} of {accounts.length} accounts
        </p>
      </main>

      {/* Confirm modal */}
      {pendingAction && (
        <ConfirmModal
          pending={pendingAction}
          accounts={accounts}
          onConfirm={confirmAction}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-white text-sm font-medium px-5 py-3 rounded-full shadow-float animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  )
}
