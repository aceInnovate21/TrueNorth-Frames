import Link from 'next/link'
import Image from 'next/image'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'
import { ArrowRight, MapPin, Shield, Star, Users, Heart, Camera, CheckCircle2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About — TrueNorth Frames',
  description: 'We built TrueNorth Frames because finding a great Edmonton photographer should be simple, transparent, and free.',
}

const TEAM = [
  { name: 'Yogesh', role: 'Founder & CEO', initials: 'Y', bg: 'bg-slate-700' },
  { name: 'Sarah M.', role: 'Head of Community', initials: 'SM', bg: 'bg-zinc-700' },
  { name: 'Dev T.', role: 'Lead Engineer', initials: 'DT', bg: 'bg-neutral-700' },
]

const VALUES = [
  {
    icon: Shield,
    title: 'Transparency over hype',
    desc: 'Every trust score is pulled from public, third-party sources — starting with Google, with more on the way. We never let photographers write their own reviews or inflate their scores.',
  },
  {
    icon: Heart,
    title: 'Local first',
    desc: "We're an Edmonton product built for Edmonton clients and Edmonton photographers. We're not trying to be everywhere. We're trying to be the best place for YEG.",
  },
  {
    icon: Users,
    title: 'No middlemen',
    desc: 'Clients message photographers directly. No commissions, no booking fees, no platform skimming your session rate. The money stays between the people who earned it.',
  },
  {
    icon: Camera,
    title: 'Photographers deserve better tools',
    desc: "Most platforms treat photographers as inventory. We treat them as the product. Their reputation is their business — we just help more people see it.",
  },
]

const MILESTONES = [
  { year: 'May 2026', label: 'Idea formed', desc: 'Couldn\'t find a reliable way to vet Edmonton photographers. Built a spreadsheet. Thought: there has to be a better way.' },
  { year: 'Now', label: 'Photographer onboarding', desc: 'Currently onboarding Edmonton photographers and building out trust scores, portfolios, and messaging.' },
]

export default function AboutPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="bg-white border-b border-ink-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 bg-ink-50 border border-ink-100 rounded-full px-3.5 py-1.5 mb-8">
            <MapPin className="w-3 h-3 text-ink-400" />
            <span className="text-ink-500 text-xs font-medium">Edmonton, Alberta · YEG</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-bold text-ink leading-tight mb-6">
            We think finding a great<br className="hidden sm:block" /> photographer should be easy.
          </h1>
          <p className="text-ink-400 text-lg leading-relaxed max-w-2xl mx-auto mb-10">
            TrueNorth Frames is Edmonton's local photographer marketplace — built around verified trust scores,
            direct communication, and zero booking fees. We exist because the old way of finding a photographer
            (Instagram scroll, Google guesswork, crossed fingers) was broken.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/photographers"
              className="inline-flex items-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Browse photographers
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/for-photographers"
              className="inline-flex items-center gap-2 border border-ink-200 hover:border-ink text-ink-500 hover:text-ink font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              For photographers
            </Link>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <section className="border-b border-ink-100 bg-ink-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { value: 'Verified', label: 'Edmonton photographers' },
              { value: 'Google', label: 'Verified trust source' },
              { value: '$0', label: 'Booking fees — ever' },
              { value: '0%', label: 'Commission on your rate' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-serif text-4xl font-bold text-ink mb-1">{s.value}</p>
                <p className="text-ink-400 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Story ─────────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Our story</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-8 leading-tight">
            Built out of frustration.<br />Shaped by Edmonton photographers.
          </h2>
          <div className="prose prose-sm max-w-none text-ink-500 leading-relaxed space-y-4">
            <p>
              It started with a simple problem: we needed to hire a photographer for a family event and had no
              reliable way to evaluate the options. Instagram showed curated highlights. Google showed whoever
              paid for SEO. Yelp had three reviews from 2019.
            </p>
            <p>
              We built a spreadsheet. Manually tracked Google ratings, Instagram follower counts, Yelp scores,
              Facebook recommendations — and averaged them into a rough "trust score" for each photographer
              we considered. It worked. It was also insane that we had to do it manually.
            </p>
            <p>
              That spreadsheet became TrueNorth Frames. We automated the aggregation, built profiles for
              Edmonton photographers, and created a direct channel between clients and photographers —
              no commissions, no booking fees, no platform taking a cut of a session rate a photographer
              spent years earning.
            </p>
            <p>
              We're still early. But every photographer who's joined has told us the same thing: they
              wanted a place that showed their real reputation, not just whoever had the best hashtag game.
              That's what we're building.
            </p>
          </div>
        </div>
      </section>

      {/* ── Values ────────────────────────────────────────────────────── */}
      <section className="bg-ink-50 py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">What we believe</p>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink">Four things we won't compromise on.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {VALUES.map((v) => {
              const Icon = v.icon
              return (
                <div
                  key={v.title}
                  className="bg-white rounded-2xl p-6"
                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}
                >
                  <div className="w-10 h-10 bg-ink rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-ink text-base mb-2">{v.title}</h3>
                  <p className="text-ink-400 text-sm leading-relaxed">{v.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── Timeline ──────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">Timeline</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-12">How we got here.</h2>
          <div className="relative">
            <div className="absolute left-[88px] top-0 bottom-0 w-px bg-ink-100" />
            <div className="space-y-8">
              {MILESTONES.map((m, i) => (
                <div key={i} className="flex gap-6 items-start">
                  <div className="w-20 flex-shrink-0 text-right">
                    <p className="text-xs font-semibold text-ink-300 leading-tight pt-1">{m.year}</p>
                  </div>
                  <div className="relative flex-shrink-0 mt-1">
                    <div className="w-4 h-4 rounded-full bg-ink border-2 border-white ring-1 ring-ink-200" />
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-semibold text-ink text-sm mb-1">{m.label}</p>
                    <p className="text-ink-400 text-sm leading-relaxed">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Team ──────────────────────────────────────────────────────── */}
      <section className="bg-ink-50 py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-ink-300 text-xs font-semibold uppercase tracking-[0.15em] mb-3">The team</p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-4">Small team. Big focus.</h2>
          <p className="text-ink-400 text-base mb-12 max-w-md mx-auto">
            We're based in Edmonton and we use the product ourselves. That keeps us honest.
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            {TEAM.map((t) => (
              <div key={t.name} className="flex flex-col items-center gap-3">
                <div className={`w-16 h-16 rounded-2xl ${t.bg} flex items-center justify-center text-white font-bold text-sm`}>
                  {t.initials}
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">{t.name}</p>
                  <p className="text-ink-300 text-xs">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-ink py-20 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to find your photographer?
          </h2>
          <p className="text-ink-300 text-base mb-8 max-w-md mx-auto">
            Browse Edmonton photographers — free to search, free to message, no account required to start.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/photographers"
              className="inline-flex items-center gap-2 bg-white hover:bg-ink-100 text-ink font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Browse photographers <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/for-photographers"
              className="inline-flex items-center gap-2 border border-ink-700 hover:border-ink-500 text-ink-300 hover:text-white font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              I'm a photographer
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
