import Link from 'next/link'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import {
  ArrowRight, CheckCircle2, Shield, Camera, MessageSquare,
  Star, Globe, Instagram, Bell, BarChart2, X, ChevronDown,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For photographers — TrueNorth Frames',
  description: 'Get discovered by Edmonton clients. Free profile, trust score from your existing reviews, direct messaging. No commissions.',
}

const FEATURES = [
  { icon: Shield, title: 'Trust score from day one', desc: 'Link your Google, Yelp, Instagram and Facebook. We aggregate your existing reputation into a score that shows clients what you\'ve already earned.' },
  { icon: Camera, title: 'Portfolio gallery', desc: 'Upload up to 20 photos. Your best work, presented cleanly. No templates, no distracting UI — just your images.' },
  { icon: MessageSquare, title: 'Direct client messaging', desc: 'Clients contact you through the platform. You reply directly. No middleman reading your conversations or taking a cut of your rate.' },
  { icon: Bell, title: 'Instant notifications', desc: 'Get notified the moment a client sends you a message — via email or in-app. Faster response time means more bookings.' },
  { icon: Globe, title: 'Show up in local search', desc: 'Clients search by specialty, neighbourhood, and rating. A complete profile puts you in front of people actively looking to book.' },
  { icon: BarChart2, title: 'Profile analytics (coming soon)', desc: 'See how many clients viewed your profile, clicked your portfolio, or sent you a message. Understand what\'s working.' },
]

const INCLUDED = [
  'Public profile page',
  'Portfolio gallery (up to 20 photos)',
  'Trust score aggregated from 4 sources',
  'Direct messaging from clients',
  'Availability status badge',
  'Specialties + rate display',
  'Response time indicator',
  'Searchable by specialty & neighbourhood',
]

const NOT_INCLUDED = [
  'Commission on bookings',
  'Monthly subscription fee',
  'Paid placement or "featured" spots',
  'Platform lock-in — your reviews stay yours',
]

const TESTIMONIALS = [
  {
    name: 'Sarah Chen',
    initials: 'SC',
    specialty: 'Wedding · Portrait',
    rating: 4.9,
    quote: "I was skeptical at first — I already had Google reviews and Instagram. But having everything in one place, with a trust score clients can actually understand, made a real difference. I got 3 enquiries in my first week.",
  },
  {
    name: 'Marcus Wright',
    initials: 'MW',
    specialty: 'Corporate · Events',
    rating: 4.7,
    quote: "Corporate clients are different — they want to see credibility fast. The trust score does that. They can see my Google rating, see I've done 100+ sessions, and reach out without having to dig around for 20 minutes.",
  },
  {
    name: 'Priya Patel',
    initials: 'PP',
    specialty: 'Newborn · Family',
    rating: 4.8,
    quote: "I love that there are no commissions. My session rate is my session rate. The platform doesn't take anything — it just helps people find me.",
  },
]

const FAQS = [
  {
    q: 'Is it really free?',
    a: 'Yes. Creating and maintaining a photographer profile on TrueNorth Frames costs nothing. We don\'t charge commissions, monthly fees, or take a cut of your bookings. Our business model is built around long-term sustainability — not extracting value from photographers.',
  },
  {
    q: 'What if I don\'t have many reviews yet?',
    a: 'That\'s fine. Even two or three genuine Google reviews give us enough to build a starting trust score. Your score improves naturally as you get more reviews on any platform we track. A complete profile and good portfolio matter just as much.',
  },
  {
    q: 'Can I control what appears on my profile?',
    a: 'You write your own bio, set your rate, upload your portfolio, and choose your specialties. The only thing you can\'t edit is your trust score — that\'s pulled from third-party platforms and published as-is. That\'s the whole point.',
  },
  {
    q: 'What happens when a client messages me?',
    a: 'You get an email notification and an in-app notification. You reply directly through TrueNorth Frames. All conversation history is stored in your dashboard. No commission is charged on any booking that results.',
  },
  {
    q: 'Can I hide or remove my profile?',
    a: 'Yes, you can deactivate your profile at any time. When deactivated, you won\'t appear in search results and clients can\'t message you — but your profile data is preserved so you can reactivate later.',
  },
  {
    q: 'Do you cover areas outside Edmonton?',
    a: 'Currently we\'re focused on Edmonton, St. Albert, and Sherwood Park. If you\'re based nearby and regularly shoot in the Edmonton area, you\'re welcome to apply.',
  },
]

export default function ForPhotographersPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-ink relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-ink-400 text-xs font-semibold uppercase tracking-[0.15em] mb-5">For Edmonton photographers</p>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Your reputation,<br />finally visible.
              </h1>
              <p className="text-ink-300 text-base leading-relaxed mb-8 max-w-md">
                You've spent years building a reputation on Google, Instagram, and Yelp.
                TrueNorth Frames puts it all in one place — so Edmonton clients can find
                you and trust you before they even reach out.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/signup?role=photographer"
                  className="inline-flex items-center gap-2 bg-white hover:bg-ink-100 text-ink font-semibold px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  Create your free profile
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/photographers"
                  className="inline-flex items-center gap-2 border border-ink-700 hover:border-ink-500 text-ink-400 hover:text-white font-medium px-6 py-3.5 rounded-xl transition-colors text-sm"
                >
                  See live profiles
                </Link>
              </div>
            </div>

            {/* Stats card */}
            <div
              className="bg-ink-800 border border-ink-700 rounded-2xl p-6 space-y-4"
              style={{ transform: 'perspective(800px) rotateY(-4deg) rotateX(2deg)' }}
            >
              <p className="text-ink-400 text-[10px] font-bold uppercase tracking-widest mb-2">What you get — free</p>
              {INCLUDED.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-ink-200 text-sm">{item}</span>
                </div>
              ))}
              <div className="pt-2 mt-2 border-t border-ink-700">
                <p className="text-ink-500 text-[10px] font-bold uppercase tracking-widest mb-2">What we never charge</p>
                {NOT_INCLUDED.map((item) => (
                  <div key={item} className="flex items-center gap-3 mb-2">
                    <X className="w-4 h-4 text-ink-500 flex-shrink-0" />
                    <span className="text-ink-500 text-sm line-through">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ──────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Everything included</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Built for working photographers</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => {
              const Icon = f.icon
              return (
                <div
                  key={f.title}
                  className="bg-ink-50 rounded-2xl p-5"
                >
                  <div className="w-9 h-9 bg-ink rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <p className="font-semibold text-ink text-sm mb-2">{f.title}</p>
                  <p className="text-ink-400 text-xs leading-relaxed">{f.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── How trust score works ─────────────────────────────────────── */}
      <section className="bg-ink-50 py-24 border-y border-ink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Trust score</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-4">Your reviews, amplified</h2>
            <p className="text-ink-400 text-base max-w-lg mx-auto">
              You've already built a reputation. We pull it from all four sources and show it in one place — so clients don't have to go looking.
            </p>
          </div>

          <div className="bg-white rounded-3xl p-7 mb-8" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-ink-50">
              <div>
                <p className="font-semibold text-ink">Sarah Chen</p>
                <p className="text-ink-300 text-xs">Wedding · Portrait</p>
              </div>
              <div className="flex items-center gap-2 bg-ink rounded-full px-3 py-1.5">
                <Shield className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold text-sm">4.9</span>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { source: 'Google Reviews', score: '4.9', count: '31 reviews', bar: 98 },
                { source: 'Yelp', score: '5.0', count: '8 reviews', bar: 100 },
                { source: 'Instagram', score: '2.4k', count: 'followers', bar: 72 },
                { source: 'Facebook', score: '4.8', count: '12 recommendations', bar: 96 },
              ].map((s) => (
                <div key={s.source}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-ink-500 text-xs">{s.source}</span>
                    <span className="text-ink font-semibold text-xs">{s.score} <span className="text-ink-300 font-normal">{s.count}</span></span>
                  </div>
                  <div className="h-1.5 bg-ink-50 rounded-full overflow-hidden">
                    <div className="h-full bg-ink rounded-full" style={{ width: `${s.bar}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { value: 'Weekly', label: 'Score refresh cadence' },
              { value: '4 sources', label: 'Platforms aggregated' },
              { value: '0%', label: 'You can influence your score' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.05)' }}>
                <p className="font-bold text-ink text-xl mb-1">{s.value}</p>
                <p className="text-ink-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">From photographers</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">What they're saying</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="bg-ink-50 rounded-2xl p-5"
              >
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="w-3.5 h-3.5 text-ink fill-ink" />
                  ))}
                </div>
                <p className="text-ink-500 text-sm leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm">{t.name}</p>
                    <p className="text-ink-300 text-[10px]">{t.specialty} · {t.rating} trust score</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="bg-ink-50 py-24 border-t border-ink-100">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Questions</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Photographer FAQ</h2>
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

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-ink py-24 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to get discovered?
          </h2>
          <p className="text-ink-300 text-base leading-relaxed mb-3 max-w-lg mx-auto">
            Create your profile in under 20 minutes. Connect your existing reviews.
            Start receiving client enquiries — with zero commission.
          </p>
          <p className="text-ink-500 text-sm mb-10">Free to join · No credit card · Cancel any time</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/signup?role=photographer"
              className="inline-flex items-center gap-2 bg-white hover:bg-ink-100 text-ink font-semibold px-8 py-3.5 rounded-xl transition-colors"
            >
              Create your free profile
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 border border-ink-700 hover:border-ink-500 text-ink-400 hover:text-white font-medium px-8 py-3.5 rounded-xl transition-colors text-sm"
            >
              How it works
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
