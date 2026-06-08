'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowRight, Star, Eye, EyeOff, AlertCircle, CheckCircle2, User, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'

async function signInWithGoogle() {
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: { access_type: 'offline', prompt: 'select_account' },
    },
  })
}

type Role = 'client' | 'photographer'

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo   = searchParams.get('redirect') ?? null
  const wasDeleted       = searchParams.get('deleted') === '1'
  const wasVerified      = searchParams.get('verified') === '1'
  const verifyFailed     = searchParams.get('error') === 'verification_failed'
  const wasRejected      = searchParams.get('error') === 'rejected'
  const setupIncomplete  = searchParams.get('error') === 'setup_incomplete'
  const [role, setRole] = useState<Role | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [errors, setErrors] = useState<{ role?: string; email?: string; password?: string; form?: string }>({})
  const [touched, setTouched] = useState<{ role?: boolean; email?: boolean; password?: boolean }>({})

  function validate() {
    const e: typeof errors = {}
    if (!role) e.role = 'Please select your account type'
    if (!email.trim()) e.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address'
    if (!password) e.password = 'Password is required'
    else if (password.length < 6) e.password = 'Password must be at least 6 characters'
    return e
  }

  function handleBlur(field: 'email' | 'password') {
    setTouched((t) => ({ ...t, [field]: true }))
    const e = validate()
    setErrors((prev) => ({ ...prev, [field]: e[field] }))
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setTouched({ role: true, email: true, password: true })
    const e = validate()
    if (Object.keys(e).length > 0) {
      setErrors(e)
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }
    setErrors({})
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setLoading(false)
      if (error.message.toLowerCase().includes('invalid')) {
        setErrors({ form: 'Incorrect email or password. Please try again.' })
      } else if (error.message.toLowerCase().includes('locked')) {
        setErrors({ form: 'Your account is temporarily locked. Please try again later.' })
      } else {
        setErrors({ form: error.message })
      }
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    // Fetch role, account_status, and photographer profile_status in one pass
    const { data: userData } = await supabase
      .from('users')
      .select('role, account_status')
      .eq('id', data.user.id)
      .single() as { data: { role: string; account_status: string } | null; error: unknown }

    // Suspended / banned / deactivated — sign out immediately
    if (userData?.account_status === 'suspended' || userData?.account_status === 'banned' || userData?.account_status === 'deactivated') {
      await supabase.auth.signOut()
      setLoading(false)
      const msg = userData.account_status === 'deactivated'
        ? 'This account has been deleted. If you believe this is a mistake, contact support@truenorthframes.ca.'
        : 'Your account has been suspended. Please contact support at support@truenorthframes.ca to resolve this.'
      setErrors({ form: msg })
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    const dbRole = userData?.role ?? null

    // No public.users row — email confirmed but registration API failed.
    // Route through finishing page which will poll until row appears.
    if (!dbRole) {
      router.push('/auth/finishing?dest=%2Fdashboard%2Fclient')
      return
    }

    // Rejected photographers cannot log in
    if (dbRole === 'photographer') {
      const { data: profileData } = await (supabase as any)
        .from('photographer_profiles')
        .select('profile_status')
        .eq('user_id', data.user.id)
        .maybeSingle()

      if (profileData?.profile_status === 'rejected') {
        await supabase.auth.signOut()
        setLoading(false)
        setErrors({ form: 'Your profile was not approved. Please check your email for details, then contact support@truenorthframes.ca.' })
        setShake(true)
        setTimeout(() => setShake(false), 500)
        return
      }
    }

    // Route to correct dashboard using DB role (not form-selected role)
    if (redirectTo) {
      router.push(redirectTo)
    } else if (dbRole === 'photographer') {
      router.push('/dashboard/photographer')
    } else if (dbRole === 'admin') {
      router.push('/admin')
    } else {
      router.push('/dashboard/client')
    }
  }

  const roleErr  = touched.role ? validate().role : undefined
  const emailErr = touched.email ? validate().email : undefined
  const passErr  = touched.password ? validate().password : undefined

  return (
    <div className="min-h-screen bg-white flex">
      {/* ── Left panel ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between p-10 bg-ink relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none opacity-100" />

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Image src="/logo.png" alt="TrueNorth Frames" width={38} height={38} className="rounded-md" />
            <span className="text-white font-semibold text-sm group-hover:text-ink-200 transition-colors">
              TrueNorth Frames
            </span>
          </Link>
        </div>

        <div className="relative z-10 space-y-5">
          <p className="text-ink-400 text-xs font-semibold uppercase tracking-[0.15em]">
            Edmonton's photographer marketplace
          </p>
          <blockquote className="font-serif text-2xl font-bold text-white leading-snug">
            "Find your perfect photographer — completely free."
          </blockquote>
          <p className="text-ink-400 text-sm leading-relaxed">
            50+ Edmonton photographers. Real reviews from Google, Yelp &amp; Instagram. No booking fees.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="flex -space-x-2">
              {['bg-slate-600', 'bg-zinc-600', 'bg-neutral-500', 'bg-stone-600'].map((c, i) => (
                <div key={i} className={`w-8 h-8 rounded-full ${c} border-2 border-ink-800 flex items-center justify-center text-white text-[9px] font-bold`}>
                  {['SC', 'MW', 'PP', 'JL'][i]}
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-0.5 mb-0.5">
                {[1,2,3,4,5].map((i) => (
                  <Star key={i} className="w-3 h-3 text-white fill-white" />
                ))}
              </div>
              <p className="text-ink-400 text-xs">Trusted by Edmonton clients</p>
            </div>
          </div>

          {/* Trust strip */}
          <div className="border-t border-ink-800 pt-4 space-y-2">
            {[
              'No spam — ever',
              'Manage all your conversations in one place',
              'Get notified when a photographer replies',
            ].map((item) => (
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
      <div className="flex-1 bg-white flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="TrueNorth Frames" width={34} height={34} className="rounded-md" />
              <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
            </Link>
          </div>

          <h1 className="font-serif text-3xl font-bold text-ink mb-1">Welcome back</h1>
          <p className="text-ink-300 text-sm mb-8">Sign in to your TrueNorth Frames account.</p>

          {/* Google OAuth */}
          <button
            type="button"
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 border border-ink-100 rounded-xl px-4 py-3 text-sm font-medium text-ink hover:bg-ink-50 transition-colors mb-6"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-ink-100" />
            <span className="text-xs text-ink-300">or sign in with email</span>
            <div className="flex-1 h-px bg-ink-100" />
          </div>

          {/* Email verified success */}
          {wasVerified && (
            <div className="flex items-start gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 mb-5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700 leading-snug">Email verified! Sign in below to get started.</p>
            </div>
          )}

          {/* Rejected photographer — session killed by middleware */}
          {wasRejected && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">
                Your photographer profile was not approved. Check your email for details on what needs to be fixed. Questions? Contact <strong>support@truenorthframes.ca</strong>.
              </p>
            </div>
          )}

          {/* Verification failed */}
          {verifyFailed && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">That verification link has expired or is invalid. Please sign up again or contact support.</p>
            </div>
          )}

          {/* Account setup incomplete — session cleared, user should sign in fresh */}
          {setupIncomplete && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700 leading-snug">
                Your account was created but setup didn't complete. Sign in below to finish setting up your account.
              </p>
            </div>
          )}

          {/* Account deleted confirmation */}
          {wasDeleted && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 leading-snug">Your account has been deleted. We're sorry to see you go — your data will be removed within 30 days.</p>
            </div>
          )}

          {/* Form-level error */}
          {errors.form && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{errors.form}</p>
            </div>
          )}



          {/* Role selector */}
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-ink-300 mb-3">I am a…</p>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'client' as Role,       Icon: User,   title: 'Client',       sub: 'Looking for a photographer' },
                { value: 'photographer' as Role, Icon: Camera, title: 'Photographer', sub: 'Managing my bookings'       },
              ]).map(({ value, Icon, title, sub }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => { setRole(value); setTouched(t => ({ ...t, role: true })); setErrors(e => ({ ...e, role: undefined })) }}
                  className={`border-2 rounded-2xl p-4 text-left transition-all duration-200 ${
                    role === value ? 'border-ink bg-ink-50' : 'border-ink-100 hover:border-ink-200'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${role === value ? 'bg-ink' : 'bg-ink-50'}`}>
                    <Icon className={`w-4 h-4 transition-colors ${role === value ? 'text-white' : 'text-ink-300'}`} />
                  </div>
                  <p className="font-semibold text-ink text-sm mb-0.5">{title}</p>
                  <p className="text-ink-300 text-xs leading-tight">{sub}</p>
                </button>
              ))}
            </div>
            {roleErr && (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />{roleErr}
              </p>
            )}
          </div>

          <form
            className={`space-y-4 ${shake ? 'animate-shake' : ''}`}
            noValidate
            onSubmit={handleSubmit}
          >
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="email">
                Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (touched.email) setErrors((prev) => ({ ...prev, email: undefined })) }}
                onBlur={() => handleBlur('email')}
                className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                  emailErr
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                    : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                }`}
              />
              {emailErr && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {emailErr}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-ink" htmlFor="password">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs text-ink-400 hover:text-ink transition-colors font-medium">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (touched.password) setErrors((prev) => ({ ...prev, password: undefined })) }}
                  onBlur={() => handleBlur('password')}
                  className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                    passErr
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                  }`}
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passErr && (
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  {passErr}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ink hover:bg-ink-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors mt-2"
            >
              {loading ? (
                <>
                  <Spinner />
                  Signing in…
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-ink-300 mt-5 leading-relaxed">
            No spam. No newsletters. No booking fees.
          </p>

          <p className="text-center text-sm text-ink-300 mt-3">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-ink font-semibold hover:text-ink-600 transition-colors underline underline-offset-2">
              Sign up free
            </Link>
          </p>

        </div>
      </div>

      <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .animate-shake { animation: shake 0.45s ease-in-out; }
      `}</style>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
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
