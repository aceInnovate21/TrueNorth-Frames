'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { NotificationCentre } from '@/components/notification-centre'
import { DashboardSidebar, type SidebarGroup } from '@/components/dashboard-sidebar'
import {
  Bell,
  MessageSquare,
  Search,
  Star,
  Camera,
  ChevronRight,
  CheckCircle2,
  Clock,
  MapPin,
  Heart,
  Briefcase,
  User,
  Baby,
  Sparkles,
  Home,
  ArrowRight,
  Settings,
  LogOut,
  X,
  Calendar,
  CalendarClock,
  HelpCircle,
  Send,
  AlertTriangle,
  Trash2,
  Timer,
  Package,
} from 'lucide-react'
import { Nav } from '@/components/nav'
import { supabase } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────

type BillingType = 'hourly' | 'package'
type BookingStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'cancellation_pending' | 'completed'

interface ClientProfile {
  id: string
  full_name: string
  email: string
  created_at: string
  location: string | null
}

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read_at: string | null
  entity_type: string | null
  entity_id: string | null
  created_at: string
}

interface Conversation {
  id: string
  photographer_username: string | null
  photographer_display_name: string | null
  photographer_avatar_url: string | null
  last_message_body: string | null
  last_message_at: string | null
  unread_count: number
}

interface Booking {
  id: string
  photographer_id: string
  photographer_username: string | null
  photographer_display_name: string | null
  photographer_avatar_url: string | null
  package_id: string | null
  occasion: string
  description: string | null
  billing_type: BillingType
  billing_detail: string | null
  requested_date: string
  requested_end_date: string | null
  time_slot: string
  location_note: string | null
  status: BookingStatus
  photographer_note: string | null
  cancellation_reason: string | null
  created_at: string
  reviewed?: boolean
}

interface SavedPhotographer {
  id: string
  photographer_id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
  rate_display: string | null
  native_avg_rating: number | null
}

// ─── Static data ──────────────────────────────────────────────────────────

const BROWSE_SPECIALTIES = [
  { name: 'Wedding',     icon: Heart,     href: '/photographers?specialty=wedding',     key: 'wedding' },
  { name: 'Portrait',    icon: User,      href: '/photographers?specialty=portrait',    key: 'portrait' },
  { name: 'Corporate',   icon: Briefcase, href: '/photographers?specialty=corporate',   key: 'corporate' },
  { name: 'Real Estate', icon: Home,      href: '/photographers?specialty=real-estate', key: 'real-estate' },
  { name: 'Events',      icon: Sparkles,  href: '/photographers?specialty=events',      key: 'events' },
  { name: 'Newborn',     icon: Baby,      href: '/photographers?specialty=newborn',     key: 'newborn' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?'
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function formatRelativeTime(dateStr: string): string {
  try {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    if (days < 7) return `${days}d ago`
    const weeks = Math.floor(days / 7)
    return `${weeks}w ago`
  } catch {
    return ''
  }
}

function formatMemberSince(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-CA', { year: 'numeric', month: 'long' })
  } catch {
    return ''
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────

function UnreadDot() {
  return <span className="w-2 h-2 rounded-full bg-ink flex-shrink-0" />
}

interface SubmittedReview {
  id: string
  bookingId: string
  rating: number
  body: string | null
  communicationRating: number | null
  qualityRating: number | null
  valueRating: number | null
  punctualityRating: number | null
  publicReply: string | null
  repliedAt: string | null
  clientReply: string | null
  clientRepliedAt: string | null
  createdAt: string
  photographerUsername: string | null
  photographerDisplayName: string | null
  photographerAvatarUrl: string | null
  occasion: string | null
  requestedDate: string | null
}

interface PendingReviewItem {
  bookingId: string
  photographerUsername: string | null
  photographerDisplayName: string | null
  photographerAvatarUrl: string | null
  occasion: string
  requested_date: string
}

const STAR_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']

function StarRow({
  label, value, onChange,
}: { label: string; value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0)
  const active = hover || value
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-ink-400 w-28 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-1 flex-1">
        {[1,2,3,4,5].map(i => (
          <button key={i} type="button"
            onClick={() => onChange(i)}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110">
            <Star className={`w-6 h-6 transition-colors ${i <= active ? 'text-ink fill-ink' : 'text-ink-100 fill-ink-100'}`} />
          </button>
        ))}
      </div>
      <span className="text-xs text-ink-300 w-14 text-right flex-shrink-0">
        {active > 0 ? STAR_LABELS[active] : ''}
      </span>
    </div>
  )
}

function ReviewModal({
  item,
  onClose,
  onSuccess,
}: {
  item: PendingReviewItem
  onClose: () => void
  onSuccess: (bookingId: string) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [overall, setOverall] = useState(0)
  const [hoverOverall, setHoverOverall] = useState(0)
  const [communication, setCommunication] = useState(0)
  const [quality, setQuality] = useState(0)
  const [value, setValue] = useState(0)
  const [punctuality, setPunctuality] = useState(0)
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const name = item.photographerDisplayName ?? item.photographerUsername ?? 'Photographer'
  const inits = getInitials(name)

  async function submit() {
    if (!overall) return
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await fetch('/api/client/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: item.bookingId,
          rating: overall,
          body: text.trim() || undefined,
          communication_rating: communication || undefined,
          quality_rating: quality || undefined,
          value_rating: value || undefined,
          punctuality_rating: punctuality || undefined,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setSubmitError(data.error ?? 'Failed to submit review')
        return
      }
      setDone(true)
      onSuccess(item.bookingId)
    } catch {
      setSubmitError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-ink-50">
          <div>
            <p className="font-semibold text-ink text-base">
              {done ? 'Review submitted' : step === 1 ? 'Rate your experience' : 'Anything to add?'}
            </p>
            <p className="text-ink-300 text-xs mt-0.5">{item.occasion} · {formatDate(item.requested_date)}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink-50 hover:bg-ink-100 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center px-6 py-10 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-ink flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <p className="font-semibold text-ink">Thanks for your review!</p>
            <p className="text-ink-300 text-sm">It helps other Edmonton clients find great photographers.</p>
            <button onClick={onClose} className="mt-2 text-sm font-medium text-ink underline underline-offset-2">Done</button>
          </div>
        ) : step === 1 ? (
          <div className="px-6 py-5 space-y-5">
            {/* Photographer identity */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white text-xs font-bold flex-shrink-0 overflow-hidden">
                {item.photographerAvatarUrl
                  ? <Image src={item.photographerAvatarUrl} alt={name} width={40} height={40} className="object-cover w-full h-full" />
                  : inits}
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">{name}</p>
                <p className="text-ink-300 text-xs">{item.occasion}</p>
              </div>
            </div>

            {/* Overall rating — prominent */}
            <div>
              <p className="text-sm font-semibold text-ink mb-2.5">Overall rating <span className="text-red-400">*</span></p>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(i => (
                  <button key={i} type="button"
                    onClick={() => setOverall(i)}
                    onMouseEnter={() => setHoverOverall(i)}
                    onMouseLeave={() => setHoverOverall(0)}
                    className="transition-transform hover:scale-110">
                    <Star className={`w-8 h-8 transition-colors ${i <= (hoverOverall || overall) ? 'text-ink fill-ink' : 'text-ink-100 fill-ink-100'}`} />
                  </button>
                ))}
                {(hoverOverall || overall) > 0 && (
                  <span className="text-ink-400 text-sm ml-1 font-medium">{STAR_LABELS[hoverOverall || overall]}</span>
                )}
              </div>
            </div>

            {/* Sub-ratings */}
            <div className="rounded-2xl border border-ink-100 overflow-hidden">
              <div className="px-4 py-2.5 bg-ink-50 border-b border-ink-100">
                <p className="text-[11px] font-semibold text-ink-300 uppercase tracking-wider">Quick ratings <span className="font-normal normal-case text-ink-200">(optional)</span></p>
              </div>
              <div className="divide-y divide-ink-50">
                {([
                  { label: 'Communication', value: communication, onChange: setCommunication },
                  { label: 'Photo quality',  value: quality,       onChange: setQuality },
                  { label: 'Punctuality',    value: punctuality,   onChange: setPunctuality },
                  { label: 'Value for money',value: value,         onChange: setValue },
                ] as const).map(row => (
                  <div key={row.label} className="px-4 py-2.5">
                    <StarRow label={row.label} value={row.value} onChange={row.onChange} />
                  </div>
                ))}
              </div>
            </div>

            <button
              type="button"
              disabled={!overall}
              onClick={() => setStep(2)}
              className="w-full bg-ink hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="px-6 py-5 space-y-5">
            <textarea
              autoFocus
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="What made this session stand out? Other clients will appreciate the detail."
              className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
            />

            {submitError && <p className="text-xs text-red-500">{submitError}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 border border-ink-200 text-ink font-semibold py-3 rounded-xl text-sm hover:bg-ink-50 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={submit}
                className="flex-1 bg-ink hover:bg-ink-800 disabled:opacity-40 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                {submitting ? 'Submitting…' : 'Submit'}
                {!submitting && <CheckCircle2 className="w-4 h-4" />}
              </button>
            </div>

            <button type="button" onClick={submit} disabled={submitting}
              className="w-full text-center text-xs text-ink-300 hover:text-ink transition-colors">
              Skip and submit without a note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Sign out modal ───────────────────────────────────────────────────────────

function SignOutModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-float-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
          <p className="font-semibold text-ink">Sign out</p>
          <button onClick={onClose} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-ink-500 leading-relaxed">Are you sure you want to sign out of your TrueNorth Frames account?</p>
        </div>
        <div className="px-5 py-4 border-t border-ink-50 flex gap-3">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 text-ink-400 transition-colors">Cancel</button>
          <button
            onClick={async () => { await supabase.auth.signOut(); router.push('/login') }}
            className="flex-1 text-sm font-semibold bg-ink text-white rounded-xl py-2.5 hover:bg-ink-800 transition-colors"
          >Sign out</button>
        </div>
      </div>
    </div>
  )
}

// ─── Delete account modal ─────────────────────────────────────────────────────

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [confirm, setConfirm] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  async function handleDelete() {
    if (confirm !== 'DELETE') return
    setDeleting(true)
    setDeleteError(false)
    try {
      const res = await fetch('/api/account/delete', { method: 'POST' })
      if (!res.ok) throw new Error('Delete failed')
      await supabase.auth.signOut()
      router.push('/login?deleted=1')
    } catch {
      setDeleting(false)
      setDeleteError(true)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-float-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-red-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <p className="font-semibold text-red-700">Delete account</p>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <p className="text-sm text-ink-600 leading-relaxed">This will permanently delete your account, all saved photographers, and your booking history. <strong>This cannot be undone.</strong></p>
          {deleteError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">Something went wrong. Please try again or contact support.</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Type <span className="font-bold text-red-600">DELETE</span> to confirm</label>
            <input
              type="text" value={confirm} onChange={e => { setConfirm(e.target.value); setDeleteError(false) }}
              placeholder="DELETE"
              className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-red-400 transition-all"
            />
          </div>
        </div>
        <div className="px-5 py-4 border-t border-ink-50 flex gap-3">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 text-ink-400 transition-colors">Cancel</button>
          <button
            onClick={handleDelete}
            disabled={confirm !== 'DELETE' || deleting}
            className="flex-1 text-sm font-semibold bg-red-500 text-white rounded-xl py-2.5 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >{deleting ? 'Deleting…' : 'Delete my account'}</button>
        </div>
      </div>
    </div>
  )
}

const CANCEL_REASONS = [
  'Change of plans',
  'Found another photographer',
  'Budget constraints',
  'Date no longer works',
  'Other',
]

function CancelBookingModal({ photographerName, bookingStatus, onConfirm, onClose }: {
  photographerName: string
  bookingStatus: BookingStatus
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')

  const isApproved = bookingStatus === 'approved'
  const isOther = reason === 'Other'
  const finalReason = isOther ? customReason.trim() : reason
  const canSubmit = reason !== '' && (!isOther || customReason.trim() !== '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden" style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
          <div>
            <p className="font-semibold text-ink">
              {isApproved ? 'Request cancellation' : 'Cancel booking request'}
            </p>
            <p className="text-xs text-ink-300 mt-0.5">with {photographerName}</p>
          </div>
          <button onClick={onClose} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-4 space-y-3">
          {isApproved && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                This booking is already confirmed. Your cancellation request will be sent to {photographerName.split(' ')[0]} for approval — it is not immediate.
              </p>
            </div>
          )}
          <p className="text-sm text-ink-500">
            {isApproved
              ? 'Please share your reason. The photographer will be notified and must confirm before it is cancelled.'
              : 'Please let us know why you are cancelling. This helps photographers plan their schedule.'}
          </p>
          <div className="space-y-2">
            {CANCEL_REASONS.map(r => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left text-sm px-4 py-2.5 rounded-xl border transition-all ${
                  reason === r
                    ? 'border-ink bg-ink text-white'
                    : 'border-ink-100 text-ink-500 hover:border-ink-300 hover:bg-ink-50'
                }`}
              >{r}</button>
            ))}
          </div>
          {isOther && (
            <textarea
              rows={2}
              value={customReason}
              onChange={e => setCustomReason(e.target.value)}
              placeholder="Tell us more…"
              className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink resize-none transition-all"
            />
          )}
        </div>

        <div className="px-5 py-4 border-t border-ink-50 flex gap-3">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 text-ink-400 transition-colors">Keep booking</button>
          <button
            onClick={() => canSubmit && onConfirm(finalReason)}
            disabled={!canSubmit}
            className="flex-1 text-sm font-semibold bg-red-500 text-white rounded-xl py-2.5 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isApproved ? 'Send request' : 'Cancel booking'}
          </button>
        </div>
      </div>
    </div>
  )
}

const CLIENT_SUPPORT_TOPICS: { label: string; category: string; subject: string }[] = [
  { label: 'Booking issue',          category: 'other',           subject: 'Booking issue' },
  { label: 'Photographer concern',   category: 'spam_report',     subject: 'Photographer concern' },
  { label: 'Inappropriate content',  category: 'inappropriate_content', subject: 'Inappropriate content report' },
  { label: 'Account / login issue',  category: 'account_issue',   subject: 'Account or login issue' },
  { label: 'Payment question',       category: 'billing_dispute', subject: 'Payment question' },
  { label: 'Something else',         category: 'other',           subject: 'General enquiry' },
]

function SupportWidget() {
  const [open, setOpen]       = useState(false)
  const [topicIdx, setTopicIdx] = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  async function submit() {
    const topic = CLIENT_SUPPORT_TOPICS[Number(topicIdx)]
    if (!topic || !message.trim()) return
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category:    topic.category,
          subject:     topic.subject,
          description: message.trim(),
        }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      setError('Failed to send — please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-ink-100 overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-ink-50 transition-colors"
      >
        <HelpCircle className="w-4 h-4 text-ink-400 flex-shrink-0" />
        <span className="text-sm font-semibold text-ink flex-1 text-left">Need help?</span>
        <span className="text-xs text-ink-300">Contact support</span>
      </button>

      {open && (
        <div className="border-t border-ink-50 px-5 pb-5 pt-4 space-y-3">
          {sent ? (
            <div className="flex flex-col items-center py-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
              <p className="text-sm font-semibold text-ink">Message sent!</p>
              <p className="text-xs text-ink-300 mt-1">We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <>
              <select value={topicIdx} onChange={e => setTopicIdx(e.target.value)}
                className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink bg-white outline-none focus:border-ink transition-all"
              >
                <option value="">Select a topic…</option>
                {CLIENT_SUPPORT_TOPICS.map((t, i) => (
                  <option key={i} value={i}>{t.label}</option>
                ))}
              </select>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue or question…"
                rows={3}
                className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all resize-none"
              />
              {error && <p className="text-xs text-red-500">{error}</p>}
              <button onClick={submit} disabled={sending || !topicIdx || !message.trim()}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-ink text-white py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-40 transition-all"
              >
                {sending
                  ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
                  : <><Send className="w-3.5 h-3.5" /> Send to support</>
                }
              </button>
              <p className="text-[10px] text-ink-300 text-center">Replies sent to your account email · usually within 24h</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Client avatar dropdown ───────────────────────────────────────────────────

function ClientAvatarMenu({ initials, fullName, loading }: { initials: string; fullName: string; loading: boolean }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  async function handleSignOut() {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-xl"
        aria-label="Account menu"
      >
        {loading ? (
          <div className="w-9 h-9 rounded-xl bg-ink-100 animate-pulse" />
        ) : (
          <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-white text-[11px] font-bold">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-48 bg-white rounded-2xl border border-ink-100 py-1.5 z-50" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          {fullName && (
            <div className="px-4 py-2 border-b border-ink-50 mb-1">
              <p className="text-xs font-semibold text-ink truncate">{fullName}</p>
              <p className="text-[10px] text-ink-400">Client</p>
            </div>
          )}
          <Link href="/dashboard/client/edit"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-600 hover:bg-ink-50 transition-colors">
            <Settings className="w-3.5 h-3.5 text-ink-400" /> Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-600 hover:bg-ink-50 transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5 text-ink-400" /> Sign out
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function ClientDashboard() {
  // ── State ────────────────────────────────────────────────────────────────
  const router = useRouter()
  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [savedPhotographers, setSavedPhotographers] = useState<SavedPhotographer[]>([])
  const [reviewedBookingIds, setReviewedBookingIds] = useState<Set<string>>(new Set())
  const [specialtyCounts, setSpecialtyCounts] = useState<Record<string, number>>({})
  const [submittedReviews, setSubmittedReviews] = useState<SubmittedReview[]>([])
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({})
  const [replySubmitting, setReplySubmitting] = useState<Record<string, boolean>>({})

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [loadingNotifications, setLoadingNotifications] = useState(true)
  const [loadingConversations, setLoadingConversations] = useState(true)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [loadingSaved, setLoadingSaved] = useState(true)

  const [notifOpen, setNotifOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<PendingReviewItem | null>(null)
  const [showSignOut, setShowSignOut] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)

  // ── Fetch on mount ────────────────────────────────────────────────────────

  useEffect(() => {
    fetch('/api/client/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setProfile(data) })
      .finally(() => setLoadingProfile(false))
  }, [])

  useEffect(() => {
    fetch('/api/client/notifications')
      .then(r => r.ok ? r.json() : [])
      .then(data => setNotifications(data))
      .finally(() => setLoadingNotifications(false))
  }, [])

  useEffect(() => {
    fetch('/api/client/conversations')
      .then(r => r.ok ? r.json() : [])
      .then(data => setConversations(data))
      .finally(() => setLoadingConversations(false))
  }, [])

  useEffect(() => {
    fetch('/api/client/bookings')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        setBookings(data)
        const alreadyReviewed = new Set<string>(
          data.filter((b: any) => b.reviewed).map((b: any) => b.id)
        )
        setReviewedBookingIds(alreadyReviewed)
      })
      .finally(() => setLoadingBookings(false))
  }, [])

  useEffect(() => {
    fetch('/api/client/reviews')
      .then(r => r.ok ? r.json() : [])
      .then(data => setSubmittedReviews(data))
  }, [])

  useEffect(() => {
    fetch('/api/client/saved')
      .then(r => r.ok ? r.json() : [])
      .then(data => setSavedPhotographers(data))
      .finally(() => setLoadingSaved(false))
  }, [])

  useEffect(() => {
    Promise.all(
      BROWSE_SPECIALTIES.map(s =>
        fetch(`/api/photographers?specialty=${s.key}&page=1`)
          .then(r => r.ok ? r.json() : { total: 0 })
          .then(d => ({ key: s.key, count: d.total ?? 0 }))
      )
    ).then(results => {
      const counts: Record<string, number> = {}
      for (const r of results) counts[r.key] = r.count
      setSpecialtyCounts(counts)
    })
  }, [])

  // ── Derived state ─────────────────────────────────────────────────────────

  const unreadCount = notifications.filter(n => !n.read_at).length
  const totalConversationUnread = conversations.reduce((a, c) => a + c.unread_count, 0)

  // Desktop left-rail: the client dashboard is a single scrolling page, so rail
  // items jump to the matching section anchor rather than switching tabs.
  const [activeSection, setActiveSection] = useState<string>('sec-messages')
  function scrollToSection(id: string) {
    setActiveSection(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const clientSidebarGroups: SidebarGroup[] = [
    {
      items: [
        { key: 'sec-messages', label: 'Messages', icon: MessageSquare, badge: totalConversationUnread },
        { key: 'sec-bookings', label: 'My Bookings', icon: Calendar },
        { key: 'sec-reviews', label: 'Reviews', icon: Star },
        { key: 'sec-saved', label: 'Saved', icon: Heart },
      ],
    },
  ]

  // Pending reviews: completed bookings not yet reviewed
  const pendingReviews: PendingReviewItem[] = bookings
    .filter(b => b.status === 'completed' && !reviewedBookingIds.has(b.id))
    .map(b => ({
      bookingId: b.id,
      photographerUsername: b.photographer_username,
      photographerDisplayName: b.photographer_display_name,
      photographerAvatarUrl: b.photographer_avatar_url,
      occasion: b.occasion,
      requested_date: b.requested_date,
    }))

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleCancelBooking(reason: string) {
    if (!cancelTarget) return
    try {
      const res = await fetch(`/api/client/bookings/${cancelTarget.id}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })
      if (res.ok) {
        const { new_status } = await res.json()
        setBookings(prev =>
          prev.map(b => b.id === cancelTarget.id ? { ...b, status: new_status as BookingStatus } : b)
        )
      }
    } catch {
      // Silent fail — user can retry
    }
    setCancelTarget(null)
  }

  async function submitReply(reviewId: string, bookingId: string) {
    const reply = replyDrafts[reviewId]?.trim()
    if (!reply) return
    setReplySubmitting(prev => ({ ...prev, [reviewId]: true }))
    try {
      const res = await fetch('/api/client/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: bookingId, reply }),
      })
      if (res.ok) {
        setSubmittedReviews(prev => prev.map(r =>
          r.id === reviewId
            ? { ...r, clientReply: reply, clientRepliedAt: new Date().toISOString() }
            : r
        ))
        setReplyDrafts(prev => { const n = { ...prev }; delete n[reviewId]; return n })
      }
    } finally {
      setReplySubmitting(prev => { const n = { ...prev }; delete n[reviewId]; return n })
    }
  }

  async function handleMarkAllNotificationsRead() {
    try {
      const res = await fetch('/api/client/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
      }
    } catch {
      // Silent fail
    }
  }

  // ── Helpers for display ───────────────────────────────────────────────────

  const firstName = profile?.full_name?.split(' ')[0] ?? ''
  const lastName = profile?.full_name?.split(' ').slice(1).join(' ') ?? ''
  const initials = getInitials(profile?.full_name)
  const city = profile?.location ?? ''
  const memberSince = profile?.created_at ? formatMemberSince(profile.created_at) : ''

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Desktop left rail (lg+) ─────────────────────────────────── */}
      <DashboardSidebar
        groups={clientSidebarGroups}
        activeKey={activeSection}
        onSelect={scrollToSection}
      />

      <div className="lg:pl-64">
      {/* ── Top bar — logo on mobile; account controls stay top-right on all sizes ── */}
      <div className="bg-white border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0 lg:hidden">
            <Image src="/logo.png" alt="TrueNorth Frames" width={30} height={30} className="rounded-md" />
            <span className="font-semibold text-ink text-sm hidden sm:block">TrueNorth Frames</span>
          </Link>

          {/* Centre: quick search */}
          <Link
            href="/photographers"
            className="flex-1 max-w-sm hidden md:flex items-center gap-2 border border-ink-100 rounded-xl px-4 py-2 text-sm text-ink-300 hover:border-ink-300 transition-colors"
          >
            <Search className="w-4 h-4" />
            Browse photographers…
          </Link>

          {/* Right: notif + avatar */}
          <div className="flex items-center gap-3">
            {/* Notification centre */}
            <NotificationCentre
              apiEndpoint="/api/client/notifications"
              markReadEndpoint="/api/client/notifications/read"
              role="client"
              pollIntervalMs={30000}
            />

            {/* Avatar dropdown */}
            <ClientAvatarMenu
              initials={initials}
              fullName={profile?.full_name ?? ''}
              loading={loadingProfile}
            />
          </div>
        </div>
      </div>

      {/* ── Page body ─────────────────────────────────────────────── */}
      <div className="bg-ink-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Welcome strip */}
          <div className="mb-8">
            {loadingProfile ? (
              <div className="animate-pulse space-y-2">
                <div className="h-8 bg-ink-100 rounded w-64" />
                <div className="h-4 bg-ink-100 rounded w-80" />
              </div>
            ) : (
              <>
                <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
                  Welcome back{firstName ? `, ${firstName}` : ''}.
                </h1>
                <p className="text-ink-300 text-sm mt-1">Here's what's happening with your photographer search.</p>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column (main) ──────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Conversations */}
              <div id="sec-messages" className="bg-white rounded-2xl overflow-hidden scroll-mt-24" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink text-sm">Messages</h2>
                    {totalConversationUnread > 0 && (
                      <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {totalConversationUnread} new
                      </span>
                    )}
                  </div>
                  <Link href="/messages" className="text-xs text-ink-400 hover:text-ink font-medium transition-colors flex items-center gap-0.5">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                {loadingConversations ? (
                  <div className="divide-y divide-ink-50">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-start gap-3 px-5 py-4 animate-pulse">
                        <div className="w-10 h-10 rounded-xl bg-ink-100 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 bg-ink-100 rounded w-1/3" />
                          <div className="h-3 bg-ink-100 rounded w-1/4" />
                          <div className="h-3 bg-ink-100 rounded w-3/4" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : conversations.length === 0 ? (
                  <div className="px-5 py-6 text-center">
                    <p className="text-sm text-ink-400">No conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-ink-50">
                    {conversations.map((c) => {
                      const displayName = c.photographer_display_name ?? c.photographer_username ?? 'Photographer'
                      const convInitials = getInitials(displayName)
                      const slug = c.photographer_username ?? c.id
                      return (
                        <Link
                          key={c.id}
                          href={`/messages?conv=${c.id}`}
                          className="flex items-start gap-3 px-5 py-4 hover:bg-ink-50/60 transition-colors"
                        >
                          {/* Avatar */}
                          <div className="relative flex-shrink-0">
                            {c.photographer_avatar_url ? (
                              <div className="w-10 h-10 rounded-xl overflow-hidden">
                                <Image src={c.photographer_avatar_url} alt={displayName} width={40} height={40} className="object-cover w-full h-full" />
                              </div>
                            ) : (
                              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white text-[11px] font-bold">
                                {convInitials}
                              </div>
                            )}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white bg-ink-200" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-1.5">
                                <p className={`text-sm leading-tight ${c.unread_count > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{displayName}</p>
                                {c.unread_count > 0 && <UnreadDot />}
                              </div>
                              <p className="text-ink-200 text-[10px] flex-shrink-0 ml-2">
                                {c.last_message_at ? formatRelativeTime(c.last_message_at) : ''}
                              </p>
                            </div>
                            <p className="text-ink-400 text-xs truncate">{c.last_message_body ?? ''}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}

                <div className="px-5 py-3 border-t border-ink-50 bg-ink-50/40">
                  <Link href="/photographers" className="text-xs text-ink font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    Message a new photographer
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* My Bookings */}
              <div id="sec-bookings" className="bg-white rounded-2xl overflow-hidden scroll-mt-24" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink text-sm">My bookings</h2>
                    {bookings.filter(b => b.status === 'pending' || b.status === 'cancellation_pending').length > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {bookings.filter(b => b.status === 'pending' || b.status === 'cancellation_pending').length} active
                      </span>
                    )}
                  </div>
                </div>

                {loadingBookings ? (
                  <div className="p-4 space-y-4">
                    {[1, 2].map(i => (
                      <div key={i} className="rounded-2xl border border-ink-100 overflow-hidden animate-pulse">
                        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-ink-100">
                          <div className="w-9 h-9 rounded-xl bg-ink-100 flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3.5 bg-ink-100 rounded w-1/3" />
                            <div className="h-3 bg-ink-100 rounded w-1/4" />
                          </div>
                        </div>
                        <div className="px-4 py-3 space-y-2">
                          <div className="h-3 bg-ink-100 rounded w-2/3" />
                          <div className="h-3 bg-ink-100 rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="px-5 py-8 text-center">
                    <CalendarClock className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                    <p className="text-sm text-ink-400 font-medium">No bookings yet</p>
                    <p className="text-xs text-ink-300 mt-1">Visit a photographer's profile to request a session.</p>
                    <Link href="/photographers" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-ink hover:underline">
                      Browse photographers <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {bookings.map(b => {
                      const isInactive = b.status === 'cancelled' || b.status === 'declined'
                      const chipStyle =
                        b.status === 'pending'              ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        b.status === 'approved'             ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        b.status === 'cancellation_pending' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        b.status === 'completed'            ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        b.status === 'declined'             ? 'bg-red-50 text-red-600 border-red-100' :
                                                             'bg-ink-50 text-ink-400 border-ink-100'
                      const chipLabel =
                        b.status === 'pending'              ? 'Awaiting response' :
                        b.status === 'approved'             ? 'Confirmed' :
                        b.status === 'cancellation_pending' ? 'Cancellation requested' :
                        b.status === 'completed'            ? 'Completed' :
                        b.status === 'declined'             ? 'Declined' :
                                                             'Cancelled'
                      const photographerName = b.photographer_display_name ?? b.photographer_username ?? 'Photographer'
                      const photographerInitials = getInitials(photographerName)
                      const slug = b.photographer_username ?? b.photographer_id

                      return (
                        <div key={b.id} className={`rounded-2xl border overflow-hidden ${isInactive ? 'border-ink-100 opacity-60' : 'border-ink-100 bg-ink-50/40'}`}>
                          {/* Card header */}
                          <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-ink-100">
                            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                              {b.photographer_avatar_url ? (
                                <Image src={b.photographer_avatar_url} alt={photographerName} width={36} height={36} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-9 h-9 bg-ink-600 flex items-center justify-center text-white text-xs font-bold">
                                  {photographerInitials}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-ink leading-tight">{photographerName}</p>
                              <p className="text-[10px] text-ink-300">{b.occasion}</p>
                            </div>
                            <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${chipStyle}`}>
                              {chipLabel}
                            </span>
                          </div>

                          {/* Card body */}
                          <div className="px-4 py-3 space-y-2.5">
                            <div className="flex items-center gap-3 flex-wrap">
                              <span className="flex items-center gap-1.5 text-xs text-ink-400">
                                <Calendar className="w-3.5 h-3.5" />{formatDate(b.requested_date)}{b.requested_end_date ? ` → ${formatDate(b.requested_end_date)}` : ''}
                              </span>
                              <span className="flex items-center gap-1.5 text-xs text-ink-400">
                                <Clock className="w-3.5 h-3.5" />{b.time_slot}
                              </span>
                              <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                b.billing_type === 'hourly'
                                  ? 'bg-violet-50 text-violet-700 border-violet-200'
                                  : 'bg-sky-50 text-sky-700 border-sky-200'
                              }`}>
                                {b.billing_type === 'hourly'
                                  ? <><Timer className="w-2.5 h-2.5" /> Per hour</>
                                  : <><Package className="w-2.5 h-2.5" /> Package</>}
                              </span>
                              {b.billing_detail && (
                                <span className="text-[10px] text-ink-400 font-medium">{b.billing_detail}</span>
                              )}
                            </div>

                            {b.description && (
                              <p className="text-xs text-ink-500 leading-relaxed">{b.description}</p>
                            )}

                            {b.photographer_note && (
                              <div className={`border rounded-xl px-3 py-2.5 ${b.status === 'completed' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                <p className={`text-[10px] font-semibold mb-0.5 ${b.status === 'completed' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                  Note from {photographerName.split(' ')[0]}
                                </p>
                                <p className={`text-xs leading-relaxed ${b.status === 'completed' ? 'text-blue-700' : 'text-emerald-700'}`}>
                                  {b.photographer_note}
                                </p>
                              </div>
                            )}

                            {b.status === 'pending' && (
                              <p className="text-[10px] text-amber-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Time slot is tentative — waiting for photographer to confirm
                              </p>
                            )}
                            {b.status === 'cancellation_pending' && (
                              <p className="text-[10px] text-orange-600 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> Cancellation request sent — waiting for photographer to confirm
                              </p>
                            )}
                          </div>

                          {/* Card footer */}
                          <div className="px-4 py-3 border-t border-ink-100 flex items-center justify-between gap-3">
                            <Link
                              href={b.status === 'pending' ? `/photographers/${slug}?pending=1&date=${encodeURIComponent(formatDate(b.requested_date))}&slot=${encodeURIComponent(b.time_slot)}` : `/photographers/${slug}`}
                              className="text-xs font-medium text-ink-400 hover:text-ink flex items-center gap-1 transition-colors"
                            >
                              View profile <ChevronRight className="w-3 h-3" />
                            </Link>
                            <div className="flex items-center gap-2">
                              {(b.status === 'pending' || b.status === 'approved') && (
                                <button
                                  onClick={() => setCancelTarget(b)}
                                  className="text-xs font-medium text-red-500 hover:text-red-700 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-xl transition-all"
                                >
                                  {b.status === 'approved' ? 'Request cancellation' : 'Cancel request'}
                                </button>
                              )}
                              {b.status === 'approved' && (
                                <Link
                                  href={`/photographers/${slug}#availability`}
                                  className="text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded-xl hover:bg-ink-800 transition-colors flex items-center gap-1.5"
                                >
                                  <CalendarClock className="w-3.5 h-3.5" />
                                  Book another occasion
                                </Link>
                              )}
                              {b.status === 'completed' && !reviewedBookingIds.has(b.id) && (
                                <button
                                  onClick={() => setReviewTarget({
                                    bookingId: b.id,
                                    photographerUsername: b.photographer_username,
                                    photographerDisplayName: b.photographer_display_name,
                                    photographerAvatarUrl: b.photographer_avatar_url,
                                    occasion: b.occasion,
                                    requested_date: b.requested_date,
                                  })}
                                  className="text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded-xl hover:bg-ink-800 transition-colors flex items-center gap-1.5"
                                >
                                  <Star className="w-3.5 h-3.5" />
                                  Leave a review
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="px-5 py-3 border-t border-ink-50 bg-ink-50/40">
                  <Link href="/photographers" className="text-xs text-ink font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Book a new session
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Reviews section */}
              {!loadingBookings && (pendingReviews.length > 0 || submittedReviews.length > 0) && (
                <div id="sec-reviews" className="bg-white rounded-2xl overflow-hidden scroll-mt-24" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-ink-50">
                    <Star className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink text-sm">Reviews</h2>
                    {pendingReviews.length > 0 && (
                      <span className="bg-amber-100 text-amber-700 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {pendingReviews.length} pending
                      </span>
                    )}
                  </div>

                  {/* Pending reviews — need to write */}
                  {pendingReviews.map((r) => {
                    const name = r.photographerDisplayName ?? r.photographerUsername ?? 'Photographer'
                    return (
                      <div key={r.bookingId} className="flex items-center gap-4 px-5 py-4 border-b border-ink-50 last:border-0 bg-amber-50/40">
                        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                          {r.photographerAvatarUrl ? (
                            <Image src={r.photographerAvatarUrl} alt={name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white text-xs font-bold">{getInitials(name)}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink text-sm leading-tight">{name}</p>
                          <p className="text-ink-300 text-xs">{r.occasion} · {formatDate(r.requested_date)}</p>
                        </div>
                        <button onClick={() => setReviewTarget(r)}
                          className="bg-ink hover:bg-ink-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0">
                          Leave review
                        </button>
                      </div>
                    )
                  })}

                  {/* Submitted reviews */}
                  {submittedReviews.map((r) => {
                    const name = r.photographerDisplayName ?? r.photographerUsername ?? 'Photographer'
                    const canReply = !!r.publicReply && !r.clientReply
                    return (
                      <div key={r.id} className="border-b border-ink-50 last:border-0">
                        {/* Review header */}
                        <div className="flex items-center gap-3 px-5 pt-4 pb-3">
                          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                            {r.photographerAvatarUrl
                              ? <Image src={r.photographerAvatarUrl} alt={name} width={36} height={36} className="object-cover w-full h-full" />
                              : <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-white text-[10px] font-bold">{getInitials(name)}</div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-ink text-sm">{name}</p>
                            <p className="text-ink-300 text-[10px]">{r.occasion} · {r.requestedDate ? formatDate(r.requestedDate) : ''}</p>
                          </div>
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {[1,2,3,4,5].map(i => (
                              <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'text-ink fill-ink' : 'text-ink-100 fill-ink-100'}`} />
                            ))}
                          </div>
                        </div>

                        {/* Review body */}
                        {r.body && <p className="px-5 pb-3 text-xs text-ink-500 leading-relaxed">{r.body}</p>}

                        {/* Photographer's public reply */}
                        {r.publicReply && (
                          <div className="mx-5 mb-3 bg-ink-50 rounded-xl p-3">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <div className="w-5 h-5 rounded-md bg-ink flex items-center justify-center flex-shrink-0">
                                <span className="text-white text-[8px] font-bold">P</span>
                              </div>
                              <p className="text-[10px] font-semibold text-ink">Photographer's reply</p>
                              {r.repliedAt && <span className="text-[9px] text-ink-300 ml-auto">{formatRelativeTime(r.repliedAt)}</span>}
                            </div>
                            <p className="text-xs text-ink-500 leading-relaxed">{r.publicReply}</p>

                            {/* Client's reply to photographer's reply */}
                            {r.clientReply ? (
                              <div className="mt-2.5 pt-2.5 border-t border-ink-100 flex gap-2">
                                <div className="w-4 h-4 rounded bg-ink-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <span className="text-ink-500 text-[7px] font-bold">Y</span>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold text-ink-500 mb-0.5">Your reply</p>
                                  <p className="text-xs text-ink-500 leading-relaxed">{r.clientReply}</p>
                                </div>
                              </div>
                            ) : canReply && (
                              <div className="mt-2.5 pt-2.5 border-t border-ink-100">
                                <textarea
                                  rows={2}
                                  value={replyDrafts[r.id] ?? ''}
                                  onChange={e => setReplyDrafts(prev => ({ ...prev, [r.id]: e.target.value }))}
                                  placeholder="Reply to this response…"
                                  className="w-full text-xs text-ink bg-white border border-ink-200 rounded-lg px-3 py-2 outline-none focus:border-ink resize-none placeholder-ink-300"
                                />
                                <button
                                  disabled={!replyDrafts[r.id]?.trim() || replySubmitting[r.id]}
                                  onClick={() => submitReply(r.id, r.bookingId)}
                                  className="mt-1.5 text-[10px] font-semibold bg-ink text-white px-3 py-1.5 rounded-lg hover:bg-ink-800 disabled:opacity-40 transition-colors"
                                >
                                  {replySubmitting[r.id] ? 'Posting…' : 'Post reply'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Browse by specialty */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink text-sm">Browse photographers</h2>
                  </div>
                  <Link href="/photographers" className="text-xs text-ink-400 hover:text-ink font-medium transition-colors">
                    All photographers
                  </Link>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {BROWSE_SPECIALTIES.map((s) => {
                    const Icon = s.icon
                    const count = specialtyCounts[s.key]
                    return (
                      <Link
                        key={s.name}
                        href={s.href}
                        className="group flex flex-col items-center text-center p-3 rounded-xl border border-ink-100 hover:border-ink hover:bg-ink-50 transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-ink-50 group-hover:bg-ink flex items-center justify-center mb-2 transition-colors">
                          <Icon className="w-4 h-4 text-ink-400 group-hover:text-white transition-colors" />
                        </div>
                        <p className="text-ink text-[11px] font-medium leading-tight">{s.name}</p>
                        <p className="text-ink-300 text-[10px]">
                          {count !== undefined ? count : '—'}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* ── Right sidebar ──────────────────────────────────── */}
            <div className="space-y-4">

              {/* Profile card */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex flex-col items-center text-center pb-4 mb-4 border-b border-ink-50">
                  {loadingProfile ? (
                    <div className="animate-pulse flex flex-col items-center gap-2 w-full">
                      <div className="w-14 h-14 rounded-2xl bg-ink-100" />
                      <div className="h-4 bg-ink-100 rounded w-32" />
                      <div className="h-3 bg-ink-100 rounded w-24" />
                    </div>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-ink flex items-center justify-center text-white text-base font-bold mb-3">
                        {initials}
                      </div>
                      <p className="font-semibold text-ink text-sm">{firstName} {lastName}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="w-3 h-3 text-ink-300" />
                        <p className="text-ink-300 text-xs">{city}</p>
                      </div>
                      <p className="text-ink-200 text-[10px] mt-0.5">Member since {memberSince}</p>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Link href="/dashboard/client/edit" className="flex items-center gap-2.5 text-ink-500 hover:text-ink text-sm transition-colors py-1">
                    <Settings className="w-4 h-4" />
                    Account settings
                  </Link>
                  <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="flex items-center gap-2.5 text-ink-300 hover:text-ink text-sm transition-colors py-1 w-full text-left">
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                  <div className="pt-2 mt-2 border-t border-ink-50">
                    <button onClick={() => setShowDeleteAccount(true)} className="flex items-center gap-2.5 text-red-400 hover:text-red-600 text-xs transition-colors py-1 w-full text-left">
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete account
                    </button>
                  </div>
                </div>
              </div>

              {/* Saved photographers */}
              <div id="sec-saved" className="bg-white rounded-2xl p-5 scroll-mt-24" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-ink text-sm">Saved</h3>
                  <Link href="/photographers" className="text-[10px] text-ink-400 hover:text-ink transition-colors">Browse more</Link>
                </div>

                {loadingSaved ? (
                  <div className="space-y-4 animate-pulse">
                    {[1, 2].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-ink-100 flex-shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3.5 bg-ink-100 rounded w-2/3" />
                          <div className="h-3 bg-ink-100 rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : savedPhotographers.length === 0 ? (
                  <p className="text-xs text-ink-300 text-center py-2">No saved photographers yet</p>
                ) : (
                  <div className="space-y-3">
                    {savedPhotographers.map((p) => {
                      const pName = p.display_name ?? p.username ?? 'Photographer'
                      const pInitials = getInitials(pName)
                      const pSlug = p.username ?? p.photographer_id
                      return (
                        <div key={p.id} className="flex items-center gap-3">
                          <Link href={`/photographers/${pSlug}`} className="flex items-center gap-3 group flex-1 min-w-0">
                            <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                              {p.avatar_url ? (
                                <Image src={p.avatar_url} alt={pName} width={36} height={36} className="object-cover w-full h-full" />
                              ) : (
                                <div className="w-full h-full bg-ink flex items-center justify-center text-white text-[10px] font-bold">{pInitials}</div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-ink text-xs leading-tight group-hover:underline truncate">{pName}</p>
                              <p className="text-ink-300 text-[10px]">{p.rate_display ?? ''}</p>
                            </div>
                            {p.native_avg_rating != null && (
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Star className="w-2.5 h-2.5 text-ink fill-ink" />
                                <span className="text-ink text-[10px] font-bold">{p.native_avg_rating.toFixed(1)}</span>
                              </div>
                            )}
                          </Link>
                          <button
                            onClick={async () => {
                              const res = await fetch(`/api/client/saved?photographer_id=${p.photographer_id}`, { method: 'DELETE' })
                              if (res.ok) setSavedPhotographers(prev => prev.filter(s => s.id !== p.id))
                            }}
                            title="Remove from saved"
                            className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors flex-shrink-0"
                          >
                            <Heart className="w-3.5 h-3.5 fill-red-400 text-red-400" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Quick stats */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <h3 className="font-semibold text-ink text-sm mb-4">Your activity</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Conversations', value: conversations.length.toString(), icon: MessageSquare },
                    { label: 'Saved', value: savedPhotographers.length.toString(), icon: Heart },
                    { label: 'Reviews left', value: pendingReviews.length.toString(), icon: Star },
                    { label: 'Unread', value: unreadCount.toString(), icon: Bell },
                  ].map((s) => {
                    const Icon = s.icon
                    return (
                      <div key={s.label} className="bg-ink-50 rounded-xl p-3 text-center">
                        <Icon className="w-4 h-4 text-ink-400 mx-auto mb-1" />
                        <p className="font-bold text-ink text-base leading-none">{s.value}</p>
                        <p className="text-ink-300 text-[10px] mt-0.5">{s.label}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Notification preferences nudge */}
              <div
                className="bg-ink rounded-2xl p-5 relative overflow-hidden"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.10)' }}
              >
                <div className="absolute inset-0 grid-pattern opacity-100 pointer-events-none" />
                <div className="relative z-10">
                  <Bell className="w-5 h-5 text-white mb-3" />
                  <p className="font-semibold text-white text-sm mb-1">Stay in the loop</p>
                  <p className="text-ink-400 text-xs leading-relaxed mb-4">
                    Get notified by email when a photographer replies. No spam — just messages that matter.
                  </p>
                  <Link
                    href="/dashboard/client/edit#notifications"
                    className="inline-flex items-center gap-1.5 bg-white hover:bg-ink-100 text-ink text-xs font-semibold px-3 py-2 rounded-lg transition-colors"
                  >
                    Set up notifications
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              {/* Support card */}
              <SupportWidget />
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal
          item={reviewTarget}
          onClose={() => setReviewTarget(null)}
          onSuccess={(bookingId) => {
            setReviewedBookingIds(prev => { const next = new Set(prev); next.add(bookingId); return next })
            setReviewTarget(null)
          }}
        />
      )}

      {/* Cancel booking modal */}
      {cancelTarget && (
        <CancelBookingModal
          photographerName={cancelTarget.photographer_display_name ?? cancelTarget.photographer_username ?? 'Photographer'}
          bookingStatus={cancelTarget.status}
          onConfirm={handleCancelBooking}
          onClose={() => setCancelTarget(null)}
        />
      )}

      {/* Sign out modal */}
      {showSignOut && <SignOutModal onClose={() => setShowSignOut(false)} />}

      {/* Delete account modal */}
      {showDeleteAccount && <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />}
    </>
  )
}
