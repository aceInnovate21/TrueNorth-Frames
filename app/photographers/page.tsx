'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useCallback, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Search, SlidersHorizontal, Star, MapPin, ChevronRight, X,
  Baby, Briefcase, Heart, Home, Sparkles, User, LayoutGrid, List,
  Shield, ChevronDown, ChevronLeft, Package, Clock, CheckCircle2,
  Camera,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Photographer {
  id: string
  username: string
  display_name: string
  tagline: string
  bio: string
  location: string
  avatar_url: string | null
  cover_src: string | null
  rate_display: string
  trust_score: number
  native_avg_rating: number
  native_review_count: number
  specialties: string[]
  available_today: boolean
}

interface PackageListing {
  id: string
  name: string
  description: string
  billing_type: 'hourly' | 'package'
  price: number
  deliverables: string[]
  is_popular: boolean
  banner_url: string | null
  specialty: string | null
  photographer: {
    id: string
    username: string
    display_name: string
    location: string
    avatar_url: string | null
    specialties: string[]
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  { value: 'wedding',     label: 'Wedding',     icon: Heart },
  { value: 'portrait',    label: 'Portrait',    icon: User },
  { value: 'corporate',   label: 'Corporate',   icon: Briefcase },
  { value: 'real-estate', label: 'Real Estate', icon: Home },
  { value: 'events',      label: 'Events',      icon: Sparkles },
  { value: 'newborn',     label: 'Newborn',     icon: Baby },
]

const NEIGHBOURHOODS = [
  { value: 'downtown',      label: 'Downtown' },
  { value: 'oliver',        label: 'Oliver' },
  { value: 'glenora',       label: 'Glenora' },
  { value: 'whyte-ave',     label: 'Whyte Ave' },
  { value: 'windermere',    label: 'Windermere' },
  { value: 'riverbend',     label: 'Riverbend' },
  { value: 'st-albert',     label: 'St. Albert' },
  { value: 'sherwood-park', label: 'Sherwood Park' },
]

const PHOTOGRAPHER_SORT = [
  { value: 'rating',   label: 'Top rated' },
  { value: 'reviews',  label: 'Most reviewed' },
  { value: 'response', label: 'Newest members' },
]

const PACKAGE_SORT = [
  { value: 'popular',    label: 'Most popular' },
  { value: 'price_asc',  label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function avatarBg(id: string) {
  const palette = [
    'bg-slate-700', 'bg-zinc-700', 'bg-stone-700', 'bg-neutral-700',
    'bg-gray-700',  'bg-slate-600', 'bg-zinc-600', 'bg-stone-600',
  ]
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

// ─── Photographer Grid Card ───────────────────────────────────────────────────

function GridCard({ p }: { p: Photographer }) {
  const hasRating = p.native_avg_rating > 0
  return (
    <Link
      href={`/photographers/${p.username}`}
      className="group block bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      <div className="relative h-52 overflow-hidden bg-ink-100">
        {p.cover_src ? (
          <Image src={p.cover_src} alt={p.display_name} fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
        ) : (
          <div className={`w-full h-full flex items-center justify-center ${avatarBg(p.id)}`}>
            <span className="text-white text-4xl font-bold opacity-30">{initials(p.display_name)}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {p.available_today && (
          <div className="absolute top-3 left-3">
            <div className="bg-emerald-500 rounded-full px-2.5 py-1">
              <span className="text-white text-[10px] font-bold">Available today</span>
            </div>
          </div>
        )}

        {hasRating ? (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-white text-[11px] font-bold">{p.native_avg_rating.toFixed(1)}</span>
          </div>
        ) : p.trust_score > 0 ? (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
            <Shield className="w-3 h-3 text-white" />
            <span className="text-white text-[11px] font-bold">{p.trust_score.toFixed(1)}</span>
          </div>
        ) : null}

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
          <div className="flex items-end justify-between gap-2">
            <div className="flex items-end gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border-2 border-white/80 flex-shrink-0 shadow-md">
                {p.avatar_url ? (
                  <Image src={p.avatar_url} alt={p.display_name} fill className="object-cover" sizes="36px" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${avatarBg(p.id)} text-white text-[11px] font-bold`}>
                    {initials(p.display_name)}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-base leading-tight truncate">{p.display_name}</p>
                {p.location && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin className="w-2.5 h-2.5 text-white/70 flex-shrink-0" />
                    <p className="text-white/70 text-[11px] truncate">{p.location}</p>
                  </div>
                )}
              </div>
            </div>
            {p.rate_display && (
              <div className="text-right flex-shrink-0">
                <p className="text-white font-bold text-sm">{p.rate_display.split('/')[0]}</p>
                {p.rate_display.includes('/') && (
                  <p className="text-white/60 text-[10px]">/{p.rate_display.split('/')[1]}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4">
        {p.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {p.specialties.map(s => (
              <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
        {p.bio && <p className="text-ink-400 text-xs leading-relaxed mb-3 line-clamp-2">{p.bio}</p>}
        <div className="flex items-center justify-between pt-3 border-t border-ink-50">
          <div className="flex items-center gap-1.5">
            {hasRating && (
              <span className="text-[10px] text-ink-400">
                <span className="font-semibold text-ink">{p.native_review_count}</span> review{p.native_review_count !== 1 ? 's' : ''}
              </span>
            )}
            {p.trust_score > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-ink-300 bg-ink-50 px-1.5 py-0.5 rounded">
                <Shield className="w-2.5 h-2.5" /> {p.trust_score.toFixed(1)}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 text-ink-400 text-[10px] font-semibold group-hover:text-ink transition-colors">
            View profile <ChevronRight className="w-3 h-3" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ─── Photographer List Row ────────────────────────────────────────────────────

function ListRow({ p }: { p: Photographer }) {
  const hasRating = p.native_avg_rating > 0
  return (
    <Link
      href={`/photographers/${p.username}`}
      className="group flex items-center gap-4 bg-white rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}
    >
      <div className="relative flex-shrink-0">
        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-ink-100">
          {p.cover_src
            ? <Image src={p.cover_src} alt={p.display_name} fill className="object-cover" sizes="80px" />
            : <div className={`w-full h-full flex items-center justify-center ${avatarBg(p.id)} text-white font-bold text-lg`}>{initials(p.display_name)}</div>
          }
        </div>
        <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-lg overflow-hidden border-2 border-white shadow-sm">
          {p.avatar_url
            ? <Image src={p.avatar_url} alt={p.display_name} fill className="object-cover" sizes="32px" />
            : <div className={`w-full h-full flex items-center justify-center ${avatarBg(p.id)} text-white text-[10px] font-bold`}>{initials(p.display_name)}</div>
          }
        </div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="font-semibold text-ink text-sm leading-tight">{p.display_name}</p>
          {p.available_today && (
            <span className="bg-emerald-50 text-emerald-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-100">Available today</span>
          )}
        </div>
        {p.location && (
          <div className="flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3 text-ink-300" />
            <p className="text-ink-300 text-xs">{p.location}</p>
          </div>
        )}
        {p.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {p.specialties.map(s => (
              <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}
        {p.bio && <p className="text-ink-400 text-xs leading-relaxed line-clamp-1 hidden sm:block">{p.bio}</p>}
      </div>

      <div className="flex-shrink-0 flex flex-col items-end gap-2 min-w-[90px]">
        {hasRating ? (
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-ink fill-ink" />
            <span className="font-bold text-ink text-sm">{p.native_avg_rating.toFixed(1)}</span>
            <span className="text-ink-300 text-xs">({p.native_review_count})</span>
          </div>
        ) : p.trust_score > 0 ? (
          <div className="flex items-center gap-1 text-ink-400 text-xs">
            <Shield className="w-3.5 h-3.5" />
            <span className="font-bold text-ink">{p.trust_score.toFixed(1)}</span>
          </div>
        ) : null}
        {p.rate_display && <p className="font-bold text-ink text-sm">{p.rate_display}</p>}
        <div className="flex items-center gap-0.5 mt-1 text-ink text-[10px] font-semibold group-hover:gap-1 transition-all">
          View <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </Link>
  )
}

// ─── Package Card ─────────────────────────────────────────────────────────────

function PackageCard({ pkg }: { pkg: PackageListing }) {
  const ph = pkg.photographer
  return (
    <div
      className={`relative bg-white rounded-2xl border flex flex-col transition-all duration-200 hover:-translate-y-0.5 overflow-hidden ${
        pkg.is_popular ? 'border-ink ring-1 ring-ink' : 'border-ink-100'
      }`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}
    >
      {/* Popular strip — sits above banner when banner present, else absolute */}
      {pkg.is_popular && !pkg.banner_url && (
        <div className="bg-ink py-1 flex items-center justify-center gap-1.5">
          <Star className="w-2.5 h-2.5 text-white fill-white" />
          <span className="text-white text-[10px] font-bold tracking-wide uppercase">Most Popular</span>
        </div>
      )}

      {/* Banner image */}
      {pkg.banner_url ? (
        <div className="relative w-full h-36 overflow-hidden flex-shrink-0">
          <Image src={pkg.banner_url} alt={pkg.name} fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
          {pkg.is_popular && (
            <div className="absolute top-2.5 left-3 flex items-center gap-1 bg-ink/90 backdrop-blur-sm px-2.5 py-1 rounded-full">
              <Star className="w-2.5 h-2.5 text-white fill-white" />
              <span className="text-white text-[10px] font-bold tracking-wide uppercase">Most Popular</span>
            </div>
          )}
        </div>
      ) : null}

      <div className="p-5 flex flex-col flex-1">
        {/* Package name + price */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="font-bold text-ink text-base leading-tight">{pkg.name}</p>
            {pkg.description && (
              <p className="text-ink-400 text-xs mt-1 leading-relaxed line-clamp-2">{pkg.description}</p>
            )}
          </div>
          <div className="text-right flex-shrink-0">
            <p className="font-bold text-2xl text-ink leading-none">${pkg.price}</p>
            <div className="flex items-center justify-end gap-1 mt-0.5">
              {pkg.billing_type === 'hourly'
                ? <><Clock className="w-2.5 h-2.5 text-ink-300" /><span className="text-[10px] text-ink-300">/ hr</span></>
                : <><Package className="w-2.5 h-2.5 text-ink-300" /><span className="text-[10px] text-ink-300">/ session</span></>
              }
            </div>
          </div>
        </div>

        {/* Billing type + specialty pills */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
            pkg.billing_type === 'hourly'
              ? 'bg-violet-50 text-violet-600 border border-violet-100'
              : 'bg-sky-50 text-sky-600 border border-sky-100'
          }`}>
            {pkg.billing_type === 'hourly' ? <Clock className="w-2.5 h-2.5" /> : <Package className="w-2.5 h-2.5" />}
            {pkg.billing_type === 'hourly' ? 'Hourly' : 'Package'}
          </span>
          {pkg.specialty && (
            <span className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-full bg-ink-50 text-ink-500 border border-ink-100">
              {pkg.specialty.charAt(0).toUpperCase() + pkg.specialty.slice(1).replace('-', ' ')}
            </span>
          )}
        </div>

        {/* Deliverables */}
        {pkg.deliverables.length > 0 && (
          <ul className="space-y-1.5 mb-4 flex-1">
            {pkg.deliverables.slice(0, 4).map((d, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-ink-500">
                <CheckCircle2 className="w-3.5 h-3.5 text-ink mt-0.5 flex-shrink-0" />
                {d}
              </li>
            ))}
            {pkg.deliverables.length > 4 && (
              <li className="text-[10px] text-ink-300 pl-5">+{pkg.deliverables.length - 4} more included</li>
            )}
          </ul>
        )}

        {/* Spacer pushes footer down */}
        <div className="flex-1" />

        {/* Photographer attribution */}
        <div className="pt-3 mt-3 border-t border-ink-50">
          <Link
            href={`/photographers/${ph.username}`}
            className="flex items-center gap-2.5 group/ph"
          >
            <div className="relative w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 border border-ink-100">
              {ph.avatar_url
                ? <Image src={ph.avatar_url} alt={ph.display_name} fill className="object-cover" sizes="32px" />
                : <div className={`w-full h-full flex items-center justify-center ${avatarBg(ph.id)} text-white text-[10px] font-bold`}>{initials(ph.display_name)}</div>
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ink group-hover/ph:underline truncate">{ph.display_name}</p>
              {ph.location && (
                <div className="flex items-center gap-0.5">
                  <MapPin className="w-2.5 h-2.5 text-ink-300 flex-shrink-0" />
                  <p className="text-[10px] text-ink-300 truncate">{ph.location}</p>
                </div>
              )}
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-ink-200 group-hover/ph:text-ink transition-colors flex-shrink-0" />
          </Link>
        </div>
      </div>
    </div>
  )
}

// ─── Skeletons ────────────────────────────────────────────────────────────────

function GridSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden animate-pulse"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <div className="h-52 bg-ink-100" />
      <div className="p-4 space-y-3">
        <div className="flex gap-1.5"><div className="h-5 w-16 bg-ink-100 rounded-full" /><div className="h-5 w-14 bg-ink-100 rounded-full" /></div>
        <div className="space-y-1.5"><div className="h-3 bg-ink-100 rounded w-full" /><div className="h-3 bg-ink-100 rounded w-3/4" /></div>
      </div>
    </div>
  )
}

function PackageSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden animate-pulse"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      <div className="h-36 bg-ink-100" />
      <div className="p-5 space-y-3">
        <div className="flex justify-between">
          <div className="space-y-1.5 flex-1"><div className="h-4 bg-ink-100 rounded w-2/3" /><div className="h-3 bg-ink-100 rounded w-full" /></div>
          <div className="ml-4"><div className="h-7 w-16 bg-ink-100 rounded" /></div>
        </div>
        <div className="h-5 w-16 bg-ink-100 rounded-full" />
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-3 bg-ink-100 rounded w-full" />)}</div>
        <div className="pt-3 border-t border-ink-50 flex items-center gap-2">
          <div className="w-8 h-8 bg-ink-100 rounded-lg" />
          <div className="space-y-1"><div className="h-3 w-24 bg-ink-100 rounded" /><div className="h-2 w-16 bg-ink-100 rounded" /></div>
        </div>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="flex items-center gap-4 bg-white rounded-2xl p-4 animate-pulse"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <div className="w-20 h-20 rounded-xl bg-ink-100 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-ink-100 rounded w-1/3" />
        <div className="h-3 bg-ink-100 rounded w-1/4" />
        <div className="flex gap-1.5"><div className="h-5 w-16 bg-ink-100 rounded-full" /><div className="h-5 w-14 bg-ink-100 rounded-full" /></div>
      </div>
    </div>
  )
}

// ─── Pagination ───────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (n: number) => void }) {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(n => n === 1 || n === totalPages || Math.abs(n - page) <= 1)
    .reduce<(number | '…')[]>((acc, n, idx, arr) => {
      if (idx > 0 && (n as number) - (arr[idx - 1] as number) > 1) acc.push('…')
      acc.push(n)
      return acc
    }, [])

  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1}
        className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-ink-100 bg-white text-ink-400 hover:text-ink hover:border-ink-300 disabled:opacity-40 disabled:pointer-events-none transition-colors">
        <ChevronLeft className="w-3.5 h-3.5" /> Prev
      </button>
      <div className="flex items-center gap-1">
        {pages.map((n, i) => n === '…'
          ? <span key={`e${i}`} className="px-2 py-1 text-xs text-ink-300">…</span>
          : <button key={n} onClick={() => onPage(n as number)}
              className={`w-8 h-8 text-xs font-semibold rounded-lg border transition-colors ${page === n ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'}`}>
              {n}
            </button>
        )}
      </div>
      <button onClick={() => onPage(page + 1)} disabled={page >= totalPages}
        className="flex items-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border border-ink-100 bg-white text-ink-400 hover:text-ink hover:border-ink-300 disabled:opacity-40 disabled:pointer-events-none transition-colors">
        Next <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhotographersPage() {
  return <Suspense><PhotographersPageInner /></Suspense>
}

function PhotographersPageInner() {
  const searchParams = useSearchParams()

  // ── Mode ──────────────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'photographers' | 'packages'>('photographers')

  // ── Shared filters ────────────────────────────────────────────────────────
  const [query, setQuery]                           = useState('')
  const [selectedSpecialty, setSelectedSpecialty]   = useState('')
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState('')
  const [showFilters, setShowFilters]               = useState(false)
  const [minRating, setMinRating]                   = useState(0)
  const [availableOnly, setAvailableOnly]           = useState(false)
  const [viewMode, setViewMode]                     = useState<'grid' | 'list'>('grid')
  const [page, setPage]                             = useState(1)

  // ── Photographer-only sort ────────────────────────────────────────────────
  const [photoSort, setPhotoSort] = useState('rating')

  // ── Package-specific filters ──────────────────────────────────────────────
  const [billingType, setBillingType]   = useState('')
  const [minPrice, setMinPrice]         = useState(0)
  const [maxPrice, setMaxPrice]         = useState(0)
  const [packageSort, setPackageSort]   = useState('popular')

  // ── Data ──────────────────────────────────────────────────────────────────
  const [photographers, setPhotographers] = useState<Photographer[]>([])
  const [packages, setPackages]           = useState<PackageListing[]>([])
  const [total, setTotal]                 = useState(0)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Pre-fill specialty from URL
  useEffect(() => {
    const sp = searchParams.get('specialty')
    if (sp) setSelectedSpecialty(sp)
  }, [searchParams])

  const fetchPhotographers = useCallback(async (opts: {
    q: string; specialty: string; neighbourhood: string
    minRating: number; availableOnly: boolean; sort: string; page: number
  }) => {
    setLoading(true); setError(false)
    try {
      const p = new URLSearchParams()
      if (opts.q)             p.set('q', opts.q)
      if (opts.specialty)     p.set('specialty', opts.specialty)
      if (opts.neighbourhood) p.set('neighbourhood', opts.neighbourhood)
      if (opts.minRating > 0) p.set('min_rating', String(opts.minRating))
      if (opts.availableOnly) p.set('available_today', '1')
      p.set('sort', opts.sort)
      p.set('page', String(opts.page))
      const res = await fetch(`/api/photographers?${p}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPhotographers(data.photographers)
      setTotal(data.total)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [])

  const fetchPackages = useCallback(async (opts: {
    q: string; specialty: string; neighbourhood: string
    billingType: string; minPrice: number; maxPrice: number; sort: string; page: number
  }) => {
    setLoading(true); setError(false)
    try {
      const p = new URLSearchParams()
      if (opts.q)             p.set('q', opts.q)
      if (opts.specialty)     p.set('specialty', opts.specialty)
      if (opts.neighbourhood) p.set('neighbourhood', opts.neighbourhood)
      if (opts.billingType)   p.set('billing_type', opts.billingType)
      if (opts.minPrice > 0)  p.set('min_price', String(opts.minPrice))
      if (opts.maxPrice > 0)  p.set('max_price', String(opts.maxPrice))
      p.set('sort', opts.sort)
      p.set('page', String(opts.page))
      const res = await fetch(`/api/packages?${p}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setPackages(data.packages)
      setTotal(data.total)
    } catch { setError(true) }
    finally { setLoading(false) }
  }, [])

  // Debounced refetch on filter change (reset to page 1)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      if (mode === 'photographers') {
        fetchPhotographers({ q: query, specialty: selectedSpecialty, neighbourhood: selectedNeighbourhood, minRating, availableOnly, sort: photoSort, page: 1 })
      } else {
        fetchPackages({ q: query, specialty: selectedSpecialty, neighbourhood: selectedNeighbourhood, billingType, minPrice, maxPrice, sort: packageSort, page: 1 })
      }
    }, 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query, selectedSpecialty, selectedNeighbourhood, minRating, availableOnly, photoSort, billingType, minPrice, maxPrice, packageSort, mode])

  // Page change (no debounce)
  useEffect(() => {
    if (mode === 'photographers') {
      fetchPhotographers({ q: query, specialty: selectedSpecialty, neighbourhood: selectedNeighbourhood, minRating, availableOnly, sort: photoSort, page })
    } else {
      fetchPackages({ q: query, specialty: selectedSpecialty, neighbourhood: selectedNeighbourhood, billingType, minPrice, maxPrice, sort: packageSort, page })
    }
  }, [page])

  function switchMode(m: 'photographers' | 'packages') {
    setMode(m)
    setPage(1)
    setQuery('')
    setSelectedSpecialty('')
    setSelectedNeighbourhood('')
    setMinRating(0)
    setAvailableOnly(false)
    setBillingType('')
    setMinPrice(0)
    setMaxPrice(0)
    setShowFilters(false)
  }

  function goPage(n: number) {
    setPage(n)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function clearAll() {
    setQuery(''); setSelectedSpecialty(''); setSelectedNeighbourhood('')
    setMinRating(0); setAvailableOnly(false)
    setBillingType(''); setMinPrice(0); setMaxPrice(0)
    setPage(1)
  }

  const totalPages = Math.ceil(total / 12)

  const activeFiltersCount = [
    selectedSpecialty,
    selectedNeighbourhood,
    minRating > 0 ? 'r' : '',
    availableOnly ? 'a' : '',
    billingType,
    minPrice > 0 || maxPrice > 0 ? 'p' : '',
  ].filter(Boolean).length

  const sortOptions = mode === 'photographers' ? PHOTOGRAPHER_SORT : PACKAGE_SORT
  const sortValue   = mode === 'photographers' ? photoSort : packageSort
  function setSort(v: string) { mode === 'photographers' ? setPhotoSort(v) : setPackageSort(v) }

  return (
    <>
      <Nav />

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-7">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-1">
                Edmonton Photographers
              </h1>
              <p className="text-ink-400 text-sm">
                {loading ? 'Loading…' : `${total} ${mode === 'photographers' ? `photographer${total !== 1 ? 's' : ''}` : `package${total !== 1 ? 's' : ''}`}`}
                {' · '}Verified trust scores · No booking fees
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode toggle */}
              <div className="flex items-center bg-ink-50 rounded-xl p-1 border border-ink-100">
                <button
                  onClick={() => switchMode('photographers')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'photographers' ? 'bg-white text-ink shadow-sm border border-ink-100' : 'text-ink-400 hover:text-ink'
                  }`}
                >
                  <Camera className="w-3.5 h-3.5" /> Photographers
                </button>
                <button
                  onClick={() => switchMode('packages')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    mode === 'packages' ? 'bg-white text-ink shadow-sm border border-ink-100' : 'text-ink-400 hover:text-ink'
                  }`}
                >
                  <Package className="w-3.5 h-3.5" /> Packages
                </button>
              </div>

              {/* Grid/list toggle — photographers only */}
              {mode === 'photographers' && (
                <div className="hidden sm:flex items-center gap-1 border border-ink-100 rounded-xl p-1 bg-white">
                  <button onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'}`}>
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'}`}>
                    <List className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filter bar ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">

            {/* Search */}
            <label className="flex items-center gap-2 flex-1 min-w-[160px] max-w-xs bg-ink-50 rounded-xl px-3.5 py-2.5">
              <Search className="w-3.5 h-3.5 text-ink-300 flex-shrink-0" />
              <input
                type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder={mode === 'photographers' ? 'Search by name, specialty…' : 'Search packages…'}
                className="bg-transparent text-ink text-sm placeholder-ink-300 outline-none w-full"
              />
              {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5 text-ink-300 hover:text-ink" /></button>}
            </label>

            {/* Specialty pills — desktop */}
            <div className="hidden lg:flex items-center gap-1.5">
              {SPECIALTIES.map(s => (
                <button key={s.value}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === s.value ? '' : s.value)}
                  className={`flex-shrink-0 text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                    selectedSpecialty === s.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                  }`}>{s.label}
                </button>
              ))}
            </div>

            {/* Available today — photographers only */}
            {mode === 'photographers' && (
              <button onClick={() => setAvailableOnly(!availableOnly)}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                  availableOnly ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${availableOnly ? 'bg-white' : 'bg-emerald-400'}`} />
                Available today
              </button>
            )}

            {/* Billing type — packages only */}
            {mode === 'packages' && (
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {[{ v: '', l: 'All' }, { v: 'hourly', l: 'Hourly' }, { v: 'package', l: 'Session' }].map(bt => (
                  <button key={bt.v} onClick={() => setBillingType(billingType === bt.v ? '' : bt.v)}
                    className={`text-xs font-medium px-3 py-2 rounded-lg border transition-colors ${
                      billingType === bt.v ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                    }`}>{bt.l}
                  </button>
                ))}
              </div>
            )}

            {/* Filters */}
            <button onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors flex-shrink-0 ${
                showFilters || activeFiltersCount > 0 ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
              }`}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="bg-white text-ink rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">{activeFiltersCount}</span>
              )}
              <ChevronDown className={`w-3 h-3 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>

            {/* Sort */}
            <select value={sortValue} onChange={e => setSort(e.target.value)}
              className="text-xs font-medium text-ink-500 border border-ink-100 rounded-lg px-3 py-2 outline-none bg-white cursor-pointer flex-shrink-0 ml-auto">
              {sortOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Expanded filter panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-ink-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

              {/* Specialty — mobile */}
              <div className="lg:hidden">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Specialty</p>
                <div className="flex flex-wrap gap-1.5">
                  {SPECIALTIES.map(s => (
                    <button key={s.value} onClick={() => setSelectedSpecialty(selectedSpecialty === s.value ? '' : s.value)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        selectedSpecialty === s.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100'
                      }`}>{s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neighbourhood */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Neighbourhood</p>
                <div className="flex flex-wrap gap-1.5">
                  {NEIGHBOURHOODS.map(n => (
                    <button key={n.value} onClick={() => setSelectedNeighbourhood(selectedNeighbourhood === n.value ? '' : n.value)}
                      className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                        selectedNeighbourhood === n.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                      }`}>{n.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min rating — photographers only */}
              {mode === 'photographers' && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Min rating</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {[0, 4.5, 4.7, 4.9].map(r => (
                      <button key={r} onClick={() => setMinRating(r)}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                          minRating === r ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                        }`}>
                        {r === 0 ? 'Any' : <span className="flex items-center gap-0.5"><Star className="w-3 h-3 fill-current" /> {r}+</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Price range — packages only */}
              {mode === 'packages' && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-2">Price range</p>
                  <div className="flex items-center gap-2">
                    <input type="number" placeholder="Min $" value={minPrice || ''} onChange={e => setMinPrice(Number(e.target.value))}
                      className="w-24 text-xs border border-ink-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-ink" />
                    <span className="text-ink-300 text-xs">–</span>
                    <input type="number" placeholder="Max $" value={maxPrice || ''} onChange={e => setMaxPrice(Number(e.target.value))}
                      className="w-24 text-xs border border-ink-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-ink" />
                  </div>
                </div>
              )}

              {activeFiltersCount > 0 && (
                <div className="sm:col-span-2 lg:col-span-4 flex justify-end">
                  <button onClick={clearAll} className="text-xs text-ink-400 hover:text-ink transition-colors underline underline-offset-2">
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Results ──────────────────────────────────────────────────────── */}
      <div className="bg-ink-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Result bar */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <p className="text-sm text-ink-400">
              {loading
                ? <span className="inline-block w-32 h-4 bg-ink-100 rounded animate-pulse" />
                : <><span className="font-semibold text-ink">{total}</span> {mode === 'photographers' ? `photographer${total !== 1 ? 's' : ''}` : `package${total !== 1 ? 's' : ''}`}
                    {selectedSpecialty && <> in <span className="font-medium text-ink capitalize">{selectedSpecialty}</span></>}
                    {selectedNeighbourhood && <> · <span className="font-medium text-ink">{NEIGHBOURHOODS.find(n => n.value === selectedNeighbourhood)?.label}</span></>}
                    {availableOnly && <> · <span className="font-medium text-emerald-600">Available today</span></>}
                    {totalPages > 1 && <> · Page {page} of {totalPages}</>}
                  </>
              }
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
              {availableOnly && (
                <button onClick={() => setAvailableOnly(false)} className="flex items-center gap-1 text-xs bg-emerald-500 text-white px-2.5 py-1 rounded-full">
                  Available today <X className="w-2.5 h-2.5" />
                </button>
              )}
              {billingType && (
                <button onClick={() => setBillingType('')} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full capitalize">
                  {billingType === 'package' ? 'Session' : 'Hourly'} <X className="w-2.5 h-2.5" />
                </button>
              )}
              {(minPrice > 0 || maxPrice > 0) && (
                <button onClick={() => { setMinPrice(0); setMaxPrice(0) }} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                  {minPrice > 0 ? `$${minPrice}` : '$0'}–{maxPrice > 0 ? `$${maxPrice}` : '∞'} <X className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-4">
                <X className="w-7 h-7 text-red-400" />
              </div>
              <h3 className="font-semibold text-ink text-lg mb-2">Something went wrong</h3>
              <p className="text-ink-400 text-sm mb-6">Could not load results. Please try again.</p>
              <button onClick={clearAll}
                className="text-sm font-semibold text-ink border border-ink-200 px-5 py-2.5 rounded-xl hover:bg-ink hover:text-white transition-colors">
                Try again
              </button>
            </div>
          )}

          {/* ── Photographers ── */}
          {!error && mode === 'photographers' && (
            loading ? (
              viewMode === 'grid'
                ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({length:6}).map((_,i)=><GridSkeleton key={i}/>)}</div>
                : <div className="flex flex-col gap-3">{Array.from({length:6}).map((_,i)=><ListSkeleton key={i}/>)}</div>
            ) : photographers.length > 0 ? (
              <>
                {viewMode === 'grid'
                  ? <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{photographers.map(p=><GridCard key={p.id} p={p}/>)}</div>
                  : <div className="flex flex-col gap-3">{photographers.map(p=><ListRow key={p.id} p={p}/>)}</div>
                }
                <Pagination page={page} totalPages={totalPages} onPage={goPage} />
              </>
            ) : (
              <EmptyState onClear={clearAll} label="photographers" />
            )
          )}

          {/* ── Packages ── */}
          {!error && mode === 'packages' && (
            loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({length:6}).map((_,i)=><PackageSkeleton key={i}/>)}
              </div>
            ) : packages.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {packages.map(pkg => <PackageCard key={pkg.id} pkg={pkg} />)}
                </div>
                <Pagination page={page} totalPages={totalPages} onPage={goPage} />
              </>
            ) : (
              <EmptyState onClear={clearAll} label="packages" />
            )
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}

function EmptyState({ onClear, label }: { onClear: () => void; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-ink-100 rounded-2xl flex items-center justify-center mb-4">
        <Search className="w-7 h-7 text-ink-300" />
      </div>
      <h3 className="font-semibold text-ink text-lg mb-2">No {label} found</h3>
      <p className="text-ink-400 text-sm mb-6 max-w-xs">Try adjusting your filters or search for something different.</p>
      <button onClick={onClear}
        className="text-sm font-semibold text-ink border border-ink-200 px-5 py-2.5 rounded-xl hover:bg-ink hover:text-white transition-colors">
        Clear all filters
      </button>
    </div>
  )
}
