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
  const code   = params.get('code')
  const type   = params.get('type') ?? ''
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      router.replace('/login?error=missing_code')
      return
    }

    async function handleCode() {
      // First check if there's already an active session (user clicked Google again
      // after already being authenticated — code would fail if we tried to exchange it)
      const { data: { session: existingSession } } = await supabase.auth.getSession()

      let session = existingSession

      // Only exchange code if no active session
      if (!session) {
        const { data, error: err } = await supabase.auth.exchangeCodeForSession(code!)
        if (err || !data.session) {
          setError('This verification link has expired or already been used. Please sign in again.')
          return
        }
        session = data.session
      }

      const userId = session.user.id

      // Check if this user already has a row in public.users
      const { data: userData } = await (supabase as any)
        .from('users')
        .select('role')
        .eq('id', userId)
        .maybeSingle() as { data: { role: string } | null }

      // ── Existing user → route to their dashboard ────────────────────────────
      if (userData?.role) {
        const role = userData.role
        if (role === 'photographer') {
          router.replace('/dashboard/photographer')
        } else if (role === 'admin') {
          router.replace('/admin')
        } else {
          router.replace('/dashboard/client')
        }
        return
      }

      // ── New user — no public.users row yet ─────────────────────────────────
      const authUser   = session.user
      const metadata   = authUser.user_metadata ?? {}
      const fullName   = metadata.full_name ?? metadata.name ?? ''
      const email      = authUser.email ?? ''
      const metaRole   = metadata.role as string | undefined

      // Email/password signup: role was stored in metadata during signUp —
      // create the public.users row now and route to onboarding.
      if (metaRole === 'photographer' || metaRole === 'client') {
        const registerRes = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: authUser.id,
            access_token: session.access_token,
            role: metaRole,
            full_name: fullName,
            email,
          }),
        })

        if (!registerRes.ok) {
          setError('Account verified but profile setup failed. Please try signing in.')
          return
        }

        if (metaRole === 'photographer') {
          const firstName = fullName.split(' ')[0] ?? ''
          const lastName  = fullName.split(' ').slice(1).join(' ')
          const qs = new URLSearchParams({ firstName, lastName })
          router.replace(`/onboarding/photographer?${qs.toString()}`)
        } else {
          router.replace('/dashboard/client')
        }
        return
      }

      // Google OAuth: no role in metadata — show role-select
      const qs = new URLSearchParams({ email, full_name: fullName })
      router.replace(`/signup/role-select?${qs.toString()}`)
    }

    handleCode()
  }, [code, router])

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="font-serif text-2xl font-bold text-ink mb-2">Something went wrong</h1>
          <p className="text-ink-400 text-sm leading-relaxed mb-6">{error}</p>
          <a href="/login" className="inline-flex items-center justify-center bg-ink text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-ink-800 transition-colors">
            Back to sign in
          </a>
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
        <p className="text-ink font-semibold text-sm">Signing you in…</p>
        <p className="text-ink-300 text-xs mt-1">Taking you to your dashboard</p>
      </div>
    </div>
  )
}
