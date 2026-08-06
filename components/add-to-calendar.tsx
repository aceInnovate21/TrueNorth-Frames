'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
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

const MENU_WIDTH = 208 // w-52
const MENU_EST_HEIGHT = 168 // ~4 items + padding

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
  const [mounted, setMounted] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const btnRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Anchor the (portaled) menu to the button, flipping above when there isn't
  // room below and clamping to the viewport so it's never clipped by a parent's
  // overflow.
  const reposition = useCallback(() => {
    const btn = btnRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const openUp = r.bottom + MENU_EST_HEIGHT + 8 > window.innerHeight && r.top > MENU_EST_HEIGHT
    const top = openUp ? r.top - MENU_EST_HEIGHT - 6 : r.bottom + 6
    let left = r.right - MENU_WIDTH // right-aligned to the button
    left = Math.max(8, Math.min(left, window.innerWidth - MENU_WIDTH - 8))
    setPos({ top, left })
  }, [])

  useEffect(() => {
    if (!open) return
    reposition()
    function onPointer(e: MouseEvent) {
      const t = e.target as Node
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    function onScroll() { reposition() }
    window.addEventListener('mousedown', onPointer)
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', reposition)
    // capture: true so we catch scrolls on any ancestor container too
    window.addEventListener('scroll', onScroll, true)
    return () => {
      window.removeEventListener('mousedown', onPointer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, reposition])

  const items: { label: string; onSelect: () => void }[] = [
    { label: 'Google Calendar', onSelect: () => window.open(googleCalendarUrl(event), '_blank', 'noopener,noreferrer') },
    { label: 'Apple / iPhone Calendar', onSelect: () => downloadIcs(event, uid) },
    { label: 'Outlook', onSelect: () => window.open(outlookCalendarUrl(event), '_blank', 'noopener,noreferrer') },
    { label: 'Download .ics file', onSelect: () => downloadIcs(event, uid) },
  ]

  const menu = open && mounted ? createPortal(
    <div
      ref={menuRef}
      role="menu"
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: MENU_WIDTH }}
      className="z-[9999] rounded-xl bg-white py-1 shadow-lg border border-ink-100"
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
    </div>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={btnRef}
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
      {menu}
    </>
  )
}
