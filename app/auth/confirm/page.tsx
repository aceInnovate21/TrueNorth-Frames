'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConfirmPage() {
  return (
    <Suspense>
      <ConfirmHandler />
    </Suspense>
  )
}

function ConfirmHandler() {
  const router = useRouter()
  const params = useSearchParams()
  const code      = params.get('code')
  const tokenHash = params.get('token_hash')
  const type      = params.get('type') ?? ''
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleConfirm() {
      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] = null

      // ── 1. Resolve session ────────────────────────────────────────────────────
      if (tokenHash) {
        // Email confirmation link (type=signup) or password reset (type=recovery)
        // Supabase sends token_hash in the link when "confirm email" is enabled.
        const { data, error: err } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: (type as any) || 'signup',
        })
        if (err || !data.session) {
          setError('This verification link has expired or has already been used. Please sign in or request a new link.')
          return
        }
        session = data.session
      } else if (code) {
        // Google OAuth PKCE code exchange
        // First check if there's already an active session (e.g. user opened link twice)
        const { data: { session: existing } } = await supabase.auth.getSession()
        if (existing) {
          session = existing
        } else {
          const { data, error: err } = await supabase.auth.exchangeCodeForSession(code)
          if (err || !data.session) {
            setError('This sign-in link has expired or already been used. Please try signing in again.')
            return
          }
          session = data.session
        }
      } else {
        router.replace('/login?error=missing_token')
        return
      }

      // ── 2. Check if public.users row already exists ───────────────────────────
      const authUser = session.user
      const { data: existingUser } = await (supabase as any)
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle() as { data: { role: string } | null }

      if (existingUser?.role) {
        // Returning user — go straight to their dashboard
        routeToDashboard(existingUser.role, router)
        return
      }

      // ── 3. New user — create public.users row ─────────────────────────────────
      const metadata  = authUser.user_metadata ?? {}
      const fullName  = metadata.full_name ?? metadata.name ?? ''
      const email     = authUser.email ?? ''
      const metaRole  = metadata.role as string | undefined

      if (metaRole === 'photographer' || metaRole === 'client') {
        // Email/password signup — role + name were saved in metadata during signUp()
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id:      authUser.id,
            access_token: session.access_token,
            role:         metaRole,
            full_name:    fullName,
            email,
          }),
        })

        if (!res.ok) {
          setError('Your email was verified but account setup failed. Please try signing in.')
          return
        }

        // Route through /auth/finishing which polls until the public.users row is
        // visible in the DB before navigating — prevents middleware redirect loops.
        const [firstName, ...rest] = fullName.trim().split(' ')
        const lastName = rest.join(' ')

        if (metaRole === 'photographer') {
          const onboardingUrl = `/onboarding/photographer?firstName=${encodeURIComponent(firstName ?? '')}&lastName=${encodeURIComponent(lastName)}`
          router.replace(`/auth/finishing?dest=${encodeURIComponent(onboardingUrl)}`)
        } else {
          // Clients go through a brief onboarding (confirm name + pick area) before dashboard
          const onboardingUrl = `/onboarding?firstName=${encodeURIComponent(firstName ?? '')}&lastName=${encodeURIComponent(lastName)}`
          router.replace(`/auth/finishing?dest=${encodeURIComponent(onboardingUrl)}`)
        }
        return
      }

      // Google OAuth user — no role in metadata, show role-select
      const qs = new URLSearchParams({ email, full_name: fullName })
      router.replace(`/signup/role-select?${qs.toString()}`)
    }

    handleConfirm()
  }, [code, tokenHash, type, router])

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink mb-2">Link expired</h1>
          <p className="text-ink-400 text-sm leading-relaxed mb-6">{error}</p>
          <div className="flex flex-col gap-3">
            <a
              href="/signup"
              className="inline-flex items-center justify-center bg-ink text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-ink-800 transition-colors"
            >
              Create a new account
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center border border-ink-100 text-ink font-semibold text-sm px-6 py-3 rounded-xl hover:bg-ink-50 transition-colors"
            >
              Sign in instead
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-14 h-14 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-5 animate-pulse">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-ink font-semibold text-sm">Verifying your account…</p>
        <p className="text-ink-300 text-xs mt-1">Just a moment</p>
      </div>
    </div>
  )
}

function routeToDashboard(role: string, router: ReturnType<typeof useRouter>) {
  if (role === 'photographer') router.replace('/dashboard/photographer')
  else if (role === 'admin')   router.replace('/admin')
  else                         router.replace('/dashboard/client')
}
