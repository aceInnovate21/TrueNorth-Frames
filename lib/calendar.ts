// Calendar event helpers for the booking feature.
//
// Produces "Add to Calendar" targets from a booking without any OAuth or API
// keys: a Google Calendar template URL, an Outlook Web URL, and RFC-5545 .ics
// text (for Apple/iPhone Calendar, Outlook desktop, and everything else).
//
// Sessions happen in Edmonton, so timed events are pinned to America/Edmonton.
// Times are emitted as "floating" local wall-clock time (no trailing Z), which
// every major calendar renders at the intended local hour.

const TIMEZONE = 'America/Edmonton'

export interface CalendarEvent {
  /** Event title — the "what" (+ who). e.g. "Wedding Photography with Jane". */
  title: string
  /** Multi-line details — who/what plus the "via TrueNorth Frames" footer. */
  description: string
  /** Free-text location, or empty. */
  location: string
  /** Start date as YYYY-MM-DD. */
  startDate: string
  /** End date as YYYY-MM-DD (inclusive). Defaults to startDate. */
  endDate?: string | null
  /** The booking's time-slot label, e.g. "Morning (8am – 11am)". */
  timeSlot?: string | null
}

interface ResolvedTimes {
  allDay: boolean
  start: string // YYYYMMDD or YYYYMMDDTHHmmss
  end: string   // exclusive for all-day / Google
}

const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: string) => d.replace(/-/g, '') // YYYY-MM-DD -> YYYYMMDD

/** Advance a YYYY-MM-DD string by n days (all-day DTEND is exclusive). */
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * Parse a time-slot label like "Afternoon (2pm – 5pm)" into 24h start/end.
 * Returns null when the slot has no parseable range (e.g. "Flexible").
 */
function parseTimeSlot(slot?: string | null): { start: [number, number]; end: [number, number] } | null {
  if (!slot) return null
  // Matches "8am – 11am" and "10:00 AM – 12:00 PM" alike.
  const re = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*[–-]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i
  const m = slot.match(re)
  if (!m) return null
  const to24 = (h: number, mer: string) => {
    const ap = mer.toLowerCase()
    if (ap === 'am') return h === 12 ? 0 : h
    return h === 12 ? 12 : h + 12
  }
  const start: [number, number] = [to24(parseInt(m[1], 10), m[3]), m[2] ? parseInt(m[2], 10) : 0]
  const end: [number, number] = [to24(parseInt(m[4], 10), m[6]), m[5] ? parseInt(m[5], 10) : 0]
  return { start, end }
}

function resolveTimes(ev: CalendarEvent): ResolvedTimes {
  const end = ev.endDate && ev.endDate > ev.startDate ? ev.endDate : ev.startDate
  const isRange = end !== ev.startDate
  const slot = parseTimeSlot(ev.timeSlot)

  // Multi-day, or an unparseable slot -> all-day event.
  if (isRange || !slot) {
    return {
      allDay: true,
      start: ymd(ev.startDate),
      end: ymd(addDays(end, 1)), // DTEND / Google end is exclusive
    }
  }

  const startLocal = `${ymd(ev.startDate)}T${pad(slot.start[0])}${pad(slot.start[1])}00`
  const endLocal = `${ymd(ev.startDate)}T${pad(slot.end[0])}${pad(slot.end[1])}00`
  return { allDay: false, start: startLocal, end: endLocal }
}

/** A Google Calendar "create event" URL, prefilled. */
export function googleCalendarUrl(ev: CalendarEvent): string {
  const t = resolveTimes(ev)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: ev.title,
    details: ev.description,
    location: ev.location,
    dates: `${t.start}/${t.end}`,
  })
  if (!t.allDay) params.set('ctz', TIMEZONE)
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

/** An Outlook Web (outlook.com) "create event" URL, prefilled. */
export function outlookCalendarUrl(ev: CalendarEvent): string {
  const t = resolveTimes(ev)
  const toIso = (s: string, exclusiveAllDay = false) => {
    if (t.allDay) {
      // s is YYYYMMDD; Outlook wants an ISO date.
      const raw = exclusiveAllDay ? s : s
      return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
    }
    // YYYYMMDDTHHmmss -> YYYY-MM-DDTHH:mm:ss
    return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}T${s.slice(9, 11)}:${s.slice(11, 13)}:${s.slice(13, 15)}`
  }
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: ev.title,
    body: ev.description,
    location: ev.location,
    startdt: toIso(t.start),
    enddt: toIso(t.end, true),
  })
  if (t.allDay) params.set('allday', 'true')
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
}

/** Escape a text value per RFC 5545 (commas, semicolons, newlines). */
function icsEscape(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** RFC-5545 .ics text for one event (Apple/iPhone, Outlook desktop, etc.). */
export function icsContent(ev: CalendarEvent, uidSeed = ''): string {
  const t = resolveTimes(ev)
  const stamp =
    new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const uid = `${(uidSeed || Math.random().toString(36).slice(2))}@thetruenorthframes.com`

  const dtLines = t.allDay
    ? [`DTSTART;VALUE=DATE:${t.start}`, `DTEND;VALUE=DATE:${t.end}`]
    : [`DTSTART;TZID=${TIMEZONE}:${t.start}`, `DTEND;TZID=${TIMEZONE}:${t.end}`]

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//TrueNorth Frames//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    ...dtLines,
    `SUMMARY:${icsEscape(ev.title)}`,
    `DESCRIPTION:${icsEscape(ev.description)}`,
    ev.location ? `LOCATION:${icsEscape(ev.location)}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean)

  return lines.join('\r\n')
}

/**
 * Build the standard booking event description: who / what, then the
 * "Booked via TrueNorth Frames" footer.
 */
export function bookingDescription(opts: {
  photographerName?: string | null
  clientName?: string | null
  sessionType?: string | null
  timeSlot?: string | null
  note?: string | null
}): string {
  const parts: string[] = []
  if (opts.sessionType) parts.push(`Session: ${opts.sessionType}`)
  if (opts.photographerName) parts.push(`Photographer: ${opts.photographerName}`)
  if (opts.clientName) parts.push(`Client: ${opts.clientName}`)
  if (opts.timeSlot) parts.push(`Preferred time: ${opts.timeSlot}`)
  if (opts.note?.trim()) parts.push(`\nNotes: ${opts.note.trim()}`)
  parts.push('\nBooked via TrueNorth Frames')
  return parts.join('\n')
}
