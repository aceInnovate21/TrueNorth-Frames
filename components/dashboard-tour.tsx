'use client'

import { useEffect, useState, useCallback } from 'react'
import { X } from 'lucide-react'

export interface TourStep {
  /** Dashboard tab to switch to before showing this step. */
  tab: string
  /** CSS selector for the element to spotlight (e.g. a rail nav item). When it
   *  can't be found or is off-screen (mobile drawer), the step renders centered. */
  selector?: string
  title: string
  body: string
}

interface DashboardTourProps {
  steps: TourStep[]
  /** Switch the dashboard to the given tab before a step renders. */
  onNavigate: (tab: string) => void
  /** Called when the tour is finished or skipped — persist + hide. */
  onClose: () => void
}

interface Rect { top: number; left: number; width: number; height: number }

export function DashboardTour({ steps, onNavigate, onClose }: DashboardTourProps) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const step = steps[index]
  const isLast = index === steps.length - 1

  // Locate (and scroll to) the current step's target. Falls back to a centered
  // card when the element isn't on screen — e.g. the rail is a drawer on mobile.
  const locate = useCallback(() => {
    if (!step?.selector) { setRect(null); return }
    const el = document.querySelector(step.selector) as HTMLElement | null
    if (!el) { setRect(null); return }
    const r = el.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) { setRect(null); return }
    // Off-viewport (e.g. the rail is a translated-off drawer on mobile) → centre.
    const onScreen = r.right > 0 && r.left < window.innerWidth && r.bottom > 0 && r.top < window.innerHeight
    if (!onScreen) { setRect(null); return }
    setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [step])

  // On step change: switch tab, then locate the target on the next frame (after
  // the tab content has rendered).
  useEffect(() => {
    onNavigate(step.tab)
    const raf = requestAnimationFrame(() => {
      const el = step.selector ? (document.querySelector(step.selector) as HTMLElement | null) : null
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // Give the smooth scroll a beat before measuring.
      setTimeout(locate, 220)
    })
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  // Keep the spotlight aligned on resize/scroll.
  useEffect(() => {
    window.addEventListener('resize', locate)
    window.addEventListener('scroll', locate, true)
    return () => {
      window.removeEventListener('resize', locate)
      window.removeEventListener('scroll', locate, true)
    }
  }, [locate])

  function finish() {
    onClose()
  }
  function next() {
    if (isLast) finish()
    else setIndex(i => i + 1)
  }
  function back() {
    if (index > 0) setIndex(i => i - 1)
  }

  const pad = 6
  const spotlight: Rect | null = rect
    ? { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null

  // Popover placement: below the target if there's room, else above; centered
  // when there's no target.
  const popoverStyle: React.CSSProperties = (() => {
    if (!spotlight) {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
    }
    const belowRoom = window.innerHeight - (spotlight.top + spotlight.height)
    const width = Math.min(320, window.innerWidth - 32)
    let left = spotlight.left + spotlight.width / 2 - width / 2
    left = Math.max(16, Math.min(left, window.innerWidth - width - 16))
    if (belowRoom > 220) {
      return { top: spotlight.top + spotlight.height + 12, left, width }
    }
    return { top: Math.max(16, spotlight.top - 12), left, width, transform: 'translateY(-100%)' }
  })()

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Dim + spotlight cutout. The big box-shadow darkens everything except
          the padded target rect. */}
      {spotlight ? (
        <div
          className="absolute rounded-xl transition-all duration-200 pointer-events-none"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.6)',
          }}
        />
      ) : (
        <div className="absolute inset-0 bg-[rgba(15,23,42,0.6)]" />
      )}

      {/* Click-catcher to advance when tapping the dimmed area */}
      <div className="absolute inset-0" onClick={next} />

      {/* Popover */}
      <div
        className="absolute bg-white rounded-2xl p-5 shadow-xl"
        style={{ ...popoverStyle, maxWidth: 'calc(100vw - 32px)', width: (popoverStyle.width as number) ?? 320 }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={finish}
          className="absolute top-3 right-3 text-ink-300 hover:text-ink p-1"
          aria-label="Skip tour"
        >
          <X className="w-4 h-4" />
        </button>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300 mb-1">
          Step {index + 1} of {steps.length}
        </p>
        <h3 className="font-semibold text-ink text-base mb-1.5">{step.title}</h3>
        <p className="text-ink-500 text-sm leading-relaxed mb-4">{step.body}</p>

        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === index ? 'w-4 bg-ink' : 'w-1.5 bg-ink-200'}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {index > 0 && (
              <button
                onClick={back}
                className="text-sm font-medium text-ink-400 hover:text-ink px-3 py-1.5 rounded-lg transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={next}
              className="text-sm font-semibold bg-ink text-white px-4 py-1.5 rounded-lg hover:bg-ink-800 transition-colors"
            >
              {isLast ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>

        {index === 0 && (
          <button
            onClick={finish}
            className="mt-3 w-full text-center text-xs text-ink-300 hover:text-ink-500 transition-colors"
          >
            Skip the tour
          </button>
        )}
      </div>
    </div>
  )
}
