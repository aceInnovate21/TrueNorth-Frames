'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowRight, ArrowLeft, CheckCircle2, Camera, MapPin, DollarSign, User, Globe, Instagram, Shield, Zap, Facebook, AlertCircle } from 'lucide-react'

const SPECIALTIES = [
  'Wedding', 'Portrait', 'Corporate', 'Newborn', 'Family', 'Event',
  'Real Estate', 'Product', 'Street', 'Boudoir', 'Sports', 'Food',
]

const EDMONTON_AREAS = [
  'Downtown', 'Oliver', 'Glenora', 'Westmount', 'Strathcona',
  'Bonnie Doon', 'Millwoods', 'Windermere', 'St. Albert', 'Sherwood Park',
  'West Edmonton', 'North Edmonton', 'South Edmonton',
]

const STEPS = ['Account', 'Basics', 'Specialties', 'Trust', 'Done']

function PhotographerOnboardingForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=basics, 2=specialties, 3=links

  // Basic details
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [area, setArea] = useState('')
  const [rate, setRate] = useState('')

  // Specialties
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([])

  const [websiteUrl, setWebsiteUrl] = useState('')
  const [yearsExperience, setYearsExperience] = useState<string>('')

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fn = searchParams.get('firstName')
    const ln = searchParams.get('lastName')
    if (fn) { setFirstName(fn); setDisplayName(fn + (ln ? ' ' + ln : '')) }
    if (ln) setLastName(ln)
  }, [searchParams])

  function touch(f: string) { setTouched(t => ({ ...t, [f]: true })) }

  // Step 1 validation
  const step1Valid = displayName.trim() && bio.trim().length >= 20 && area && rate

  // Step 2 validation
  const step2Valid = selectedSpecialties.length >= 1

  function toggleSpecialty(s: string) {
    setSelectedSpecialties(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : prev.length < 5 ? [...prev, s] : prev
    )
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
        rate,
        specialties: selectedSpecialties,
        website_url: websiteUrl,
        years_experience: yearsExperience ? Number(yearsExperience) : null,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      setSubmitError(err?.error ?? `Error ${res.status} — please try again`)
      setSubmitting(false)
      return
    }

    router.push('/dashboard/photographer')
    router.refresh()
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
          const stepNum = i // 0=Account(done), 1=Basics, 2=Specialties, 3=Links, 4=Done
          const done = stepNum < step || (step === 3 && stepNum === 3)
          const active = stepNum === step
          return (
            <div key={label} className="flex items-center gap-1.5 flex-1 last:flex-none">
              <div className="flex items-center gap-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors ${
                  stepNum === 0 || done
                    ? 'bg-ink'
                    : active ? 'bg-ink' : 'border border-ink-100 bg-white'
                }`}>
                  {stepNum === 0 || done
                    ? <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                    : <span className={active ? 'text-white' : 'text-ink-300'}>{stepNum}</span>
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

          <div className="space-y-4">
            {/* Display name */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Display name</label>
              <input
                type="text"
                placeholder="e.g. Sarah Chen Photography"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                onBlur={() => touch('displayName')}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${touched.displayName && !displayName.trim() ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'}`}
              />
              <p className="mt-1 text-xs text-ink-300">Your name or business name — shown on your profile card.</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Bio
                <span className="ml-2 text-ink-300 font-normal text-xs">({bio.length}/300)</span>
              </label>
              <textarea
                rows={4}
                placeholder="Tell clients who you are, what you love to shoot, and what makes working with you different. Keep it personal."
                value={bio}
                onChange={e => setBio(e.target.value.slice(0, 300))}
                onBlur={() => touch('bio')}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all resize-none ${touched.bio && bio.trim().length < 20 ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'}`}
              />
              {touched.bio && bio.trim().length < 20 && bio.length > 0 && (
                <p className="mt-1 text-xs text-red-500">At least 20 characters — give clients something to connect with.</p>
              )}
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm font-medium text-ink mb-2">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-ink-300" />
                  Your area
                </span>
              </label>
              <div className="flex flex-wrap gap-2">
                {EDMONTON_AREAS.map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setArea(n)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${area === n ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'}`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Rate */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-ink-300" />
                  Starting rate (CAD/hr)
                </span>
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-300 text-sm">$</span>
                <input
                  type="number"
                  min={50}
                  max={1000}
                  placeholder="150"
                  value={rate}
                  onChange={e => setRate(e.target.value)}
                  onBlur={() => touch('rate')}
                  className={`w-full border rounded-xl pl-8 pr-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${touched.rate && !rate ? 'border-red-300 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'}`}
                />
              </div>
              <p className="mt-1 text-xs text-ink-300">Clients see this as your starting price. You negotiate the final rate directly.</p>
            </div>

            {/* Years of experience in Edmonton */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Years of photography experience in Edmonton
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Just starting out', value: '0' },
                  { label: '1–3 years', value: '2' },
                  { label: '3–5 years', value: '4' },
                  { label: '5–10 years', value: '7' },
                  { label: '10+ years', value: '10' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setYearsExperience(opt.value)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-all ${yearsExperience === opt.value ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-xs text-ink-300">
                {yearsExperience === '0'
                  ? '🌟 You\'ll receive a Rising Talent badge — showcasing your fresh perspective to clients.'
                  : Number(yearsExperience) >= 3
                  ? '✅ Once you connect your Google Business Profile, you\'ll be eligible for the Trusted Pro badge.'
                  : yearsExperience
                  ? '🌟 You\'ll receive a Rising Talent badge — keep building and the Trusted Pro badge awaits!'
                  : 'This helps us show the right badge on your profile.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => { touch('displayName'); touch('bio'); touch('rate'); if (step1Valid) setStep(2) }}
            disabled={!step1Valid}
            className="w-full mt-8 bg-ink hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Next: Specialties
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-ink-300 mt-4">
            <Link href="/dashboard/photographer?fresh=1" className="underline underline-offset-2 hover:text-ink transition-colors">
              Skip setup for now
            </Link>
          </p>
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
            <p className="text-ink-300 text-sm">Pick up to 5 specialties. These appear as filter tags on your profile.</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {SPECIALTIES.map(s => {
              const selected = selectedSpecialties.includes(s)
              const maxed = selectedSpecialties.length >= 5 && !selected
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleSpecialty(s)}
                  disabled={maxed}
                  className={`text-sm px-4 py-2 rounded-full border-2 transition-all ${
                    selected
                      ? 'bg-ink text-white border-ink'
                      : maxed
                        ? 'bg-white text-ink-200 border-ink-100 cursor-not-allowed'
                        : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>

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
            Next: Trust score
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-ink-300 mt-4">
            <button onClick={() => setStep(3)} className="underline underline-offset-2 hover:text-ink transition-colors">
              Skip for now
            </button>
          </p>
        </div>
      )}

      {/* ── Step 3: Trust score ───────────────────────────────────── */}
      {step === 3 && (
        <div>
          <button onClick={() => setStep(2)} className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink transition-colors mb-6">
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="mb-8">
            <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-ink-400" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-ink mb-2">Build your trust score</h1>
            <p className="text-ink-300 text-sm leading-relaxed">
              Connect your social and review platforms so clients can see your real-world reputation. Each connection adds verified signal to your score — all optional, connect what you have.
            </p>
          </div>

          {/* Platform connect cards */}
          <div className="space-y-3 mb-6">
            {[
              {
                platform: 'instagram',
                label: 'Instagram',
                desc: 'Followers · engagement rate · posting consistency',
                gradient: 'from-pink-500 to-purple-600',
                bg: 'from-pink-50 to-purple-50',
                border: 'border-pink-100',
                Icon: Instagram,
                accountRequirement: 'Business or Creator account required',
              },
              {
                platform: 'facebook',
                label: 'Facebook Page',
                desc: 'Page likes · reviews · account age',
                gradient: 'from-blue-600 to-blue-400',
                bg: 'from-blue-50 to-sky-50',
                border: 'border-blue-100',
                Icon: Facebook,
                accountRequirement: 'Facebook Page required (not personal profile)',
              },
              {
                platform: 'google',
                label: 'Google Business',
                desc: 'Review rating · review count · verified badge',
                gradient: 'from-red-500 to-yellow-400',
                bg: 'from-slate-50 to-white',
                border: 'border-slate-100',
                Icon: Globe,
                isGoogle: true,
                accountRequirement: null,
              },
            ].map(({ platform, label, desc, gradient, bg, border, Icon, isGoogle, accountRequirement }) => (
              <a
                key={platform}
                href={`/api/oauth/${platform}?onboarding=1`}
                className={`flex items-center gap-3 p-3.5 rounded-xl bg-gradient-to-r ${bg} border ${border} hover:shadow-sm transition-all group`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform`}>
                  {isGoogle
                    ? <span className="text-base font-black text-white leading-none">G</span>
                    : <Icon className="w-5 h-5 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-ink">{label}</p>
                  <p className="text-xs text-ink-300 truncate">{desc}</p>
                  {accountRequirement && (
                    <p className="text-[10px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 flex-shrink-0" />
                      {accountRequirement}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-ink border border-ink-200 bg-white px-3 py-1.5 rounded-lg group-hover:bg-ink group-hover:text-white group-hover:border-ink transition-all flex-shrink-0">
                  Connect
                </span>
              </a>
            ))}
          </div>

          {/* Website */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-ink-300" />
              Website
              <span className="text-ink-300 font-normal">Optional</span>
            </label>
            <input
              type="url"
              placeholder="https://yoursite.com"
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
            />
          </div>

          <div className="bg-ink-50 border border-ink-100 rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
            <p className="text-xs text-ink-400 leading-relaxed">
              Connecting a platform redirects you to authorise access, then brings you straight back here. You can connect more platforms anytime from the <strong>Trust Score</strong> tab in your dashboard.
            </p>
          </div>

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
              {submitError}
            </p>
          )}

          <button
            type="button"
            onClick={handleFinish}
            disabled={submitting}
            className="w-full bg-ink hover:bg-ink-800 disabled:opacity-60 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {submitting ? (
              <><Spinner /> Building your profile…</>
            ) : (
              <>Go to my dashboard <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <p className="text-center text-xs text-ink-300 mt-4">
            <button type="button" onClick={handleFinish} className="underline underline-offset-2 hover:text-ink transition-colors">
              Skip for now
            </button>
          </p>
        </div>
      )}
    </div>
  )
}

export default function PhotographerOnboardingPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel ─────────────────────────────────────────────── */}
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
            Your profile is your reputation. Let's make it count.
          </p>
          <p className="text-ink-400 text-sm leading-relaxed">
            A complete profile gets 3× more enquiries than an incomplete one. Takes about 5 minutes.
          </p>

          <div className="pt-2 space-y-3">
            {[
              'Verified trust score from Instagram, Facebook & Google',
              'Portfolio gallery — up to 20 photos',
              'Direct enquiries — no commission ever',
              'Availability toggle for same-day bookings',
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

      {/* ── Right panel ────────────────────────────────────────────── */}
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
