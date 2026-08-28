'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'
import {
  Star, Check, CheckCircle2, ChevronRight, ChevronLeft, Calendar, MessageSquare,
} from 'lucide-react'
import { PHOTOGRAPHERS, getPhotographer } from '../data'
import { SiteNav } from '../site-nav'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function BookInner() {
  const params = useSearchParams()
  const to = params.get('to') ?? 'jordan-mercer'
  const p = getPhotographer(to) ?? PHOTOGRAPHERS[0]
  const pkgParam = params.get('pkg')
  const initialPkg = Math.max(0, p.packages.findIndex((x) => x.id === pkgParam))

  const [stepIdx, setStepIdx] = useState(0)
  const [pkg, setPkg] = useState(initialPkg)
  const [day, setDay] = useState<number | null>(18)
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)

  const steps = ['Package', 'Date', 'Details']
  const canNext = stepIdx === 0 ? true : stepIdx === 1 ? day !== null : true

  if (done) {
    return (
      <><SiteNav />
      <main className="max-w-xl mx-auto px-4 sm:px-6 py-14 min-h-screen">
        <div className="bg-white ring-1 ring-ink-100 rounded-3xl p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500 mx-auto flex items-center justify-center mb-5">
            <CheckCircle2 className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Booking request sent</h1>
          <p className="text-ink-400 mt-2">
            {p.name} has been notified and usually replies within an hour. You’ll get a message as soon as it’s confirmed.
          </p>
          <div className="text-left bg-ink-50 rounded-2xl p-4 mt-6 space-y-2 text-sm">
            <Row label="Photographer" value={p.name} />
            <Row label="Package" value={`${p.packages[pkg].name} · ${p.packages[pkg].duration}`} />
            <Row label="Date" value={`June ${day}, 2026`} />
            {note && <Row label="Note" value={note} />}
          </div>
          <div className="flex gap-2 mt-6">
            <Link href={`/marketing/messages?to=${p.slug}`} className="flex-1 flex items-center justify-center gap-2 bg-ink text-white text-sm font-semibold py-3 rounded-xl hover:bg-ink-800 transition-colors">
              <MessageSquare className="w-4 h-4" /> Message {p.name.split(' ')[0]}
            </Link>
            <Link href="/marketing/browse" className="flex-1 flex items-center justify-center bg-ink-50 text-ink-700 text-sm font-semibold py-3 rounded-xl hover:bg-ink-100 transition-colors">
              Keep browsing
            </Link>
          </div>
        </div>
      </main>
      </>
    )
  }

  return (
    <>
    <SiteNav />
    <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Photographer header */}
      <div className="flex items-center gap-3 mb-6">
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold ${p.avatarColor}`}>{p.initials}</span>
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Book {p.name}</h1>
          <p className="text-sm text-ink-400 flex items-center gap-1">
            <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" /> {p.rating.toFixed(1)} · {p.reviews} reviews · Trust {p.trustScore}
          </p>
        </div>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 ${i <= stepIdx ? 'text-ink' : 'text-ink-300'}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i < stepIdx ? 'bg-emerald-500 text-white' : i === stepIdx ? 'bg-ink text-white' : 'bg-ink-100 text-ink-400'}`}>
                {i < stepIdx ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="text-xs font-semibold hidden sm:block">{s}</span>
            </div>
            {i < steps.length - 1 && <span className={`h-px flex-1 ${i < stepIdx ? 'bg-emerald-400' : 'bg-ink-100'}`} />}
          </div>
        ))}
      </div>

      <div className="bg-white ring-1 ring-ink-100 rounded-2xl p-5 shadow-sm min-h-[280px]">
        {stepIdx === 0 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-ink-500 mb-1">Choose a package</p>
            {p.packages.map((pk, i) => (
              <button key={pk.name} onClick={() => setPkg(i)} className={`w-full text-left rounded-xl border p-4 transition-colors ${pkg === i ? 'border-ink bg-ink-50' : 'border-ink-100 hover:border-ink-300'}`}>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{pk.name}</span>
                  <span className="text-xs text-ink-400">{pk.duration}</span>
                </div>
                <p className="text-sm text-ink-400 mt-0.5">{pk.blurb}</p>
              </button>
            ))}
          </div>
        )}

        {stepIdx === 1 && (
          <div>
            <p className="text-sm font-semibold text-ink-500 mb-3">Pick a date — June 2026</p>
            <div className="grid grid-cols-7 gap-1.5 text-center">
              {DAYS.map((d) => <span key={d} className="text-[10px] font-semibold text-ink-300 py-1">{d}</span>)}
              {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => {
                const unavailable = [1, 2, 7, 8, 14, 21, 28].includes(d)
                const selected = day === d
                return (
                  <button
                    key={d}
                    disabled={unavailable}
                    onClick={() => setDay(d)}
                    className={`aspect-square rounded-lg text-xs font-medium transition-colors ${
                      selected ? 'bg-ink text-white' : unavailable ? 'text-ink-200 line-through cursor-not-allowed' : 'bg-ink-50 text-ink-600 hover:bg-ink-100'
                    }`}
                  >
                    {d}
                  </button>
                )
              })}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-ink-400 mt-4">
              <Calendar className="w-3.5 h-3.5" /> Struck-through dates are already booked.
            </p>
          </div>
        )}

        {stepIdx === 2 && (
          <div>
            <p className="text-sm font-semibold text-ink-500 mb-3">Anything {p.name.split(' ')[0]} should know?</p>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              placeholder="Venue, timing, style, guest count…"
              className="w-full text-sm bg-ink-50 rounded-xl p-3 outline-none focus:ring-2 focus:ring-ink/10 placeholder:text-ink-300 resize-none"
            />
            <div className="bg-ink-50 rounded-xl p-4 mt-4 space-y-2 text-sm">
              <Row label="Package" value={`${p.packages[pkg].name} · ${p.packages[pkg].duration}`} />
              <Row label="Date" value={day ? `June ${day}, 2026` : '—'} />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-5">
        <button
          onClick={() => setStepIdx((s) => Math.max(0, s - 1))}
          className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors ${stepIdx === 0 ? 'invisible' : 'text-ink-500 hover:bg-ink-50'}`}
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        {stepIdx < 2 ? (
          <button
            onClick={() => canNext && setStepIdx((s) => s + 1)}
            disabled={!canNext}
            className="flex items-center gap-1.5 bg-ink text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-40 transition-colors"
          >
            Continue <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => setDone(true)}
            className="flex items-center gap-1.5 bg-emerald-500 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-600 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" /> Send booking request
          </button>
        )}
      </div>
    </main>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-ink-400">{label}</span>
      <span className="text-ink font-medium text-right">{value}</span>
    </div>
  )
}

export default function BookPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto px-6 py-10 text-ink-400">Loading…</div>}>
      <BookInner />
    </Suspense>
  )
}
