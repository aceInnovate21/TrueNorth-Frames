// Date helpers anchored to the marketplace timezone.
//
// The platform serves Edmonton, but code runs on UTC servers (Vercel) and on
// clients in arbitrary timezones. Using `new Date().toISOString().slice(0,10)`
// yields the *UTC* date, which rolls over to "tomorrow" during Edmonton
// evenings — dropping today's availability and blocking same-day bookings.
// These helpers always return the calendar date as seen in Edmonton.

export const MARKET_TZ = 'America/Edmonton'

const YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: MARKET_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Today's date as "YYYY-MM-DD" in the marketplace timezone. */
export function todayInMarket(): string {
  return YMD.format(new Date())
}

/** The date `days` from now as "YYYY-MM-DD" in the marketplace timezone. */
export function daysFromTodayInMarket(days: number): string {
  return YMD.format(new Date(Date.now() + days * 24 * 60 * 60 * 1000))
}
