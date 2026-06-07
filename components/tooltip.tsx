'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface TooltipProps {
  content: React.ReactNode
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  maxWidth?: number
  delay?: number
}

export function Tooltip({ content, children, side = 'top', maxWidth = 240, delay = 120 }: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords]   = useState({ top: 0, left: 0 })
  const triggerRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null)

  const reposition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return
    const tr = triggerRef.current.getBoundingClientRect()
    const tp = tooltipRef.current.getBoundingClientRect()
    const gap = 8
    let top = 0, left = 0

    if (side === 'top') {
      top  = tr.top  + window.scrollY - tp.height - gap
      left = tr.left + window.scrollX + tr.width / 2 - tp.width / 2
    } else if (side === 'bottom') {
      top  = tr.bottom + window.scrollY + gap
      left = tr.left   + window.scrollX + tr.width / 2 - tp.width / 2
    } else if (side === 'left') {
      top  = tr.top  + window.scrollY + tr.height / 2 - tp.height / 2
      left = tr.left + window.scrollX - tp.width - gap
    } else {
      top  = tr.top    + window.scrollY + tr.height / 2 - tp.height / 2
      left = tr.right  + window.scrollX + gap
    }

    // Keep within viewport horizontally
    const vw = window.innerWidth
    if (left < 8) left = 8
    if (left + tp.width > vw - 8) left = vw - tp.width - 8

    setCoords({ top, left })
  }, [side])

  function show() {
    timerRef.current = setTimeout(() => {
      setVisible(true)
    }, delay)
  }

  function hide() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setVisible(false)
  }

  useEffect(() => {
    if (visible) reposition()
  }, [visible, reposition])

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current) }, [])

  const arrowBase = 'absolute w-2 h-2 bg-ink rotate-45'
  const arrowPos = {
    top:    'bottom-[-4px] left-1/2 -translate-x-1/2',
    bottom: 'top-[-4px]    left-1/2 -translate-x-1/2',
    left:   'right-[-4px]  top-1/2  -translate-y-1/2',
    right:  'left-[-4px]   top-1/2  -translate-y-1/2',
  }[side]

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        className="inline-flex items-center"
      >
        {children}
      </span>

      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-[9999] pointer-events-none"
          style={{ top: coords.top, left: coords.left, maxWidth }}
        >
          <div className="relative bg-ink text-white text-xs leading-relaxed px-3 py-2 rounded-xl shadow-lg">
            {content}
            <span className={`${arrowBase} ${arrowPos}`} />
          </div>
        </div>
      )}
    </>
  )
}

// Convenience wrapper — a small circular ? icon that shows a tooltip
export function InfoTooltip({ content, side = 'top' }: { content: React.ReactNode; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  return (
    <Tooltip content={content} side={side}>
      <button
        type="button"
        tabIndex={0}
        aria-label="More information"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full border border-ink-200 text-ink-300 hover:border-ink-400 hover:text-ink-500 transition-colors focus:outline-none focus:ring-2 focus:ring-ink/20 ml-1 flex-shrink-0"
      >
        <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor">
          <circle cx="4" cy="2.5" r="0.7" />
          <rect x="3.35" y="4" width="1.3" height="3" rx="0.65" />
        </svg>
      </button>
    </Tooltip>
  )
}
