'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Camera, User, CheckCircle2, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Role = 'client' | 'photographer' | null

const CLIENT_PERKS = [
  'Free to browse & contact photographers',
  'Get notified when a photographer replies',
  'No booking fees — ever',
]
const PHOTOGRAPHER_PERKS = [
  'Free profile with portfolio gallery',
  'Instant trust score from your existing reviews',
  'Direct enquiries — no commission taken',
]

function getStrength(pw: string) {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const colors = ['bg-ink-100', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-500']
  return { score, color: colors[score] }
}

export default function SignupPage() {
  return <Suspense><SignupForm /></Suspense>
}

function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') ?? null
  const [role, setRole] = useState<Role>(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [formError, setFormError] = useState<string | null>(null)

  const strength = getStrength(password)

  function validate() {
    const e: Record<string, string> = {}
    if (!role) e.role = 'Please select whether you\'re a client or photographer'
    if (!firstName.trim()) e.firstName = 'First name is required'
    if (!lastName.trim()) e.lastName = 'Last name is required'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    else if (strength.score < 2) e.password = 'Please choose a stronger password'
    if (!agreed) e.agreed = 'You must agree to the terms to continue'
    return e
  }

  function touch(field: string) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setTouched({ role: true, firstName: true, lastName: true, email: true, password: true, agreed: true })
    const e = validate()
    if (Object.keys(e).length > 0) return
    setLoading(true)

    const fullName = `${firstName.trim()} ${lastName.trim()}`

    // 1. Create Supabase auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, role },
      },
    })

    if (signUpError) {
      setLoading(false)
      if (signUpError.message.toLowerCase().includes('already registered')) {
        setTouched(t => ({ ...t, email: true }))
        setFormError('An account with this email already exists.')
      } else {
        setFormError(signUpError.message)
      }
      return
    }

    if (!data.user) {
      setLoading(false)
      setFormError('Something went wrong. Please try again.')
      return
    }

    // 2. Insert public users row via server route (service role bypasses RLS)
    const registerRes = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: data.user.id,
        access_token: data.session?.access_token,
        role,
        full_name: fullName,
        email,
      }),
    })

    if (!registerRes.ok) {
      setLoading(false)
      setFormError('Account created but profile setup failed. Please try logging in.')
      return
    }

    // 3. Redirect — if there's a pending booking redirect, go there (draft will auto-submit)
    const params = new URLSearchParams({ firstName, lastName })
    if (redirectTo && role === 'client') {
      // Client signed up to send a booking — skip onboarding, go straight back
      router.push(redirectTo)
    } else if (role === 'photographer') {
      router.push(`/onboarding/photographer?${params.toString()}`)
    } else {
      router.push(`/onboarding?${params.toString()}`)
    }
  }

  const errs = validate()
  const fe = (field: string) => touched[field] ? errs[field] : undefined

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel ─────────────────────────────────────────────── */}
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

        <div className="relative z-10 space-y-3">
          <p className="text-ink-400 text-xs font-semibold uppercase tracking-[0.15em] mb-5">
            Why TrueNorth Frames?
          </p>
          {[
            { icon: User, title: 'For clients', desc: 'Find photographers with verified trust scores. Browse free, message free.' },
            { icon: Camera, title: 'For photographers', desc: 'Get discovered by Edmonton clients. Your Google & Instagram reviews, amplified.' },
          ].map((card) => {
            const Icon = card.icon
            return (
              <div key={card.title} className="bg-ink-800 border border-ink-700 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white font-semibold text-sm">{card.title}</p>
                </div>
                <p className="text-ink-400 text-xs leading-relaxed">{card.desc}</p>
              </div>
            )
          })}

          {/* Trust strip */}
          <div className="border-t border-ink-800 pt-4 space-y-2 mt-4">
            {['No spam — ever', 'No credit card required', 'No booking fees'].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-ink-500" />
                <p className="text-ink-400 text-xs">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-ink-600 text-xs">
          © {new Date().getFullYear()} TrueNorth Frames · Edmonton, AB
        </p>
      </div>

      {/* ── Right panel ────────────────────────────────────────────── */}
      <div className="flex-1 bg-white flex items-start justify-center p-6 sm:p-10 overflow-y-auto">
        <div className="w-full max-w-md py-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="TrueNorth Frames" width={34} height={34} className="rounded-md" />
              <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
            </Link>
          </div>

          <h1 className="font-serif text-3xl font-bold text-ink mb-1">Join TrueNorth Frames</h1>
          <p className="text-ink-300 text-sm mb-8">Free to join. No credit card required.</p>

          {formError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{formError}</p>
            </div>
          )}

          {/* Role selector */}
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-3">I am a…</p>
          <div className="grid grid-cols-2 gap-3 mb-2">
            {([
              { value: 'client', Icon: User, title: 'Client', sub: 'Looking for a photographer' },
              { value: 'photographer', Icon: Camera, title: 'Photographer', sub: 'List my work' },
            ] as const).map(({ value, Icon, title, sub }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setRole(value); touch('role') }}
                className={`border-2 rounded-2xl p-4 text-left transition-all duration-200 ${
                  role === value ? 'border-ink bg-ink-50' : 'border-ink-100 hover:border-ink-200'
                }`}
              >
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${role === value ? 'bg-ink' : 'bg-ink-50'}`}>
                  <Icon className={`w-4 h-4 transition-colors ${role === value ? 'text-white' : 'text-ink-300'}`} />
                </div>
                <p className="font-semibold text-ink text-sm mb-0.5">{title}</p>
                <p className="text-ink-300 text-xs leading-tight">{sub}</p>
              </button>
            ))}
          </div>
          {fe('role') && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3 h-3 flex-shrink-0" />
              {fe('role')}
            </p>
          )}

          {/* Role perks */}
          {role && (
            <div className="bg-ink-50 border border-ink-100 rounded-xl px-4 py-3 mb-6">
              <ul className="space-y-1.5">
                {(role === 'client' ? CLIENT_PERKS : PHOTOGRAPHER_PERKS).map((perk) => (
                  <li key={perk} className="flex items-center gap-2 text-xs text-ink-500">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ink flex-shrink-0" />
                    {perk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            className="w-full border border-ink-100 rounded-xl px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium text-ink hover:bg-ink-50 transition-colors mb-5"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-5">
            <div className="flex-1 h-px bg-ink-100" />
            <span className="text-ink-200 text-xs">or sign up with email</span>
            <div className="flex-1 h-px bg-ink-100" />
          </div>

          <form className="space-y-4" noValidate onSubmit={handleSubmit}>
            {/* Name row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="first-name">First name</label>
                <input
                  id="first-name"
                  type="text"
                  placeholder="Alex"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  onBlur={() => touch('firstName')}
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${fe('firstName') ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'}`}
                />
                {fe('firstName') && <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" />{fe('firstName')}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="last-name">Last name</label>
                <input
                  id="last-name"
                  type="text"
                  placeholder="Johnson"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onBlur={() => touch('lastName')}
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${fe('lastName') ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'}`}
                />
                {fe('lastName') && <p className="mt-1 flex items-center gap-1 text-xs text-red-600"><AlertCircle className="w-3 h-3" />{fe('lastName')}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => touch('email')}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${fe('email') ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'}`}
              />
              {fe('email') && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3 h-3 flex-shrink-0" />{fe('email')}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="password">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch('password')}
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${fe('password') ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-ink-100 focus:border-ink focus:ring-ink/10'}`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${i <= strength.score ? strength.color : 'bg-ink-100'}`} />
                    ))}
                  </div>
                </div>
              )}

              {fe('password') && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3 h-3 flex-shrink-0" />{fe('password')}</p>}
            </div>

            {/* Terms */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => { setAgreed(e.target.checked); touch('agreed') }}
                  className="mt-0.5 w-4 h-4 rounded border-ink-200 accent-ink flex-shrink-0"
                />
                <span className="text-xs text-ink-300 leading-relaxed">
                  I agree to the{' '}
                  <Link href="/terms" className="text-ink underline hover:text-ink-600 transition-colors">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-ink underline hover:text-ink-600 transition-colors">Privacy Policy</Link>
                  . No spam — ever.
                </span>
              </label>
              {fe('agreed') && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600"><AlertCircle className="w-3 h-3 flex-shrink-0" />{fe('agreed')}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink hover:bg-ink-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? (
                <>
                  <Spinner />
                  Creating account…
                </>
              ) : (
                <>
                  Create account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-ink-300 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-ink font-semibold hover:text-ink-600 transition-colors underline underline-offset-2">
              Sign in
            </Link>
          </p>
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

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}
