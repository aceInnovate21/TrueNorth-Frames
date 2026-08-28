'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import {
  Home, Image as ImageIcon, Package, Calendar, HelpCircle, Inbox,
  MessageSquare, Star, Users, Share2, Shield, Settings, Eye, Menu,
  ChevronRight, CheckCircle2, Upload, RefreshCw, X, Check, Zap,
  Globe, Instagram, Facebook, ArrowRight, Bell, Trash2,
} from 'lucide-react'
import { DashboardSidebar, type SidebarGroup } from '@/components/dashboard-sidebar'
import { PhotographerBadge } from '@/components/photographer-badge'
import { PHOTOGRAPHERS, makeBadge, u } from '../data'

const me = PHOTOGRAPHERS[0] // Jordan Mercer — Trusted Pro

type Tab = 'overview' | 'portfolio' | 'packages' | 'availability' | 'faq' | 'requests' | 'messages' | 'reviews' | 'network' | 'socials' | 'trust' | 'settings'

type Req = { id: number; name: string; initials: string; color: string; detail: string; pkg: string; state: 'pending' | 'accepted' | 'declined' }

const INITIAL_REQS: Req[] = [
  { id: 1, name: 'Ava Lindqvist', initials: 'AL', color: 'bg-rose-500', detail: 'Wedding · Jun 18 · Muttart Conservatory', pkg: 'Full Wedding · 10 hours', state: 'pending' },
  { id: 2, name: 'Marcus Cole', initials: 'MC', color: 'bg-zinc-700', detail: 'Corporate headshots · Jun 24 · Downtown', pkg: 'Portrait Session · 1 hour', state: 'pending' },
  { id: 3, name: 'Priya Nair', initials: 'PN', color: 'bg-indigo-600', detail: 'Engagement · Jul 2 · River Valley', pkg: 'Portrait Session · 1 hour', state: 'pending' },
]

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview', portfolio: 'Portfolio', packages: 'Packages', availability: 'Availability',
  faq: 'FAQ', requests: 'Booking Requests', messages: 'Messages', reviews: 'Reviews',
  network: 'Network', socials: 'Socials', trust: 'Trust Score', settings: 'Settings',
}

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [photos, setPhotos] = useState<string[]>(me.portfolioIds.slice(0, 8))
  const [reqs, setReqs] = useState<Req[]>(INITIAL_REQS)
  const [score, setScore] = useState(88)
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const pending = reqs.filter((r) => r.state === 'pending').length

  const sidebarGroups: SidebarGroup[] = [
    { items: [{ key: 'overview', label: 'Overview', icon: Home }] },
    { heading: 'Studio', items: [
      { key: 'portfolio', label: 'Portfolio', icon: ImageIcon },
      { key: 'packages', label: 'Packages', icon: Package },
      { key: 'availability', label: 'Availability', icon: Calendar },
      { key: 'faq', label: 'FAQ', icon: HelpCircle },
    ]},
    { heading: 'Clients', items: [
      { key: 'requests', label: 'Booking Requests', icon: Inbox, badge: pending },
      { key: 'messages', label: 'Messages', icon: MessageSquare, badge: 2 },
      { key: 'reviews', label: 'Reviews', icon: Star },
      { key: 'network', label: 'Network', icon: Users },
      { key: 'socials', label: 'Socials', icon: Share2 },
    ]},
    { heading: 'Account', items: [
      { key: 'trust', label: 'Trust Score', icon: Shield },
      { key: 'settings', label: 'Settings', icon: Settings },
    ]},
  ]

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(null), 2600) }

  const addPhoto = () => {
    const next = me.portfolioIds[(photos.length) % me.portfolioIds.length]
    setPhotos((p) => [...p, next])
    flash('Photo added to “Summer Weddings”')
  }

  const sync = () => {
    if (syncing) return
    setSyncing(true); setSynced(false)
    const from = score, target = 94, start = performance.now()
    const tick = (t: number) => {
      const pr = Math.min(1, (t - start) / 1400)
      setScore(Math.round(from + (target - from) * pr))
      if (pr < 1) requestAnimationFrame(tick)
      else { setSyncing(false); setSynced(true); flash('Trust signals synced') }
    }
    requestAnimationFrame(tick)
  }

  const decide = (id: number, state: 'accepted' | 'declined') => {
    setReqs((rs) => rs.map((r) => (r.id === id ? { ...r, state } : r)))
    if (state === 'accepted') { const r = reqs.find((x) => x.id === id); if (r) flash(`Accepted ${r.name} — confirmation auto-sent`) }
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <DashboardSidebar
        groups={sidebarGroups}
        activeKey={tab}
        onSelect={(k) => setTab(k as Tab)}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        footer={
          <Link href="/marketing/photographer/jordan-mercer" className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-ink-400 hover:text-ink hover:bg-ink-50 transition-all">
            <Eye className="w-[18px] h-[18px]" /> View profile
          </Link>
        }
      />

      {/* Main column (offset for fixed rail on lg+) */}
      <div className="lg:pl-64">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-40 bg-white border-b border-ink-100 h-14 flex items-center px-4 gap-3">
          <button onClick={() => setDrawerOpen(true)} className="p-1.5 -ml-1.5 rounded-lg hover:bg-ink-50"><Menu className="w-5 h-5 text-ink" /></button>
          <span className="font-semibold text-ink text-sm">{TAB_LABELS[tab]}</span>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          {/* Header */}
          <div className="hidden lg:flex items-center gap-3 mb-6">
            <div className="relative w-11 h-11 rounded-2xl overflow-hidden">
              <Image src={u(me.avatarId, 88, 88)} alt={me.name} fill className="object-cover" sizes="44px" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-ink">{TAB_LABELS[tab] === 'Overview' ? `Welcome back, ${me.name.split(' ')[0]}` : TAB_LABELS[tab]}</h1>
              <p className="text-sm text-ink-400">Manage your studio on TrueNorth Frames.</p>
            </div>
            <div className="ml-auto relative">
              <Bell className="w-6 h-6 text-ink-400" />
              {pending > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{pending}</span>}
            </div>
          </div>

          {/* Tab strip */}
          <div className="flex items-center gap-1 mb-5 overflow-x-auto pb-1">
            {(['overview', 'portfolio', 'requests', 'packages', 'reviews', 'trust'] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`text-sm font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${tab === t ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink hover:bg-ink-100'}`}>
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 flex flex-col gap-2" style={card}>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300">Your badge</p>
                  <PhotographerBadge badge={makeBadge(me.badge)} size="md" />
                  <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Top tier ✓</p>
                </div>
                <StatBtn icon={MessageSquare} value="14" label="Messages" sub="2 unread" onClick={() => setTab('messages')} />
                <StatBtn icon={Star} value={me.rating.toFixed(1)} label="Avg rating" sub={`${me.reviews} reviews`} onClick={() => setTab('reviews')} />
                <StatBtn icon={Zap} value={String(me.bookings)} label="Completed bookings" sub="Trusted Pro" onClick={() => setTab('requests')} />
              </div>

              {/* Online presence */}
              <div className="bg-white rounded-2xl p-4" style={card}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Online presence</p>
                  <button onClick={() => setTab('settings')} className="text-xs text-ink-400 hover:text-ink flex items-center gap-1">Edit <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-ink-50 text-ink-600 border border-ink-100"><Globe className="w-3 h-3" /> Website</span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 border border-pink-100"><Instagram className="w-3 h-3" /> @{me.instagram}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-dashed border-ink-200 text-ink-300"><Facebook className="w-3 h-3" /> Add Facebook</span>
                </div>
              </div>

              {/* Profile completion */}
              <div className="bg-white rounded-2xl p-5" style={card}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-ink text-sm">Profile completion</p>
                  <button onClick={() => setTab('settings')} className="text-xs text-ink-400 hover:text-ink flex items-center gap-1">Edit profile <ChevronRight className="w-3 h-3" /></button>
                </div>
                <div className="flex items-center gap-5 mb-4">
                  <CompletionRing pct={92} />
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">Great profile!</p>
                    <p className="text-ink-300 text-xs mt-1">You appear in client searches.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Bio & tagline', done: true },
                    { label: 'Portfolio (5+ photos)', done: true },
                    { label: 'Packages & pricing', done: true },
                    { label: 'Availability calendar', done: false, cta: 'Set hours' },
                  ].map((s) => (
                    <div key={s.label} className="flex items-center gap-2.5">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center ${s.done ? 'bg-emerald-100' : 'border border-ink-200'}`}>
                        {s.done && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      </div>
                      <span className={`text-xs flex-1 ${s.done ? 'text-ink-300 line-through' : 'text-ink-500'}`}>{s.label}</span>
                      {!s.done && <button onClick={() => setTab('availability')} className="text-[10px] text-ink font-medium hover:underline">{s.cta} →</button>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Badge ladder */}
              <div className="bg-white rounded-2xl p-5" style={card}>
                <div className="flex items-center justify-between mb-4">
                  <p className="font-semibold text-ink text-sm">Badge progress</p>
                  <PhotographerBadge badge={makeBadge(me.badge)} size="sm" />
                </div>
                {[
                  { emoji: '🆕', label: 'Newly Joined', color: 'bg-ink-100' },
                  { emoji: '🌟', label: 'Rising Talent', color: 'bg-amber-400' },
                  { emoji: '🔵', label: 'Verified Pro', color: 'bg-blue-500' },
                  { emoji: '✅', label: 'Trusted Pro', color: 'bg-emerald-500' },
                ].map((tier, i) => (
                  <div key={tier.label} className="flex items-center gap-3 mb-2 last:mb-0">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs ${tier.color}`}>{tier.emoji}</div>
                    <div className="flex-1 flex items-center gap-2">
                      <span className="text-xs font-semibold text-ink">{tier.label}</span>
                      {i === 3 && <span className="text-[9px] font-bold uppercase tracking-wide text-white bg-ink px-1.5 py-0.5 rounded-full">Current</span>}
                    </div>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Portfolio ── */}
          {tab === 'portfolio' && (
            <div className="bg-white rounded-2xl p-6" style={card}>
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center"><ImageIcon className="w-4 h-4 text-ink-400" /></div>
                  <div>
                    <h2 className="font-semibold text-ink">Portfolio · Summer Weddings</h2>
                    <p className="text-xs text-ink-300">{photos.length} photos in this album</p>
                  </div>
                </div>
                <button onClick={addPhoto} className="flex items-center gap-1.5 bg-ink text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-ink-800 transition-colors">
                  <Upload className="w-3.5 h-3.5" /> Upload
                </button>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {photos.map((id, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
                    <Image src={u(id, 200, 200)} alt="" fill className="object-cover" sizes="150px" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <Trash2 className="w-4 h-4 text-white" />
                    </div>
                  </div>
                ))}
                <button onClick={addPhoto} className="aspect-square rounded-xl border-2 border-dashed border-ink-200 flex flex-col items-center justify-center text-ink-300 hover:border-ink-400 hover:text-ink-500 transition-colors">
                  <Upload className="w-5 h-5" /><span className="text-[10px] mt-1 font-medium">Add</span>
                </button>
              </div>
            </div>
          )}

          {/* ── Requests ── */}
          {tab === 'requests' && (
            <div className="bg-white rounded-2xl p-6" style={card}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center"><Inbox className="w-4 h-4 text-ink-400" /></div>
                <div>
                  <h2 className="font-semibold text-ink">Booking requests</h2>
                  <p className="text-xs text-ink-300">Approve or reject client requests — {pending} pending</p>
                </div>
              </div>
              <div className="space-y-3">
                {reqs.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5">
                    <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${r.color}`}>{r.initials}</span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm text-ink">{r.name}</p>
                      <p className="text-xs text-ink-400 truncate">{r.detail}</p>
                      <p className="text-[11px] text-ink-300 mt-0.5">{r.pkg}</p>
                    </div>
                    {r.state === 'pending' ? (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => decide(r.id, 'declined')} className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-ink-50 text-ink-400 hover:bg-ink-100 transition-colors"><X className="w-3.5 h-3.5" /> Decline</button>
                        <button onClick={() => decide(r.id, 'accepted')} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"><Check className="w-3.5 h-3.5" /> Accept</button>
                      </div>
                    ) : (
                      <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0 ${r.state === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-50 text-ink-400'}`}>
                        {r.state === 'accepted' ? <><CheckCircle2 className="w-3.5 h-3.5" /> Accepted</> : 'Declined'}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Packages ── */}
          {tab === 'packages' && (
            <div className="bg-white rounded-2xl p-6" style={card}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center"><Package className="w-4 h-4 text-ink-400" /></div>
                <div>
                  <h2 className="font-semibold text-ink">Project packages</h2>
                  <p className="text-xs text-ink-300">What clients can request when they book you</p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {me.packages.map((pk) => (
                  <div key={pk.id} className="rounded-xl border border-ink-100 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="bg-ink-50 text-ink-500 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">{pk.specialty.replace('-', ' ')}</span>
                    </div>
                    <p className="font-semibold text-ink text-sm mt-1">{pk.name}</p>
                    <p className="text-ink-400 text-xs mt-0.5">{pk.duration}</p>
                    <ul className="mt-3 space-y-1">
                      {pk.features.map((f) => (
                        <li key={f} className="flex items-start gap-1.5 text-[11px] text-ink-500"><span className="w-1 h-1 rounded-full bg-ink-300 mt-1.5 flex-shrink-0" />{f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Reviews ── */}
          {tab === 'reviews' && (
            <div className="space-y-3">
              {me.reviewList.map((r, i) => (
                <div key={i} className="bg-white rounded-2xl p-5" style={card}>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${r.color}`}>{r.initials}</span>
                    <div>
                      <p className="font-semibold text-ink text-sm">{r.author}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((n) => <Star key={n} className={`w-3 h-3 ${n <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-ink-100 fill-ink-100'}`} />)}
                        <span className="text-[10px] text-ink-300 ml-1">{r.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-ink-500 text-sm leading-relaxed">{r.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* ── Trust ── */}
          {tab === 'trust' && (
            <div className="bg-white rounded-2xl p-6 max-w-md" style={card}>
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-emerald-600" />
                <h2 className="font-semibold text-ink">Trust Aggregator</h2>
              </div>
              <div className="text-center mb-4">
                <span className="text-5xl font-bold text-emerald-600 tabular-nums">{score}</span>
                <p className="text-xs text-ink-400 mt-1">out of 100</p>
              </div>
              <div className="h-2 rounded-full bg-ink-100 overflow-hidden mb-4">
                <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${score}%` }} />
              </div>
              <ul className="space-y-2 text-sm mb-4">
                {[['Google Business Profile', true], ['Verified reviews', true], ['Completed bookings', true], ['Recent activity', synced]].map(([label, ok]) => (
                  <li key={label as string} className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-500' : 'bg-ink-200'}`}>{ok && <Check className="w-2.5 h-2.5 text-white" />}</span>
                    <span className={ok ? 'text-ink-600' : 'text-ink-400'}>{label as string}</span>
                  </li>
                ))}
              </ul>
              <button onClick={sync} disabled={syncing} className="w-full flex items-center justify-center gap-2 bg-ink-50 text-ink-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-100 disabled:opacity-60 transition-colors">
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing signals…' : synced ? 'Synced — up to date' : 'Sync trust signals'}
              </button>
            </div>
          )}

          {/* ── Messages redirect note ── */}
          {tab === 'messages' && (
            <div className="bg-white rounded-2xl p-8 text-center" style={card}>
              <MessageSquare className="w-8 h-8 text-ink-300 mx-auto mb-3" />
              <p className="font-semibold text-ink">Your conversations</p>
              <p className="text-sm text-ink-400 mt-1 mb-4">Chat with clients who’ve reached out.</p>
              <Link href="/marketing/messages" className="inline-flex items-center gap-2 bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink-800 transition-colors">
                Open messages <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          {/* ── Simple placeholders for remaining tabs ── */}
          {(['availability', 'faq', 'network', 'socials', 'settings'] as Tab[]).includes(tab) && (
            <div className="bg-white rounded-2xl p-10 text-center" style={card}>
              <p className="font-semibold text-ink">{TAB_LABELS[tab]}</p>
              <p className="text-sm text-ink-400 mt-1">This section is part of the full dashboard. Explore Overview, Portfolio, Booking Requests, Packages, Reviews, and Trust Score in this demo.</p>
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </div>
  )
}

const card = { boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' } as React.CSSProperties

function StatBtn({ icon: Icon, value, label, sub, onClick }: { icon: typeof Star; value: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="text-left bg-white rounded-2xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-md" style={card}>
      <Icon className="w-4 h-4 text-ink-300 mb-2" />
      <p className="font-bold text-ink text-xl">{value}</p>
      <p className="text-ink-400 text-xs mt-0.5">{label}</p>
      <p className="text-ink-300 text-[10px] mt-1">{sub}</p>
    </button>
  )
}

function CompletionRing({ pct }: { pct: number }) {
  const r = 32, c = 2 * Math.PI * r, off = c - (pct / 100) * c
  return (
    <div className="relative" style={{ width: 80, height: 80 }}>
      <svg width={80} height={80} className="-rotate-90">
        <circle cx={40} cy={40} r={r} fill="none" stroke="#E8E8E8" strokeWidth={7} />
        <circle cx={40} cy={40} r={r} fill="none" stroke="#10b981" strokeWidth={7} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-ink">{pct}%</span>
    </div>
  )
}
