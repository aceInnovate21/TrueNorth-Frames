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
  const router   = useRouter()
  const params   = useSearchParams()
  const code     = params.get('code')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!code) {
      router.replace('/login?error=missing_code')
      return
    }

    supabase.auth.exchangeCodeForSession(code).then(async ({ data, error: err }) => {
      if (err || !data.session) {
        setError('This verification link has expired or already been used. Please sign up again.')
        return
      }

      // Fetch role to route to the right dashboard
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.session.user.id)
        .single() as { data: { role: string } | null; error: unknown }

      const role = userData?.role
      if (role === 'photographer') {
        router.replace('/onboarding/photographer')
      } else if (role === 'admin') {
        router.replace('/admin')
      } else {
        router.replace('/onboarding')
      }
    })
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
          <h1 className="font-serif text-2xl font-bold text-ink mb-2">Link expired</h1>
          <p className="text-ink-400 text-sm leading-relaxed mb-6">{error}</p>
          <a href="/signup" className="inline-flex items-center justify-center bg-ink text-white font-semibold text-sm px-6 py-3 rounded-xl hover:bg-ink-800 transition-colors">
            Sign up again
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
        <p className="text-ink font-semibold text-sm">Verifying your email…</p>
        <p className="text-ink-300 text-xs mt-1">Taking you to your dashboard</p>
      </div>
    </div>
  )
}
