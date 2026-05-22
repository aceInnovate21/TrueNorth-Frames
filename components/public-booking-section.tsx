'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react'
import { BookingRequestModal } from './booking-request-modal'

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS_LIST = ['January','February','March','April','May','June','July','August','September','October','November','December']

// Available days with time slots (green), busy (red), no data = neutral
function buildMockAvailability() {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const avail: Record<string, 'available' | 'busy'> = {}
  const availDays = [
    today.getDate() + 1,
    today.getDate() + 3,
    today.getDate() + 5,
    today.getDate() + 7,
    today.getDate() + 8,
    today.getDate() + 12,
    today.getDate() + 14,
    today.getDate() + 15,
  ].filter(d => d > 0 && d <= 31)
  const busyDays = [
    today.getDate() + 2,
    today.getDate() + 6,
    today.getDate() + 9,
    today.getDate() + 13,
  ].filter(d => d > 0 && d <= 31)
  availDays.forEach(d => { avail[`${y}-${m}-${d}`] = 'available' })
  busyDays.forEach(d => { avail[`${y}-${m}-${d}`] = 'busy' })
  return avail
}

export function PublicBookingSection({
  photographerName,
  username,
  blockedDate,
}: {
  photographerName: string
  username: string
  blockedDate?: string
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [showModal, setShowModal] = useState(false)
  const availability = buildMockAvailability()

  // Mark the client's pending booking date as busy so it doesn't appear available
  if (blockedDate) {
    const parts = blockedDate.split(' ')
    if (parts.length >= 3) {
      const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
      const m = months.indexOf(parts[0])
      const d = parseInt(parts[1].replace(',', ''))
      const y = parseInt(parts[2])
      if (m >= 0 && d > 0 && y > 0) {
        availability[`${y}-${m}-${d}`] = 'busy'
      }
    }
  }

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function prev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function next() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const isToday = (d: number) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
  const isPast = (d: number) =>
    new Date(viewYear, viewMonth, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const status = (d: number) => availability[`${viewYear}-${viewMonth}-${d}`] ?? null

  return (
    <>
      <div>
        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={prev} className="p-1.5 rounded-lg hover:bg-ink-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-ink-400" />
          </button>
          <p className="font-semibold text-ink text-sm">{MONTHS_LIST[viewMonth]} {viewYear}</p>
          <button onClick={next} className="p-1.5 rounded-lg hover:bg-ink-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS_SHORT.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-ink-300 uppercase py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const s = status(day)
            const past = isPast(day)
            const tod = isToday(day)
            return (
              <div
                key={day}
                className={[
                  'aspect-square rounded-lg text-xs font-medium flex items-center justify-center border',
                  past ? 'text-ink-200 border-transparent' : '',
                  !past && !s ? 'text-ink-500 border-ink-100' : '',
                  s === 'available' && !past ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : '',
                  s === 'busy' && !past ? 'bg-red-50 text-red-500 border-red-100' : '',
                  tod ? 'ring-2 ring-ink ring-offset-1' : '',
                ].join(' ')}
              >
                {day}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 mt-4 mb-3">
          {[
            { color: 'bg-emerald-400', label: 'Available' },
            { color: 'bg-red-400', label: 'Busy' },
            { color: 'bg-ink-100', label: 'No data' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
              <span className="text-xs text-ink-400">{l.label}</span>
            </div>
          ))}
        </div>

        {blockedDate && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mb-4">
            <CalendarClock className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700"><span className="font-semibold">{blockedDate}</span> is held pending your current request. Pick another date to book a different occasion.</p>
          </div>
        )}

        {/* Book button */}
        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-ink text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-ink-800 transition-colors text-sm"
        >
          <CalendarClock className="w-4 h-4" />
          {blockedDate ? 'Book another occasion' : 'Request a booking'}
        </button>
        <p className="text-center text-ink-300 text-xs mt-2">Free to request · No booking fees</p>
      </div>

      {showModal && (
        <BookingRequestModal
          photographerName={photographerName}
          username={username}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
