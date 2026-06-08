'use client'

// Intermediate landing after email confirmation.
// Polls /api/auth/me until the public.users row is committed to the DB,
// then navigates to the destination. Prevents redirect loops caused by the
// middleware reading the DB before the register API write is visible.

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

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
        const res = await fetch('/api/auth/me')
        if (cancelled) return

        if (res.ok) {
          const data = await res.json()
          if (data?.user?.role) {
            // Row is visible — safe to navigate without hitting the limbo check
            router.replace(dest)
            return
          }
        }
      } catch {
        // network error — keep retrying
      }

      if (cancelled) return

      if (attempt >= 10) {
        // ~5 seconds elapsed — navigate anyway, dashboard retries on 401
        setTimedOut(true)
        setTimeout(() => { if (!cancelled) router.replace(dest) }, 600)
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
