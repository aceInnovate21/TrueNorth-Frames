'use client'

// Intermediate landing after email confirmation.
// Polls the client-side Supabase session until the public.users row is visible,
// then navigates to destination. Using client-side supabase (not a server fetch)
// because verifyOtp sets the session in the browser — server routes won't see
// the cookie until the browser makes a full navigation with it attached.

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { supabase } from '@/lib/supabase'

export default function FinishingPage() {
  return (
    <Suspense>
      <FinishingHandler />
    </Suspense>
  )
}

function FinishingHandler() {
  const searchParams = useSearchParams()
  const dest = searchParams.get('dest') ?? '/dashboard/client'
  const [attempt, setAttempt] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        // Use client-side supabase — this reads the session cookie the browser
        // already has after verifyOtp, no server round-trip needed
        const { data: { session } } = await supabase.auth.getSession()
        if (cancelled) return

        if (session?.user?.id) {
          // Session confirmed. Now check public.users via client supabase (anon key,
          // but RLS allows users to read their own row)
          const { data: userData } = await (supabase as any)
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .maybeSingle()

          if (cancelled) return

          if (userData?.role) {
            // Row is visible — safe to navigate
            router.replace(dest)
            return
          }
        }
      } catch {
        // keep retrying
      }

      if (cancelled) return

      if (attempt >= 12) {
        // ~6 seconds elapsed — navigate anyway
        setTimedOut(true)
        setTimeout(() => { if (!cancelled) router.replace(dest) }, 400)
        return
      }

      setTimeout(() => { if (!cancelled) setAttempt(a => a + 1) }, 500)
    }

    poll()
    return () => { cancelled = true }
  }, [attempt, dest, router])

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-14 h-14 bg-ink rounded-2xl flex items-center justify-center mx-auto mb-5 animate-pulse">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-ink font-semibold text-sm">
          {timedOut ? 'Taking you to your account…' : 'Setting up your account…'}
        </p>
        <p className="text-ink-300 text-xs mt-1">Just a moment</p>
      </div>
    </div>
  )
}
