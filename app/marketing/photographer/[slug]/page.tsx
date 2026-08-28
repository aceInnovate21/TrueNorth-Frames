'use client'

import Image from 'next/image'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft, Star, MapPin, Shield, MessageSquare, CalendarCheck,
  CheckCircle2, X, Camera, Award, ThumbsUp,
} from 'lucide-react'
import { PhotographerBadge } from '@/components/photographer-badge'
import { getPhotographer, makeBadge } from '../../data'

export default function PhotographerProfile() {
  const { slug } = useParams<{ slug: string }>()
  const p = getPhotographer(slug)
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (!p) return notFound()

  const trustRows = [
    { icon: Award, label: 'Verified Google Business Profile', value: 'Connected' },
    { icon: Star, label: 'Verified reviews', value: `${p.reviews} · ${p.rating.toFixed(1)} avg` },
    { icon: ThumbsUp, label: 'Completed bookings', value: `${p.bookings} on TrueNorth` },
    { icon: Camera, label: 'Portfolio depth', value: `${p.portfolio.length}+ published photos` },
  ]

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
      <Link href="/marketing/browse" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to browse
      </Link>

      {/* Cover */}
      <div className="relative h-64 sm:h-80 rounded-3xl overflow-hidden bg-ink-100">
        <Image src={p.cover} alt={p.name} fill className="object-cover" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {p.availableToday && (
          <div className="absolute top-4 right-4 bg-emerald-500 rounded-full px-3 py-1.5">
            <span className="text-white text-xs font-bold">Available today</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <div className="flex items-end gap-4">
            <div className={`w-16 h-16 rounded-2xl border-2 border-white/80 shadow-lg flex items-center justify-center text-white text-xl font-bold ${p.avatarColor}`}>
              {p.initials}
            </div>
            <div className="pb-1">
              <h1 className="text-white text-2xl sm:text-3xl font-semibold tracking-tight">{p.name}</h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-white/80 text-sm">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p.location}</span>
                <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" /> {p.rating.toFixed(1)} ({p.reviews})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mt-6">
        {/* Left: bio, portfolio */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <PhotographerBadge badge={makeBadge(p.badge)} size="md" />
            {p.specialties.map((s) => (
              <span key={s} className="bg-ink-50 text-ink-500 text-xs font-medium px-2.5 py-1 rounded-full">{s}</span>
            ))}
          </div>

          <p className="text-ink-600 leading-relaxed">{p.bio}</p>

          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.1em] text-ink-400 mb-3">Portfolio</h2>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {p.portfolio.map((src, i) => (
                <button key={i} onClick={() => setLightbox(src)} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
                  <Image src={src} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="200px" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: trust + actions (sticky) */}
        <div className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="bg-white ring-1 ring-ink-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="font-semibold">Trust Score</span>
              </div>
              <span className="text-3xl font-bold text-emerald-600 tabular-nums">{p.trustScore}</span>
            </div>
            <div className="h-2 rounded-full bg-ink-100 overflow-hidden mb-4">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${p.trustScore}%` }} />
            </div>
            <ul className="space-y-2.5">
              {trustRows.map((r) => (
                <li key={r.label} className="flex items-start gap-2.5 text-sm">
                  <r.icon className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                  <span className="text-ink-600 flex-1">{r.label}</span>
                  <span className="text-ink font-medium text-right text-xs">{r.value}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white ring-1 ring-ink-100 rounded-2xl p-5 shadow-sm space-y-2.5">
            <Link href={`/marketing/book?to=${p.slug}`} className="flex items-center justify-center gap-2 bg-ink text-white text-sm font-semibold py-3 rounded-xl hover:bg-ink-800 transition-colors">
              <CalendarCheck className="w-4 h-4" /> Request a booking
            </Link>
            <Link href={`/marketing/messages?to=${p.slug}`} className="flex items-center justify-center gap-2 bg-ink-50 text-ink-700 text-sm font-semibold py-3 rounded-xl hover:bg-ink-100 transition-colors">
              <MessageSquare className="w-4 h-4" /> Message {p.name.split(' ')[0]}
            </Link>
            <div className="flex items-center gap-1.5 justify-center text-[11px] text-emerald-600 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Usually replies within an hour
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative w-full max-w-3xl aspect-[4/3]">
            <Image src={lightbox} alt="" fill className="object-contain" sizes="90vw" />
          </div>
        </div>
      )}
    </main>
  )
}
