import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Search, Camera } from 'lucide-react'

export default function NotFound() {
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
          {/* Illustration */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            <div className="w-24 h-24 bg-ink-50 rounded-3xl flex items-center justify-center border border-ink-100">
              <Camera className="w-10 h-10 text-ink-200" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white border border-ink-100 rounded-xl flex items-center justify-center shadow-sm">
              <span className="text-base font-black text-ink-300">?</span>
            </div>
          </div>

          {/* Copy */}
          <p className="text-xs font-bold uppercase tracking-widest text-ink-300 mb-3">404 — Page not found</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-4 leading-tight">
            This shot didn't develop
          </h1>
          <p className="text-ink-400 text-base leading-relaxed mb-8 max-w-sm mx-auto">
            The page you're looking for doesn't exist or has been moved. Let's get you back on track.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </Link>
            <Link
              href="/photographers"
              className="inline-flex items-center justify-center gap-2 border border-ink-200 hover:border-ink text-ink-500 hover:text-ink font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              <Search className="w-4 h-4" />
              Browse photographers
            </Link>
          </div>
        </div>
      </main>

      <footer className="border-t border-ink-100 px-6 py-4 text-center">
        <p className="text-xs text-ink-300">
          Need help?{' '}
          <Link href="/contact" className="underline underline-offset-2 hover:text-ink transition-colors">
            Contact support
          </Link>
        </p>
      </footer>
    </div>
  )
}
