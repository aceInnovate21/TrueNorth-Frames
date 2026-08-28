'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Reveal } from './reveal'
import { ClientDemo, PhotographerDemo } from './demos'

/**
 * /marketing — a scroll-driven product film for TrueNorth Frames.
 *
 * The page IS the ad: each full-height section is a beat in the 1:10 storyboard.
 * Screen-record a slow top-to-bottom scroll and the reveal animations play back
 * as the edited film. White canvas, bold ink type, real product UI in the demo
 * acts. No stock footage — minimal accent motif only.
 */

// The full lockup on its light ground — sits cleanly on the white canvas.
const LOGO = '/logo.png'

// A full-viewport beat on the white canvas.
function Beat({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={`min-h-screen flex flex-col items-center justify-center px-6 py-24 ${className}`}>
      {children}
    </section>
  )
}

// The small monospaced act label — Apple-style, pinned at the top of a demo act
// so it holds in frame while the product UI unveils beneath it as you scroll.
function ActLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="sticky top-24 z-10 mb-10 flex justify-center">
      <Reveal>
        <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.35em] text-ink-400">
          <span className="w-6 h-px bg-ink-200" />
          {children}
        </span>
      </Reveal>
    </div>
  )
}

const H = 'font-semibold tracking-tight leading-[1.05] text-balance text-ink'

export default function MarketingFilm() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProgress(h > 0 ? window.scrollY / h : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <main className="bg-white text-ink antialiased selection:bg-ink selection:text-white overflow-x-hidden">
      {/* Scroll progress rail — the only accent motif */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-ink-100">
        <div className="h-full bg-ink origin-left" style={{ transform: `scaleX(${progress})` }} />
      </div>

      {/* ── ACT 1 — Problem ─────────────────────────────────────────── */}
      <Beat>
        <div className="max-w-3xl text-center space-y-6">
          <Reveal>
            <p className={`${H} text-4xl sm:text-6xl`}>
              Edmonton has <span className="tabular-nums">2,600+</span> photographers.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <p className={`${H} text-3xl sm:text-5xl !text-ink-300`}>Clients can’t find them.</p>
          </Reveal>
          <Reveal delay={240}>
            <p className={`${H} text-3xl sm:text-5xl !text-ink-300`}>Photographers can’t be found.</p>
          </Reveal>
        </div>
      </Beat>

      {/* ── ACT 2 — Pivot ───────────────────────────────────────────── */}
      <Beat>
        <div className="max-w-3xl text-center space-y-8">
          <Reveal>
            <Image
              src={LOGO}
              alt="TrueNorth Frames"
              width={320}
              height={320}
              priority
              className="mx-auto w-48 sm:w-60 h-auto"
            />
          </Reveal>
          <Reveal delay={200}>
            <p className={`${H} text-5xl sm:text-7xl`}>Introducing TrueNorth&nbsp;Frames.</p>
          </Reveal>
          <Reveal delay={360}>
            <p className="text-xl sm:text-2xl text-ink-400 font-light">One platform. Both sides solved.</p>
          </Reveal>
        </div>
      </Beat>

      {/* ── ACT 3a — Client demo (tall, unveils on scroll) ──────────── */}
      <section className="px-6 pb-32">
        <ActLabel>For clients</ActLabel>
        <Reveal delay={60} y={40}>
          <ClientDemo />
        </Reveal>
        <Reveal delay={160} className="mt-14">
          <p className="text-center text-ink-400 text-sm max-w-xs mx-auto">
            Browse verified photographers, read the proof, chat, book a date — in minutes.
          </p>
        </Reveal>
      </section>

      {/* ── ACT 3b — Photographer demo (tall, unveils on scroll) ────── */}
      <section className="px-6 pb-32">
        <ActLabel>For photographers</ActLabel>
        <Reveal delay={60} y={40}>
          <PhotographerDemo />
        </Reveal>
        <Reveal delay={160} className="mt-14">
          <p className="text-center text-ink-400 text-sm max-w-xs mx-auto">
            Upload your work, sync your trust signals, accept bookings — all in one place.
          </p>
        </Reveal>
      </section>

      {/* ── ACT 4 — Feature recap ───────────────────────────────────── */}
      <Beat>
        <div className="text-center space-y-4">
          <Reveal>
            <p className={`${H} text-5xl sm:text-7xl`}>No commission.</p>
          </Reveal>
          <Reveal delay={140}>
            <p className={`${H} text-5xl sm:text-7xl`}>No middlemen.</p>
          </Reveal>
          <Reveal delay={280}>
            <p className={`${H} text-5xl sm:text-7xl !text-ink-300`}>
              Just proof, and bookings.
            </p>
          </Reveal>
        </div>
      </Beat>

      {/* ── ACT 5 — Close ───────────────────────────────────────────── */}
      <Beat>
        <div className="text-center space-y-12">
          <Reveal>
            <p className={`${H} text-4xl sm:text-6xl`}>
              Your work. Your reputation.<br />One link.
            </p>
          </Reveal>
          <Reveal delay={220} y={16}>
            <Image
              src={LOGO}
              alt="TrueNorth Frames"
              width={360}
              height={360}
              className="mx-auto w-56 sm:w-72 h-auto"
            />
          </Reveal>
          <Reveal delay={420}>
            <a
              href="https://thetruenorthframes.com"
              className="text-sm font-mono tracking-[0.2em] text-ink-400 hover:text-ink transition-colors"
            >
              thetruenorthframes.com
            </a>
          </Reveal>
        </div>
      </Beat>
    </main>
  )
}
