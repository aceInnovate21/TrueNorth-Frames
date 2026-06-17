import Link from 'next/link'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import {
  Search, Shield, MessageSquare, ArrowRight, CheckCircle2,
  Globe, MapPin, Bell, Camera, User,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How it works — TrueNorth Frames',
  description: 'Find an Edmonton photographer in three steps. No booking fees, no account required to browse.',
}

const CLIENT_STEPS = [
  {
    step: '01',
    icon: Search,
    title: 'Search & filter',
    desc: 'Browse by specialty (wedding, portrait, corporate, newborn), neighbourhood, and minimum rating. Every filter updates results instantly.',
    detail: [
      'Filter by 6 specialties',
      'Search by neighbourhood',
      'Toggle "Available today" for same-day bookings',
      'Sort by rating, most reviewed, or newest',
      'Compare two photographers side by side',
    ],
  },
  {
    step: '02',
    icon: Shield,
    title: 'Read their Trust Score',
    desc: 'Every profile shows a Trust Score built from their Google Business Profile — real star rating, review count, account age, and verification status. You see their real reputation, not what they say about themselves.',
    detail: [
      'Score pulled from Google Business Profile',
      'Breakdown visible on every profile',
      'Verified — photographers can\'t edit scores',
      'Portfolio gallery and bio included',
      'Badges show experience level at a glance',
    ],
  },
  {
    step: '03',
    icon: MessageSquare,
    title: 'Message directly',
    desc: 'Click "Book a session" on any profile. Create a free account (takes 60 seconds) to send your request and track the reply. No commission, no middleman.',
    detail: [
      'Free account — no credit card',
      'Email notification when photographer replies',
      'All conversations in your dashboard',
      'No platform fee on any booking',
      'Automated 24-hour shoot reminder',
    ],
  },
]

const PHOTOGRAPHER_STEPS = [
  {
    step: '01',
    icon: User,
    title: 'Sign up free',
    desc: 'Email or Google sign-in. Takes 30 seconds.',
  },
  {
    step: '02',
    icon: Camera,
    title: 'Build your profile',
    desc: 'Bio, specialties, rates and portfolio albums. Takes about 20 minutes start to finish.',
  },
  {
    step: '03',
    icon: Globe,
    title: 'Connect Google',
    desc: 'Link your Google Business Profile — Trust Score goes live instantly. Score updates automatically from then on.',
  },
  {
    step: '04',
    icon: Bell,
    title: 'Go live',
    desc: 'Profile approved, published to Edmonton clients searching right now.',
  },
]

const FAQS = [
  {
    q: 'Do I need an account to browse photographers?',
    a: 'No. Anyone can browse, search, and read photographer profiles without signing up. You only need a free account when you want to send a booking request.',
  },
  {
    q: 'Is there a fee for clients?',
    a: 'Never. TrueNorth Frames is completely free for clients — no booking fees, no service charges, no hidden costs.',
  },
  {
    q: 'How is the Trust Score calculated?',
    a: 'We pull each photographer\'s rating from their Google Business Profile — star rating, review count, account age, and verification status. This is combined with profile completeness and platform activity into a single composite score. Scores update weekly. Photographers cannot edit or influence their own score.',
  },
  {
    q: 'What happens after I send a booking request?',
    a: 'The photographer receives your request and replies through the platform. You\'ll get an email notification when they respond. All messages are stored in your dashboard.',
  },
  {
    q: 'Can I book directly through TrueNorth Frames?',
    a: 'Yes — you submit a booking request with your preferred date, time, and a description of what you need. The photographer accepts or declines. Payment is negotiated directly between you and the photographer — we stay out of it and never charge commission.',
  },
  {
    q: 'Are all photographers based in Edmonton?',
    a: 'Yes. We\'re focused exclusively on Edmonton and the surrounding area (including St. Albert and Sherwood Park). Local-only is a deliberate choice — we\'d rather be the best local product than a mediocre national one.',
  },
]

export default function HowItWorksPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-ink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Simple by design</p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-ink mb-5 leading-tight">
            Finding an Edmonton photographer<br className="hidden sm:block" /> in three steps.
          </h1>
          <p className="text-ink-400 text-lg leading-relaxed max-w-xl mx-auto">
            No booking fees. No account needed to browse. No algorithm deciding who you see first.
          </p>
        </div>
      </section>

      {/* ── Client steps ──────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">For clients</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">How to find your photographer</h2>
          </div>

          <div className="space-y-6">
            {CLIENT_STEPS.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.step} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-ink-50 rounded-3xl p-8">
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-ink-200 text-sm font-bold tracking-widest">{s.step}</span>
                    </div>
                    <h3 className="font-serif text-2xl font-bold text-ink mb-3">{s.title}</h3>
                    <p className="text-ink-400 text-base leading-relaxed mb-5">{s.desc}</p>
                    <ul className="space-y-2">
                      {s.detail.map((d) => (
                        <li key={d} className="flex items-center gap-2 text-sm text-ink-500">
                          <CheckCircle2 className="w-3.5 h-3.5 text-ink flex-shrink-0" />
                          {d}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={`bg-white rounded-2xl h-52 flex items-center justify-center ${i % 2 === 1 ? 'lg:order-1' : ''}`}
                    style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}
                  >
                    <div className="flex flex-col items-center gap-3 text-ink-200">
                      <Icon className="w-12 h-12" />
                      <p className="text-sm font-medium">Step {parseInt(s.step)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-10 text-center">
            <Link href="/photographers" className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors">
              Start browsing photographers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust score explainer — GBP only ─────────────────────────── */}
      <section className="bg-ink-50 py-24 border-y border-ink-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">How Trust Scores work</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-4">
              Real reputation. Verified by Google.
            </h2>
            <p className="text-ink-400 text-base max-w-lg mx-auto">
              We pull each photographer's Google Business Profile data weekly, combine it with profile completeness and platform activity, and publish a single composite score. Photographers can't edit it. We don't sell placement.
            </p>
          </div>

          {/* 4 signal cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Globe,   title: 'Google Business Profile', desc: 'Star rating, review count, account age & verified status — pulled directly from GBP.' },
              { icon: User,    title: 'Profile Completeness',    desc: 'Bio, specialties, portfolio, rates, and availability all filled in.' },
              { icon: Search,  title: 'Platform Activity',       desc: 'Booking history, native client reviews, and response rate on TrueNorth Frames.' },
              { icon: Shield,  title: 'Admin Verification',      desc: 'Identity verified by the TrueNorth Frames team.' },
            ].map((s) => {
              const Icon = s.icon
              return (
                <div key={s.title} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                  <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-ink-500" />
                  </div>
                  <p className="font-semibold text-ink text-sm mb-1">{s.title}</p>
                  <p className="text-ink-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>

          <div className="bg-ink rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <Shield className="w-8 h-8 text-white flex-shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-white text-sm mb-1">Scores are verified and tamper-proof</p>
              <p className="text-ink-400 text-xs leading-relaxed">
                Photographers link their Google Business Profile. We pull ratings directly from Google. There's no way for a photographer to boost, hide, or manipulate their score on TrueNorth Frames.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photographer how-to — pitch deck slide 09 ────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">For photographers</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
              Up and running<br />in 20 minutes.
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PHOTOGRAPHER_STEPS.map((s) => {
              const Icon = s.icon
              return (
                <div key={s.step} className="bg-ink-50 rounded-2xl p-5 relative">
                  <span className="absolute top-4 right-4 text-ink-100 text-3xl font-bold font-serif leading-none">{s.step}</span>
                  <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-semibold text-ink text-sm mb-2">{s.title}</p>
                  <p className="text-ink-400 text-xs leading-relaxed">{s.desc}</p>
                </div>
              )
            })}
          </div>

          <p className="text-center text-ink-400 text-sm italic mt-8">Your next client is already searching.</p>

          <div className="mt-6 text-center">
            <Link
              href="/for-photographers"
              className="inline-flex items-center gap-2 border border-ink-200 hover:border-ink text-ink-500 hover:text-ink font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              See full photographer details
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Edmonton-only commitment ──────────────────────────────────── */}
      <section className="bg-ink-50 py-16 border-y border-ink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
            {[
              { icon: MapPin,  title: 'Edmonton-First, Always', desc: 'This isn\'t a side tab on a national platform. Edmonton photographers are the only photographers here.' },
              { icon: Shield,  title: 'No Race to the Bottom',  desc: 'Trust Score and portfolio-first search mean clients choose on quality — not just the cheapest rate.' },
              { icon: Globe,   title: 'GBP Verified',           desc: 'Every Trust Score is powered by real Google Business Profile data. No fake scores, no paid badges.' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.title} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.05)' }}>
                  <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-semibold text-ink text-sm mb-2">{item.title}</p>
                  <p className="text-ink-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">FAQ</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Common questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-ink-50 rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <p className="font-semibold text-ink text-sm mb-2">{faq.q}</p>
                <p className="text-ink-400 text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────── */}
      <section className="bg-ink py-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">Ready to get started?</h2>
          <p className="text-ink-300 text-base mb-8">No account needed to browse. Free to join when you're ready.</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/photographers" className="inline-flex items-center gap-2 bg-white hover:bg-ink-100 text-ink font-semibold px-6 py-3 rounded-xl transition-colors text-sm">
              Browse photographers <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/signup" className="inline-flex items-center gap-2 border border-ink-700 hover:border-ink-500 text-ink-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm">
              Create free account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
