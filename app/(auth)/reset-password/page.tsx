'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { ArrowRight, Eye, EyeOff, AlertCircle, CheckCircle2, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function getStrength(pw: string): { score: number; label: string; color: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label: '', color: 'bg-ink-100' },
    { label: 'Weak', color: 'bg-red-400' },
    { label: 'Fair', color: 'bg-amber-400' },
    { label: 'Good', color: 'bg-yellow-400' },
    { label: 'Strong', color: 'bg-emerald-500' },
  ]
  return { score, ...map[score] }
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [touched, setTouched] = useState<{ password?: boolean; confirm?: boolean }>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [invalidLink, setInvalidLink] = useState(false)

  // Establish the recovery session from whatever link format Supabase used.
  // Depending on the project's flow type the reset link lands here with either
  // a PKCE `code`, a `token_hash` (+ type=recovery), or session tokens in the
  // URL hash (implicit flow, surfaced via the PASSWORD_RECOVERY event). We
  // handle all three so the reset form works regardless of configuration.
  useEffect(() => {
    let resolved = false
    const markReady = () => { resolved = true; setSessionReady(true) }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        markReady()
      }
    })

    async function establishSession() {
      const url = new URL(window.location.href)
      const code      = url.searchParams.get('code')
      const tokenHash = url.searchParams.get('token_hash')
      const type      = url.searchParams.get('type')
      try {
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)
          if (!error && data.session) markReady()
        } else if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type as any) || 'recovery',
          })
          if (!error && data.session) markReady()
        } else {
          // Implicit hash flow is handled by the listener above, but the
          // session may already be present (e.g. on a remount).
          const { data } = await supabase.auth.getSession()
          if (data.session) markReady()
        }
      } catch {
        // fall through to the timeout → invalid-link state
      }
    }
    establishSession()

    // Fallback: if no session is established within 3s, link is invalid/expired
    const timer = setTimeout(() => {
      if (!resolved) setInvalidLink(true)
    }, 3000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const strength = getStrength(password)

  function validate() {
    const e: { password?: string; confirm?: string } = {}
    if (!password) e.password = 'Password is required'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters'
    else if (strength.score < 2) e.password = 'Please choose a stronger password'
    if (!confirm) e.confirm = 'Please confirm your password'
    else if (confirm !== password) e.confirm = 'Passwords don\'t match'
    return e
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setTouched({ password: true, confirm: true })
    const e = validate()
    if (Object.keys(e).length > 0) return
    setLoading(true)
    setFormError(null)

    const { error: updateError } = await supabase.auth.updateUser({ password })

    setLoading(false)

    if (updateError) {
      setFormError(updateError.message)
      return
    }

    await supabase.auth.signOut()
    setDone(true)
  }

  const errs = validate()
  const passErr = touched.password ? errs.password : undefined
  const confirmErr = touched.confirm ? errs.confirm : undefined

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 sm:p-10">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-10">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="TrueNorth Frames" width={36} height={36} className="rounded-md" />
            <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
          </Link>
        </div>

        {invalidLink && !sessionReady ? (
          /* ── Invalid / expired link ──────────────────────────────── */
          <div className="text-center">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink mb-3">Link expired</h1>
            <p className="text-ink-400 text-sm leading-relaxed mb-8">
              This password reset link has expired or already been used. Reset links are valid for 1 hour.
            </p>
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Request a new link
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : !sessionReady ? (
          /* ── Waiting for session from URL token ──────────────────── */
          <div className="text-center">
            <div className="w-16 h-16 bg-ink-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 animate-spin text-ink-300" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
            <p className="text-ink-400 text-sm">Verifying reset link…</p>
          </div>
        ) : done ? (
          /* ── Success ─────────────────────────────────────────────── */
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink mb-3">Password updated</h1>
            <p className="text-ink-400 text-sm leading-relaxed mb-8">
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Sign in now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* ── Form ────────────────────────────────────────────────── */
          <>
            <div className="mb-8">
              <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mb-5">
                <Lock className="w-5 h-5 text-ink-400" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-ink mb-2">Set a new password</h1>
              <p className="text-ink-300 text-sm leading-relaxed">
                Choose something strong — at least 8 characters with a mix of letters and numbers.
              </p>
            </div>

            {formError && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 leading-snug">{formError}</p>
              </div>
            )}

            <form noValidate onSubmit={handleSubmit} className="space-y-5">
              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="password">
                  New password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, password: true }))}
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
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength meter — only shows once typing starts */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                            i <= strength.score ? strength.color : 'bg-ink-100'
                          }`}
                        />
                      ))}
                    </div>
                    {strength.label && (
                      <p className={`text-xs font-medium ${
                        strength.score <= 1 ? 'text-red-500' :
                        strength.score === 2 ? 'text-amber-500' :
                        strength.score === 3 ? 'text-yellow-600' : 'text-emerald-600'
                      }`}>
                        {strength.label} password
                      </p>
                    )}
                  </div>
                )}

                {passErr && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {passErr}
                  </p>
                )}

                {/* Password hints */}
                {!passErr && (
                  <ul className="mt-2 space-y-1">
                    {[
                      { label: '8+ characters', met: password.length >= 8 },
                      { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
                      { label: 'Number', met: /[0-9]/.test(password) },
                    ].map((hint) => (
                      <li key={hint.label} className={`flex items-center gap-1.5 text-xs transition-colors ${hint.met ? 'text-emerald-600' : 'text-ink-300'}`}>
                        <CheckCircle2 className={`w-3 h-3 flex-shrink-0 ${hint.met ? 'text-emerald-500' : 'text-ink-200'}`} />
                        {hint.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="confirm">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    id="confirm"
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                    className={`w-full border rounded-xl px-4 py-3 pr-11 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                      confirmErr
                        ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                        : confirm && confirm === password
                          ? 'border-emerald-300 focus:border-emerald-400 focus:ring-emerald-100'
                          : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-300 hover:text-ink transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmErr && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {confirmErr}
                  </p>
                )}
                {!confirmErr && confirm && confirm === password && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
                    <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                    Passwords match
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink hover:bg-ink-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Spinner />
                    Updating password…
                  </>
                ) : (
                  <>
                    Reset password
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}
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
