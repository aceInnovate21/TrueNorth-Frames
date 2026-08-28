'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  ArrowRight, ArrowLeft, CheckCircle2, Camera,
  User, Globe, Shield, Zap, AlertCircle, Star, X,
} from 'lucide-react'

const SPECIALTIES = [
  'Wedding', 'Portrait', 'Headshot', 'Corporate', 'Newborn', 'Maternity',
  'Family', 'Event', 'Graduation', 'Real Estate', 'Product', 'Fashion',
  'Street', 'Boudoir', 'Sports', 'Food', 'Pets', 'Travel',
]

const EDMONTON_AREAS = [
  'Downtown', 'Oliver', 'Glenora', 'Westmount', 'Strathcona',
  'Bonnie Doon', 'Millwoods', 'Windermere', 'St. Albert', 'Sherwood Park',
  'West Edmonton', 'North Edmonton', 'South Edmonton',
]

const STEPS = ['Account', 'Basics', 'Specialties', 'Presence', 'Done']

// ─── Badge ladder shown during onboarding ────────────────────────────────────

const BADGE_LADDER = [
  {
    emoji: '🆕',
    label: 'Newly Joined',
    color: 'bg-ink-50',
    textColor: 'text-ink-500',
    borderColor: 'border-ink-100',
    how: 'You start here — complete your profile to move up.',
  },
  {
    emoji: '🌟',
    label: 'Rising Talent',
    color: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    how: 'Upload 5+ portfolio photos and reach 60% profile completeness.',
  },
  {
    emoji: '🔵',
    label: 'Verified Pro',
    color: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    how: 'Connect your Google Business Profile via OAuth with at least 1 review.',
  },
  {
    emoji: '✅',
    label: 'Trusted Pro',
    color: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    how: 'Complete 3+ bookings and earn a platform rating of 4.0+ on TrueNorth Frames.',
  },
]

// ─── Yes / No button pair ─────────────────────────────────────────────────────

function YesNo({
  value, onChange, yesLabel = 'Yes', noLabel = 'No',
}: {
  value: boolean | null
  onChange: (v: boolean) => void
  yesLabel?: string
  noLabel?: string
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
          value === true ? 'bg-ink text-white border-ink' : 'bg-white text-ink-400 border-ink-100 hover:border-ink-300'
        }`}
      >
        {yesLabel}
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
          value === false ? 'bg-ink text-white border-ink' : 'bg-white text-ink-400 border-ink-100 hover:border-ink-300'
        }`}
      >
        {noLabel}
      </button>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

function PhotographerOnboardingForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1 — basics
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [area, setArea] = useState('')
  const [yearsExperience, setYearsExperience] = useState<string>('')

  // Step 2 — specialties
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])
  const [customSpecialty, setCustomSpecialty] = useState('')

  // Step 3 — trust questions
  const [hasGbp, setHasGbp]             = useState<boolean | null>(null)
  const [hasWebsite, setHasWebsite]     = useState<boolean | null>(null)
  const [websiteUrl, setWebsiteUrl]     = useState('')
  const [hasGbpReviews, setHasGbpReviews] = useState<boolean | null>(null)

  const [submitting, setSubmitting]     = useState(false)
  const [submitError, setSubmitError]   = useState<string | null>(null)
  const [touched, setTouched]           = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fn = searchParams.get('firstName')
    const ln = searchParams.get('lastName')
    if (fn) { setFirstName(fn); setDisplayName(fn + (ln ? ' ' + ln : '')) }
    if (ln) setLastName(ln)
  }, [searchParams])

  function touch(f: string) { setTouched(t => ({ ...t, [f]: true })) }

  // Validations — step 3 is always valid (presence questions are optional context)
  const step1Valid = displayName.trim() && bio.trim().length >= 20 && area && yearsExperience !== ''
  const step2Valid = selectedSpecialties.length >= 1
  const step3Valid = true

  function toggleSpecialty(s: string) {
    setSelectedSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 5 ? [...prev, s] : prev
    )
  }

  function addCustomSpecialty() {
    const raw = customSpecialty.trim().slice(0, 60)
    if (!raw) return
    // Snap to a preset's canonical casing when it matches one, so chips stay in sync
    const preset = SPECIALTIES.find(s => s.toLowerCase() === raw.toLowerCase())
    const value = preset ?? raw
    setSelectedSpecialties(prev => {
      if (prev.length >= 5) return prev
      if (prev.some(s => s.toLowerCase() === value.toLowerCase())) return prev
      return [...prev, value]
    })
    setCustomSpecialty('')
  }

  async function handleFinish() {
    setSubmitting(true)
    setSubmitError(null)

    const res = await fetch('/api/onboarding/photographer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        display_name: displayName,
        bio,
        location: area,
        specialties: selectedSpecialties,
        website_url: hasWebsite && websiteUrl.trim() ? websiteUrl.trim() : null,
        years_experience: yearsExperience ? Number(yearsExperience) : null,
        has_gbp: hasGbp,
        has_gbp_reviews: hasGbpReviews,
        has_website: hasWebsite,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setSubmitError(err?.error ?? `Error ${res.status} — please try again`)
      setSubmitting(false)
      return
    }

    router.push('/dashboard/photographer?fresh=1')
  }

  return (
    <div className="w-full max-w-lg">
      {/* Mobile logo */}
      <div className="lg:hidden flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="TrueNorth Frames" width={34} height={34} className="rounded-md" />
          <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
        </Link>
      </div>

      {/* Step bar */}
      <div className="flex items-center gap-1.5 mb-10">
        {STEPS.map((label, i) => {
          const done   = i < step || (step === 3 && i === 3)
          const active = i === step
          return (
            <div key={label} className="flex items-center gap-1.5 flex-1 last:flex-none">
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                  i === 0 || done ? 'bg-ink' : active ? 'bg-ink' : 'border border-ink-100 bg-white'
                }`}>
                  {i === 0 || done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    : <span className={active ? 'text-white' : 'text-ink-300'}>{i}</span>
                  }
                </div>
                <span className={`text-xs hidden sm:block ${active ? 'font-semibold text-ink' : 'text-ink-300'}`}>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-px bg-ink-100" />}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Basic details ─────────────────────────────────── */}
      {step === 1 && (
        <div>
          <div className="mb-8">
            <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mb-4">
              <User className="w-5 h-5 text-ink-400" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Your basic details</h1>
            <p className="text-ink-300 text-sm">This is what clients see when they find your profile.</p>
          </div>

          <div className="space-y-5">
            {/* Display name */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Chen Photography"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={() => touch('displayName')}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                  touched.displayName && !displayName.trim() ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                }`}
              />
              <p className="mt-1 text-xs text-ink-300">Your name or business name — shown on your profile card.</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Bio <span className="text-red-500">*</span>
                <span className="ml-2 text-ink-300 font-normal text-xs">({bio.length}/300)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tell clients who you are, what you love to shoot, and what makes working with you different. Keep it personal."
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 300))}
                onBlur={() => touch('bio')}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all resize-none ${
                  touched.bio && bio.trim().length < 20 ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                }`}
              />
              {touched.bio && bio.trim().length < 20 && bio.length > 0 && (
                <p className="mt-1 text-xs text-red-500">At least 20 characters — give clients something to connect with.</p>
              )}
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                Your area in Edmonton <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {EDMONTON_AREAS.map(n => (
                  <button key={n} type="button" onClick={() => setArea(n)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      area === n ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
              {touched.area && !area && (
                <p className="mt-1.5 text-xs text-red-500">Please select your area.</p>
              )}
            </div>

            {/* Years of experience */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Years of photography experience in Edmonton <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Just starting out', value: '0' },
                  { label: '1–3 years',          value: '2' },
                  { label: '3–5 years',           value: '4' },
                  { label: '5–10 years',          value: '7' },
                  { label: '10+ years',           value: '10' },
                ].map(opt => (
                  <button key={opt.value} type="button" onClick={() => setYearsExperience(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                      yearsExperience === opt.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
              {touched.yearsExperience && !yearsExperience && (
                <p className="mt-1.5 text-xs text-red-500">Please select your experience level.</p>
              )}
              {yearsExperience !== '' && (
                <p className="mt-1.5 text-xs text-ink-400">
                  🆕 Everyone starts with <strong>Newly Joined</strong>. Upload 5+ portfolio photos and hit 60% profile completeness to earn <strong>Rising Talent</strong> — badges are earned automatically, not assigned.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              touch('displayName'); touch('bio')
              touch('area'); touch('yearsExperience')
              if (step1Valid) setStep(2)
            }}
            disabled={!step1Valid}
            className="w-full mt-8 bg-ink hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Next: Specialties <ArrowRight className="w-4 h-4" />
          </button>

        </div>
      )}

      {/* ── Step 2: Specialties ───────────────────────────────────── */}
      {step === 2 && (
        <div>
          <button onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="mb-8">
            <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mb-4">
              <Camera className="w-5 h-5 text-ink-400" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">What do you shoot?</h1>
            <p className="text-ink-300 text-sm">Pick up to 5 specialties, or add your own. These appear as filter tags on your profile. <span className="text-red-500">*</span></p>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {SPECIALTIES.map(s => {
              const selected = selectedSpecialties.includes(s)
              const maxed = selectedSpecialties.length >= 5 && !selected
              return (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)} disabled={maxed}
                  className={`text-sm px-4 py-2 rounded-full border-2 transition-all ${
                    selected ? 'bg-ink text-white border-ink'
                    : maxed ? 'bg-white text-ink-200 border-ink-100 cursor-not-allowed'
                    : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                  }`}>
                  {s}
                </button>
              )
            })}
          </div>

          {/* Custom specialty entry */}
          <div className="flex gap-2 mb-4">
            <input
              type="text" value={customSpecialty} maxLength={60}
              onChange={e => setCustomSpecialty(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSpecialty() } }}
              disabled={selectedSpecialties.length >= 5}
              placeholder={selectedSpecialties.length >= 5 ? 'Maximum 5 specialties selected' : 'Add your own — e.g. Headshot, Pets…'}
              className="flex-1 border-2 border-ink-100 rounded-full px-4 py-2 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink-300 transition-all disabled:bg-ink-50 disabled:cursor-not-allowed"
            />
            <button
              type="button" onClick={addCustomSpecialty}
              disabled={!customSpecialty.trim() || selectedSpecialties.length >= 5}
              className="text-sm font-medium px-4 py-2 rounded-full border-2 border-ink-100 text-ink-500 hover:border-ink-300 hover:text-ink transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>

          {/* Custom (non-preset) selections shown as removable chips */}
          {selectedSpecialties.filter(s => !SPECIALTIES.includes(s)).length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedSpecialties.filter(s => !SPECIALTIES.includes(s)).map(s => (
                <button key={s} type="button" onClick={() => toggleSpecialty(s)}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-full border-2 bg-ink text-white border-ink">
                  {s}
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          )}

          {selectedSpecialties.length > 0 && (
            <div className="bg-ink-50 rounded-xl px-4 py-3 mb-6">
              <p className="text-xs text-ink-400">
                Selected: <span className="font-semibold text-ink">{selectedSpecialties.join(', ')}</span>
                {selectedSpecialties.length < 5 && <span className="ml-1 text-ink-300">({5 - selectedSpecialties.length} more allowed)</span>}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={() => { if (step2Valid) setStep(3) }}
            disabled={!step2Valid}
            className="w-full bg-ink hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Next: Trust questions <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Step 3: Online presence ───────────────────────────────── */}
      {step === 3 && (
        <div>
          <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="mb-8">
            <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mb-4">
              <Globe className="w-5 h-5 text-ink-400" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Your online presence</h1>
            <p className="text-ink-300 text-sm leading-relaxed">
              Tell us about your existing presence. This helps us set up your profile — you can connect everything properly from your dashboard.
            </p>
          </div>

          <div className="space-y-5">

            {/* Q1: GBP */}
            <div className="bg-white border border-ink-100 rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-black text-sm">G</span>
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">Do you have a Google Business Profile?</p>
                  <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">
                    A free listing at <span className="font-medium">business.google.com</span> — separate from a personal Google account.
                  </p>
                </div>
              </div>
              <YesNo value={hasGbp} onChange={v => { setHasGbp(v); if (!v) setHasGbpReviews(null) }} />
              {hasGbp === false && (
                <div className="mt-3 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700 leading-relaxed">
                    No problem — create one free at <strong>business.google.com</strong> and connect it from your dashboard later to unlock Verified Pro.
                  </p>
                </div>
              )}
            </div>

            {/* Q2: GBP reviews — only if they have GBP */}
            {hasGbp === true && (
              <div className="bg-white border border-ink-100 rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-9 h-9 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">Does your Google Business Profile have any reviews?</p>
                    <p className="text-xs text-ink-400 mt-0.5">Client reviews on your GBP listing — not TrueNorth Frames reviews.</p>
                  </div>
                </div>
                <YesNo
                  value={hasGbpReviews}
                  onChange={setHasGbpReviews}
                  yesLabel="Yes, I have reviews"
                  noLabel="Not yet"
                />
              </div>
            )}

            {/* Q3: Website */}
            <div className="bg-white border border-ink-100 rounded-2xl p-5" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 bg-ink-50 border border-ink-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-ink-400" />
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">Do you have a photography website?</p>
                  <p className="text-xs text-ink-400 mt-0.5">Portfolio site, Squarespace, Wix, or any professional web presence.</p>
                </div>
              </div>
              <YesNo value={hasWebsite} onChange={v => { setHasWebsite(v); if (!v) setWebsiteUrl('') }} />
              {hasWebsite === true && (
                <div className="mt-3 space-y-1">
                  <input
                    type="url"
                    placeholder="https://yoursite.com"
                    value={websiteUrl}
                    onChange={e => setWebsiteUrl(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                      !websiteUrl.trim() ? 'border-amber-300 focus:border-amber-400 focus:ring-amber-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                    }`}
                  />
                  {!websiteUrl.trim() && (
                    <p className="text-xs text-amber-600">Add your URL so it appears on your profile — you can update it later from the dashboard.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ── Badge ladder — how badges are earned ── */}
          <div className="mt-8 rounded-2xl border border-ink-100 overflow-hidden">
            <div className="px-5 py-3 bg-ink-50 border-b border-ink-100">
              <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">How badges work on TrueNorth Frames</p>
            </div>
            <div className="divide-y divide-ink-50">
              {BADGE_LADDER.map((b, i) => (
                <div key={b.label} className="flex items-start gap-3 px-5 py-3.5">
                  <span className="text-lg flex-shrink-0 mt-0.5">{b.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${b.color} ${b.textColor} ${b.borderColor}`}>
                        {b.label}
                      </span>
                      {i === 0 && <span className="text-[10px] text-ink-300 font-medium">Starting point</span>}
                      {i === BADGE_LADDER.length - 1 && <span className="text-[10px] text-emerald-600 font-medium">Top tier</span>}
                    </div>
                    <p className="text-xs text-ink-400 leading-snug">{b.how}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <Shield className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700 leading-relaxed">
              Badges are computed automatically from verified data — Google OAuth, portfolio uploads, and completed bookings. You can't game them, and clients trust that.
            </p>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mt-6">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="w-full mt-6 bg-ink hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {submitting
              ? <><Spinner /> Building your profile…</>
              : <>Complete setup <ArrowRight className="w-4 h-4" /></>
            }
          </button>

          <div className="flex items-center gap-2 mt-4 justify-center">
            <Zap className="w-3.5 h-3.5 text-ink-300" />
            <p className="text-xs text-ink-300">
              Connect your Google Business Profile anytime from your dashboard to start earning badges.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function PhotographerOnboardingPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[40%] flex-col justify-between p-10 bg-ink relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="TrueNorth Frames" width={38} height={38} className="rounded-md" />
            <span className="text-white font-semibold text-sm group-hover:text-ink-200 transition-colors">TrueNorth Frames</span>
          </Link>
        </div>

        <div className="relative z-10 space-y-5">
          <p className="text-ink-400 text-xs font-semibold uppercase tracking-[0.15em]">For photographers</p>
          <p className="font-serif text-2xl font-bold text-white leading-snug">
            Your profile is your reputation.<br />Let's make it count.
          </p>
          <p className="text-ink-400 text-sm leading-relaxed">
            A complete profile gets 3× more enquiries. Takes about 5 minutes.
          </p>

          <div className="pt-2 space-y-3">
            {[
              'Google Business Profile trust score (75–100)',
              'Portfolio gallery — up to 20 photos',
              'Badges: Rising Talent or Trusted Pro',
              'Direct client enquiries to your inbox',
            ].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white/60 flex-shrink-0" />
                <span className="text-ink-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-ink-600 text-xs">© {new Date().getFullYear()} TrueNorth Frames · Edmonton, AB</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-lg py-6">
          <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-8 bg-ink-50 rounded-xl" /><div className="h-4 bg-ink-50 rounded-xl w-2/3" /></div>}>
            <PhotographerOnboardingForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
