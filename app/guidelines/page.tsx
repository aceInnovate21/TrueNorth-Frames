'use client'

import Link from 'next/link'
import Image from 'next/image'
import {
  CheckCircle2, XCircle, Camera, Star, Shield,
  ImagePlus, AlertTriangle, ArrowRight,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { Footer } from '@/components/footer'

const DO_LIST = [
  {
    title: 'Real photography work only',
    desc: 'Every photo must be taken by you. Showcase your best sessions — weddings, portraits, corporate, newborns, events, real estate.',
  },
  {
    title: 'Variety of shots',
    desc: 'Mix it up — wide establishing shots, close details, candid moments. Variety shows your range and style to potential clients.',
  },
  {
    title: 'High resolution & sharp focus',
    desc: 'Upload full-resolution originals. Blurry, pixelated, or heavily compressed images reflect poorly on your profile.',
  },
  {
    title: 'Consistent style',
    desc: 'Your portfolio is your first impression. A cohesive edit style builds client trust faster than a mixed bag of looks.',
  },
  {
    title: 'Tag your photos',
    desc: 'Add tags (Outdoor, Golden Hour, Studio, etc.) and the month/year taken. This helps clients find you in the portfolio reel.',
  },
  {
    title: 'Add a caption',
    desc: 'A short caption like "Engagement shoot at Hawrelak Park" gives context and shows up in search. Keep it natural.',
  },
  {
    title: 'Minimum 5 photos',
    desc: 'Profiles with fewer than 5 photos don\'t qualify for the Rising Talent badge and are less likely to be discovered.',
  },
]

const DONT_LIST = [
  {
    title: 'No flyers or text graphics',
    desc: 'Job postings, pricing sheets, promotional flyers, or any image where text is the main content will be removed.',
  },
  {
    title: 'No stock photos',
    desc: 'Only upload photos you personally shot. Stock photography, AI-generated images, or other photographers\' work is not allowed.',
  },
  {
    title: 'No watermarked images',
    desc: 'Remove your watermark before uploading. Watermarks distract from the work — your profile and name already identify you.',
  },
  {
    title: 'No screenshots or phone screenshots',
    desc: 'Screenshots of Instagram posts, messages, or other apps are not portfolio-quality content.',
  },
  {
    title: 'No inappropriate content',
    desc: 'No nudity, graphic violence, or content that violates our terms of service. Boudoir photography is permitted within tasteful limits.',
  },
  {
    title: 'No misleading content',
    desc: 'Don\'t upload photos from a different photographer or region. Edmonton clients are booking based on what they see — be honest.',
  },
]

const BADGES = [
  {
    emoji: '🌟',
    name: 'Rising Talent',
    color: 'bg-amber-50 border-amber-200 text-amber-700',
    criteria: [
      'Under 3 years Edmonton experience, OR new to the platform',
      'At least 5 portfolio photos uploaded',
      'Profile is approved',
    ],
    desc: 'For photographers building their reputation. Clients see this as a signal of fresh talent worth discovering.',
  },
  {
    emoji: '✅',
    name: 'Trusted Pro',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    criteria: [
      '3+ years of Edmonton photography experience',
      'Google Business Profile connected',
      'Website URL set on your profile',
      'At least 1 Google review on your GBP',
    ],
    desc: 'For established Edmonton photographers with an external verified presence.',
  },
  {
    emoji: '🏆',
    name: 'Most Reviewed',
    color: 'bg-purple-50 border-purple-200 text-purple-700',
    criteria: [
      'Top 3 photographers by review count on TrueNorth Frames',
      'At least 3 platform reviews',
    ],
    desc: 'Earned automatically — no application needed. Awarded to the most reviewed photographers on the platform.',
  },
  {
    emoji: '📅',
    name: 'Most Booked',
    color: 'bg-blue-50 border-blue-200 text-blue-700',
    criteria: [
      'Top 3 photographers by completed bookings on TrueNorth Frames',
      'At least 3 completed sessions',
    ],
    desc: 'Awarded to the photographers with the most completed sessions through the platform.',
  },
]

export default function GuidelinesPage() {
  return (
    <>
      <Nav />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="bg-ink text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-white/10 rounded-2xl flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-ink-300 text-sm font-medium">Photographer Guidelines</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold mb-4 leading-tight">
            How to build a great<br />TrueNorth Frames profile
          </h1>
          <p className="text-ink-300 text-lg max-w-2xl leading-relaxed">
            Your portfolio is your first impression to Edmonton clients. These guidelines help you
            put your best work forward — and keep the marketplace trustworthy for everyone.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">

        {/* ── Portfolio guidelines ──────────────────────────────────────── */}
        <section>
          <h2 className="font-serif text-3xl font-bold text-ink mb-2">Portfolio photos</h2>
          <p className="text-ink-400 text-sm mb-10">
            Your portfolio photos appear in the discovery reel and on your public profile.
            Clients make decisions based on what they see here.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Do */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-900 text-base">Do</h3>
              </div>
              <div className="space-y-4">
                {DO_LIST.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-emerald-900 text-sm">{item.title}</p>
                      <p className="text-emerald-700 text-xs leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Don't */}
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-red-900 text-base">Don't</h3>
              </div>
              <div className="space-y-4">
                {DONT_LIST.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-900 text-sm">{item.title}</p>
                      <p className="text-red-700 text-xs leading-relaxed mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enforcement note */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-5">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 text-sm mb-1">Enforcement</p>
              <p className="text-amber-700 text-sm leading-relaxed">
                Our team reviews flagged content. Photos that violate these guidelines will be removed
                without notice. Repeated violations may result in profile suspension.
                Clients can flag inappropriate content directly from your profile.
              </p>
            </div>
          </div>
        </section>

        {/* ── Badge system ─────────────────────────────────────────────── */}
        <section>
          <h2 className="font-serif text-3xl font-bold text-ink mb-2">Badge system</h2>
          <p className="text-ink-400 text-sm mb-8">
            Badges are computed automatically from your profile signals — no application needed.
            They appear on your profile card, in the discovery reel, and on your public profile page.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {BADGES.map((badge) => (
              <div key={badge.name} className={`border rounded-2xl p-5 ${badge.color}`}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{badge.emoji}</span>
                  <span className="font-bold text-sm">{badge.name}</span>
                </div>
                <p className="text-xs leading-relaxed mb-3 opacity-80">{badge.desc}</p>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-2">Requirements</p>
                  {badge.criteria.map((c) => (
                    <div key={c} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 opacity-70" />
                      <p className="text-xs leading-snug">{c}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Trust score ──────────────────────────────────────────────── */}
        <section>
          <h2 className="font-serif text-3xl font-bold text-ink mb-2">Trust score</h2>
          <p className="text-ink-400 text-sm mb-6">
            Your trust score (75–100) is shown publicly when you connect your Google Business Profile.
            It signals to clients that you have a verifiable, established presence.
          </p>

          <div className="bg-white border border-ink-100 rounded-2xl p-6"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { icon: Shield, label: 'Baseline', value: '75 pts', desc: 'Awarded just for connecting your Google Business Profile.' },
                { icon: Star,   label: 'Reviews',  value: '+12.5 pts', desc: 'Based on your GBP rating and review count.' },
                { icon: CheckCircle2, label: 'Verification', value: '+9.5 pts', desc: 'Profile completeness + GBP verified status.' },
              ].map(({ icon: Icon, label, value, desc }) => (
                <div key={label} className="text-center">
                  <div className="w-10 h-10 bg-ink-50 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Icon className="w-5 h-5 text-ink-400" />
                  </div>
                  <p className="font-bold text-ink text-lg">{value}</p>
                  <p className="font-semibold text-ink text-sm mb-1">{label}</p>
                  <p className="text-ink-400 text-xs leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-ink-50 text-center">
              <p className="text-ink-400 text-xs">
                Connect your GBP from your photographer dashboard under the <strong className="text-ink">Trust score</strong> tab.
              </p>
            </div>
          </div>
        </section>

        {/* ── Community standards ──────────────────────────────────────── */}
        <section>
          <h2 className="font-serif text-3xl font-bold text-ink mb-2">Community standards</h2>
          <p className="text-ink-400 text-sm mb-6">
            TrueNorth Frames is a local Edmonton community. We expect everyone to interact professionally.
          </p>
          <div className="space-y-3">
            {[
              { title: 'Respond promptly', desc: 'Clients who send messages expect a reply within 24–48 hours. Photographers who respond quickly get significantly more bookings.' },
              { title: 'Honour confirmed bookings', desc: 'Cancelling a confirmed booking without good reason harms the client and your reputation on the platform.' },
              { title: 'Honest pricing', desc: 'Your rate display should reflect what you actually charge. Quoting dramatically different prices after contact damages trust.' },
              { title: 'Accurate availability', desc: 'Keep your calendar up to date so clients aren\'t disappointed after reaching out.' },
              { title: 'Respectful communication', desc: 'All communication on the platform must be professional and respectful. Harassment or inappropriate messaging results in immediate suspension.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4 bg-white border border-ink-100 rounded-2xl p-4"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
                <CheckCircle2 className="w-4 h-4 text-ink mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-ink text-sm">{item.title}</p>
                  <p className="text-ink-400 text-xs leading-relaxed mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <section className="bg-ink rounded-2xl p-8 text-center">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ImagePlus className="w-6 h-6 text-white" />
          </div>
          <h3 className="font-serif text-2xl font-bold text-white mb-2">Ready to upload your portfolio?</h3>
          <p className="text-ink-300 text-sm mb-6 max-w-sm mx-auto">
            Head to your dashboard to add photos, set tags, and get discovered by Edmonton clients.
          </p>
          <Link href="/dashboard/photographer"
            className="inline-flex items-center gap-2 bg-white text-ink text-sm font-semibold px-6 py-3 rounded-xl hover:bg-ink-100 transition-colors">
            Go to dashboard <ArrowRight className="w-4 h-4" />
          </Link>
        </section>

      </div>

      <Footer />
    </>
  )
}
