'use client'

import Link from 'next/link'
import { Search, MessageSquare, CalendarCheck, LayoutDashboard, ArrowRight, Shield } from 'lucide-react'

const FLOWS = [
  { href: '/marketing/browse', icon: Search, title: 'Browse', blurb: 'Search, filter by specialty, and compare photographers by Trust Score.' },
  { href: '/marketing/photographer/jordan-mercer', icon: Shield, title: 'Profile & Trust Score', blurb: 'A photographer profile — portfolio, verified proof, and the Trust Score breakdown.' },
  { href: '/marketing/messages?to=jordan-mercer', icon: MessageSquare, title: 'Message', blurb: 'A live chat thread — type a message and watch the reply come back.' },
  { href: '/marketing/book?to=jordan-mercer', icon: CalendarCheck, title: 'Book', blurb: 'The booking flow — pick a package, choose a date, confirm the request.' },
  { href: '/marketing/dashboard', icon: LayoutDashboard, title: 'Photographer dashboard', blurb: 'Upload photos, sync trust signals, and accept incoming bookings.' },
]

export default function DemoHome() {
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="inline-block text-xs font-mono uppercase tracking-[0.3em] text-ink-400 mb-4">Interactive demo</span>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight leading-[1.05]">
          A click-through tour of TrueNorth&nbsp;Frames
        </h1>
        <p className="text-ink-500 mt-4 text-lg">
          Every screen below is fully clickable with sample data — built to screen-record for the launch video. Start anywhere, or follow it top to bottom.
        </p>
        <Link href="/marketing/browse" className="inline-flex items-center gap-2 bg-ink text-white font-semibold px-6 py-3 rounded-xl mt-7 hover:bg-ink-800 transition-colors">
          Start browsing <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {FLOWS.map((f, i) => (
          <Link
            key={f.href}
            href={f.href}
            className="group bg-white ring-1 ring-ink-100 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="flex items-center gap-3 mb-2">
              <span className="w-9 h-9 rounded-xl bg-ink text-white flex items-center justify-center">
                <f.icon className="w-4 h-4" />
              </span>
              <span className="text-[11px] font-mono text-ink-300">Step {i + 1}</span>
              <ArrowRight className="w-4 h-4 text-ink-300 ml-auto group-hover:translate-x-0.5 group-hover:text-ink transition-all" />
            </div>
            <h2 className="font-semibold">{f.title}</h2>
            <p className="text-sm text-ink-400 mt-1">{f.blurb}</p>
          </Link>
        ))}
      </div>

      <p className="text-center text-xs text-ink-300 mt-12">
        Sample data only · nothing here is connected to real accounts or bookings
      </p>
    </main>
  )
}
