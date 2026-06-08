'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'

export default function ConfirmPage() {
  return <Suspense><ConfirmHandler /></Suspense>
}

function ConfirmHandler() {
  const router = useRouter()
  const params = useSearchParams()
  const tokenHash = params.get('token_hash')
  const code      = params.get('code')
  const type      = params.get('type') ?? 'signup'
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function run() {
      let session: any = null

      // Email confirmation link → token_hash
      if (tokenHash) {
        const { data, error: err } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type as any,
        })
        if (err || !data.session) {
          setError('This link has expired or already been used. Please sign in or create a new account.')
          return
        }
        session = data.session
      } else if (code) {
        // Google OAuth → code
        const { data: existing } = await supabase.auth.getSession()
        if (existing.session) {
          session = existing.session
        } else {
          const { data, error: err } = await supabase.auth.exchangeCodeForSession(code)
          if (err || !data.session) {
            setError('This link has expired or already been used. Please sign in or create a new account.')
            return
          }
          session = data.session
        }
      } else {
        router.replace('/login')
        return
      }

      const authUser = session.user
      const metadata = authUser.user_metadata ?? {}

      // Check if public.users row already exists
      const { data: existingUser } = await (supabase as any)
        .from('users')
        .select('role')
        .eq('id', authUser.id)
        .maybeSingle()

      if (existingUser?.role) {
        // Existing user — go to their dashboard
        const role = existingUser.role
        router.replace(
          role === 'photographer' ? '/dashboard/photographer'
          : role === 'admin' ? '/admin'
          : '/dashboard/client'
        )
        return
      }

      // New user — create public.users row
      const metaRole = metadata.role as string | undefined
      const fullName = metadata.full_name ?? metadata.name ?? ''
      const email    = authUser.email ?? ''

      if (metaRole === 'photographer' || metaRole === 'client') {
        // Email/password signup — role stored in metadata
        await fetch('/api/auth/register', {
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

        // Go to onboarding — middleware will handle it if row isn't visible yet
        const [firstName, ...rest] = fullName.trim().split(' ')
        const qs = new URLSearchParams()
        if (firstName) qs.set('firstName', firstName)
        if (rest.length) qs.set('lastName', rest.join(' '))

        router.replace(
          metaRole === 'photographer'
            ? `/onboarding/photographer?${qs}`
            : `/onboarding?${qs}`
        )
        return
      }

      // Google OAuth — no role in metadata, go to role-select
      const qs = new URLSearchParams({ email, full_name: fullName })
      router.replace(`/signup/role-select?${qs}`)
    }

    run()
  }, [tokenHash, code, type, router])

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
            <a href="/signup" className="inline-flex items-center justify-center bg-ink text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-ink-800 transition-colors">
              Create a new account
            </a>
            <a href="/login" className="inline-flex items-center justify-center border border-ink-100 text-ink font-semibold text-sm px-6 py-3 rounded-xl hover:bg-ink-50 transition-colors">
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
