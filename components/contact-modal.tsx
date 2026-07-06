'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  X, Calendar, MapPin, MessageSquare, ArrowRight, CheckCircle2,
  ChevronLeft, ChevronRight, Loader2, Package, Clock,
  ShieldCheck, BellRing, MessagesSquare, CheckCheck,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface AvailabilityDay {
  date: string   // YYYY-MM-DD
  status: string // available | busy | tentative
}

interface PackageOption {
  id: string
  name: string
  price: string | number
  billingType: string
}

interface ContactModalProps {
  photographerId: string
  photographerName: string
  username: string
  /** Pre-selected package (from package card button) */
  preselectedPackageId?: string | null
  /** Photographer availability from profile API */
  availability?: AvailabilityDay[]
  /** Packages list for the picker */
  packages?: PackageOption[]
  /** Render the trigger element */
  trigger: React.ReactNode
}

// ─── Time slot options ────────────────────────────────────────────────────────

const TIME_SLOTS = [
  'Morning (8am – 11am)',
  'Midday (11am – 2pm)',
  'Afternoon (2pm – 5pm)',
  'Evening (5pm – 8pm)',
  'Flexible / not sure yet',
]

// ─── Mini calendar ────────────────────────────────────────────────────────────

function buildCalendarMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay  = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()

  const days: Array<{ date: string; dayNum: number } | null> = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const dd = String(d).padStart(2, '0')
    const mm = String(month + 1).padStart(2, '0')
    days.push({ date: `${year}-${mm}-${dd}`, dayNum: d })
  }
  return days
}

const DOW_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July',
  'August','September','October','November','December']

function AvailCalendar({
  availability,
  selectedStart,
  selectedEnd,
  onSelect,
}: {
  availability: AvailabilityDay[]
  selectedStart: string | null
  selectedEnd: string | null
  onSelect: (date: string) => void
}) {
  const today = new Date()
  const [viewYear,  setViewYear]  = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const statusMap: Record<string, string> = {}
  for (const d of availability) statusMap[d.date] = d.status

  const todayStr = today.toISOString().slice(0, 10)
  const days = buildCalendarMonth(viewYear, viewMonth)
  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function dotColor(status: string) {
    if (status === 'available') return 'bg-emerald-400'
    if (status === 'tentative') return 'bg-amber-400'
    if (status === 'busy')      return 'bg-red-400'
    return ''
  }

  function dayClass(dateStr: string, isPast: boolean) {
    const isEndpoint = dateStr === selectedStart || (selectedEnd && dateStr === selectedEnd)
    const inRange = selectedStart && selectedEnd && dateStr > selectedStart && dateStr < selectedEnd
    if (isEndpoint)
      return 'bg-ink text-white font-bold ring-2 ring-ink ring-offset-1'
    if (inRange)
      return 'bg-ink-100 text-ink font-semibold cursor-pointer'
    if (isPast)
      return 'text-ink-200 cursor-not-allowed'
    return 'hover:bg-ink-100 text-ink cursor-pointer'
  }

  return (
    <div className="select-none">
      {/* Month nav */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={prevMonth}
          disabled={isCurrentMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 disabled:cursor-not-allowed hover:bg-ink-100"
        >
          <ChevronLeft className="w-4 h-4 text-ink" />
        </button>
        <span className="text-sm font-semibold text-ink">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-ink-100"
        >
          <ChevronRight className="w-4 h-4 text-ink" />
        </button>
      </div>

      {/* DOW header */}
      <div className="grid grid-cols-7 mb-1">
        {DOW_LABELS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-ink-300 py-1">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((cell, i) => {
          if (!cell) return <div key={`blank-${i}`} />
          const isPast = cell.date < todayStr
          const status = statusMap[cell.date]
          return (
            <button
              key={cell.date}
              type="button"
              disabled={isPast}
              onClick={() => !isPast && onSelect(cell.date)}
              className={`relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-all text-xs ${dayClass(cell.date, isPast)}`}
            >
              <span>{cell.dayNum}</span>
              {status && !isPast && (
                <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${dotColor(status)}`} />
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 pt-3 border-t border-ink-50 flex-wrap">
        <span className="flex items-center gap-1 text-[10px] text-ink-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Available
        </span>
        <span className="flex items-center gap-1 text-[10px] text-ink-400">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Tentative
        </span>
        <span className="flex items-center gap-1 text-[10px] text-ink-400">
          <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />Busy
        </span>
        <span className="text-[10px] text-ink-300 ml-auto">Tap a start then end date for multiple days</span>
      </div>
    </div>
  )
}

// ─── Draft storage helpers ────────────────────────────────────────────────────

const DRAFT_KEY = (photographerId: string) => `tnf_booking_draft_${photographerId}`

interface BookingDraft {
  packageId: string | null
  date: string | null
  timeSlot: string
  location: string
  message: string
  savedAt: number // timestamp — expire after 2 hours
}

function saveDraft(photographerId: string, draft: Omit<BookingDraft, 'savedAt'>) {
  try {
    localStorage.setItem(DRAFT_KEY(photographerId), JSON.stringify({ ...draft, savedAt: Date.now() }))
  } catch {}
}

function loadDraft(photographerId: string): BookingDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY(photographerId))
    if (!raw) return null
    const draft = JSON.parse(raw) as BookingDraft
    // Expire after 2 hours
    if (Date.now() - draft.savedAt > 2 * 60 * 60 * 1000) {
      localStorage.removeItem(DRAFT_KEY(photographerId))
      return null
    }
    return draft
  } catch { return null }
}

function clearDraft(photographerId: string) {
  try { localStorage.removeItem(DRAFT_KEY(photographerId)) } catch {}
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export function ContactModal({
  photographerId,
  photographerName,
  username,
  preselectedPackageId = null,
  availability = [],
  packages = [],
  trigger,
}: ContactModalProps) {
  const router = useRouter()

  const [open, setOpen]               = useState(false)
  const [selectedPkg, setSelectedPkg] = useState<string | null>(preselectedPackageId)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedEndDate, setSelectedEndDate] = useState<string | null>(null)
  const [timeSlot, setTimeSlot]       = useState(TIME_SLOTS[TIME_SLOTS.length - 1])
  const [location, setLocation]       = useState('')
  const [message, setMessage]         = useState('')
  const [submitting, setSubmitting]   = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const [authed, setAuthed]             = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [restoredFromDraft, setRestoredFromDraft] = useState(false)
  const [showSignInPrompt, setShowSignInPrompt] = useState(false)
  // Role & self-booking guards
  const [userRole, setUserRole]         = useState<'client' | 'photographer' | null>(null)
  const [isSelf, setIsSelf]             = useState(false)

  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // ── Fetch role + self-booking check for logged-in users ──────────────────────
  async function checkSession() {
    const { data } = await supabase.auth.getUser()
    const isAuthed = !!data.user
    setAuthed(isAuthed)

    if (isAuthed && data.user) {
      // Fetch role from users table
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single() as { data: { role: string } | null; error: unknown }
      const role = userData?.role as 'client' | 'photographer' | null
      setUserRole(role)

      // Check if this is the photographer's own profile
      if (role === 'photographer') {
        const { data: profile } = await supabase
          .from('photographer_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single() as { data: { id: string } | null; error: unknown }
        setIsSelf(profile?.id === photographerId)
      } else {
        setIsSelf(false)
      }
    } else {
      setUserRole(null)
      setIsSelf(false)
    }

    setCheckingAuth(false)
    return { isAuthed, user: data.user }
  }

  // ── On mount: check auth + detect pending draft (returned from login) ────────
  useEffect(() => {
    checkSession().then(({ isAuthed, user }) => {
      // If user just came back from login and has a saved draft, auto-open + submit
      if (isAuthed && user) {
        const draft = loadDraft(photographerId)
        if (draft && draft.message.trim() && draft.date) {
          clearDraft(photographerId)
          setSelectedPkg(draft.packageId)
          setSelectedDate(draft.date)
          setTimeSlot(draft.timeSlot)
          setLocation(draft.location)
          setMessage(draft.message)
          setRestoredFromDraft(true)
          setOpen(true)
          setTimeout(() => {
            setSubmitting(true)
            setSubmitError('')
          }, 50)
        }
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photographerId])

  // ── Reset when modal opens manually (not from draft restore) ─────────────────
  useEffect(() => {
    if (!open) { setRestoredFromDraft(false); return }
    if (restoredFromDraft) return // skip reset — data was just restored

    setSelectedPkg(preselectedPackageId)
    setSelectedDate(null)
    setSelectedEndDate(null)
    setTimeSlot(TIME_SLOTS[TIME_SLOTS.length - 1])
    setLocation('')
    setMessage('')
    setSubmitting(false)
    setSubmitError('')
    setSubmitted(false)
    setConversationId(null)
    setShowSignInPrompt(false)

    // Refresh auth + role on each manual open
    setCheckingAuth(true)
    checkSession()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // ── Escape key ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // ── Fire API call when submitting=true and authed ─────────────────────────────
  useEffect(() => {
    if (!submitting || !authed || submitted) return
    if (!selectedDate || !message.trim()) { setSubmitting(false); return }
    doSubmit()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, authed])

  async function doSubmit() {
    try {
      const pkg = packages.find(p => p.id === selectedPkg)
      const res = await fetch('/api/client/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photographer_id: photographerId,
          package_id:      selectedPkg ?? null,
          occasion:        pkg?.name ?? 'Photography session',
          description:     message.trim(),
          billing_type:    pkg?.billingType ?? 'package',
          billing_detail:  null,
          requested_date:  selectedDate,
          requested_end_date: selectedEndDate,
          time_slot:       timeSlot,
          location_note:   location.trim() || null,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Something went wrong. Please try again.')
      }

      const resData = await res.json()
      setConversationId(resData.conversation_id ?? null)
      setSubmitted(true)
    } catch (err: any) {
      setSubmitError(err.message ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleTriggerClick() {
    setRestoredFromDraft(false)
    setOpen(true)
  }

  const firstName = photographerName.split(' ')[0]

  const modalContent = open ? (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg overflow-hidden flex flex-col"
        style={{
          maxHeight: 'calc(100dvh - 0px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-50 flex-shrink-0">
          <div>
            <p className="font-semibold text-ink text-base leading-tight">
              {showSignInPrompt ? 'Almost there' : isSelf ? 'Your profile' : userRole === 'photographer' ? 'Account type' : 'Request a booking'}
            </p>
            <p className="text-ink-400 text-xs mt-0.5">
              {showSignInPrompt ? 'Sign in to send your request' : isSelf ? `@${username}` : `with ${photographerName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="w-8 h-8 rounded-full bg-ink-50 hover:bg-ink-100 flex items-center justify-center transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-5 py-5 space-y-5">

            {/* ── Sign-in prompt interstitial ── */}
            {showSignInPrompt ? (
              <div className="flex flex-col gap-5">
                {/* Back button */}
                <button
                  type="button"
                  onClick={() => setShowSignInPrompt(false)}
                  className="flex items-center gap-1.5 text-ink-400 hover:text-ink text-xs font-medium transition-colors -mb-1 w-fit"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Back to form
                </button>

                {/* Saved confirmation banner */}
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Your request is saved</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Sign in and it'll be sent automatically.</p>
                  </div>
                </div>

                {/* Headline */}
                <div className="text-center px-2">
                  <p className="font-serif text-xl font-bold text-ink leading-snug">
                    One free account.<br />All your bookings in one place.
                  </p>
                  <p className="text-ink-400 text-sm mt-2">
                    Takes 30 seconds. No credit card. No spam. Ever.
                  </p>
                </div>

                {/* Value props */}
                <div className="space-y-3">
                  {[
                    {
                      Icon: BellRing,
                      title: 'Instant reply notifications',
                      desc: `Get notified the moment ${firstName} responds — no refreshing needed.`,
                    },
                    {
                      Icon: MessagesSquare,
                      title: 'One conversation thread',
                      desc: 'All messages, booking details and updates live in one tidy chat.',
                    },
                    {
                      Icon: ShieldCheck,
                      title: 'Zero spam guarantee',
                      desc: 'We never sell your info or send marketing emails. Period.',
                    },
                  ].map(({ Icon, title, desc }) => (
                    <div key={title} className="flex items-start gap-3 bg-ink-50 rounded-2xl px-4 py-3">
                      <div className="w-8 h-8 rounded-xl bg-white border border-ink-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Icon className="w-4 h-4 text-ink" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ink">{title}</p>
                        <p className="text-xs text-ink-400 mt-0.5 leading-relaxed">{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
                    setOpen(false)
                  }}
                  className="w-full bg-ink hover:bg-ink-800 text-white font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  Sign in to send your request <ArrowRight className="w-4 h-4" />
                </button>

                <p className="text-center text-xs text-ink-300 -mt-2">
                  No account yet?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      router.push(`/signup?redirect=${encodeURIComponent(window.location.pathname)}`)
                      setOpen(false)
                    }}
                    className="text-ink font-semibold underline underline-offset-2 hover:text-ink-600 transition-colors"
                  >
                    Create one free
                  </button>
                </p>
              </div>

            ) : checkingAuth ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
              </div>

            ) : isSelf ? (
              /* ── Self-booking guard ── */
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4 px-2">
                <div className="w-14 h-14 rounded-2xl bg-ink-50 flex items-center justify-center">
                  <span className="text-2xl">🪞</span>
                </div>
                <div>
                  <p className="font-semibold text-ink text-base">That's your own profile</p>
                  <p className="text-ink-400 text-sm mt-1.5 leading-relaxed">
                    You can't send a booking request to yourself. Share your profile link with clients instead.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full px-5 py-2.5 border border-ink-100 hover:bg-ink-50 text-ink text-sm font-medium rounded-xl transition-colors"
                >
                  Close
                </button>
              </div>

            ) : userRole === 'photographer' ? (
              /* ── Photographer role guard ── */
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4 px-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                  <span className="text-2xl">📷</span>
                </div>
                <div>
                  <p className="font-semibold text-ink text-base">You're logged in as a photographer</p>
                  <p className="text-ink-400 text-sm mt-1.5 leading-relaxed">
                    Booking requests can only be sent from a client account. Sign in with a different account to continue.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
                    setOpen(false)
                  }}
                  className="w-full bg-ink hover:bg-ink-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  Sign in with a client account <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="w-full px-5 py-2 text-ink-400 hover:text-ink text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>

            ) : submitting && !submitted ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
                <p className="text-ink-400 text-sm">Sending your request…</p>
              </div>

            ) : submitted ? (
              /* ── Success ── */
              <div className="flex flex-col items-center justify-center py-10 text-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                  <p className="font-semibold text-ink text-base">Booking request sent!</p>
                  <p className="text-ink-400 text-sm mt-1 leading-relaxed">
                    {firstName} will be notified and will get back to you soon.
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full mt-2">
                  {conversationId && (
                    <button
                      type="button"
                      onClick={() => { setOpen(false); router.push(`/messages?conv=${conversationId}`) }}
                      className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-ink hover:bg-ink-800 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Go to conversation <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="w-full px-5 py-2.5 text-ink-400 hover:text-ink text-sm transition-colors"
                  >
                    Stay here
                  </button>
                </div>
              </div>

            ) : (
              /* ── Main form ── */
              <form onSubmit={e => {
                e.preventDefault()
                if (!selectedDate) { setSubmitError('Please pick an anticipated date.'); return }
                if (!message.trim()) { setSubmitError('Please add a message.'); return }
                if (!authed) {
                  // Save draft first, then show the sign-in prompt screen
                  saveDraft(photographerId, {
                    packageId: selectedPkg,
                    date: selectedDate,
                    timeSlot,
                    location,
                    message,
                  })
                  setShowSignInPrompt(true)
                  return
                }
                setSubmitting(true)
                setSubmitError('')
              }} className="space-y-5">

                {/* Package picker */}
                {packages.length > 0 && (
                  <div>
                    <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                      <Package className="w-3 h-3" />Package (optional)
                    </label>
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedPkg(null)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-all ${
                          selectedPkg === null
                            ? 'border-ink bg-ink-50 font-semibold text-ink'
                            : 'border-ink-100 text-ink-400 hover:border-ink-300'
                        }`}
                      >
                        No specific package
                      </button>
                      {packages.map(pkg => (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => setSelectedPkg(pkg.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-all flex items-center justify-between gap-2 ${
                            selectedPkg === pkg.id
                              ? 'border-ink bg-ink-50 font-semibold text-ink'
                              : 'border-ink-100 text-ink-400 hover:border-ink-300'
                          }`}
                        >
                          <span className="truncate">{pkg.name}</span>
                          <span className="flex-shrink-0 text-xs font-semibold text-ink">
                            ${pkg.price}/{pkg.billingType === 'hourly' ? 'hr' : 'session'}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Calendar */}
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Anticipated date(s) <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <div className="border border-ink-100 rounded-xl p-3 bg-white">
                    <AvailCalendar
                      availability={availability}
                      selectedStart={selectedDate}
                      selectedEnd={selectedEndDate}
                      onSelect={(date) => {
                        // Range state machine: first tap = start, second = end.
                        if (!selectedDate || selectedEndDate) {
                          setSelectedDate(date); setSelectedEndDate(null)
                        } else if (date < selectedDate) {
                          setSelectedDate(date); setSelectedEndDate(null)
                        } else if (date > selectedDate) {
                          setSelectedEndDate(date)
                        }
                        // tapping the same start again keeps it a single day
                      }}
                    />
                  </div>
                  {selectedDate && (() => {
                    const fmt = (s: string) => new Date(s + 'T00:00:00').toLocaleDateString('en-CA', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
                    const nDays = selectedEndDate
                      ? Math.round((new Date(selectedEndDate).getTime() - new Date(selectedDate).getTime()) / 86400000) + 1
                      : 1
                    return (
                      <p className="text-xs text-ink-500 mt-1.5 flex items-center gap-1 flex-wrap">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                        <span>{fmt(selectedDate)}</span>
                        {selectedEndDate && <span>→ {fmt(selectedEndDate)} <span className="text-ink-300">· {nDays} days</span></span>}
                        {selectedEndDate && (
                          <button type="button" onClick={() => setSelectedEndDate(null)} className="text-ink-300 hover:text-ink underline ml-1">clear range</button>
                        )}
                      </p>
                    )
                  })()}
                </div>

                {/* Time of day */}
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />Preferred time
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIME_SLOTS.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTimeSlot(slot)}
                        className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
                          timeSlot === slot
                            ? 'bg-ink text-white border-ink'
                            : 'border-ink-100 text-ink-400 hover:border-ink-300 hover:text-ink'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />Location / area (optional)
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="e.g. Downtown Edmonton, St. Albert, Jasper Ave…"
                    className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    Message <span className="text-red-400 ml-0.5">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    rows={4}
                    required
                    placeholder={`Hi ${firstName}, I'd like to book a session. Here's what I have in mind…`}
                    className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent resize-none"
                  />
                </div>

                {/* Error */}
                {submitError && (
                  <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{submitError}</p>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting || !selectedDate || !message.trim()}
                  className="w-full bg-ink hover:bg-ink-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                >
                  {submitting
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <>Send booking request <ArrowRight className="w-4 h-4" /></>
                  }
                </button>

              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  ) : null

  return (
    <>
      <span onClick={handleTriggerClick} className="contents">{trigger}</span>
      {mounted && typeof document !== 'undefined'
        ? createPortal(modalContent, document.body)
        : null}
    </>
  )
}
