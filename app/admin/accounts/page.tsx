'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Search, CheckCircle2, XCircle, Shield,
  ChevronLeft, ChevronRight, Loader2, ArrowLeft, Award,
} from 'lucide-react'
import { AdminNav } from '@/components/admin-nav'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  account_status: string
  created_at: string
  profile: {
    username: string
    profile_status: string
    trust_score: number
    native_avg_rating: number
    native_review_count: number
    is_founder: boolean
  } | null
}

const STATUS_COLORS: Record<string, string> = {
  approved:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  pending:   'bg-amber-50 text-amber-700 border-amber-200',
  rejected:  'bg-red-50 text-red-600 border-red-200',
  active:    'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-red-50 text-red-600 border-red-200',
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const d = Math.floor(diff / 86400000)
  if (d < 1) return 'Today'
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}


function AccountsInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers]         = useState<User[]>([])
  const [total, setTotal]         = useState(0)
  const [loading, setLoading]     = useState(true)
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState(searchParams.get('role') ?? 'all')
  const [q, setQ]                 = useState('')
  const [page, setPage]           = useState(1)

  const totalPages = Math.ceil(total / 20)

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ role: roleFilter, q, page: String(page) })
    const res = await fetch(`/api/admin/accounts?${params}`)
    if (res.status === 403 || res.status === 401) { router.push('/admin/login'); return }
    if (res.ok) { const d = await res.json(); setUsers(d.users); setTotal(d.total) }
    setLoading(false)
  }, [roleFilter, q, page, router])

  useEffect(() => { load() }, [load])

  async function doAction(userId: string, action: string) {
    setActionBusy(userId + action)
    const res = await fetch('/api/admin/accounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, action }),
    })
    if (res.ok) await load()
    setActionBusy(null)
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <AdminNav />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-ink">Accounts</h1>
            <p className="text-sm text-ink-300 mt-0.5">{total} total</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-ink-100 p-4 mb-6 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2 flex-1 min-w-48">
            <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
            <input value={q} onChange={e => { setQ(e.target.value); setPage(1) }}
              placeholder="Search by name…"
              className="bg-transparent text-sm text-ink placeholder-ink-300 outline-none flex-1" />
          </div>
          <div className="flex gap-1 bg-ink-50 p-1 rounded-xl">
            {['all', 'client', 'photographer'].map(r => (
              <button key={r} onClick={() => { setRoleFilter(r); setPage(1) }}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all capitalize ${
                  roleFilter === r ? 'bg-white text-ink shadow-sm' : 'text-ink-400 hover:text-ink'
                }`}>{r}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-center text-sm text-ink-300 py-16">No accounts found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-ink-50">
                    <th className="px-6 py-3 text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider">User</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Role</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Account</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Profile</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Joined</th>
                    <th className="px-4 py-3 text-left text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-50">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-ink-50/40 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                            {u.full_name?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-ink truncate">{u.full_name}</p>
                            <p className="text-xs text-ink-300 truncate">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${
                          u.role === 'photographer' ? 'bg-violet-50 text-violet-700 border-violet-200' :
                          u.role === 'admin' ? 'bg-ink text-white border-ink' :
                          'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[u.account_status] ?? 'bg-ink-50 text-ink-400 border-ink-100'}`}>
                          {u.account_status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        {u.profile ? (
                          <div className="space-y-0.5">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border capitalize ${STATUS_COLORS[u.profile.profile_status] ?? 'bg-ink-50 text-ink-400 border-ink-100'}`}>
                              {u.profile.profile_status}
                            </span>
                            {u.profile.trust_score > 0 && (
                              <p className="text-[10px] text-ink-300 flex items-center gap-1 mt-0.5">
                                <Shield className="w-2.5 h-2.5" /> {Number(u.profile.trust_score).toFixed(1)}
                              </p>
                            )}
                          </div>
                        ) : <span className="text-xs text-ink-200">—</span>}
                      </td>
                      <td className="px-4 py-4 text-xs text-ink-300 whitespace-nowrap">{relTime(u.created_at)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {u.role === 'photographer' && u.profile?.profile_status === 'pending' && (
                            <>
                              <button onClick={() => doAction(u.id, 'approve_photographer')} disabled={!!actionBusy}
                                className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50">
                                {actionBusy === u.id + 'approve_photographer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                                Approve
                              </button>
                              <button onClick={() => doAction(u.id, 'reject_photographer')} disabled={!!actionBusy}
                                className="flex items-center gap-1 text-[10px] font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50">
                                {actionBusy === u.id + 'reject_photographer' ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                                Reject
                              </button>
                            </>
                          )}
                          {u.role === 'photographer' && u.profile?.profile_status === 'approved' && (
                            u.profile.is_founder ? (
                              <button onClick={() => doAction(u.id, 'remove_founder')} disabled={!!actionBusy}
                                title="Founding Member — click to remove the badge"
                                className="flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-lg hover:bg-amber-100 transition-colors disabled:opacity-50">
                                {actionBusy === u.id + 'remove_founder' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />}
                                Founder ✓
                              </button>
                            ) : (
                              <button onClick={() => doAction(u.id, 'make_founder')} disabled={!!actionBusy}
                                title="Mark as a Founding Member (sends a thank-you email on the first grant)"
                                className="flex items-center gap-1 text-[10px] font-semibold text-ink-400 border border-ink-100 px-2.5 py-1.5 rounded-lg hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors disabled:opacity-50">
                                {actionBusy === u.id + 'make_founder' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Award className="w-3 h-3" />}
                                Make Founder
                              </button>
                            )
                          )}
                          {u.account_status === 'active' && u.role !== 'admin' && (
                            <button onClick={() => doAction(u.id, 'suspend')} disabled={!!actionBusy}
                              className="text-[10px] font-semibold text-ink-400 border border-ink-100 px-2.5 py-1.5 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors disabled:opacity-50">
                              {actionBusy === u.id + 'suspend' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Suspend'}
                            </button>
                          )}
                          {u.account_status === 'suspended' && (
                            <button onClick={() => doAction(u.id, 'unsuspend')} disabled={!!actionBusy}
                              className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-50">
                              {actionBusy === u.id + 'unsuspend' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Unsuspend'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-ink-50">
              <p className="text-xs text-ink-300">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-ink-100 hover:bg-ink-50 disabled:opacity-40 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-ink-500" />
                </button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-ink-100 hover:bg-ink-50 disabled:opacity-40 transition-colors">
                  <ChevronRight className="w-4 h-4 text-ink-500" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default function AccountsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="w-6 h-6 animate-spin text-ink-300" /></div>}>
      <AccountsInner />
    </Suspense>
  )
}
