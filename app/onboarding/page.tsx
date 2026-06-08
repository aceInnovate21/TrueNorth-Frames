'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowRight, MapPin, User, CheckCircle2 } from 'lucide-react'

const EDMONTON_NEIGHBOURHOODS = [
  'Downtown', 'Oliver', 'Glenora', 'Westmount', 'Strathcona',
  'Bonnie Doon', 'Millwoods', 'Windermere', 'St. Albert', 'Sherwood Park',
  'West Edmonton', 'North Edmonton', 'South Edmonton', 'Other / Outside Edmonton',
]

function OnboardingForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [city, setCity] = useState('')
  const [customCity, setCustomCity] = useState('')
  const [submitted, setSubmitted] = useState(false)

  // Pre-fill name from signup query params
  useEffect(() => {
    const fn = searchParams.get('firstName')
    const ln = searchParams.get('lastName')
    if (fn) setFirstName(fn)
    if (ln) setLastName(ln)
  }, [searchParams])

  const isValid = firstName.trim() && lastName.trim() && (city && city !== 'other' ? true : customCity.trim())

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return
    setSubmitted(true)

    const location = city === 'other' ? customCity.trim() : city

    await fetch('/api/onboarding/client', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ first_name: firstName, last_name: lastName, location }),
    })

    router.push('/dashboard/client')
  }

  return (
    <div className="w-full max-w-md">
      {/* Mobile logo */}
      <div className="lg:hidden flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <Image src="/logo.png" alt="TrueNorth Frames" width={34} height={34} className="rounded-md" />
          <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
        </Link>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-xs text-ink-300">Account</span>
        </div>
        <div className="flex-1 h-px bg-ink-100" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-ink flex items-center justify-center text-white text-[10px] font-bold">2</div>
          <span className="text-xs font-semibold text-ink">Profile</span>
        </div>
        <div className="flex-1 h-px bg-ink-100" />
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full border border-ink-100 flex items-center justify-center text-ink-300 text-[10px] font-bold">3</div>
          <span className="text-xs text-ink-300">Done</span>
        </div>
      </div>

      <h1 className="font-serif text-3xl font-bold text-ink mb-1">
        {firstName ? `Hi ${firstName}!` : 'Set up your profile'}
      </h1>
      <p className="text-ink-300 text-sm mb-8">
        {firstName
          ? "Just confirm your name and tell us your area — then you're in."
          : 'Photographers will use this to personalise their reply to you.'}
      </p>

      {submitted ? (
        <div className="flex flex-col items-center text-center py-10 gap-4">
          <div className="w-14 h-14 rounded-2xl bg-ink flex items-center justify-center">
            <CheckCircle2 className="w-7 h-7 text-white" />
          </div>
          <p className="font-semibold text-ink text-lg">You're all set, {firstName || 'there'}!</p>
          <p className="text-ink-300 text-sm">Taking you to your dashboard…</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Your name</label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-300 pointer-events-none" />
                <input
                  type="text"
                  placeholder="First name"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-ink-100 rounded-xl pl-10 pr-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
                />
              </div>
              <input
                type="text"
                placeholder="Last name"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
              />
            </div>
          </div>

          {/* City / neighbourhood */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-ink-300" />
                Your area in Edmonton
              </span>
            </label>
            <p className="text-ink-300 text-xs mb-2.5">
              We use this to show you nearby photographers first.
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {EDMONTON_NEIGHBOURHOODS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setCity(n === 'Other / Outside Edmonton' ? 'other' : n)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    city === n || (city === 'other' && n === 'Other / Outside Edmonton')
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            {city === 'other' && (
              <input
                type="text"
                placeholder="Enter your city or area"
                value={customCity}
                onChange={(e) => setCustomCity(e.target.value)}
                className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
                autoFocus
              />
            )}
          </div>

          {/* Privacy note */}
          <div className="bg-ink-50 rounded-xl px-4 py-3 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-ink flex-shrink-0 mt-0.5" />
            <p className="text-ink-400 text-xs leading-relaxed">
              Your location is only used to sort search results. It is never shared publicly or sold to third parties.
            </p>
          </div>

          <button
            type="submit"
            disabled={!isValid}
            className="w-full bg-ink hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            Go to my dashboard
            <ArrowRight className="w-4 h-4" />
          </button>

          <p className="text-center text-xs text-ink-300">
            <Link href="/dashboard/client" className="underline underline-offset-2 hover:text-ink transition-colors">
              Skip for now
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 bg-ink relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="TrueNorth Frames" width={38} height={38} className="rounded-md" />
            <span className="text-white font-semibold text-sm group-hover:text-ink-200 transition-colors">
              TrueNorth Frames
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-ink-400 text-xs font-semibold uppercase tracking-[0.15em]">Almost there</p>
          <p className="font-serif text-2xl font-bold text-white leading-snug">
            Let us personalise your experience.
          </p>
          <p className="text-ink-400 text-sm leading-relaxed">
            Just your neighbourhood — that's all we still need. No forms, no fuss.
          </p>

          <div className="pt-2 space-y-3">
            {[
              'Find photographers near you first',
              'Get notified when they reply',
              'Manage every conversation in one place',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-white/60 flex-shrink-0" />
                <span className="text-ink-300 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-ink-600 text-xs">
          © {new Date().getFullYear()} TrueNorth Frames · Edmonton, AB
        </p>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-10">
        <Suspense fallback={<div className="w-full max-w-md animate-pulse space-y-4"><div className="h-8 bg-ink-50 rounded-xl" /><div className="h-4 bg-ink-50 rounded-xl w-2/3" /></div>}>
          <OnboardingForm />
        </Suspense>
      </div>
    </div>
  )
}
