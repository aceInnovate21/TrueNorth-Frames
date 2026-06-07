'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowLeft, Star, Shield, MapPin, CheckCircle2, X,
  Camera, Clock, GitCompare, Link2,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { PhotographerBadge } from '@/components/photographer-badge'
import type { Badge } from '@/lib/badges'

interface PhotographerProfile {
  id: string
  username: string
  display_name: string
  bio: string
  location: string
  avatar_url: string | null
  cover_image_url: string | null
  rate_display: string
  trust_score: number
  native_avg_rating: number
  native_review_count: number
  specialties: string[]
  badge: Badge
  years_experience: number | null
  website_url: string | null
  links: Record<string, { platform_rating?: number; platform_review_count?: number; is_oauth_connected?: boolean }>
  member_since: string
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function avatarBg(id: string) {
  const palette = ['bg-slate-700','bg-zinc-700','bg-stone-700','bg-neutral-700','bg-gray-700','bg-slate-600']
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return palette[h % palette.length]
}

function ProfileColumn({ p, winner }: { p: PhotographerProfile; winner: Record<string, boolean> }) {
  return (
    <div className="flex-1 min-w-0">
      {/* Header card */}
      <div className="bg-white rounded-2xl overflow-hidden mb-4"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}>
        <div className="relative h-40">
          {p.cover_image_url ? (
            <Image src={p.cover_image_url} alt={p.display_name} fill className="object-cover" sizes="400px" />
          ) : (
            <div className={`w-full h-full ${avatarBg(p.id)} flex items-center justify-center`}>
              <span className="text-white text-5xl font-bold opacity-20">{initials(p.display_name)}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-4 flex items-center gap-2.5">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-white/70 flex-shrink-0">
              {p.avatar_url ? (
                <Image src={p.avatar_url} alt={p.display_name} fill className="object-cover" sizes="40px" />
              ) : (
                <div className={`w-full h-full ${avatarBg(p.id)} flex items-center justify-center text-white text-xs font-bold`}>
                  {initials(p.display_name)}
                </div>
              )}
            </div>
            <div>
              <p className="text-white font-semibold text-sm leading-tight">{p.display_name}</p>
              {p.location && (
                <p className="text-white/60 text-[11px] flex items-center gap-1">
                  <MapPin className="w-2.5 h-2.5" />{p.location}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="px-4 py-3 flex items-center justify-between">
          <PhotographerBadge badge={p.badge} size="sm" />
          <Link href={`/photographers/${p.username}`}
            className="text-xs font-semibold text-ink border border-ink-200 px-3 py-1.5 rounded-lg hover:bg-ink hover:text-white transition-colors">
            View profile
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2.5">
        {/* Rate */}
        <CompareCell highlight={winner.rate} label="">
          <p className="font-bold text-ink text-xl">{p.rate_display || '—'}</p>
        </CompareCell>

        {/* Rating */}
        <CompareCell highlight={winner.rating} label="">
          {p.native_avg_rating > 0 ? (
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="font-bold text-ink text-lg">{p.native_avg_rating.toFixed(1)}</span>
              <span className="text-ink-400 text-xs">({p.native_review_count} review{p.native_review_count !== 1 ? 's' : ''})</span>
            </div>
          ) : <span className="text-ink-300 text-sm">No reviews yet</span>}
        </CompareCell>

        {/* Trust score */}
        <CompareCell highlight={winner.trust} label="">
          {p.trust_score > 0 ? (
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-ink" />
              <span className="font-bold text-ink text-lg">{p.trust_score.toFixed(1)}</span>
              <span className="text-ink-400 text-xs">/ 5.0</span>
            </div>
          ) : <span className="text-ink-300 text-sm">—</span>}
        </CompareCell>

        {/* Experience */}
        <CompareCell highlight={winner.experience} label="">
          {p.years_experience != null ? (
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-ink-400" />
              <span className="font-semibold text-ink">{p.years_experience}+ yrs experience</span>
            </div>
          ) : <span className="text-ink-300 text-sm">—</span>}
        </CompareCell>

        {/* Specialties */}
        <CompareCell highlight={winner.specialties} label="">
          {p.specialties.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {p.specialties.map(s => (
                <span key={s} className="bg-ink-50 text-ink-600 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          ) : <span className="text-ink-300 text-sm">—</span>}
        </CompareCell>

        {/* GBP */}
        <CompareCell highlight={winner.gbp} label="">
          {p.links?.google ? (
            <div className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm font-medium">
                {p.links.google.is_oauth_connected ? 'Verified GBP connected' : 'Google Business Profile'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-ink-300">
              <X className="w-4 h-4" />
              <span className="text-sm">No GBP yet</span>
            </div>
          )}
        </CompareCell>

        {/* Website */}
        <CompareCell highlight={winner.website} label="">
          {p.website_url ? (
            <a href={p.website_url} target="_blank" rel="noopener noreferrer"
              className="text-ink text-sm font-medium underline underline-offset-2 hover:text-ink-600 break-all">
              {p.website_url.replace(/^https?:\/\//, '')}
            </a>
          ) : (
            <span className="text-ink-300 text-sm">No website</span>
          )}
        </CompareCell>

        {/* Bio */}
        <CompareCell highlight={false} label="">
          <p className="text-ink-400 text-xs leading-relaxed line-clamp-4">{p.bio || '—'}</p>
        </CompareCell>
      </div>
    </div>
  )
}

function CompareCell({ children, highlight, label }: { children: React.ReactNode; highlight: boolean; label: string }) {
  return (
    <div className={`relative bg-white rounded-xl px-4 py-3 min-h-[52px] flex items-center transition-all ${
      highlight ? 'ring-2 ring-ink' : ''
    }`}
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      {highlight && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-ink rounded-full flex items-center justify-center">
          <Star className="w-2.5 h-2.5 text-white fill-white" />
        </div>
      )}
      {children}
    </div>
  )
}

const ROW_LABELS = [
  'Starting rate',
  'Star rating',
  'Trust score',
  'Experience',
  'Specialties',
  'Google Business Profile',
  'Website',
  'Bio',
]

function CompareInner() {
  const params = useSearchParams()
  const a = params.get('a') ?? ''
  const b = params.get('b') ?? ''

  const [profiles, setProfiles] = useState<[PhotographerProfile | null, PhotographerProfile | null]>([null, null])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!a || !b) { setLoading(false); setError(true); return }
    async function load() {
      try {
        const [ra, rb] = await Promise.all([
          fetch(`/api/photographer/${a}`).then(r => { if (!r.ok) throw new Error(); return r.json() }),
          fetch(`/api/photographer/${b}`).then(r => { if (!r.ok) throw new Error(); return r.json() }),
        ])
        if (!ra.id || !rb.id) throw new Error()
        setProfiles([ra, rb])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [a, b])

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-2xl bg-ink animate-pulse mx-auto mb-3" />
          <p className="text-ink-400 text-sm">Loading comparison…</p>
        </div>
      </div>
    )
  }

  if (error || !profiles[0] || !profiles[1]) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-ink font-semibold mb-2">Couldn't load profiles</p>
          <Link href="/photographers" className="text-sm text-ink-400 underline">Back to browse</Link>
        </div>
      </div>
    )
  }

  const [p1, p2] = profiles as [PhotographerProfile, PhotographerProfile]

  // Determine winners for each row
  function parseRate(r: string) { return parseFloat(r.replace(/[^0-9.]/g, '')) || 0 }

  const winner: Record<string, boolean[]> = {
    rate:       [parseRate(p1.rate_display) <= parseRate(p2.rate_display), parseRate(p2.rate_display) <= parseRate(p1.rate_display)],
    rating:     [p1.native_avg_rating >= p2.native_avg_rating, p2.native_avg_rating >= p1.native_avg_rating],
    trust:      [p1.trust_score >= p2.trust_score, p2.trust_score >= p1.trust_score],
    experience: [(p1.years_experience ?? 0) >= (p2.years_experience ?? 0), (p2.years_experience ?? 0) >= (p1.years_experience ?? 0)],
    specialties:[p1.specialties.length >= p2.specialties.length, p2.specialties.length >= p1.specialties.length],
    gbp:        [!!p1.links?.google, !!p2.links?.google],
    website:    [!!p1.website_url, !!p2.website_url],
  }

  // Only highlight when they differ
  const w1: Record<string, boolean> = {}
  const w2: Record<string, boolean> = {}
  for (const key of Object.keys(winner)) {
    const [a, b] = winner[key]
    w1[key] = a && !b
    w2[key] = b && !a
  }

  return (
    <div className="bg-ink-50 min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Back + heading */}
        <div className="mb-8">
          <Link href="/photographers" className="inline-flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink transition-colors mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to photographers
          </Link>
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-ink" />
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">Side-by-side comparison</h1>
          </div>
          <p className="text-ink-400 text-sm mt-1">
            Stars <Star className="w-3 h-3 inline text-ink fill-ink mx-0.5" /> indicate the stronger value for each row.
          </p>
        </div>

        {/* Row labels + two columns */}
        <div className="flex gap-4 items-start">

          {/* Labels column — desktop only */}
          <div className="hidden sm:flex flex-col gap-2.5 flex-shrink-0 w-36 pt-[228px]">
            {ROW_LABELS.map(label => (
              <div key={label} className="h-[52px] flex items-center">
                <p className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Profile columns */}
          <ProfileColumn p={p1} winner={w1} />
          <ProfileColumn p={p2} winner={w2} />
        </div>

        {/* CTA row */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          <Link href={`/photographers/${p1.username}`}
            className="bg-ink text-white font-semibold text-sm py-3 rounded-xl text-center hover:bg-ink-800 transition-colors flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Book {p1.display_name.split(' ')[0]}
          </Link>
          <Link href={`/photographers/${p2.username}`}
            className="bg-ink text-white font-semibold text-sm py-3 rounded-xl text-center hover:bg-ink-800 transition-colors flex items-center justify-center gap-2">
            <Camera className="w-4 h-4" /> Book {p2.display_name.split(' ')[0]}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ComparePage() {
  return (
    <>
      <Nav />
      <Suspense fallback={
        <div className="min-h-screen bg-ink-50 flex items-center justify-center">
          <div className="w-10 h-10 rounded-2xl bg-ink animate-pulse" />
        </div>
      }>
        <CompareInner />
      </Suspense>
      <Footer />
    </>
  )
}
