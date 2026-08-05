'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarPlus, ChevronDown } from 'lucide-react'
import {
  type CalendarEvent,
  googleCalendarUrl,
  outlookCalendarUrl,
  icsContent,
} from '@/lib/calendar'

interface AddToCalendarProps {
  event: CalendarEvent
  /** Stable id (e.g. booking id) used for the .ics UID and filename. */
  uid?: string
  /** Optional extra classes for the trigger button. */
  className?: string
}

// Trigger an .ics download in the browser (Apple/iPhone Calendar, Outlook
// desktop, and any other calendar app pick this up).
function downloadIcs(event: CalendarEvent, uid: string) {
  const blob = new Blob([icsContent(event, uid)], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `truenorth-booking-${uid || 'session'}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on the next tick so the download has started.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function AddToCalendar({ event, uid = '', className = '' }: AddToCalendarProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onClick)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('mousedown', onClick)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const items: { label: string; onSelect: () => void }[] = [
    {
      label: 'Google Calendar',
      onSelect: () => window.open(googleCalendarUrl(event), '_blank', 'noopener,noreferrer'),
    },
    {
      label: 'Apple / iPhone Calendar',
      onSelect: () => downloadIcs(event, uid),
    },
    {
      label: 'Outlook',
      onSelect: () => window.open(outlookCalendarUrl(event), '_blank', 'noopener,noreferrer'),
    },
    {
      label: 'Download .ics file',
      onSelect: () => downloadIcs(event, uid),
    },
  ]

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Add this booking to your calendar"
        className={
          className ||
          'inline-flex items-center gap-1.5 text-xs font-medium border border-ink-100 hover:border-ink-300 text-ink-500 hover:text-ink rounded-lg px-3 py-1.5 transition-colors'
        }
      >
        <CalendarPlus className="w-3.5 h-3.5" />
        Add to Calendar
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1.5 w-52 rounded-xl bg-white py-1 shadow-lg border border-ink-100"
        >
          {items.map(item => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => { item.onSelect(); setOpen(false) }}
              className="w-full text-left px-3.5 py-2 text-sm text-ink hover:bg-ink-50 transition-colors"
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
