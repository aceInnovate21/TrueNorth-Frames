'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { toPng } from 'html-to-image'
import {
  Download, Copy, Check, Smartphone, Printer, Instagram,
  Code2, Loader2, QrCode, Share2, ExternalLink,
} from 'lucide-react'
import { SITE_URL, absoluteUrl } from '@/lib/site'

type Profile = {
  username: string
  displayName: string
  avatarUrl: string
  coverUrl: string
  status: string
}

const INK = '#171717'

// ─── The framed QR "sticker" — the reusable brand asset ───────────────────────
// Photographer avatar in the top-middle circle, QR (with the small TNF logo
// baked into its centre) below, handle + short domain at the bottom.
function QrSticker({
  size,
  qrUrl,
  avatarSrc,
  displayName,
  username,
}: {
  size: number
  qrUrl: string | null
  avatarSrc: string | null
  displayName: string
  username: string
}) {
  const avatarR = size * 0.13
  const pad = size * 0.08

  return (
    <div style={{ width: size, position: 'relative', paddingTop: avatarR }}>
      <div
        style={{
          background: '#ffffff',
          borderRadius: size * 0.07,
          boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 8px 30px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.05)',
          padding: pad,
          paddingTop: avatarR + pad * 0.4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {qrUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrUrl} alt="QR code" style={{ width: size * 0.78, height: size * 0.78 }} />
        ) : (
          <div style={{ width: size * 0.78, height: size * 0.78, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="animate-spin" style={{ width: size * 0.1, height: size * 0.1, color: '#d4d4d4' }} />
          </div>
        )}
        <p
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontWeight: 700,
            fontSize: size * 0.062,
            color: INK,
            marginTop: pad * 0.5,
            textAlign: 'center',
            lineHeight: 1.1,
          }}
        >
          {displayName}
        </p>
      </div>

      {/* Top-middle avatar circle, overlapping the frame edge */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: avatarR * 2,
          height: avatarR * 2,
          borderRadius: '50%',
          background: INK,
          border: `${size * 0.012}px solid #ffffff`,
          overflow: 'hidden',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={avatarSrc} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
        ) : (
          <span style={{ color: '#fff', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: avatarR * 0.9 }}>
            {displayName ? displayName[0].toUpperCase() : 'P'}
          </span>
        )}
      </div>
    </div>
  )
}

// ─── Announcement graphic — "Now featured on True North Frames" ───────────────
// Two variants: `clean` (ink/serif on a light ground) and `photo` (the
// photographer's cover image with a dark overlay). Works at both square (post)
// and vertical (story) ratios; type scales off the width.
function AnnouncementCard({
  width,
  height,
  variant,
  displayName,
  username,
  avatarSrc,
  coverSrc,
}: {
  width: number
  height: number
  variant: 'clean' | 'photo'
  displayName: string
  username: string
  avatarSrc: string | null
  coverSrc: string | null
}) {
  const u = width / 1080 // scale unit relative to a 1080-wide canvas
  const domain = SITE_URL.replace(/^https?:\/\//, '')
  const usePhoto = variant === 'photo' && !!coverSrc
  const fg = usePhoto ? '#ffffff' : INK
  const sub = usePhoto ? 'rgba(255,255,255,0.75)' : '#737373'
  const avatarD = 150 * u

  return (
    <div style={{ width, height, position: 'relative', overflow: 'hidden', background: usePhoto ? INK : '#f5f5f4' }}>
      {usePhoto && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverSrc!} alt="" crossOrigin="anonymous"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.8) 100%)' }} />
        </>
      )}

      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 90 * u, boxSizing: 'border-box', textAlign: 'center' }}>
        {/* TNF logo — bare on light, in a white pill on photo */}
        <div style={usePhoto
          ? { background: '#fff', borderRadius: 999, padding: `${16 * u}px ${28 * u}px`, marginBottom: 46 * u }
          : { marginBottom: 46 * u }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="True North Frames" style={{ height: 60 * u, objectFit: 'contain', display: 'block' }} />
        </div>

        <p style={{ fontFamily: 'sans-serif', fontSize: 26 * u, letterSpacing: 3 * u, color: sub, fontWeight: 600, textTransform: 'uppercase' }}>
          Now officially featured on
        </p>
        <p style={{ fontFamily: 'Georgia, serif', fontSize: 82 * u, fontWeight: 700, color: fg, lineHeight: 1.03, margin: `${18 * u}px 0 ${40 * u}px` }}>
          True North Frames
        </p>

        {/* Photographer identity */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 * u }}>
          <div style={{ width: avatarD, height: avatarD, borderRadius: '50%', overflow: 'hidden', border: `${5 * u}px solid ${usePhoto ? '#fff' : INK}`, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarSrc} alt={displayName} crossOrigin="anonymous" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ color: '#fff', fontFamily: 'Georgia, serif', fontWeight: 700, fontSize: avatarD * 0.44 }}>{displayName[0]?.toUpperCase()}</span>
            )}
          </div>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 42 * u, fontWeight: 700, color: fg }}>{displayName}</p>
        </div>

        {/* Footer link */}
        <p style={{ fontFamily: 'sans-serif', fontSize: 28 * u, color: usePhoto ? '#fff' : INK, fontWeight: 600, marginTop: 56 * u }}>
          Book me → <span style={{ color: sub, fontWeight: 400 }}>{domain}/p/{username}</span>
        </p>
      </div>
    </div>
  )
}

export function SocialsTab() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [badgeTheme, setBadgeTheme] = useState<'dark' | 'light'>('dark')
  const [badgeStyle, setBadgeStyle] = useState<'featured' | 'book'>('featured')
  const [annVariant, setAnnVariant] = useState<'clean' | 'photo'>('clean')

  const storyRef = useRef<HTMLDivElement>(null)
  const wallpaperRef = useRef<HTMLDivElement>(null)
  const printRef = useRef<HTMLDivElement>(null)
  const annPostRef = useRef<HTMLDivElement>(null)
  const annStoryRef = useRef<HTMLDivElement>(null)

  // Load the photographer's own profile fields.
  useEffect(() => {
    fetch('/api/photographer/profile')
      .then((r) => r.json())
      .then((d) =>
        setProfile({
          username: d.username ?? '',
          displayName: d.display_name ?? 'Photographer',
          avatarUrl: d.avatar_url ?? '',
          coverUrl: d.cover_image_url ?? '',
          status: d.profile_status ?? 'pending',
        })
      )
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [])

  // Generate the QR (with the TNF logo baked into the centre) whenever the
  // profile URL is known. Regenerates automatically if the username changes.
  useEffect(() => {
    if (!profile?.username) return
    let cancelled = false
    ;(async () => {
      const QRCodeStyling = (await import('qr-code-styling')).default
      const qr = new QRCodeStyling({
        width: 1000,
        height: 1000,
        type: 'canvas',
        data: absoluteUrl(`/p/${profile.username}`),
        image: '/tnf-emblem.png',
        margin: 0,
        qrOptions: { errorCorrectionLevel: 'H' },
        dotsOptions: { color: INK, type: 'rounded' },
        cornersSquareOptions: { color: INK, type: 'extra-rounded' },
        cornersDotOptions: { color: INK },
        backgroundOptions: { color: 'transparent' },
        imageOptions: { crossOrigin: 'anonymous', margin: 10, imageSize: 0.24, hideBackgroundDots: true },
      })
      const blob = await qr.getRawData('png')
      if (cancelled || !blob) return
      // Use a data URL (not blob:) so html-to-image can embed the QR during
      // capture — blob: URLs break when the library appends cache-bust queries.
      const dataUrl: string = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(blob as Blob)
      })
      if (!cancelled) setQrUrl(dataUrl)
    })()
    return () => { cancelled = true }
  }, [profile?.username])

  const avatarSrc = profile?.avatarUrl
    ? `/api/socials/avatar-proxy?url=${encodeURIComponent(profile.avatarUrl)}`
    : null
  const coverSrc = profile?.coverUrl
    ? `/api/socials/avatar-proxy?url=${encodeURIComponent(profile.coverUrl)}`
    : null
  const canPhoto = !!coverSrc

  const download = useCallback(async (ref: React.RefObject<HTMLDivElement>, name: string, key: string) => {
    if (!ref.current) return
    setBusy(key)
    try {
      // Make sure every image in the capture node has decoded first (off-screen
      // images can otherwise be blank at capture time).
      const imgs = Array.from(ref.current.querySelectorAll('img'))
      await Promise.all(imgs.map((img) => (img.decode ? img.decode().catch(() => {}) : Promise.resolve())))
      // No cacheBust — it corrupts data:/blob: image sources.
      const dataUrl = await toPng(ref.current, { pixelRatio: 1 })
      const a = document.createElement('a')
      a.href = dataUrl
      a.download = name
      a.click()
    } finally {
      setBusy(null)
    }
  }, [])

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key)
      setTimeout(() => setCopied(null), 1800)
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-ink-300" /></div>
  }
  if (!profile?.username) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <p className="text-ink-500 font-medium">Finish setting up your profile first</p>
        <p className="text-ink-400 text-sm mt-1">Your Socials kit is generated from your profile — add a username and photo to unlock it.</p>
      </div>
    )
  }

  const profileUrl = absoluteUrl(`/p/${profile.username}`)
  // Absolute (production) URL for the copy-paste snippet the photographer pastes
  // on their own site; relative URL for the in-app preview so it resolves on the
  // current deployment (preview/dev) instead of pointing at prod.
  const badgeUrl = absoluteUrl(`/api/badge/${profile.username}?theme=${badgeTheme}&style=${badgeStyle}`)
  const badgePreviewSrc = `/api/badge/${profile.username}?theme=${badgeTheme}&style=${badgeStyle}`
  const embedSnippet = `<a href="${profileUrl}" target="_blank" rel="noopener">\n  <img src="${badgeUrl}" alt="${badgeStyle === 'book' ? 'Book me' : 'Featured'} on True North Frames" width="280" height="64" />\n</a>`
  const caption = `I'm excited to share that I'm officially featured on True North Frames — Edmonton's home for trusted local photographers! 📸\n\nBook me directly here: ${profileUrl}`

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
            <Share2 className="w-4 h-4 text-ink-500" />
          </div>
          <div>
            <h2 className="font-semibold text-ink">Socials kit</h2>
            <p className="text-xs text-ink-300">Your branded QR code, share graphics and website badge — auto-built from your profile</p>
          </div>
        </div>
        {profile.status !== 'approved' && (
          <p className="mt-4 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-xl px-3 py-2">
            Your profile isn&apos;t live yet, so the link will only work once you&apos;re approved. Everything below is ready to preview.
          </p>
        )}
      </div>

      {/* QR + downloads */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-5">
          <QrCode className="w-4 h-4 text-ink-400" />
          <h3 className="font-semibold text-ink text-sm">Your QR code</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
          {/* Live preview */}
          <div className="flex-shrink-0">
            <QrSticker size={260} qrUrl={qrUrl} avatarSrc={avatarSrc} displayName={profile.displayName} username={profile.username} />
          </div>
          {/* Download presets */}
          <div className="flex-1 w-full">
            <p className="text-sm text-ink-500 mb-3">Download ready-to-share sizes:</p>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                disabled={busy !== null || !qrUrl}
                onClick={() => download(wallpaperRef, `${profile.username}-wallpaper.png`, 'wallpaper')}
                className="flex items-center gap-3 text-left bg-ink-50 hover:bg-ink-100 transition-colors rounded-xl px-4 py-3 disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4 text-ink-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Phone wallpaper</p>
                  <p className="text-xs text-ink-400">1080×1920 · lock-screen scanning in person</p>
                </div>
                {busy === 'wallpaper' ? <Loader2 className="w-4 h-4 animate-spin text-ink-400" /> : <Download className="w-4 h-4 text-ink-400" />}
              </button>

              <button
                disabled={busy !== null || !qrUrl}
                onClick={() => download(printRef, `${profile.username}-print.png`, 'print')}
                className="flex items-center gap-3 text-left bg-ink-50 hover:bg-ink-100 transition-colors rounded-xl px-4 py-3 disabled:opacity-50"
              >
                <Printer className="w-4 h-4 text-ink-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Print ready</p>
                  <p className="text-xs text-ink-400">300 DPI · business cards &amp; pricing guides</p>
                </div>
                {busy === 'print' ? <Loader2 className="w-4 h-4 animate-spin text-ink-400" /> : <Download className="w-4 h-4 text-ink-400" />}
              </button>

              <button
                disabled={busy !== null || !qrUrl}
                onClick={() => download(storyRef, `${profile.username}-story.png`, 'story')}
                className="flex items-center gap-3 text-left bg-ink-50 hover:bg-ink-100 transition-colors rounded-xl px-4 py-3 disabled:opacity-50"
              >
                <Instagram className="w-4 h-4 text-ink-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Instagram Story</p>
                  <p className="text-xs text-ink-400">1080×1920 · &quot;Featured on True North Frames&quot;</p>
                </div>
                {busy === 'story' ? <Loader2 className="w-4 h-4 animate-spin text-ink-400" /> : <Download className="w-4 h-4 text-ink-400" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Announcement graphics */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-ink-400" />
            <h3 className="font-semibold text-ink text-sm">Announcement graphics</h3>
          </div>
          {/* Variant toggle */}
          <div className="inline-flex rounded-lg border border-ink-200 overflow-hidden">
            <button onClick={() => setAnnVariant('clean')}
              className={`px-3 py-1.5 text-xs font-semibold ${annVariant === 'clean' ? 'bg-ink text-white' : 'bg-white text-ink-500'}`}>
              Clean
            </button>
            <button onClick={() => canPhoto && setAnnVariant('photo')} disabled={!canPhoto}
              title={canPhoto ? '' : 'Add a cover photo to your profile to unlock this'}
              className={`px-3 py-1.5 text-xs font-semibold ${annVariant === 'photo' ? 'bg-ink text-white' : 'bg-white text-ink-500'} disabled:opacity-40`}>
              Photo
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start">
          {/* Live preview (post) */}
          <div className="flex-shrink-0 rounded-xl overflow-hidden" style={{ width: 260, height: 260, boxShadow: '0 4px 16px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.06)' }}>
            <div style={{ transform: 'scale(0.2407)', transformOrigin: 'top left' }}>
              <AnnouncementCard width={1080} height={1080} variant={annVariant} displayName={profile.displayName} username={profile.username} avatarSrc={avatarSrc} coverSrc={coverSrc} />
            </div>
          </div>

          {/* Downloads */}
          <div className="flex-1 w-full">
            <p className="text-sm text-ink-500 mb-3">Share your feature the moment you go live:</p>
            <div className="grid grid-cols-1 gap-2.5">
              <button
                disabled={busy !== null}
                onClick={() => download(annPostRef, `${profile.username}-announcement-post.png`, 'ann-post')}
                className="flex items-center gap-3 text-left bg-ink-50 hover:bg-ink-100 transition-colors rounded-xl px-4 py-3 disabled:opacity-50"
              >
                <Instagram className="w-4 h-4 text-ink-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Instagram / Facebook post</p>
                  <p className="text-xs text-ink-400">1080×1080 · stays on your feed grid</p>
                </div>
                {busy === 'ann-post' ? <Loader2 className="w-4 h-4 animate-spin text-ink-400" /> : <Download className="w-4 h-4 text-ink-400" />}
              </button>
              <button
                disabled={busy !== null}
                onClick={() => download(annStoryRef, `${profile.username}-announcement-story.png`, 'ann-story')}
                className="flex items-center gap-3 text-left bg-ink-50 hover:bg-ink-100 transition-colors rounded-xl px-4 py-3 disabled:opacity-50"
              >
                <Smartphone className="w-4 h-4 text-ink-500" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink">Instagram Story</p>
                  <p className="text-xs text-ink-400">1080×1920 · full-screen vertical</p>
                </div>
                {busy === 'ann-story' ? <Loader2 className="w-4 h-4 animate-spin text-ink-400" /> : <Download className="w-4 h-4 text-ink-400" />}
              </button>
            </div>
            {!canPhoto && (
              <p className="text-xs text-ink-300 mt-3">Add a cover photo to your profile to unlock the photo-backed variant.</p>
            )}
          </div>
        </div>
      </div>

      {/* Announcement caption */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Instagram className="w-4 h-4 text-ink-400" />
            <h3 className="font-semibold text-ink text-sm">Announcement caption</h3>
          </div>
          <button onClick={() => copy(caption, 'caption')} className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink">
            {copied === 'caption' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
        <p className="text-sm text-ink-500 whitespace-pre-wrap bg-ink-50 rounded-xl p-4 leading-relaxed">{caption}</p>
      </div>

      {/* Website badge */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Code2 className="w-4 h-4 text-ink-400" />
          <h3 className="font-semibold text-ink text-sm">Website badge</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="inline-flex rounded-lg border border-ink-200 overflow-hidden">
            {(['featured', 'book'] as const).map((s) => (
              <button key={s} onClick={() => setBadgeStyle(s)}
                className={`px-3 py-1.5 text-xs font-semibold ${badgeStyle === s ? 'bg-ink text-white' : 'bg-white text-ink-500'}`}>
                {s === 'featured' ? 'Featured' : 'Book me'}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-lg border border-ink-200 overflow-hidden">
            {(['dark', 'light'] as const).map((t) => (
              <button key={t} onClick={() => setBadgeTheme(t)}
                className={`px-3 py-1.5 text-xs font-semibold capitalize ${badgeTheme === t ? 'bg-ink text-white' : 'bg-white text-ink-500'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Live badge preview */}
        <div className={`rounded-xl p-6 flex justify-center mb-4 ${badgeTheme === 'dark' ? 'bg-ink-100' : 'bg-ink-50'}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={badgePreviewSrc} alt="Badge preview" width={280} height={64} />
        </div>

        <div className="relative">
          <pre className="text-xs bg-ink-900 text-ink-100 rounded-xl p-4 overflow-x-auto" style={{ background: '#171717', color: '#e5e5e5' }}>{embedSnippet}</pre>
          <button onClick={() => copy(embedSnippet, 'embed')} className="absolute top-2 right-2 inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-2.5 py-1.5 rounded-lg">
            {copied === 'embed' ? <><Check className="w-3.5 h-3.5" /> Copied</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </button>
        </div>
        <p className="text-xs text-ink-400 mt-3">
          Paste into an <span className="font-semibold">HTML / Embed</span> block — works on Wix, Squarespace and WordPress. Links visitors straight to your True North Frames profile.
        </p>
        <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink mt-2">
          Preview your public link <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* ── Render targets for downloads (full pixel size) ──
           Kept in the viewport but invisible (opacity 0, behind everything) so
           the browser does NOT lazy-defer their images — off-screen images get
           replaced with placeholders and capture blank. ── */}
      <div style={{ position: 'fixed', left: 0, top: 0, opacity: 0, zIndex: -1, pointerEvents: 'none', overflow: 'hidden' }} aria-hidden>
        {/* Phone wallpaper 1080×1920 — sticker in lower third */}
        <div ref={wallpaperRef} style={{ width: 1080, height: 1920, background: '#f5f5f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 220 }}>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 40, color: INK, fontWeight: 700, marginBottom: 40 }}>Scan to book me</p>
          <QrSticker size={640} qrUrl={qrUrl} avatarSrc={avatarSrc} displayName={profile.displayName} username={profile.username} />
        </div>

        {/* Print 300 DPI business card 1050×600 (3.5"×2") — horizontal */}
        <div ref={printRef} style={{ width: 1050, height: 600, background: '#ffffff', display: 'flex', alignItems: 'center', gap: 40, padding: 50, boxSizing: 'border-box' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: 'Georgia, serif', fontSize: 44, fontWeight: 700, color: INK, lineHeight: 1.1 }}>{profile.displayName}</p>
            <p style={{ fontFamily: 'sans-serif', fontSize: 22, color: '#737373', marginTop: 12 }}>Edmonton Photographer</p>
            <p style={{ fontFamily: 'sans-serif', fontSize: 20, color: INK, marginTop: 28, fontWeight: 600 }}>Scan to view my work &amp; book →</p>
            <p style={{ fontFamily: 'sans-serif', fontSize: 16, color: '#a3a3a3', marginTop: 10 }}>{SITE_URL.replace(/^https?:\/\//, '')}/p/{profile.username}</p>
          </div>
          <QrSticker size={440} qrUrl={qrUrl} avatarSrc={avatarSrc} displayName={profile.displayName} username={profile.username} />
        </div>

        {/* Instagram Story 1080×1920 */}
        <div ref={storyRef} style={{ width: 1080, height: 1920, background: '#f5f5f4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, boxSizing: 'border-box' }}>
          <p style={{ fontFamily: 'sans-serif', fontSize: 30, letterSpacing: 2, color: '#737373', fontWeight: 600, textTransform: 'uppercase', marginBottom: 24 }}>Now featured on</p>
          <p style={{ fontFamily: 'Georgia, serif', fontSize: 72, fontWeight: 700, color: INK, marginBottom: 70, textAlign: 'center', lineHeight: 1.05 }}>True North Frames</p>
          <QrSticker size={680} qrUrl={qrUrl} avatarSrc={avatarSrc} displayName={profile.displayName} username={profile.username} />
          <p style={{ fontFamily: 'sans-serif', fontSize: 30, color: '#525252', marginTop: 70, textAlign: 'center' }}>Scan to explore my work &amp; book a session</p>
        </div>

        {/* Announcement — post 1080×1080 */}
        <div ref={annPostRef}>
          <AnnouncementCard width={1080} height={1080} variant={annVariant} displayName={profile.displayName} username={profile.username} avatarSrc={avatarSrc} coverSrc={coverSrc} />
        </div>

        {/* Announcement — story 1080×1920 */}
        <div ref={annStoryRef}>
          <AnnouncementCard width={1080} height={1920} variant={annVariant} displayName={profile.displayName} username={profile.username} avatarSrc={avatarSrc} coverSrc={coverSrc} />
        </div>
      </div>
    </div>
  )
}
