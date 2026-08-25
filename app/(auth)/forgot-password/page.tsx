'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, ArrowLeft, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState(false)

  function validate() {
    if (!email.trim()) return 'Email is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Enter a valid email address'
    return ''
  }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setTouched(true)
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setSent(true)
  }

  const fieldError = touched ? validate() : ''

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

        {sent ? (
          /* ── Success state ─────────────────────────────────────── */
          <div className="text-center">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h1 className="font-serif text-2xl font-bold text-ink mb-3">Check your inbox</h1>
            <p className="text-ink-400 text-sm leading-relaxed mb-2">
              We sent a password reset link to
            </p>
            <p className="font-semibold text-ink text-sm mb-6">{email}</p>
            <p className="text-ink-300 text-xs leading-relaxed mb-8 max-w-xs mx-auto">
              The link expires in 1 hour. If you don't see it, check your spam folder or try again.
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => { setSent(false); setTouched(false); setEmail('') }}
                className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm font-medium text-ink-400 hover:text-ink hover:bg-ink-50 transition-colors"
              >
                Try a different email
              </button>
              <Link
                href="/login"
                className="w-full border border-ink rounded-xl px-4 py-3 text-sm font-semibold text-ink hover:bg-ink-50 transition-colors flex items-center justify-center gap-2"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        ) : (
          /* ── Form state ────────────────────────────────────────── */
          <>
            <div className="mb-8">
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 text-xs text-ink-400 hover:text-ink transition-colors mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
              <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mb-5">
                <Mail className="w-5 h-5 text-ink-400" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-ink mb-2">Forgot your password?</h1>
              <p className="text-ink-300 text-sm leading-relaxed">
                No problem. Enter your email and we'll send you a reset link — takes 30 seconds.
              </p>
            </div>

            <form noValidate onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (touched) setError('') }}
                  onBlur={() => setTouched(true)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                    fieldError
                      ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                      : 'border-ink-100 focus:border-ink focus:ring-ink/10'
                  }`}
                />
                {fieldError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    {fieldError}
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
                    Sending link…
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-ink-300 mt-6">
              Remember it?{' '}
              <Link href="/login" className="text-ink font-semibold hover:text-ink-600 transition-colors underline underline-offset-2">
                Sign in
              </Link>
            </p>
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
