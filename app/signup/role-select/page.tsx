'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Camera, User, ArrowRight, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function RoleSelectPage() {
  return (
    <Suspense>
      <RoleSelectForm />
    </Suspense>
  )
}

function RoleSelectForm() {
  const router     = useRouter()
  const params     = useSearchParams()
  const email      = params.get('email') ?? ''
  const fullName   = params.get('full_name') ?? ''

  const [role, setRole]       = useState<'client' | 'photographer' | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  async function handleContinue() {
    if (!role) { setError('Please select your account type to continue.'); return }
    setError(null)
    setLoading(true)

    try {
      // Get the current session — user is already authenticated via Google
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expired. Please sign in again.')
        setLoading(false)
        return
      }

      // Create public.users row via the existing register route
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id:   session.user.id,
          role,
          full_name: fullName || session.user.user_metadata?.full_name || 'User',
          email:     email    || session.user.email,
        }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to create account')
      }

      // Route to onboarding
      router.replace(role === 'photographer' ? '/onboarding/photographer' : '/onboarding')

    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="TrueNorth Frames" width={34} height={34} className="rounded-md" />
            <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
          </Link>
        </div>

        <h1 className="font-serif text-3xl font-bold text-ink mb-1 text-center">
          {fullName ? `Welcome, ${fullName.split(' ')[0]}!` : 'One last step'}
        </h1>
        <p className="text-ink-300 text-sm mb-8 text-center">
          How will you be using TrueNorth Frames?
        </p>

        {error && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Role cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {([
            {
              value: 'client' as const,
              Icon: User,
              title: 'Client',
              sub: 'I want to find and book a photographer',
              perks: ['Browse Edmonton photographers', 'Message directly', 'No booking fees'],
            },
            {
              value: 'photographer' as const,
              Icon: Camera,
              title: 'Photographer',
              sub: 'I want to list my services and get clients',
              perks: ['Free profile + portfolio', 'Direct enquiries', 'No commission'],
            },
          ]).map(({ value, Icon, title, sub, perks }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setRole(value); setError(null) }}
              className={`border-2 rounded-2xl p-4 text-left transition-all duration-200 ${
                role === value ? 'border-ink bg-ink-50' : 'border-ink-100 hover:border-ink-200'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${role === value ? 'bg-ink' : 'bg-ink-50'}`}>
                <Icon className={`w-4 h-4 transition-colors ${role === value ? 'text-white' : 'text-ink-300'}`} />
              </div>
              <p className="font-semibold text-ink text-sm mb-1">{title}</p>
              <p className="text-ink-300 text-xs leading-snug mb-3">{sub}</p>
              <ul className="space-y-1">
                {perks.map(p => (
                  <li key={p} className="flex items-center gap-1.5 text-[11px] text-ink-400">
                    <span className="w-1 h-1 rounded-full bg-ink-300 flex-shrink-0" />
                    {p}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <button
          onClick={handleContinue}
          disabled={!role || loading}
          className="w-full bg-ink text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-ink-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Setting up your account…
            </>
          ) : (
            <>
              Continue
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <p className="text-center text-xs text-ink-300 mt-5">
          Signed in as <span className="text-ink">{email}</span> ·{' '}
          <button
            onClick={async () => { await supabase.auth.signOut(); router.replace('/login') }}
            className="underline hover:text-ink transition-colors"
          >
            Not you?
          </button>
        </p>
      </div>
    </div>
  )
}
