'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Reveal — fades + rises its children in the first time they scroll into view.
 * Used to drive the "type-on" cadence of the marketing film: each beat animates
 * as the viewport reaches it, so a top-to-bottom screen recording plays back as
 * the edited ad.
 */
export function Reveal({
  children,
  className = '',
  delay = 0,
  y = 24,
  once = true,
  amount = 0.5,
}: {
  children: ReactNode
  className?: string
  delay?: number
  y?: number
  once?: boolean
  amount?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true)
          if (once) io.disconnect()
        } else if (!once) {
          setShown(false)
        }
      },
      { threshold: amount },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, amount])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
        transition: `opacity 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 700ms cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: 'opacity, transform',
      }}
    >
      {children}
    </div>
  )
}
