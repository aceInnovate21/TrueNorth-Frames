'use client'

import { useState, useRef, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'

interface HelpButtonProps {
  title: string
  steps: string[]
}

// A small "? Help" button that opens a popover listing the steps for the
// current domain. Reused across dashboard tabs — the parent passes the content
// for whatever tab is active. Closes on outside click or Escape.
export function HelpButton({ title, steps }: HelpButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label="Help for this section"
        aria-expanded={open}
        className="flex items-center gap-1.5 text-xs font-medium text-ink-400 hover:text-ink border border-ink-100 hover:border-ink-300 rounded-lg px-2.5 py-1.5 transition-all"
      >
        <HelpCircle className="w-3.5 h-3.5" />
        Help
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl border border-ink-100 p-4 z-50"
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <p className="font-semibold text-ink text-sm">{title}</p>
            <button
              onClick={() => setOpen(false)}
              className="text-ink-300 hover:text-ink -mt-0.5 -mr-0.5 p-0.5"
              aria-label="Close help"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <ol className="space-y-2.5">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-ink text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span className="text-ink-500 text-xs leading-relaxed">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  )
}
