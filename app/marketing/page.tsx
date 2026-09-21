'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight, Camera, Search, Star, Briefcase, Home, Heart,
  Sparkles, User, Baby, Shield, CheckCircle2, MapPin, MessageSquare,
} from 'lucide-react'
import { SiteNav } from './site-nav'
import { SiteFooter } from './site-footer'
import { PhotographerCard } from './photographer-card'
import { PHOTOGRAPHERS, u } from './data'

const SPECIALTIES = [
  { name: 'Wedding', icon: Heart }, { name: 'Portrait', icon: User },
  { name: 'Corporate', icon: Briefcase }, { name: 'Real Estate', icon: Home },
  { name: 'Events', icon: Sparkles }, { name: 'Newborn', icon: Baby },
]

const HERO_PHOTOS = [
  { id: PHOTOGRAPHERS[0].coverId, label: 'Wedding', rotate: '2deg', tx: '24px', ty: '-8px', z: 1 },
  { id: PHOTOGRAPHERS[1].coverId, label: 'Portrait', rotate: '-1.5deg', tx: '-16px', ty: '0px', z: 2 },
  { id: PHOTOGRAPHERS[2].coverId, label: 'Corporate', rotate: '3.5deg', tx: '8px', ty: '12px', z: 3 },
]

const FEATURED = [...PHOTOGRAPHERS].sort((a, b) => b.trustScore - a.trustScore).slice(0, 3)

function HeroPhotoStack() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 520 }}>
      {HERO_PHOTOS.map((photo, i) => (
        <div
          key={photo.label}
          className="absolute w-[280px] h-[370px] rounded-2xl overflow-hidden bg-ink-100"
          style={{
            transform: `perspective(900px) rotateY(${-8 + i * 3}deg) rotateX(${4 - i}deg) rotate(${photo.rotate}) translate(${photo.tx}, ${photo.ty})`,
            zIndex: photo.z,
            boxShadow: '0 8px 16px rgba(0,0,0,0.10), 0 24px 56px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)',
          }}
        >
          <Image src={u(photo.id, 400, 520)} alt={photo.label} fill className="object-cover" sizes="280px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-white text-[11px] font-medium tracking-wide">{photo.label}</div>
        </div>
      ))}
      <div className="absolute -bottom-4 right-6 bg-white rounded-2xl px-4 py-3" style={{ zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center"><Shield className="w-4 h-4 text-white" /></div>
          <div>
            <p className="text-[11px] font-bold text-ink leading-none mb-0.5">GBP Verified</p>
            <p className="text-[10px] text-ink-400 leading-none">Real reviews · Real score</p>
          </div>
        </div>
      </div>
      <div className="absolute top-8 -left-2 bg-white rounded-xl px-3 py-2" style={{ zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)' }}>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[11px] font-bold text-ink">Edmonton only</p>
        </div>
        <p className="text-[10px] text-ink-300 mt-0.5 ml-4">Photographers near you</p>
      </div>
    </div>
  )
}

export default function DemoHome() {
  return (
    <>
      <SiteNav />

      {/* Hero */}
      <section className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 lg:gap-16 items-center min-h-[600px] py-16 lg:py-24">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-ink-50 border border-ink-100 rounded-full px-3.5 py-1.5 mb-8">
                <MapPin className="w-3 h-3 text-ink-400" />
                <span className="text-ink-500 text-xs font-medium tracking-wide">Edmonton, Alberta · Local photographers only</span>
              </div>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[64px] font-bold text-ink leading-[1.02] mb-6 text-balance">
                Find your<br />Edmonton<br /><span className="relative inline-block">photographer.</span>
              </h1>
              <p className="text-ink-400 text-lg leading-relaxed mb-8 max-w-md">
                Every photographer on TrueNorth Frames is Google-verified, portfolio-reviewed, and Edmonton-based. Browse by specialty, read real scores, and message directly — free.
              </p>
              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/marketing/browse" className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3.5 rounded-xl transition-all text-sm shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:-translate-y-0.5">
                  Browse photographers <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/marketing/dashboard" className="inline-flex items-center gap-2 border border-ink-200 hover:border-ink text-ink-500 hover:text-ink font-medium px-6 py-3.5 rounded-xl transition-all text-sm hover:bg-ink-50">
                  List your work
                </Link>
              </div>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {['Free to browse', 'GBP verified', 'Edmonton-only', 'Message directly'].map((v) => (
                  <div key={v} className="flex items-center gap-1.5 text-xs text-ink-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ink flex-shrink-0" />{v}
                  </div>
                ))}
              </div>
            </div>
            <div className="hidden lg:block"><HeroPhotoStack /></div>
          </div>
        </div>
      </section>

      {/* Search bar */}
      <div className="bg-ink-50 border-y border-ink-100 py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-semibold text-ink-300 uppercase tracking-[0.15em] mb-4">Search Edmonton photographers</p>
          <Link href="/marketing/browse" className="flex bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 0 0 1.5px rgba(0,0,0,0.09), 0 4px 20px rgba(0,0,0,0.08)' }}>
            <span className="flex items-center gap-3 flex-1 px-5 py-4 min-w-0">
              <Search className="w-4 h-4 text-ink-300 flex-shrink-0" />
              <span className="text-ink-300 text-sm">Specialty, name, or style…</span>
            </span>
            <span className="bg-ink text-white font-semibold text-sm px-7 py-4 flex items-center gap-2 whitespace-nowrap">Search <ArrowRight className="w-4 h-4" /></span>
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-ink-300 text-xs">Quick:</span>
            {['Wedding', 'Portrait', 'Corporate', 'Newborn', 'Events'].map((s) => (
              <Link key={s} href="/marketing/browse" className="text-xs px-3 py-1 rounded-full border bg-white text-ink-500 border-ink-100 hover:border-ink-300 hover:text-ink transition-all">{s}</Link>
            ))}
          </div>
        </div>
      </div>

      {/* Trust strip */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {[
              { value: 'Direct', label: 'Message photographers' },
              { value: 'GBP', label: 'Verified trust source' },
              { value: 'Free', label: 'To browse, no account' },
              { value: 'Edmonton', label: 'Focused. Local. Yours.' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <span className="font-bold text-ink text-xl tracking-tight">{stat.value}</span>
                <span className="text-ink-300 text-xs leading-tight max-w-[90px]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How it works */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">How it works for clients</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-4">Search. Trust. Book.</h2>
            <p className="text-ink-400 text-base max-w-md mx-auto">Three steps. No account required to browse.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { step: '01', icon: Search, title: 'Search by work, not price', desc: 'Filter by specialty, neighbourhood, and rating. Every result shows portfolio photos front and centre.', highlight: 'Portfolio-first search' },
              { step: '02', icon: Shield, title: 'Read their Trust Score', desc: 'Every profile shows a verified Trust Score powered by Google Business Profile. Photographers can’t edit them.', highlight: 'Google-verified scores' },
              { step: '03', icon: MessageSquare, title: 'Message directly', desc: 'Contact any photographer in-app and message them directly — no middleman.', highlight: '$0 platform fees' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="bg-ink-50 rounded-3xl p-7 flex flex-col relative overflow-hidden hover:-translate-y-1 transition-all" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.05)' }}>
                  <span className="absolute top-5 right-6 text-ink-100 text-5xl font-bold font-serif leading-none select-none">{item.step}</span>
                  <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center mb-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                    <Icon className="w-5 h-5 text-ink" />
                  </div>
                  <p className="font-bold text-ink text-base mb-2">{item.title}</p>
                  <p className="text-ink-400 text-sm leading-relaxed flex-1">{item.desc}</p>
                  <div className="mt-5 pt-4 border-t border-ink-100">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink uppercase tracking-wider"><CheckCircle2 className="w-3.5 h-3.5" />{item.highlight}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Featured photographers */}
      <section className="bg-ink-50 py-24 border-y border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">Explore</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight">Edmonton<br />photographers</h2>
            </div>
            <Link href="/marketing/browse" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-ink-600 transition-colors group">
              Browse all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {FEATURED.map((p) => <PhotographerCard key={p.slug} p={p} />)}
          </div>
        </div>
      </section>

      {/* Browse by specialty */}
      <section className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">What do you need?</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-3">Browse by specialty</h2>
            <p className="text-ink-400 text-base max-w-md mx-auto">From weddings to newborns — find a photographer who specialises in exactly what you need.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SPECIALTIES.map((spec) => {
              const Icon = spec.icon
              return (
                <Link key={spec.name} href="/marketing/browse" className="group bg-ink-50 rounded-2xl p-5 flex flex-col items-center text-center transition-all hover:-translate-y-1.5" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.05)' }}>
                  <div className="w-11 h-11 bg-white group-hover:bg-ink rounded-xl flex items-center justify-center mb-3 transition-all">
                    <Icon className="w-5 h-5 text-ink-400 group-hover:text-white transition-colors" />
                  </div>
                  <p className="font-semibold text-ink text-sm">{spec.name}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* Dual CTA */}
      <section className="bg-ink py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-8 flex flex-col">
              <div className="w-10 h-10 bg-ink-50 rounded-2xl flex items-center justify-center mb-6"><Search className="w-5 h-5 text-ink" /></div>
              <p className="text-ink-300 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">For clients</p>
              <h3 className="font-serif text-2xl font-bold text-ink mb-3 leading-snug">Find your photographer today.</h3>
              <p className="text-ink-400 text-sm leading-relaxed mb-7 flex-1">Browse verified Edmonton photographers by specialty. Read real Trust Scores. Message directly.</p>
              <Link href="/marketing/browse" className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3.5 rounded-xl transition-all text-sm hover:-translate-y-0.5">
                Browse photographers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-ink-800 border border-ink-700 rounded-3xl p-8 flex flex-col">
              <div className="w-10 h-10 bg-ink-700 rounded-2xl flex items-center justify-center mb-6"><Camera className="w-5 h-5 text-ink-300" /></div>
              <p className="text-ink-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">For photographers</p>
              <h3 className="font-serif text-2xl font-bold text-white mb-3 leading-snug">List your work. Grow your practice.</h3>
              <p className="text-ink-400 text-sm leading-relaxed mb-7 flex-1">Your portfolio, Trust Score, packages, and booking tools — all in one place.</p>
              <Link href="/marketing/dashboard" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-ink-100 text-ink font-semibold px-6 py-3.5 rounded-xl transition-all text-sm hover:-translate-y-0.5">
                Open the dashboard <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
