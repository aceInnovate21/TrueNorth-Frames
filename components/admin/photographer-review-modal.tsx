'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  X, Loader2, MapPin, Globe, Instagram, Facebook, Star, Shield,
  BadgeCheck, ExternalLink, Camera, Package, CheckCircle2, XCircle, Mail, Calendar,
} from 'lucide-react'

// Full profile shape returned by GET /api/admin/photographer/[user_id]
interface ReviewProfile {
  user_id: string
  username: string
  display_name: string
  tagline: string
  bio: string
  location: string
  avatar_url: string | null
  cover_image_url: string | null
  website_url: string
  instagram_url: string
  contact_instagram_url: string | null
  contact_facebook_url: string | null
  rate_display: string
  rate_note: string
  trust_score: number
  native_avg_rating: number
  native_review_count: number
  years_experience: number | null
  completeness_score: number | null
  profile_status: string
  status_note: string | null
  created_at: string
  email: string | null
  account_status: string | null
  specialties: string[]
  links: {
    platform: string
    url: string
    username: string | null
    rating: number | null
    review_count: number | null
    is_verified: boolean
    is_oauth_connected: boolean
  }[]
  packages: { id: string; name: string; description: string; billingType: string; price: number; isActive: boolean; specialty: string | null }[]
  faqs: { id: string; question: string; answer: string }[]
  portfolio_photos: { id: string; src: string; caption: string }[]
}

function Row({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  if (value == null || value === '') return null
  return (
    <div className="flex items-start gap-2 text-sm">
      <Icon className="w-3.5 h-3.5 text-ink-300 mt-0.5 flex-shrink-0" />
      <span className="text-ink-400 w-28 flex-shrink-0">{label}</span>
      <span className="text-ink font-medium break-words">{value}</span>
    </div>
  )
}

export function PhotographerReviewModal({
  userId,
  onClose,
  onApprove,
  onReject,
  busy,
}: {
  userId: string
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  busy: boolean
}) {
  const [data, setData] = useState<ReviewProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let active = true
    setLoading(true)
    fetch(`/api/admin/photographer/${userId}`)
      .then(r => r.ok ? r.json() : Promise.reject(new Error('Failed to load profile')))
      .then(d => { if (active) { setData(d); setLoading(false) } })
      .catch(e => { if (active) { setError(e.message); setLoading(false) } })
    return () => { active = false }
  }, [userId])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const isPending = data?.profile_status === 'pending'

  const content = (
    <div className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-3xl flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100dvh - 0px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50 flex-shrink-0">
          <div>
            <p className="font-semibold text-ink">Review photographer</p>
            <p className="text-xs text-ink-400">Verify the submitted profile before approving</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink-50 hover:bg-ink-100 flex items-center justify-center">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24"><Loader2 className="w-6 h-6 animate-spin text-ink-300" /></div>
          ) : error ? (
            <div className="py-24 text-center text-sm text-red-500">{error}</div>
          ) : data ? (
            <div>
              {/* Cover + identity */}
              <div className="relative h-32 bg-ink-100">
                {data.cover_image_url && <img src={data.cover_image_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="px-5 -mt-8">
                <div className="flex items-end gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white border-2 border-white overflow-hidden shadow flex-shrink-0">
                    {data.avatar_url
                      ? <img src={data.avatar_url} alt={data.display_name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full bg-ink-100 flex items-center justify-center text-ink-400 font-bold">{data.display_name?.[0] ?? '?'}</div>}
                  </div>
                  <div className="pb-1">
                    <p className="font-semibold text-ink text-lg leading-tight">{data.display_name}</p>
                    <p className="text-xs text-ink-400">@{data.username}</p>
                  </div>
                </div>
              </div>

              <div className="px-5 py-5 space-y-6">
                {/* Vetting facts */}
                <section className="space-y-1.5">
                  <Row icon={Mail} label="Email" value={data.email} />
                  <Row icon={MapPin} label="Location" value={data.location} />
                  <Row icon={Camera} label="Experience" value={data.years_experience != null ? `${data.years_experience} yrs` : ''} />
                  <Row icon={Star} label="Rate" value={data.rate_display} />
                  <Row icon={Shield} label="Trust score" value={data.trust_score ? String(data.trust_score) : '—'} />
                  <Row icon={CheckCircle2} label="Completeness" value={data.completeness_score != null ? `${data.completeness_score}%` : ''} />
                  <Row icon={Calendar} label="Signed up" value={new Date(data.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })} />
                </section>

                {/* Links / verification */}
                {(data.website_url || data.instagram_url || data.contact_facebook_url || data.contact_instagram_url || data.links.length > 0) && (
                  <section>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-300 mb-2">Links & verification</p>
                    <div className="flex flex-wrap gap-2">
                      {data.website_url && <LinkChip icon={Globe} label="Website" href={data.website_url} />}
                      {(data.instagram_url || data.contact_instagram_url) && <LinkChip icon={Instagram} label="Instagram" href={data.instagram_url || data.contact_instagram_url!} />}
                      {data.contact_facebook_url && <LinkChip icon={Facebook} label="Facebook" href={data.contact_facebook_url} />}
                      {data.links.map(l => (
                        <span key={l.platform} className="inline-flex items-center gap-1.5 text-xs bg-ink-50 border border-ink-100 rounded-lg px-2.5 py-1.5">
                          {l.is_oauth_connected && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500" />}
                          <span className="capitalize font-medium text-ink">{l.platform}</span>
                          {l.rating != null && <span className="text-ink-400">★ {l.rating} ({l.review_count ?? 0})</span>}
                          {l.url && <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-ink-300 hover:text-ink"><ExternalLink className="w-3 h-3" /></a>}
                        </span>
                      ))}
                    </div>
                  </section>
                )}

                {/* Tagline + bio */}
                {(data.tagline || data.bio) && (
                  <section>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-300 mb-2">About</p>
                    {data.tagline && <p className="text-sm font-medium text-ink mb-1">{data.tagline}</p>}
                    {data.bio && <p className="text-sm text-ink-500 leading-relaxed whitespace-pre-wrap">{data.bio}</p>}
                  </section>
                )}

                {/* Specialties */}
                {data.specialties.length > 0 && (
                  <section>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-300 mb-2">Specialties</p>
                    <div className="flex flex-wrap gap-1.5">
                      {data.specialties.map(s => <span key={s} className="text-xs bg-ink-50 border border-ink-100 rounded-full px-2.5 py-1 text-ink capitalize">{s}</span>)}
                    </div>
                  </section>
                )}

                {/* Packages */}
                {data.packages.length > 0 && (
                  <section>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-ink-300 mb-2 flex items-center gap-1"><Package className="w-3 h-3" /> Packages ({data.packages.length})</p>
                    <div className="space-y-1.5">
                      {data.packages.map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2 border border-ink-100 rounded-xl px-3 py-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                            {p.description && <p className="text-xs text-ink-400 truncate">{p.description}</p>}
                          </div>
                          <span className="text-sm font-semibold text-ink flex-shrink-0">${p.price}/{p.billingType === 'hourly' ? 'hr' : 'session'}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                {/* Portfolio — the key legitimacy signal */}
                <section>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-300 mb-2 flex items-center gap-1">
                    <Camera className="w-3 h-3" /> Portfolio ({data.portfolio_photos.length} photos)
                  </p>
                  {data.portfolio_photos.length === 0 ? (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                      No portfolio photos uploaded — consider before approving.
                    </p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {data.portfolio_photos.slice(0, 12).map(ph => (
                        <a key={ph.id} href={ph.src} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden bg-ink-100">
                          {ph.src && <img src={ph.src} alt={ph.caption} className="w-full h-full object-cover hover:opacity-90 transition-opacity" loading="lazy" />}
                        </a>
                      ))}
                    </div>
                  )}
                </section>

                {/* FAQs count */}
                {data.faqs.length > 0 && (
                  <p className="text-xs text-ink-400">{data.faqs.length} FAQ{data.faqs.length > 1 ? 's' : ''} published</p>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-ink-50 flex-shrink-0">
          {isPending ? (
            <>
              <button
                onClick={onReject}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold border border-red-200 text-red-600 py-2.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                onClick={onApprove}
                disabled={busy}
                className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 transition-colors disabled:opacity-50"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
              </button>
            </>
          ) : (
            <button onClick={onClose} className="flex-1 text-sm font-medium border border-ink-100 text-ink-500 py-2.5 rounded-xl hover:bg-ink-50 transition-colors">
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}

function LinkChip({ icon: Icon, label, href }: { icon: any; label: string; href: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 text-xs bg-ink-50 border border-ink-100 hover:border-ink-300 rounded-lg px-2.5 py-1.5 text-ink transition-colors">
      <Icon className="w-3.5 h-3.5 text-ink-400" />
      {label}
      <ExternalLink className="w-3 h-3 text-ink-300" />
    </a>
  )
}
