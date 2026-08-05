import Link from 'next/link'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import {
  ArrowRight, CheckCircle2, Shield, Camera, MessageSquare,
  Star, Globe, Bell, BarChart2, Images, Package, Users, Calendar,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'For photographers',
  description: 'Get discovered by Edmonton clients. Free profile, Google-verified trust score, direct messaging. Zero commission.',
  alternates: { canonical: '/for-photographers' },
}

const FEATURES = [
  {
    icon: Shield,
    title: 'Trust Score from day one',
    desc: 'Connect your Google Business Profile in one click. Your real reputation — star rating, review count, and verification status — displayed front and centre. Clients see it before they even message you.',
  },
  {
    icon: Images,
    title: 'Portfolio-first discovery',
    desc: 'Upload albums organised by specialty. Masonry grid on desktop, swipeable reel on mobile. Clients filter by tag or specialty — your work is what they judge, not your pricing alone.',
  },
  {
    icon: MessageSquare,
    title: 'Direct client messaging',
    desc: 'Clients contact you through the platform. You reply directly. No middleman, no commission on anything that results. Full conversation history in your dashboard.',
  },
  {
    icon: Package,
    title: 'Service packages',
    desc: 'List exactly what each session includes with clear pricing. Clients know what they\'re getting before committing — no negotiation from zero every time.',
  },
  {
    icon: Calendar,
    title: 'Availability calendar',
    desc: 'Set weekly time slots. Clients book only when you\'re actually open. No surprise requests, no double-booking, no back-and-forth to find a date.',
  },
  {
    icon: Bell,
    title: 'Automated reminders',
    desc: 'Booking confirmations and 24-hour shoot reminders sent automatically to both you and your client. You don\'t chase anyone.',
  },
]

const INCLUDED = [
  'Free professional profile page',
  'Portfolio albums — organised by specialty',
  'Trust Score powered by Google Business Profile',
  'Direct messaging from clients',
  'Availability calendar & booking requests',
  'Service packages with clear pricing',
  'Automated email reminders',
  'Searchable by specialty & neighbourhood',
]

const FAQS = [
  {
    q: 'Is it really free?',
    a: 'Yes. Creating and maintaining a photographer profile on TrueNorth Frames costs nothing. We don\'t charge commissions, monthly fees, or take a cut of your bookings.',
  },
  {
    q: 'What if I don\'t have a Google Business Profile yet?',
    a: 'You can still create a profile and start getting discovered. Your Trust Score will be built from platform activity and profile completeness while you set up GBP. Once connected, your Google rating and reviews go live instantly.',
  },
  {
    q: 'Can I control what appears on my profile?',
    a: 'You write your own bio, set your rate, upload your portfolio, and choose your specialties. The Trust Score is pulled directly from Google Business Profile and platform data — photographers can\'t edit it. That\'s the whole point.',
  },
  {
    q: 'What happens when a client messages me?',
    a: 'You get an email notification and an in-app notification. You reply directly through TrueNorth Frames. All conversation history is stored in your dashboard. No commission on any booking that results.',
  },
  {
    q: 'Can I hide or deactivate my profile?',
    a: 'Yes. You can deactivate at any time. When deactivated you won\'t appear in search results and clients can\'t message you — but your profile data is preserved so you can reactivate later.',
  },
  {
    q: 'Do you cover areas outside Edmonton?',
    a: 'We\'re focused on Edmonton, St. Albert, and Sherwood Park. If you\'re based nearby and regularly shoot in the Edmonton area, you\'re welcome to join.',
  },
]

export default function ForPhotographersPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-ink relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-ink-400 text-xs font-semibold uppercase tracking-[0.15em] mb-5">For Edmonton photographers</p>
              <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white leading-tight mb-5">
                Your Work<br />Deserves More.
              </h1>
              <p className="text-ink-300 text-base leading-relaxed mb-8 max-w-md">
                Edmonton's dedicated photographer marketplace. Portfolio-first search, Google-verified trust scores, and a community that gets the local market — all in one place.
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

            {/* What you get card */}
            <div
              className="bg-ink-800 border border-ink-700 rounded-2xl p-6 space-y-3"
              style={{ transform: 'perspective(800px) rotateY(-4deg) rotateX(2deg)' }}
            >
              <p className="text-ink-400 text-[10px] font-bold uppercase tracking-widest mb-4">What you get — free</p>
              {INCLUDED.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-white flex-shrink-0" />
                  <span className="text-ink-200 text-sm">{item}</span>
                </div>
              ))}
              <div className="pt-4 mt-2 border-t border-ink-700">
                <p className="text-white font-semibold text-sm">Zero commission. Zero booking fees.</p>
                <p className="text-ink-400 text-xs mt-1">Your rate is your rate. Free. Always.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── The problem ───────────────────────────────────────────────── */}
      <section className="bg-white py-24 border-b border-ink-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-4">Sound familiar?</p>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink leading-tight mb-5">
                The platform problem.
              </h2>
              <p className="text-ink-400 text-base leading-relaxed">
                On faceless gig platforms, price wins. Your best work gets buried while cheaper competitors race to the bottom. TrueNorth Frames is built differently.
              </p>
            </div>
            <div className="space-y-4">
              {[
                'Your best work is buried in the algorithm',
                'Every new client finds you from scratch',
                'Competitors undercut your rates with no way to show real value',
                'Bookings scattered across DMs, WhatsApp, and emails',
                'No platform understands Edmonton\'s local photography market',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 pb-4 border-b border-ink-50 last:border-0 last:pb-0">
                  <span className="text-ink-200 text-xs font-bold tracking-widest flex-shrink-0 mt-0.5">0{i + 1}</span>
                  <p className="text-ink-500 text-sm leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Who it's for ──────────────────────────────────────────────── */}
      <section className="bg-ink-50 py-24 border-b border-ink-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Who it&apos;s for</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
              Starting out <span className="text-ink-300">or</span> well established.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="bg-ink rounded-2xl p-7">
              <p className="font-serif text-2xl font-bold text-white mb-6">Just Starting Out</p>
              <div className="space-y-3">
                {[
                  'Build a professional profile & portfolio from day one',
                  'Rising Talent badge surfaces you to browsing clients',
                  'Get your first reviews on a trusted, structured platform',
                  'Booking tools and messaging handle the admin for you',
                  'Connect Google Business Profile to show existing credibility',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-ink-500 text-xs font-bold flex-shrink-0 mt-0.5">—</span>
                    <p className="text-ink-300 text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white border border-ink-100 rounded-2xl p-7" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <p className="font-serif text-2xl font-bold text-ink mb-6">Already Established</p>
              <div className="space-y-3">
                {[
                  'Consolidate your Google reputation, displayed front and centre',
                  'Verified Pro / Trusted Pro badge shows clients you\'re the real deal',
                  'Manage packages, bookings, and client messages in one place',
                  'Network with Edmonton peers — cover requests & group chats',
                  'Zero commission — ever. You keep 100% of what you charge',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="text-ink-300 text-xs font-bold flex-shrink-0 mt-0.5">—</span>
                    <p className="text-ink-500 text-sm leading-relaxed">{item}</p>
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
                <div key={f.title} className="bg-ink-50 rounded-2xl p-5">
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

      {/* ── Trust score — GBP only ────────────────────────────────────── */}
      <section className="bg-ink-50 py-24 border-y border-ink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Trust Score</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-4">
              Your reputation,<br />finally in one place.
            </h2>
            <p className="text-ink-400 text-base max-w-lg mx-auto">
              Connect your Google Business Profile in one click. Score updates automatically — not a paid badge.
            </p>
          </div>

          {/* Score breakdown from pitch deck slide 05 */}
          <div className="bg-white rounded-3xl p-7 mb-8" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            <div className="flex items-center justify-between mb-6 pb-5 border-b border-ink-50">
              <div>
                <p className="font-semibold text-ink text-sm">/ Score breakdown</p>
                <p className="text-ink-300 text-xs mt-0.5">Built from real signals clients can verify</p>
              </div>
              <div className="flex items-center gap-2 bg-ink rounded-full px-3 py-1.5">
                <Shield className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold text-sm">Verified</span>
              </div>
            </div>
            <div className="space-y-5">
              {[
                { pct: '35%', label: 'Google Business Profile', desc: 'Star rating, review count & verification status', bar: 35 },
                { pct: '25%', label: 'Profile Completeness',    desc: 'Bio, specialties, portfolio and rates all filled in', bar: 25 },
                { pct: '25%', label: 'Platform Activity',       desc: 'Booking history, native reviews, response rate', bar: 25 },
                { pct: '15%', label: 'Admin Verification',      desc: 'Identity verified by TrueNorth Frames team', bar: 15 },
              ].map((s) => (
                <div key={s.label} className="flex items-start gap-5">
                  <span className="font-bold text-ink text-xl w-12 flex-shrink-0">{s.pct}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-ink text-sm">{s.label}</p>
                    </div>
                    <p className="text-ink-400 text-xs mb-2">{s.desc}</p>
                    <div className="h-1.5 bg-ink-50 rounded-full overflow-hidden">
                      <div className="h-full bg-ink rounded-full" style={{ width: `${s.bar * 2.5}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            {[
              { value: 'Weekly',  label: 'Score refresh cadence' },
              { value: 'GBP',     label: 'Verified trust source' },
              { value: '0%',      label: 'You can influence your score' },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-xl p-4" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.05)' }}>
                <p className="font-bold text-ink text-xl mb-1">{s.value}</p>
                <p className="text-ink-400 text-xs">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Community — pitch deck slide 08 ──────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Community</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">
              Built on community,<br />not just commerce.
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-ink-100 border border-ink-100 rounded-2xl overflow-hidden">
            {[
              { icon: Users,         title: 'Photographer Network',  desc: 'Connect with Edmonton peers. Follow, message and build your local professional circle.' },
              { icon: MessageSquare, title: 'Group Chats',           desc: 'Join community conversations — gear talk, second shooters, creative collaborations.' },
              { icon: Camera,        title: 'Cover Requests',        desc: 'Booked out? Post a cover request so a trusted peer takes the shoot.' },
              { icon: Globe,         title: 'Edmonton-First, Always',desc: 'This isn\'t a side tab on a national platform. Edmonton photographers are the only photographers here.' },
              { icon: Star,          title: 'Zero Spam, Zero Noise', desc: 'Clients reach you through structured booking requests only. No cold spam.' },
              { icon: Shield,        title: 'Fair Market',           desc: 'Trust Score and badges surface quality. Your work and reputation win — not your willingness to go cheapest.' },
            ].map((f) => {
              const Icon = f.icon
              return (
                <div key={f.title} className="p-6 flex gap-4 items-start">
                  <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-ink" />
                  </div>
                  <div>
                    <p className="font-semibold text-ink text-sm mb-1">{f.title}</p>
                    <p className="text-ink-400 text-xs leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              )
            })}
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
              <div key={i} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
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
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-3">
            Up and running<br />in 20 minutes.
          </h2>
          <p className="text-ink-400 text-base leading-relaxed mb-2 max-w-lg mx-auto">
            Your next client is already searching.
          </p>
          <p className="text-ink-500 text-sm mb-10">Free to join · No credit card · Zero commission, always</p>
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
