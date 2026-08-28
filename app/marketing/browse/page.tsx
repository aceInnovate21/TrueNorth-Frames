'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Check, X } from 'lucide-react'
import { PHOTOGRAPHERS, SPECIALTIES } from '../data'
import { PhotographerCard } from '../photographer-card'
import { SiteNav } from '../site-nav'
import { SiteFooter } from '../site-footer'

type Sort = 'trust' | 'rating' | 'reviews'

export default function BrowsePage() {
  const [query, setQuery] = useState('')
  const [specialty, setSpecialty] = useState<string | null>(null)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [sort, setSort] = useState<Sort>('trust')
  const [showFilters, setShowFilters] = useState(true)

  const results = useMemo(() => {
    let list = PHOTOGRAPHERS.filter((p) => {
      if (specialty && !p.specialties.includes(specialty)) return false
      if (availableOnly && !p.availableToday) return false
      if (query.trim()) {
        const q = query.toLowerCase()
        if (!p.name.toLowerCase().includes(q) && !p.specialties.some((s) => s.toLowerCase().includes(q)) && !p.location.toLowerCase().includes(q)) return false
      }
      return true
    })
    list = [...list].sort((a, b) =>
      sort === 'trust' ? b.trustScore - a.trustScore : sort === 'rating' ? b.rating - a.rating : b.reviews - a.reviews,
    )
    return list
  }, [query, specialty, availableOnly, sort])

  return (
    <>
    <SiteNav />
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Photographers in Edmonton</h1>
        <p className="text-ink-400 text-sm mt-1">{results.length} photographers · sorted by {sort === 'trust' ? 'Trust Score' : sort === 'rating' ? 'rating' : 'reviews'}</p>
      </div>

      {/* Search + controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex-1 flex items-center gap-2 bg-white ring-1 ring-ink-100 rounded-xl px-3.5 py-2.5 shadow-sm">
          <Search className="w-4 h-4 text-ink-300" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, specialty, or area…"
            className="flex-1 text-sm outline-none placeholder:text-ink-300 bg-transparent"
          />
          {query && <button onClick={() => setQuery('')}><X className="w-4 h-4 text-ink-300 hover:text-ink" /></button>}
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors ${showFilters ? 'bg-ink text-white' : 'bg-white ring-1 ring-ink-100 text-ink-600 hover:bg-ink-50'}`}
        >
          <SlidersHorizontal className="w-4 h-4" /> Filters
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="bg-white ring-1 ring-ink-100 rounded-2xl p-4 mb-6 shadow-sm space-y-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Specialty</p>
            <div className="flex flex-wrap gap-2">
              <Chip active={specialty === null} onClick={() => setSpecialty(null)}>All</Chip>
              {SPECIALTIES.map((s) => (
                <Chip key={s} active={specialty === s} onClick={() => setSpecialty(specialty === s ? null : s)}>{s}</Chip>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pt-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400 mb-2">Sort by</p>
              <div className="flex gap-2">
                <Chip active={sort === 'trust'} onClick={() => setSort('trust')}>Trust Score</Chip>
                <Chip active={sort === 'rating'} onClick={() => setSort('rating')}>Rating</Chip>
                <Chip active={sort === 'reviews'} onClick={() => setSort('reviews')}>Most reviewed</Chip>
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer select-none mt-5">
              <span className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${availableOnly ? 'bg-emerald-500' : 'bg-ink-100'}`}>
                {availableOnly && <Check className="w-3.5 h-3.5 text-white" />}
              </span>
              <input type="checkbox" checked={availableOnly} onChange={(e) => setAvailableOnly(e.target.checked)} className="sr-only" />
              <span className="text-sm text-ink-600">Available today</span>
            </label>
          </div>
        </div>
      )}

      {/* Results grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((p) => <PhotographerCard key={p.slug} p={p} />)}
        </div>
      ) : (
        <div className="text-center py-20 text-ink-400">
          <p className="font-medium text-ink">No photographers match those filters.</p>
          <p className="text-sm mt-1">Try clearing the specialty or availability filter.</p>
        </div>
      )}
    </main>
    <SiteFooter />
    </>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
        active ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
      }`}
    >
      {children}
    </button>
  )
}
