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
  Images,
  Package,
  MessageSquare,
  Bell,
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
  name: string
  initials: string
  specialty: string[]
  rating: number
  reviews: number
  rate: string
  location: string
  slug: string
  gradient: string
  avatarUrl: string | null
  trustScore: number
}

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

function HeroPhotoStack() {
  return (
    <div className="relative flex items-center justify-center" style={{ height: 520 }}>
      <div className="absolute inset-0 bg-gradient-radial from-ink-100/60 to-transparent rounded-3xl blur-2xl pointer-events-none" />

      {HERO_PHOTOS.map((photo, i) => (
        <div
          key={photo.label}
          className="absolute w-[300px] h-[390px] rounded-2xl overflow-hidden shadow-float-xl"
          style={{
            transform: `perspective(900px) rotateY(${-8 + i * 3}deg) rotateX(${4 - i}deg) rotate(${photo.rotate}) translate(${photo.translateX}, ${photo.translateY})`,
            zIndex: photo.zIndex,
            ...(i === 2 ? { boxShadow: '0 8px 16px rgba(0,0,0,0.08), 0 24px 56px rgba(0,0,0,0.14), 0 0 0 1px rgba(0,0,0,0.06)' } : {}),
          }}
        >
          <Image src={photo.src} alt={photo.alt} fill className="object-cover" sizes="300px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 bg-white/15 backdrop-blur-md rounded-full px-3 py-1 text-white text-xs font-medium">
            {photo.label}
          </div>
        </div>
      ))}

      {/* Floating trust badge */}
      <div
        className="absolute -bottom-5 right-8 bg-white rounded-2xl px-4 py-3 shadow-float"
        style={{ zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-ink flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-ink leading-none mb-0.5">GBP Verified</p>
            <p className="text-[10px] text-ink-400 leading-none">Real reviews · Real score</p>
          </div>
        </div>
      </div>

      {/* Floating availability badge */}
      <div
        className="absolute top-8 -left-4 bg-white rounded-xl px-3 py-2 shadow-float"
        style={{ zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.06)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[11px] font-semibold text-ink">Edmonton-only</p>
        </div>
        <p className="text-[10px] text-ink-300 mt-0.5">Built for this market</p>
      </div>
    </div>
  )
}

function PhotographerCard({ p, index }: { p: FeaturedPhotographer; index: number }) {
  return (
    <Link
      href={`/photographers/${p.slug}`}
      className="group block transition-all duration-500 hover:-translate-y-1"
      style={{ transform: `perspective(1000px) rotateY(${index === 0 ? '3deg' : index === 2 ? '-3deg' : '0deg'}) rotateX(1.5deg)` }}
    >
      <div
        className="bg-white rounded-2xl overflow-hidden transition-shadow duration-500 group-hover:shadow-card-hover"
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
              {[1,2,3,4,5].map((i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= Math.round(p.rating) ? 'bg-ink-700' : 'bg-ink-100'}`} />
              ))}
              {p.reviews > 0 && <span className="text-ink-300 text-[10px] ml-1">{p.reviews} reviews</span>}
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
        <div className="flex gap-1">
          <div className="h-5 bg-ink-50 rounded-full w-16" />
          <div className="h-5 bg-ink-50 rounded-full w-14" />
        </div>
        <div className="h-px bg-ink-50" />
        <div className="h-2.5 bg-ink-50 rounded w-3/4" />
      </div>
    </div>
  )
}

const SEARCH_SUGGESTIONS = [
  { name: 'Wedding photographers',    sub: 'in Edmonton', slug: '?specialty=wedding' },
  { name: 'Portrait photographers',   sub: 'in Edmonton', slug: '?specialty=portrait' },
  { name: 'Corporate photographers',  sub: 'in Edmonton', slug: '?specialty=corporate' },
  { name: 'Newborn photographers',    sub: 'in Edmonton', slug: '?specialty=newborn' },
  { name: 'Events photographers',     sub: 'in Edmonton', slug: '?specialty=events' },
  { name: 'Real estate photographers',sub: 'in Edmonton', slug: '?specialty=real-estate' },
  { name: 'Family photographers',     sub: 'in Edmonton', slug: '?specialty=family' },
]

export default function HomePage() {
  const [query, setQuery]           = useState('')
  const [specialty, setSpecialty]   = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [featured, setFeatured]     = useState<FeaturedPhotographer[]>([])
  const [featuredLoading, setFeaturedLoading] = useState(true)

  const suggestions = query.trim().length > 0
    ? SEARCH_SUGGESTIONS.filter((s) => s.name.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : []

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false)
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
            name:       fullName,
            initials,
            specialty:  p.specialties ?? [],
            rating:     Number(p.native_avg_rating ?? p.trust_score ?? 0),
            reviews:    Number(p.native_review_count ?? 0),
            rate:       p.rate_display ?? '',
            location:   p.location ?? '',
            slug:       p.username ?? p.id,
            gradient:   CARD_GRADIENTS[i % CARD_GRADIENTS.length],
            avatarUrl:  p.avatar_url ?? null,
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

      {/* ── Search bar ───────────────────────────────────────────────── */}
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
                Search <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <div
                className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl overflow-hidden z-50"
                style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12)' }}
              >
                {suggestions.map((s, i) => (
                  <Link
                    key={i}
                    href={`/photographers${s.slug}`}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-ink-50 transition-colors border-b border-ink-50 last:border-0"
                    onClick={() => { setShowSuggestions(false); setQuery('') }}
                  >
                    <div className="w-8 h-8 rounded-lg bg-ink-50 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-ink-400" />
                    </div>
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

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-0 lg:gap-16 items-center min-h-[580px] py-16 lg:py-20">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 bg-ink-50 border border-ink-100 rounded-full px-3.5 py-1.5 mb-7">
                <MapPin className="w-3 h-3 text-ink-400" />
                <span className="text-ink-500 text-xs font-medium tracking-wide">Edmonton, Alberta · Built for this market</span>
              </div>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[64px] font-bold text-ink leading-[1.02] mb-6 text-balance">
                Your Work<br />
                Deserves<br />
                <span className="relative">
                  More.
                  <svg className="absolute -bottom-1.5 left-0 w-full overflow-visible" height="8" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                    <path d="M2 6 C40 2, 80 6, 120 4 C160 2, 185 5, 198 3" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.18" />
                  </svg>
                </span>
              </h1>

              <p className="text-ink-400 text-lg leading-relaxed mb-9 max-w-md">
                Edmonton's dedicated photographer marketplace. Portfolio-first search, Google-verified trust scores, and zero commission — ever.
              </p>

              <div className="flex flex-wrap gap-3 mb-10">
                <Link href="/photographers" className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                  Browse photographers <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/for-photographers" className="inline-flex items-center gap-2 border border-ink-200 hover:border-ink text-ink-500 hover:text-ink font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                  List your work
                </Link>
              </div>

              {/* Value props — always true, no fake numbers */}
              <div className="flex flex-wrap gap-3">
                {[
                  'Edmonton-only',
                  'GBP verified',
                  'Zero commission',
                  'Direct contact',
                ].map((v) => (
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

      {/* ── Stats strip — always-true value props, no fake numbers ─── */}
      <div className="border-y border-ink-100 bg-ink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-14">
            {[
              { value: '$0',        label: 'Booking fees — ever' },
              { value: 'GBP',       label: 'Verified trust source' },
              { value: '0%',        label: 'Commission on bookings' },
              { value: 'Edmonton',  label: 'Focused. Local. Yours.' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2.5">
                <span className="font-bold text-ink text-xl">{stat.value}</span>
                <span className="text-ink-300 text-xs leading-tight max-w-[90px]">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── The Problem — pitch deck slide 02 ───────────────────────── */}
      <section className="bg-ink py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-100 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-ink-500 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Sound familiar?</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight">
                The platform<br />problem.
              </h2>
            </div>
            <div className="space-y-5">
              {[
                { n: '01', text: 'Your best work is buried in the algorithm' },
                { n: '02', text: 'Every new client finds you from scratch' },
                { n: '03', text: 'Competitors undercut your rates with no way to show your real value' },
                { n: '04', text: 'Bookings scattered across DMs, WhatsApp, and emails' },
                { n: '05', text: 'No platform understands Edmonton\'s local photography market' },
              ].map((item) => (
                <div key={item.n} className="flex items-start gap-4 border-b border-ink-800 pb-5 last:border-0 last:pb-0">
                  <span className="text-ink-600 text-xs font-bold tracking-widest flex-shrink-0 mt-0.5">{item.n}</span>
                  <p className="text-ink-300 text-sm leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── One platform — pitch deck slide 03 ──────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">The platform</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-3">
              One platform.<br />
              <span className="text-ink-300">Everything you need.</span>
            </h2>
            <p className="text-ink-400 text-base max-w-lg">
              Think of it as LinkedIn meets Instagram — built exclusively for Edmonton photographers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                label: 'A',
                title: 'Portfolio-First Discovery',
                desc: 'Clients search by specialty, neighbourhood & rating. Your work front and centre — not a thumbnail lost in a feed.',
                icon: Images,
              },
              {
                label: 'B',
                title: 'Your Professional Home',
                desc: 'A dedicated profile URL, Trust Score, packages, FAQ, availability calendar and booking tools. All in one place.',
                icon: User,
              },
              {
                label: 'C',
                title: 'No Race to the Bottom',
                desc: 'Trust Score and verified badges surface quality — not just the cheapest price. Your rate is your rate.',
                icon: Shield,
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className="bg-ink-50 rounded-2xl p-6 relative">
                  <span className="absolute top-5 right-5 text-ink-100 text-3xl font-bold font-serif">{item.label}</span>
                  <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center mb-5">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-semibold text-ink text-base mb-2">{item.title}</p>
                  <p className="text-ink-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Featured Photographers ───────────────────────────────────── */}
      <section className="bg-ink-50 py-24" id="featured">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">Featured</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight">
                Top Edmonton<br />Photographers
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

      {/* ── Everything in one place — pitch deck slide 04 ───────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Platform features</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink">Everything<br />in one place.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink-100 border border-ink-100 rounded-2xl overflow-hidden">
            {[
              { icon: Images,       title: 'Portfolio Albums',      desc: 'Masonry grid on desktop, swipeable mobile reel. Clients filter by tag or specialty.' },
              { icon: Shield,       title: 'Trust Score',           desc: 'Google reviews, platform activity & completeness — a single credibility rating clients see before messaging.' },
              { icon: Bell,         title: 'Availability Calendar', desc: 'Set weekly time slots. Clients book only when you\'re actually open. No surprise requests.' },
              { icon: Package,      title: 'Service Packages',      desc: 'List sessions with clear pricing. Clients know exactly what they\'re getting before committing.' },
              { icon: MessageSquare,title: 'Direct Messaging',      desc: 'Clients reach you in-app. Full conversation history. File and image attachments supported.' },
              { icon: Star,         title: 'Automated Emails',      desc: 'Booking confirmations and 24-hour shoot reminders sent automatically — you don\'t chase anyone.' },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="p-6 flex gap-4 items-start">
                  <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
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

      {/* ── Browse by Specialty ──────────────────────────────────────── */}
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
                  <p className="font-semibold text-ink text-sm">{spec.name}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Fair market — pitch deck slide 06 ───────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Fair market</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink leading-tight mb-3">
                Your rate.<br />Your value.<br />
                <span className="text-ink-300">No race to the bottom.</span>
              </h2>
              <p className="text-ink-400 text-base leading-relaxed mb-8">
                On faceless gig platforms, price wins. TrueNorth Frames is built differently.
              </p>
              <Link href="/for-photographers" className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
                See how it works <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-4">
              {[
                { icon: Star,         text: 'Trust Score and verified badges surface quality — not just the cheapest price' },
                { icon: Images,       text: 'Portfolio-first search: clients choose based on your work, not your rate alone' },
                { icon: Shield,       text: 'Reviews and reputation build over time — they can\'t be faked or undercut' },
                { icon: Package,      text: 'Packages let you define exactly what\'s included, justifying your price point' },
              ].map((item, i) => {
                const Icon = item.icon
                return (
                  <div key={i} className="flex items-start gap-4 pb-4 border-b border-ink-100 last:border-0 last:pb-0">
                    <div className="w-8 h-8 bg-ink-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-ink" />
                    </div>
                    <p className="text-ink-500 text-sm leading-relaxed">{item.text}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works (3 steps) ───────────────────────────────────── */}
      <section className="bg-ink-50 py-24" id="how-it-works">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-2">Process</p>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-4">Three steps. Done.</h2>
            <p className="text-ink-400 text-base max-w-sm mx-auto">No account required to browse. No fees, ever.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <div className="hidden md:block absolute top-10 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-px bg-ink-100" />
            {[
              { step: '01', title: 'Search & discover', desc: 'Browse by specialty, neighbourhood, or style. See verified trust scores before you reach out.', icon: Search },
              { step: '02', title: 'Read their Trust Score', desc: 'Every profile shows a score built from their Google Business Profile — real reputation, not self-reported.', icon: Shield },
              { step: '03', title: 'Message directly', desc: 'Contact any photographer directly. No commission, no booking fees, no middleman.', icon: Camera },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={item.step} className="flex flex-col items-center text-center">
                  <div
                    className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mb-6 relative"
                    style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.06)', transform: 'perspective(600px) rotateX(8deg) rotateY(-4deg)' }}
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

      {/* ── Photographer CTA — pitch deck slide 10 ──────────────────── */}
      <section className="bg-ink py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-100 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-ink-500 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Join today</p>
              <h2 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-3 leading-tight">
                Join Edmonton's<br />Photographer<br />Marketplace.
              </h2>
              <p className="text-ink-400 text-base mb-2">Your portfolio. Your clients. Your money.</p>
              <p className="text-white font-semibold text-lg mb-8">Free. Always.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/signup?role=photographer" className="bg-white hover:bg-ink-100 text-ink font-semibold px-7 py-3.5 rounded-xl inline-flex items-center justify-center gap-2 transition-colors text-sm">
                  Create your free profile <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/photographers" className="border border-ink-700 hover:border-ink-600 text-ink-300 hover:text-white font-medium px-7 py-3.5 rounded-xl transition-colors text-sm text-center">
                  Browse photographers
                </Link>
              </div>
            </div>

            <div className="bg-ink-800 border border-ink-700 rounded-2xl p-6 space-y-3">
              <p className="text-ink-500 text-[10px] font-bold uppercase tracking-widest mb-4">What you get — free</p>
              {[
                'Free professional profile',
                'Portfolio albums & Trust Score',
                'Booking & messaging tools',
                'Automated email reminders',
                'Access to Edmonton clients',
                'Zero commission, always',
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-ink-200 text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
