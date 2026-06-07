'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { RefreshCw, ArrowLeft, AlertTriangle } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log to console in dev; swap for a real error tracker (Sentry etc.) at scale
    console.error('[TrueNorth] Unhandled error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Minimal nav */}
      <header className="border-b border-ink-100 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2.5">
          <Image src="/logo.png" alt="TrueNorth Frames" width={32} height={32} className="rounded-md" />
          <span className="font-semibold text-ink text-sm">TrueNorth Frames</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-md w-full text-center">
          {/* Icon */}
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-red-100">
            <AlertTriangle className="w-9 h-9 text-red-400" />
          </div>

          {/* Copy */}
          <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3">Something went wrong</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">
            Unexpected error
          </h1>
          <p className="text-ink-400 text-base leading-relaxed mb-2 max-w-sm mx-auto">
            We hit an unexpected problem. It's been logged and we'll look into it.
          </p>
          {error.digest && (
            <p className="text-[11px] text-ink-300 font-mono mb-8">Error ID: {error.digest}</p>
          )}
          {!error.digest && <div className="mb-8" />}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 border border-ink-200 hover:border-ink text-ink-500 hover:text-ink font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-ink-100 px-6 py-4 text-center">
        <p className="text-xs text-ink-300">
          If this keeps happening,{' '}
          <Link href="/contact" className="underline underline-offset-2 hover:text-ink transition-colors">
            let us know
          </Link>
        </p>
      </footer>
    </div>
  )
}
