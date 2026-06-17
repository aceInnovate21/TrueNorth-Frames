'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import {
  ArrowRight, Camera, Search, Star, Briefcase, Home, Heart,
  Sparkles, User, Baby, Shield, CheckCircle2, MapPin, ChevronRight,
  Images, MessageSquare, Bell, Quote,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'

const SPECIALTIES = [
  { name: 'Wedding',     icon: Heart,     href: '/photographers?specialty=wedding' },
  { name: 'Portrait',    icon: User,      href: '/photographers?specialty=portrait' },
  { name: 'Corporate',   icon: Briefcase, href: '/photographers?specialty=corporate' },
  { name: 'Real Estate', icon: Home,      href: '/photographers?specialty=real-estate' },
  { name: 'Events',      icon: Sparkles,  href: '/photographers?specialty=events' },
  { name: 'Newborn',     icon: Baby,      href: '/photographers?specialty=newborn' },
]

const CARD_GRADIENTS = [
  'from-slate-700 to-slate-900',
  'from-zinc-700 to-zinc-900',
  'from-neutral-700 to-neutral-900',
]

type FeaturedPhotographer = {
  name: string; initials: string; specialty: string[]
  rating: number; reviews: number; rate: string
  location: string; slug: string; gradient: string
  avatarUrl: string | null; trustScore: number
}

const HERO_PHOTOS = [
  { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop', alt: 'Wedding photography',   label: 'Wedding',   rotate: '2deg',   tx: '24px',  ty: '-8px', z: 1 },
  { src: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80&fit=crop', alt: 'Portrait photography',  label: 'Portrait',  rotate: '-1.5deg',tx: '-16px', ty: '0px',  z: 2 },
  { src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&fit=crop', alt: 'Corporate photography', label: 'Corporate', rotate: '3.5deg', tx: '8px',   ty: '12px', z: 3 },
]

const SEARCH_SUGGESTIONS = [
  { name: 'Wedding photographers',     sub: 'in Edmonton', slug: '?specialty=wedding' },
  { name: 'Portrait photographers',    sub: 'in Edmonton', slug: '?specialty=portrait' },
  { name: 'Corporate photographers',   sub: 'in Edmonton', slug: '?specialty=corporate' },
  { name: 'Newborn photographers',     sub: 'in Edmonton', slug: '?specialty=newborn' },
  { name: 'Events photographers',      sub: 'in Edmonton', slug: '?specialty=events' },
  { name: 'Real estate photographers', sub: 'in Edmonton', slug: '?specialty=real-estate' },
]

function HeroPhotoStack() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 520 }}>
      <div className="absolute inset-0 bg-gradient-radial from-ink-100/60 to-transparent rounded-3xl blur-2xl pointer-events-none" />
      {HERO_PHOTOS.map((photo, i) => (
        <div
          key={photo.label}
          className="absolute w-[280px] h-[370px] rounded-2xl overflow-hidden"
          style={{
            transform: `perspective(900px) rotateY(${-8 + i * 3}deg) rotateX(${4 - i}deg) rotate(${photo.rotate}) translate(${photo.tx}, ${photo.ty})`,
            zIndex: photo.z,
            boxShadow: i === 2
              ? '0 8px 16px rgba(0,0,0,0.10), 0 24px 56px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)'
              : '0 4px 12px rgba(0,0,0,0.08), 0 16px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.05)',
          }}
        >
          <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="280px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-white text-[11px] font-medium tracking-wide">
            {photo.label}
          </div>
        </div>
      ))}

      {/* Trust badge */}
      <div
        className="absolute -bottom-4 right-6 bg-white rounded-2xl px-4 py-3"
        style={{ zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-ink leading-none mb-0.5">GBP Verified</p>
            <p className="text-[10px] text-ink-400 leading-none">Real reviews · Real score</p>
          </div>
        </div>
      </div>

      {/* Location badge */}
      <div
        className="absolute top-8 -left-2 bg-white rounded-xl px-3 py-2"
        style={{ zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[11px] font-bold text-ink">Edmonton only</p>
        </div>
        <p className="text-[10px] text-ink-300 mt-0.5 ml-4">Photographers near you</p>
      </div>
    </div>
  )
}

function PhotographerCard({ p, index }: { p: FeaturedPhotographer; index: number }) {
  return (
    <Link
      href={`/photographers/${p.slug}`}
      className="group block"
      style={{
        transform: `perspective(1000px) rotateY(${index === 0 ? '3deg' : index === 2 ? '-3deg' : '0deg'}) rotateX(1.5deg)`,
        transition: 'transform 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden group-hover:-translate-y-1.5 transition-all duration-500"
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' }}
      >
        <div className={`h-48 bg-gradient-to-br ${p.gradient} relative overflow-hidden`}>
          {p.avatarUrl && (
            <Image src={p.avatarUrl} alt={p.name} fill className="object-cover opacity-60" sizes="400px" />
          )}
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-white text-[10px] font-medium">Active</span>
            </div>
          </div>
          {p.rating > 0 && (
            <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 text-white fill-white" />
              <span className="text-white text-[10px] font-bold">{p.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="absolute bottom-3 left-3 w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold text-xs">
            {p.initials}
          </div>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className="font-semibold text-ink text-sm">{p.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-ink-300" />
                <p className="text-ink-300 text-[11px]">{p.location || 'Edmonton, AB'}</p>
              </div>
            </div>
            {p.rate && <p className="font-bold text-ink text-sm">{p.rate}</p>}
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {p.specialty.slice(0, 3).map((s) => (
              <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-50">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= Math.round(p.rating) ? 'bg-ink-700' : 'bg-ink-100'}`} />
              ))}
              {p.reviews > 0 && <span className="text-ink-300 text-[10px] ml-1">{p.reviews} reviews</span>}
            </div>
            <span className="text-ink text-[10px] font-semibold flex items-center gap-0.5 group-hover:gap-1 transition-all">
              View profile <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function PhotographerCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden animate-pulse"
      style={{
        transform: `perspective(1000px) rotateY(${index === 0 ? '3deg' : index === 2 ? '-3deg' : '0deg'}) rotateX(1.5deg)`,
        boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      <div className="h-48 bg-ink-100" />
      <div className="p-4 space-y-3">
        <div className="h-3.5 bg-ink-100 rounded w-2/3" />
        <div className="h-2.5 bg-ink-50 rounded w-1/2" />
        <div className="flex gap-1"><div className="h-5 bg-ink-50 rounded-full w-16" /><div className="h-5 bg-ink-50 rounded-full w-14" /></div>
        <div className="h-px bg-ink-50" />
        <div className="h-2.5 bg-ink-50 rounded w-3/4" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [query, setQuery]       = useState('')
  const [specialty, setSpecialty] = useState('')
  const [showSugg, setShowSugg] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [featured, setFeatured] = useState<FeaturedPhotographer[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  const suggestions = query.trim().length > 0
    ? SEARCH_SUGGESTIONS.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSugg(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    fetch('/api/photographers?sort=trust&page=1')
      .then((r) => r.json())
      .then((data) => {
        const rows = (data.photographers ?? data ?? []).slice(0, 3)
        setFeatured(rows.map((p: any, i: number) => {
          const fullName: string = p.display_name ?? p.name ?? 'Photographer'
          const initials = fullName.split(' ').filter(Boolean).map((w: string) => w[0].toUpperCase()).slice(0, 2).join('')
          return {
            name: fullName, initials,
            specialty: p.specialties ?? [],
            rating: Number(p.native_avg_rating ?? p.trust_score ?? 0),
            reviews: Number(p.native_review_count ?? 0),
            rate: p.rate_display ?? '',
            location: p.location ?? '',
            slug: p.username ?? p.id,
            gradient: CARD_GRADIENTS[i % CARD_GRADIENTS.length],
            avatarUrl: p.avatar_url ?? null,
            trustScore: Number(p.trust_score ?? 0),
          }
        }))
      })
      .catch(() => {})
      .finally(() => setFeaturedLoading(false))
  }, [])

  return (
    <>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 lg:gap-16 items-center min-h-[600px] py-16 lg:py-24">

            {/* Left — client-facing copy */}
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-ink-50 border border-ink-100 rounded-full px-3.5 py-1.5 mb-8">
                <MapPin className="w-3 h-3 text-ink-400" />
                <span className="text-ink-500 text-xs font-medium tracking-wide">Edmonton, Alberta · Local photographers only</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[64px] font-bold text-ink leading-[1.02] mb-6 text-balance">
                Find your<br />Edmonton<br />
                <span className="relative inline-block">
                  photographer.
                  <svg className="absolute -bottom-1.5 left-0 w-full overflow-visible" height="8" viewBox="0 0 400 8" fill="none" preserveAspectRatio="none">
                    <path d="M2 6 C80 2, 160 6, 240 4 C320 2, 370 5, 398 3" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.15" />
                  </svg>
                </span>
              </h1>

              <p className="text-ink-400 text-lg leading-relaxed mb-8 max-w-md">
                Every photographer on TrueNorth Frames is Google-verified, portfolio-reviewed, and Edmonton-based. Browse by specialty, read real scores, and message directly — free.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/photographers" className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-[0_4px_14px_rgba(0,0,0,0.25)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.30)] hover:-translate-y-0.5">
                  Browse photographers <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/for-photographers" className="inline-flex items-center gap-2 border border-ink-200 hover:border-ink text-ink-500 hover:text-ink font-medium px-6 py-3.5 rounded-xl transition-all duration-200 text-sm hover:bg-ink-50">
                  List your work
                </Link>
              </div>

              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {['No booking fees', 'GBP verified', 'Edmonton-only', 'Free to browse'].map((v) => (
                  <div key={v} className="flex items-center gap-1.5 text-xs text-ink-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ink flex-shrink-0" />
                    {v}
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:block">
              <HeroPhotoStack />
            </div>
          </div>
        </div>
      </section>

      {/* ── Search bar ───────────────────────────────────────────────── */}
      <div className="bg-ink-50 border-y border-ink-100 py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <p className="text-center text-xs font-semibold text-ink-300 uppercase tracking-[0.15em] mb-4">Search Edmonton photographers</p>
          <div className="relative" ref={searchRef}>
            <div
              className="flex flex-col sm:flex-row bg-white rounded-2xl overflow-hidden"
              style={{ boxShadow: '0 0 0 1.5px rgba(0,0,0,0.09), 0 4px 20px rgba(0,0,0,0.08)' }}
            >
              <label className="flex items-center gap-3 flex-1 px-5 py-4 min-w-0 border-b sm:border-b-0 sm:border-r border-ink-100">
                <Search className="w-4 h-4 text-ink-300 flex-shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setShowSugg(true) }}
                  onFocus={() => setShowSugg(true)}
                  placeholder="Specialty, name, or style..."
                  className="bg-transparent text-ink placeholder-ink-300 text-sm outline-none w-full"
                />
              </label>
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="text-ink-400 text-sm px-5 py-4 outline-none bg-transparent cursor-pointer flex-shrink-0 border-b sm:border-b-0 sm:border-r border-ink-100"
              >
                <option value="">All specialties</option>
                <option value="wedding">Wedding</option>
                <option value="portrait">Portrait</option>
                <option value="corporate">Corporate</option>
                <option value="real-estate">Real Estate</option>
                <option value="events">Events</option>
                <option value="newborn">Newborn</option>
              </select>
              <Link
                href={`/photographers${specialty ? `?specialty=${specialty}` : ''}${query ? `${specialty ? '&' : '?'}q=${encodeURIComponent(query)}` : ''}`}
                className="bg-ink hover:bg-ink-800 text-white font-semibold text-sm px-7 py-4 flex items-center justify-center gap-2 transition-colors whitespace-nowrap flex-shrink-0"
              >
                Search <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {showSugg && suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl overflow-hidden z-50"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12)' }}
              >
                {suggestions.map((s, i) => (
                  <Link
                    key={i}
                    href={`/photographers${s.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 transition-colors border-b border-ink-50 last:border-0"
                    onClick={() => { setShowSugg(false); setQuery('') }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-ink-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-ink text-sm font-medium leading-tight">{s.name}</p>
                      <p className="text-ink-300 text-xs">{s.sub}</p>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-ink-300 text-xs">Quick:</span>
            {['Wedding', 'Portrait', 'Corporate', 'Newborn', 'Events'].map((s) => (
              <button
                key={s}
                onClick={() => setSpecialty(s.toLowerCase())}
                className={`text-xs px-3 py-1 rounded-full border transition-all duration-150 ${specialty === s.toLowerCase() ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300 hover:text-ink'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Trust strip ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {[
              { value: '$0',       label: 'Booking fees — ever' },
              { value: 'GBP',      label: 'Verified trust source' },
              { value: 'Free',     label: 'To browse, no account' },
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

      {/* ── Why it's hard to find a photographer (client problem) ─────── */}
      <section className="bg-ink py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-100 pointer-events-none" />
        {/* subtle radial glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-white/[0.02] rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-ink-500 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Sound familiar?</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Finding a<br />photographer<br />shouldn't be<br />this hard.
              </h2>
              <p className="text-ink-400 text-base leading-relaxed">
                Edmonton has talented photographers everywhere — but there's been no good way to find, compare, and trust them.
              </p>
            </div>
            <div className="space-y-0 divide-y divide-ink-800">
              {[
                { n: '01', text: 'You can't tell who's actually good vs. who's good at marketing' },
                { n: '02', text: 'Reviews are scattered across Google, Facebook, word of mouth' },
                { n: '03', text: 'No way to compare work, rates, and availability in one place' },
                { n: '04', text: 'Booking is a mess — DMs, WhatsApp, email chains, no confirmation' },
                { n: '05', text: 'No platform built for Edmonton's local photography market' },
              ].map((item) => (
                <div key={item.n} className="flex items-start gap-4 py-4">
                  <span className="text-ink-600 text-xs font-bold tracking-widest flex-shrink-0 mt-0.5">{item.n}</span>
                  <p className="text-ink-300 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How TrueNorth Frames solves it — 3 client benefits ────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">How it works for clients</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-4">
              Search. Trust. Book.
            </h2>
            <p className="text-ink-400 text-base max-w-md mx-auto">
              Three steps. No account required to browse. Free forever.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                step: '01',
                icon: Search,
                title: 'Search by work, not price',
                desc: 'Filter by specialty, neighbourhood, and rating. Every result shows portfolio photos front and centre — not just a logo and a quote.',
                highlight: 'Portfolio-first search',
              },
              {
                step: '02',
                icon: Shield,
                title: 'Read their Trust Score',
                desc: 'Every profile shows a verified Trust Score powered by Google Business Profile — real star rating, review count, and account age. Scores update weekly. Photographers can't edit them.',
                highlight: 'Google-verified scores',
              },
              {
                step: '03',
                icon: MessageSquare,
                title: 'Message directly',
                desc: 'Contact any photographer in-app. No commission, no booking fees, no middleman. Pay them directly — we stay out of it.',
                highlight: '$0 platform fees',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.step}
                  className="bg-ink-50 rounded-3xl p-7 flex flex-col relative overflow-hidden group hover:-translate-y-1 transition-all duration-300"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}
                >
                  <span className="absolute top-5 right-6 text-ink-100 text-5xl font-bold font-serif leading-none select-none">{item.step}</span>
                  <div
                    className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center mb-6 flex-shrink-0"
                    style={{
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
                      transform: 'perspective(400px) rotateX(6deg) rotateY(-4deg)',
                    }}
                  >
                    <Icon className="w-5 h-5 text-ink" />
                  </div>
                  <p className="font-bold text-ink text-base mb-2">{item.title}</p>
                  <p className="text-ink-400 text-sm leading-relaxed flex-1">{item.desc}</p>
                  <div className="mt-5 pt-4 border-t border-ink-100">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-ink uppercase tracking-wider">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {item.highlight}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <Link href="/how-it-works" className="inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink-600 transition-colors group">
              See full how-it-works guide <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Why trust them — 4 pillars ────────────────────────────────── */}
      <section className="bg-ink-50 py-24 border-y border-ink-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Built for trust</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-5">
                How do you know<br />who to trust?
              </h2>
              <p className="text-ink-400 text-base leading-relaxed mb-8">
                Every photographer on TrueNorth Frames carries a Trust Score — a composite rating we calculate from their Google Business Profile, profile completeness, and booking history. You see the real number, not what they say about themselves.
              </p>
              <Link href="/how-it-works" className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 text-sm shadow-[0_4px_14px_rgba(0,0,0,0.20)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.28)] hover:-translate-y-0.5">
                How Trust Scores work <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Shield,       pct: '35%', title: 'Google Business Profile', desc: 'Star rating, review count, and account age — pulled directly from GBP weekly.' },
                { icon: User,         pct: '25%', title: 'Profile Completeness',    desc: 'Bio, portfolio, rates, availability all filled in and up to date.' },
                { icon: Star,         pct: '25%', title: 'Platform Activity',        desc: 'Booking history, native client reviews, and response rate on TrueNorth Frames.' },
                { icon: CheckCircle2, pct: '15%', title: 'Admin Verified',           desc: 'Identity confirmed by the TrueNorth Frames team.' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="bg-white rounded-2xl p-5 hover:-translate-y-1 transition-all duration-300"
                    style={{
                      boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)',
                      transform: i % 2 === 0 ? 'perspective(600px) rotateY(2deg) rotateX(1deg)' : 'perspective(600px) rotateY(-2deg) rotateX(1deg)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-ink-50 rounded-xl flex items-center justify-center">
                        <Icon className="w-4 h-4 text-ink-500" />
                      </div>
                      <span className="text-ink font-bold text-sm">{item.pct}</span>
                    </div>
                    <p className="font-semibold text-ink text-xs mb-1">{item.title}</p>
                    <p className="text-ink-400 text-[11px] leading-relaxed">{item.desc}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Photographers ───────────────────────────────────── */}
      <section className="bg-white py-24" id="featured">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">Explore</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight">
                Edmonton<br />photographers
              </h2>
            </div>
            <Link href="/photographers" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-ink-600 transition-colors group">
              Browse all <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start" style={{ perspective: '1200px' }}>
            {featuredLoading
              ? [0, 1, 2].map((i) => <PhotographerCardSkeleton key={i} index={i} />)
              : featured.length > 0
                ? featured.map((p, i) => <PhotographerCard key={p.slug} p={p} index={i} />)
                : (
                  <div className="col-span-3 text-center py-16">
                    <p className="text-ink-300 text-sm">Photographers are joining soon — check back shortly.</p>
                    <Link href="/photographers" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-ink-600 transition-colors">
                      Browse all <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                )
            }
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link href="/photographers" className="text-sm font-semibold text-ink inline-flex items-center gap-2">
              Browse all photographers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Browse by specialty ──────────────────────────────────────── */}
      <section className="bg-ink-50 py-24 border-y border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">What do you need?</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-3">Browse by specialty</h2>
            <p className="text-ink-400 text-base max-w-md mx-auto">
              From weddings to newborns — find a photographer who specialises in exactly what you need.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SPECIALTIES.map((spec, i) => {
              const Icon = spec.icon
              return (
                <Link
                  key={spec.name}
                  href={spec.href}
                  className="group bg-white rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1.5"
                  style={{
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 10px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)',
                    transform: `perspective(600px) rotateX(${i % 2 === 0 ? '4' : '2'}deg) rotateY(${i % 3 === 0 ? '-2' : '2'}deg)`,
                  }}
                >
                  <div className="w-11 h-11 bg-ink-50 group-hover:bg-ink rounded-xl flex items-center justify-center mb-3 transition-all duration-300">
                    <Icon className="w-5 h-5 text-ink-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <p className="font-semibold text-ink text-sm">{spec.name}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── What clients get — feature grid ─────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">For clients</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink">
              Everything you need<br />
              <span className="text-ink-300">to choose confidently.</span>
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink-100 border border-ink-100 rounded-2xl overflow-hidden">
            {[
              { icon: Images,        title: 'Portfolio galleries',     desc: 'Every photographer shows their actual work — masonry grid on desktop, swipeable on mobile. Judge by the photos, not the pitch.' },
              { icon: Shield,        title: 'Verified Trust Scores',   desc: 'Composite score from Google Business Profile, profile completeness, and booking history. Updated weekly, tamper-proof.' },
              { icon: Star,          title: 'Real reviews',            desc: 'Client reviews collected natively on TrueNorth Frames, plus GBP rating. No fake testimonials.' },
              { icon: MapPin,        title: 'Edmonton-only',           desc: 'Every photographer here is Edmonton-based. No out-of-town listings, no national directories.' },
              { icon: MessageSquare, title: 'Direct messaging',        desc: 'Message any photographer in-app. Full history saved to your dashboard. File attachments supported.' },
              { icon: Bell,          title: 'Booking reminders',       desc: 'Automated 24-hour shoot reminders sent to both you and the photographer — nobody forgets.' },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="p-6 flex gap-4 items-start group hover:bg-ink-50/50 transition-colors duration-200">
                  <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 group-hover:scale-105 transition-transform duration-200">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm mb-1">{f.title}</p>
                    <p className="text-ink-400 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Dual CTA — clients + photographers ───────────────────────── */}
      <section className="bg-ink py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-100 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/[0.015] rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-6">

            {/* Client CTA card */}
            <div
              className="bg-white rounded-3xl p-8 flex flex-col"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.08)',
                transform: 'perspective(800px) rotateY(2deg) rotateX(1deg)',
              }}
            >
              <div className="w-10 h-10 bg-ink-50 rounded-2xl flex items-center justify-center mb-6">
                <Search className="w-5 h-5 text-ink" />
              </div>
              <p className="text-ink-300 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">For clients</p>
              <h3 className="font-serif text-2xl font-bold text-ink mb-3 leading-snug">Find your photographer today.</h3>
              <p className="text-ink-400 text-sm leading-relaxed mb-7 flex-1">
                Browse verified Edmonton photographers by specialty. Read real Trust Scores. Message directly — no fees, no account needed to browse.
              </p>
              <div className="space-y-2.5 mb-7">
                {['Free to browse — no account needed', 'GBP-verified Trust Scores', 'Zero booking fees', 'Edmonton-only photographers'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ink flex-shrink-0" />
                    <span className="text-ink-500 text-xs">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/photographers"
                className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 text-sm shadow-[0_4px_14px_rgba(0,0,0,0.22)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.30)] hover:-translate-y-0.5"
              >
                Browse photographers <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Photographer CTA card */}
            <div
              className="bg-ink-800 border border-ink-700 rounded-3xl p-8 flex flex-col"
              style={{
                boxShadow: '0 8px 32px rgba(0,0,0,0.30), 0 0 0 1px rgba(255,255,255,0.04)',
                transform: 'perspective(800px) rotateY(-2deg) rotateX(1deg)',
              }}
            >
              <div className="w-10 h-10 bg-ink-700 rounded-2xl flex items-center justify-center mb-6">
                <Camera className="w-5 h-5 text-ink-300" />
              </div>
              <p className="text-ink-500 text-[10px] font-bold uppercase tracking-[0.15em] mb-2">For photographers</p>
              <h3 className="font-serif text-2xl font-bold text-white mb-3 leading-snug">List your work. Grow your practice.</h3>
              <p className="text-ink-400 text-sm leading-relaxed mb-7 flex-1">
                Your portfolio, Trust Score, packages, and booking tools — all in one place. Edmonton clients are already searching. Up and running in 20 minutes.
              </p>
              <div className="space-y-2.5 mb-7">
                {['Free professional profile', 'Portfolio albums & Trust Score', 'Booking & messaging tools', 'Zero commission, always'].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
                    <span className="text-ink-300 text-xs">{item}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/signup?role=photographer"
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-ink-100 text-ink font-semibold px-6 py-3.5 rounded-xl transition-all duration-200 text-sm hover:-translate-y-0.5"
              >
                Create your free profile <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
