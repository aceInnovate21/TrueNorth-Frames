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
 * as the edited film. Black canvas, bold white type, real product UI in the
 * demo acts. No stock footage — minimal accent motif only.
 */

// The white/gold lockup already rendered on black — blends into the canvas.
const WHITE_LOGO = '/black%20logo.png'

// A full-viewport beat on the black canvas.
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
        <span className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[0.35em] text-white/50">
          <span className="w-6 h-px bg-white/30" />
          {children}
        </span>
      </Reveal>
    </div>
  )
}

const H = 'font-semibold tracking-tight leading-[1.05] text-balance'

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
    <main className="bg-black text-white antialiased selection:bg-white selection:text-black overflow-x-hidden">
      {/* Scroll progress rail — the only accent motif */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-white/5">
        <div className="h-full bg-white/70 origin-left" style={{ transform: `scaleX(${progress})` }} />
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
            <p className={`${H} text-3xl sm:text-5xl text-white/50`}>Clients can’t find them.</p>
          </Reveal>
          <Reveal delay={240}>
            <p className={`${H} text-3xl sm:text-5xl text-white/50`}>Photographers can’t be found.</p>
          </Reveal>
        </div>
      </Beat>

      {/* ── ACT 2 — Pivot ───────────────────────────────────────────── */}
      <Beat>
        <div className="max-w-3xl text-center space-y-8">
          <Reveal>
            <Image
              src={WHITE_LOGO}
              alt="TrueNorth Frames"
              width={320}
              height={320}
              priority
              className="mx-auto w-56 sm:w-72 h-auto"
            />
          </Reveal>
          <Reveal delay={200}>
            <p className={`${H} text-5xl sm:text-7xl`}>Introducing TrueNorth&nbsp;Frames.</p>
          </Reveal>
          <Reveal delay={360}>
            <p className="text-xl sm:text-2xl text-white/50 font-light">One platform. Both sides solved.</p>
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
          <p className="text-center text-white/40 text-sm max-w-xs mx-auto">
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
          <p className="text-center text-white/40 text-sm max-w-xs mx-auto">
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
            <p className={`${H} text-5xl sm:text-7xl text-white/60`}>
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
              src={WHITE_LOGO}
              alt="TrueNorth Frames"
              width={360}
              height={360}
              className="mx-auto w-64 sm:w-80 h-auto"
            />
          </Reveal>
          <Reveal delay={420}>
            <a
              href="https://thetruenorthframes.com"
              className="text-sm font-mono tracking-[0.2em] text-white/50 hover:text-white transition-colors"
            >
              thetruenorthframes.com
            </a>
          </Reveal>
        </div>
      </Beat>
    </main>
  )
}
