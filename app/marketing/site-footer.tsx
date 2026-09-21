import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

/** Footer mirroring production, wired to /marketing routes. */
export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-ink-800">
          <div className="md:col-span-1">
            <Link href="/marketing" className="flex items-center gap-2.5 mb-4 group">
              <Image src="/logo.png" alt="TrueNorth Frames" width={36} height={36} className="rounded-md" />
              <span className="font-semibold text-base">TrueNorth Frames</span>
            </Link>
            <p className="text-ink-400 text-sm leading-relaxed max-w-xs mb-4">
              Edmonton&apos;s local photographer marketplace. Discover talented photographers with verified trust scores.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-ink-500">
              <MapPin className="w-3 h-3" />
              <span>Serving Edmonton, Alberta (YEG)</span>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500 mb-4">For clients</p>
            <ul className="space-y-2">
              {[
                { label: 'Browse photographers', href: '/marketing/browse' },
                { label: 'Wedding', href: '/marketing/browse' },
                { label: 'Corporate', href: '/marketing/browse' },
                { label: 'Newborn', href: '/marketing/browse' },
              ].map((link, i) => (
                <li key={i}><Link href={link.href} className="text-sm text-ink-400 hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500 mb-4">For photographers</p>
            <ul className="space-y-2">
              {[
                { label: 'List your work', href: '/marketing/dashboard' },
                { label: 'Dashboard', href: '/marketing/dashboard' },
                { label: 'Messages', href: '/marketing/messages' },
              ].map((link, i) => (
                <li key={i}><Link href={link.href} className="text-sm text-ink-400 hover:text-white transition-colors">{link.label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-ink-500 mb-4">Demo</p>
            <ul className="space-y-2">
              <li><Link href="/marketing" className="text-sm text-ink-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/marketing/book" className="text-sm text-ink-400 hover:text-white transition-colors">Booking flow</Link></li>
              <li><Link href="/marketing/dashboard" className="text-sm text-ink-400 hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-ink-600 text-xs">© {new Date().getFullYear()} TrueNorth Frames. Edmonton, Alberta.</p>
          <p className="text-ink-600 text-xs">Interactive demo · sample data only</p>
        </div>
      </div>
    </footer>
  )
}
