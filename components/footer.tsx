import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-ink-800">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <Image src="/logo.png" alt="TrueNorth Frames" width={36} height={36} className="rounded-md" />
              <span className="font-semibold text-base group-hover:text-ink-200 transition-colors">
                TrueNorth Frames
              </span>
            </Link>
            <p className="text-ink-400 text-sm leading-relaxed max-w-xs mb-4">
              Edmonton's local photographer marketplace. Discover talented photographers with verified trust scores.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-ink-500">
              <MapPin className="w-3 h-3" />
              <span>Serving Edmonton, Alberta (YEG)</span>
            </div>
          </div>

          {/* For clients */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500 mb-4">For clients</p>
            <ul className="space-y-2">
              {[
                { label: 'Browse photographers', href: '/photographers' },
                { label: 'Wedding', href: '/photographers?specialty=wedding' },
                { label: 'Corporate', href: '/photographers?specialty=corporate' },
                { label: 'Portrait', href: '/photographers?specialty=portrait' },
                { label: 'Newborn', href: '/photographers?specialty=newborn' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For photographers */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500 mb-4">For photographers</p>
            <ul className="space-y-2">
              {[
                { label: 'List your work', href: '/signup?role=photographer' },
                { label: 'How it works', href: '/how-it-works' },
                { label: 'For photographers', href: '/for-photographers' },
                { label: 'About us', href: '/about' },
                { label: 'Sign in', href: '/login' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ink-400 hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-ink-600 text-xs">© {new Date().getFullYear()} TrueNorth Frames. Edmonton, Alberta.</p>
          <div className="flex items-center gap-6 text-xs text-ink-500">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
