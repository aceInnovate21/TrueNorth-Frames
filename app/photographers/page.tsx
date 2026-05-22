'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useMemo, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search,
  SlidersHorizontal,
  Star,
  MapPin,
  ChevronRight,
  X,
  ArrowRight,
  Baby,
  Briefcase,
  Heart,
  Home,
  Sparkles,
  User,
  LayoutGrid,
  List,
  Clock,
  Shield,
  MessageSquare,
  ChevronDown,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'

// ─── Data ─────────────────────────────────────────────────────────────────

const ALL_PHOTOGRAPHERS = [
  {
    slug: 'sarah-chen',
    name: 'Sarah Chen',
    initials: 'SC',
    specialty: ['Wedding', 'Portrait'],
    rating: 4.9,
    reviews: 47,
    rate: 200,
    rateDisplay: '$200/session',
    location: 'Oliver',
    neighbourhood: 'oliver',
    status: 'online' as const,
    availableToday: true,
    sources: ['Google', 'Yelp', 'Instagram'],
    photo: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&q=75&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fit=crop&crop=face',
    bio: 'Award-winning wedding photographer capturing Edmonton love stories since 2016.',
    responseTime: 'Replies in ~2 hrs',
  },
  {
    slug: 'marcus-wright',
    name: 'Marcus Wright',
    initials: 'MW',
    specialty: ['Corporate', 'Events'],
    rating: 4.7,
    reviews: 31,
    rate: 150,
    rateDisplay: '$150/hr',
    location: 'Downtown',
    neighbourhood: 'downtown',
    status: 'recent' as const,
    availableToday: false,
    sources: ['Google', 'Instagram'],
    photo: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&q=75&fit=crop',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fit=crop&crop=face',
    bio: "Corporate & event photography for Edmonton's leading businesses and organizations.",
    responseTime: 'Replies in ~4 hrs',
  },
  {
    slug: 'priya-patel',
    name: 'Priya Patel',
    initials: 'PP',
    specialty: ['Newborn', 'Family'],
    rating: 4.8,
    reviews: 62,
    rate: 175,
    rateDisplay: '$175/session',
    location: 'Glenora',
    neighbourhood: 'glenora',
    status: 'online' as const,
    availableToday: true,
    sources: ['Google', 'Yelp'],
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&q=75&fit=crop',
    avatar: '',
    bio: 'Gentle, timeless newborn and family portraits in a warm studio environment.',
    responseTime: 'Replies in ~1 hr',
  },
  {
    slug: 'james-liu',
    name: 'James Liu',
    initials: 'JL',
    specialty: ['Portrait', 'Events'],
    rating: 4.6,
    reviews: 28,
    rate: 130,
    rateDisplay: '$130/hr',
    location: 'Whyte Ave',
    neighbourhood: 'whyte-ave',
    status: 'online' as const,
    availableToday: true,
    sources: ['Google', 'Instagram'],
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=75&fit=crop',
    avatar: '',
    bio: 'Editorial portrait photographer with a documentary edge. Whyte Ave local.',
    responseTime: 'Replies in ~3 hrs',
  },
  {
    slug: 'amara-osei',
    name: 'Amara Osei',
    initials: 'AO',
    specialty: ['Wedding', 'Events'],
    rating: 4.9,
    reviews: 84,
    rate: 250,
    rateDisplay: '$250/session',
    location: 'Windermere',
    neighbourhood: 'windermere',
    status: 'online' as const,
    availableToday: false,
    sources: ['Google', 'Yelp', 'Instagram', 'Facebook'],
    photo: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=600&q=75&fit=crop',
    avatar: '',
    bio: 'Luxury wedding specialist serving Edmonton and surrounding areas since 2013.',
    responseTime: 'Replies in ~2 hrs',
  },
  {
    slug: 'nina-kowalski',
    name: 'Nina Kowalski',
    initials: 'NK',
    specialty: ['Real Estate', 'Corporate'],
    rating: 4.5,
    reviews: 19,
    rate: 120,
    rateDisplay: '$120/hr',
    location: 'St. Albert',
    neighbourhood: 'st-albert',
    status: 'recent' as const,
    availableToday: false,
    sources: ['Google', 'Facebook'],
    photo: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&q=75&fit=crop',
    avatar: '',
    bio: 'Real estate and architectural photography that sells properties faster.',
    responseTime: 'Replies in ~6 hrs',
  },
  {
    slug: 'david-torres',
    name: 'David Torres',
    initials: 'DT',
    specialty: ['Portrait', 'Newborn'],
    rating: 4.8,
    reviews: 41,
    rate: 160,
    rateDisplay: '$160/session',
    location: 'Riverbend',
    neighbourhood: 'riverbend',
    status: 'online' as const,
    availableToday: true,
    sources: ['Google', 'Instagram'],
    photo: 'https://images.unsplash.com/photo-1503023345310-bd7c1de61c7d?w=600&q=75&fit=crop',
    avatar: '',
    bio: 'Natural light portrait and newborn photographer with a calm, patient approach.',
    responseTime: 'Replies in ~2 hrs',
  },
  {
    slug: 'elena-vasquez',
    name: 'Elena Vasquez',
    initials: 'EV',
    specialty: ['Wedding', 'Portrait'],
    rating: 4.7,
    reviews: 53,
    rate: 220,
    rateDisplay: '$220/session',
    location: 'Downtown',
    neighbourhood: 'downtown',
    status: 'recent' as const,
    availableToday: false,
    sources: ['Google', 'Yelp', 'Instagram'],
    photo: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=600&q=75&fit=crop',
    avatar: '',
    bio: 'Fine art wedding and portrait photographer. Film-inspired digital editing.',
    responseTime: 'Replies in ~5 hrs',
  },
  {
    slug: 'kevin-park',
    name: 'Kevin Park',
    initials: 'KP',
    specialty: ['Corporate', 'Real Estate'],
    rating: 4.6,
    reviews: 22,
    rate: 140,
    rateDisplay: '$140/hr',
    location: 'Sherwood Park',
    neighbourhood: 'sherwood-park',
    status: 'online' as const,
    availableToday: true,
    sources: ['Google', 'LinkedIn'],
    photo: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&q=75&fit=crop',
    avatar: '',
    bio: 'Corporate headshots and real estate photography for the greater Edmonton area.',
    responseTime: 'Replies in ~3 hrs',
  },
]

const SPECIALTIES = [
  { value: 'wedding', label: 'Wedding', icon: Heart },
  { value: 'portrait', label: 'Portrait', icon: User },
  { value: 'corporate', label: 'Corporate', icon: Briefcase },
  { value: 'real-estate', label: 'Real Estate', icon: Home },
  { value: 'events', label: 'Events', icon: Sparkles },
  { value: 'newborn', label: 'Newborn', icon: Baby },
]

const NEIGHBOURHOODS = [
  { value: 'downtown', label: 'Downtown' },
  { value: 'oliver', label: 'Oliver' },
  { value: 'glenora', label: 'Glenora' },
  { value: 'whyte-ave', label: 'Whyte Ave' },
  { value: 'windermere', label: 'Windermere' },
  { value: 'riverbend', label: 'Riverbend' },
  { value: 'st-albert', label: 'St. Albert' },
  { value: 'sherwood-park', label: 'Sherwood Park' },
]

const SORT_OPTIONS = [
  { value: 'rating', label: 'Top rated' },
  { value: 'reviews', label: 'Most reviewed' },
  { value: 'price-asc', label: 'Price: low → high' },
  { value: 'price-desc', label: 'Price: high → low' },
  { value: 'response', label: 'Fastest response' },
]

const MIN_PRICE = 100
const MAX_PRICE = 300

// ─── Price range slider ───────────────────────────────────────────────────

function PriceSlider({
  min, max, value, onChange,
}: {
  min: number; max: number; value: [number, number]; onChange: (v: [number, number]) => void
}) {
  const pct = (v: number) => ((v - min) / (max - min)) * 100

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300">Price range</p>
        <p className="text-xs font-semibold text-ink">${value[0]} – ${value[1] === MAX_PRICE ? `${value[1]}+` : value[1]}</p>
      </div>

      <div className="relative h-5 flex items-center px-1">
        {/* Track */}
        <div className="absolute left-1 right-1 h-1 bg-ink-100 rounded-full" />
        {/* Active range */}
        <div
          className="absolute h-1 bg-ink rounded-full"
          style={{ left: `${pct(value[0])}%`, right: `${100 - pct(value[1])}%` }}
        />
        {/* Min thumb */}
        <input
          type="range" min={min} max={max} step={10}
          value={value[0]}
          onChange={(e) => {
            const v = Math.min(Number(e.target.value), value[1] - 10)
            onChange([v, value[1]])
          }}
          className="absolute w-full h-1 opacity-0 cursor-pointer"
          style={{ zIndex: value[0] > max - 20 ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range" min={min} max={max} step={10}
          value={value[1]}
          onChange={(e) => {
            const v = Math.max(Number(e.target.value), value[0] + 10)
            onChange([value[0], v])
          }}
          className="absolute w-full h-1 opacity-0 cursor-pointer"
          style={{ zIndex: 4 }}
        />
        {/* Visible thumbs */}
        <div className="absolute w-4 h-4 bg-white border-2 border-ink rounded-full shadow-sm pointer-events-none"
          style={{ left: `calc(${pct(value[0])}% - 8px)` }} />
        <div className="absolute w-4 h-4 bg-white border-2 border-ink rounded-full shadow-sm pointer-events-none"
          style={{ left: `calc(${pct(value[1])}% - 8px)` }} />
      </div>

      <div className="flex justify-between mt-1">
        <span className="text-[10px] text-ink-200">${min}</span>
        <span className="text-[10px] text-ink-200">${max}+</span>
      </div>
    </div>
  )
}

// ─── Saved set (module-level so it persists within the page session) ─────────

const savedSlugs = new Set<string>(['sarah-chen', 'marcus-wright'])

function useSaved(slug: string) {
  const [saved, setSaved] = useState(() => savedSlugs.has(slug))
  function toggle(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (savedSlugs.has(slug)) { savedSlugs.delete(slug); setSaved(false) }
    else { savedSlugs.add(slug); setSaved(true) }
  }
  return { saved, toggle }
}

// ─── Grid card ────────────────────────────────────────────────────────────

function GridCard({ p }: { p: (typeof ALL_PHOTOGRAPHERS)[0] }) {
  const { saved, toggle } = useSaved(p.slug)
  return (
    <Link
      href={`/photographers/${p.slug}`}
      className="group block bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      {/* Photo */}
      <div className="relative h-52 overflow-hidden bg-ink-100">
        <Image
          src={p.photo}
          alt={p.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Save heart */}
        <button
          onClick={toggle}
          aria-label={saved ? 'Unsave' : 'Save'}
          className="absolute top-3 right-12 z-10 w-8 h-8 bg-white/15 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
        >
          <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-white'}`} />
        </button>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5">
          <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
            <div className={`w-1.5 h-1.5 rounded-full ${p.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            <span className="text-white text-[10px] font-medium">
              {p.status === 'online' ? 'Available' : 'Active recently'}
            </span>
          </div>
          {p.availableToday && (
            <div className="bg-emerald-500 rounded-full px-2 py-1">
              <span className="text-white text-[9px] font-bold">Today</span>
            </div>
          )}
        </div>

        <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
          <Star className="w-3 h-3 text-white fill-white" />
          <span className="text-white text-[11px] font-bold">{p.rating}</span>
        </div>

        {/* Name overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-white font-semibold text-base leading-tight">{p.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <MapPin className="w-2.5 h-2.5 text-white/70" />
                <p className="text-white/70 text-[11px]">{p.location}, Edmonton</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white font-bold text-sm">{p.rateDisplay.split('/')[0]}</p>
              <p className="text-white/60 text-[10px]">/{p.rateDisplay.split('/')[1]}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {p.specialty.map((s) => (
            <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
        <p className="text-ink-400 text-xs leading-relaxed mb-3 line-clamp-2">{p.bio}</p>

        <div className="flex items-center justify-between pt-3 border-t border-ink-50">
          <div className="flex items-center gap-1.5">
            {p.sources.slice(0, 3).map((src) => (
              <span key={src} className="text-[9px] font-medium text-ink-300 bg-ink-50 px-1.5 py-0.5 rounded">{src}</span>
            ))}
            {p.sources.length > 3 && <span className="text-[9px] text-ink-200">+{p.sources.length - 3}</span>}
          </div>
          <div className="flex items-center gap-1 text-ink-400 text-[10px] font-semibold group-hover:text-ink transition-colors">
            View profile <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── List row ─────────────────────────────────────────────────────────────

function ListRow({ p }: { p: (typeof ALL_PHOTOGRAPHERS)[0] }) {
  const { saved, toggle } = useSaved(p.slug)
  return (
    <Link
      href={`/photographers/${p.slug}`}
      className="group flex items-center gap-4 bg-white rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      {/* Photo thumb */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-ink-100 flex-shrink-0">
        <Image src={p.photo} alt={p.name} fill className="object-cover" sizes="80px" />
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-ink text-sm leading-tight">{p.name}</p>
          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${p.status === 'online' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          {p.availableToday && (
            <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-100">Available today</span>
          )}
        </div>
        <div className="flex items-center gap-1 mb-2">
          <MapPin className="w-3 h-3 text-ink-300" />
          <p className="text-ink-300 text-xs">{p.location}, Edmonton</p>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {p.specialty.map((s) => (
            <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
          ))}
        </div>
        <p className="text-ink-400 text-xs leading-relaxed line-clamp-1 hidden sm:block">{p.bio}</p>
      </div>

      {/* Right: stats + CTA */}
      <div className="flex-shrink-0 flex flex-col items-end gap-2 min-w-[100px]">
        <button onClick={toggle} aria-label={saved ? 'Unsave' : 'Save'}
          className="w-8 h-8 rounded-full border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors">
          <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-red-500 text-red-500' : 'text-ink-300'}`} />
        </button>
        <div className="flex items-center gap-1">
          <Star className="w-3.5 h-3.5 text-ink fill-ink" />
          <span className="font-bold text-ink text-sm">{p.rating}</span>
          <span className="text-ink-300 text-xs">({p.reviews})</span>
        </div>
        <p className="font-bold text-ink text-sm">{p.rateDisplay}</p>
        <div className="flex items-center gap-1 text-ink-300 text-[10px]">
          <Clock className="w-3 h-3" />
          {p.responseTime}
        </div>
        <div className="flex items-center gap-0.5 mt-1 text-ink text-[10px] font-semibold group-hover:gap-1 transition-all">
          View <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default function PhotographersPage() {
  return (
    <Suspense>
      <PhotographersPageInner />
    </Suspense>
  )
}

function PhotographersPageInner() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState('')
  const [selectedSpecialty, setSelectedSpecialty] = useState('')
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState('')
  const [sortBy, setSortBy] = useState('rating')

  // Read ?specialty= from URL on first load
  useEffect(() => {
    const sp = searchParams.get('specialty')
    if (sp) setSelectedSpecialty(sp)
  }, [searchParams])
  const [showFilters, setShowFilters] = useState(false)
  const [minRating, setMinRating] = useState(0)
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_PRICE, MAX_PRICE])
  const [availableOnly, setAvailableOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const filtered = useMemo(() => {
    let list = [...ALL_PHOTOGRAPHERS]

    if (query) {
      const q = query.toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.specialty.some((s) => s.toLowerCase().includes(q)) ||
          p.location.toLowerCase().includes(q) ||
          p.bio.toLowerCase().includes(q)
      )
    }

    if (selectedSpecialty) {
      list = list.filter((p) =>
        p.specialty.some((s) => s.toLowerCase() === selectedSpecialty)
      )
    }

    if (selectedNeighbourhood) {
      list = list.filter((p) => p.neighbourhood === selectedNeighbourhood)
    }

    if (minRating > 0) {
      list = list.filter((p) => p.rating >= minRating)
    }

    list = list.filter((p) => p.rate >= priceRange[0] && p.rate <= priceRange[1])

    if (availableOnly) {
      list = list.filter((p) => p.availableToday)
    }

    switch (sortBy) {
      case 'reviews': list.sort((a, b) => b.reviews - a.reviews); break
      case 'price-asc': list.sort((a, b) => a.rate - b.rate); break
      case 'price-desc': list.sort((a, b) => b.rate - a.rate); break
      case 'response': list.sort((a, b) => a.responseTime.localeCompare(b.responseTime)); break
      default: list.sort((a, b) => b.rating - a.rating)
    }

    return list
  }, [query, selectedSpecialty, selectedNeighbourhood, sortBy, minRating, priceRange, availableOnly])

  const activeFiltersCount = [
    selectedSpecialty,
    selectedNeighbourhood,
    minRating > 0 ? 'rating' : '',
    priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE ? 'price' : '',
    availableOnly ? 'available' : '',
  ].filter(Boolean).length

  function clearAll() {
    setQuery('')
    setSelectedSpecialty('')
    setSelectedNeighbourhood('')
    setMinRating(0)
    setPriceRange([MIN_PRICE, MAX_PRICE])
    setAvailableOnly(false)
    setSortBy('rating')
  }

  return (
    <>
      <Nav />

      {/* ── Page header ──────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-1">Edmonton Photographers</h1>
              <p className="text-ink-400 text-sm">{ALL_PHOTOGRAPHERS.length} photographers · Verified trust scores · No booking fees</p>
            </div>
            {/* View toggle */}
            <div className="hidden sm:flex items-center gap-1 border border-ink-100 rounded-xl p-1 bg-white">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'}`}
                title="Grid view"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'}`}
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

            {/* Search */}
            <label className="flex items-center gap-2 flex-1 min-w-[160px] max-w-xs bg-ink-50 rounded-xl px-3.5 py-2.5">
              <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="bg-transparent text-ink text-sm placeholder-ink-300 outline-none w-full"
              />
              {query && (
                <button onClick={() => setQuery('')}>
                  <X className="w-3.5 h-3.5 text-ink-300 hover:text-ink" />
                </button>
              )}
            </label>

            {/* Specialty pills desktop */}
            <div className="hidden lg:flex items-center gap-1.5">
              {SPECIALTIES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === s.value ? '' : s.value)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                    selectedSpecialty === s.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Available today toggle */}
            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                availableOnly ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${availableOnly ? 'bg-white' : 'bg-emerald-400'}`} />
              Available today
            </button>

            {/* Filters button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                showFilters || activeFiltersCount > 0 ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white text-ink rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                  {activeFiltersCount}
                </span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-medium text-ink-500 border border-ink-100 rounded-lg px-3 py-2 outline-none bg-white cursor-pointer flex-shrink-0 ml-auto"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-ink-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Specialty — mobile only */}
              <div className="lg:hidden">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Specialty</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTIES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setSelectedSpecialty(selectedSpecialty === s.value ? '' : s.value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedSpecialty === s.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neighbourhood */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Neighbourhood</p>
                <div className="flex flex-wrap gap-1.5">
                  {NEIGHBOURHOODS.map((n) => (
                    <button
                      key={n.value}
                      onClick={() => setSelectedNeighbourhood(selectedNeighbourhood === n.value ? '' : n.value)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                        selectedNeighbourhood === n.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                      }`}
                    >
                      {n.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min rating */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Min rating</p>
                <div className="flex gap-1.5 flex-wrap">
                  {[0, 4.5, 4.7, 4.9].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        minRating === r ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                      }`}
                    >
                      {r === 0 ? 'Any' : (
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-current" /> {r}+
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price range slider */}
              <div className="sm:col-span-2 lg:col-span-1">
                <PriceSlider
                  min={MIN_PRICE}
                  max={MAX_PRICE}
                  value={priceRange}
                  onChange={setPriceRange}
                />
              </div>

              {/* Clear */}
              {activeFiltersCount > 0 && (
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button
                    onClick={clearAll}
                    className="text-xs text-ink-400 hover:text-ink transition-colors underline underline-offset-2"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ───────────────────────────────────────────────────── */}
      <div className="bg-ink-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Result bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-ink-400">
              <span className="font-semibold text-ink">{filtered.length}</span> photographer{filtered.length !== 1 ? 's' : ''}
              {selectedSpecialty && <> in <span className="font-medium text-ink capitalize">{selectedSpecialty}</span></>}
              {selectedNeighbourhood && <> · <span className="font-medium text-ink">{NEIGHBOURHOODS.find(n => n.value === selectedNeighbourhood)?.label}</span></>}
              {availableOnly && <> · <span className="font-medium text-emerald-600">Available today</span></>}
            </p>

            {/* Active filter chips */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedSpecialty && (
                <button onClick={() => setSelectedSpecialty('')} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                  <span className="capitalize">{selectedSpecialty}</span> <X className="w-2.5 h-2.5" />
                </button>
              )}
              {selectedNeighbourhood && (
                <button onClick={() => setSelectedNeighbourhood('')} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                  {NEIGHBOURHOODS.find(n => n.value === selectedNeighbourhood)?.label} <X className="w-2.5 h-2.5" />
                </button>
              )}
              {minRating > 0 && (
                <button onClick={() => setMinRating(0)} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                  {minRating}+ stars <X className="w-2.5 h-2.5" />
                </button>
              )}
              {(priceRange[0] > MIN_PRICE || priceRange[1] < MAX_PRICE) && (
                <button onClick={() => setPriceRange([MIN_PRICE, MAX_PRICE])} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                  ${priceRange[0]}–${priceRange[1]} <X className="w-2.5 h-2.5" />
                </button>
              )}
              {availableOnly && (
                <button onClick={() => setAvailableOnly(false)} className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full">
                  Available today <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Cards */}
          {filtered.length > 0 ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((p) => <GridCard key={p.slug} p={p} />)}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map((p) => <ListRow key={p.slug} p={p} />)}
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mb-4">
                <Search className="w-7 h-7 text-ink-300" />
              </div>
              <h3 className="font-semibold text-ink text-lg mb-2">No photographers found</h3>
              <p className="text-ink-400 text-sm mb-6 max-w-xs">
                Try adjusting your filters or search for a different specialty.
              </p>
              <button
                onClick={clearAll}
                className="text-sm font-semibold text-ink border border-ink-200 px-5 py-2.5 rounded-xl hover:bg-ink hover:text-white hover:border-ink transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
