'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Star, MapPin, Shield, ChevronRight, GitCompare } from 'lucide-react'
import { PhotographerBadge } from '@/components/photographer-badge'
import { makeBadge, u, type DemoPhotographer } from './data'

/** Mirrors the production /photographers GridCard. */
export function PhotographerCard({ p }: { p: DemoPhotographer }) {
  return (
    <div className="relative group">
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border-2 bg-white/80 text-ink-500 border-white/60 backdrop-blur-sm">
        <GitCompare className="w-2.5 h-2.5" /> Compare
      </div>

      <Link
        href={`/marketing/photographer/${p.slug}`}
        className="block bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-0.5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 6px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.05)' }}
      >
        <div className="relative h-52 overflow-hidden bg-ink-100">
          <Image src={u(p.coverId, 500, 320)} alt={p.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {p.availableToday && (
            <div className="absolute top-3 right-3 bg-emerald-500 rounded-full px-2.5 py-1">
              <span className="text-white text-[10px] font-bold">Available today</span>
            </div>
          )}

          <div className="absolute bottom-14 right-3 flex items-center gap-1 bg-white/15 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/20">
            <Star className="w-3 h-3 text-white fill-white" />
            <span className="text-white text-[11px] font-bold">{p.rating.toFixed(1)}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-8">
            <div className="flex items-end gap-2.5 min-w-0">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border-2 border-white/80 flex-shrink-0 shadow-md">
                <Image src={u(p.avatarId, 72, 72)} alt={p.name} fill className="object-cover" sizes="36px" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-semibold text-base leading-tight truncate">{p.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-white/70 flex-shrink-0" />
                  <p className="text-white/70 text-[11px] truncate">{p.location}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-2.5">
            <PhotographerBadge badge={makeBadge(p.badge)} size="sm" />
            <span className="text-[10px] text-ink-400"><span className="font-semibold text-ink">{p.reviews}</span> reviews</span>
          </div>
          {p.specialties.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {p.specialties.slice(0, 3).map((s) => (
                <span key={s} className="bg-ink-50 text-ink-500 text-[10px] font-medium px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between pt-2.5 border-t border-ink-50">
            <div className="flex items-center gap-1.5 text-[11px] text-ink-400">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              Trust <span className="font-bold text-emerald-600">{p.trustScore}</span>
            </div>
            <span className="text-ink text-[10px] font-semibold flex items-center gap-0.5 group-hover:gap-1 transition-all">
              View profile <ChevronRight className="w-2.5 h-2.5" />
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}
