'use client'

import { useState } from 'react'
import {
  ArrowRight, Calendar, CheckCircle2, ChevronLeft, ChevronRight,
  Clock, LogIn, X,
} from 'lucide-react'

import { PLATFORM_CONFIG } from '@/lib/platform-config'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeSlot {
  label: string   // "9:00 AM – 11:00 AM"
  start: string
  end: string
}

// ─── Mock availability — same shape as the photographer's real schedule ───────

const MOCK_AVAILABLE_DAYS: Record<string, TimeSlot[]> = (() => {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const result: Record<string, TimeSlot[]> = {}

  // Seed a handful of days with time slots
  const slots: Record<number, TimeSlot[]> = {
    [today.getDate() + 1]: [{ label: '10:00 AM – 12:00 PM', start: '10:00', end: '12:00' }, { label: '2:00 PM – 4:00 PM', start: '14:00', end: '16:00' }],
    [today.getDate() + 3]: [{ label: '9:00 AM – 11:00 AM', start: '09:00', end: '11:00' }],
    [today.getDate() + 5]: [{ label: '11:00 AM – 1:00 PM', start: '11:00', end: '13:00' }, { label: '3:00 PM – 5:00 PM', start: '15:00', end: '17:00' }],
    [today.getDate() + 7]: [{ label: '9:00 AM – 11:00 AM', start: '09:00', end: '11:00' }, { label: '1:00 PM – 3:00 PM', start: '13:00', end: '15:00' }],
    [today.getDate() + 8]: [{ label: '10:00 AM – 12:00 PM', start: '10:00', end: '12:00' }],
    [today.getDate() + 12]: [{ label: '9:00 AM – 11:00 AM', start: '09:00', end: '11:00' }, { label: '2:00 PM – 4:00 PM', start: '14:00', end: '16:00' }, { label: '4:00 PM – 6:00 PM', start: '16:00', end: '18:00' }],
    [today.getDate() + 14]: [{ label: '10:00 AM – 12:00 PM', start: '10:00', end: '12:00' }],
    [today.getDate() + 15]: [{ label: '9:00 AM – 11:00 AM', start: '09:00', end: '11:00' }],
  }

  for (const [d, s] of Object.entries(slots)) {
    const day = Number(d)
    if (day > 0 && day <= 31) {
      const key = `${y}-${m}-${day}`
      result[key] = s
    }
  }
  return result
})()

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

// ─── Steps ────────────────────────────────────────────────────────────────────

type Step = 'calendar' | 'timeslot' | 'note' | 'signin' | 'done'

// ─── Component ────────────────────────────────────────────────────────────────

export function BookingRequestModal({
  photographerName,
  username,
  onClose,
}: {
  photographerName: string
  username: string
  onClose: () => void
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [note, setNote] = useState('')
  const [step, setStep] = useState<Step>('calendar')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const dayKey = (d: number) => `${viewYear}-${viewMonth}-${d}`
  const slotsForDay = (d: number) => MOCK_AVAILABLE_DAYS[dayKey(d)] ?? []
  const isAvailable = (d: number) => slotsForDay(d).length > 0
  const isPast = (d: number) =>
    new Date(viewYear, viewMonth, d) <= new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function selectDay(d: number) {
    if (isPast(d) || !isAvailable(d)) return
    setSelectedDay(d)
    setSelectedSlot(null)
    setStep('timeslot')
  }

  function selectSlot(slot: TimeSlot) {
    setSelectedSlot(slot)
    setStep('note')
  }

  function submitRequest() {
    setStep('signin')
  }

  function signIn() {
    setStep('done')
  }

  const selectedDateLabel = selectedDay
    ? `${MONTHS[viewMonth]} ${selectedDay}, ${viewYear}`
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
          <div className="flex items-center gap-2">
            {(step === 'timeslot' || step === 'note') && (
              <button
                onClick={() => setStep(step === 'note' ? 'timeslot' : 'calendar')}
                className="p-1 rounded-lg hover:bg-ink-50 text-ink-400 mr-1"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <p className="font-semibold text-ink text-sm">
              {step === 'calendar' && 'Choose a date'}
              {step === 'timeslot' && 'Choose a time'}
              {step === 'note' && 'Add a note'}
              {step === 'signin' && 'Sign in to request'}
              {step === 'done' && 'Request sent!'}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Progress dots */}
        {step !== 'done' && (
          <div className="flex items-center gap-1.5 px-5 pt-3 pb-1">
            {(['calendar', 'timeslot', 'note', 'signin'] as Step[]).map(s => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-all ${
                s === step ? 'bg-ink' :
                ['calendar','timeslot','note','signin'].indexOf(s) < ['calendar','timeslot','note','signin'].indexOf(step) ? 'bg-ink-300' :
                'bg-ink-100'
              }`} />
            ))}
          </div>
        )}

        <div className="px-5 pb-5 pt-3 max-h-[70vh] overflow-y-auto">

          {/* ── Step 1: Calendar ───────────────────────────────────────── */}
          {step === 'calendar' && (
            <div className="space-y-4">
              <p className="text-xs text-ink-400">Select an available date for <span className="font-semibold text-ink">{photographerName}</span></p>

              {/* Month nav */}
              <div className="flex items-center justify-between">
                <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-ink-50 transition-colors">
                  <ChevronLeft className="w-4 h-4 text-ink-400" />
                </button>
                <p className="font-semibold text-ink text-sm">{MONTHS[viewMonth]} {viewYear}</p>
                <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-ink-50 transition-colors">
                  <ChevronRight className="w-4 h-4 text-ink-400" />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7">
                {DAYS_SHORT.map(d => (
                  <div key={d} className="text-center text-[10px] font-semibold text-ink-300 uppercase py-1">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const d = i + 1
                  const past = isPast(d)
                  const avail = isAvailable(d) && !past
                  const tod = isToday(d)
                  return (
                    <button
                      key={d}
                      onClick={() => selectDay(d)}
                      disabled={past || !avail}
                      className={[
                        'aspect-square rounded-xl text-xs font-medium border transition-all relative',
                        past ? 'text-ink-200 border-transparent cursor-default' : '',
                        avail ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 cursor-pointer' : '',
                        !past && !avail ? 'text-ink-300 border-ink-50 cursor-default' : '',
                        tod ? 'ring-2 ring-ink ring-offset-1' : '',
                      ].join(' ')}
                    >
                      {d}
                      {avail && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-400" />}
                    </button>
                  )
                })}
              </div>

              {/* Legend */}
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-xs text-ink-400">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-ink-200" />
                  <span className="text-xs text-ink-400">Unavailable</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Time slot ──────────────────────────────────────── */}
          {step === 'timeslot' && selectedDay && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-ink-400">
                <Calendar className="w-4 h-4" />
                <span>{selectedDateLabel}</span>
              </div>
              <p className="text-xs text-ink-400">Pick a time slot that works for you</p>
              <div className="space-y-2">
                {slotsForDay(selectedDay).map(slot => (
                  <button
                    key={slot.label}
                    onClick={() => selectSlot(slot)}
                    className="w-full flex items-center gap-3 p-4 border border-ink-100 rounded-2xl hover:border-ink hover:bg-ink-50 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-ink-50 group-hover:bg-ink-100 flex items-center justify-center flex-shrink-0 transition-colors">
                      <Clock className="w-4 h-4 text-ink-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-ink">{slot.label}</p>
                      <p className="text-xs text-ink-300">Available · {selectedDateLabel}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-ink-200 group-hover:text-ink-400 ml-auto transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Step 3: Note ───────────────────────────────────────────── */}
          {step === 'note' && selectedDay && selectedSlot && (
            <div className="space-y-4">
              {/* Booking summary */}
              <div className="bg-ink-50 rounded-2xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-ink-400 flex-shrink-0" />
                  <span className="font-medium text-ink">{selectedDateLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-ink-400 flex-shrink-0" />
                  <span className="font-medium text-ink">{selectedSlot.label}</span>
                </div>
                <div className="text-xs text-ink-400 pt-1">with <span className="font-medium text-ink">{photographerName}</span></div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-ink-400 uppercase tracking-widest">
                    Message to photographer <span className="text-ink-300 font-normal normal-case">(optional)</span>
                  </label>
                  {note.length > PLATFORM_CONFIG.max_booking_description_length - 100 && (
                    <span className={`text-xs ${note.length >= PLATFORM_CONFIG.max_booking_description_length ? 'text-red-500' : 'text-amber-500'}`}>
                      {note.length}/{PLATFORM_CONFIG.max_booking_description_length}
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={note}
                  onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_booking_description_length) setNote(e.target.value) }}
                  maxLength={PLATFORM_CONFIG.max_booking_description_length}
                  placeholder="Tell them what you're looking for — type of session, location ideas, special requests…"
                  className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 resize-none transition-all"
                />
              </div>

              <button
                onClick={submitRequest}
                className="w-full bg-ink text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-ink-800 transition-colors text-sm"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* ── Step 4: Sign in ────────────────────────────────────────── */}
          {step === 'signin' && (
            <div className="space-y-4">
              <p className="text-xs text-ink-400 leading-relaxed">
                Create a free account (or sign in) to send your booking request. The photographer will get notified right away.
              </p>

              {/* Booking summary chip */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <div className="text-xs text-emerald-700">
                  <span className="font-semibold">{selectedDateLabel}</span> · {selectedSlot?.label}
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all"
                />
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Password"
                  className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all"
                />
              </div>

              <button
                onClick={signIn}
                className="w-full bg-ink text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-ink-800 transition-colors text-sm"
              >
                <LogIn className="w-4 h-4" /> Sign in & send request
              </button>

              <div className="text-center">
                <span className="text-xs text-ink-300">No account? </span>
                <button onClick={signIn} className="text-xs font-semibold text-ink hover:underline">Create one free</button>
              </div>
            </div>
          )}

          {/* ── Step 5: Done ───────────────────────────────────────────── */}
          {step === 'done' && (
            <div className="flex flex-col items-center text-center py-4 gap-4">
              <div className="w-16 h-16 rounded-2xl bg-ink flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="font-semibold text-ink text-base mb-1">Request sent!</p>
                <p className="text-ink-400 text-sm leading-relaxed">
                  <span className="font-medium text-ink">{photographerName}</span> will review your request and respond shortly.
                  The time slot is now marked as <span className="font-medium text-amber-600">tentative</span> on their calendar.
                </p>
              </div>
              <div className="bg-ink-50 rounded-2xl p-4 w-full space-y-2 text-left">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-ink-400 flex-shrink-0" />
                  <span className="font-medium text-ink">{selectedDateLabel}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-ink-400 flex-shrink-0" />
                  <span className="font-medium text-ink">{selectedSlot?.label}</span>
                </div>
                <p className="text-xs text-ink-400 pt-1">You can track this in your client dashboard under <span className="font-medium text-ink">My Bookings</span>.</p>
              </div>
              <button
                onClick={onClose}
                className="w-full border border-ink-100 rounded-xl py-2.5 text-sm font-medium text-ink-500 hover:bg-ink-50 transition-colors"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
