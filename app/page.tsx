'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef, useEffect } from 'react'
import {
  ArrowRight,
  Camera,
  Search,
  Star,
  Briefcase,
  Home,
  Heart,
  Sparkles,
  User,
  Baby,
  Shield,
  CheckCircle2,
  MapPin,
  ChevronRight,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'

// ─── Data ──────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  { name: 'Wedding', icon: Heart, count: 12, href: '/photographers?specialty=wedding' },
  { name: 'Portrait', icon: User, count: 18, href: '/photographers?specialty=portrait' },
  { name: 'Corporate', icon: Briefcase, count: 14, href: '/photographers?specialty=corporate' },
  { name: 'Real Estate', icon: Home, count: 8, href: '/photographers?specialty=real-estate' },
  { name: 'Events', icon: Sparkles, count: 11, href: '/photographers?specialty=events' },
  { name: 'Newborn', icon: Baby, count: 9, href: '/photographers?specialty=newborn' },
]

const PHOTOGRAPHERS = [
  {
    name: 'Sarah Chen',
    initials: 'SC',
    specialty: ['Wedding', 'Portrait'],
    rating: 4.9,
    reviews: 47,
    rate: '$200',
    rateType: 'session',
    location: 'Oliver, Edmonton',
    gradient: 'from-slate-700 to-slate-900',
    status: 'online' as const,
    sources: ['Google', 'Yelp', 'Instagram'],
    slug: 'sarah-chen',
  },
  {
    name: 'Marcus Wright',
    initials: 'MW',
    specialty: ['Corporate', 'Events'],
    rating: 4.7,
    reviews: 31,
    rate: '$150',
    rateType: 'hr',
    location: 'Downtown, Edmonton',
    gradient: 'from-zinc-700 to-zinc-900',
    status: 'recent' as const,
    sources: ['Google', 'Instagram'],
    slug: 'marcus-wright',
  },
  {
    name: 'Priya Patel',
    initials: 'PP',
    specialty: ['Newborn', 'Family'],
    rating: 4.8,
    reviews: 62,
    rate: '$175',
    rateType: 'session',
    location: 'Glenora, Edmonton',
    gradient: 'from-neutral-700 to-neutral-900',
    status: 'online' as const,
    sources: ['Google', 'Yelp'],
    slug: 'priya-patel',
  },
]

// Hero photo stack — Unsplash free images
const HERO_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=80&fit=crop',
    alt: 'Wedding photography',
    label: 'Wedding',
    rotate: '2deg',
    translateX: '24px',
    translateY: '-8px',
    zIndex: 1,
  },
  {
    src: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=80&fit=crop',
    alt: 'Portrait photography',
    label: 'Portrait',
    rotate: '-1.5deg',
    translateX: '-16px',
    translateY: '0px',
    zIndex: 2,
  },
  {
    src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=80&fit=crop',
    alt: 'Corporate photography',
    label: 'Corporate',
    rotate: '3.5deg',
    translateX: '8px',
    translateY: '12px',
    zIndex: 3,
  },
]

// ─── 3D Photo Stack ───────────────────────────────────────────────────────

function HeroPhotoStack() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 520 }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 bg-gradient-radial from-ink-100/60 to-transparent rounded-3xl blur-2xl pointer-events-none" />

      {/* Back card */}
      <div
        className="absolute w-[300px] h-[390px] rounded-2xl overflow-hidden shadow-float-xl"
        style={{
          transform: `perspective(900px) rotateY(-8deg) rotateX(4deg) rotate(${HERO_PHOTOS[0].rotate}) translate(${HERO_PHOTOS[0].translateX}, ${HERO_PHOTOS[0].translateY})`,
          zIndex: HERO_PHOTOS[0].zIndex,
        }}
      >
        <Image
          src={HERO_PHOTOS[0].src}
          alt={HERO_PHOTOS[0].alt}
          fill
          className="object-cover"
          sizes="300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-medium">
          {HERO_PHOTOS[0].label}
        </div>
      </div>

      {/* Middle card */}
      <div
        className="absolute w-[300px] h-[390px] rounded-2xl overflow-hidden shadow-float-xl"
        style={{
          transform: `perspective(900px) rotateY(-4deg) rotateX(2deg) rotate(${HERO_PHOTOS[1].rotate}) translate(${HERO_PHOTOS[1].translateX}, ${HERO_PHOTOS[1].translateY})`,
          zIndex: HERO_PHOTOS[1].zIndex,
        }}
      >
        <Image
          src={HERO_PHOTOS[1].src}
          alt={HERO_PHOTOS[1].alt}
          fill
          className="object-cover"
          sizes="300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-medium">
          {HERO_PHOTOS[1].label}
        </div>
      </div>

      {/* Front card — top of stack */}
      <div
        className="absolute w-[300px] h-[390px] rounded-2xl overflow-hidden"
        style={{
          transform: `perspective(900px) rotateY(-2deg) rotateX(1deg) rotate(${HERO_PHOTOS[2].rotate}) translate(${HERO_PHOTOS[2].translateX}, ${HERO_PHOTOS[2].translateY})`,
          zIndex: HERO_PHOTOS[2].zIndex,
          boxShadow: '0 8px 16px rgba(0,0,0,0.08), 0 24px 56px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
      >
        <Image
          src={HERO_PHOTOS[2].src}
          alt={HERO_PHOTOS[2].alt}
          fill
          className="object-cover"
          sizes="300px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-medium">
          {HERO_PHOTOS[2].label}
        </div>

        {/* Floating trust badge on front card */}
        <div
          className="absolute -bottom-5 -right-6 bg-white rounded-2xl px-4 py-3 shadow-float"
          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)' }}
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
              SC
            </div>
            <div>
              <div className="flex items-center gap-0.5 mb-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-2.5 h-2.5 text-ink fill-ink" />
                ))}
              </div>
              <p className="text-[10px] text-ink-400 leading-none">4.9 · Google + Yelp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating availability badge */}
      <div
        className="absolute top-8 -left-4 bg-white rounded-xl px-3 py-2 shadow-float"
        style={{
          zIndex: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[11px] font-semibold text-ink">50+ photographers</p>
        </div>
        <p className="text-[10px] text-ink-300 mt-0.5">Available in Edmonton</p>
      </div>
    </div>
  )
}

// ─── Featured Photographer Card ───────────────────────────────────────────

function PhotographerCard({ p, index }: { p: (typeof PHOTOGRAPHERS)[0]; index: number }) {
  return (
    <Link
      href={`/photographers/${p.slug}`}
      className="group block transition-all duration-500 hover:-translate-y-1"
      style={{
        transform: `perspective(1000px) rotateY(${index === 0 ? '3deg' : index === 2 ? '-3deg' : '0deg'}) rotateX(1.5deg)`,
      }}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden transition-shadow duration-500 group-hover:shadow-card-hover"
        style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' }}
      >
        <div className={`h-48 bg-gradient-to-br ${p.gradient} relative overflow-hidden`}>
          <div className="absolute top-3 left-3">
            <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1">
              <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-white text-[10px] font-medium">
                {p.status === 'online' ? 'Available' : 'Active'}
              </span>
            </div>
          </div>
          <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
            <Star className="w-2.5 h-2.5 text-white fill-white" />
            <span className="text-white text-[10px] font-bold">{p.rating}</span>
          </div>
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
                <p className="text-ink-300 text-[11px]">{p.location}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-ink text-sm">{p.rate}</p>
              <p className="text-ink-300 text-[10px]">/{p.rateType}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {p.specialty.map((s) => (
              <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-ink-50">
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= Math.round(p.rating) ? 'bg-ink-700' : 'bg-ink-100'}`} />
              ))}
              <span className="text-ink-300 text-[10px] ml-1">{p.reviews} reviews</span>
            </div>
            <span className="text-ink text-[10px] font-semibold flex items-center gap-0.5">
              View profile <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Trust Card ───────────────────────────────────────────────────────────

function TrustCard() {
  return (
    <div
      className="bg-white rounded-2xl p-5 max-w-xs w-full"
      style={{
        boxShadow: '0 4px 6px rgba(0,0,0,0.04), 0 16px 40px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)',
        transform: 'perspective(800px) rotateY(-6deg) rotateX(3deg)',
      }}
    >
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-ink-50">
        <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white font-bold text-xs flex-shrink-0">SC</div>
        <div className="flex-1">
          <p className="font-semibold text-ink text-sm">Sarah Chen</p>
          <p className="text-ink-300 text-[11px]">Wedding · Portrait</p>
        </div>
        <div className="text-right">
          <p className="font-bold text-ink text-lg leading-none">4.9</p>
          <p className="text-ink-300 text-[10px]">trust score</p>
        </div>
      </div>

      <p className="text-[9px] font-bold uppercase tracking-widest text-ink-300 mb-3">Reputation sources</p>

      <div className="space-y-2.5">
        {[
          { source: 'Google Reviews', score: '4.9', count: '31 reviews', bar: 98 },
          { source: 'Yelp', score: '5.0', count: '8 reviews', bar: 100 },
          { source: 'Instagram', score: '2.4k', count: 'followers', bar: 85 },
          { source: 'Facebook', score: '4.8', count: '12 recommendations', bar: 96 },
        ].map((s) => (
          <div key={s.source}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-ink-400 text-[11px]">{s.source}</span>
              <span className="text-ink font-semibold text-[11px]">{s.score} <span className="text-ink-300 font-normal">{s.count}</span></span>
            </div>
            <div className="h-1 bg-ink-50 rounded-full overflow-hidden">
              <div className="h-full bg-ink rounded-full" style={{ width: `${s.bar}%` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-3 border-t border-ink-50 flex items-center justify-between">
        <span className="text-ink-300 text-[10px]">Composite trust score</span>
        <div className="flex items-center gap-1">
          <Shield className="w-3 h-3 text-ink" />
          <span className="font-bold text-ink text-sm">4.9 / 5.0</span>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

// ─── Search suggestions data ───────────────────────────────────────────────

const SEARCH_SUGGESTIONS = [
  { type: 'photographer' as const, name: 'Sarah Chen', sub: 'Wedding · Portrait · Oliver, Edmonton', slug: 'sarah-chen', initials: 'SC' },
  { type: 'photographer' as const, name: 'Marcus Wright', sub: 'Corporate · Events · Downtown, Edmonton', slug: 'marcus-wright', initials: 'MW' },
  { type: 'photographer' as const, name: 'Priya Patel', sub: 'Newborn · Family · Glenora, Edmonton', slug: 'priya-patel', initials: 'PP' },
  { type: 'specialty' as const, name: 'Wedding photographers', sub: '12 in Edmonton', slug: '?specialty=wedding', initials: '' },
  { type: 'specialty' as const, name: 'Portrait photographers', sub: '18 in Edmonton', slug: '?specialty=portrait', initials: '' },
  { type: 'specialty' as const, name: 'Corporate photographers', sub: '14 in Edmonton', slug: '?specialty=corporate', initials: '' },
  { type: 'specialty' as const, name: 'Newborn photographers', sub: '9 in Edmonton', slug: '?specialty=newborn', initials: '' },
  { type: 'specialty' as const, name: 'Events photographers', sub: '11 in Edmonton', slug: '?specialty=events', initials: '' },
]

export default function HomePage() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  const suggestions = query.trim().length > 0
    ? SEARCH_SUGGESTIONS.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        s.sub.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <>
      <Nav />

      {/* ── Search bar — top of page ──────────────────────────────── */}
      <div className="bg-white border-b border-ink-100 py-4">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="relative" ref={searchRef}>
          <div
            className="flex flex-col sm:flex-row gap-0 bg-white rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 0 0 1.5px rgba(0,0,0,0.10), 0 4px 16px rgba(0,0,0,0.07)' }}
          >
            <label className="flex items-center gap-3 flex-1 px-5 py-3.5 min-w-0 border-b sm:border-b-0 sm:border-r border-ink-100">
              <Search className="w-4 h-4 text-ink-300 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Search photographer or specialty..."
                className="bg-transparent text-ink placeholder-ink-300 text-sm outline-none w-full"
              />
            </label>
            <select
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              className="text-ink-400 text-sm px-5 py-3.5 outline-none bg-transparent cursor-pointer flex-shrink-0 border-b sm:border-b-0 sm:border-r border-ink-100"
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
              className="bg-ink hover:bg-ink-800 text-white font-semibold text-sm px-7 py-3.5 flex items-center justify-center gap-2 transition-colors whitespace-nowrap flex-shrink-0"
            >
              Search
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Autocomplete dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl overflow-hidden z-50"
              style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12)' }}
            >
              {suggestions.map((s, i) => (
                <Link
                  key={i}
                  href={s.type === 'photographer' ? `/photographers/${s.slug}` : `/photographers${s.slug}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 transition-colors border-b border-ink-50 last:border-0"
                  onClick={() => { setShowSuggestions(false); setQuery('') }}
                >
                  {s.type === 'photographer' ? (
                    <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                      {s.initials}
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-ink-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-ink text-sm font-medium leading-tight">{s.name}</p>
                    <p className="text-ink-300 text-xs truncate">{s.sub}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
          </div>

          {/* Quick filters */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="text-ink-300 text-xs">Quick:</span>
            {['Wedding', 'Portrait', 'Corporate', 'Newborn', 'Events'].map((s) => (
              <button
                key={s}
                onClick={() => setSpecialty(s.toLowerCase())}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  specialty === s.toLowerCase()
                    ? 'bg-ink text-white border-ink'
                    : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300 hover:text-ink'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Two-column Hero ───────────────────────────────────────── */}
      <section className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 lg:gap-16 items-center min-h-[580px] py-16 lg:py-20">

            {/* Left — content */}
            <div className="max-w-xl">
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 bg-ink-50 border border-ink-100 rounded-full px-3.5 py-1.5 mb-7">
                <MapPin className="w-3 h-3 text-ink-400" />
                <span className="text-ink-500 text-xs font-medium tracking-wide">Edmonton, Alberta · YEG</span>
              </div>

              {/* Headline */}
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[64px] font-bold text-ink leading-[1.02] mb-6 text-balance">
                Your Edmonton<br />
                photographer,<br />
                <span className="relative">
                  discovered.
                  <svg
                    className="absolute -bottom-1.5 left-0 w-full overflow-visible"
                    height="8"
                    viewBox="0 0 320 8"
                    fill="none"
                    preserveAspectRatio="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2 6 C60 2, 120 6, 180 4 C240 2, 290 5, 318 3"
                      stroke="#0A0A0A"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                      opacity="0.18"
                    />
                  </svg>
                </span>
              </h1>

              {/* Body */}
              <p className="text-ink-400 text-lg leading-relaxed mb-9 max-w-md">
                Browse 50+ local photographers with real trust scores — pulled from Google,
                Yelp &amp; Instagram. No middlemen, no booking fees.
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap gap-3 mb-10">
                <Link
                  href="/photographers"
                  className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  Browse photographers
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex items-center gap-2 border border-ink-200 hover:border-ink text-ink-500 hover:text-ink font-medium px-6 py-3 rounded-xl transition-colors text-sm"
                >
                  How it works
                </Link>
              </div>

              {/* Social proof row */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {[
                    { initials: 'SC', bg: 'bg-slate-700' },
                    { initials: 'MW', bg: 'bg-zinc-700' },
                    { initials: 'PP', bg: 'bg-neutral-600' },
                    { initials: 'JL', bg: 'bg-stone-700' },
                  ].map((a) => (
                    <div key={a.initials} className={`w-8 h-8 rounded-full ${a.bg} border-2 border-white flex items-center justify-center text-white text-[9px] font-bold`}>
                      {a.initials}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1,2,3,4,5].map((i) => (
                      <Star key={i} className="w-3 h-3 text-ink-700 fill-ink-700" />
                    ))}
                  </div>
                  <p className="text-ink-400 text-xs mt-0.5">Trusted by 200+ Edmonton clients</p>
                </div>
              </div>
            </div>

            {/* Right — 3D photo stack */}
            <div className="hidden lg:block">
              <HeroPhotoStack />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <div className="border-y border-ink-100 bg-ink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {[
              { value: '50+', label: 'Edmonton photographers' },
              { value: '4', label: 'Verified trust sources' },
              { value: '6', label: 'Specialties' },
              { value: '$0', label: 'Booking fees' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <span className="font-bold text-ink text-xl">{stat.value}</span>
                <span className="text-ink-300 text-xs leading-tight max-w-[80px]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Featured Photographers ────────────────────────────────────── */}
      <section className="bg-white py-24" id="featured">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">Featured</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight">
                Top Edmonton<br />Photographers
              </h2>
            </div>
            <Link href="/photographers" className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-ink-600 transition-colors group">
              Browse all
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start" style={{ perspective: '1200px' }}>
            {PHOTOGRAPHERS.map((p, i) => (
              <PhotographerCard key={p.slug} p={p} index={i} />
            ))}
          </div>

          <div className="mt-10 text-center sm:hidden">
            <Link href="/photographers" className="text-sm font-semibold text-ink inline-flex items-center gap-2">
              Browse all photographers <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Browse by Specialty ───────────────────────────────────────── */}
      <section className="bg-ink-50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">Specialties</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-3">Browse by specialty</h2>
            <p className="text-ink-400 text-base max-w-md mx-auto">
              From weddings to newborns — find a photographer who specialises in exactly what you need.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SPECIALTIES.map((spec) => {
              const Icon = spec.icon
              return (
                <Link
                  key={spec.name}
                  href={spec.href}
                  className="group bg-white rounded-2xl p-5 flex flex-col items-center text-center transition-all duration-300 hover:-translate-y-1"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 10px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}
                >
                  <div
                    className="w-11 h-11 bg-ink-50 group-hover:bg-ink rounded-xl flex items-center justify-center mb-3 transition-all duration-300"
                    style={{ transform: 'perspective(400px) rotateX(8deg)' }}
                  >
                    <Icon className="w-5 h-5 text-ink-400 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <p className="font-semibold text-ink text-sm mb-0.5">{spec.name}</p>
                  <p className="text-ink-300 text-[11px]">{spec.count} photographers</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────── */}
      <section className="bg-white py-24" id="how-it-works">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">Process</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-4">Three steps. Done.</h2>
            <p className="text-ink-400 text-base max-w-sm mx-auto">No account required to browse. No fees, ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-ink-100" />

            {[
              { step: '01', title: 'Search & discover', desc: 'Browse by specialty, neighbourhood, or style. Read real reviews before you reach out.', icon: Search },
              { step: '02', title: 'Review their profile', desc: 'See aggregated scores from Google, Yelp & Instagram — their full reputation in one place.', icon: Shield },
              { step: '03', title: 'Message directly', desc: 'Contact any photographer directly. No commissions, no booking fees, no middlemen.', icon: Camera },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div
                    className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 relative"
                    style={{
                      boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
                      transform: 'perspective(600px) rotateX(8deg) rotateY(-4deg)',
                    }}
                  >
                    <Icon className="w-8 h-8 text-ink" />
                    <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-ink rounded-full flex items-center justify-center text-white text-[10px] font-bold">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="font-semibold text-ink text-base mb-2">{item.title}</h3>
                  <p className="text-ink-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Trust Section ────────────────────────────────────────────── */}
      <section className="bg-ink-50 py-24 overflow-hidden" id="trust">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Trust-first</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-5 leading-tight">
                Every profile backed<br />by real reviews
              </h2>
              <p className="text-ink-400 text-base leading-relaxed mb-8 max-w-lg">
                We pull each photographer's reputation from Google, Instagram, Yelp, and Facebook
                into one unified trust score. You see their real reputation — not just what they say about themselves.
              </p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {['Google Reviews', 'Yelp', 'Instagram', 'Facebook'].map((s) => (
                  <div key={s} className="bg-white rounded-xl px-4 py-3 flex items-center gap-2.5"
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.06)' }}
                  >
                    <CheckCircle2 className="w-4 h-4 text-ink flex-shrink-0" />
                    <span className="text-sm font-medium text-ink">{s}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/photographers"
                className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Browse photographers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="flex items-center justify-center lg:justify-end">
              <TrustCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Photographer CTA ─────────────────────────────────────────── */}
      <section className="bg-ink py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-100 pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div
            className="w-14 h-14 bg-white/10 border border-white/20 rounded-2xl flex items-center justify-center mx-auto mb-8"
            style={{ transform: 'perspective(400px) rotateX(10deg) rotateY(-5deg)' }}
          >
            <Camera className="w-6 h-6 text-white" />
          </div>

          <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-5 leading-tight">
            You're an Edmonton photographer.<br />
            <span className="text-ink-300">Get discovered.</span>
          </h2>

          <p className="text-ink-300 text-base leading-relaxed mb-10 max-w-xl mx-auto">
            Create a profile in under 20 minutes. Connect your existing Google, Instagram, and
            Yelp reviews. Start receiving client inquiries directly — no commissions.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center mb-10">
            {['Portfolio gallery included', 'Trust score from day one', 'Direct client messaging'].map((f) => (
              <div key={f} className="flex items-center gap-2 text-sm text-ink-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-white flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup?role=photographer"
              className="bg-white hover:bg-ink-100 text-ink font-semibold px-8 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 transition-colors text-sm"
            >
              List your work
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/photographers"
              className="border border-ink-700 hover:border-ink-600 text-ink-300 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-sm"
            >
              Browse photographers
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
