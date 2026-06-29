'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { NotificationCentre } from '@/components/notification-centre'
import {
  Bell, Camera, CheckCircle2, ChevronRight, Globe, Instagram,
  MapPin, MessageSquare, Star, User, Zap, ArrowRight,
  Eye, AlertCircle, Shield, ImagePlus, X, Send, Calendar,
  Clock, ChevronLeft, DollarSign, Save, Settings, ExternalLink,
  Package, Users, HelpCircle, GripVertical, ChevronDown, ChevronUp,
  ChevronsUp, ChevronsDown, LogOut,
  Plus, Pencil, Trash2, Paperclip, FileText, Play,
  FolderPlus, FolderOpen, Video, Image as ImageIcon,
  Facebook, RefreshCw, Link2, UserPlus, Search,
} from 'lucide-react'
import { AvailabilityTimeSlots, type WeeklySchedule } from '@/components/availability-time-slots'
import { ProjectPackages, type ProjectPackage } from '@/components/project-packages'
import { ReviewManager } from '@/components/review-manager'
import { PhotographerConnections, GroupChat, type Group, type GroupMessage } from '@/components/photographer-connections'
import { Inbox } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { computeBadge, computeBadgeProgress, type BadgeSignals } from '@/lib/badges'
import { PhotographerBadge } from '@/components/photographer-badge'

// ─── FAQ types & seed ─────────────────────────────────────────────────────────

interface FAQ {
  id: string
  question: string
  answer: string
  sort_order: number
}

import { PLATFORM_CONFIG } from '@/lib/platform-config'

const MAX_FAQS = PLATFORM_CONFIG.max_faqs_per_photographer

// ─── Portfolio constants ───────────────────────────────────────────────────────
const MAX_ALBUMS           = PLATFORM_CONFIG.max_albums_per_photographer
const MAX_PHOTOS_TOTAL     = PLATFORM_CONFIG.max_photos_per_photographer
const MAX_VIDEOS_TOTAL     = PLATFORM_CONFIG.max_videos_per_photographer
const MAX_PHOTO_BYTES      = PLATFORM_CONFIG.max_photo_bytes
const MAX_PHOTO_MB         = MAX_PHOTO_BYTES / 1024 / 1024
const MAX_ALBUM_NAME       = PLATFORM_CONFIG.max_album_name_length
const MAX_CAPTION          = PLATFORM_CONFIG.max_photo_caption_length

const PHOTO_TAG_OPTIONS = [
  'Wedding', 'Portrait', 'Outdoor', 'Studio', 'Newborn', 'Family',
  'Corporate', 'Events', 'Real Estate', 'Golden Hour', 'Black & White',
  'Editorial', 'Street', 'Nature', 'Travel', 'Night',
]

interface PortfolioPhoto {
  id: string; src: string; caption: string; isCover: boolean; storage_asset_id: string
  tags: string[]; photo_taken_month: number | null; photo_taken_year: number | null
}
interface PortfolioVideo {
  id: string; src: string; title: string; duration_seconds: number | null; storage_asset_id: string
  tags: string[]; video_taken_month: number | null; video_taken_year: number | null
}
interface PortfolioAlbum {
  id: string; title: string; photos: PortfolioPhoto[]; videos: PortfolioVideo[]
}
function totalPortfolioPhotos(albums: PortfolioAlbum[]) { return albums.reduce((n, a) => n + a.photos.length, 0) }
function totalPortfolioVideos(albums: PortfolioAlbum[]) { return albums.reduce((n, a) => n + a.videos.length, 0) }

async function uploadPortfolioPhoto(file: File, albumId: string): Promise<PortfolioPhoto | null> {
  const form = new FormData()
  form.append('file', file)
  form.append('album_id', albumId)
  const res = await fetch('/api/photographer/photos/upload', { method: 'POST', body: form })
  if (!res.ok) return null
  return res.json()
}

// ─── Booking request types ───────────────────────────────────────────────────

type DashboardTab = 'overview' | 'portfolio' | 'messages' | 'requests' | 'availability' | 'packages' | 'reviews' | 'network' | 'faq' | 'settings' | 'trust'

type BookingRequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'cancellation_pending' | 'completed'

type BookingBillingType = 'hourly' | 'package'

interface BookingRequest {
  id: string
  clientId: string
  clientName: string
  clientInitials: string
  clientBg: string
  date: string          // display label e.g. "May 24, 2026"
  dateKey: string       // "2026-4-24" — matches availability key
  isoDate: string       // "2026-05-24" — YYYY-MM-DD for calendar
  timeSlot: string      // "10:00 AM – 12:00 PM"
  note: string
  billingType: BookingBillingType
  billingDetail: string
  status: BookingRequestStatus
  photographerNote: string
  submittedAt: string
  conversationId?: string | null
}


function fmtSubmitted(iso: string): string {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  const days = Math.floor(h / 24)
  if (days < 7) return days === 1 ? 'Yesterday' : `${days}d ago`
  return d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined })
}

// ─── BookingRequestsTab ───────────────────────────────────────────────────────

function BookingRequestsTab({
  requests,
  setRequests,
  setBookedDates,
  setMessages,
  setActiveTab,
  expandedId: expandedIdProp,
  setExpandedId: setExpandedIdProp,
}: {
  requests: BookingRequest[]
  setRequests: React.Dispatch<React.SetStateAction<BookingRequest[]>>
  setBookedDates: React.Dispatch<React.SetStateAction<Record<string, DayStatus>>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setActiveTab: (tab: DashboardTab) => void
  expandedId?: string | null
  setExpandedId?: React.Dispatch<React.SetStateAction<string | null>>
}) {
  const [filter, setFilter] = useState<BookingRequestStatus | 'all'>('all')
  const [_expandedId, _setExpandedId] = useState<string | null>(null)
  const expandedId = expandedIdProp !== undefined ? expandedIdProp : _expandedId
  const setExpandedId = setExpandedIdProp ?? _setExpandedId
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [clientReviewTarget, setClientReviewTarget] = useState<BookingRequest | null>(null)
  const [clientReviewedIds, setClientReviewedIds] = useState<Set<string>>(new Set())

  // When a booking is selected from the calendar, clear status filter and scroll to card
  useEffect(() => {
    if (!expandedId) return
    setFilter('all')
    setTimeout(() => {
      const el = document.getElementById(`booking-card-${expandedId}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 80)
  }, [expandedId])

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  // Helper: post a template message to the conversation after a status change
  function sendTemplateMessage(req: BookingRequest, body: string) {
    if (!req.conversationId) return
    fetch(`/api/photographer/messages/${req.conversationId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: body }),
    }).catch(() => {})
  }

  function approve(id: string) {
    const req = requests.find(r => r.id === id)
    if (!req) return
    const note = noteDraft[id] ?? req.photographerNote
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'approved', photographerNote: note } : r))
    setBookedDates(d => ({ ...d, [req.dateKey]: 'busy' }))
    fetch('/api/photographer/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'approved', photographer_note: note }),
    }).then(() => {
      const tmpl = `✅ Your booking for ${req.date} has been approved! Looking forward to our session.${note ? ' ' + note : ''}`
      sendTemplateMessage({ ...req, status: 'approved', photographerNote: note }, tmpl)
    }).catch(() => {})
  }

  function reject(id: string) {
    const req = requests.find(r => r.id === id)
    if (!req) return
    const note = noteDraft[id] ?? req.photographerNote
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'declined', photographerNote: note } : r))
    setBookedDates(d => { const n = { ...d }; delete n[req.dateKey]; return n })
    fetch('/api/photographer/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'declined', photographer_note: note }),
    }).then(() => {
      const tmpl = `Sorry, I'm unable to take this booking for ${req.date}.${note ? ' ' + note : ''}`
      sendTemplateMessage({ ...req, status: 'declined', photographerNote: note }, tmpl)
    }).catch(() => {})
  }

  function reopen(id: string) {
    const req = requests.find(r => r.id === id)
    if (!req) return
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'pending' } : r))
    fetch('/api/photographer/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'pending' }),
    }).then(() => {
      const tmpl = `I've reconsidered — your booking request for ${req.date} is back under review.`
      sendTemplateMessage(req, tmpl)
    }).catch(() => {})
  }

  function complete(id: string) {
    const req = requests.find(r => r.id === id)
    if (!req) return
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'completed' } : r))
    fetch('/api/photographer/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'completed' }),
    }).then(() => {
      sendTemplateMessage(req, `🎉 Session complete! It was a pleasure working with you.`)
    }).catch(() => {})
  }

  function cancelBooking(id: string) {
    const req = requests.find(r => r.id === id)
    if (!req) return
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
    fetch('/api/photographer/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'cancelled' }),
    }).catch(() => {})
  }

  function saveNote(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, photographerNote: noteDraft[id] ?? r.photographerNote } : r))
    fetch('/api/photographer/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'pending', photographer_note: noteDraft[id] }),
    }).catch(() => {})
  }

  function openChat(req: BookingRequest) {
    // If we have a real conversation ID, ensure the message thread is loaded then navigate to messages tab
    if (req.conversationId) {
      // Pre-populate the conversation in the messages list if not present
      setMessages(msgs => {
        const exists = msgs.find(m => m.id === req.conversationId)
        if (!exists) {
          return [...msgs, {
            id: req.conversationId!,
            from: req.clientName,
            initials: req.clientInitials,
            bg: req.clientBg,
            preview: req.note || 'Booking enquiry',
            time: 'Now',
            unread: false,
            thread: [],
            threadLoaded: false,
          }]
        }
        return msgs
      })
    }
    setActiveTab('messages')
  }

  const statusChip: Record<BookingRequestStatus, string> = {
    pending:              'bg-amber-50 text-amber-700 border-amber-200',
    approved:             'bg-emerald-50 text-emerald-700 border-emerald-200',
    declined:             'bg-red-50 text-red-600 border-red-100',
    cancelled:            'bg-ink-50 text-ink-400 border-ink-100',
    cancellation_pending: 'bg-orange-50 text-orange-700 border-orange-200',
    completed:            'bg-blue-50 text-blue-700 border-blue-100',
  }

  const statusLabel: Record<BookingRequestStatus, string> = {
    pending:              'Pending',
    approved:             'Approved',
    declined:             'Declined',
    cancelled:            'Cancelled',
    cancellation_pending: 'Cancellation requested',
    completed:            'Completed',
  }

  return (
    <>
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total',     value: requests.length },
          { label: 'Pending',   value: pendingCount },
          { label: 'Approved',  value: requests.filter(r => r.status === 'approved').length },
          { label: 'Cancelled', value: requests.filter(r => r.status === 'cancelled').length },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl px-3 py-3 text-center border border-ink-100">
            <p className="font-bold text-ink text-lg">{s.value}</p>
            <p className="text-ink-300 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {pendingCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 leading-relaxed">
          <strong>{pendingCount} pending request{pendingCount > 1 ? 's' : ''}</strong> — while pending, the time slot is marked as <strong>tentative</strong> on your availability calendar. Approve or decline to update it.
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-ink-100 overflow-x-auto">
        {([
          { key: 'all',                  label: `All (${requests.length})` },
          { key: 'pending',              label: `Pending (${pendingCount})` },
          { key: 'approved',             label: `Approved (${requests.filter(r => r.status === 'approved').length})` },
          { key: 'cancellation_pending', label: `Cancellation req. (${requests.filter(r => r.status === 'cancellation_pending').length})` },
          { key: 'declined',             label: `Declined (${requests.filter(r => r.status === 'declined').length})` },
          { key: 'cancelled',            label: `Cancelled (${requests.filter(r => r.status === 'cancelled').length})` },
          { key: 'completed',            label: `Completed (${requests.filter(r => r.status === 'completed').length})` },
        ] as { key: BookingRequestStatus | 'all'; label: string }[]).map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 text-xs font-medium py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
              filter === f.key ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Request cards */}
      <div className="space-y-3">
        {visible.length === 0 && (
          <p className="text-sm text-ink-300 text-center py-6">No requests in this category.</p>
        )}
        {visible.map(req => {
          const expanded = expandedId === req.id
          return (
            <div key={req.id} id={`booking-card-${req.id}`} className={`rounded-2xl border overflow-hidden transition-all ${
              req.status === 'cancelled' ? 'bg-ink-50/60 border-ink-100 opacity-70' : 'bg-white'
            } ${
              req.status === 'pending'  ? 'border-amber-200' :
              req.status === 'approved' ? 'border-emerald-100' : 'border-ink-100'
            }`}>
              {/* Card header */}
              <button
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-ink-50/60 transition-colors"
                onClick={() => setExpandedId(expanded ? null : req.id)}
              >
                <div className={`w-10 h-10 rounded-full ${req.clientBg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                  {req.clientInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="text-sm font-semibold text-ink">{req.clientName}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusChip[req.status]}`}>
                      {statusLabel[req.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap text-xs text-ink-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{req.date}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{req.timeSlot}</span>
                    <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      req.billingType === 'hourly'
                        ? 'bg-violet-50 text-violet-700 border-violet-200'
                        : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {req.billingType === 'hourly' ? 'Per hour' : 'Package'}
                    </span>
                    <span className="text-ink-300">{req.billingDetail}</span>
                  </div>
                  <p className="text-xs text-ink-300 mt-0.5">{fmtSubmitted(req.submittedAt)}</p>
                </div>
                <ChevronRight className={`w-4 h-4 text-ink-300 flex-shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
              </button>

              {/* Expanded */}
              {expanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-ink-50 pt-4">
                  {/* Client note */}
                  {req.note && (
                    <div className="bg-ink-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-1">Client's message</p>
                      <p className="text-sm text-ink-500 leading-relaxed">{req.note}</p>
                    </div>
                  )}

                  {/* Cancelled — read-only notice, no actions */}
                  {(req.status === 'cancelled' || req.status === 'cancellation_pending') && (
                    <div className="flex items-center gap-2 bg-ink-50 border border-ink-100 rounded-xl px-4 py-3">
                      <X className="w-4 h-4 text-ink-400 flex-shrink-0" />
                      <p className="text-xs text-ink-500">This request was cancelled by the client. The time slot has been freed up on your calendar.</p>
                    </div>
                  )}

                  {/* Photographer note textarea — only for pending */}
                  {req.status === 'pending' && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest">
                          Your note to client <span className="text-ink-300 font-normal normal-case">(sent with your response)</span>
                        </label>
                        {(noteDraft[req.id] ?? req.photographerNote ?? '').length > PLATFORM_CONFIG.max_photographer_response_length - 100 && (
                          <span className={`text-[10px] ${(noteDraft[req.id] ?? req.photographerNote ?? '').length >= PLATFORM_CONFIG.max_photographer_response_length ? 'text-red-500' : 'text-amber-500'}`}>
                            {(noteDraft[req.id] ?? req.photographerNote ?? '').length}/{PLATFORM_CONFIG.max_photographer_response_length}
                          </span>
                        )}
                      </div>
                      <textarea
                        rows={3}
                        value={noteDraft[req.id] ?? req.photographerNote}
                        onChange={e => {
                          if (e.target.value.length <= PLATFORM_CONFIG.max_photographer_response_length)
                            setNoteDraft(d => ({ ...d, [req.id]: e.target.value }))
                        }}
                        maxLength={PLATFORM_CONFIG.max_photographer_response_length}
                        placeholder="Add a message for the client — confirm details, ask questions, or explain a rejection…"
                        className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink resize-none transition-all"
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => saveNote(req.id)}
                          className="text-xs font-medium text-ink border border-ink-100 px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors">
                          Save note
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Already responded note — non-pending, non-cancelled */}
                  {req.status !== 'pending' && req.status !== 'cancelled' && req.status !== 'cancellation_pending' && req.photographerNote && (
                    <div className="bg-ink-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-1">Your response</p>
                      <p className="text-sm text-ink-500 leading-relaxed">{req.photographerNote}</p>
                    </div>
                  )}

                  {/* ── Actions by status ── */}

                  {/* pending → Approve + Decline */}
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(req.id)}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-emerald-600 text-white py-2.5 rounded-xl hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                      <button
                        onClick={() => reject(req.id)}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold border border-red-200 text-red-600 py-2.5 rounded-xl hover:bg-red-50 transition-colors"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                    </div>
                  )}

                  {/* approved → Mark complete + Cancel + Open chat */}
                  {req.status === 'approved' && (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => complete(req.id)}
                          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Mark complete
                        </button>
                        <button
                          onClick={() => cancelBooking(req.id)}
                          className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold border border-ink-200 text-ink-500 py-2.5 rounded-xl hover:bg-ink-50 transition-colors"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                      <button onClick={() => openChat(req)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 py-2.5 rounded-xl hover:bg-ink-50 hover:text-ink transition-colors">
                        <MessageSquare className="w-4 h-4" /> Open chat →
                      </button>
                    </div>
                  )}

                  {/* declined → Reopen + Open chat */}
                  {req.status === 'declined' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => reopen(req.id)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-semibold border border-amber-200 text-amber-700 py-2.5 rounded-xl hover:bg-amber-50 transition-colors"
                      >
                        <RefreshCw className="w-4 h-4" /> Reopen
                      </button>
                      <button onClick={() => openChat(req)}
                        className="w-full flex items-center justify-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 py-2.5 rounded-xl hover:bg-ink-50 hover:text-ink transition-colors">
                        <MessageSquare className="w-4 h-4" /> Open chat →
                      </button>
                    </div>
                  )}

                  {/* completed → Open chat + Review client */}
                  {req.status === 'completed' && (
                    <div className="flex gap-2">
                      <button onClick={() => openChat(req)}
                        className="flex-1 flex items-center justify-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 py-2.5 rounded-xl hover:bg-ink-50 hover:text-ink transition-colors">
                        <MessageSquare className="w-4 h-4" /> Open chat
                      </button>
                      {!clientReviewedIds.has(req.id) && (
                        <button onClick={() => setClientReviewTarget(req)}
                          className="flex-1 flex items-center justify-center gap-2 text-sm font-medium bg-ink-50 text-ink py-2.5 rounded-xl hover:bg-ink-100 transition-colors">
                          <Star className="w-4 h-4" /> Review client
                        </button>
                      )}
                      {clientReviewedIds.has(req.id) && (
                        <span className="flex-1 flex items-center justify-center gap-1.5 text-xs text-ink-300 py-2.5">
                          <Star className="w-3.5 h-3.5 fill-ink-200 text-ink-200" /> Client reviewed
                        </span>
                      )}
                    </div>
                  )}

                  {/* cancelled / cancellation_pending → Open chat */}
                  {(req.status === 'cancelled' || req.status === 'cancellation_pending') && (
                    <button onClick={() => openChat(req)}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 py-2.5 rounded-xl hover:bg-ink-50 hover:text-ink transition-colors">
                      <MessageSquare className="w-4 h-4" /> Open chat →
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>

    {clientReviewTarget && (
      <ClientReviewModal
        req={clientReviewTarget}
        onClose={() => setClientReviewTarget(null)}
        onSuccess={(id) => {
          setClientReviewedIds(prev => { const s = new Set(prev); s.add(id); return s })
          setClientReviewTarget(null)
        }}
      />
    )}
    </>
  )
}

function ClientReviewModal({
  req,
  onClose,
  onSuccess,
}: {
  req: BookingRequest
  onClose: () => void
  onSuccess: (bookingId: string) => void
}) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const LABELS = ['', 'Difficult', 'Below avg', 'Good', 'Great', 'Excellent']

  async function submit() {
    if (!rating) return
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/photographer/reviews/client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ booking_id: req.id, rating, body: text.trim() || undefined }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? 'Failed to save review')
        return
      }
      setDone(true)
      onSuccess(req.id)
    } catch {
      setError('Network error — please try again')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
        style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-ink-50">
          <div>
            <p className="font-semibold text-ink text-sm">{done ? 'Review saved' : 'Review this client'}</p>
            <p className="text-ink-300 text-xs mt-0.5">{req.clientName} · {req.date}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full bg-ink-50 hover:bg-ink-100 flex items-center justify-center transition-colors">
            <X className="w-3.5 h-3.5 text-ink-400" />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center text-center px-5 py-8 gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ink flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <p className="font-semibold text-ink text-sm">Saved privately</p>
            <p className="text-ink-300 text-xs">Only you can see this. It helps you remember clients you work with.</p>
            <button onClick={onClose} className="mt-1 text-xs font-medium text-ink underline underline-offset-2">Done</button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5">
              <p className="text-xs text-amber-700">🔒 Private — only visible to you. Never shown to clients or publicly.</p>
            </div>

            <div>
              <p className="text-sm font-medium text-ink mb-3">How was working with them?</p>
              <div className="flex items-center gap-2">
                {[1,2,3,4,5].map(i => (
                  <button key={i} type="button"
                    onClick={() => setRating(i)}
                    onMouseEnter={() => setHover(i)}
                    onMouseLeave={() => setHover(0)}
                    className="transition-transform hover:scale-110">
                    <Star className={`w-8 h-8 transition-colors ${i <= (hover || rating) ? 'text-ink fill-ink' : 'text-ink-100 fill-ink-100'}`} />
                  </button>
                ))}
                <span className="text-ink-400 text-sm ml-1 w-16 font-medium">
                  {(hover || rating) > 0 ? LABELS[hover || rating] : ''}
                </span>
              </div>
            </div>

            <textarea
              rows={2}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Any notes for your own reference? (optional)"
              className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
            />

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button type="button" disabled={!rating || submitting} onClick={submit}
              className="w-full bg-ink hover:bg-ink-800 disabled:opacity-40 text-white font-semibold py-2.5 rounded-xl text-sm transition-colors">
              {submitting ? 'Saving…' : 'Save private review'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProfileData {
  displayName: string
  bio: string
  area: string
  rate: string
  rateUnit: string
  specialties: string[]
  websiteUrl: string
  contactInstagram: string
  contactFacebook: string
  hasPortfolio: boolean
  availabilitySet: boolean
  email: string
  avatarUrl: string
  coverImageUrl: string
  trustScore: number
  // Badge signal fields — populated from profile API
  completenessScore: number
  nativeAvgRating: number
  nativeReviewCount: number
  yearsExperience: number | null
  portfolioPhotoCount: number
  completedBookings: number
  isGbpOAuthConnected: boolean
  gbpReviewCount: number
  accountAgeDays: number
  profileStatus: string
}

interface Message {
  id: string  // conversation id (UUID from DB)
  from: string
  initials: string
  bg: string
  preview: string
  time: string
  unread: boolean
  thread: ChatMsg[]
  threadLoaded?: boolean
}

interface ChatMsg {
  id: number | string
  from: 'me' | 'them'
  text: string
  time: string
  attachmentUrl?: string | null
  attachmentType?: 'image' | 'video' | 'pdf' | null
  attachmentName?: string | null
  attachmentSize?: number | null
}

// ─── Mock data ───────────────────────────────────────────────────────────────


const SPECIALTIES_ALL = [
  'Wedding', 'Portrait', 'Corporate', 'Newborn', 'Family', 'Event',
  'Real Estate', 'Product', 'Street', 'Boudoir', 'Sports', 'Food',
]

const EDMONTON_AREAS = [
  'Downtown', 'Oliver', 'Glenora', 'Westmount', 'Strathcona',
  'Bonnie Doon', 'Millwoods', 'Windermere', 'St. Albert', 'Sherwood Park',
  'West Edmonton', 'North Edmonton', 'South Edmonton', 'Other',
]

// ─── Completion scoring ───────────────────────────────────────────────────────

function computeScore(p: ProfileData & { faqCount?: number }) {
  const sections = [
    { key: 'name',         label: 'Display name',          done: !!p.displayName,                weight: 10, tab: 'settings',      cta: 'Add your name' },
    { key: 'bio',          label: 'Bio written',            done: p.bio.length >= 20,             weight: 10, tab: 'settings',      cta: 'Write your bio' },
    { key: 'area',         label: 'Location set',           done: !!p.area,                       weight: 5,  tab: 'settings',      cta: 'Set your area' },
    { key: 'rate',         label: 'Rate added',             done: !!p.rate,                       weight: 5,  tab: 'settings',      cta: 'Add your rate' },
    { key: 'avatar',       label: 'Profile photo',          done: !!p.avatarUrl,                  weight: 10, tab: 'settings',      cta: 'Upload photo' },
    { key: 'specialties',  label: 'Specialties chosen',     done: p.specialties.length > 0,       weight: 10, tab: 'settings',      cta: 'Pick specialties' },
    { key: 'portfolio',    label: 'Portfolio photos',        done: p.hasPortfolio,                 weight: 15, tab: 'portfolio',     cta: 'Upload photos' },
    { key: 'availability', label: 'Availability set',        done: p.availabilitySet,              weight: 10, tab: 'availability',  cta: 'Set availability' },
    { key: 'faq',          label: 'At least 1 FAQ added',   done: (p.faqCount ?? 0) > 0,          weight: 5,  tab: 'faq',           cta: 'Add a FAQ' },
    { key: 'trust',        label: 'Trust score connected',  done: Number(p.trustScore ?? 0) > 0,  weight: 20, tab: 'trust',         cta: 'Connect GBP' },
  ]
  const earned = sections.filter(s => s.done).reduce((a, s) => a + s.weight, 0)
  const total = sections.reduce((a, s) => a + s.weight, 0)
  return { sections, pct: Math.round((earned / total) * 100) }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}

// ─── Completion Ring ──────────────────────────────────────────────────────────

function CompletionRing({ pct, size = 96 }: { pct: number; size?: number }) {
  const r = (size / 2) - 8
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ
  const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  const textColor = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`font-bold ${textColor} ${size >= 96 ? 'text-2xl' : 'text-sm'}`}>{pct}%</span>
      </div>
    </div>
  )
}

// ─── Availability Calendar ────────────────────────────────────────────────────

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

type DayStatus = 'available' | 'busy' | 'tentative' | null

// ─── BookingCalendar — Google Calendar-style month/week view ──────────────────

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7) // 7am–9pm

function fmt12(h: number) {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

function parseSlotHour(timeSlot: string): { start: number; end: number } | null {
  // e.g. "10:00 AM – 12:00 PM" or "2:30 PM – 4:00 PM"
  const match = timeSlot.match(/(\d+):(\d+)\s*(AM|PM)\s*[–-]\s*(\d+):(\d+)\s*(AM|PM)/i)
  if (!match) return null
  let sh = parseInt(match[1]), sm = parseInt(match[2])
  const sAP = match[3].toUpperCase()
  let eh = parseInt(match[4]), em = parseInt(match[5])
  const eAP = match[6].toUpperCase()
  if (sAP === 'PM' && sh !== 12) sh += 12
  if (sAP === 'AM' && sh === 12) sh = 0
  if (eAP === 'PM' && eh !== 12) eh += 12
  if (eAP === 'AM' && eh === 12) eh = 0
  return { start: sh + sm / 60, end: eh + em / 60 }
}

const STATUS_COLOR: Record<BookingRequestStatus, string> = {
  pending:              'bg-amber-400',
  approved:             'bg-emerald-500',
  declined:             'bg-red-400',
  cancelled:            'bg-ink-300',
  cancellation_pending: 'bg-orange-400',
  completed:            'bg-blue-400',
}

const STATUS_EVENT: Record<BookingRequestStatus, string> = {
  pending:              'bg-amber-50 border-amber-300 text-amber-800',
  approved:             'bg-emerald-50 border-emerald-300 text-emerald-800',
  declined:             'bg-red-50 border-red-200 text-red-700',
  cancelled:            'bg-ink-50 border-ink-200 text-ink-400',
  cancellation_pending: 'bg-orange-50 border-orange-300 text-orange-800',
  completed:            'bg-blue-50 border-blue-200 text-blue-700',
}

function BookingCalendar({
  bookings,
  bookedDates,
  setBookedDates,
  onSelectBooking,
  readOnly = false,
}: {
  bookings: BookingRequest[]
  bookedDates: Record<string, DayStatus>
  setBookedDates: React.Dispatch<React.SetStateAction<Record<string, DayStatus>>>
  onSelectBooking: (req: BookingRequest) => void
  readOnly?: boolean
}) {
  const today = new Date()
  const [calView, setCalView] = useState<'month' | 'week'>('month')
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const d = new Date(today)
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [activeTool, setActiveTool] = useState<DayStatus>('available')
  const [hoveredDay, setHoveredDay] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set())

  // Index bookings by isoDate for fast lookup
  const bookingsByDate = bookings.reduce<Record<string, BookingRequest[]>>((acc, b) => {
    if (!b.isoDate) return acc
    if (!acc[b.isoDate]) acc[b.isoDate] = []
    acc[b.isoDate].push(b)
    return acc
  }, {})

  function isoKey(y: number, m: number, d: number) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }
  function legacyKey(y: number, m: number, d: number) {
    return `${y}-${m}-${d}`
  }
  function getDayStatus(iso: string): DayStatus {
    const [y, m, d] = iso.split('-').map(Number)
    return bookedDates[legacyKey(y, m - 1, d)] ?? null
  }

  function toggleDay(iso: string) {
    const [y, m, d] = iso.split('-').map(Number)
    const lk = legacyKey(y, m - 1, d)
    setChangedKeys(prev => new Set([...Array.from(prev), lk]))
    setBookedDates(prev => {
      const current = prev[lk]
      const next = current === activeTool ? null : activeTool
      const updated = { ...prev }
      if (next === null) delete updated[lk]
      else updated[lk] = next
      return updated
    })
  }

  async function handleSave() {
    setSaving(true)
    const keys = Array.from(changedKeys)
    await Promise.all(keys.map(lk => {
      const [y, mi, d] = lk.split('-').map(Number)
      const isoDate = `${y}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      const status = bookedDates[lk]
      if (!status) return fetch(`/api/photographer/availability?date=${isoDate}`, { method: 'DELETE' })
      return fetch('/api/photographer/availability', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: isoDate, status }),
      })
    }))
    setChangedKeys(new Set())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  function jumpToWeek(iso: string) {
    const d = new Date(iso + 'T00:00:00')
    d.setDate(d.getDate() - d.getDay())
    d.setHours(0, 0, 0, 0)
    setWeekStart(d)
    setCalView('week')
  }

  const dayBg: Record<NonNullable<DayStatus>, string> = {
    available: 'bg-emerald-100 border-emerald-200',
    tentative: 'bg-amber-100 border-amber-200',
    busy:      'bg-red-100 border-red-200',
  }

  // ── Month view ────────────────────────────────────────────────────────────
  function MonthView() {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

    function prevMonth() {
      if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
      else setViewMonth(m => m - 1)
    }
    function nextMonth() {
      if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
      else setViewMonth(m => m + 1)
    }

    return (
      <div className="space-y-4">
        {/* Nav */}
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-ink-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-ink-400" />
          </button>
          <p className="font-semibold text-ink">{MONTHS[viewMonth]} {viewYear}</p>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-ink-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] font-semibold text-ink-300 uppercase tracking-wide py-1">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const iso = isoKey(viewYear, viewMonth, day)
            const status = getDayStatus(iso)
            const dayBookings = bookingsByDate[iso] ?? []
            const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()
            const isPast = new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())
            const isHovered = hoveredDay === iso

            return (
              <div
                key={day}
                onMouseEnter={() => setHoveredDay(iso)}
                onMouseLeave={() => setHoveredDay(null)}
                className={`min-h-[56px] rounded-xl border text-xs transition-all cursor-pointer flex flex-col p-1 gap-0.5 ${
                  isPast
                    ? 'border-transparent bg-transparent opacity-40 cursor-default'
                    : status
                    ? `${dayBg[status]} border`
                    : 'border-ink-100 hover:border-ink-300 hover:bg-ink-50'
                } ${isToday ? 'ring-2 ring-ink ring-offset-1' : ''}`}
                onClick={() => {
                  if (!readOnly && !isPast && isHovered) toggleDay(iso)
                }}
              >
                <div className="flex items-center justify-between px-0.5">
                  <span className={`font-medium ${isPast ? 'text-ink-200' : 'text-ink-500'}`}>{day}</span>
                  {dayBookings.length > 0 && (
                    <div className="flex gap-0.5">
                      {dayBookings.slice(0, 3).map(b => (
                        <span key={b.id} className={`w-1.5 h-1.5 rounded-full ${STATUS_COLOR[b.status]}`} />
                      ))}
                    </div>
                  )}
                </div>
                {/* Show up to 2 booking chips */}
                {dayBookings.slice(0, 2).map(b => (
                  <button
                    key={b.id}
                    onClick={e => { e.stopPropagation(); onSelectBooking(b) }}
                    className={`w-full text-left text-[9px] font-semibold px-1 py-0.5 rounded border truncate ${STATUS_EVENT[b.status]}`}
                  >
                    {b.clientName.split(' ')[0]} · {b.timeSlot.split('–')[0].trim()}
                  </button>
                ))}
                {dayBookings.length > 2 && (
                  <button
                    onClick={e => { e.stopPropagation(); jumpToWeek(iso) }}
                    className="text-[9px] text-ink-400 hover:text-ink px-1"
                  >
                    +{dayBookings.length - 2} more
                  </button>
                )}
                {/* Tap-to-block hint on hover */}
                {!readOnly && !isPast && isHovered && !status && dayBookings.length === 0 && (
                  <div className="text-[9px] text-ink-300 px-0.5 italic">tap to block</div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 border-t border-ink-50">
          <span className="text-[10px] font-semibold text-ink-300 uppercase tracking-wide self-center">Legend:</span>
          {[
            { color: 'bg-emerald-400', label: 'Available' },
            { color: 'bg-amber-400', label: 'Tentative' },
            { color: 'bg-red-400', label: 'Busy' },
            { color: 'bg-amber-400 ring-1 ring-amber-500', label: 'Pending booking' },
            { color: 'bg-emerald-500 ring-1 ring-emerald-600', label: 'Approved' },
            { color: 'bg-blue-400', label: 'Completed' },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${l.color}`} />
              <span className="text-xs text-ink-400">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── Week view ─────────────────────────────────────────────────────────────
  function WeekView() {
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart)
      d.setDate(d.getDate() + i)
      return d
    })

    function prevWeek() {
      setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d })
    }
    function nextWeek() {
      setWeekStart(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d })
    }

    const SLOT_H = 48 // px per hour
    const GRID_START = 7 // 7am

    return (
      <div className="space-y-3">
        {/* Week nav */}
        <div className="flex items-center justify-between">
          <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-ink-50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-ink-400" />
          </button>
          <p className="font-semibold text-ink text-sm">
            {weekDays[0].toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} – {weekDays[6].toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-ink-50 transition-colors">
            <ChevronRight className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        {/* Week grid */}
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            {/* Day headers */}
            <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b border-ink-100 mb-0">
              <div />
              {weekDays.map((d, i) => {
                const iso = d.toISOString().slice(0, 10)
                const isToday = iso === today.toISOString().slice(0, 10)
                return (
                  <div key={i} className={`text-center py-2 px-1 border-l border-ink-50 ${isToday ? 'bg-ink-50' : ''}`}>
                    <p className="text-[10px] font-semibold text-ink-400 uppercase">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]}</p>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5 ${isToday ? 'bg-ink text-white' : ''}`}>
                      <p className={`text-sm font-semibold ${isToday ? 'text-white' : 'text-ink'}`}>{d.getDate()}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Time grid */}
            <div className="relative" style={{ height: `${HOURS.length * SLOT_H}px` }}>
              {/* Hour lines + labels */}
              {HOURS.map((h, hi) => (
                <div key={h} className="absolute w-full flex items-start" style={{ top: `${hi * SLOT_H}px`, height: `${SLOT_H}px` }}>
                  <div className="w-12 flex-shrink-0 text-right pr-2">
                    <span className="text-[10px] text-ink-300 -translate-y-2 block">{fmt12(h)}</span>
                  </div>
                  <div className="flex-1 border-t border-ink-100 h-full" />
                </div>
              ))}

              {/* Day columns */}
              <div className="absolute left-12 right-0 top-0 bottom-0 grid grid-cols-7">
                {weekDays.map((d, di) => {
                  const iso = d.toISOString().slice(0, 10)
                  const dayStatus = getDayStatus(iso)
                  const dayBookings = bookingsByDate[iso] ?? []
                  const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate())

                  return (
                    <div
                      key={di}
                      className={`relative border-l border-ink-50 h-full ${
                        dayStatus === 'busy' ? 'bg-red-50/40' :
                        dayStatus === 'available' ? 'bg-emerald-50/30' :
                        dayStatus === 'tentative' ? 'bg-amber-50/30' : ''
                      } ${isPast ? 'opacity-50' : ''}`}
                    >
                      {/* Half-hour gridlines */}
                      {HOURS.map((h, hi) => (
                        <div key={h} className="absolute w-full border-t border-ink-50/60"
                          style={{ top: `${hi * SLOT_H + SLOT_H / 2}px` }} />
                      ))}

                      {/* Booking blocks */}
                      {dayBookings.map(b => {
                        const parsed = parseSlotHour(b.timeSlot)
                        if (!parsed) return null
                        const top = (parsed.start - GRID_START) * SLOT_H
                        const height = Math.max((parsed.end - parsed.start) * SLOT_H, 24)
                        return (
                          <button
                            key={b.id}
                            onClick={() => onSelectBooking(b)}
                            className={`absolute left-0.5 right-0.5 rounded-lg border text-left px-1.5 py-1 overflow-hidden z-10 ${STATUS_EVENT[b.status]}`}
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <p className="text-[10px] font-bold leading-tight truncate">{b.clientName.split(' ')[0]}</p>
                            <p className="text-[9px] leading-tight opacity-70 truncate">{b.timeSlot}</p>
                          </button>
                        )
                      })}

                      {/* Click to toggle availability */}
                      {!readOnly && !isPast && (
                        <button
                          onClick={() => toggleDay(iso)}
                          className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 hover:bg-ink-900/5 transition-opacity"
                          title={`Mark ${d.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })} as ${activeTool}`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Current time indicator */}
              {(() => {
                const nowH = today.getHours() + today.getMinutes() / 60
                if (nowH < GRID_START || nowH > GRID_START + HOURS.length) return null
                const top = (nowH - GRID_START) * SLOT_H
                return (
                  <div className="absolute left-12 right-0 z-20 pointer-events-none" style={{ top: `${top}px` }}>
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
                      <div className="flex-1 border-t-2 border-red-400" />
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* View toggle + tool selector + save */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Month/Week toggle */}
        <div className="flex items-center bg-ink-50 rounded-xl p-1 gap-0.5">
          {(['month', 'week'] as const).map(v => (
            <button key={v} onClick={() => {
              if (v === 'week') {
                // Jump week view to current month's first day
                const d = new Date(viewYear, viewMonth, 1)
                d.setDate(d.getDate() - d.getDay())
                setWeekStart(d)
              }
              setCalView(v)
            }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                calView === v ? 'bg-white text-ink shadow-sm' : 'text-ink-400 hover:text-ink'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Tool selector — hidden in read-only mode */}
        {!readOnly && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-ink-400 mr-1">Mark as:</span>
            {([
              { key: 'available' as DayStatus, label: 'Available', dot: 'bg-emerald-500' },
              { key: 'tentative' as DayStatus, label: 'Tentative', dot: 'bg-amber-400' },
              { key: 'busy' as DayStatus, label: 'Busy', dot: 'bg-red-400' },
            ]).map(t => (
              <button key={String(t.key)} onClick={() => setActiveTool(t.key)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-all ${
                  activeTool === t.key ? 'border-ink bg-ink text-white' : 'border-ink-100 text-ink-400 hover:border-ink-300'
                }`}>
                <span className={`w-2 h-2 rounded-full ${activeTool === t.key ? 'bg-white' : t.dot}`} />
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Save — hidden in read-only mode */}
        {!readOnly && changedKeys.size > 0 && (
          <button onClick={handleSave} disabled={saving}
            className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
              saved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-ink text-white hover:bg-ink-800'
            }`}>
            {saving ? <><Spinner /> Saving…</> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save changes ({changedKeys.size})</>}
          </button>
        )}
      </div>

      {calView === 'month' ? <MonthView /> : <WeekView />}
    </div>
  )
}

// ─── AvailabilityCalendar (legacy — kept for compatibility) ───────────────────

function AvailabilityCalendar({ bookedDates, setBookedDates }: {
  bookedDates: Record<string, DayStatus>
  setBookedDates: React.Dispatch<React.SetStateAction<Record<string, DayStatus>>>
}) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [activeTool, setActiveTool] = useState<DayStatus>('available')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [changedKeys, setChangedKeys] = useState<Set<string>>(new Set())

  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function toggleDay(day: number) {
    const key = `${viewYear}-${viewMonth}-${day}`
    setChangedKeys(prev => new Set([...Array.from(prev), key]))
    setBookedDates(prev => {
      const current = prev[key]
      return { ...prev, [key]: current === activeTool ? null : activeTool }
    })
  }

  function getDayStatus(day: number): DayStatus {
    return bookedDates[`${viewYear}-${viewMonth}-${day}`] ?? null
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  async function handleSave() {
    setSaving(true)
    const keys = Array.from(changedKeys)
    await Promise.all(
      keys.map(key => {
        // key format: "year-monthIndex-day" e.g. "2026-3-24" (monthIndex is 0-based)
        const [y, mi, d] = key.split('-').map(Number)
        const isoDate = `${y}-${String(mi + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
        const status = bookedDates[key]
        if (!status) {
          return fetch(`/api/photographer/availability?date=${isoDate}`, { method: 'DELETE' })
        }
        return fetch('/api/photographer/availability', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: isoDate, status }),
        })
      })
    )
    setChangedKeys(new Set())
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const statusStyles: Record<NonNullable<DayStatus>, string> = {
    available: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-200',
    busy: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
    tentative: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200',
  }

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  const isPast = (day: number) =>
    new Date(viewYear, viewMonth, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate())

  return (
    <div className="space-y-5">
      {/* Tool selector */}
      <div>
        <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest mb-3">Click a day to mark it as:</p>
        <div className="flex gap-2 flex-wrap">
          {([
            { key: 'available', label: 'Available', color: 'bg-emerald-500' },
            { key: 'tentative', label: 'Tentative', color: 'bg-amber-400' },
            { key: 'busy', key2: 'busy', label: 'Busy / Booked', color: 'bg-red-400' },
          ] as { key: DayStatus; label: string; color: string }[]).map(t => (
            <button
              key={String(t.key)}
              onClick={() => setActiveTool(t.key)}
              className={`flex items-center gap-2 text-sm px-4 py-2 rounded-xl border transition-all ${
                activeTool === t.key ? 'border-ink bg-ink-50 font-semibold text-ink' : 'border-ink-100 text-ink-400 hover:border-ink-300'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${t.color}`} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

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
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-ink-300 uppercase tracking-wide py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const status = getDayStatus(day)
          const past = isPast(day)
          const tod = isToday(day)
          return (
            <button
              key={day}
              onClick={() => !past && toggleDay(day)}
              disabled={past}
              className={`
                aspect-square rounded-xl text-xs font-medium border transition-all
                ${past ? 'text-ink-200 border-transparent cursor-default' : ''}
                ${!past && !status ? 'text-ink-500 border-ink-100 hover:border-ink-300 hover:bg-ink-50' : ''}
                ${status && !past ? statusStyles[status] : ''}
                ${tod ? 'ring-2 ring-ink ring-offset-1' : ''}
              `}
            >
              {day}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap">
        {[
          { color: 'bg-emerald-400', label: 'Available' },
          { color: 'bg-amber-400', label: 'Tentative' },
          { color: 'bg-red-400', label: 'Busy' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${l.color}`} />
            <span className="text-xs text-ink-400">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-xl transition-all ${
          saved ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-ink text-white hover:bg-ink-800'
        }`}
      >
        {saving ? <><Spinner /> Saving…</> : saved ? <><CheckCircle2 className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save availability</>}
      </button>
    </div>
  )
}

// ─── Messages / Chat ──────────────────────────────────────────────────────────

function MsgAttachmentPreview({ url, type, name, size, isMe }: {
  url: string
  type: 'image' | 'video' | 'pdf'
  name?: string | null
  size?: number | null
  isMe: boolean
}) {
  const sizeStr = size ? (size < 1024 * 1024 ? `${Math.round(size / 1024)} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`) : ''
  if (type === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name ?? 'image'} className="max-w-[220px] rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity" style={{ maxHeight: 200 }} />
      </a>
    )
  }
  if (type === 'video') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl ${isMe ? 'bg-white/10' : 'bg-ink-100'}`}>
        <div className="w-7 h-7 rounded-full bg-ink flex items-center justify-center flex-shrink-0">
          <Play className="w-3.5 h-3.5 text-white fill-white" />
        </div>
        <div className="min-w-0">
          <p className={`text-xs font-medium truncate ${isMe ? 'text-white' : 'text-ink'}`}>{name ?? 'video.mp4'}</p>
          {sizeStr && <p className={`text-[10px] ${isMe ? 'text-ink-200' : 'text-ink-400'}`}>{sizeStr}</p>}
        </div>
      </a>
    )
  }
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={`mt-1 flex items-center gap-2 px-3 py-2 rounded-xl ${isMe ? 'bg-white/10' : 'bg-ink-100'}`}>
      <FileText className={`w-5 h-5 flex-shrink-0 ${isMe ? 'text-white' : 'text-ink-500'}`} />
      <div className="min-w-0">
        <p className={`text-xs font-medium truncate ${isMe ? 'text-white' : 'text-ink'}`}>{name ?? 'document.pdf'}</p>
        {sizeStr && <p className={`text-[10px] ${isMe ? 'text-ink-200' : 'text-ink-400'}`}>{sizeStr} · PDF</p>}
      </div>
    </a>
  )
}

function MessagesTab({ messages, setMessages, groups, setGroups }: {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  groups: Group[]
  setGroups: React.Dispatch<React.SetStateAction<Group[]>>
}) {
  const [activeThread, setActiveThread] = useState<string | null>(null)
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadErr, setUploadErr] = useState<string | null>(null)
  const [showNewMsg, setShowNewMsg] = useState(false)
  const [startingDm, setStartingDm] = useState<string | null>(null)
  const [msgSearch, setMsgSearch] = useState('')
  const [connectedPhotographers, setConnectedPhotographers] = useState<{ id: string; name: string; initials: string; bg: string; area: string; specialties: string[]; status: string; coverAvailable: boolean }[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const scrollPaneRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/photographer/connections')
      .then(r => r.ok ? r.json() : { connected: [] })
      .then(data => {
        setConnectedPhotographers((data.connected ?? []).map((p: any) => ({
          id: p.id,
          name: p.name,
          initials: p.initials ?? '',
          bg: p.bg ?? 'bg-slate-600',
          area: p.area ?? '',
          specialties: p.specialties ?? [],
          status: 'connected',
          coverAvailable: p.coverAvailable ?? false,
        })))
      })
      .catch(() => {})
  }, [])

  const thread = messages.find(m => m.id === activeThread)
  const activeGroup = groups.find(g => g.id === activeGroupId)

  useEffect(() => {
    if (scrollPaneRef.current) {
      scrollPaneRef.current.scrollTop = scrollPaneRef.current.scrollHeight
    }
  }, [thread?.thread.length, activeThread])

  async function send(attachment?: { url: string; type: string; name: string; size: number }) {
    const text = draft.trim()
    if ((!text && !attachment) || !activeThread) return
    setSending(true)
    setDraft('')
    try {
      const res = await fetch(`/api/photographer/messages/${activeThread}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          attachment_url: attachment?.url ?? null,
          attachment_type: attachment?.type ?? null,
          attachment_name: attachment?.name ?? null,
          attachment_size: attachment?.size ?? null,
        }),
      })
      if (res.ok) {
        const msg = await res.json()
        setMessages(prev => prev.map(m =>
          m.id === activeThread
            ? { ...m, unread: false, preview: text || (attachment ? `📎 ${attachment.name}` : ''), thread: [...m.thread, msg] }
            : m
        ))
      }
    } catch { /* silently ignore */ }
    finally { setSending(false) }
  }

  async function sendFile(file: File) {
    if (!activeThread) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('conversation_id', activeThread)
    setUploading(true)
    setUploadErr(null)
    try {
      const res = await fetch('/api/photographer/messages/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setUploadErr(err.error ?? 'Upload failed')
        setTimeout(() => setUploadErr(null), 3000)
        return
      }
      const att = await res.json()
      await send({ url: att.url, type: att.type, name: att.name, size: att.size })
    } catch {
      setUploadErr('Upload failed')
      setTimeout(() => setUploadErr(null), 3000)
    } finally {
      setUploading(false)
    }
  }

  async function openThread(id: string) {
    setActiveThread(id)
    setActiveGroupId(null)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, unread: false } : m))
    // Load thread if not yet loaded
    const conv = messages.find(m => m.id === id)
    if (conv && !conv.threadLoaded) {
      try {
        const res = await fetch(`/api/photographer/messages/${id}`)
        if (res.ok) {
          const msgs = await res.json()
          setMessages(prev => prev.map(m => m.id === id ? { ...m, thread: msgs, threadLoaded: true } : m))
        }
      } catch { /* silent */ }
    }
  }

  function openGroup(id: string) {
    setActiveGroupId(id)
    setActiveThread(null)
    setGroups(prev => prev.map(g => g.id === id ? { ...g, unread: 0 } : g))
    fetch('/api/photographer/groups', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ group_id: id }),
    }).catch(() => {})
  }

  function sendGroupMessage(groupId: string, text: string, attachment?: { url: string; type: string; name: string; size: number }) {
    const now = new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    const nowIso = new Date().toISOString()
    setGroups(prev => prev.map(g => g.id !== groupId ? g : {
      ...g,
      lastActivityAt: nowIso,
      messages: [...g.messages, {
        id: Date.now(),
        senderId: 'me',
        senderName: 'You',
        senderInitials: 'YO',
        senderBg: 'bg-ink',
        text,
        time: now,
        attachmentUrl: attachment?.url ?? null,
        attachmentType: (attachment?.type ?? null) as GroupMessage['attachmentType'],
        attachmentName: attachment?.name ?? null,
        attachmentSize: attachment?.size ?? null,
      }],
    }))
    fetch('/api/photographer/groups/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group_id: groupId,
        body: text,
        attachment_url: attachment?.url ?? null,
        attachment_type: attachment?.type ?? null,
        attachment_name: attachment?.name ?? null,
        attachment_size: attachment?.size ?? null,
      }),
    }).catch(() => {})
  }

  function leaveGroup(groupId: string) {
    const g = groups.find(x => x.id === groupId)
    if (!g) return
    // Already left — just close the pane, don't fire DELETE again
    if (g.isLeft) { setActiveGroupId(null); return }
    // Optimistically update UI
    if (g.isCoverGroup || g.ownerId === 'me' || g.isRemoved) {
      setGroups(prev => prev.filter(x => x.id !== groupId))
    } else {
      setGroups(prev => prev.map(x => x.id === groupId
        ? { ...x, isLeft: true, memberIds: x.memberIds.filter(id => id !== 'me') }
        : x
      ))
    }
    setActiveGroupId(null)
    fetch(`/api/photographer/groups?id=${groupId}`, { method: 'DELETE' }).catch(() => {})
  }

  async function startDm(connectionId: string) {
    setStartingDm(connectionId)
    try {
      const res = await fetch('/api/photographer/connections/dm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_photographer_id: connectionId }),
      })
      if (res.ok) {
        const { group_id } = await res.json()
        // Refresh groups
        const grpRes = await fetch('/api/photographer/groups')
        if (grpRes.ok) {
          const data = await grpRes.json()
          if (Array.isArray(data.groups)) {
            setGroups(data.groups.map((g: any) => ({
              id: g.id,
              name: g.name,
              emoji: g.emoji ?? '👥',
              memberIds: g.memberIds ?? [],
              pendingInviteIds: g.pendingInviteIds ?? [],
              ownerId: g.ownerId ?? '',
              messages: (g.messages ?? []).map((m: any) => ({
                id: m.id, senderId: m.senderId, senderName: m.senderName,
                senderInitials: m.senderInitials, senderBg: m.senderBg,
                text: m.text, time: m.time, isSystem: m.isSystem ?? false,
                attachmentUrl: m.attachmentUrl ?? null, attachmentType: m.attachmentType ?? null,
                attachmentName: m.attachmentName ?? null, attachmentSize: m.attachmentSize ?? null,
              })) as GroupMessage[],
              unread: g.unread ?? 0,
              lastActivityAt: g.lastActivityAt ?? null,
              isCoverGroup: g.isCoverGroup ?? false,
              isDm: g.isDm ?? false,
              dmPeerId: g.dmPeerId ?? null,
              dmPeerName: g.dmPeerName ?? null,
              dmPeerInitials: g.dmPeerInitials ?? null,
              dmPeerBg: g.dmPeerBg ?? null,
              isRemoved: g.isRemoved ?? false,
              isLeft: g.isLeft ?? false,
            })))
          }
        }
        setShowNewMsg(false)
        openGroup(group_id)
      }
    } catch { /* silent */ }
    finally { setStartingDm(null) }
  }

  const totalUnread = groups.reduce((acc, g) => acc + (g.unread ?? 0), 0)

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)', minHeight: 520 }}>
      <div className="flex h-[680px]">
        {/* Thread list */}
        <div className={`${(activeThread || activeGroupId) ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-72 border-r border-ink-50 flex-shrink-0`}>
          <div className="px-4 py-3.5 border-b border-ink-50 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink text-sm">Messages</p>
              {totalUnread > 0 && (
                <span className="text-[10px] font-bold bg-ink text-white rounded-full px-1.5 py-0.5">{totalUnread}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowNewMsg(true)}
              title="Message a connection"
              className="w-7 h-7 rounded-lg bg-ink hover:bg-ink-800 flex items-center justify-center transition-colors flex-shrink-0">
              <UserPlus className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
          {/* Search bar */}
          <div className="px-3 py-2 border-b border-ink-50 flex-shrink-0">
            <div className="flex items-center gap-2 bg-ink-50 rounded-xl px-3 py-1.5">
              <Search className="w-3 h-3 text-ink-300 flex-shrink-0" />
              <input
                type="text"
                value={msgSearch}
                onChange={e => setMsgSearch(e.target.value)}
                placeholder="Search messages…"
                className="bg-transparent text-ink text-xs placeholder-ink-300 outline-none flex-1 min-w-0"
              />
              {msgSearch && (
                <button type="button" onClick={() => setMsgSearch('')} className="text-ink-300 hover:text-ink flex-shrink-0">
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-ink-50">
            {(() => {
              // Merge client DMs and groups into one list sorted by most recent activity
              type ListItem =
                | { kind: 'dm'; id: string; sortKey: string }
                | { kind: 'group'; id: string; sortKey: string }

              const q = msgSearch.toLowerCase().trim()

              // Section order: Clients (DMs) first, then Connections & Groups — each sorted by recency
              const clientItems: ListItem[] = messages
                .filter(m => !q || m.from.toLowerCase().includes(q))
                .map(m => ({ kind: 'dm' as const, id: m.id, sortKey: m.time || '0' }))
                .sort((a, b) => b.sortKey.localeCompare(a.sortKey))

              const groupItems: ListItem[] = groups
                .filter(g => {
                  if (!q) return true
                  const name = g.isDm ? (g.dmPeerName ?? g.name) : g.name
                  return name.toLowerCase().includes(q)
                })
                .map(g => ({ kind: 'group' as const, id: g.id, sortKey: g.lastActivityAt || '0' }))
                .sort((a, b) => b.sortKey.localeCompare(a.sortKey))

              const items: ListItem[] = [...clientItems, ...groupItems]

              if (items.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                    <MessageSquare className="w-8 h-8 text-ink-200 mb-2" />
                    <p className="text-sm text-ink-400 font-medium">{q ? 'No matches found' : 'No messages yet'}</p>
                    <p className="text-xs text-ink-300 mt-1">{q ? `No conversations matching "${msgSearch}"` : 'Client conversations and group chats will appear here'}</p>
                  </div>
                )
              }

              return items.map((item, idx) => {
                // Section label: "Clients" before first DM, "Connections & Groups" before first group
                const prevItem = items[idx - 1]
                const sectionLabel =
                  (idx === 0 && item.kind === 'dm') ? 'Clients' :
                  (item.kind === 'group' && (idx === 0 || prevItem?.kind === 'dm')) ? 'Connections & Groups' :
                  null

                if (item.kind === 'dm') {
                  const m = messages.find(x => x.id === item.id)!
                  return (
                    <div key={`dm-${m.id}`}>
                      {sectionLabel && (
                        <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider bg-white sticky top-0 z-10">
                          {sectionLabel}
                        </p>
                      )}
                    <button
                      key={`dm-${m.id}-btn`}
                      onClick={() => openThread(m.id)}
                      className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-ink-50 transition-colors text-left ${activeThread === m.id ? 'bg-ink-50' : ''}`}
                    >
                      <div className={`w-9 h-9 rounded-full ${m.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {m.initials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <p className={`text-sm ${m.unread ? 'font-semibold text-ink' : 'text-ink-500'}`}>{m.from}</p>
                          <span className="text-[10px] text-ink-300">{m.time}</span>
                        </div>
                        <p className="text-xs text-ink-400 truncate">{m.preview}</p>
                      </div>
                      {m.unread && <span className="w-2 h-2 rounded-full bg-ink flex-shrink-0 mt-1.5" />}
                    </button>
                    </div>
                  )
                }

                const g = groups.find(x => x.id === item.id)!
                const lastMsg = g.messages[g.messages.length - 1]
                const lastMsgPreview = lastMsg
                  ? lastMsg.attachmentUrl && !lastMsg.text
                    ? `${lastMsg.senderName}: 📎 Attachment`
                    : `${lastMsg.senderName}: ${lastMsg.text}`
                  : 'No messages yet'
                const timeStr = g.lastActivityAt ? fmtSubmitted(g.lastActivityAt) : ''
                const displayName = g.isDm ? (g.dmPeerName ?? g.name) : g.name
                return (
                  <div key={`group-${g.id}`}>
                    {sectionLabel && (
                      <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider bg-white sticky top-0 z-10">
                        {sectionLabel}
                      </p>
                    )}
                  <button
                    key={`group-${g.id}-btn`}
                    onClick={() => openGroup(g.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-ink-50 transition-colors text-left ${activeGroupId === g.id ? 'bg-ink-50' : ''}`}
                  >
                    {g.isDm ? (
                      <div className={`w-9 h-9 rounded-full ${g.dmPeerBg ?? 'bg-ink-300'} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                        {g.dmPeerInitials ?? '?'}
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center text-lg flex-shrink-0">
                        {g.emoji}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`text-sm truncate ${g.unread > 0 ? 'font-semibold text-ink' : 'text-ink-500'}`}>{displayName}</p>
                          {!g.isDm && (g.isCoverGroup
                            ? <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Cover</span>
                            : <span className="text-[9px] font-bold bg-ink-100 text-ink-400 border border-ink-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Group</span>
                          )}
                          {g.isDm && <span className="text-[9px] font-bold bg-sky-50 text-sky-600 border border-sky-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Photographer</span>}
                        </div>
                        <span className="text-[10px] text-ink-300 flex-shrink-0 ml-1">{timeStr}</span>
                      </div>
                      <p className="text-xs text-ink-400 truncate">{lastMsgPreview}</p>
                    </div>
                    {g.unread > 0 && <span className="w-2 h-2 rounded-full bg-ink flex-shrink-0 mt-1.5" />}
                  </button>
                  </div>
                )
              })
            })()}
          </div>
        </div>

        {/* Chat pane — active group */}
        {activeGroupId && activeGroup ? (
          <div className="flex-1 min-w-0 overflow-hidden">
            <GroupChat
              group={activeGroup}
              allPhotographers={connectedPhotographers as any}
              connected={connectedPhotographers as any}
              isOwner={activeGroup.ownerId === 'me'}
              onSend={sendGroupMessage}
              onClose={() => setActiveGroupId(null)}
              onLeave={leaveGroup}
              onRemoveMember={(groupId, memberId) => {
                setGroups(prev => prev.map(g => g.id !== groupId ? g : {
                  ...g, memberIds: g.memberIds.filter(id => id !== memberId)
                }))
                fetch('/api/photographer/groups', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ group_id: groupId, member_id: memberId }),
                }).catch(() => {})
              }}
              onInviteSent={(groupId, inviteeId) => {
                setGroups(prev => prev.map(g => g.id !== groupId ? g : {
                  ...g, pendingInviteIds: Array.from(new Set([...g.pendingInviteIds, inviteeId]))
                }))
              }}
              onBlock={async (groupId, peerId) => {
                // Block the peer: calls API which also deletes the DM group
                await fetch('/api/photographer/connections/block', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ blocked_photographer_id: peerId }),
                }).catch(() => {})
                // Remove group from local state and close pane
                setGroups(prev => prev.filter(g => g.id !== groupId))
                setActiveGroupId(null)
              }}
            />
          </div>
        ) : activeThread && thread ? (
          /* Chat pane — client thread */
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-ink-50 flex-shrink-0">
              <button
                onClick={() => setActiveThread(null)}
                className="sm:hidden p-1 rounded-lg hover:bg-ink-50 transition-colors text-ink-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className={`w-8 h-8 rounded-full ${thread.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {thread.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{thread.from}</p>
                <p className="text-[10px] text-ink-300">Client</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollPaneRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
              {thread.thread.length === 0 && (
                <div className="flex justify-center mt-8">
                  <span className="text-[11px] text-ink-300 bg-ink-50 px-3 py-1 rounded-full">Start the conversation</span>
                </div>
              )}
              {thread.thread.map((msg, i) => {
                const isMe = msg.from === 'me'
                const prevMsg = thread.thread[i - 1]
                const nextMsg = thread.thread[i + 1]
                const isLast = !nextMsg || nextMsg.from !== msg.from
                const hasAttach = !!msg.attachmentUrl && !!msg.attachmentType
                const timeStr = msg.time
                  ? (msg.time.includes('T') ? new Date(msg.time).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : msg.time)
                  : ''
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-1.5`}>
                    {!isMe && (
                      <div className={`w-7 h-7 rounded-full ${thread.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${!isLast ? 'opacity-0' : ''}`}>
                        {thread.initials}
                      </div>
                    )}
                    <div className={`max-w-[72%] rounded-2xl px-4 py-2.5 ${hasAttach && !msg.text ? 'p-1.5' : ''} ${
                      isMe ? 'bg-ink text-white rounded-br-sm' : 'bg-ink-50 text-ink rounded-bl-sm'
                    }`}>
                      {hasAttach && (
                        <MsgAttachmentPreview
                          url={msg.attachmentUrl!}
                          type={msg.attachmentType!}
                          name={msg.attachmentName}
                          size={msg.attachmentSize}
                          isMe={isMe}
                        />
                      )}
                      {msg.text && <p className="text-sm leading-relaxed">{msg.text}</p>}
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-white/50' : 'text-ink-300'}`}>{timeStr}</p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 border-t border-ink-50 flex-shrink-0">
              {uploadErr && <p className="text-[11px] text-red-500 mb-1.5 text-center">{uploadErr}</p>}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,application/pdf"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) sendFile(f); e.target.value = '' }}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || sending}
                  className="w-9 h-9 rounded-xl hover:bg-ink-50 text-ink-300 hover:text-ink flex items-center justify-center transition-colors disabled:opacity-40 flex-shrink-0"
                  title="Attach photo, video, or PDF"
                >
                  {uploading ? (
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    <Paperclip className="w-4 h-4" />
                  )}
                </button>
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                  placeholder="Type a message…"
                  rows={1}
                  className="flex-1 border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
                  style={{ maxHeight: 120 }}
                />
                <button
                  onClick={() => send()}
                  disabled={(!draft.trim()) || sending || uploading}
                  className="w-10 h-10 rounded-xl bg-ink text-white flex items-center justify-center hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden sm:flex flex-1 items-center justify-center">
            <div className="text-center px-6">
              <MessageSquare className="w-10 h-10 text-ink-200 mx-auto mb-3" />
              <p className="text-ink-400 text-sm font-medium">Select a conversation</p>
              <p className="text-ink-300 text-xs mt-1 mb-4">Choose a message from the left, or start a new conversation with a connection.</p>
              <button
                type="button"
                onClick={() => setShowNewMsg(true)}
                className="flex items-center gap-2 px-4 py-2 bg-ink hover:bg-ink-800 text-white text-xs font-semibold rounded-xl transition-colors mx-auto">
                <UserPlus className="w-3.5 h-3.5" />
                Message a connection
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New message modal */}
      {showNewMsg && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-0">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
            style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06),0 24px 48px rgba(0,0,0,0.18)' }}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-ink-100">
              <p className="font-semibold text-ink text-sm">New message</p>
              <button onClick={() => setShowNewMsg(false)}
                className="w-7 h-7 rounded-lg hover:bg-ink-50 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-ink-400" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-72">
              {connectedPhotographers.length === 0 ? (
                <div className="py-10 text-center">
                  <Users className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-xs text-ink-400">No connections yet</p>
                </div>
              ) : connectedPhotographers.map(c => (
                <button key={c.id} type="button" onClick={() => startDm(c.id)}
                  disabled={startingDm === c.id}
                  className="w-full flex items-center gap-3 px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors text-left disabled:opacity-60">
                  <div className={`w-9 h-9 rounded-xl ${c.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                    {c.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink truncate">{c.name}</p>
                    {c.area && <p className="text-[10px] text-ink-300 truncate">{c.area}</p>}
                  </div>
                  {startingDm === c.id
                    ? <span className="w-4 h-4 border-2 border-ink-300 border-t-ink rounded-full animate-spin flex-shrink-0" />
                    : <MessageSquare className="w-4 h-4 text-ink-300 flex-shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Support widget ───────────────────────────────────────────────────────────

// Topic → support_ticket category enum mapping
const PHOTOGRAPHER_SUPPORT_TOPICS: { label: string; category: string; subject: string }[] = [
  { label: 'Profile / visibility issue', category: 'account_issue',   subject: 'Profile or visibility issue' },
  { label: 'Trust score question',       category: 'account_issue',   subject: 'Trust score question' },
  { label: 'Client behaviour concern',   category: 'spam_report',     subject: 'Client behaviour concern' },
  { label: 'Inappropriate content',      category: 'inappropriate_content', subject: 'Inappropriate content report' },
  { label: 'Account / login issue',      category: 'account_issue',   subject: 'Account or login issue' },
  { label: 'Billing / payout question',  category: 'billing_dispute', subject: 'Billing or payout question' },
  { label: 'Something else',             category: 'other',           subject: 'General enquiry' },
]

function PhotographerSupportWidget() {
  const [topicIdx, setTopicIdx] = useState('')
  const [message, setMessage]   = useState('')
  const [sending, setSending]   = useState(false)
  const [sent, setSent]         = useState(false)
  const [error, setError]       = useState('')

  async function submit() {
    const topic = PHOTOGRAPHER_SUPPORT_TOPICS[Number(topicIdx)]
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
    <div className="bg-white rounded-2xl p-6 border border-ink-100" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-ink-400" />
        </div>
        <div>
          <h2 className="font-semibold text-ink">Contact support</h2>
          <p className="text-xs text-ink-300">We reply within 24 hours</p>
        </div>
      </div>

      {sent ? (
        <div className="flex flex-col items-center py-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2" />
          <p className="text-sm font-semibold text-ink">Message sent!</p>
          <p className="text-xs text-ink-300 mt-1">We'll get back to you at your account email within 24 hours.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Topic</label>
            <select value={topicIdx} onChange={e => setTopicIdx(e.target.value)}
              className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink bg-white outline-none focus:border-ink transition-all"
            >
              <option value="">Select a topic…</option>
              {PHOTOGRAPHER_SUPPORT_TOPICS.map((t, i) => (
                <option key={i} value={i}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Message</label>
            <textarea
              value={message} onChange={e => setMessage(e.target.value)}
              placeholder="Describe your issue or question in detail…"
              rows={4}
              className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button onClick={submit} disabled={sending || !topicIdx || !message.trim()}
            className="flex items-center gap-2 text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-40 transition-all"
          >
            {sending
              ? <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Sending…</>
              : <><Send className="w-3.5 h-3.5" /> Send to support</>
            }
          </button>
        </div>
      )}
    </div>
  )
}

// ─── FAQ Tab ──────────────────────────────────────────────────────────────────

function FaqTab({ faqs, setFaqs }: {
  faqs: FAQ[]
  setFaqs: React.Dispatch<React.SetStateAction<FAQ[]>>
}) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<{ question: string; answer: string }>({ question: '', answer: '' })
  const [adding, setAdding] = useState(false)
  const [newDraft, setNewDraft] = useState({ question: '', answer: '' })
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  function startEdit(faq: FAQ) {
    setEditingId(faq.id)
    setDraft({ question: faq.question, answer: faq.answer })
    setExpandedId(faq.id)
  }

  async function saveEdit(id: string) {
    if (!draft.question.trim() || !draft.answer.trim()) return
    setSaving(id)
    await fetch('/api/photographer/faqs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, question: draft.question.trim(), answer: draft.answer.trim() }),
    })
    setFaqs(prev => prev.map(f => f.id === id ? { ...f, question: draft.question.trim(), answer: draft.answer.trim() } : f))
    setEditingId(null)
    setSaving(null)
    setSaved(id)
    setTimeout(() => setSaved(v => v === id ? null : v), 2000)
  }

  async function saveNew() {
    if (!newDraft.question.trim() || !newDraft.answer.trim()) return
    setSaving('new')
    const res = await fetch('/api/photographer/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: newDraft.question.trim(), answer: newDraft.answer.trim() }),
    })
    const created = res.ok ? await res.json() : null
    const id = created?.id ?? `f-${Date.now()}`
    setFaqs(prev => [...prev, { id, question: newDraft.question.trim(), answer: newDraft.answer.trim(), sort_order: prev.length }])
    setNewDraft({ question: '', answer: '' })
    setAdding(false)
    setSaving(null)
    setSaved(id)
    setTimeout(() => setSaved(v => v === id ? null : v), 2000)
  }

  function deleteFaq(id: string) {
    setFaqs(prev => prev.filter(f => f.id !== id).map((f, i) => ({ ...f, sort_order: i })))
    if (editingId === id) setEditingId(null)
    fetch(`/api/photographer/faqs?id=${id}`, { method: 'DELETE' }).catch(() => {})
  }

  function persistReorder(reordered: FAQ[]) {
    fetch('/api/photographer/faqs', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reordered.map((f, i) => ({ id: f.id, sort_order: i }))),
    }).catch(() => {})
  }

  function moveUp(index: number) {
    if (index === 0) return
    setFaqs(prev => {
      const next = [...prev]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      const updated = next.map((f, i) => ({ ...f, sort_order: i }))
      persistReorder(updated)
      return updated
    })
  }

  function moveDown(index: number) {
    setFaqs(prev => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      const updated = next.map((f, i) => ({ ...f, sort_order: i }))
      persistReorder(updated)
      return updated
    })
  }

  function moveToTop(index: number) {
    if (index === 0) return
    setFaqs(prev => {
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.unshift(item)
      const updated = next.map((f, i) => ({ ...f, sort_order: i }))
      persistReorder(updated)
      return updated
    })
  }

  function moveToBottom(index: number) {
    setFaqs(prev => {
      if (index === prev.length - 1) return prev
      const next = [...prev]
      const [item] = next.splice(index, 1)
      next.push(item)
      const updated = next.map((f, i) => ({ ...f, sort_order: i }))
      persistReorder(updated)
      return updated
    })
  }

  return (
    <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
          <HelpCircle className="w-4 h-4 text-ink-400" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold text-ink">FAQ</h2>
          <p className="text-xs text-ink-300">Up to {MAX_FAQS} questions shown on your public profile</p>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${faqs.length >= MAX_FAQS ? 'bg-ink-50 text-ink-400' : 'bg-emerald-50 text-emerald-600'}`}>
          {faqs.length} / {MAX_FAQS}
        </span>
      </div>

      {/* FAQ list */}
      <div className="space-y-3 mb-5">
        {faqs.length === 0 && !adding && (
          <div className="py-10 text-center">
            <HelpCircle className="w-8 h-8 text-ink-200 mx-auto mb-3" />
            <p className="text-ink-400 text-sm font-medium mb-1">No FAQs yet</p>
            <p className="text-ink-300 text-xs">Add common questions clients ask — pricing, turnaround, location, etc.</p>
          </div>
        )}

        {faqs.map((faq, index) => (
          <div
            key={faq.id}
            className={`rounded-xl border transition-all ${editingId === faq.id ? 'border-ink bg-white' : 'border-ink-100 bg-ink-50/40'}`}
          >
            {editingId === faq.id ? (
              /* ── Edit mode ── */
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Question</label>
                  <input
                    type="text"
                    value={draft.question}
                    onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_faq_question_length) setDraft(d => ({ ...d, question: e.target.value })) }}
                    maxLength={PLATFORM_CONFIG.max_faq_question_length}
                    placeholder="e.g. How far in advance should I book?"
                    autoFocus
                    className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all"
                  />
                  <p className={`text-right text-[10px] mt-1 ${draft.question.length >= PLATFORM_CONFIG.max_faq_question_length ? 'text-red-500' : draft.question.length > PLATFORM_CONFIG.max_faq_question_length - 20 ? 'text-amber-500' : 'text-ink-200'}`}>{draft.question.length}/{PLATFORM_CONFIG.max_faq_question_length}</p>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Answer</label>
                  <textarea
                    value={draft.answer}
                    onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_faq_answer_length) setDraft(d => ({ ...d, answer: e.target.value })) }}
                    maxLength={PLATFORM_CONFIG.max_faq_answer_length}
                    rows={4}
                    placeholder="Write a clear, helpful answer…"
                    className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all resize-none"
                  />
                  <p className={`text-right text-[10px] mt-1 ${draft.answer.length >= PLATFORM_CONFIG.max_faq_answer_length ? 'text-red-500' : draft.answer.length > PLATFORM_CONFIG.max_faq_answer_length - 60 ? 'text-amber-500' : 'text-ink-200'}`}>{draft.answer.length}/{PLATFORM_CONFIG.max_faq_answer_length}</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => saveEdit(faq.id)}
                    disabled={!draft.question.trim() || !draft.answer.trim() || saving === faq.id}
                    className="flex items-center gap-1.5 bg-ink text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-40"
                  >
                    {saving === faq.id ? 'Saving…' : (
                      <><Save className="w-3 h-3" /> Save</>
                    )}
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-xs font-medium text-ink-400 border border-ink-100 px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* ── Display mode ── */
              <div>
                {/* Question row */}
                <button
                  onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <GripVertical className="w-3.5 h-3.5 text-ink-200 flex-shrink-0" />
                  <span className="flex-1 text-sm font-medium text-ink">{faq.question}</span>
                  {saved === faq.id && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                  {expandedId === faq.id ? (
                    <ChevronUp className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                  )}
                </button>

                {/* Answer + actions */}
                {expandedId === faq.id && (
                  <div className="px-4 pb-4 border-t border-ink-100">
                    <p className="text-sm text-ink-500 leading-relaxed pt-3 mb-3">{faq.answer}</p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(faq)}
                        className="flex items-center gap-1.5 text-xs font-medium text-ink-500 border border-ink-100 px-3 py-1.5 rounded-lg hover:bg-ink-50 hover:text-ink transition-colors"
                      >
                        <Pencil className="w-3 h-3" /> Edit
                      </button>
                      <button
                        onClick={() => moveToTop(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-400 disabled:opacity-30 transition-colors"
                        title="Move to top"
                      >
                        <ChevronsUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-400 disabled:opacity-30 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === faqs.length - 1}
                        className="p-1.5 rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-400 disabled:opacity-30 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveToBottom(index)}
                        disabled={index === faqs.length - 1}
                        className="p-1.5 rounded-lg border border-ink-100 hover:bg-ink-50 text-ink-400 disabled:opacity-30 transition-colors"
                        title="Move to bottom"
                      >
                        <ChevronsDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteFaq(faq.id)}
                        className="ml-auto flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* ── Add new FAQ form ── */}
        {adding && (
          <div className="rounded-xl border border-ink bg-white p-4 space-y-3">
            <p className="text-xs font-semibold text-ink">New FAQ</p>
            <div>
              <label className="block text-[11px] font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Question</label>
              <input
                type="text"
                value={newDraft.question}
                onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_faq_question_length) setNewDraft(d => ({ ...d, question: e.target.value })) }}
                maxLength={PLATFORM_CONFIG.max_faq_question_length}
                placeholder="e.g. Do you travel outside Edmonton?"
                autoFocus
                className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all"
              />
              <p className={`text-right text-[10px] mt-1 ${newDraft.question.length >= PLATFORM_CONFIG.max_faq_question_length ? 'text-red-500' : newDraft.question.length > PLATFORM_CONFIG.max_faq_question_length - 20 ? 'text-amber-500' : 'text-ink-200'}`}>{newDraft.question.length}/{PLATFORM_CONFIG.max_faq_question_length}</p>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Answer</label>
              <textarea
                value={newDraft.answer}
                onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_faq_answer_length) setNewDraft(d => ({ ...d, answer: e.target.value })) }}
                maxLength={PLATFORM_CONFIG.max_faq_answer_length}
                rows={4}
                placeholder="Write a clear, helpful answer…"
                className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all resize-none"
              />
              <p className={`text-right text-[10px] mt-1 ${newDraft.answer.length >= PLATFORM_CONFIG.max_faq_answer_length ? 'text-red-500' : newDraft.answer.length > PLATFORM_CONFIG.max_faq_answer_length - 60 ? 'text-amber-500' : 'text-ink-200'}`}>{newDraft.answer.length}/{PLATFORM_CONFIG.max_faq_answer_length}</p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                onClick={saveNew}
                disabled={!newDraft.question.trim() || !newDraft.answer.trim() || saving === 'new'}
                className="flex items-center gap-1.5 bg-ink text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-40"
              >
                {saving === 'new' ? 'Adding…' : <><Plus className="w-3 h-3" /> Add FAQ</>}
              </button>
              <button
                onClick={() => { setAdding(false); setNewDraft({ question: '', answer: '' }) }}
                className="text-xs font-medium text-ink-400 border border-ink-100 px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add button */}
      {!adding && faqs.length < MAX_FAQS && (
        <button
          onClick={() => setAdding(true)}
          className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-ink-200 text-ink-400 text-sm font-medium py-3 rounded-xl hover:border-ink-400 hover:text-ink hover:bg-ink-50 transition-all"
        >
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      )}

      {faqs.length >= MAX_FAQS && (
        <p className="text-center text-xs text-ink-300 py-2">Maximum {MAX_FAQS} FAQs reached. Delete one to add another.</p>
      )}

      {/* Tip */}
      {faqs.length > 0 && (
        <div className="mt-5 bg-ink-50 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <HelpCircle className="w-3.5 h-3.5 text-ink-300 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-ink-400 leading-relaxed">
            FAQs appear as an accordion on your public profile. Use them to answer pricing, turnaround time, travel range, and process questions upfront — it reduces back-and-forth before a booking.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Profile Settings Tab ─────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

function ProfileSettingsTab({ profile, setProfile }: {
  profile: ProfileData
  setProfile: React.Dispatch<React.SetStateAction<ProfileData>>
}) {
  const [local, setLocal] = useState({ ...profile })
  const [saveStates, setSaveStates] = useState<Record<string, SaveState>>({
    basics: 'idle', specialties: 'idle', contacts: 'idle', account: 'idle',
  })
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [coverUploading, setCoverUploading] = useState(false)
  const [coverError, setCoverError] = useState('')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Keep local in sync when parent profile loads from DB
  useEffect(() => {
    setLocal(prev => ({ ...prev, ...profile }))
  }, [profile.displayName, profile.email])

  // Load current email from account API (source of truth)
  useEffect(() => {
    fetch('/api/photographer/account')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.email) setLocal(l => ({ ...l, email: data.email })) })
      .catch(() => {})
  }, [])

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate client-side before upload
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarError('Only JPEG, PNG, or WebP images are allowed')
      return
    }
    if (file.size > PLATFORM_CONFIG.max_avatar_bytes) {
      setAvatarError(`File must be under ${PLATFORM_CONFIG.max_avatar_bytes / 1024 / 1024} MB`)
      return
    }

    // Show local preview immediately
    const previewUrl = URL.createObjectURL(file)
    setLocal(l => ({ ...l, avatarUrl: previewUrl }))
    setAvatarError('')
    setAvatarUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/photographer/profile/avatar', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setAvatarError(err?.error ?? 'Upload failed — please try again')
        setLocal(l => ({ ...l, avatarUrl: profile.avatarUrl }))
        return
      }
      const { avatar_url } = await res.json()
      setLocal(l => ({ ...l, avatarUrl: avatar_url }))
      setProfile(prev => ({ ...prev, avatarUrl: avatar_url }))
    } catch {
      setAvatarError('Network error — please try again')
      setLocal(l => ({ ...l, avatarUrl: profile.avatarUrl }))
    } finally {
      setAvatarUploading(false)
    }
  }

  async function removeAvatar() {
    setAvatarUploading(true)
    setAvatarError('')
    try {
      await fetch('/api/photographer/profile/avatar', { method: 'DELETE' })
      setLocal(l => ({ ...l, avatarUrl: '' }))
      setProfile(prev => ({ ...prev, avatarUrl: '' }))
    } catch {
      setAvatarError('Failed to remove photo')
    } finally {
      setAvatarUploading(false)
    }
  }

  async function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setCoverError('Only JPEG, PNG, or WebP images are allowed')
      return
    }
    if (file.size > 8 * 1024 * 1024) {
      setCoverError('File must be under 8 MB')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setLocal(l => ({ ...l, coverImageUrl: previewUrl }))
    setCoverError('')
    setCoverUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/photographer/profile/cover', { method: 'POST', body: formData })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setCoverError(err?.error ?? 'Upload failed — please try again')
        setLocal(l => ({ ...l, coverImageUrl: profile.coverImageUrl }))
        return
      }
      const { cover_image_url } = await res.json()
      setLocal(l => ({ ...l, coverImageUrl: cover_image_url }))
      setProfile(prev => ({ ...prev, coverImageUrl: cover_image_url }))
    } catch {
      setCoverError('Network error — please try again')
      setLocal(l => ({ ...l, coverImageUrl: profile.coverImageUrl }))
    } finally {
      setCoverUploading(false)
    }
  }

  async function removeCover() {
    setCoverUploading(true)
    setCoverError('')
    try {
      await fetch('/api/photographer/profile/cover', { method: 'DELETE' })
      setLocal(l => ({ ...l, coverImageUrl: '' }))
      setProfile(prev => ({ ...prev, coverImageUrl: '' }))
    } catch {
      setCoverError('Failed to remove cover photo')
    } finally {
      setCoverUploading(false)
    }
  }

  function touch(f: string) { setTouched(t => ({ ...t, [f]: true })) }

  function setSaving(key: string) {
    clearTimeout(timers.current[key])
    setSaveStates(s => ({ ...s, [key]: 'saving' }))
    setSaveErrors(e => ({ ...e, [key]: '' }))
  }

  function setSaved(key: string) {
    setSaveStates(s => ({ ...s, [key]: 'saved' }))
    timers.current[key] = setTimeout(() => setSaveStates(s => ({ ...s, [key]: 'idle' })), 2500)
  }

  function setError(key: string, msg: string) {
    setSaveStates(s => ({ ...s, [key]: 'error' }))
    setSaveErrors(e => ({ ...e, [key]: msg }))
    timers.current[key] = setTimeout(() => setSaveStates(s => ({ ...s, [key]: 'idle' })), 4000)
  }

  async function saveSection(key: string) {
    setSaving(key)

    let body: Record<string, unknown> = { section: key }

    if (key === 'basics') {
      if (!local.displayName.trim()) { setError(key, 'Display name is required'); return }
      body = {
        section: 'basics',
        display_name: local.displayName.trim(),
        bio: local.bio.trim(),
        location: local.area,
        rate_amount: local.rate || null,
        rate_unit: local.rateUnit,
        website_url: local.websiteUrl.trim(),
        years_experience: local.yearsExperience,
      }
    } else if (key === 'specialties') {
      body = { section: 'specialties', specialties: local.specialties }
    } else if (key === 'contacts') {
      body = {
        section: 'contacts',
        website_url: local.websiteUrl,
        contact_instagram_url: local.contactInstagram,
        contact_facebook_url: local.contactFacebook,
      }
    } else if (key === 'account') {
      // Account uses a different endpoint
      try {
        const res = await fetch('/api/photographer/account', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: local.email }),
        })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) {
          setError(key, data?.error ?? 'Save failed — please try again')
          return
        }
        setProfile(prev => ({ ...prev, email: data.email ?? local.email }))
        setSaved(key)
      } catch {
        setError(key, 'Network error — please try again')
      }
      return
    }

    try {
      const res = await fetch('/api/photographer/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setError(key, err?.error ?? 'Save failed — please try again')
        return
      }
      setProfile(prev => ({ ...prev, ...local }))
      setSaved(key)
    } catch {
      setError(key, 'Network error — please try again')
    }
  }

  function toggleSpecialty(s: string) {
    setLocal(l => ({
      ...l,
      specialties: l.specialties.includes(s)
        ? l.specialties.filter(x => x !== s)
        : l.specialties.length < 5 ? [...l.specialties, s] : l.specialties,
    }))
  }

  const bioLen = local.bio.length
  const bioMax = PLATFORM_CONFIG.max_photographer_bio_length

  function SaveBtn({ section }: { section: string }) {
    const state = saveStates[section]
    return (
      <div className="flex flex-col items-end gap-1.5">
        {saveErrors[section] && state === 'error' && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{saveErrors[section]}
          </p>
        )}
        <button
          onClick={() => saveSection(section)}
          disabled={state === 'saving'}
          className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl transition-all ${
            state === 'saved'  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            : state === 'error'  ? 'bg-red-50 text-red-700 border border-red-200'
            : state === 'saving' ? 'bg-ink-50 text-ink-400 cursor-not-allowed border border-ink-100'
            : 'bg-ink text-white hover:bg-ink-800'
          }`}
        >
          {state === 'saved'   ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
           : state === 'error'   ? <><AlertCircle className="w-4 h-4" /> Failed — retry</>
           : state === 'saving'  ? <><Spinner /> Saving…</>
           : <><Save className="w-4 h-4" /> Save</>}
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Basics */}
      <div id="settings" className="bg-white rounded-2xl p-6 scroll-mt-24" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
            <User className="w-4 h-4 text-ink-400" />
          </div>
          <h2 className="font-semibold text-ink">Basic details</h2>
        </div>

        <div className="space-y-4">
          {/* Profile photo */}
          <div className="flex items-center gap-4 pb-4 border-b border-ink-50">
            <div className="relative flex-shrink-0">
              {local.avatarUrl ? (
                <img src={local.avatarUrl} alt="Profile" className="w-20 h-20 rounded-2xl object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-ink flex items-center justify-center text-white text-2xl font-bold select-none">
                  {local.displayName ? local.displayName[0].toUpperCase() : 'Y'}
                </div>
              )}
              {avatarUploading && (
                <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center">
                  <Spinner />
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-white border border-ink-100 shadow-sm flex items-center justify-center text-ink-400 hover:text-ink hover:border-ink-300 transition-all disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>
            <div>
              <p className="text-sm font-semibold text-ink mb-1">Profile photo</p>
              <p className="text-xs text-ink-300 mb-2">JPEG, PNG or WebP · max {PLATFORM_CONFIG.max_avatar_bytes / 1024 / 1024} MB · square crops best</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={avatarUploading}
                className="text-xs font-medium border border-ink-100 text-ink-500 px-3 py-1.5 rounded-lg hover:bg-ink-50 hover:text-ink transition-all disabled:opacity-50"
              >
                {avatarUploading ? 'Uploading…' : local.avatarUrl ? 'Change photo' : 'Upload photo'}
              </button>
              {local.avatarUrl && !avatarUploading && (
                <button
                  onClick={removeAvatar}
                  className="ml-2 text-xs font-medium text-red-400 hover:text-red-600 transition-colors"
                >
                  Remove
                </button>
              )}
              {avatarError && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />{avatarError}
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handlePhotoSelect}
            />
          </div>

          {/* Cover photo */}
          <div className="pb-4 border-b border-ink-50">
            <p className="text-sm font-semibold text-ink mb-1">Cover photo</p>
            <p className="text-xs text-ink-300 mb-3">JPEG, PNG or WebP · max 8 MB · 3:1 wide banner crops best</p>
            <div
              className="relative w-full h-28 rounded-xl overflow-hidden bg-ink-50 border border-ink-100 cursor-pointer group"
              onClick={() => coverInputRef.current?.click()}
            >
              {local.coverImageUrl ? (
                <img src={local.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1.5 text-ink-300 select-none">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-xs">Click to upload cover</span>
                </div>
              )}
              {coverUploading && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <Spinner />
                </div>
              )}
              {!coverUploading && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg px-3 py-1.5 text-xs font-medium text-ink flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5" />
                    {local.coverImageUrl ? 'Change cover' : 'Upload cover'}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={() => coverInputRef.current?.click()}
                disabled={coverUploading}
                className="text-xs font-medium border border-ink-100 text-ink-500 px-3 py-1.5 rounded-lg hover:bg-ink-50 hover:text-ink transition-all disabled:opacity-50"
              >
                {coverUploading ? 'Uploading…' : local.coverImageUrl ? 'Change cover' : 'Upload cover'}
              </button>
              {local.coverImageUrl && !coverUploading && (
                <button onClick={removeCover} className="text-xs font-medium text-red-400 hover:text-red-600 transition-colors">
                  Remove
                </button>
              )}
            </div>
            {coverError && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />{coverError}
              </p>
            )}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverSelect}
            />
          </div>

          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Display name</label>
            <input
              type="text"
              value={local.displayName}
              onChange={e => setLocal(l => ({ ...l, displayName: e.target.value }))}
              onBlur={() => touch('displayName')}
              placeholder="e.g. Sarah Johnson Photography"
              className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                touched.displayName && !local.displayName.trim()
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-ink-100 focus:border-ink focus:ring-ink/10'
              }`}
            />
          </div>

          {/* Bio */}
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="block text-sm font-medium text-ink">Bio</label>
              <span className={`text-xs ${bioLen >= bioMax ? 'text-red-500' : bioLen > bioMax - 100 ? 'text-amber-500' : 'text-ink-300'}`}>{bioLen}/{bioMax}</span>
            </div>
            <textarea
              rows={4}
              value={local.bio}
              onChange={e => { if (e.target.value.length <= bioMax) setLocal(l => ({ ...l, bio: e.target.value })) }}
              maxLength={bioMax}
              placeholder="Tell clients who you are and what makes your photography unique…"
              className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all resize-none"
            />
          </div>

          {/* Area */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-ink-300" />Your area</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {EDMONTON_AREAS.map(a => (
                <button key={a} type="button"
                  onClick={() => setLocal(l => ({ ...l, area: a === 'Other' ? 'other' : a }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    local.area === a || (local.area === 'other' && a === 'Other')
                      ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                  }`}
                >{a}</button>
              ))}
            </div>
          </div>

          {/* Rate */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              <span className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-ink-300" />Starting rate</span>
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300 text-sm font-medium pointer-events-none">$</span>
                <input
                  type="number" min={0} placeholder="150"
                  value={local.rate}
                  onChange={e => setLocal(l => ({ ...l, rate: e.target.value }))}
                  className="w-full border border-ink-100 rounded-xl pl-8 pr-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
                />
              </div>
              <select
                value={local.rateUnit}
                onChange={e => setLocal(l => ({ ...l, rateUnit: e.target.value }))}
                className="border border-ink-100 rounded-xl px-3 py-3 text-sm text-ink outline-none focus:border-ink bg-white"
              >
                <option value="hr">/ hr</option>
                <option value="half">/ half day</option>
                <option value="full">/ full day</option>
              </select>
            </div>
          </div>

          {/* Years of experience */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">Years of photography experience</label>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Just starting out', value: 0 },
                { label: '1–3 years',          value: 2 },
                { label: '3–5 years',          value: 4 },
                { label: '5–10 years',         value: 7 },
                { label: '10+ years',          value: 10 },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setLocal(l => ({ ...l, yearsExperience: opt.value }))}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                    local.yearsExperience === opt.value
                      ? 'bg-ink text-white border-ink'
                      : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink-300">Used for badge eligibility — select the range that best describes your experience.</p>
          </div>

        </div>

        <div className="flex justify-end mt-5"><SaveBtn section="basics" /></div>
      </div>

      {/* Specialties */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
            <Camera className="w-4 h-4 text-ink-400" />
          </div>
          <h2 className="font-semibold text-ink">Specialties</h2>
        </div>

        <p className="text-xs text-ink-300 mb-4">Pick up to 5. These appear as tags on your public profile.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {SPECIALTIES_ALL.map(s => {
            const sel = local.specialties.includes(s)
            const maxed = !sel && local.specialties.length >= 5
            return (
              <button key={s} type="button" onClick={() => toggleSpecialty(s)} disabled={maxed}
                className={`text-sm px-4 py-2 rounded-xl border transition-all ${
                  sel ? 'bg-ink text-white border-ink'
                  : maxed ? 'bg-white text-ink-200 border-ink-100 cursor-not-allowed'
                  : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300 hover:text-ink'
                }`}
              >{s}</button>
            )
          })}
        </div>

        {local.specialties.length > 0 && (
          <div className="bg-ink-50 rounded-xl px-4 py-3 mb-4">
            <p className="text-xs text-ink-400">Selected: <span className="font-medium text-ink">{local.specialties.join(', ')}</span></p>
          </div>
        )}
        <div className="flex justify-end"><SaveBtn section="specialties" /></div>
      </div>

      {/* Contacts */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
            <Link2 className="w-4 h-4 text-ink-400" />
          </div>
          <h2 className="font-semibold text-ink">Links</h2>
        </div>
        <p className="text-xs text-ink-300 mb-5 ml-12">Shown as clickable icons on your public profile. Leave blank to hide.</p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-ink-300" />Website URL
            </label>
            <input
              type="url"
              value={local.websiteUrl}
              onChange={e => setLocal(l => ({ ...l, websiteUrl: e.target.value }))}
              placeholder="https://yourwebsite.com"
              className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
              <Instagram className="w-3.5 h-3.5 text-ink-300" />Instagram username
            </label>
            <div className="flex items-center border border-ink-100 rounded-xl overflow-hidden focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10 transition-all">
              <span className="pl-4 pr-1 text-sm text-ink-300 select-none">@</span>
              <input
                type="text"
                value={local.contactInstagram}
                onChange={e => setLocal(l => ({ ...l, contactInstagram: e.target.value.replace(/^@/, '').replace(/\s/g, '') }))}
                placeholder="yourhandle"
                className="flex-1 px-2 py-3 text-sm text-ink placeholder-ink-200 outline-none bg-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-ink-300">Requires a Business or Creator account. Clients will be linked to instagram.com/yourhandle.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5 flex items-center gap-1.5">
              <Facebook className="w-3.5 h-3.5 text-ink-300" />Facebook Page username
            </label>
            <div className="flex items-center border border-ink-100 rounded-xl overflow-hidden focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/10 transition-all">
              <span className="pl-4 pr-1 text-sm text-ink-300 select-none">@</span>
              <input
                type="text"
                value={local.contactFacebook}
                onChange={e => setLocal(l => ({ ...l, contactFacebook: e.target.value.replace(/^@/, '').replace(/\s/g, '') }))}
                placeholder="yourpagename"
                className="flex-1 px-2 py-3 text-sm text-ink placeholder-ink-200 outline-none bg-transparent"
              />
            </div>
            <p className="mt-1 text-xs text-ink-300">Must be a Facebook Page (not a personal profile). Clients will be linked to facebook.com/yourpagename.</p>
          </div>
        </div>
        <div className="flex justify-end mt-5"><SaveBtn section="contacts" /></div>
      </div>

      {/* Account settings */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
            <Settings className="w-4 h-4 text-ink-400" />
          </div>
          <h2 className="font-semibold text-ink">Account</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Email address</label>
            <input
              type="email"
              value={local.email}
              onChange={e => setLocal(l => ({ ...l, email: e.target.value }))}
              placeholder="you@example.com"
              className={`w-full border rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:ring-2 transition-all ${
                saveStates.account === 'error'
                  ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                  : 'border-ink-100 focus:border-ink focus:ring-ink/10'
              }`}
            />
            <p className="mt-1.5 text-xs text-ink-300">
              This is the email you use to sign in. Changing it will update your login credentials.
            </p>
          </div>
        </div>
        <div className="flex justify-end mt-5"><SaveBtn section="account" /></div>
      </div>

      {/* Support */}
      <PhotographerSupportWidget />

      {/* Danger zone */}
      <DangerZone />
    </div>
  )
}

function DangerZone() {
  const router = useRouter()
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)

  async function handleDelete() {
    if (confirmText !== 'DELETE') return
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
    <>
      <div className="bg-white rounded-2xl p-6 border border-red-100" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <h2 className="font-semibold text-ink mb-1">Danger zone</h2>
        <p className="text-xs text-ink-300 mb-4">This action is permanent and cannot be undone.</p>
        <button onClick={() => setShowDelete(true)} className="text-sm font-medium text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
          Delete account
        </button>
      </div>

      {/* Removed sign-out modal — sign out is now in the avatar dropdown in the nav */}
      {false && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-float-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
              <p className="font-semibold text-ink">Sign out</p>
              <button className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-ink-500 leading-relaxed">Are you sure you want to sign out of your TrueNorth Frames account?</p>
            </div>
            <div className="px-5 py-4 border-t border-ink-50 flex gap-3">
              <button className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 text-ink-400 transition-colors">Cancel</button>
              <button onClick={async () => { await supabase.auth.signOut(); router.push('/login') }} className="flex-1 text-sm font-semibold bg-ink text-white rounded-xl py-2.5 hover:bg-ink-800 transition-colors">Sign out</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete account modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-float-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-red-100">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <p className="font-semibold text-red-700">Delete account</p>
              </div>
              <button onClick={() => setShowDelete(false)} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-ink-600 leading-relaxed">This will permanently delete your photographer profile, portfolio, all reviews, and booking history. <strong>This cannot be undone.</strong></p>
              {deleteError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-700">Something went wrong. Please try again or contact support.</p>
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Type <span className="font-bold text-red-600">DELETE</span> to confirm</label>
                <input
                  type="text" value={confirmText} onChange={e => { setConfirmText(e.target.value); setDeleteError(false) }}
                  placeholder="DELETE"
                  className="w-full border border-red-200 rounded-xl px-4 py-2.5 text-sm text-ink outline-none focus:border-red-400 transition-all"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-ink-50 flex gap-3">
              <button onClick={() => { setShowDelete(false); setConfirmText('') }} className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 text-ink-400 transition-colors">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="flex-1 text-sm font-semibold bg-red-500 text-white rounded-xl py-2.5 hover:bg-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >{deleting ? 'Deleting…' : 'Delete my account'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Bio setter helper (for use inside ProfileSettingsTab) ────────────────────
// We need a stable ref for the textarea onChange — define it inside the component
// so it can close over setLocal. Actually handled inline above.

// ─── Dashboard lightbox (photo preview) ──────────────────────────────────────

function DashboardLightbox({ photos, startIdx, onClose }: {
  photos: { id: string; src: string; caption: string }[]
  startIdx: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(startIdx)
  const ph = photos[idx]
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, photos.length - 1))
      if (e.key === 'ArrowLeft') setIdx(i => Math.max(i - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length, onClose])
  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0" onClick={e => e.stopPropagation()}>
        <span className="text-white/50 text-xs tabular-nums">{idx + 1} / {photos.length}</span>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <X className="w-4 h-4 text-white" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center relative min-h-0 px-12" onClick={e => e.stopPropagation()}>
        <img src={ph.src} alt={ph.caption || ''} className="max-w-full max-h-full object-contain rounded-lg" style={{ maxHeight: 'calc(100vh - 140px)' }} />
        {idx > 0 && (
          <button onClick={() => setIdx(i => i - 1)} className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center ml-1">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        {idx < photos.length - 1 && (
          <button onClick={() => setIdx(i => i + 1)} className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center mr-1">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
      <div className="flex-shrink-0 pb-4" onClick={e => e.stopPropagation()}>
        {ph.caption && <p className="text-white/70 text-sm text-center px-6 py-2">{ph.caption}</p>}
        {photos.length > 1 && (
          <div className="flex items-center justify-center gap-1.5 px-4 mt-1 overflow-x-auto">
            {photos.map((t, i) => (
              <button key={t.id} onClick={() => setIdx(i)}
                className={`flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden transition-all ${i === idx ? 'ring-2 ring-white scale-110' : 'opacity-40 hover:opacity-70'}`}>
                <img src={t.src} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── TrustScoreTab ────────────────────────────────────────────────────────────

// Score arc scaled for 75–100 range (0 = not connected, shown separately)
function ScoreArc({ score }: { score: number }) {
  const size  = 140
  const r     = 56
  const circ  = Math.PI * r
  // Map 75–100 → 0–1 fill fraction; 0 = no GBP
  const frac  = score > 0 ? Math.max(0, Math.min((score - 75) / 25, 1)) : 0
  const dash  = frac * circ
  const color = score >= 90 ? '#10b981' : score >= 80 ? '#3b82f6' : score > 0 ? '#f59e0b' : '#d1d5db'
  const label = score >= 90 ? 'Excellent' : score >= 80 ? 'Strong' : score > 0 ? 'Good' : 'Not set up'
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size / 2 + 16} viewBox={`0 0 ${size} ${size / 2 + 16}`}>
        <path d={`M ${size * 0.07} ${size / 2} A ${r} ${r} 0 0 1 ${size * 0.93} ${size / 2}`}
          fill="none" stroke="#f3f4f6" strokeWidth="12" strokeLinecap="round" />
        <path d={`M ${size * 0.07} ${size / 2} A ${r} ${r} 0 0 1 ${size * 0.93} ${size / 2}`}
          fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 26, fill: color, fontWeight: 700 }}>
          {score > 0 ? score.toFixed(1) : '—'}
        </text>
        <text x={size / 2} y={size / 2 + 16} textAnchor="middle"
          style={{ fontSize: 11, fill: '#9ca3af' }}>
          {score > 0 ? '/ 100' : 'connect GBP'}
        </text>
      </svg>
      <span className="text-xs font-semibold px-3 py-1 rounded-full border"
        style={{ color, borderColor: color, backgroundColor: `${color}15` }}>
        {label}
      </span>
    </div>
  )
}

function PillarBar({ label, score, color, note }: { label: string; score: number; color: string; note?: string }) {
  const pct = Math.round(score)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-xs text-ink-500">{label}</span>
        <span className="text-xs font-semibold text-ink">{score.toFixed(0)}<span className="text-ink-300 font-normal">/100</span></span>
      </div>
      <div className="h-1.5 bg-ink-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      {note && <p className="text-[10px] text-ink-300">{note}</p>}
    </div>
  )
}

function TrustScoreTab({
  trustData,
  loading,
  syncing,
  notification,
  onDismissNotification,
  onSync,
  onDisconnect,
}: {
  trustData: any
  loading: boolean
  syncing: boolean
  notification: { type: 'success' | 'error'; msg: string } | null
  onDismissNotification: () => void
  onSync: () => void
  onDisconnect: (platform: string) => Promise<void>
}) {
  const score: number    = trustData?.trust_score ?? 0
  const breakdown        = trustData?.breakdown
  const connected: Record<string, { username: string; connectedAt: string; isActive: boolean }> = trustData?.connected_platforms ?? {}
  const signals: Record<string, any> = trustData?.latest_signals ?? {}
  const syncLog: any[]   = trustData?.sync_log ?? []
  const gbpConnected     = !!connected.google?.isActive
  const gbpSig           = signals.google

  return (
    <div className="space-y-5">
      {/* Notification */}
      {notification && (
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-sm ${
          notification.type === 'success'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-600'
        }`}>
          {notification.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
            : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
          <span className="flex-1">{notification.msg}</span>
          <button onClick={onDismissNotification} className="text-current opacity-60 hover:opacity-100 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Score card */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
              <Shield className="w-4 h-4 text-ink-400" />
            </div>
            <div>
              <h2 className="font-semibold text-ink">Trust Score</h2>
              <p className="text-xs text-ink-300">
                {trustData?.last_sync_at
                  ? `Last synced ${new Date(trustData.last_sync_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`
                  : 'Not yet synced'}
              </p>
            </div>
          </div>
          <button onClick={onSync} disabled={syncing || loading}
            className="flex items-center gap-2 text-xs font-semibold px-4 py-2 bg-ink text-white rounded-xl hover:bg-ink-800 disabled:opacity-50 transition-all">
            {syncing ? <><Spinner /> Syncing…</> : <><RefreshCw className="w-3.5 h-3.5" /> Sync now</>}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : !gbpConnected && score === 0 ? (
          /* No GBP connected yet */
          <div className="flex flex-col items-center py-6 gap-3 text-center">
            <div className="w-14 h-14 bg-ink-50 rounded-2xl flex items-center justify-center">
              <Globe className="w-7 h-7 text-ink-300" />
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">Connect Google Business to get your score</p>
              <p className="text-xs text-ink-300 mt-1 max-w-xs mx-auto">
                Your trust score starts at 75 the moment you connect your Google Business Profile, then grows with your reviews and account age.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="text-xs text-ink-400 font-medium">75</div>
              <div className="flex-1 w-40 h-1.5 bg-ink-100 rounded-full overflow-hidden">
                <div className="h-full w-0 rounded-full bg-ink-200" />
              </div>
              <div className="text-xs text-ink-400 font-medium">100</div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start">
            {/* Arc gauge */}
            <div className="flex-shrink-0">
              <ScoreArc score={score} />
              <p className="text-center text-xs text-ink-300 mt-2">Visible on your public profile</p>
            </div>

            {/* Pillar breakdown */}
            {breakdown ? (
              <div className="flex-1 space-y-3 w-full">
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Score breakdown</p>
                {/* Base score bar */}
                <div className="flex items-center gap-3 py-2 px-3 bg-ink-50 rounded-xl">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-xs text-ink-600 flex-1">Google Business Profile connected</span>
                  <span className="text-xs font-bold text-emerald-600">+75 baseline</span>
                </div>
                <PillarBar
                  label="Reviews (rating + count)"
                  score={breakdown.reviews ?? 0}
                  color="#3b82f6"
                  note="Google star rating (55%) · Review count (45%) — up to +12.5 pts"
                />
                <PillarBar
                  label="Account age"
                  score={breakdown.activity ?? 0}
                  color="#f59e0b"
                  note="GBP account age up to 5 years — up to +3 pts"
                />
                <PillarBar
                  label="Verification (completeness + GBP verified)"
                  score={breakdown.verification ?? 0}
                  color="#10b981"
                  note="Profile completeness (45%) · Google verified status (55%) — up to +9.5 pts"
                />
                <p className="text-[10px] text-ink-300 pt-1 border-t border-ink-50">
                  Score range: 75 (GBP connected) → 100 (all signals maxed)
                </p>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className="text-sm text-ink-300 text-center">Sync to see your score breakdown.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Google Business Profile connection */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
            <Globe className="w-4 h-4 text-ink-400" />
          </div>
          <div>
            <h2 className="font-semibold text-ink">Google Business Profile</h2>
            <p className="text-xs text-ink-300">Your sole trust signal — review rating, count, verified status &amp; account age</p>
          </div>
        </div>

        <div className={`rounded-xl border p-4 transition-all ${gbpConnected ? 'border-emerald-200 bg-emerald-50/30' : 'border-ink-100'}`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-white border border-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-black text-blue-500 leading-none">G</span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">Google Business</p>
                <p className="text-xs text-ink-300">Review rating · Review count · Verified status · Account age</p>
                {gbpConnected && connected.google?.username && (
                  <p className="text-xs text-ink-400 mt-0.5">{connected.google.username}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {gbpConnected ? (
                <>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </span>
                  <a href="/api/oauth/google"
                    className="text-xs text-ink-400 hover:text-ink border border-ink-100 hover:border-ink-300 px-3 py-1.5 rounded-lg transition-all">
                    Reconnect
                  </a>
                  <button onClick={() => onDisconnect('google')}
                    className="text-xs text-ink-300 hover:text-red-500 border border-transparent hover:border-red-200 px-2 py-1.5 rounded-lg transition-all">
                    ✕
                  </button>
                </>
              ) : (
                <a href="/api/oauth/google"
                  className="text-xs font-semibold text-white px-4 py-1.5 rounded-lg bg-ink hover:bg-ink-800 transition-all">
                  Connect
                </a>
              )}
            </div>
          </div>

          {/* GBP signal detail */}
          {gbpConnected && gbpSig && (
            <div className="mt-3 pt-3 border-t border-ink-100 grid grid-cols-2 sm:grid-cols-4 gap-3">
              {gbpSig.review_rating != null && (
                <div>
                  <p className="text-[10px] text-ink-300 uppercase tracking-wide">Rating</p>
                  <p className="text-sm font-semibold text-ink">★ {Number(gbpSig.review_rating).toFixed(1)}</p>
                </div>
              )}
              {gbpSig.review_count != null && (
                <div>
                  <p className="text-[10px] text-ink-300 uppercase tracking-wide">Reviews</p>
                  <p className="text-sm font-semibold text-ink">{gbpSig.review_count}</p>
                </div>
              )}
              {gbpSig.account_age_days != null && (
                <div>
                  <p className="text-[10px] text-ink-300 uppercase tracking-wide">Account age</p>
                  <p className="text-sm font-semibold text-ink">
                    {Math.floor(gbpSig.account_age_days / 365)}y {Math.floor((gbpSig.account_age_days % 365) / 30)}m
                  </p>
                </div>
              )}
              {gbpSig.is_verified != null && (
                <div>
                  <p className="text-[10px] text-ink-300 uppercase tracking-wide">Verified</p>
                  <p className={`text-sm font-semibold ${gbpSig.is_verified ? 'text-emerald-600' : 'text-ink-400'}`}>
                    {gbpSig.is_verified ? '✓ Verified' : 'Not verified'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {!gbpConnected && (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-100 rounded-xl">
            <p className="text-xs font-semibold text-amber-800 mb-1">Why connect Google Business?</p>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>Instantly unlocks a trust score of 75+ visible to all clients</li>
              <li>Your star rating and review count appear on your public profile</li>
              <li>Earns a "Verified on Google" badge</li>
            </ul>
          </div>
        )}
      </div>

      {/* Sync log */}
      {syncLog.length > 0 && (() => {
        const googleLogs = syncLog.filter((e: any) => e.platform === 'google')
        const lastLog = googleLogs[0]
        const lastFailed = lastLog?.status === 'failed' && lastLog?.error_message
        return (
          <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
            <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Recent sync log</p>

            {/* Prominent error banner for last failed sync */}
            {lastFailed && (
              <div className="flex items-start gap-3 mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-700 mb-0.5">Last sync failed</p>
                  <p className="text-xs text-red-600 leading-relaxed">{lastLog.error_message}</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {googleLogs.slice(0, 8).map((entry: any, i: number) => (
                <div key={i} className="flex items-start gap-3 text-xs">
                  <span className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                    entry.status === 'success' ? 'bg-emerald-500' :
                    entry.status === 'partial'  ? 'bg-amber-400' : 'bg-red-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-ink">Google Business</span>
                    <span className="text-ink-400 ml-2 capitalize">{entry.status}</span>
                    {entry.score_after != null && entry.status === 'success' && (
                      <span className="text-ink-300 ml-2">→ score {entry.score_after}</span>
                    )}
                    {entry.error_message && (
                      <p className="text-red-500 mt-0.5 leading-relaxed">{entry.error_message}</p>
                    )}
                  </div>
                  <span className="text-ink-300 flex-shrink-0 whitespace-nowrap">
                    {new Date(entry.synced_at).toLocaleDateString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* How it works */}
      <div className="bg-ink rounded-2xl p-5 relative overflow-hidden">
        <div className="absolute inset-0 grid-pattern pointer-events-none opacity-40" />
        <div className="relative z-10">
          <p className="text-white font-semibold text-sm mb-3">How your trust score is built</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { icon: '🔗', title: 'Connect GBP → 75', body: 'Connecting your Google Business Profile immediately unlocks a baseline score of 75 shown on your public profile.' },
              { icon: '⭐', title: 'Reviews → up to +12.5', body: 'Your Google star rating and total review count push your score toward 87.5. More great reviews = higher score.' },
              { icon: '✅', title: 'Verified + complete → up to +12.5', body: 'A verified GBP and a complete TrueNorth profile add up to 12.5 more points, reaching 100.' },
            ].map(item => (
              <div key={item.title} className="bg-white/10 rounded-xl p-3">
                <p className="text-white text-xs font-semibold mb-1">{item.icon} {item.title}</p>
                <p className="text-ink-300 text-xs leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── NotifPanel ──────────────────────────────────────────────────────────────

function NotifPanel({
  bookingRequests,
  messages,
  groups,
  notifications,
  setNotifications,
  onNavigate,
  onClose,
}: {
  bookingRequests: BookingRequest[]
  messages: Message[]
  groups: Group[]
  notifications: { id: string; type: string; title: string; body: string | null; read_at: string | null; created_at: string }[]
  setNotifications: React.Dispatch<React.SetStateAction<{ id: string; type: string; title: string; body: string | null; read_at: string | null; created_at: string }[]>>
  onNavigate: (tab: string) => void
  onClose: () => void
}) {
  const pendingBookings = bookingRequests.filter(r => r.status === 'pending')
  const unreadMessages = messages.filter(m => m.unread)
  const unreadGroups = groups.filter(g => (g.unread ?? 0) > 0)
  const unreadSystem = notifications.filter(n => !n.read_at)
  const totalUnread = pendingBookings.length + unreadMessages.length + unreadGroups.length + unreadSystem.length

  function dismissNotif(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    fetch(`/api/photographer/notifications/${id}`, { method: 'DELETE' }).catch(() => {})
  }

  function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    fetch('/api/photographer/notifications', { method: 'PATCH' }).catch(() => {})
  }

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'Just now'
    if (m < 60) return `${m}m ago`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h ago`
    return `${Math.floor(h / 24)}d ago`
  }

  return (
    <div className="flex flex-col h-full max-h-[100dvh] sm:max-h-[480px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-ink">Notifications</p>
          {totalUnread > 0 && (
            <span className="min-w-[18px] h-[18px] bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
              {totalUnread}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <button onClick={markAllRead} className="text-[10px] text-ink-400 hover:text-ink font-medium transition-colors">
              Mark all read
            </button>
          )}
          <button onClick={onClose} className="text-ink-300 hover:text-ink p-1 rounded-lg hover:bg-ink-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto divide-y divide-ink-50">

        {/* Booking requests section */}
        {pendingBookings.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Bookings</p>
            {pendingBookings.map(r => (
              <button key={r.id} onClick={() => onNavigate('requests')}
                className="w-full px-4 py-3 hover:bg-amber-50 transition-colors text-left flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${r.clientBg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                  {r.clientInitials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                    <p className="text-xs font-semibold text-ink">New booking request</p>
                  </div>
                  <p className="text-xs text-ink-500">{r.clientName} · {r.date}</p>
                  <p className="text-[10px] text-ink-300 mt-0.5">{fmtSubmitted(r.submittedAt)}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-ink-200 flex-shrink-0 mt-0.5" />
              </button>
            ))}
          </div>
        )}

        {/* Messages section — client DMs + unread groups/DMs */}
        {(unreadMessages.length > 0 || unreadGroups.length > 0) && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Messages</p>
            {unreadMessages.map(m => (
              <button key={m.id} onClick={() => onNavigate('messages')}
                className="w-full px-4 py-3 hover:bg-ink-50 transition-colors text-left flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg ${m.bg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                  {m.initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0" />
                    <p className="text-xs font-semibold text-ink">New message</p>
                  </div>
                  <p className="text-xs text-ink-500 font-medium">{m.from}</p>
                  <p className="text-xs text-ink-400 truncate">{m.preview}</p>
                  <p className="text-[10px] text-ink-300 mt-0.5">{m.time}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-ink-200 flex-shrink-0 mt-0.5" />
              </button>
            ))}
            {unreadGroups.map(g => {
              const lastMsg = g.messages[g.messages.length - 1]
              const displayName = g.isDm ? (g.dmPeerName ?? g.name) : g.name
              const displayInitials = g.isDm ? (g.dmPeerInitials ?? g.name.slice(0, 2).toUpperCase()) : g.emoji
              const displayBg = g.isDm ? (g.dmPeerBg ?? 'bg-ink-300') : 'bg-violet-600'
              return (
                <button key={g.id} onClick={() => onNavigate('messages')}
                  className="w-full px-4 py-3 hover:bg-ink-50 transition-colors text-left flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg ${g.isDm ? displayBg : 'bg-ink-100'} flex items-center justify-center ${g.isDm ? 'text-white text-[10px] font-bold' : 'text-base'} flex-shrink-0`}>
                    {displayInitials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0" />
                      <p className="text-xs font-semibold text-ink truncate">{displayName}</p>
                      {g.unread > 1 && <span className="text-[9px] font-bold bg-ink text-white rounded-full px-1 flex-shrink-0">{g.unread}</span>}
                    </div>
                    {lastMsg && <p className="text-xs text-ink-400 truncate">{lastMsg.senderName}: {lastMsg.text}</p>}
                    <p className="text-[10px] text-ink-300 mt-0.5">{g.lastActivityAt ? relativeTime(g.lastActivityAt) : ''}</p>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-ink-200 flex-shrink-0 mt-0.5" />
                </button>
              )
            })}
          </div>
        )}

        {/* System notifications section */}
        {unreadSystem.length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Activity</p>
            {unreadSystem.map(n => (
              <div key={n.id} className="px-4 py-3 flex items-start gap-3 hover:bg-ink-50 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0">
                  <Bell className="w-3.5 h-3.5 text-ink-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0" />
                    <p className="text-xs font-semibold text-ink truncate">{n.title}</p>
                  </div>
                  {n.body && <p className="text-xs text-ink-400 truncate">{n.body}</p>}
                  <p className="text-[10px] text-ink-300 mt-0.5">{relativeTime(n.created_at)}</p>
                </div>
                <button
                  onClick={() => dismissNotif(n.id)}
                  className="text-ink-200 hover:text-ink-400 p-0.5 rounded transition-colors flex-shrink-0"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {totalUnread === 0 && (
          <div className="px-4 py-12 text-center">
            <div className="w-12 h-12 bg-ink-50 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5 text-ink-200" />
            </div>
            <p className="text-sm font-medium text-ink-300">You're all caught up!</p>
            <p className="text-xs text-ink-200 mt-0.5">No new notifications right now.</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Avatar dropdown ─────────────────────────────────────────────────────────

function AvatarMenu({ avatarUrl, displayName, onSettings }: {
  avatarUrl: string
  displayName: string
  onSettings: () => void
}) {
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
    <div className="relative ml-1" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-ink/20"
        aria-label="Account menu"
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {displayName ? displayName[0].toUpperCase() : 'P'}
            </span>
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-48 bg-white rounded-2xl border border-ink-100 py-1.5 z-50" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}>
          {displayName && (
            <div className="px-4 py-2 border-b border-ink-50 mb-1">
              <p className="text-xs font-semibold text-ink truncate">{displayName}</p>
              <p className="text-[10px] text-ink-400">Photographer</p>
            </div>
          )}
          <button
            onClick={() => { setOpen(false); onSettings() }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-600 hover:bg-ink-50 transition-colors text-left"
          >
            <Settings className="w-3.5 h-3.5 text-ink-400" /> Settings
          </button>
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function PhotographerDashboardInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const isFresh = searchParams.get('fresh') === '1'
  const tabParam = searchParams.get('tab') as DashboardTab | null
  const trustConnected = searchParams.get('trust_connected') as string | null
  const trustError = searchParams.get('trust_error') as string | null
  const trustErrorMsg = searchParams.get('msg') as string | null

  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    bio: '',
    area: '',
    rate: '',
    rateUnit: 'hr',
    specialties: [],
    websiteUrl: '',
    contactInstagram: '',
    contactFacebook: '',
    hasPortfolio: false,
    availabilitySet: false,
    email: '',
    avatarUrl: '',
    coverImageUrl: '',
    trustScore: 0,
    completenessScore: 0,
    nativeAvgRating: 0,
    nativeReviewCount: 0,
    yearsExperience: null,
    portfolioPhotoCount: 0,
    completedBookings: 0,
    isGbpOAuthConnected: false,
    gbpReviewCount: 0,
    accountAgeDays: 0,
    profileStatus: 'pending',
  })

  // Load real profile from DB on mount.
  // On fresh signup (isFresh=1) the session cookie may not be propagated yet —
  // retry once after a short delay before giving up.
  useEffect(() => {
    async function loadProfile(attempt = 1) {
      try {
        const r = await fetch('/api/photographer/profile')
        if (!r.ok) {
          // 401 on first attempt right after signup = cookie race; retry once
          if (r.status === 401 && attempt === 1) {
            setTimeout(() => loadProfile(2), 1200)
            return
          }
          return // keep empty defaults
        }
        const data = await r.json()
        setProfile(prev => ({
          ...prev,
          displayName:         data.display_name ?? '',
          bio:                 data.bio ?? '',
          area:                data.location ?? '',
          rate:                data.rate_amount ?? '',
          rateUnit:            data.rate_unit ?? 'hr',
          specialties:         data.specialties ?? [],
          websiteUrl:          data.website_url ?? '',
          contactInstagram:    data.contact_instagram_url ?? '',
          contactFacebook:     data.contact_facebook_url ?? '',
          avatarUrl:           data.avatar_url ?? '',
          coverImageUrl:       data.cover_image_url ?? '',
          trustScore:          0,
          completenessScore:   data.completeness_score ?? 0,
          nativeAvgRating:     data.native_avg_rating ?? 0,
          nativeReviewCount:   data.native_review_count ?? 0,
          yearsExperience:     data.years_experience ?? null,
          portfolioPhotoCount: data.portfolio_photo_count ?? 0,
          completedBookings:   data.completed_bookings ?? 0,
          isGbpOAuthConnected: data.is_gbp_oauth_connected ?? false,
          gbpReviewCount:      data.gbp_review_count ?? 0,
          accountAgeDays:      data.account_age_days ?? 0,
          profileStatus:       data.profile_status ?? 'pending',
        }))
      } catch {
        // keep empty defaults
      }
    }
    loadProfile()
  }, [])

  const [messages, setMessages] = useState<Message[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [bookedDates, setBookedDates] = useState<Record<string, DayStatus>>({})
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    1: { slots: [] }, 2: { slots: [] }, 3: { slots: [] }, 4: { slots: [] }, 5: { slots: [] },
  })
  const [packages, setPackages] = useState<ProjectPackage[]>([])
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([])
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(null)

  // Load packages from DB
  useEffect(() => {
    fetch('/api/photographer/packages')
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        if (!Array.isArray(data)) return
        setPackages(data.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description ?? '',
          price: String(p.price),
          billing_type: p.billing_type,
          includes: p.deliverables ?? [],
          popular: p.is_popular ?? false,
          banner_url: p.banner_url ?? null,
          specialty: p.specialty ?? null,
        })))
      })
      .catch(() => {})
  }, [])

  // Load availability (weekly schedule + day overrides) from DB
  useEffect(() => {
    fetch('/api/photographer/availability')
      .then(r => r.ok ? r.json() : null)
      .then((data: any) => {
        if (!data) return
        if (data.weekly) {
          const schedule: WeeklySchedule = {}
          let hasSlots = false
          for (const [day, slots] of Object.entries(data.weekly as Record<string, any[]>)) {
            schedule[Number(day)] = {
              slots: slots.map((s: any) => ({
                id: s.id,
                label: s.slot_label,
                start: s.start_time.slice(0, 5),
                end: s.end_time.slice(0, 5),
                maxClients: 1,
              })),
            }
            if (slots.length > 0) hasSlots = true
          }
          setWeeklySchedule(schedule)
          if (hasSlots) setProfile(prev => ({ ...prev, availabilitySet: true }))
        }
        if (Array.isArray(data.day_statuses)) {
          const overrides: Record<string, DayStatus> = {}
          for (const row of data.day_statuses) {
            // API date: "2026-04-24" → local key: "2026-4-24"
            const [y, m, d] = row.date.split('-')
            const key = `${Number(y)}-${Number(m) - 1}-${Number(d)}`
            overrides[key] = row.status as DayStatus
          }
          setBookedDates(prev => ({ ...prev, ...overrides }))
        }
      })
      .catch(() => {})
  }, [])
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [notifications, setNotifications] = useState<{ id: string; type: string; title: string; body: string | null; read_at: string | null; created_at: string }[]>([])

  // Load FAQs, booking requests, conversations, notifications, and groups in parallel
  useEffect(() => {
    Promise.all([
      fetch('/api/photographer/faqs').then(r => r.ok ? r.json() : []),
      fetch('/api/photographer/bookings').then(r => r.ok ? r.json() : []),
      fetch('/api/photographer/messages').then(r => r.ok ? r.json() : []),
      fetch('/api/photographer/notifications').then(r => r.ok ? r.json() : []),
      fetch('/api/photographer/groups').then(r => r.ok ? r.json() : { groups: [], invites: [] }),
    ])
      .then(([faqData, bookingData, msgData, notifData, groupsData]) => {
        // FAQs
        if (Array.isArray(faqData) && faqData.length > 0) {
          setFaqs(faqData.map((f: any) => ({
            id: f.id,
            question: f.question,
            answer: f.answer,
            sort_order: f.sort_order,
          })))
        }

        // Booking requests — map API shape to dashboard BookingRequest shape
        // Build clientId → conversationId map from conversations
        const clientConvMap: Record<string, string> = {}
        if (Array.isArray(msgData)) {
          for (const c of msgData) {
            if (c.clientId && c.id) clientConvMap[c.clientId] = c.id
          }
        }

        if (Array.isArray(bookingData) && bookingData.length > 0) {
          setBookingRequests(bookingData.map((b: any) => {
            const d = new Date(b.date)
            const dateKey = isNaN(d.getTime()) ? b.date : `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
            const displayDate = isNaN(d.getTime()) ? b.date : d.toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })
            // Deterministic bg colour from clientId
            const palette = ['bg-slate-600','bg-violet-600','bg-emerald-600','bg-rose-500','bg-amber-600','bg-sky-600','bg-teal-600','bg-indigo-600']
            const code = (b.clientId ?? '').split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0)
            return {
              id: b.id,
              clientId: b.clientId ?? '',
              clientName: b.clientName,
              clientInitials: b.clientInitials,
              clientBg: palette[code % palette.length],
              date: displayDate,
              dateKey,
              isoDate: b.date,
              timeSlot: b.timeSlot,
              note: b.description,
              billingType: b.billingType,
              billingDetail: b.billingDetail,
              status: b.status,
              photographerNote: b.photographerNote,
              submittedAt: b.submittedAt,
              conversationId: clientConvMap[b.clientId] ?? null,
            }
          }))
        }

        // Conversations → Message[] shape for the messages tab
        if (Array.isArray(msgData) && msgData.length > 0) {
          const palette = ['bg-slate-600','bg-violet-600','bg-emerald-600','bg-rose-500','bg-amber-600','bg-sky-600','bg-teal-600','bg-indigo-600']
          setMessages(msgData.map((c: any) => {
            const code = (c.clientId ?? '').split('').reduce((a: number, ch: string) => a + ch.charCodeAt(0), 0)
            return {
              id: c.id,
              from: c.clientName,
              initials: c.clientInitials,
              bg: palette[code % palette.length],
              preview: c.lastMessage,
              time: c.lastMessageAt ? fmtSubmitted(c.lastMessageAt) : '',
              unread: c.unread > 0,
              thread: [],
              threadLoaded: false,
            }
          }))
        }

        // Notifications
        if (Array.isArray(notifData)) {
          setNotifications(notifData)
        }

        // Groups
        if (Array.isArray(groupsData?.groups)) {
          setGroups(groupsData.groups.map((g: any) => ({
            id: g.id,
            name: g.name,
            emoji: g.emoji ?? '👥',
            memberIds: g.memberIds ?? [],
            pendingInviteIds: g.pendingInviteIds ?? [],
            ownerId: g.ownerId ?? '',
            messages: (g.messages ?? []).map((m: any) => ({
              id: m.id,
              senderId: m.senderId,
              senderName: m.senderName,
              senderInitials: m.senderInitials,
              senderBg: m.senderBg,
              text: m.text,
              time: m.time,
              isSystem: m.isSystem ?? false,
              attachmentUrl: m.attachmentUrl ?? null,
              attachmentType: m.attachmentType ?? null,
              attachmentName: m.attachmentName ?? null,
              attachmentSize: m.attachmentSize ?? null,
            })) as GroupMessage[],
            unread: g.unread ?? 0,
            lastActivityAt: g.lastActivityAt ?? null,
            isCoverGroup: g.isCoverGroup ?? false,
            isDm: g.isDm ?? false,
            dmPeerId: g.dmPeerId ?? null,
            dmPeerName: g.dmPeerName ?? null,
            dmPeerInitials: g.dmPeerInitials ?? null,
            dmPeerBg: g.dmPeerBg ?? null,
            isRemoved: g.isRemoved ?? false,
            isLeft: g.isLeft ?? false,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const [notifOpen, setNotifOpen] = useState(false)
  const [welcomeDismissed, setWelcomeDismissed] = useState(false)

  // ── Portfolio state ──────────────────────────────────────────────────────────
  const [portfolioAlbums, setPortfolioAlbums] = useState<PortfolioAlbum[]>([])
  const [standalonePhotos, setStandalonePhotos] = useState<PortfolioPhoto[]>([])
  const [standaloneVideos, setStandaloneVideos] = useState<PortfolioVideo[]>([])
  const [portfolioLoading, setPortfolioLoading] = useState(false)
  const [portfolioLoaded, setPortfolioLoaded] = useState(false)
  const [openAlbumId, setOpenAlbumId] = useState<string | null>(null)
  const standalonePhotoInputRef = useRef<HTMLInputElement>(null)
  const standaloneVideoInputRef = useRef<HTMLInputElement>(null)
  const [standaloneUploading, setStandaloneUploading] = useState(false)
  const [standaloneVideoUploading, setStandaloneVideoUploading] = useState(false)
  const [albumModal, setAlbumModal] = useState<{ mode: 'create' | 'rename'; albumId?: string } | null>(null)
  const [albumDraft, setAlbumDraft] = useState('')
  // albumId = null means standalone photo
  const [editingCaption, setEditingCaption] = useState<{ albumId: string | null; photoId: string } | null>(null)
  const [captionDraft, setCaptionDraft] = useState('')
  const [tagsDraft, setTagsDraft] = useState<string[]>([])
  const [customTagDraft, setCustomTagDraft] = useState('')
  const [takenMonthDraft, setTakenMonthDraft] = useState<string>('')
  const [takenYearDraft, setTakenYearDraft] = useState<string>('')
  const [savingCaption, setSavingCaption] = useState(false)
  const [savedCaption, setSavedCaption] = useState<string | null>(null)
  const [editingVideoTitle, setEditingVideoTitle] = useState<{ videoId: string; isStandalone: boolean; albumId?: string } | null>(null)
  const [videoTitleDraft, setVideoTitleDraft] = useState('')
  const [videoTagsDraft, setVideoTagsDraft] = useState<string[]>([])
  const [videoMonthDraft, setVideoMonthDraft] = useState<string>('')
  const [videoYearDraft, setVideoYearDraft] = useState<string>('')
  const [savingVideoTitle, setSavingVideoTitle] = useState(false)
  const [savedVideoTitle, setSavedVideoTitle] = useState<string | null>(null)
  const [previewLightbox, setPreviewLightbox] = useState<{ photos: { id: string; src: string; caption: string }[]; idx: number } | null>(null)
  const [previewVideo, setPreviewVideo] = useState<{ src: string; title: string } | null>(null)
  const [portfolioUploadError, setPortfolioUploadError] = useState<string | null>(null)
  const [portfolioUploading, setPortfolioUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const portfolioPhotoInputRef = useRef<HTMLInputElement>(null)
  const portfolioVideoInputRef = useRef<HTMLInputElement>(null)
  const photoDragIdx = useRef<number | null>(null)
  const [photoDragOver, setPhotoDragOver] = useState<number | null>(null)

  async function commitPortfolioAlbumModal() {
    const title = albumDraft.trim()
    if (!title) return
    if (albumModal?.mode === 'create') {
      const res = await fetch('/api/photographer/albums', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) })
      if (res.ok) {
        const newAlbum = await res.json()
        setPortfolioAlbums(prev => [...prev, { ...newAlbum, photos: [], videos: [] }])
      }
    } else if (albumModal?.mode === 'rename' && albumModal.albumId) {
      const res = await fetch('/api/photographer/albums', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: albumModal.albumId, title }) })
      if (res.ok) setPortfolioAlbums(prev => prev.map(a => a.id === albumModal.albumId ? { ...a, title } : a))
    }
    setAlbumModal(null)
  }

  async function deletePortfolioAlbum(albumId: string) {
    const res = await fetch(`/api/photographer/albums?id=${albumId}`, { method: 'DELETE' })
    if (res.ok) {
      setPortfolioAlbums(prev => prev.filter(a => a.id !== albumId))
      if (openAlbumId === albumId) setOpenAlbumId(null)
    }
  }

  async function handlePortfolioPhotoFiles(files: FileList | null) {
    if (!files || !openAlbumId) return
    setPortfolioUploadError(null)
    const all = Array.from(files).filter(f => f.type.startsWith('image/'))
    const oversized = all.filter(f => f.size > MAX_PHOTO_BYTES)
    if (oversized.length > 0) { setPortfolioUploadError(`${oversized.map(f => f.name).join(', ')} exceed the ${MAX_PHOTO_MB} MB limit.`); return }
    const tp = totalPortfolioPhotos(portfolioAlbums)
    if (tp + all.length > MAX_PHOTOS_TOTAL) { setPortfolioUploadError(`Portfolio limit is ${MAX_PHOTOS_TOTAL} photos. You have ${MAX_PHOTOS_TOTAL - tp} slot(s) remaining.`); return }
    setPortfolioUploading(true)
    for (const file of all) {
      const photo = await uploadPortfolioPhoto(file, openAlbumId)
      if (!photo) { setPortfolioUploadError(`Failed to upload ${file.name}. Try again.`); continue }
      setPortfolioAlbums(prev => prev.map(a => a.id === openAlbumId ? { ...a, photos: [...a.photos, { ...photo, isCover: a.photos.length === 0 }] } : a))
    }
    setPortfolioUploading(false)
    if (portfolioPhotoInputRef.current) portfolioPhotoInputRef.current.value = ''
  }

  async function removePortfolioPhoto(albumId: string, photoId: string) {
    const res = await fetch(`/api/photographer/photos?id=${photoId}`, { method: 'DELETE' })
    if (res.ok) {
      setPortfolioAlbums(prev => prev.map(a => {
        if (a.id !== albumId) return a
        const next = a.photos.filter(p => p.id !== photoId)
        if (next.length > 0) next[0] = { ...next[0], isCover: true }
        return { ...a, photos: next }
      }))
    }
  }

  function setPortfolioCover(albumId: string, photoId: string) {
    setPortfolioAlbums(prev => prev.map(a => a.id !== albumId ? a : { ...a, photos: a.photos.map(p => ({ ...p, isCover: p.id === photoId })) }))
  }

  async function savePortfolioCaption() {
    if (!editingCaption) return
    setSavingCaption(true)
    const allTags = [...tagsDraft, ...(customTagDraft.trim() ? [customTagDraft.trim()] : [])]
    const res = await fetch('/api/photographer/photos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingCaption.photoId,
        caption: captionDraft,
        tags: allTags,
        photo_taken_month: takenMonthDraft ? Number(takenMonthDraft) : null,
        photo_taken_year:  takenYearDraft  ? Number(takenYearDraft)  : null,
      }),
    })
    if (res.ok) {
      const updated = { caption: captionDraft, tags: allTags, photo_taken_month: takenMonthDraft ? Number(takenMonthDraft) : null, photo_taken_year: takenYearDraft ? Number(takenYearDraft) : null }
      if (editingCaption.albumId) {
        setPortfolioAlbums(prev => prev.map(a => a.id !== editingCaption.albumId ? a : { ...a, photos: a.photos.map(p => p.id === editingCaption.photoId ? { ...p, ...updated } : p) }))
      } else {
        setStandalonePhotos(prev => prev.map(p => p.id === editingCaption.photoId ? { ...p, ...updated } : p))
      }
      setSavedCaption(editingCaption.photoId)
      setTimeout(() => setSavedCaption(null), 2000)
    }
    setEditingCaption(null)
    setSavingCaption(false)
  }

  async function saveVideoTitle() {
    if (!editingVideoTitle) return
    setSavingVideoTitle(true)
    const month = parseInt(videoMonthDraft) || null
    const year  = parseInt(videoYearDraft)  || null
    const res = await fetch('/api/photographer/videos', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingVideoTitle.videoId,
        title: videoTitleDraft,
        tags: videoTagsDraft,
        video_taken_month: month,
        video_taken_year:  year,
      }),
    })
    if (res.ok) {
      const updated = { title: videoTitleDraft, tags: videoTagsDraft, video_taken_month: month, video_taken_year: year }
      if (editingVideoTitle.isStandalone) {
        setStandaloneVideos(prev => prev.map(v => v.id === editingVideoTitle.videoId ? { ...v, ...updated } : v))
      } else if (editingVideoTitle.albumId) {
        setPortfolioAlbums(prev => prev.map(a => a.id !== editingVideoTitle.albumId ? a : { ...a, videos: a.videos.map(v => v.id === editingVideoTitle.videoId ? { ...v, ...updated } : v) }))
      }
      setSavedVideoTitle(editingVideoTitle.videoId)
      setTimeout(() => setSavedVideoTitle(null), 2000)
    }
    setEditingVideoTitle(null)
    setSavingVideoTitle(false)
  }

  function handlePhotoDragStart(idx: number) {
    photoDragIdx.current = idx
  }

  function handlePhotoDrop(albumId: string, toIdx: number) {
    const fromIdx = photoDragIdx.current
    if (fromIdx === null || fromIdx === toIdx) { photoDragIdx.current = null; setPhotoDragOver(null); return }
    setPortfolioAlbums(prev => prev.map(a => {
      if (a.id !== albumId) return a
      const photos = [...a.photos]
      const [moved] = photos.splice(fromIdx, 1)
      photos.splice(toIdx, 0, moved)
      const reindexed = photos.map((p, i) => ({ ...p, isCover: i === 0 }))
      fetch('/api/photographer/photos', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reindexed.map((p, i) => ({ id: p.id, sort_order: i }))),
      }).catch(() => {})
      return { ...a, photos: reindexed }
    }))
    photoDragIdx.current = null
    setPhotoDragOver(null)
  }

  async function handlePortfolioVideoFile(file: File | null) {
    if (!file || !openAlbumId) return
    setPortfolioUploadError(null)
    if (!file.type.startsWith('video/')) { setPortfolioUploadError('Only video files are allowed.'); return }
    const maxBytes = PLATFORM_CONFIG.max_video_bytes
    if (file.size > maxBytes) { setPortfolioUploadError(`Video exceeds the ${maxBytes / 1024 / 1024} MB limit.`); return }
    const tv = totalPortfolioVideos(portfolioAlbums)
    if (tv >= MAX_VIDEOS_TOTAL) { setPortfolioUploadError(`Maximum ${MAX_VIDEOS_TOTAL} videos allowed.`); return }
    setVideoUploading(true)
    const form = new FormData()
    form.append('file', file)
    form.append('album_id', openAlbumId)
    try {
      const res = await fetch('/api/photographer/videos/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setPortfolioUploadError(err.error ?? 'Failed to upload video.')
        return
      }
      const video: PortfolioVideo = await res.json()
      setPortfolioAlbums(prev => prev.map(a => a.id === openAlbumId ? { ...a, videos: [...a.videos, video] } : a))
    } catch {
      setPortfolioUploadError('Upload failed. Try again.')
    } finally {
      setVideoUploading(false)
      if (portfolioVideoInputRef.current) portfolioVideoInputRef.current.value = ''
    }
  }

  async function removePortfolioVideo(albumId: string, videoId: string) {
    const res = await fetch(`/api/photographer/videos?id=${videoId}`, { method: 'DELETE' })
    if (res.ok) {
      setPortfolioAlbums(prev => prev.map(a => a.id !== albumId ? a : { ...a, videos: a.videos.filter(v => v.id !== videoId) }))
    }
  }

  async function handleStandalonePhotoFiles(files: FileList | null) {
    if (!files) return
    setPortfolioUploadError(null)
    const all = Array.from(files).filter(f => f.type.startsWith('image/'))
    const oversized = all.filter(f => f.size > MAX_PHOTO_BYTES)
    if (oversized.length > 0) { setPortfolioUploadError(`${oversized.map(f => f.name).join(', ')} exceed the ${MAX_PHOTO_MB} MB limit.`); return }
    const totalExisting = totalPortfolioPhotos(portfolioAlbums) + standalonePhotos.length
    if (totalExisting + all.length > MAX_PHOTOS_TOTAL) {
      setPortfolioUploadError(`Portfolio limit is ${MAX_PHOTOS_TOTAL} photos.`); return
    }
    setStandaloneUploading(true)
    for (const file of all) {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/photographer/photos/upload', { method: 'POST', body: form })
      if (!res.ok) { setPortfolioUploadError(`Failed to upload ${file.name}.`); continue }
      const photo: PortfolioPhoto = await res.json()
      setStandalonePhotos(prev => [...prev, photo])
    }
    setStandaloneUploading(false)
    if (standalonePhotoInputRef.current) standalonePhotoInputRef.current.value = ''
  }

  async function removeStandalonePhoto(photoId: string) {
    const res = await fetch(`/api/photographer/photos?id=${photoId}`, { method: 'DELETE' })
    if (res.ok) setStandalonePhotos(prev => prev.filter(p => p.id !== photoId))
  }

  async function handleStandaloneVideoFile(file: File | null) {
    if (!file) return
    setPortfolioUploadError(null)
    if (!file.type.startsWith('video/')) { setPortfolioUploadError('Only video files are allowed.'); return }
    if (file.size > PLATFORM_CONFIG.max_video_bytes) { setPortfolioUploadError(`Video exceeds the ${PLATFORM_CONFIG.max_video_bytes / 1024 / 1024} MB limit.`); return }
    const totalVids = totalPortfolioVideos(portfolioAlbums) + standaloneVideos.length
    if (totalVids >= MAX_VIDEOS_TOTAL) { setPortfolioUploadError(`Maximum ${MAX_VIDEOS_TOTAL} videos allowed.`); return }
    setStandaloneVideoUploading(true)
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch('/api/photographer/videos/upload', { method: 'POST', body: form })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        setPortfolioUploadError(err.error ?? 'Failed to upload video.')
        return
      }
      const video: PortfolioVideo = await res.json()
      setStandaloneVideos(prev => [...prev, video])
    } catch {
      setPortfolioUploadError('Upload failed. Try again.')
    } finally {
      setStandaloneVideoUploading(false)
      if (standaloneVideoInputRef.current) standaloneVideoInputRef.current.value = ''
    }
  }

  async function removeStandaloneVideo(videoId: string) {
    const res = await fetch(`/api/photographer/videos?id=${videoId}`, { method: 'DELETE' })
    if (res.ok) setStandaloneVideos(prev => prev.filter(v => v.id !== videoId))
  }

  const validTabs: DashboardTab[] = ['overview','portfolio','messages','requests','availability','packages','reviews','network','faq','settings','trust']
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    if (trustConnected || trustError) return 'trust'
    return tabParam && validTabs.includes(tabParam) ? tabParam : 'overview'
  })

  // Trust score data
  const [trustData, setTrustData] = useState<any>(null)
  const [trustLoading, setTrustLoading] = useState(false)
  const [trustSyncing, setTrustSyncing] = useState(false)
  const [trustNotification, setTrustNotification] = useState<{ type: 'success' | 'error'; msg: string } | null>(
    trustConnected
      ? { type: 'success', msg: `${trustConnected.charAt(0).toUpperCase() + trustConnected.slice(1)} connected! Syncing your trust score…` }
      : trustError
      ? { type: 'error', msg: `Could not connect ${trustError}${trustErrorMsg ? ': ' + trustErrorMsg : ''}` }
      : null
  )

  // Load trust data when tab is active
  useEffect(() => {
    if (activeTab !== 'trust') return
    setTrustLoading(true)
    fetch('/api/photographer/trust')
      .then(r => r.ok ? r.json() : null)
      .then(d => setTrustData(d))
      .catch(() => {})
      .finally(() => setTrustLoading(false))
  }, [activeTab])

  // After a platform is connected via OAuth, auto-trigger a sync then reload full trust data
  useEffect(() => {
    if (!trustConnected) return
    setTrustSyncing(true)
    fetch('/api/photographer/trust', { method: 'POST' })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.trust_score !== undefined) {
          setTrustNotification({ type: 'success', msg: `Connected! New trust score: ${d.trust_score}` })
        }
      })
      .catch(() => {})
      .finally(() => {
        setTrustSyncing(false)
        // Reload full trust data so connected_platforms + signals update
        fetch('/api/photographer/trust')
          .then(r => r.ok ? r.json() : null)
          .then(d => { if (d) setTrustData(d) })
          .catch(() => {})
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPortfolio = () => {
    setPortfolioLoading(true)
    fetch('/api/photographer/albums')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setPortfolioAlbums(data.albums ?? [])
          setStandalonePhotos(data.standalone_photos ?? [])
          setStandaloneVideos(data.standalone_videos ?? [])
        } else {
          setPortfolioAlbums(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {})
      .finally(() => { setPortfolioLoading(false); setPortfolioLoaded(true) })
  }

  // Load portfolio on mount so hasPortfolio reflects reality from the start
  useEffect(() => { loadPortfolio() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Reload when switching to portfolio tab (if already loaded once, still refresh)
  useEffect(() => {
    if (activeTab !== 'portfolio') return
    loadPortfolio()
  }, [activeTab]) // eslint-disable-line react-hooks/exhaustive-deps

  const hasPortfolio =
    totalPortfolioPhotos(portfolioAlbums) > 0 ||
    totalPortfolioVideos(portfolioAlbums) > 0 ||
    standalonePhotos.length > 0 ||
    standaloneVideos.length > 0

  // Ref for the main content area — used to scroll to top on mobile tab switch
  const mainContentRef = useRef<HTMLDivElement>(null)

  // Unified tab switcher — updates state, URL, and scrolls to top on mobile
  function switchTab(tab: DashboardTab) {
    setActiveTab(tab)
    const params = new URLSearchParams(window.location.search)
    params.set('tab', tab)
    // Replace so back button doesn't loop through every tab click
    router.replace(`/dashboard/photographer?${params.toString()}`, { scroll: false })
    // Scroll the main content column to top (critical on mobile)
    if (mainContentRef.current) {
      mainContentRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const { sections, pct } = computeScore({ ...profile, hasPortfolio, faqCount: faqs.length })
  const incomplete = sections.filter(s => !s.done)
  const unreadCount = messages.filter(m => m.unread).length
  const groupUnreadCount = groups.reduce((acc, g) => acc + (g.unread ?? 0), 0)
  const totalUnreadMessages = unreadCount + groupUnreadCount
  const scoreColor = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'

  // Badge computation — uses live portfolio count from portfolio tab if loaded, else profile API value
  const livePortfolioCount = totalPortfolioPhotos(portfolioAlbums) + standalonePhotos.length
  const badgeSignals: BadgeSignals = {
    portfolioPhotoCount:  livePortfolioCount > 0 ? livePortfolioCount : profile.portfolioPhotoCount,
    platformReviewCount:  profile.nativeReviewCount,
    nativeAvgRating:      profile.nativeAvgRating,
    completedBookings:    profile.completedBookings,
    completenessScore:    profile.completenessScore,
    accountAgeDays:       profile.accountAgeDays,
    isGbpOAuthConnected:  profile.isGbpOAuthConnected,
    gbpReviewCount:       profile.gbpReviewCount,
    yearsExperience:      profile.yearsExperience,
  }
  const currentBadge   = computeBadge(badgeSignals)
  const badgeProgress  = computeBadgeProgress(badgeSignals)

  const pendingBookings = bookingRequests.filter(r => r.status === 'pending').length

  // When a booking request comes in, mark the day as tentative on the calendar
  // (done at request creation — this ensures the state stays synced on load)
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'messages', label: totalUnreadMessages > 0 ? `Messages (${totalUnreadMessages})` : 'Messages' },
    { key: 'requests', label: pendingBookings > 0 ? `Booking Requests (${pendingBookings})` : 'Booking Requests' },
    { key: 'availability', label: 'Availability' },
    { key: 'packages', label: 'Packages' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'network', label: 'Network' },
    { key: 'faq', label: 'FAQ' },
    { key: 'trust', label: 'Trust Score' },
    { key: 'settings', label: 'Settings' },
  ] as const

  return (
    <div className="min-h-screen bg-ink-50">
      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white border-b border-ink-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0">
              <Image src="/logo.png" alt="TrueNorth Frames" width={32} height={32} className="rounded-md" />
              <span className="font-semibold text-ink text-sm hidden sm:block">TrueNorth Frames</span>
            </Link>

            <div className="flex items-center gap-1.5">
              {/* View public profile */}
              <Link
                href="/photographers/your-profile"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-ink-100 text-ink-400 hover:text-ink hover:border-ink-300 transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> View profile
              </Link>

              {/* Notifications bell */}
              <NotificationCentre
                apiEndpoint="/api/photographer/notifications"
                markReadEndpoint="/api/photographer/notifications"
                role="photographer"
                pollIntervalMs={30000}
              />

              {/* Avatar dropdown */}
              <AvatarMenu
                avatarUrl={profile.avatarUrl}
                displayName={profile.displayName}
                onSettings={() => switchTab('settings')}
              />
            </div>
          </div>
        </div>
      </nav>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Pending review banner — shown whenever profile_status is pending */}
        {profile.profileStatus === 'pending' && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Your profile is under review</p>
              <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                You won't appear in client searches until approved — usually within 1–2 business days. Use this time to upload portfolio photos, set your packages, and connect your Google Business Profile to hit the ground running.
              </p>
            </div>
          </div>
        )}

        {/* Welcome banner — only for approved photographers on first login */}
        {isFresh && !welcomeDismissed && profile.profileStatus === 'approved' && (
          <div className="bg-ink rounded-2xl p-5 mb-6 flex items-start justify-between gap-4 relative overflow-hidden">
            <div className="absolute inset-0 grid-pattern pointer-events-none opacity-50" />
            <div className="relative z-10">
              <p className="font-semibold text-white text-sm mb-1">
                Welcome to TrueNorth Frames{profile.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''}!
              </p>
              <p className="text-ink-300 text-xs leading-relaxed">
                Your profile is live. Complete the checklist to start appearing in client searches.
              </p>
            </div>
            <button onClick={() => setWelcomeDismissed(true)} className="relative z-10 text-ink-400 hover:text-white flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Main column ─────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6" ref={mainContentRef}>

            {/* Tab bar — scrollable on mobile */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-ink-100 overflow-x-auto scrollbar-hide" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => switchTab(tab.key)}
                  className={`flex-none whitespace-nowrap text-sm font-medium py-2 px-3 rounded-lg transition-all ${
                    activeTab === tab.key ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Overview ─────────────────────────────────────────── */}
            {activeTab === 'overview' && (
              <div className="space-y-5">

                {/* ── Badge + stats row ── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Badge card — spans 2 cols on mobile, 1 on sm+ */}
                  <div className="col-span-2 sm:col-span-1 bg-white rounded-2xl p-4 flex flex-col gap-2" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-300">Your badge</p>
                    <PhotographerBadge badge={currentBadge} size="md" />
                    {badgeProgress.next && (
                      <p className="text-[10px] text-ink-400 leading-snug mt-0.5">
                        Next: <span className="font-medium text-ink-600">{badgeProgress.next.replace('_', ' ')}</span>
                      </p>
                    )}
                    {!badgeProgress.next && (
                      <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Top tier ✓</p>
                    )}
                  </div>

                  {/* Messages */}
                  <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                    <MessageSquare className="w-4 h-4 text-ink-300 mb-2" />
                    <p className="font-bold text-ink text-xl">{messages.length + groups.length}</p>
                    <p className="text-ink-400 text-xs mt-0.5">Messages</p>
                    <p className="text-ink-300 text-[10px] mt-1">{totalUnreadMessages > 0 ? `${totalUnreadMessages} unread` : 'All read'}</p>
                  </div>

                  {/* Rating */}
                  <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                    <Star className="w-4 h-4 text-ink-300 mb-2" />
                    <p className="font-bold text-ink text-xl">
                      {profile.nativeAvgRating > 0 ? profile.nativeAvgRating.toFixed(1) : '—'}
                    </p>
                    <p className="text-ink-400 text-xs mt-0.5">Avg rating</p>
                    <p className="text-ink-300 text-[10px] mt-1">
                      {profile.nativeReviewCount > 0 ? `${profile.nativeReviewCount} review${profile.nativeReviewCount !== 1 ? 's' : ''}` : 'No reviews yet'}
                    </p>
                  </div>

                  {/* Bookings */}
                  <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                    <Zap className="w-4 h-4 text-ink-300 mb-2" />
                    <p className="font-bold text-ink text-xl">{profile.completedBookings}</p>
                    <p className="text-ink-400 text-xs mt-0.5">Completed bookings</p>
                    <p className="text-ink-300 text-[10px] mt-1">
                      {profile.completedBookings >= 3 ? 'Trusted Pro eligible' : `${3 - profile.completedBookings} more for Trusted Pro`}
                    </p>
                  </div>
                </div>

                {/* ── Online presence at-a-glance ── */}
                <div className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-ink-400 uppercase tracking-wider">Online presence</p>
                    <button onClick={() => switchTab('settings')} className="text-xs text-ink-400 hover:text-ink flex items-center gap-1 transition-colors">
                      Edit <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {/* Website */}
                    {profile.websiteUrl ? (
                      <a href={profile.websiteUrl} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-ink-50 text-ink-600 hover:bg-ink-100 transition-colors border border-ink-100">
                        <Globe className="w-3 h-3" /> Website
                      </a>
                    ) : (
                      <button onClick={() => switchTab('settings')}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-dashed border-ink-200 text-ink-300 hover:border-ink-400 hover:text-ink-500 transition-colors">
                        <Globe className="w-3 h-3" /> Add website
                      </button>
                    )}
                    {/* Instagram */}
                    {profile.contactInstagram ? (
                      <a href={`https://instagram.com/${profile.contactInstagram}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-pink-50 text-pink-600 hover:bg-pink-100 transition-colors border border-pink-100">
                        <Instagram className="w-3 h-3" /> @{profile.contactInstagram}
                      </a>
                    ) : (
                      <button onClick={() => switchTab('settings')}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-dashed border-ink-200 text-ink-300 hover:border-ink-400 hover:text-ink-500 transition-colors">
                        <Instagram className="w-3 h-3" /> Add Instagram
                      </button>
                    )}
                    {/* Facebook */}
                    {profile.contactFacebook ? (
                      <a href={`https://facebook.com/${profile.contactFacebook}`} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors border border-blue-100">
                        <Facebook className="w-3 h-3" /> @{profile.contactFacebook}
                      </a>
                    ) : (
                      <button onClick={() => switchTab('settings')}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-dashed border-ink-200 text-ink-300 hover:border-ink-400 hover:text-ink-500 transition-colors">
                        <Facebook className="w-3 h-3" /> Add Facebook
                      </button>
                    )}
                  </div>
                </div>

                {/* ── Profile completion card ── */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-ink text-sm">Profile completion</p>
                    <button onClick={() => switchTab('settings')} className="text-xs text-ink-400 hover:text-ink flex items-center gap-1 transition-colors">
                      Edit profile <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="flex items-center gap-5 mb-4">
                    <CompletionRing pct={pct} size={80} />
                    <div>
                      <p className={`text-sm font-semibold ${scoreColor}`}>
                        {pct >= 80 ? 'Great profile!' : pct >= 50 ? 'Getting there' : 'Just starting'}
                      </p>
                      <p className="text-ink-300 text-xs mt-1 leading-relaxed">
                        {pct >= 80 ? 'You appear in client searches.' : `${incomplete.length} item${incomplete.length !== 1 ? 's' : ''} left to complete`}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {sections.map(s => (
                      <div key={s.key} className="flex items-center gap-2.5">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-emerald-100' : 'border border-ink-200'}`}>
                          {s.done && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                        </div>
                        <span className={`text-xs flex-1 ${s.done ? 'text-ink-300 line-through' : 'text-ink-500'}`}>{s.label}</span>
                        {!s.done && (
                          <button onClick={() => switchTab(s.tab as DashboardTab)} className="text-[10px] text-ink font-medium hover:underline">
                            {s.cta} →
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── Badge progress card ── */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-ink text-sm">Badge progress</p>
                    <PhotographerBadge badge={currentBadge} size="sm" />
                  </div>

                  {/* Ladder */}
                  {[
                    { type: 'newly_joined',  emoji: '🆕', label: 'Newly Joined',  color: 'bg-ink-100',     text: 'text-ink-500' },
                    { type: 'rising_talent', emoji: '🌟', label: 'Rising Talent', color: 'bg-amber-400',   text: 'text-white' },
                    { type: 'verified_pro',  emoji: '🔵', label: 'Verified Pro',  color: 'bg-blue-500',    text: 'text-white' },
                    { type: 'trusted_pro',   emoji: '✅', label: 'Trusted Pro',   color: 'bg-emerald-500', text: 'text-white' },
                  ].map((tier, i) => {
                    const isCurrentOrBelow = (
                      currentBadge.type === 'newly_joined'  ? i <= 0 :
                      currentBadge.type === 'rising_talent' ? i <= 1 :
                      currentBadge.type === 'verified_pro'  ? i <= 2 : true
                    )
                    const isCurrent = tier.type === currentBadge.type ||
                      (currentBadge.type === 'most_reviewed' || currentBadge.type === 'most_booked')
                    return (
                      <div key={tier.type} className="flex items-center gap-3 mb-2 last:mb-0">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-all ${isCurrentOrBelow ? tier.color : 'bg-ink-100'}`}>
                          <span>{tier.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-semibold ${isCurrentOrBelow ? 'text-ink' : 'text-ink-300'}`}>{tier.label}</span>
                            {isCurrent && tier.type === currentBadge.type && (
                              <span className="text-[9px] font-bold uppercase tracking-wide text-white bg-ink px-1.5 py-0.5 rounded-full">Current</span>
                            )}
                          </div>
                        </div>
                        {isCurrentOrBelow && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />}
                      </div>
                    )
                  })}

                  {/* What's needed to reach next badge */}
                  {badgeProgress.next && badgeProgress.remaining.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-ink-50">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-400 mb-2">
                        To reach {badgeProgress.next.replace(/_/g, ' ')}:
                      </p>
                      <div className="space-y-1.5">
                        {badgeProgress.remaining.map((item, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <div className="w-1 h-1 rounded-full bg-ink-300 flex-shrink-0 mt-1.5" />
                            <p className="text-xs text-ink-500 leading-snug">{item}</p>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => switchTab(badgeProgress.next === 'rising_talent' ? 'portfolio' : 'trust')}
                        className="mt-3 text-xs font-semibold text-ink hover:underline flex items-center gap-1"
                      >
                        Get started <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {!badgeProgress.next && (
                    <div className="mt-4 pt-4 border-t border-ink-50 text-center">
                      <p className="text-xs text-emerald-600 font-semibold">You've reached the top tier — great work!</p>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* ── Messages tab ─────────────────────────────────────── */}
            {activeTab === 'messages' && (
              <MessagesTab messages={messages} setMessages={setMessages} groups={groups} setGroups={setGroups} />
            )}

            {/* ── Booking requests tab ──────────────────────────────── */}
            {activeTab === 'requests' && (
              <div className="space-y-5">
                {/* Schedule overview — who's booked on what day/time */}
                <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-ink-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-ink">Schedule overview</h2>
                      <p className="text-xs text-ink-300">See all bookings on the calendar — click any event to jump to the request</p>
                    </div>
                  </div>
                  <BookingCalendar
                    bookings={bookingRequests}
                    bookedDates={bookedDates}
                    setBookedDates={setBookedDates}
                    onSelectBooking={(req) => {
                      setExpandedRequestId(req.id)
                    }}
                    readOnly
                  />
                </div>

                {/* Request list */}
                <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
                      <Inbox className="w-4 h-4 text-ink-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-ink">Booking requests</h2>
                      <p className="text-xs text-ink-300">Approve or reject client requests — pending slots show as tentative on your calendar</p>
                    </div>
                  </div>
                  <BookingRequestsTab
                    requests={bookingRequests}
                    setRequests={setBookingRequests}
                    setBookedDates={setBookedDates}
                    setMessages={setMessages}
                    setActiveTab={switchTab}
                    expandedId={expandedRequestId}
                    setExpandedId={setExpandedRequestId}
                  />
                </div>
              </div>
            )}

            {/* ── Availability tab ──────────────────────────────────── */}
            {activeTab === 'availability' && (
              <div className="space-y-5">
                {/* Booking calendar — Google Calendar-style month/week view */}
                <BookingCalendar
                  bookings={bookingRequests}
                  bookedDates={bookedDates}
                  setBookedDates={setBookedDates}
                  onSelectBooking={(req) => { switchTab('requests') }}
                />

                {/* Time-slot scheduler */}
                <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
                      <Clock className="w-4 h-4 text-ink-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-ink">Time slots</h2>
                      <p className="text-xs text-ink-300">Set specific hours and how many clients per slot</p>
                    </div>
                  </div>
                  <AvailabilityTimeSlots
                    schedule={weeklySchedule}
                    setSchedule={setWeeklySchedule}
                    onSave={async (sched) => {
                      for (const [day, daySchedule] of Object.entries(sched)) {
                        await fetch('/api/photographer/availability', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            day_of_week: Number(day),
                            slots: daySchedule.slots.map(s => ({ start_time: s.start, end_time: s.end, slot_label: s.label })),
                          }),
                        })
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── Packages tab ──────────────────────────────────────── */}
            {activeTab === 'packages' && (
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
                    <Package className="w-4 h-4 text-ink-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink">Project packages</h2>
                    <p className="text-xs text-ink-300">Offer session packages — flat rate or project-based</p>
                  </div>
                </div>
                <ProjectPackages
                  packages={packages}
                  setPackages={setPackages}
                  onPersistCreate={async (pkg) => {
                    const res = await fetch('/api/photographer/packages', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ name: pkg.name, description: pkg.description, billing_type: pkg.billing_type, price: pkg.price || 0, deliverables: pkg.includes, specialty: pkg.specialty ?? null }),
                    })
                    if (!res.ok) return null
                    const data = await res.json()
                    return data.id ?? null
                  }}
                  onPersistUpdate={(pkg) => {
                    fetch('/api/photographer/packages', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: pkg.id, name: pkg.name, description: pkg.description, billing_type: pkg.billing_type, price: pkg.price || 0, deliverables: pkg.includes, is_popular: pkg.popular, specialty: pkg.specialty ?? null }),
                    }).catch(() => {})
                  }}
                  onPersistDelete={(id) => {
                    fetch(`/api/photographer/packages?id=${id}`, { method: 'DELETE' }).catch(() => {})
                  }}
                />
              </div>
            )}

            {/* ── Reviews tab ───────────────────────────────────────── */}
            {activeTab === 'reviews' && (
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
                    <Star className="w-4 h-4 text-ink-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink">Review manager</h2>
                    <p className="text-xs text-ink-300">All reviews are public — reply to any, flag concerns to admin</p>
                  </div>
                </div>
                <ReviewManager />
              </div>
            )}

            {/* ── Network tab ───────────────────────────────────────── */}
            {activeTab === 'network' && (
              <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
                    <Users className="w-4 h-4 text-ink-400" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-ink">Photographer network</h2>
                    <p className="text-xs text-ink-300">Connect with peers, share the group space, arrange cover</p>
                  </div>
                </div>
                <PhotographerConnections
                  onCoverAccepted={dateKey =>
                    setBookedDates(d => ({ ...d, [dateKey]: 'busy' }))
                  }
                  bookedDates={bookedDates}
                />
              </div>
            )}

            {/* ── FAQ tab ───────────────────────────────────────────── */}
            {activeTab === 'faq' && (
              <FaqTab faqs={faqs} setFaqs={setFaqs} />
            )}

            {/* ── Portfolio tab ─────────────────────────────────────── */}
            {activeTab === 'portfolio' && (() => {
              const openAlbum = openAlbumId ? portfolioAlbums.find(a => a.id === openAlbumId) ?? null : null
              const totalP = totalPortfolioPhotos(portfolioAlbums) + standalonePhotos.length
              const totalV = totalPortfolioVideos(portfolioAlbums) + standaloneVideos.length
              const Spinner = () => <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/></svg>
              return (
                <div className="space-y-6">
                  {/* Hidden inputs */}
                  <input ref={portfolioPhotoInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handlePortfolioPhotoFiles(e.target.files)} />
                  <input ref={portfolioVideoInputRef} type="file" accept="video/*" className="hidden"
                    onChange={e => handlePortfolioVideoFile(e.target.files?.[0] ?? null)} />
                  <input ref={standalonePhotoInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handleStandalonePhotoFiles(e.target.files)} />
                  <input ref={standaloneVideoInputRef} type="file" accept="video/*" className="hidden"
                    onChange={e => handleStandaloneVideoFile(e.target.files?.[0] ?? null)} />

                  {/* Album modal */}
                  {albumModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <h3 className="font-semibold text-ink text-base mb-4">{albumModal.mode === 'create' ? 'New album' : 'Rename album'}</h3>
                        <input type="text" value={albumDraft} onChange={e => setAlbumDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitPortfolioAlbumModal() }}
                          placeholder="Album name…" autoFocus maxLength={MAX_ALBUM_NAME}
                          className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all mb-4" />
                        <div className="flex gap-2">
                          <button onClick={commitPortfolioAlbumModal} disabled={!albumDraft.trim()}
                            className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-40">
                            {albumModal.mode === 'create' ? 'Create' : 'Save'}
                          </button>
                          <button onClick={() => setAlbumModal(null)}
                            className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Photo preview lightbox */}
                  {previewLightbox && (
                    <DashboardLightbox
                      photos={previewLightbox.photos}
                      startIdx={previewLightbox.idx}
                      onClose={() => setPreviewLightbox(null)}
                    />
                  )}

                  {/* Video preview modal */}
                  {previewVideo && (
                    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setPreviewVideo(null)}>
                      <div className="w-full max-w-4xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-3">
                          {previewVideo.title ? <p className="text-white text-sm font-medium">{previewVideo.title}</p> : <span />}
                          <button onClick={() => setPreviewVideo(null)} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center ml-auto">
                            <X className="w-4 h-4 text-white" />
                          </button>
                        </div>
                        <video src={previewVideo.src} controls autoPlay className="w-full rounded-2xl bg-black" style={{ maxHeight: 'calc(100vh - 120px)' }} />
                      </div>
                    </div>
                  )}

                  {/* Photo details modal — caption, tags, shoot date */}
                  {editingCaption && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
                          <p className="text-sm font-semibold text-ink">Edit photo details</p>
                          <button onClick={() => setEditingCaption(null)} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
                          {/* Caption */}
                          <div>
                            <label className="block text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Caption</label>
                            <input type="text" value={captionDraft} onChange={e => setCaptionDraft(e.target.value)}
                              placeholder="Describe this photo…" maxLength={MAX_CAPTION}
                              className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all" />
                            <p className="text-xs text-ink-200 mt-1 text-right">{captionDraft.length}/{MAX_CAPTION}</p>
                          </div>

                          {/* Tags */}
                          <div>
                            <label className="block text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">Tags</label>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {PHOTO_TAG_OPTIONS.map(tag => {
                                const active = tagsDraft.includes(tag.toLowerCase())
                                return (
                                  <button key={tag} type="button"
                                    onClick={() => setTagsDraft(prev => active ? prev.filter(t => t !== tag.toLowerCase()) : [...prev, tag.toLowerCase()])}
                                    className={`text-xs px-2.5 py-1 rounded-full border transition-all ${active ? 'bg-ink text-white border-ink' : 'border-ink-100 text-ink-500 hover:border-ink-300'}`}>
                                    {tag}
                                  </button>
                                )
                              })}
                            </div>
                            <input type="text" value={customTagDraft} onChange={e => setCustomTagDraft(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && customTagDraft.trim()) { setTagsDraft(prev => [...prev, customTagDraft.trim().toLowerCase()]); setCustomTagDraft('') } }}
                              placeholder="Custom tag (press Enter to add)…"
                              className="w-full border border-ink-100 rounded-xl px-3.5 py-2 text-sm text-ink outline-none focus:border-ink transition-all" />
                            {tagsDraft.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {tagsDraft.map(t => (
                                  <span key={t} className="flex items-center gap-1 text-xs bg-ink text-white px-2.5 py-1 rounded-full">
                                    #{t}
                                    <button onClick={() => setTagsDraft(prev => prev.filter(x => x !== t))} className="hover:text-ink-200"><X className="w-2.5 h-2.5" /></button>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Shoot date */}
                          <div>
                            <label className="block text-xs font-semibold text-ink-400 uppercase tracking-widest mb-2">When was this taken?</label>
                            <div className="flex gap-2">
                              <select value={takenMonthDraft} onChange={e => setTakenMonthDraft(e.target.value)}
                                className="flex-1 border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all bg-white">
                                <option value="">Month</option>
                                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                                  <option key={m} value={String(i + 1)}>{m}</option>
                                ))}
                              </select>
                              <select value={takenYearDraft} onChange={e => setTakenYearDraft(e.target.value)}
                                className="flex-1 border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all bg-white">
                                <option value="">Year</option>
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                  <option key={y} value={String(y)}>{y}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className="px-5 py-4 border-t border-ink-50 flex gap-2">
                          <button onClick={savePortfolioCaption} disabled={savingCaption}
                            className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50">
                            {savingCaption ? 'Saving…' : 'Save details'}
                          </button>
                          <button onClick={() => setEditingCaption(null)}
                            className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video edit modal — title, tags, month, year */}
                  {editingVideoTitle && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl w-full max-w-sm p-5 space-y-4" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <p className="text-sm font-semibold text-ink">Edit video details</p>

                        {/* Title */}
                        <div>
                          <label className="text-xs font-medium text-ink-400 mb-1 block">Title</label>
                          <input type="text" value={videoTitleDraft} onChange={e => setVideoTitleDraft(e.target.value)}
                            placeholder="Add a title…" autoFocus maxLength={120}
                            className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all" />
                        </div>

                        {/* Tags */}
                        <div>
                          <label className="text-xs font-medium text-ink-400 mb-1.5 block">Tags</label>
                          <div className="flex flex-wrap gap-1.5">
                            {PHOTO_TAG_OPTIONS.map(tag => {
                              const selected = videoTagsDraft.includes(tag)
                              return (
                                <button key={tag} type="button"
                                  onClick={() => setVideoTagsDraft(prev => selected ? prev.filter(t => t !== tag) : prev.length < 10 ? [...prev, tag] : prev)}
                                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-all ${selected ? 'bg-ink text-white border-ink' : 'bg-white text-ink-500 border-ink-100 hover:border-ink-300'}`}>
                                  {tag}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Month + Year */}
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs font-medium text-ink-400 mb-1 block">Month filmed</label>
                            <select value={videoMonthDraft} onChange={e => setVideoMonthDraft(e.target.value)}
                              className="w-full border border-ink-100 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-ink bg-white">
                              <option value="">Month</option>
                              {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                                <option key={m} value={String(i + 1)}>{m}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-medium text-ink-400 mb-1 block">Year filmed</label>
                            <select value={videoYearDraft} onChange={e => setVideoYearDraft(e.target.value)}
                              className="w-full border border-ink-100 rounded-xl px-3 py-2 text-sm text-ink outline-none focus:border-ink bg-white">
                              <option value="">Year</option>
                              {Array.from({ length: new Date().getFullYear() - 1999 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={String(y)}>{y}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          <button onClick={saveVideoTitle} disabled={savingVideoTitle}
                            className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50">
                            {savingVideoTitle ? 'Saving…' : 'Save'}
                          </button>
                          <button onClick={() => setEditingVideoTitle(null)}
                            className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {portfolioLoading ? (
                    <div className="flex items-center justify-center py-16">
                      <svg className="w-6 h-6 animate-spin text-ink-300" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                      </svg>
                    </div>
                  ) : openAlbum ? (
                    /* ── Inside an album ── */
                    <>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setOpenAlbumId(null)} className="text-ink-400 hover:text-ink text-sm transition-colors">Portfolio</button>
                        <ChevronRight className="w-3 h-3 text-ink-300" />
                        <span className="text-sm font-medium text-ink">{openAlbum.title}</span>
                      </div>

                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="font-semibold text-ink text-lg mb-1">{openAlbum.title}</h2>
                          <p className="text-ink-300 text-sm">
                            {openAlbum.photos.length} photo{openAlbum.photos.length !== 1 ? 's' : ''}
                            {openAlbum.videos.length > 0 && ` · ${openAlbum.videos.length} video${openAlbum.videos.length !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {totalV < MAX_VIDEOS_TOTAL && openAlbum.videos.length < PLATFORM_CONFIG.max_videos_per_album && (
                            <button onClick={() => portfolioVideoInputRef.current?.click()} disabled={videoUploading}
                              className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50">
                              {videoUploading ? <><Spinner /> Uploading…</> : <><Video className="w-3.5 h-3.5" /> Add video</>}
                            </button>
                          )}
                          {totalP < MAX_PHOTOS_TOTAL && (
                            <button onClick={() => portfolioPhotoInputRef.current?.click()} disabled={portfolioUploading}
                              className="flex items-center gap-1.5 bg-ink text-white text-xs font-semibold px-3 py-2 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50">
                              {portfolioUploading ? <><Spinner /> Uploading…</> : <><ImagePlus className="w-3.5 h-3.5" /> Add photos</>}
                            </button>
                          )}
                        </div>
                      </div>

                      {portfolioUploadError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />{portfolioUploadError}
                          <button onClick={() => setPortfolioUploadError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}

                      {/* Upload guidelines reminder */}
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-amber-900">Photography work only</p>
                          <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                            Upload real photos you shot — no flyers, text graphics, screenshots, or stock images.
                            {' '}<a href="/guidelines" target="_blank" className="underline underline-offset-2 font-medium hover:text-amber-900 transition-colors">View full guidelines →</a>
                          </p>
                        </div>
                      </div>

                      {/* Photos grid */}
                      {openAlbum.photos.length === 0 ? (
                        <div onClick={() => portfolioPhotoInputRef.current?.click()}
                          className="border-2 border-dashed border-ink-200 rounded-2xl p-12 text-center cursor-pointer hover:border-ink-400 hover:bg-ink-50 transition-all">
                          <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ImagePlus className="w-6 h-6 text-ink-400" />
                          </div>
                          <p className="font-semibold text-ink text-sm mb-1">Click to upload photos</p>
                          <p className="text-ink-300 text-xs">JPG, PNG, WEBP · max {MAX_PHOTO_MB} MB per photo</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-ink-300 flex items-center gap-1.5">
                            <GripVertical className="w-3.5 h-3.5" /> Drag to reorder · first photo is the album cover
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {openAlbum.photos.map((photo, idx) => (
                              <div key={photo.id}
                                draggable
                                onDragStart={() => handlePhotoDragStart(idx)}
                                onDragOver={e => { e.preventDefault(); setPhotoDragOver(idx) }}
                                onDragLeave={() => setPhotoDragOver(null)}
                                onDrop={() => handlePhotoDrop(openAlbum.id, idx)}
                                onDragEnd={() => { photoDragIdx.current = null; setPhotoDragOver(null) }}
                                className={`relative bg-white rounded-2xl overflow-hidden group cursor-grab active:cursor-grabbing transition-all ${photo.isCover ? 'ring-2 ring-ink' : ''} ${photoDragOver === idx ? 'ring-2 ring-blue-400 scale-[1.02]' : ''}`}
                                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                                <div className="relative aspect-square" onClick={() => setPortfolioCover(openAlbum.id, photo.id)}>
                                  <img src={photo.src} alt={photo.caption || 'Portfolio photo'} className="w-full h-full object-cover pointer-events-none" />
                                  {photo.isCover && (
                                    <div className="absolute top-2 left-2 bg-ink text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <Star className="w-2.5 h-2.5" /> Cover
                                    </div>
                                  )}
                                  {!photo.isCover && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                      <span className="text-white text-xs font-semibold bg-black/60 px-3 py-1.5 rounded-full">Set as cover</span>
                                    </div>
                                  )}
                                  <button onClick={e => { e.stopPropagation(); setPreviewLightbox({ photos: openAlbum.photos, idx }) }}
                                    className="absolute bottom-2 left-2 w-7 h-7 bg-black/60 hover:bg-black/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Eye className="w-3.5 h-3.5 text-white" />
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); removePortfolioPhoto(openAlbum.id, photo.id) }}
                                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-3.5 h-3.5 text-white" />
                                  </button>
                                </div>
                                <div className="p-3">
                                  <button onClick={e => { e.stopPropagation(); setEditingCaption({ albumId: openAlbum.id, photoId: photo.id }); setCaptionDraft(photo.caption); setTagsDraft(photo.tags ?? []); setCustomTagDraft(''); setTakenMonthDraft(photo.photo_taken_month ? String(photo.photo_taken_month) : ''); setTakenYearDraft(photo.photo_taken_year ? String(photo.photo_taken_year) : '') }} className="w-full text-left">
                                    {photo.caption ? (
                                      <p className="text-xs text-ink-500 line-clamp-2 hover:text-ink transition-colors">{photo.caption}</p>
                                    ) : (
                                      <p className="text-xs text-ink-200 italic hover:text-ink-400 transition-colors">Add caption…</p>
                                    )}
                                    {savedCaption === photo.id && <span className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1"><CheckCircle2 className="w-2.5 h-2.5" /> Saved</span>}
                                  </button>
                                </div>
                              </div>
                            ))}
                            {totalP < MAX_PHOTOS_TOTAL && (
                              <button onClick={() => portfolioPhotoInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-ink-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-ink-400 hover:bg-ink-50 transition-all">
                                <Plus className="w-6 h-6 text-ink-300" />
                                <span className="text-xs text-ink-300">Add photos</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {/* Videos in album */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[11px] font-semibold text-ink-300 uppercase tracking-wide">Videos in album ({openAlbum.videos.length} / {PLATFORM_CONFIG.max_videos_per_album})</p>
                          {totalV < MAX_VIDEOS_TOTAL && openAlbum.videos.length < PLATFORM_CONFIG.max_videos_per_album && (
                            <button onClick={() => portfolioVideoInputRef.current?.click()} disabled={videoUploading}
                              className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 border border-purple-200 px-3 py-1.5 rounded-lg hover:bg-purple-50 transition-colors disabled:opacity-50">
                              {videoUploading ? 'Uploading…' : <><Video className="w-3 h-3" /> Add video</>}
                            </button>
                          )}
                        </div>
                        {openAlbum.videos.length === 0 ? (
                          <div onClick={() => portfolioVideoInputRef.current?.click()}
                            className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                            <Video className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                            <p className="text-sm font-medium text-ink-400">Click to add a video to this album</p>
                            <p className="text-xs text-ink-300 mt-1">MP4, MOV · max {PLATFORM_CONFIG.max_video_bytes / 1024 / 1024} MB</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {openAlbum.videos.map(video => (
                              <div key={video.id} className="relative bg-black rounded-2xl overflow-hidden group"
                                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                                <div className="relative aspect-video">
                                  {video.src ? (
                                    <video src={video.src} className="w-full h-full object-cover" muted preload="metadata" />
                                  ) : (
                                    <div className="w-full h-full bg-ink-800 flex items-center justify-center"><Video className="w-8 h-8 text-ink-400" /></div>
                                  )}
                                  <button onClick={() => setPreviewVideo({ src: video.src, title: video.title || '' })}
                                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors w-full">
                                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <svg className="w-4 h-4 text-ink ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); removePortfolioVideo(openAlbum.id, video.id) }}
                                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-3.5 h-3.5 text-white" />
                                  </button>
                                </div>
                                <button onClick={() => { setEditingVideoTitle({ videoId: video.id, isStandalone: false, albumId: openAlbum.id }); setVideoTitleDraft(video.title || ''); setVideoTagsDraft(video.tags ?? []); setVideoMonthDraft(video.video_taken_month ? String(video.video_taken_month) : ''); setVideoYearDraft(video.video_taken_year ? String(video.video_taken_year) : '') }}
                                  className="w-full text-left px-3 py-2">
                                  {video.title ? (
                                    <p className="text-xs text-ink-300 truncate hover:text-white transition-colors">{video.title}</p>
                                  ) : (
                                    <p className="text-xs text-ink-600 italic hover:text-ink-300 transition-colors">Add title…</p>
                                  )}
                                  {savedVideoTitle === video.id && <span className="flex items-center gap-1 text-[9px] text-emerald-400"><CheckCircle2 className="w-2.5 h-2.5" /> Saved</span>}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <button onClick={() => setOpenAlbumId(null)} className="flex items-center gap-2 text-sm text-ink-400 hover:text-ink transition-colors">
                        <ChevronLeft className="w-4 h-4" /> Back to portfolio
                      </button>
                    </>
                  ) : (
                    /* ── Main portfolio view: 3 sections ── */
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <h2 className="font-semibold text-ink text-lg mb-0.5">Portfolio</h2>
                          <p className="text-ink-300 text-xs">{totalP} / {MAX_PHOTOS_TOTAL} photos · {totalV} / {MAX_VIDEOS_TOTAL} videos · {portfolioAlbums.length} / {MAX_ALBUMS} albums</p>
                        </div>
                      </div>

                      {portfolioUploadError && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" />{portfolioUploadError}
                          <button onClick={() => setPortfolioUploadError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
                        </div>
                      )}

                      {/* Upload guidelines reminder */}
                      <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-amber-900">Photography work only</p>
                          <p className="text-xs text-amber-700 leading-relaxed mt-0.5">
                            Upload real photos you shot — no flyers, text graphics, screenshots, or stock images.
                            {' '}<a href="/guidelines" target="_blank" className="underline underline-offset-2 font-medium hover:text-amber-900 transition-colors">View full guidelines →</a>
                          </p>
                        </div>
                      </div>

                      {/* ── Section 1: Photos ── */}
                      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-ink-50 rounded-xl flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-ink-400" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-ink">Photos</p>
                              <p className="text-xs text-ink-300">{standalonePhotos.length} standalone · upload individually</p>
                            </div>
                          </div>
                          {totalP < MAX_PHOTOS_TOTAL && (
                            <button onClick={() => standalonePhotoInputRef.current?.click()} disabled={standaloneUploading}
                              className="flex items-center gap-1.5 bg-ink text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50">
                              {standaloneUploading ? <><Spinner /> Uploading…</> : <><ImagePlus className="w-3.5 h-3.5" /> Upload photos</>}
                            </button>
                          )}
                        </div>
                        {standalonePhotos.length === 0 ? (
                          <div onClick={() => standalonePhotoInputRef.current?.click()}
                            className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center cursor-pointer hover:border-ink-400 hover:bg-ink-50 transition-all">
                            <ImagePlus className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                            <p className="text-sm font-medium text-ink-400">Click to upload standalone photos</p>
                            <p className="text-xs text-ink-300 mt-1">These appear directly in your portfolio, not inside an album</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                            {standalonePhotos.map((photo, idx) => (
                              <div key={photo.id} className="relative group rounded-xl overflow-hidden bg-ink-100">
                                <div className="aspect-square overflow-hidden cursor-pointer" onClick={() => setPreviewLightbox({ photos: standalonePhotos, idx })}>
                                  <img src={photo.src} alt={photo.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />
                                </div>
                                <button onClick={() => removeStandalonePhoto(photo.id)}
                                  className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                  <X className="w-3 h-3 text-white" />
                                </button>
                                <button onClick={() => { setEditingCaption({ albumId: null, photoId: photo.id }); setCaptionDraft(photo.caption); setTagsDraft(photo.tags ?? []); setCustomTagDraft(''); setTakenMonthDraft(photo.photo_taken_month ? String(photo.photo_taken_month) : ''); setTakenYearDraft(photo.photo_taken_year ? String(photo.photo_taken_year) : '') }}
                                  className="w-full text-left px-1.5 py-1">
                                  {photo.caption ? (
                                    <p className="text-[10px] text-ink-500 line-clamp-1 hover:text-ink transition-colors">{photo.caption}</p>
                                  ) : (
                                    <p className="text-[10px] text-ink-200 italic hover:text-ink-400 transition-colors">Add caption…</p>
                                  )}
                                  {savedCaption === photo.id && <span className="flex items-center gap-1 text-[9px] text-emerald-600"><CheckCircle2 className="w-2.5 h-2.5" /> Saved</span>}
                                </button>
                              </div>
                            ))}
                            {totalP < MAX_PHOTOS_TOTAL && (
                              <button onClick={() => standalonePhotoInputRef.current?.click()}
                                className="aspect-square border-2 border-dashed border-ink-200 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-ink-400 hover:bg-ink-50 transition-all">
                                <Plus className="w-5 h-5 text-ink-300" />
                                <span className="text-[10px] text-ink-300">Add more</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Section 2: Videos ── */}
                      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center">
                              <Video className="w-4 h-4 text-purple-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-ink">Videos</p>
                              <p className="text-xs text-ink-300">{standaloneVideos.length} / {MAX_VIDEOS_TOTAL} standalone videos</p>
                            </div>
                          </div>
                          {totalV < MAX_VIDEOS_TOTAL && (
                            <button onClick={() => standaloneVideoInputRef.current?.click()} disabled={standaloneVideoUploading}
                              className="flex items-center gap-1.5 bg-purple-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50">
                              {standaloneVideoUploading ? <><Spinner /> Uploading…</> : <><Video className="w-3.5 h-3.5" /> Upload video</>}
                            </button>
                          )}
                        </div>
                        {standaloneVideos.length === 0 ? (
                          <div onClick={() => standaloneVideoInputRef.current?.click()}
                            className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center cursor-pointer hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                            <Video className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                            <p className="text-sm font-medium text-ink-400">Click to upload a standalone video</p>
                            <p className="text-xs text-ink-300 mt-1">MP4, MOV · max {PLATFORM_CONFIG.max_video_bytes / 1024 / 1024} MB</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {standaloneVideos.map(video => (
                              <div key={video.id} className="relative bg-black rounded-2xl overflow-hidden group"
                                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                                <div className="relative aspect-video">
                                  {video.src ? (
                                    <video src={video.src} className="w-full h-full object-cover" muted preload="metadata" />
                                  ) : (
                                    <div className="w-full h-full bg-ink-800 flex items-center justify-center"><Video className="w-8 h-8 text-ink-400" /></div>
                                  )}
                                  <button onClick={() => setPreviewVideo({ src: video.src, title: video.title || '' })}
                                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors w-full">
                                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center group-hover:scale-110 transition-transform">
                                      <svg className="w-4 h-4 text-ink ml-0.5" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                                    </div>
                                  </button>
                                  <button onClick={e => { e.stopPropagation(); removeStandaloneVideo(video.id) }}
                                    className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-3.5 h-3.5 text-white" />
                                  </button>
                                </div>
                                <button onClick={() => { setEditingVideoTitle({ videoId: video.id, isStandalone: true }); setVideoTitleDraft(video.title || ''); setVideoTagsDraft(video.tags ?? []); setVideoMonthDraft(video.video_taken_month ? String(video.video_taken_month) : ''); setVideoYearDraft(video.video_taken_year ? String(video.video_taken_year) : '') }}
                                  className="w-full text-left px-3 py-2">
                                  {video.title ? (
                                    <p className="text-xs text-ink-300 truncate hover:text-white transition-colors">{video.title}</p>
                                  ) : (
                                    <p className="text-xs text-ink-600 italic hover:text-ink-300 transition-colors">Add title…</p>
                                  )}
                                  {savedVideoTitle === video.id && <span className="flex items-center gap-1 text-[9px] text-emerald-400"><CheckCircle2 className="w-2.5 h-2.5" /> Saved</span>}
                                </button>
                              </div>
                            ))}
                            {totalV < MAX_VIDEOS_TOTAL && (
                              <button onClick={() => standaloneVideoInputRef.current?.click()}
                                className="aspect-video border-2 border-dashed border-ink-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-purple-300 hover:bg-purple-50/20 transition-all">
                                <Plus className="w-5 h-5 text-ink-300" />
                                <span className="text-xs text-ink-300">Add video</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Section 3: Albums ── */}
                      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center">
                              <FolderOpen className="w-4 h-4 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-ink">Albums</p>
                              <p className="text-xs text-ink-300">{portfolioAlbums.length} / {MAX_ALBUMS} collections · open to add photos &amp; videos</p>
                            </div>
                          </div>
                          {portfolioAlbums.length < MAX_ALBUMS && (
                            <button onClick={() => { setAlbumDraft(''); setAlbumModal({ mode: 'create' }) }}
                              className="flex items-center gap-1.5 bg-amber-500 text-white text-xs font-semibold px-3.5 py-2 rounded-xl hover:bg-amber-600 transition-colors">
                              <FolderPlus className="w-3.5 h-3.5" /> New album
                            </button>
                          )}
                        </div>
                        {portfolioAlbums.length === 0 ? (
                          <div onClick={() => { setAlbumDraft(''); setAlbumModal({ mode: 'create' }) }}
                            className="border-2 border-dashed border-ink-200 rounded-xl p-8 text-center cursor-pointer hover:border-amber-300 hover:bg-amber-50/30 transition-all">
                            <FolderPlus className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                            <p className="text-sm font-medium text-ink-400">Create an album to group photos &amp; videos</p>
                            <p className="text-xs text-ink-300 mt-1">Albums appear as collection tiles on your public profile</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {portfolioAlbums.map(album => {
                              const cover = album.photos[0]
                              return (
                                <div key={album.id} className="bg-ink-50 rounded-2xl overflow-hidden group cursor-pointer"
                                  style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                                  <div className="relative aspect-video bg-ink-100" onClick={() => setOpenAlbumId(album.id)}>
                                    {cover ? (
                                      <img src={cover.src} alt={album.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-8 h-8 text-ink-200" /></div>
                                    )}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-3">
                                      <p className="text-white text-sm font-semibold leading-tight">{album.title}</p>
                                      <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-white/60 text-[10px] flex items-center gap-1"><ImageIcon className="w-2.5 h-2.5" />{album.photos.length}</span>
                                        {album.videos.length > 0 && <span className="text-white/60 text-[10px] flex items-center gap-1"><Video className="w-2.5 h-2.5" />{album.videos.length}</span>}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="px-3 py-2 flex items-center justify-between">
                                    <button onClick={() => setOpenAlbumId(album.id)} className="text-xs text-ink-400 hover:text-ink transition-colors">Open to upload →</button>
                                    <div className="flex items-center gap-1">
                                      <button onClick={e => { e.stopPropagation(); setAlbumDraft(album.title); setAlbumModal({ mode: 'rename', albumId: album.id }) }}
                                        className="p-1.5 rounded-lg hover:bg-ink-100 text-ink-400 hover:text-ink transition-colors">
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button onClick={e => { e.stopPropagation(); deletePortfolioAlbum(album.id) }}
                                        className="p-1.5 rounded-lg hover:bg-red-50 text-ink-400 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                            {portfolioAlbums.length < MAX_ALBUMS && (
                              <button onClick={() => { setAlbumDraft(''); setAlbumModal({ mode: 'create' }) }}
                                className="aspect-video border-2 border-dashed border-ink-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-300 hover:bg-amber-50/30 transition-all">
                                <FolderPlus className="w-7 h-7 text-ink-300" />
                                <span className="text-sm text-ink-300 font-medium">New album</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })()}

            {/* ── Profile settings tab ─────────────────────────────── */}
            {activeTab === 'settings' && (
              <ProfileSettingsTab profile={profile} setProfile={setProfile} />
            )}

            {/* ── Trust Score tab ──────────────────────────────────────── */}
            {activeTab === 'trust' && (
              <TrustScoreTab
                trustData={trustData}
                loading={trustLoading}
                syncing={trustSyncing}
                notification={trustNotification}
                onDismissNotification={() => setTrustNotification(null)}
                onSync={() => {
                  setTrustSyncing(true)
                  fetch('/api/photographer/trust', { method: 'POST' })
                    .then(r => r.ok ? r.json() : null)
                    .then(d => {
                      if (d?.trust_score !== undefined) {
                        setTrustNotification({ type: 'success', msg: `Trust score updated to ${d.trust_score}` })
                        // Reload breakdown
                        return fetch('/api/photographer/trust').then(r => r.ok ? r.json() : null)
                      }
                    })
                    .then(d => { if (d) setTrustData(d) })
                    .catch(() => setTrustNotification({ type: 'error', msg: 'Sync failed — try again' }))
                    .finally(() => setTrustSyncing(false))
                }}
                onDisconnect={async (platform: string) => {
                  await fetch(`/api/oauth/${platform}`, { method: 'DELETE' })
                  const d = await fetch('/api/photographer/trust').then(r => r.ok ? r.json() : null)
                  if (d) setTrustData(d)
                }}
              />
            )}
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────── */}
          <div className="space-y-5">

            {/* Profile card */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <div className="flex flex-col items-center text-center mb-4">
                {profile.avatarUrl ? (
                  <img src={profile.avatarUrl} alt="Profile" className="w-16 h-16 rounded-2xl object-cover mb-3" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-ink flex items-center justify-center mb-3">
                    <span className="text-white text-2xl font-bold">
                      {profile.displayName ? profile.displayName[0].toUpperCase() : 'P'}
                    </span>
                  </div>
                )}
                <p className="font-semibold text-ink text-sm">{profile.displayName || 'Your name'}</p>
                {profile.area && <p className="text-ink-300 text-xs flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{profile.area}</p>}
                {profile.specialties.length > 0 && (
                  <p className="text-ink-400 text-xs mt-1">{profile.specialties.slice(0, 2).join(' · ')}{profile.specialties.length > 2 ? ' +more' : ''}</p>
                )}
              </div>
              <Link
                href="/photographers/your-profile"
                className="w-full flex items-center justify-center gap-2 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 transition-colors text-ink-500 hover:text-ink"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View public profile
              </Link>
            </div>

            {/* Completion score */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <p className="font-semibold text-ink text-sm mb-4">Profile completion</p>
              <div className="flex items-center gap-4 mb-4">
                <CompletionRing pct={pct} size={80} />
                <div>
                  <p className={`text-sm font-semibold ${scoreColor}`}>
                    {pct >= 80 ? 'Great profile!' : pct >= 50 ? 'Getting there' : 'Just starting'}
                  </p>
                  <p className="text-ink-300 text-xs mt-1">
                    {pct >= 80 ? 'Appearing in searches' : `${incomplete.length} items left`}
                  </p>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                {sections.map(s => (
                  <div key={s.key} className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 ${s.done ? 'bg-emerald-100' : 'border border-ink-200'}`}>
                      {s.done && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
                    </div>
                    <span className={`text-xs flex-1 ${s.done ? 'text-ink-300 line-through' : 'text-ink-500'}`}>{s.label}</span>
                    {!s.done && (
                      <button onClick={() => switchTab(s.tab as DashboardTab)} className="text-[10px] text-ink font-medium hover:underline flex-shrink-0">
                        Add →
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {incomplete.length > 0 && (
                <button
                  onClick={() => switchTab(incomplete[0].tab as DashboardTab)}
                  className="w-full bg-ink hover:bg-ink-800 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Complete profile <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
              <p className="font-semibold text-ink text-sm mb-3">Quick actions</p>
              <div className="space-y-1">
                {[
                  { label: 'Upload portfolio', onClick: () => switchTab('portfolio'), href: null, icon: ImagePlus, badge: null },
                  { label: pendingBookings > 0 ? `Booking requests (${pendingBookings})` : 'Booking requests', onClick: () => switchTab('requests'), href: null, icon: Inbox, badge: pendingBookings > 0 ? pendingBookings : null },
                  { label: 'Set availability', onClick: () => switchTab('availability'), href: null, icon: Calendar, badge: null },
                  { label: 'Packages & pricing', onClick: () => switchTab('packages'), href: null, icon: Package, badge: null },
                  { label: 'Manage reviews', onClick: () => switchTab('reviews'), href: null, icon: Star, badge: null },
                  { label: 'Photographer network', onClick: () => switchTab('network'), href: null, icon: Users, badge: null },
                  { label: 'Profile settings', onClick: () => switchTab('settings'), href: null, icon: Settings, badge: null },
                  { label: 'View public profile', onClick: () => {}, href: '/photographers/your-profile', icon: Eye, badge: null },
                ].map(action => {
                  const Icon = action.icon
                  const inner = (
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-ink-50 transition-colors group w-full text-left">
                      <div className="w-7 h-7 bg-ink-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-ink-100 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-ink-400" />
                      </div>
                      <span className="text-sm text-ink-500 group-hover:text-ink transition-colors flex-1">{action.label}</span>
                      {action.badge ? (
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{action.badge}</span>
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-ink-200 group-hover:text-ink-400 transition-colors" />
                      )}
                    </div>
                  )
                  return action.href ? (
                    <Link key={action.label} href={action.href}>{inner}</Link>
                  ) : (
                    <button key={action.label} onClick={action.onClick} className="w-full">{inner}</button>
                  )
                })}
              </div>
            </div>

            {/* Tips card */}
            {pct < 80 && incomplete[0] && (
              <div className="bg-ink rounded-2xl p-5 relative overflow-hidden">
                <div className="absolute inset-0 grid-pattern pointer-events-none opacity-50" />
                <div className="relative z-10">
                  <AlertCircle className="w-5 h-5 text-ink-300 mb-3" />
                  <p className="text-white font-semibold text-sm mb-2">{incomplete[0].cta}</p>
                  <p className="text-ink-400 text-xs leading-relaxed mb-3">
                    Profiles with a connected trust score get 3× more enquiries from clients.
                  </p>
                  <button
                    onClick={() => switchTab(incomplete[0].tab as DashboardTab)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-ink-200 transition-colors"
                  >
                    Do it now <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Fix: setBio must be inside the component ─────────────────────────────────
// The ProfileSettingsTab uses local state, so bio setter is correctly scoped there.

export default function PhotographerDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-ink-50 flex items-center justify-center">
        <div className="animate-pulse text-ink-300 text-sm">Loading dashboard…</div>
      </div>
    }>
      <PhotographerDashboardInner />
    </Suspense>
  )
}
