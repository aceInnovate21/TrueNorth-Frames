'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS_LIST = ['January','February','March','April','May','June','July','August','September','October','November','December']

function buildMockAvailability() {
  const today = new Date()
  const y = today.getFullYear()
  const m = today.getMonth()
  const avail: Record<string, 'available' | 'busy'> = {}
  const availDays = [3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26]
  const busyDays  = [1, 7, 14, 20, 21, 28]
  availDays.forEach(d => { avail[`${y}-${m}-${d}`] = 'available' })
  busyDays.forEach(d => { avail[`${y}-${m}-${d}`] = 'busy' })
  return avail
}

export function PublicAvailabilityCalendar() {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const availability = buildMockAvailability()

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
    <div>
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="p-1.5 rounded-lg hover:bg-ink-50 transition-colors">
          <ChevronLeft className="w-4 h-4 text-ink-400" />
        </button>
        <p className="font-semibold text-ink text-sm">{MONTHS_LIST[viewMonth]} {viewYear}</p>
        <button onClick={next} className="p-1.5 rounded-lg hover:bg-ink-50 transition-colors">
          <ChevronRight className="w-4 h-4 text-ink-400" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-ink-300 uppercase py-1">{d}</div>
        ))}
      </div>

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
                s === 'busy' && !past ? 'bg-red-50 text-red-600 border-red-100' : '',
                tod ? 'ring-2 ring-ink ring-offset-1' : '',
              ].join(' ')}
            >
              {day}
            </div>
          )
        })}
      </div>

      <div className="flex gap-4 mt-4">
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
    </div>
  )
}
