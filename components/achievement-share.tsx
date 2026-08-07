'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import {
  Eye, CalendarCheck, MessageSquare, Star, Zap,
  X, Download, Copy, Check, Loader2, Smartphone, Instagram,
} from 'lucide-react'
import { SITE_URL, absoluteUrl } from '@/lib/site'

export type ShareAchievement = {
  category: string
  categoryLabel: string
  periodLabel: string
  period: string
  rank: number
  metricLabel: string | null
}

const CATEGORY_ICON: Record<string, typeof Eye> = {
  most_viewed: Eye,
  most_booked: CalendarCheck,
  most_contacted: MessageSquare,
  highest_rated: Star,
  quick_responder: Zap,
}

const ACCOLADE: Record<string, string> = {
  most_viewed: "Edmonton's Most Discovered Photographer",
  most_booked: "Edmonton's Busiest Photographer",
  most_contacted: "Edmonton's Most Contacted Photographer",
  highest_rated: "Edmonton's Top-Rated Photographer",
  quick_responder: "Edmonton's Fastest to Reply",
}

// Medallion "metal" by finishing position — gold / silver / bronze.
const METAL: Record<number, { light: string; dark: string; frame: string; glow: string; label: string }> = {
  1: { light: '#e6c884', dark: '#9c7434', frame: 'rgba(230,200,132,0.42)', glow: 'rgba(230,200,132,0.22)', label: 'CHAMPION' },
  2: { light: '#dfe3e8', dark: '#9aa0a8', frame: 'rgba(223,227,232,0.36)', glow: 'rgba(223,227,232,0.16)', label: 'SECOND PLACE' },
  3: { light: '#e2a678', dark: '#a5673c', frame: 'rgba(226,166,120,0.40)', glow: 'rgba(226,166,120,0.18)', label: 'THIRD PLACE' },
}

// ─── The share graphic ────────────────────────────────────────────────────────
export function AchievementShareCard({
  width,
  height,
  variant,
  ach,
  displayName,
  username,
  avatarSrc,
  coverSrc,
}: {
  width: number
  height: number
  variant: 'clean' | 'photo'
  ach: ShareAchievement
  displayName: string
  username: string
  avatarSrc: string | null
  coverSrc: string | null
}) {
  const u = width / 1080
  const Icon = CATEGORY_ICON[ach.category] ?? Star
  const metal = METAL[ach.rank] ?? METAL[1]
  const usePhoto = variant === 'photo' && !!coverSrc
  const D = 300 * u // medallion diameter
  const domain = SITE_URL.replace(/^https?:\/\//, '')

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', background: '#0e0d0c', fontFamily: 'Georgia, serif' }}>
      {/* Background */}
      {usePhoto ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc!} alt="" crossOrigin="anonymous" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(10,9,8,0.74) 0%, rgba(10,9,8,0.82) 45%, rgba(8,7,6,0.94) 100%)' }} />
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(120% 80% at 50% 22%, #26231d 0%, #16140f 55%, #0e0d0c 100%)' }} />
      )}
      {/* Metal glow behind the medallion */}
      <div style={{ position: 'absolute', top: height * 0.16, left: '50%', width: D * 2.1, height: D * 2.1, transform: 'translateX(-50%)', background: `radial-gradient(circle, ${metal.glow} 0%, transparent 62%)` }} />

      {/* Classic inset frame */}
      <div style={{ position: 'absolute', inset: 34 * u, border: `${1.5 * u}px solid ${metal.frame}`, borderRadius: 10 * u, pointerEvents: 'none' }} />

      {/* Content */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: `${90 * u}px ${72 * u}px`, boxSizing: 'border-box', textAlign: 'center' }}>
        {/* Brand lockup */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 * u, marginBottom: 56 * u }}>
          <div style={{ width: 44 * u, height: 44 * u, borderRadius: '50%', background: '#f5f0e6', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/tnf-emblem.png" alt="TNF" style={{ width: '82%', height: '82%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontFamily: 'Georgia, serif', fontSize: 22 * u, fontWeight: 700, letterSpacing: 4 * u, color: '#efe7d6' }}>TRUE NORTH FRAMES</span>
        </div>

        {/* Medallion */}
        <div style={{
          width: D, height: D, borderRadius: '50%',
          background: `linear-gradient(145deg, ${metal.light} 0%, ${metal.dark} 100%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 ${20 * u}px ${50 * u}px rgba(0,0,0,0.55), inset 0 ${3 * u}px ${5 * u}px rgba(255,255,255,0.55), inset 0 ${-10 * u}px ${18 * u}px rgba(0,0,0,0.4)`,
        }}>
          <div style={{
            width: D * 0.8, height: D * 0.8, borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 34%, #201d18 0%, #0c0b09 100%)',
            border: `${3 * u}px solid ${metal.frame}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `inset 0 ${3 * u}px ${8 * u}px rgba(0,0,0,0.8)`,
          }}>
            <Icon size={D * 0.34} color={metal.light} strokeWidth={1.5} />
          </div>
        </div>

        {/* Accolade */}
        <p style={{ fontFamily: 'sans-serif', fontSize: 24 * u, fontWeight: 700, letterSpacing: 6 * u, color: metal.light, marginTop: 48 * u }}>
          {metal.label} · {ach.periodLabel.toUpperCase()}
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 66 * u, fontWeight: 700, color: '#ffffff', lineHeight: 1.06, margin: `${18 * u}px 0 ${14 * u}px` }}>
          {ach.categoryLabel}
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 34 * u, fontStyle: 'italic', color: '#cfc6b4' }}>
          {ACCOLADE[ach.category] ?? 'Featured on True North Frames'}
        </p>

        {/* Divider */}
        <div style={{ width: 120 * u, height: 1.5 * u, background: metal.frame, margin: `${52 * u}px 0` }} />

        {/* Photographer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * u }}>
          <div style={{ width: 128 * u, height: 128 * u, borderRadius: '50%', overflow: 'hidden', border: `${4 * u}px solid ${metal.light}`, background: '#1a1814', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt={displayName} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: metal.light, fontSize: 56 * u, fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 44 * u, fontWeight: 700, color: '#ffffff' }}>{displayName}</p>
          {ach.metricLabel && (
            <p style={{ fontFamily: 'sans-serif', fontSize: 26 * u, color: '#a99f8c', letterSpacing: 1 * u }}>{ach.metricLabel} this month</p>
          )}
        </div>

        {/* Footer link */}
        <p style={{ fontFamily: 'sans-serif', fontSize: 24 * u, color: '#8c8474', marginTop: 54 * u, letterSpacing: 1 * u }}>
          {domain}/p/{username}
        </p>
      </div>
    </div>
  )
}

// ─── Share modal (opened from the Achievements tab) ───────────────────────────
export function AchievementShareModal({ ach, onClose }: { ach: ShareAchievement; onClose: () => void }) {
  const [profile, setProfile] = useState<{ username: string; displayName: string; avatarUrl: string; coverUrl: string } | null>(null)
  const [variant, setVariant] = useState<'clean' | 'photo'>('clean')
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const postRef = useRef<HTMLDivElement>(null)
  const storyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/photographer/profile')
      .then((r) => r.json())
      .then((d) => setProfile({ username: d.username ?? '', displayName: d.display_name ?? 'Photographer', avatarUrl: d.avatar_url ?? '', coverUrl: d.cover_image_url ?? '' }))
      .catch(() => setProfile(null))
  }, [])

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const avatarSrc = profile?.avatarUrl ? `/api/socials/avatar-proxy?url=${encodeURIComponent(profile.avatarUrl)}` : null
  const coverSrc = profile?.coverUrl ? `/api/socials/avatar-proxy?url=${encodeURIComponent(profile.coverUrl)}` : null
  const canPhoto = !!coverSrc

  const download = useCallback(async (ref: React.RefObject<HTMLDivElement>, name: string, key: string) => {
    if (!ref.current) return
    setBusy(key)
    try {
      const imgs = Array.from(ref.current.querySelectorAll('img'))
      await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())))
      const dataUrl = await toPng(ref.current, { pixelRatio: 1 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = name
      a.click()
    } finally { setBusy(null) }
  }, [])

  const caption = profile
    ? `Honoured to be named ${ACCOLADE[ach.category] ?? 'a featured photographer'} for ${ach.periodLabel} on True North Frames.${ach.metricLabel ? ` (${ach.metricLabel} this month.)` : ''}\n\nBook me → ${absoluteUrl(`/p/${profile.username}`)}`
    : ''

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 sticky top-0 bg-white">
          <h3 className="font-semibold text-ink">Share your win</h3>
          <button onClick={onClose} className="text-ink-400 hover:text-ink"><X className="w-5 h-5" /></button>
        </div>

        {!profile ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-ink-300" /></div>
        ) : (
          <div className="p-5 space-y-5">
            {/* Variant toggle */}
            <div className="inline-flex rounded-lg border border-ink-200 overflow-hidden">
              <button onClick={() => setVariant('clean')} className={`px-3 py-1.5 text-xs font-semibold ${variant === 'clean' ? 'bg-ink text-white' : 'bg-white text-ink-500'}`}>Clean</button>
              <button onClick={() => canPhoto && setVariant('photo')} disabled={!canPhoto} title={canPhoto ? '' : 'Add a cover photo to unlock'} className={`px-3 py-1.5 text-xs font-semibold ${variant === 'photo' ? 'bg-ink text-white' : 'bg-white text-ink-500'} disabled:opacity-40`}>Photo</button>
            </div>

            {/* Preview (post) */}
            <div className="flex justify-center">
              <div className="rounded-xl overflow-hidden" style={{ width: 300, height: 300, boxShadow: '0 8px 30px rgba(0,0,0,0.18)' }}>
                <div style={{ transform: 'scale(0.2778)', transformOrigin: 'top left' }}>
                  <AchievementShareCard width={1080} height={1080} variant={variant} ach={ach} displayName={profile.displayName} username={profile.username} avatarSrc={avatarSrc} coverSrc={coverSrc} />
                </div>
              </div>
            </div>

            {/* Downloads */}
            <div className="grid grid-cols-1 gap-2.5">
              <button disabled={busy !== null} onClick={() => download(postRef, `${profile.username}-${ach.category}-post.png`, 'post')} className="flex items-center gap-3 text-left bg-ink-50 hover:bg-ink-100 transition-colors rounded-xl px-4 py-3 disabled:opacity-50">
                <Instagram className="w-4 h-4 text-ink-500" />
                <div className="flex-1"><p className="text-sm font-semibold text-ink">Instagram / Facebook post</p><p className="text-xs text-ink-400">1080×1080</p></div>
                {busy === 'post' ? <Loader2 className="w-4 h-4 animate-spin text-ink-400" /> : <Download className="w-4 h-4 text-ink-400" />}
              </button>
              <button disabled={busy !== null} onClick={() => download(storyRef, `${profile.username}-${ach.category}-story.png`, 'story')} className="flex items-center gap-3 text-left bg-ink-50 hover:bg-ink-100 transition-colors rounded-xl px-4 py-3 disabled:opacity-50">
                <Smartphone className="w-4 h-4 text-ink-500" />
                <div className="flex-1"><p className="text-sm font-semibold text-ink">Instagram Story</p><p className="text-xs text-ink-400">1080×1920</p></div>
                {busy === 'story' ? <Loader2 className="w-4 h-4 animate-spin text-ink-400" /> : <Download className="w-4 h-4 text-ink-400" />}
              </button>
            </div>

            {/* Caption */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-ink-500">Caption</p>
                <button onClick={() => { navigator.clipboard.writeText(caption); setCopied(true); setTimeout(() => setCopied(false), 1600) }} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink">
                  {copied ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                </button>
              </div>
              <p className="text-sm text-ink-500 whitespace-pre-wrap bg-ink-50 rounded-xl p-3 leading-relaxed">{caption}</p>
            </div>
          </div>
        )}

        {/* Off-screen full-size render targets */}
        {profile && (
          <div style={{ position: 'fixed', left: 0, top: 0, opacity: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
            <div ref={postRef}><AchievementShareCard width={1080} height={1080} variant={variant} ach={ach} displayName={profile.displayName} username={profile.username} avatarSrc={avatarSrc} coverSrc={coverSrc} /></div>
            <div ref={storyRef}><AchievementShareCard width={1080} height={1920} variant={variant} ach={ach} displayName={profile.displayName} username={profile.username} avatarSrc={avatarSrc} coverSrc={coverSrc} /></div>
          </div>
        )}
      </div>
    </div>
  )
}
