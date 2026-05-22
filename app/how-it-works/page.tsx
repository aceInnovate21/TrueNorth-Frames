import Link from 'next/link'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import {
  Search, Shield, MessageSquare, ArrowRight, Star, CheckCircle2,
  Globe, Instagram, MapPin, Clock, Bell, Camera, User,
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
    desc: 'Browse by specialty (wedding, portrait, corporate, newborn), neighbourhood, price range, and minimum rating. Every filter updates results instantly — no page reloads.',
    detail: [
      'Filter by 6 specialties',
      'Search by neighbourhood',
      'Set price range with a slider',
      'Toggle "Available today" for same-day bookings',
      'Sort by rating, reviews, or price',
    ],
  },
  {
    step: '02',
    icon: Shield,
    title: 'Read their trust score',
    desc: 'Every profile shows a composite trust score built from Google Reviews, Yelp, Instagram, and Facebook. You see their real reputation — aggregated automatically, not self-reported.',
    detail: [
      'Scores pulled from 4 sources weekly',
      'Breakdown by source on every profile',
      'Verified — photographers can\'t edit scores',
      'Portfolio gallery and bio included',
      'Response time shown on each profile',
    ],
  },
  {
    step: '03',
    icon: MessageSquare,
    title: 'Message directly',
    desc: 'Click "Send a message" on any profile. Create a free account (takes 60 seconds) to send your message and track the reply. No commission, no booking platform, no middleman.',
    detail: [
      'Free account — no credit card',
      'Notifications when photographer replies',
      'All conversations in your dashboard',
      'No platform fee on any booking',
      'Photographer contacts you directly',
    ],
  },
]

const PHOTOGRAPHER_STEPS = [
  {
    step: '01',
    icon: User,
    title: 'Create your profile',
    desc: 'Sign up as a photographer, fill in your bio, specialties, rate, and location. Takes about 20 minutes start to finish.',
  },
  {
    step: '02',
    icon: Globe,
    title: 'Connect your reviews',
    desc: 'Add your Google, Yelp, Instagram and Facebook profile links. We pull your existing reputation automatically and build your trust score.',
  },
  {
    step: '03',
    icon: Camera,
    title: 'Upload your portfolio',
    desc: 'Add up to 20 portfolio photos. Your best work, curated. Clients can browse your gallery before they reach out.',
  },
  {
    step: '04',
    icon: Bell,
    title: 'Receive enquiries',
    desc: 'Clients find you, read your trust score, and message you directly. You get notified instantly. No bidding, no algorithm to game.',
  },
]

const TRUST_SOURCES = [
  { name: 'Google Reviews', desc: 'Star rating + review count from your Google Business profile.', icon: Globe },
  { name: 'Yelp', desc: 'Star rating and reviews from Yelp — especially strong for local service businesses.', icon: Star },
  { name: 'Instagram', desc: 'Follower count as a proxy for audience trust and reach.', icon: Instagram },
  { name: 'Facebook', desc: 'Recommendations and page rating from your Facebook business page.', icon: Globe },
]

const FAQS = [
  {
    q: 'Do I need an account to browse photographers?',
    a: 'No. Anyone can browse, search, and read photographer profiles without signing up. You only need a free account when you want to send a message.',
  },
  {
    q: 'Is there a fee for clients?',
    a: 'Never. TrueNorth Frames is completely free for clients — no booking fees, no service charges, no hidden costs. We never take a cut of your session.',
  },
  {
    q: 'How is the trust score calculated?',
    a: 'We pull each photographer\'s rating from Google Reviews, Yelp, Instagram, and Facebook, then compute a weighted composite score. Scores update weekly. Photographers cannot edit or influence their own score.',
  },
  {
    q: 'What happens after I send a message?',
    a: 'The photographer receives your message directly and replies through the platform. You\'ll get an email notification when they respond. All messages are stored in your dashboard.',
  },
  {
    q: 'Can I book directly through TrueNorth Frames?',
    a: 'Right now, we facilitate the introduction. You negotiate timing and payment directly with your photographer — we stay out of it. That keeps the relationship honest and fee-free.',
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
                <div
                  key={s.step}
                  className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center bg-ink-50 rounded-3xl p-8"
                >
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

                  {/* Visual placeholder */}
                  <div className={`bg-white rounded-2xl h-52 flex items-center justify-center ${i % 2 === 1 ? 'lg:order-1' : ''}`}
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
            <Link
              href="/photographers"
              className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-7 py-3.5 rounded-xl transition-colors"
            >
              Start browsing photographers
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Trust score explainer ─────────────────────────────────────── */}
      <section className="bg-ink-50 py-24 border-y border-ink-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">How trust scores work</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-4">
              Real reputation. Four sources. One score.
            </h2>
            <p className="text-ink-400 text-base max-w-lg mx-auto">
              We pull each photographer's public ratings weekly, weight them by source, and publish a single composite score. Photographers can't edit it. We don't sell placement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {TRUST_SOURCES.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.name}
                  className="bg-white rounded-2xl p-5"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}
                >
                  <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center mb-3">
                    <Icon className="w-4 h-4 text-ink-500" />
                  </div>
                  <p className="font-semibold text-ink text-sm mb-1">{s.name}</p>
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
                Photographers link their public profiles. We pull ratings directly from each platform. There's no way for a photographer to boost, hide, or manipulate their score on TrueNorth Frames.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Photographer section ──────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">For photographers</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">How to get discovered</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PHOTOGRAPHER_STEPS.map((s) => {
              const Icon = s.icon
              return (
                <div
                  key={s.step}
                  className="bg-ink-50 rounded-2xl p-5 relative"
                >
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

          <div className="mt-8 text-center">
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

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-ink-50 py-24 border-t border-ink-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">FAQ</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Common questions</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-5"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}
              >
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
