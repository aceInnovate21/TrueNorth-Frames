'use client'

import Image from 'next/image'
import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft, Star, MapPin, Shield, Camera, Award, Package,
  Calendar, Eye, MessageSquare, X, BadgeCheck, ExternalLink, Heart, ChevronDown,
} from 'lucide-react'
import { PhotographerBadge } from '@/components/photographer-badge'
import { getPhotographer, makeBadge, u, type Pkg, type Review, type Faq } from '../../data'
import { SiteNav } from '../../site-nav'
import { SiteFooter } from '../../site-footer'

function StarRow({ rating, count }: { rating: number; count: number }) {
  return (
    <span className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-ink-200 fill-ink-100'}`} />
      ))}
      <span className="text-xs font-bold text-ink ml-1">{rating.toFixed(1)}</span>
      <span className="text-xs text-ink-300">({count})</span>
    </span>
  )
}

export default function PhotographerProfile() {
  const { slug } = useParams<{ slug: string }>()
  const p = getPhotographer(slug)
  const [lightbox, setLightbox] = useState<number | null>(null)
  if (!p) return notFound()

  const scoreColor = p.trustScore >= 90 ? '#10b981' : p.trustScore >= 75 ? '#3b82f6' : '#f59e0b'

  return (
    <>
      <SiteNav />

      {/* Cover */}
      <div className="relative h-56 sm:h-72 bg-ink-900 overflow-hidden">
        <Image src={u(p.coverId, 1400, 500)} alt="" fill className="object-cover opacity-90" sizes="100vw" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <Link href="/marketing/browse" className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md text-white text-xs font-medium px-3 py-2 rounded-full border border-white/20 hover:bg-white/20 transition-colors">
            <ArrowLeft className="w-3 h-3" /> All photographers
          </Link>
        </div>
      </div>

      {/* Profile header */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end gap-4 -mt-12 pb-4 relative z-10">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white bg-ink flex-shrink-0" style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
              <Image src={u(p.avatarId, 200, 200)} alt={p.name} fill className="object-cover" sizes="96px" />
            </div>
          </div>

          <div className="pb-5">
            <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink tracking-tight">{p.name}</h1>
                  {p.founder && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border bg-amber-50 text-amber-700 border-amber-200">
                      <span className="text-xs">🏅</span>Founding Member
                    </span>
                  )}
                  <PhotographerBadge badge={makeBadge(p.badge)} size="md" />
                </div>
                <p className="text-ink-400 text-sm mt-1">{p.tagline}</p>
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  <span className="flex items-center gap-1 text-ink-400 text-xs"><MapPin className="w-3 h-3" />{p.location}</span>
                  <span className="flex items-center gap-1 text-ink-400 text-xs"><Camera className="w-3 h-3" />{p.yearsExperience >= 10 ? '10+ years' : `${p.yearsExperience}+ years`} in Edmonton</span>
                  <span className="flex items-center gap-1 text-ink-300 text-xs"><Award className="w-3 h-3" />Member since {p.memberSince}</span>
                  <StarRow rating={p.rating} count={p.reviews} />
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {p.specialties.map((s) => (
                    <span key={s} className="bg-ink text-white text-[10px] font-semibold px-2.5 py-1 rounded-full tracking-wide">{s}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 mt-1">
                <button className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-ink-100 text-ink-400 hover:text-rose-500 hover:border-rose-200 transition-colors">
                  <Heart className="w-4 h-4" />
                </button>
                <Link href={`/marketing/book?to=${p.slug}`} className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm">
                  Request a booking
                </Link>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 -mb-px">
            <button className="px-4 py-2.5 text-sm font-medium border-b-2 border-ink text-ink">Overview</button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-ink-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left column */}
            <div className="lg:col-span-2 space-y-5">
              <section className="bg-white rounded-2xl p-6 border border-ink-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 className="font-semibold text-ink text-base mb-3">About</h2>
                <div className="text-ink-500 text-sm leading-relaxed space-y-3">
                  {p.bio.split('\n\n').map((para, i) => <p key={i}>{para}</p>)}
                </div>
              </section>

              {/* Portfolio */}
              <section className="bg-white rounded-2xl p-6 border border-ink-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-ink text-base">Portfolio</h2>
                  <span className="text-xs text-ink-300">{p.portfolioIds.length} photos</span>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {p.portfolioIds.map((id, i) => (
                    <button key={i} onClick={() => setLightbox(i)} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
                      <Image src={u(id, 300, 300)} alt="" fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="200px" />
                    </button>
                  ))}
                </div>
              </section>

              {/* Packages */}
              <section className="bg-white rounded-2xl p-6 border border-ink-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-2 mb-5">
                  <Package className="w-4 h-4 text-ink-400" />
                  <h2 className="font-semibold text-ink text-base">Packages</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {p.packages.map((pkg) => <PackageCard key={pkg.id} pkg={pkg} slug={p.slug} />)}
                </div>
              </section>

              {/* Reviews */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold text-ink text-base">Reviews</h2>
                    <span className="text-ink-300 text-sm">({p.reviews})</span>
                  </div>
                  <StarRow rating={p.rating} count={p.reviews} />
                </div>
                <div className="space-y-3">
                  {p.reviewList.map((r, i) => <ReviewCard key={i} r={r} />)}
                </div>
              </section>

              {/* FAQ */}
              <section className="bg-white rounded-2xl px-6 py-5 border border-ink-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h2 className="font-semibold text-ink text-base mb-1">FAQ</h2>
                {p.faqs.map((f, i) => <FaqItem key={i} f={f} />)}
              </section>

              {/* Availability */}
              <section className="bg-white rounded-2xl p-6 border border-ink-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-4 h-4 text-ink-400" />
                  <h2 className="font-semibold text-ink text-base">Availability</h2>
                  <span className="text-ink-300 text-xs ml-auto">Next 7 days</span>
                </div>
                <div className="grid grid-cols-7 gap-2">
                  {p.availability.map((a) => {
                    const d = new Date(a.date + 'T00:00')
                    const color = a.status === 'open' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : a.status === 'few' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-ink-50 text-ink-300 border-ink-100'
                    return (
                      <div key={a.date} className={`rounded-xl border text-center py-2.5 ${color}`}>
                        <p className="text-[10px] font-medium uppercase">{d.toLocaleDateString('en', { weekday: 'short' })}</p>
                        <p className="text-sm font-bold">{d.getDate()}</p>
                        <p className="text-[9px] mt-0.5 capitalize">{a.status === 'few' ? 'Few left' : a.status}</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.18)' }}>
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <p className="font-semibold text-base mb-1">Book {p.name.split(' ')[0]}</p>
                <p className="text-white/40 text-xs mb-4">Send a request — {p.name.split(' ')[0]} usually replies within an hour.</p>
                <Link href={`/marketing/book?to=${p.slug}`} className="w-full bg-white hover:bg-ink-50 text-ink font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm">
                  Request a booking
                </Link>
                <Link href={`/marketing/messages?to=${p.slug}`} className="w-full mt-2 bg-white/10 hover:bg-white/20 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm border border-white/20">
                  <MessageSquare className="w-4 h-4" /> Message
                </Link>
              </div>

              {/* At a glance */}
              <div className="bg-white rounded-2xl p-5 border border-ink-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <h3 className="font-semibold text-ink text-sm mb-4">At a glance</h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { label: 'Reviews', value: String(p.reviews), icon: Star },
                    { label: 'Specialties', value: String(p.specialties.length), icon: Camera },
                    { label: 'Trust score', value: String(p.trustScore), icon: Shield },
                    { label: 'Profile views', value: p.profileViews.toLocaleString(), icon: Eye },
                  ].map((stat) => {
                    const Icon = stat.icon
                    return (
                      <div key={stat.label} className="bg-ink-50 rounded-xl p-3 text-center border border-ink-50">
                        <Icon className="w-4 h-4 text-ink-300 mx-auto mb-1.5" />
                        <p className="font-bold text-ink text-lg leading-none">{stat.value}</p>
                        <p className="text-ink-300 text-[10px] mt-1 font-medium">{stat.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Trust card */}
              <div className="bg-white rounded-2xl p-5 border border-ink-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-ink-400" />
                    <h3 className="font-semibold text-ink text-sm">Trust score</h3>
                  </div>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border" style={{ backgroundColor: `${scoreColor}10`, borderColor: `${scoreColor}40` }}>
                    <Shield className="w-3 h-3" style={{ color: scoreColor }} />
                    <span className="text-xs font-bold" style={{ color: scoreColor }}>{p.trustScore}</span>
                    <span className="text-[10px] text-ink-300">/100</span>
                  </div>
                </div>
                {p.gbp.verified && (
                  <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded-xl">
                    <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-700">Verified on Google</p>
                      <p className="text-[10px] text-emerald-600">Active Google Business Profile confirmed</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-slate-50 to-white border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-white border border-blue-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-black text-blue-500 leading-none">G</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-ink-400 mb-0.5">Google Business · {p.gbp.username}</p>
                    <div className="flex items-center gap-1.5">
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star key={i} className={`w-3 h-3 ${i <= Math.round(p.gbp.rating) ? 'text-amber-400 fill-amber-400' : 'text-ink-100 fill-ink-100'}`} />
                        ))}
                        <span className="text-xs font-bold text-ink ml-1">{p.gbp.rating.toFixed(1)}</span>
                      </div>
                      <span className="text-[10px] text-ink-300">{p.gbp.count} reviews</span>
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-ink-200 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />

      {/* Lightbox */}
      {lightbox !== null && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
            <X className="w-5 h-5 text-white" />
          </button>
          <div className="relative w-full max-w-3xl aspect-[4/3]">
            <Image src={u(p.portfolioIds[lightbox], 1000, 750)} alt="" fill className="object-contain" sizes="90vw" />
          </div>
        </div>
      )}
    </>
  )
}

function PackageCard({ pkg, slug }: { pkg: Pkg; slug: string }) {
  return (
    <div className="rounded-xl border border-ink-100 p-4 flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <span className="bg-ink-50 text-ink-500 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">{pkg.specialty.replace('-', ' ')}</span>
      </div>
      <p className="font-semibold text-ink text-sm mt-1">{pkg.name}</p>
      <p className="text-ink-400 text-xs mt-0.5">{pkg.duration} · {pkg.blurb}</p>
      <ul className="mt-3 space-y-1 flex-1">
        {pkg.features.map((f) => (
          <li key={f} className="flex items-start gap-1.5 text-[11px] text-ink-500">
            <span className="w-1 h-1 rounded-full bg-ink-300 mt-1.5 flex-shrink-0" />{f}
          </li>
        ))}
      </ul>
      <Link href={`/marketing/book?to=${slug}&pkg=${pkg.id}`} className="mt-3 text-center text-xs font-semibold bg-ink text-white py-2 rounded-lg hover:bg-ink-800 transition-colors">
        Request a booking
      </Link>
    </div>
  )
}

function ReviewCard({ r }: { r: Review }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-ink-50" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-3 mb-2">
        <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${r.color}`}>{r.initials}</span>
        <div>
          <p className="font-semibold text-ink text-sm">{r.author}</p>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'text-amber-400 fill-amber-400' : 'text-ink-100 fill-ink-100'}`} />)}
            <span className="text-[10px] text-ink-300 ml-1">{r.date}</span>
          </div>
        </div>
      </div>
      <p className="text-ink-500 text-sm leading-relaxed">{r.text}</p>
    </div>
  )
}

function FaqItem({ f }: { f: Faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-ink-50 last:border-0">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-4 py-3.5 text-left">
        <span className="text-sm font-medium text-ink">{f.q}</span>
        <ChevronDown className={`w-4 h-4 text-ink-300 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="text-sm text-ink-500 leading-relaxed pb-3.5">{f.a}</p>}
    </div>
  )
}
