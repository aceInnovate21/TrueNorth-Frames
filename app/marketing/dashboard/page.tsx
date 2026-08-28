'use client'

import Image from 'next/image'
import { useState } from 'react'
import {
  Upload, RefreshCw, CheckCircle2, Star, CalendarCheck, Camera,
  TrendingUp, Shield, Bell, X, Check,
} from 'lucide-react'
import { PHOTOGRAPHERS, img } from '../data'

const me = PHOTOGRAPHERS[0] // Jordan Mercer

const START_PHOTOS = me.portfolio.slice(0, 5)

type Req = { id: number; name: string; initials: string; color: string; detail: string; state: 'pending' | 'accepted' | 'declined' }

const INITIAL_REQS: Req[] = [
  { id: 1, name: 'Ava L.', initials: 'AL', color: 'bg-rose-500', detail: 'Wedding · June 18 · Muttart Conservatory', state: 'pending' },
  { id: 2, name: 'Marcus C.', initials: 'MC', color: 'bg-zinc-700', detail: 'Corporate headshots · June 24 · Downtown', state: 'pending' },
  { id: 3, name: 'Priya N.', initials: 'PN', color: 'bg-indigo-600', detail: 'Engagement · July 2 · River Valley', state: 'pending' },
]

export default function DashboardPage() {
  const [photos, setPhotos] = useState<string[]>(START_PHOTOS)
  const [score, setScore] = useState(88)
  const [syncing, setSyncing] = useState(false)
  const [synced, setSynced] = useState(false)
  const [reqs, setReqs] = useState<Req[]>(INITIAL_REQS)
  const [toast, setToast] = useState<string | null>(null)

  const addPhoto = () => {
    const next = img(['1519741497674-611481863552', '1606216794074-735e91aa2c92', '1507679799987-c73779587ccf'][photos.length % 3], 400, 400) + `&sig=${Date.now()}`
    setPhotos((p) => [...p, next])
    flash('Photo added to “Summer Weddings”')
  }

  const sync = () => {
    if (syncing) return
    setSyncing(true)
    setSynced(false)
    const target = 94
    const start = performance.now()
    const from = score
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 1400)
      setScore(Math.round(from + (target - from) * p))
      if (p < 1) requestAnimationFrame(tick)
      else { setSyncing(false); setSynced(true) }
    }
    requestAnimationFrame(tick)
  }

  const decide = (id: number, state: 'accepted' | 'declined') => {
    setReqs((rs) => rs.map((r) => (r.id === id ? { ...r, state } : r)))
    const r = reqs.find((x) => x.id === id)
    if (r && state === 'accepted') flash(`Accepted ${r.name} — confirmation auto-sent ✉️`)
  }

  const flash = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const pending = reqs.filter((r) => r.state === 'pending').length

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold ${me.avatarColor}`}>{me.initials}</span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back, {me.name.split(' ')[0]}</h1>
          <p className="text-sm text-ink-400">Here’s what’s happening with your studio today.</p>
        </div>
        <div className="ml-auto relative">
          <Bell className="w-6 h-6 text-ink-400" />
          {pending > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">{pending}</span>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Stat icon={Star} label="Rating" value={me.rating.toFixed(1)} sub={`${me.reviews} reviews`} />
        <Stat icon={CalendarCheck} label="Completed bookings" value={String(me.bookings)} sub="all-time" />
        <Stat icon={Camera} label="Portfolio" value={String(photos.length)} sub="published photos" />
        <Stat icon={TrendingUp} label="Profile views" value="1,204" sub="last 30 days" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Album manager */}
        <section className="lg:col-span-2 bg-white ring-1 ring-ink-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Portfolio · Summer Weddings</h2>
              <p className="text-xs text-ink-400">{photos.length} photos in this album</p>
            </div>
            <button onClick={addPhoto} className="flex items-center gap-1.5 bg-ink text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-ink-800 transition-colors">
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
            {photos.map((src, i) => (
              <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
                <Image src={src} alt="" fill className="object-cover" sizes="150px" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </div>
            ))}
            <button onClick={addPhoto} className="aspect-square rounded-xl border-2 border-dashed border-ink-200 flex flex-col items-center justify-center text-ink-300 hover:border-ink-400 hover:text-ink-500 transition-colors">
              <Upload className="w-5 h-5" />
              <span className="text-[10px] mt-1 font-medium">Add</span>
            </button>
          </div>
        </section>

        {/* Trust Aggregator */}
        <section className="bg-white ring-1 ring-ink-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-emerald-600" />
            <h2 className="font-semibold">Trust Aggregator</h2>
          </div>
          <div className="text-center mb-4">
            <span className="text-5xl font-bold text-emerald-600 tabular-nums">{score}</span>
            <p className="text-xs text-ink-400 mt-1">out of 100</p>
          </div>
          <div className="h-2 rounded-full bg-ink-100 overflow-hidden mb-4">
            <div className="h-full rounded-full bg-emerald-500 transition-[width] duration-300" style={{ width: `${score}%` }} />
          </div>
          <ul className="space-y-2 text-sm mb-4">
            <TrustLine label="Google Business Profile" ok />
            <TrustLine label="Verified reviews" ok />
            <TrustLine label="Completed bookings" ok />
            <TrustLine label="Recent activity" ok={synced} />
          </ul>
          <button
            onClick={sync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 bg-ink-50 text-ink-700 text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-100 disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing signals…' : synced ? 'Synced — up to date' : 'Sync trust signals'}
          </button>
        </section>

        {/* Incoming bookings */}
        <section className="lg:col-span-3 bg-white ring-1 ring-ink-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Incoming booking requests</h2>
            <span className="text-xs text-ink-400">{pending} pending</span>
          </div>
          <div className="space-y-3">
            {reqs.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3.5">
                <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${r.color}`}>{r.initials}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-ink-400 truncate">{r.detail}</p>
                </div>
                {r.state === 'pending' ? (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => decide(r.id, 'declined')} className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-ink-50 text-ink-400 hover:bg-ink-100 transition-colors">
                      <X className="w-3.5 h-3.5" /> Decline
                    </button>
                    <button onClick={() => decide(r.id, 'accepted')} className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors">
                      <Check className="w-3.5 h-3.5" /> Accept
                    </button>
                  </div>
                ) : (
                  <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg flex-shrink-0 ${r.state === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-ink-50 text-ink-400'}`}>
                    {r.state === 'accepted' ? <><CheckCircle2 className="w-3.5 h-3.5" /> Accepted</> : <>Declined</>}
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-ink text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {toast}
        </div>
      )}
    </main>
  )
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Star; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white ring-1 ring-ink-100 rounded-2xl p-4 shadow-sm">
      <div className="flex items-center gap-1.5 text-ink-400 text-xs mb-1"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-[11px] text-ink-300">{sub}</p>
    </div>
  )
}

function TrustLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${ok ? 'bg-emerald-500' : 'bg-ink-200'}`}>
        {ok && <Check className="w-2.5 h-2.5 text-white" />}
      </span>
      <span className={ok ? 'text-ink-600' : 'text-ink-400'}>{label}</span>
    </li>
  )
}
