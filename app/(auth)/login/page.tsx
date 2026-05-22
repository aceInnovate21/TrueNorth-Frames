'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowRight, Star, Eye, EyeOff, AlertCircle, User, Camera } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type Role = 'client' | 'photographer'

export default function LoginPage() {
  const router = useRouter()
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

    // Verify the role matches what they selected
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', data.user.id)
      .single() as { data: { role: string } | null; error: unknown }

    if (userData?.role && userData.role !== role) {
      await supabase.auth.signOut()
      setLoading(false)
      setErrors({ form: `This account is registered as a ${userData.role}. Please select the correct account type.` })
      setShake(true)
      setTimeout(() => setShake(false), 500)
      return
    }

    router.push(role === 'photographer' ? '/dashboard/photographer' : '/dashboard/client')
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

          {/* Form-level error */}
          {errors.form && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 leading-snug">{errors.form}</p>
            </div>
          )}

          {/* Google OAuth */}
          <button
            type="button"
            className="w-full border border-ink-100 rounded-xl px-4 py-3 flex items-center justify-center gap-3 text-sm font-medium text-ink hover:bg-ink-50 transition-colors mb-6"
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-ink-100" />
            <span className="text-ink-200 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-ink-100" />
          </div>

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
