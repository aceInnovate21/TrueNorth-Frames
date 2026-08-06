'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Clock, Plus, Save, Trash2, X } from 'lucide-react'
import { useUnsavedGuard } from '@/components/unsaved-changes'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface TimeSlot {
  id: string
  label: string    // e.g. "9:00 AM – 11:00 AM"
  start: string    // "09:00"
  end: string      // "11:00"
  maxClients: number
}

export interface DaySchedule {
  slots: TimeSlot[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const HOUR_OPTIONS: string[] = []
for (let h = 6; h <= 22; h++) {
  HOUR_OPTIONS.push(`${String(h).padStart(2, '0')}:00`)
  HOUR_OPTIONS.push(`${String(h).padStart(2, '0')}:30`)
}

function fmt24to12(t: string) {
  const [hh, mm] = t.split(':').map(Number)
  const ampm = hh >= 12 ? 'PM' : 'AM'
  const h = hh % 12 || 12
  return `${h}:${String(mm).padStart(2, '0')} ${ampm}`
}

function slotLabel(start: string, end: string) {
  return `${fmt24to12(start)} – ${fmt24to12(end)}`
}

// ─── SlotRow ─────────────────────────────────────────────────────────────────

function SlotRow({
  slot,
  onUpdate,
  onRemove,
}: {
  slot: TimeSlot
  onUpdate: (updated: TimeSlot) => void
  onRemove: () => void
}) {
  return (
    <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-2.5">
      <Clock className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />

      <select
        value={slot.start}
        onChange={e => onUpdate({ ...slot, start: e.target.value, label: slotLabel(e.target.value, slot.end) })}
        className="border border-ink-100 rounded-lg px-2 py-1.5 text-xs text-ink bg-white outline-none focus:border-ink"
      >
        {HOUR_OPTIONS.map(o => <option key={o} value={o}>{fmt24to12(o)}</option>)}
      </select>

      <span className="text-xs text-ink-300">to</span>

      <select
        value={slot.end}
        onChange={e => onUpdate({ ...slot, end: e.target.value, label: slotLabel(slot.start, e.target.value) })}
        className="border border-ink-100 rounded-lg px-2 py-1.5 text-xs text-ink bg-white outline-none focus:border-ink"
      >
        {HOUR_OPTIONS.map(o => <option key={o} value={o}>{fmt24to12(o)}</option>)}
      </select>

      <span className="text-xs text-ink-300 ml-1">max</span>
      <select
        value={slot.maxClients}
        onChange={e => onUpdate({ ...slot, maxClients: Number(e.target.value) })}
        className="border border-ink-100 rounded-lg px-2 py-1.5 text-xs text-ink bg-white outline-none focus:border-ink w-14"
      >
        {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} client{n > 1 ? 's' : ''}</option>)}
      </select>

      <button
        onClick={onRemove}
        className="ml-auto p-1 rounded-lg hover:bg-red-50 text-ink-300 hover:text-red-500 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

// ─── DayPanel ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function DayPanel({
  dayIndex,
  schedule,
  onChange,
}: {
  dayIndex: number
  schedule: DaySchedule
  onChange: (s: DaySchedule) => void
}) {
  function addSlot() {
    const id = `slot-${Date.now()}`
    onChange({
      slots: [
        ...schedule.slots,
        { id, start: '09:00', end: '11:00', maxClients: 1, label: slotLabel('09:00', '11:00') },
      ],
    })
  }

  function updateSlot(id: string, updated: TimeSlot) {
    onChange({ slots: schedule.slots.map(s => s.id === id ? updated : s) })
  }

  function removeSlot(id: string) {
    onChange({ slots: schedule.slots.filter(s => s.id !== id) })
  }

  return (
    <div className="border border-ink-100 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">{DAY_NAMES[dayIndex]}</p>
        <button
          onClick={addSlot}
          className="flex items-center gap-1 text-xs font-medium text-ink-400 hover:text-ink border border-ink-100 hover:border-ink-300 rounded-lg px-2.5 py-1.5 transition-all"
        >
          <Plus className="w-3 h-3" /> Add slot
        </button>
      </div>

      {schedule.slots.length === 0 ? (
        <p className="text-xs text-ink-300 italic">No slots — unavailable this day</p>
      ) : (
        <div className="space-y-2">
          {schedule.slots.map(slot => (
            <SlotRow
              key={slot.id}
              slot={slot}
              onUpdate={u => updateSlot(slot.id, u)}
              onRemove={() => removeSlot(slot.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

export type WeeklySchedule = Record<number, DaySchedule> // 0=Sun … 6=Sat

export function AvailabilityTimeSlots({
  schedule,
  setSchedule,
  onSave,
}: {
  schedule: WeeklySchedule
  setSchedule: React.Dispatch<React.SetStateAction<WeeklySchedule>>
  onSave?: (schedule: WeeklySchedule) => Promise<void>
}) {
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [activeDays, setActiveDays] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]))

  // Track unsaved edits so the dashboard can warn before the user navigates
  // away. `dirty` flips true on any user edit and back to false on save/discard.
  // While clean, we keep a baseline snapshot in sync with the incoming props so
  // that "discard" can revert to the last persisted schedule — including the
  // schedule the parent loads from the server after mount.
  const [dirty, setDirty] = useState(false)
  const baseline = useRef<{ schedule: WeeklySchedule; activeDays: Set<number> }>({ schedule, activeDays })
  useEffect(() => {
    if (!dirty) baseline.current = { schedule, activeDays }
  }, [schedule, activeDays, dirty])

  useUnsavedGuard('availability-time-slots', {
    isDirty: () => dirty,
    save: async () => { await handleSave() },
    discard: () => {
      setSchedule(baseline.current.schedule)
      setActiveDays(new Set(baseline.current.activeDays))
      setDirty(false)
    },
  })

  function toggleDay(d: number) {
    setDirty(true)
    setActiveDays(prev => {
      const next = new Set(prev)
      if (next.has(d)) {
        next.delete(d)
        setSchedule(s => { const n = { ...s }; delete n[d]; return n })
      } else {
        next.add(d)
        setSchedule(s => ({ ...s, [d]: s[d] ?? { slots: [] } }))
      }
      return next
    })
  }

  function changeDay(d: number, s: DaySchedule) {
    setDirty(true)
    setSchedule(prev => ({ ...prev, [d]: s }))
  }

  async function handleSave() {
    setSaving(true)
    if (onSave) {
      await onSave(schedule)
    } else {
      await new Promise(r => setTimeout(r, 700))
    }
    setDirty(false)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const totalSlots = Object.values(schedule).reduce((a, d) => a + d.slots.length, 0)

  return (
    <div className="space-y-6">

      {/* Day toggles */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-3">Active days</p>
        <div className="flex gap-2 flex-wrap">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
            <button
              key={d}
              onClick={() => toggleDay(i)}
              className={`w-10 h-10 rounded-xl text-xs font-semibold border transition-all ${
                activeDays.has(i)
                  ? 'bg-ink text-white border-ink'
                  : 'bg-white text-ink-400 border-ink-100 hover:border-ink-300'
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      {/* Per-day slot panels */}
      {[0, 1, 2, 3, 4, 5, 6].filter(d => activeDays.has(d)).map(d => (
        <DayPanel
          key={d}
          dayIndex={d}
          schedule={schedule[d] ?? { slots: [] }}
          onChange={s => changeDay(d, s)}
        />
      ))}

      {activeDays.size === 0 && (
        <p className="text-sm text-ink-300 text-center py-4">Select at least one active day to add time slots.</p>
      )}

      {/* Summary */}
      {totalSlots > 0 && (
        <div className="bg-emerald-50 rounded-xl px-4 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <p className="text-sm text-emerald-700">
            <span className="font-semibold">{totalSlots} time slot{totalSlots !== 1 ? 's' : ''}</span> across{' '}
            {Object.keys(schedule).length} day{Object.keys(schedule).length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ${
          saved
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : 'bg-ink text-white hover:bg-ink-800'
        }`}
      >
        {saving ? (
          <>
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            Saving…
          </>
        ) : saved ? (
          <><CheckCircle2 className="w-4 h-4" /> Saved!</>
        ) : (
          <><Save className="w-4 h-4" /> Save time slots</>
        )}
      </button>
    </div>
  )
}
