'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

// ─── Mock data ────────────────────────────────────────────────────────────

const USER = {
  firstName: 'Alex',
  lastName: 'Johnson',
  initials: 'AJ',
  city: 'Oliver, Edmonton',
  email: 'alex@example.com',
  memberSince: 'May 2026',
}

const NOTIFICATIONS = [
  {
    id: 1,
    type: 'reply' as const,
    read: false,
    from: 'Sarah Chen',
    fromInitials: 'SC',
    preview: "Hi Alex! I'd love to chat about your wedding date. I have availability in September — shall we hop on a quick call?",
    time: '2 hours ago',
    slug: 'sarah-chen',
  },
  {
    id: 2,
    type: 'reply' as const,
    read: false,
    from: 'Marcus Wright',
    fromInitials: 'MW',
    preview: "Thanks for reaching out! My day rate for corporate events is $1,200. Happy to send over a full package breakdown.",
    time: '1 day ago',
    slug: 'marcus-wright',
  },
  {
    id: 3,
    type: 'review' as const,
    read: true,
    from: 'TrueNorth Frames',
    fromInitials: 'TN',
    preview: "Don't forget to leave a review for your session with Sarah Chen. It helps other clients find great photographers.",
    time: '3 days ago',
    slug: 'sarah-chen',
  },
]

const CONVERSATIONS = [
  {
    slug: 'sarah-chen',
    name: 'Sarah Chen',
    initials: 'SC',
    specialty: 'Wedding · Portrait',
    lastMessage: "Hi Alex! I'd love to chat about your wedding date. I have availability in September…",
    time: '2h ago',
    unread: 1,
    status: 'online' as const,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fit=crop&crop=face',
  },
  {
    slug: 'marcus-wright',
    name: 'Marcus Wright',
    initials: 'MW',
    specialty: 'Corporate · Events',
    lastMessage: "Thanks for reaching out! My day rate for corporate events is $1,200…",
    time: '1d ago',
    unread: 1,
    status: 'recent' as const,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fit=crop&crop=face',
  },
  {
    slug: 'priya-patel',
    name: 'Priya Patel',
    initials: 'PP',
    specialty: 'Newborn · Family',
    lastMessage: "You: Thanks Priya, I'll confirm the date by end of week.",
    time: '1w ago',
    unread: 0,
    status: 'online' as const,
    avatar: '',
  },
]

const SAVED_PHOTOGRAPHERS = [
  {
    slug: 'sarah-chen', name: 'Sarah Chen', specialty: 'Wedding', rating: 4.9, rate: '$200/session', initials: 'SC',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fit=crop&crop=face',
    albumPreview: [
      { src: 'https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=120&q=70&fit=crop', album: 'Weddings' },
      { src: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=120&q=70&fit=crop', album: 'Weddings' },
      { src: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=120&q=70&fit=crop', album: 'Portraits' },
    ],
  },
  {
    slug: 'marcus-wright', name: 'Marcus Wright', specialty: 'Corporate', rating: 4.7, rate: '$150/hr', initials: 'MW',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fit=crop&crop=face',
    albumPreview: [
      { src: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=120&q=70&fit=crop', album: 'Corporate' },
      { src: 'https://images.unsplash.com/photo-1551818255-e6e10975bc17?w=120&q=70&fit=crop', album: 'Events' },
      { src: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=120&q=70&fit=crop', album: 'Corporate' },
    ],
  },
]

const PENDING_REVIEWS = [
  { slug: 'sarah-chen', name: 'Sarah Chen', sessionLabel: 'Wedding consultation', date: 'April 12, 2026', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fit=crop&crop=face', initials: 'SC' },
]

type BillingType = 'hourly' | 'package'
// Matches DBML booking_status enum
type BookingStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'cancellation_pending' | 'completed'

const MY_BOOKINGS = [
  {
    id: 'b1',
    photographerName: 'Sarah Chen',
    photographerInitials: 'SC',
    photographerBg: 'bg-slate-600',
    photographerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80&fit=crop&crop=face',
    slug: 'sarah-chen',
    date: 'May 28, 2026',
    timeSlot: '10:00 AM – 12:00 PM',
    sessionType: 'Wedding consultation',
    description: "Initial consultation to discuss our wedding vision, preferred style, and key moments we want captured. Looking for candid, documentary-style coverage throughout the day.",
    billingType: 'package' as BillingType,
    billingDetail: 'Full-day package · $1,800',
    status: 'pending' as BookingStatus,
    photographerNote: '',
  },
  {
    id: 'b2',
    photographerName: 'Marcus Wright',
    photographerInitials: 'MW',
    photographerBg: 'bg-zinc-600',
    photographerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&fit=crop&crop=face',
    slug: 'marcus-wright',
    date: 'June 7, 2026',
    timeSlot: '2:00 PM – 4:00 PM',
    sessionType: 'Corporate headshots',
    description: "Team of 6 needing updated LinkedIn and website headshots. Prefer clean, neutral backgrounds with natural expressions. Office casual dress code.",
    billingType: 'hourly' as BillingType,
    billingDetail: '$150 / hr · est. 2 hrs',
    status: 'approved' as BookingStatus,
    photographerNote: "Looking forward to it! Please arrive 5 min early and wear business attire.",
  },
  {
    id: 'b3',
    photographerName: 'Priya Patel',
    photographerInitials: 'PP',
    photographerBg: 'bg-violet-600',
    photographerAvatar: '',
    slug: 'priya-patel',
    date: 'April 12, 2026',
    timeSlot: '11:00 AM – 1:00 PM',
    sessionType: 'Newborn session',
    description: "Lifestyle newborn session at home. Baby is 8 days old.",
    billingType: 'package' as BillingType,
    billingDetail: 'Newborn package · $425',
    status: 'completed' as BookingStatus,
    photographerNote: "It was such a joy working with your family! Gallery delivered to your email.",
  },
]


const BROWSE_SPECIALTIES = [
  { name: 'Wedding', icon: Heart, href: '/photographers?specialty=wedding', count: 12 },
  { name: 'Portrait', icon: User, href: '/photographers?specialty=portrait', count: 18 },
  { name: 'Corporate', icon: Briefcase, href: '/photographers?specialty=corporate', count: 14 },
  { name: 'Real Estate', icon: Home, href: '/photographers?specialty=real-estate', count: 8 },
  { name: 'Events', icon: Sparkles, href: '/photographers?specialty=events', count: 11 },
  { name: 'Newborn', icon: Baby, href: '/photographers?specialty=newborn', count: 9 },
]

// ─── Sub-components ───────────────────────────────────────────────────────

function UnreadDot() {
  return <span className="w-2 h-2 rounded-full bg-ink flex-shrink-0" />
}

function ReviewModal({ p, onClose }: { p: (typeof PENDING_REVIEWS)[0]; onClose: () => void }) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) return
    setDone(true)
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-ink-50">
          <div>
            <p className="font-semibold text-ink text-base">Leave a review</p>
            <p className="text-ink-300 text-xs mt-0.5">{p.sessionLabel} · {p.date}</p>
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
        ) : (
          <form onSubmit={submit} className="px-6 py-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                {p.initials}
              </div>
              <div>
                <p className="font-semibold text-ink text-sm">{p.name}</p>
                <p className="text-ink-300 text-xs">{p.sessionLabel}</p>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-ink mb-2">Your rating</p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star className={`w-7 h-7 transition-colors ${i <= (hover || rating) ? 'text-ink fill-ink' : 'text-ink-100 fill-ink-100'}`} />
                  </button>
                ))}
                {rating > 0 && (
                  <span className="text-ink-400 text-xs ml-1">
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'][rating]}
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-ink block mb-2">Your experience <span className="text-ink-300 font-normal">(optional)</span></label>
              <textarea
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="What made this session stand out? Other clients will appreciate the detail."
                className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={!rating}
              className="w-full bg-ink hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
            >
              Submit review
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────

// ─── Support widget ───────────────────────────────────────────────────────────

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

  function handleDelete() {
    if (confirm !== 'DELETE') return
    setDeleting(true)
    setTimeout(() => { router.push('/login') }, 1500)
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
          <div>
            <label className="block text-xs font-medium text-ink-500 mb-1.5">Type <span className="font-bold text-red-600">DELETE</span> to confirm</label>
            <input
              type="text" value={confirm} onChange={e => setConfirm(e.target.value)}
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

function SupportWidget() {
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function submit() {
    if (!message.trim()) return
    setSent(true)
    setTimeout(() => { setSent(false); setOpen(false); setMessage(''); setCategory('') }, 2500)
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
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink bg-white outline-none focus:border-ink transition-all"
              >
                <option value="">Select a topic…</option>
                <option value="booking">Booking issue</option>
                <option value="photographer">Photographer concern</option>
                <option value="account">Account / login</option>
                <option value="payment">Payment question</option>
                <option value="other">Something else</option>
              </select>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Describe your issue or question…"
                rows={3}
                className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink transition-all resize-none"
              />
              <button onClick={submit} disabled={!message.trim()}
                className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-ink text-white py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-40 transition-all"
              >
                <Send className="w-3.5 h-3.5" /> Send to support
              </button>
              <p className="text-[10px] text-ink-300 text-center">Replies sent to your account email · usually within 24h</p>
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default function ClientDashboard() {
  const [notifOpen, setNotifOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<(typeof PENDING_REVIEWS)[0] | null>(null)
  const [showSignOut, setShowSignOut] = useState(false)
  const [showDeleteAccount, setShowDeleteAccount] = useState(false)
  const [bookings, setBookings] = useState(MY_BOOKINGS)
  const [cancelTarget, setCancelTarget] = useState<(typeof MY_BOOKINGS)[0] | null>(null)

  const unreadCount = NOTIFICATIONS.filter((n) => !n.read).length

  return (
    <>
      {/* ── Dashboard nav ──────────────────────────────────────────── */}
      <div className="bg-white border-b border-ink-100 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
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
            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="w-9 h-9 rounded-xl border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors relative"
              >
                <Bell className="w-4 h-4 text-ink-500" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-ink rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification dropdown */}
              {notifOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl overflow-hidden z-50"
                  style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12)' }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-ink-50">
                    <p className="font-semibold text-ink text-sm">Notifications</p>
                    <button onClick={() => setNotifOpen(false)} className="text-ink-300 hover:text-ink">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {NOTIFICATIONS.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-ink-50 last:border-0 flex items-start gap-3 ${!n.read ? 'bg-ink-50/60' : ''}`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-ink flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {n.fromInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <p className="text-ink text-xs font-semibold">{n.from}</p>
                          {!n.read && <UnreadDot />}
                        </div>
                        <p className="text-ink-400 text-xs leading-relaxed line-clamp-2">{n.preview}</p>
                        <p className="text-ink-200 text-[10px] mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                  <div className="px-4 py-3 text-center border-t border-ink-50">
                    <button className="text-xs text-ink-400 hover:text-ink font-medium transition-colors">
                      Mark all as read
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Avatar + name */}
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-ink flex items-center justify-center text-white text-[11px] font-bold">
                {USER.initials}
              </div>
              <div className="hidden sm:block">
                <p className="text-ink text-xs font-semibold leading-tight">{USER.firstName} {USER.lastName}</p>
                <p className="text-ink-300 text-[10px]">{USER.city}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Page body ─────────────────────────────────────────────── */}
      <div className="bg-ink-50 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

          {/* Welcome strip */}
          <div className="mb-8">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Welcome back, {USER.firstName}.
            </h1>
            <p className="text-ink-300 text-sm mt-1">Here's what's happening with your photographer search.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Left column (main) ──────────────────────────────── */}
            <div className="lg:col-span-2 space-y-6">

              {/* Conversations */}
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink text-sm">Messages</h2>
                    {CONVERSATIONS.reduce((a, c) => a + c.unread, 0) > 0 && (
                      <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                        {CONVERSATIONS.reduce((a, c) => a + c.unread, 0)} new
                      </span>
                    )}
                  </div>
                  <Link href="/messages" className="text-xs text-ink-400 hover:text-ink font-medium transition-colors flex items-center gap-0.5">
                    View all <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="divide-y divide-ink-50">
                  {CONVERSATIONS.map((c) => (
                    <Link
                      key={c.slug}
                      href={`/messages/${c.slug}`}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-ink-50/60 transition-colors"
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        {c.avatar ? (
                          <div className="w-10 h-10 rounded-xl overflow-hidden">
                            <Image src={c.avatar} alt={c.name} width={40} height={40} className="object-cover w-full h-full" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-ink flex items-center justify-center text-white text-[11px] font-bold">
                            {c.initials}
                          </div>
                        )}
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${c.status === 'online' ? 'bg-emerald-400' : 'bg-ink-200'}`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1.5">
                            <p className={`text-sm leading-tight ${c.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink'}`}>{c.name}</p>
                            {c.unread > 0 && <UnreadDot />}
                          </div>
                          <p className="text-ink-200 text-[10px] flex-shrink-0 ml-2">{c.time}</p>
                        </div>
                        <p className="text-ink-300 text-[10px] mb-1">{c.specialty}</p>
                        <p className="text-ink-400 text-xs truncate">{c.lastMessage}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                <div className="px-5 py-3 border-t border-ink-50 bg-ink-50/40">
                  <Link href="/photographers" className="text-xs text-ink font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all">
                    <Camera className="w-3.5 h-3.5" />
                    Message a new photographer
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* My Bookings */}
              <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
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

                {bookings.length === 0 ? (
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
                      return (
                      <div key={b.id} className={`rounded-2xl border overflow-hidden ${isInactive ? 'border-ink-100 opacity-60' : 'border-ink-100 bg-ink-50/40'}`}>
                        {/* Card header */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-ink-100">
                          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                            {b.photographerAvatar ? (
                              <Image src={b.photographerAvatar} alt={b.photographerName} width={36} height={36} className="object-cover w-full h-full" />
                            ) : (
                              <div className={`w-9 h-9 ${b.photographerBg} flex items-center justify-center text-white text-xs font-bold`}>
                                {b.photographerInitials}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-ink leading-tight">{b.photographerName}</p>
                            <p className="text-[10px] text-ink-300">{b.sessionType}</p>
                          </div>
                          <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${chipStyle}`}>
                            {chipLabel}
                          </span>
                        </div>

                        {/* Card body */}
                        <div className="px-4 py-3 space-y-2.5">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className="flex items-center gap-1.5 text-xs text-ink-400"><Calendar className="w-3.5 h-3.5" />{b.date}</span>
                            <span className="flex items-center gap-1.5 text-xs text-ink-400"><Clock className="w-3.5 h-3.5" />{b.timeSlot}</span>
                            <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              b.billingType === 'hourly'
                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : 'bg-sky-50 text-sky-700 border-sky-200'
                            }`}>
                              {b.billingType === 'hourly'
                                ? <><Timer className="w-2.5 h-2.5" /> Per hour</>
                                : <><Package className="w-2.5 h-2.5" /> Package</>}
                            </span>
                            <span className="text-[10px] text-ink-400 font-medium">{b.billingDetail}</span>
                          </div>

                          {b.description && (
                            <p className="text-xs text-ink-500 leading-relaxed">{b.description}</p>
                          )}

                          {b.photographerNote && (
                            <div className={`border rounded-xl px-3 py-2.5 ${b.status === 'completed' ? 'bg-blue-50 border-blue-100' : 'bg-emerald-50 border-emerald-100'}`}>
                              <p className={`text-[10px] font-semibold mb-0.5 ${b.status === 'completed' ? 'text-blue-600' : 'text-emerald-600'}`}>
                                Note from {b.photographerName.split(' ')[0]}
                              </p>
                              <p className={`text-xs leading-relaxed ${b.status === 'completed' ? 'text-blue-700' : 'text-emerald-700'}`}>
                                {b.photographerNote}
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
                            href={b.status === 'pending' ? `/photographers/${b.slug}?pending=1&date=${encodeURIComponent(b.date)}&slot=${encodeURIComponent(b.timeSlot)}` : `/photographers/${b.slug}`}
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
                                href={`/photographers/${b.slug}#availability`}
                                className="text-xs font-semibold bg-ink text-white px-3 py-1.5 rounded-xl hover:bg-ink-800 transition-colors flex items-center gap-1.5"
                              >
                                <CalendarClock className="w-3.5 h-3.5" />
                                Book another occasion
                              </Link>
                            )}
                            {b.status === 'completed' && (
                              <button
                                onClick={() => setReviewTarget({ slug: b.slug, name: b.photographerName, sessionLabel: b.sessionType, date: b.date, avatar: b.photographerAvatar, initials: b.photographerInitials })}
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

              {/* Pending reviews */}
              {PENDING_REVIEWS.length > 0 && (
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-ink-50">
                    <Star className="w-4 h-4 text-ink-400" />
                    <h2 className="font-semibold text-ink text-sm">Leave a review</h2>
                    <span className="bg-ink-100 text-ink-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                      {PENDING_REVIEWS.length} pending
                    </span>
                  </div>

                  {PENDING_REVIEWS.map((r) => (
                    <div key={r.slug} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                        <Image src={r.avatar} alt={r.name} width={40} height={40} className="object-cover w-full h-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-ink text-sm leading-tight">{r.name}</p>
                        <p className="text-ink-300 text-xs">{r.sessionLabel} · {r.date}</p>
                      </div>
                      <button
                        onClick={() => setReviewTarget(r)}
                        className="bg-ink hover:bg-ink-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                      >
                        Review
                      </button>
                    </div>
                  ))}
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
                        <p className="text-ink-300 text-[10px]">{s.count}</p>
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
                  <div className="w-14 h-14 rounded-2xl bg-ink flex items-center justify-center text-white text-base font-bold mb-3">
                    {USER.initials}
                  </div>
                  <p className="font-semibold text-ink text-sm">{USER.firstName} {USER.lastName}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-ink-300" />
                    <p className="text-ink-300 text-xs">{USER.city}</p>
                  </div>
                  <p className="text-ink-200 text-[10px] mt-0.5">Member since {USER.memberSince}</p>
                </div>

                <div className="space-y-2">
                  <Link href="/dashboard/client/edit" className="flex items-center gap-2.5 text-ink-500 hover:text-ink text-sm transition-colors py-1">
                    <Settings className="w-4 h-4" />
                    Account settings
                  </Link>
                  <button onClick={() => setShowSignOut(true)} className="flex items-center gap-2.5 text-ink-300 hover:text-ink text-sm transition-colors py-1 w-full text-left">
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
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-ink text-sm">Saved</h3>
                  <Link href="/photographers" className="text-[10px] text-ink-400 hover:text-ink transition-colors">Browse more</Link>
                </div>
                <div className="space-y-4">
                  {SAVED_PHOTOGRAPHERS.map((p) => (
                    <div key={p.slug}>
                      {/* Photographer info row */}
                      <Link href={`/photographers/${p.slug}`} className="flex items-center gap-3 group mb-2">
                        <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0">
                          {p.avatar ? (
                            <Image src={p.avatar} alt={p.name} width={36} height={36} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full bg-ink flex items-center justify-center text-white text-[10px] font-bold">{p.initials}</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-ink text-xs leading-tight group-hover:underline">{p.name}</p>
                          <p className="text-ink-300 text-[10px]">{p.specialty} · {p.rate}</p>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Star className="w-2.5 h-2.5 text-ink fill-ink" />
                          <span className="text-ink text-[10px] font-bold">{p.rating}</span>
                        </div>
                      </Link>

                      {/* Album preview strip */}
                      {p.albumPreview.length > 0 && (
                        <Link href={`/photographers/${p.slug}`} className="flex gap-1.5 group">
                          {p.albumPreview.map((thumb, i) => (
                            <div key={i} className="relative flex-1 aspect-square rounded-lg overflow-hidden bg-ink-100">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={thumb.src} alt={thumb.album} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                              {i === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-1 pb-0.5">
                                  <p className="text-white text-[8px] font-medium truncate">{thumb.album}</p>
                                </div>
                              )}
                            </div>
                          ))}
                          <div className="flex-1 aspect-square rounded-lg bg-ink-50 flex items-center justify-center text-ink-300 text-[10px] font-medium border border-ink-100 hover:bg-ink-100 transition-colors">
                            View all
                          </div>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                <h3 className="font-semibold text-ink text-sm mb-4">Your activity</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Conversations', value: CONVERSATIONS.length.toString(), icon: MessageSquare },
                    { label: 'Saved', value: SAVED_PHOTOGRAPHERS.length.toString(), icon: Heart },
                    { label: 'Reviews left', value: '1', icon: Star },
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

      {/* Review modal */}
      {reviewTarget && (
        <ReviewModal p={reviewTarget} onClose={() => setReviewTarget(null)} />
      )}

      {/* Cancel booking modal */}
      {cancelTarget && (
        <CancelBookingModal
          photographerName={cancelTarget.photographerName}
          bookingStatus={cancelTarget.status}
          onConfirm={() => {
            // pending → cancelled immediately; approved → cancellation_pending (awaits photographer)
            const nextStatus: BookingStatus = cancelTarget.status === 'approved' ? 'cancellation_pending' : 'cancelled'
            setBookings(prev => prev.map(b => b.id === cancelTarget.id ? { ...b, status: nextStatus } : b))
            setCancelTarget(null)
          }}
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
