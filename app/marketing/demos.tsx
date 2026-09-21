'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import {
  Star, MapPin, Shield, Calendar, CheckCircle2, Upload,
  RefreshCw, Bell, Send, GitCompare, CheckCheck,
} from 'lucide-react'
import { PhotographerBadge } from '@/components/photographer-badge'
import type { Badge } from '@/lib/badges'

/** Runs once the element scrolls into view — drives each demo's timeline. */
function useInView<T extends HTMLElement>(amount = 0.35) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && (setInView(true), io.disconnect()),
      { threshold: amount },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [amount])
  return { ref, inView }
}

const step = (inView: boolean, at: number, from = 12): React.CSSProperties => ({
  opacity: inView ? 1 : 0,
  transform: inView ? 'translateY(0)' : `translateY(${from}px)`,
  transition: `opacity 550ms cubic-bezier(0.16,1,0.3,1) ${at}ms, transform 550ms cubic-bezier(0.16,1,0.3,1) ${at}ms`,
})

const TRUSTED_PRO: Badge = {
  type: 'trusted_pro',
  label: 'Trusted Pro',
  description: 'Verified, booked, and highly rated on TrueNorth Frames.',
  color: 'bg-emerald-50',
  textColor: 'text-emerald-700',
  borderColor: 'border-emerald-200',
  emoji: '✅',
}

// Only Unsplash photo IDs already proven in the app (see app/page.tsx) — every
// URL is guaranteed to resolve. Varying crops/orientation keep the grid lively.
const img = (id: string, w = 500, h?: number) =>
  `https://images.unsplash.com/photo-${id}?w=${w}${h ? `&h=${h}` : ''}&q=80&fit=crop`

const WEDDING = '1519741497674-611481863552'
const PORTRAIT = '1606216794074-735e91aa2c92'
const CORPORATE = '1507679799987-c73779587ccf'

const COVER = img(WEDDING, 700, 400)
const PORTFOLIO = [
  img(PORTRAIT, 300, 300),
  img(WEDDING, 300, 300),
  img(CORPORATE, 300, 300),
  img(WEDDING, 301, 300),
  img(CORPORATE, 301, 300),
  img(PORTRAIT, 301, 300),
]

/* ————————————————————————————————— Client demo ————————————————————————————— */

export function ClientDemo() {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className="w-full max-w-sm mx-auto">
      {/* Authentic GridCard — the real /photographers listing card */}
      <div style={step(inView, 100)} className="relative group">
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border-2 bg-white/80 text-ink-500 border-white/60 backdrop-blur-sm">
          <GitCompare className="w-2.5 h-2.5" /> Compare
        </div>

        <div className="block bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}>
          <div className="relative h-52 overflow-hidden bg-ink-100">
            <Image src={COVER} alt="Jordan Mercer portfolio cover" fill className="object-cover" sizes="384px" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

            <div className="absolute top-3 right-3 bg-emerald-500 rounded-full px-2.5 py-1">
              <span className="text-white text-[10px] font-bold">Available today</span>
            </div>
            <div className="absolute bottom-14 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
              <Star className="w-3 h-3 text-white fill-white" />
              <span className="text-white text-[11px] font-bold">4.9</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
              <div className="flex items-end gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl border-2 border-white/80 shadow-md bg-slate-600 flex items-center justify-center text-white text-[11px] font-bold">JM</div>
                <div className="min-w-0">
                  <p className="text-white font-semibold text-base leading-tight truncate">Jordan Mercer</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-white/70" />
                    <p className="text-white/70 text-[11px] truncate">Edmonton, AB</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2.5">
              <PhotographerBadge badge={TRUSTED_PRO} size="sm" />
              <span className="text-[10px] text-ink-400"><span className="font-semibold text-ink">127</span> reviews</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Wedding', 'Portrait', 'Events'].map((s) => (
                <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio grid — real imagery */}
      <div style={step(inView, 500)} className="mt-4 grid grid-cols-3 gap-1.5">
        {PORTFOLIO.map((src, i) => (
          <div
            key={i}
            className="relative aspect-square rounded-xl overflow-hidden bg-ink-100"
            style={{ ...step(inView, 500 + i * 90), transform: inView ? 'scale(1)' : 'scale(0.92)' }}
          >
            <Image src={src} alt="" fill className="object-cover" sizes="120px" />
          </div>
        ))}
      </div>

      {/* Trust Score */}
      <div style={{ ...step(inView, 1100), transform: inView ? 'scale(1)' : 'scale(0.92)' }} className="mt-4 flex items-center justify-between rounded-2xl bg-white ring-1 ring-ink-100 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-ink">Trust Score</span>
        </div>
        <span className="text-xl font-bold text-emerald-600 tabular-nums">94</span>
      </div>

      {/* Chat thread + date request */}
      <div style={step(inView, 1400)} className="mt-4 rounded-2xl bg-white ring-1 ring-ink-100 p-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-ink-50 mb-3">
          <div className="w-7 h-7 rounded-lg bg-slate-600 flex items-center justify-center text-white text-[10px] font-bold">JM</div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink leading-none">Jordan Mercer</p>
            <span className="text-[10px] text-emerald-600 font-medium">● Online now</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-end">
            <span className="bg-ink text-white text-xs px-3 py-2 rounded-2xl rounded-br-sm max-w-[80%]">Hi! Are you free June 18 for a wedding?</span>
          </div>
          <div style={step(inView, 1700, 6)} className="flex justify-start">
            <span className="bg-ink-50 text-ink-700 text-xs px-3 py-2 rounded-2xl rounded-bl-sm max-w-[80%]">Yes — that date’s open. Sending you a request now ✨</span>
          </div>
        </div>

        <div style={step(inView, 2000)} className="mt-3 pt-3 border-t border-ink-50">
          <div className="flex items-center gap-2 text-xs font-semibold text-ink mb-2">
            <Calendar className="w-3.5 h-3.5 text-ink-400" /> Pick a date
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[12, 13, 14, 15, 18, 19, 20, 21].map((d) => (
              <span key={d} className={`text-center text-[11px] py-1.5 rounded-lg font-medium ${d === 18 ? 'bg-ink text-white' : 'bg-ink-50 text-ink-500'}`}>{d}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Confirmed toast */}
      <div style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 550ms ease 2300ms, transform 550ms ease 2300ms' }} className="mt-4 flex items-center gap-2 rounded-2xl bg-emerald-500 text-white text-sm font-semibold px-4 py-3 shadow-lg">
        <CheckCircle2 className="w-5 h-5" /> Booking confirmed — Jun 18
      </div>
    </div>
  )
}

/* ——————————————————————————————— Photographer demo ————————————————————————— */

export function PhotographerDemo() {
  const { ref, inView } = useInView<HTMLDivElement>()
  return (
    <div ref={ref} className="w-full max-w-sm mx-auto">
      <div className="rounded-2xl overflow-hidden bg-white ring-1 ring-ink-100 shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 bg-ink text-white">
          <span className="text-xs font-semibold tracking-wide">Photographer dashboard</span>
          <Bell className="w-4 h-4 text-ink-300" />
        </div>

        <div className="p-4">
          {/* Album / portfolio upload with real imagery */}
          <div style={step(inView, 200)}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-300 mb-2">Album · Summer Weddings</p>
            <div className="grid grid-cols-4 gap-2">
              {PORTFOLIO.slice(0, 3).map((src, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100">
                  <Image src={src} alt="" fill className="object-cover" sizes="90px" />
                </div>
              ))}
              <div style={{ ...step(inView, 700), transform: inView ? 'scale(1)' : 'scale(0.8)' }} className="aspect-square rounded-xl border-2 border-dashed border-ink-100 flex items-center justify-center text-ink-300">
                <Upload className="w-4 h-4" />
              </div>
            </div>
            <div style={step(inView, 900)} className="flex items-center gap-1.5 mt-2 text-[11px] text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> 1 photo uploaded
            </div>
          </div>

          {/* Trust Aggregator sync */}
          <div style={step(inView, 1100)} className="mt-4 rounded-2xl bg-ink-50 ring-1 ring-ink-100 p-3.5">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-ink">
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${inView ? 'animate-spin' : ''}`} style={{ animationDuration: '1.6s' }} />
                Trust Aggregator
              </div>
              <span className="text-[10px] text-ink-300">Google · Reviews · Verified</span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: inView ? '94%' : '61%', transition: 'width 1400ms cubic-bezier(0.16,1,0.3,1) 1300ms' }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-ink-400">Score</span>
              <span className="font-bold text-emerald-600 tabular-nums text-sm"><ScoreCount to={94} run={inView} /></span>
            </div>
          </div>

          {/* Incoming booking → accept */}
          <div style={step(inView, 1600)} className="mt-4 rounded-2xl border border-ink-100 p-3.5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-bold">AL</span>
              <div className="text-xs">
                <p className="font-semibold text-ink">New booking request</p>
                <p className="text-ink-400">Ava L. · Wedding · Jun 18</p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-ink-50 text-ink-400">Decline</span>
              <span style={{ ...step(inView, 2000), transform: inView ? 'scale(1)' : 'scale(0.95)' }} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold py-2 rounded-xl bg-emerald-500 text-white">
                <CheckCircle2 className="w-3.5 h-3.5" /> Accept
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Auto-sent confirmation chat bubble */}
      <div style={{ opacity: inView ? 1 : 0, transform: inView ? 'translateY(0)' : 'translateY(16px)', transition: 'opacity 550ms ease 2300ms, transform 550ms ease 2300ms' }} className="mt-4 rounded-2xl bg-ink text-white px-4 py-3 shadow-lg">
        <div className="flex items-center gap-2 text-sm">
          <Send className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span><span className="font-semibold">Confirmation sent</span> — “See you Jun 18!”</span>
        </div>
        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-emerald-400">
          <CheckCheck className="w-3 h-3" /> Delivered
        </div>
      </div>
    </div>
  )
}

function ScoreCount({ to, run }: { to: number; run: boolean }) {
  const [n, setN] = useState(61)
  useEffect(() => {
    if (!run) return
    const from = 61, dur = 1400, delay = 1300
    const start = performance.now()
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start - delay) / dur)
      if (p > 0) setN(Math.round(from + (to - from) * p))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [run, to])
  return <>{n}</>
}
