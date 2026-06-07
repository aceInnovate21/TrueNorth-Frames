'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[TrueNorth] Dashboard error:', error)
  }, [error])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-red-100">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink mb-2">Dashboard error</h2>
        <p className="text-ink-400 text-sm leading-relaxed mb-6">
          Something went wrong loading your dashboard. Your data is safe — try refreshing.
        </p>
        {error.digest && (
          <p className="text-[10px] text-ink-300 font-mono mb-6">Ref: {error.digest}</p>
        )}
        <div className="flex flex-col gap-2">
          <button
            onClick={reset}
            className="w-full inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-5 py-3 rounded-xl transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Try again
          </button>
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 border border-ink-200 text-ink-500 hover:text-ink font-medium px-5 py-3 rounded-xl transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
