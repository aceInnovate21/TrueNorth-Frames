'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useRef, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Bell, Camera, CheckCircle2, ChevronRight, Globe, Instagram,
  MapPin, MessageSquare, Star, User, Zap, ArrowRight,
  Eye, AlertCircle, Shield, ImagePlus, X, Send, Calendar,
  Clock, ChevronLeft, DollarSign, Save, Settings, ExternalLink,
  Package, Users, HelpCircle, GripVertical, ChevronDown, ChevronUp,
  ChevronsUp, ChevronsDown,
  Plus, Pencil, Trash2, Paperclip, FileText, Play,
  FolderPlus, FolderOpen, Video, Image as ImageIcon,
} from 'lucide-react'
import { AvailabilityTimeSlots, type WeeklySchedule } from '@/components/availability-time-slots'
import { ProjectPackages, type ProjectPackage } from '@/components/project-packages'
import { ReviewManager } from '@/components/review-manager'
import { PhotographerConnections, GroupChat, type Group, type GroupMessage } from '@/components/photographer-connections'
import { Inbox } from 'lucide-react'
import { supabase } from '@/lib/supabase'

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

interface PortfolioPhoto {
  id: string; src: string; caption: string; isCover: boolean; storage_asset_id: string
}
interface PortfolioVideo {
  id: string; src: string; title: string; duration_seconds: number | null; storage_asset_id: string
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

type DashboardTab = 'overview' | 'portfolio' | 'messages' | 'requests' | 'availability' | 'packages' | 'reviews' | 'network' | 'faq' | 'settings'

type BookingRequestStatus = 'pending' | 'approved' | 'declined' | 'cancelled' | 'cancellation_pending' | 'completed'

type BookingBillingType = 'hourly' | 'package'

interface BookingRequest {
  id: string
  clientName: string
  clientInitials: string
  clientBg: string
  date: string          // display label e.g. "May 24, 2026"
  dateKey: string       // "2026-4-24" — matches availability key
  timeSlot: string      // "10:00 AM – 12:00 PM"
  note: string
  billingType: BookingBillingType
  billingDetail: string
  status: BookingRequestStatus
  photographerNote: string
  submittedAt: string
}


// ─── BookingRequestsTab ───────────────────────────────────────────────────────

function BookingRequestsTab({
  requests,
  setRequests,
  setBookedDates,
  setMessages,
  setActiveTab,
}: {
  requests: BookingRequest[]
  setRequests: React.Dispatch<React.SetStateAction<BookingRequest[]>>
  setBookedDates: React.Dispatch<React.SetStateAction<Record<string, DayStatus>>>
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  setActiveTab: React.Dispatch<React.SetStateAction<DashboardTab>>
}) {
  const [filter, setFilter] = useState<BookingRequestStatus | 'all'>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})

  const pendingCount = requests.filter(r => r.status === 'pending').length

  const visible = filter === 'all' ? requests : requests.filter(r => r.status === filter)

  function approve(id: string) {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      setBookedDates(d => ({ ...d, [r.dateKey]: 'busy' }))
      const note = noteDraft[id] ?? r.photographerNote
      const confirmationText = note
        ? `Hi ${r.clientName.split(' ')[0]}! Your booking for ${r.date} (${r.timeSlot}) is confirmed. ${note}`
        : `Hi ${r.clientName.split(' ')[0]}! Your booking for ${r.date} (${r.timeSlot}) is confirmed. Looking forward to working with you!`
      setMessages(msgs => {
        const exists = msgs.find(m => m.from === r.clientName)
        if (exists) {
          return msgs.map(m => m.from === r.clientName
            ? { ...m, unread: false, preview: confirmationText, thread: [...m.thread, { id: Date.now(), from: 'me' as const, text: confirmationText, time: 'Just now' }] }
            : m)
        }
        return [...msgs, {
          id: String(Date.now()), from: r.clientName, initials: r.clientInitials, bg: r.clientBg,
          preview: confirmationText, time: 'Just now', unread: false,
          thread: [{ id: Date.now() + 1, from: 'me' as const, text: confirmationText, time: 'Just now' }],
        }]
      })
      fetch('/api/photographer/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'approved', photographer_note: note }),
      }).catch(() => {})
      return { ...r, status: 'approved', photographerNote: note }
    }))
  }

  function reject(id: string) {
    setRequests(prev => prev.map(r => {
      if (r.id !== id) return r
      setBookedDates(d => { const n = { ...d }; delete n[r.dateKey]; return n })
      fetch('/api/photographer/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'declined', photographer_note: noteDraft[id] ?? r.photographerNote }),
      }).catch(() => {})
      return { ...r, status: 'declined', photographerNote: noteDraft[id] ?? r.photographerNote }
    }))
  }

  function saveNote(id: string) {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, photographerNote: noteDraft[id] ?? r.photographerNote } : r))
    fetch('/api/photographer/bookings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'pending', photographer_note: noteDraft[id] }),
    }).catch(() => {})
  }

  function openMessage(req: BookingRequest) {
    setMessages(msgs => {
      const exists = msgs.find(m => m.from === req.clientName)
      if (!exists) {
        return [...msgs, {
          id: String(Date.now()), from: req.clientName, initials: req.clientInitials, bg: req.clientBg,
          preview: req.note || 'Booking enquiry', time: 'Now', unread: false,
          thread: req.note ? [{ id: 1, from: 'them' as const, text: req.note, time: req.submittedAt }] : [],
        }]
      }
      return msgs
    })
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
            <div key={req.id} className={`rounded-2xl border overflow-hidden transition-all ${
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
                  <p className="text-xs text-ink-300 mt-0.5">{req.submittedAt}</p>
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
                  {req.status === 'cancelled' && (
                    <div className="flex items-center gap-2 bg-ink-50 border border-ink-100 rounded-xl px-4 py-3">
                      <X className="w-4 h-4 text-ink-400 flex-shrink-0" />
                      <p className="text-xs text-ink-500">This request was cancelled by the client. The time slot has been freed up on your calendar.</p>
                    </div>
                  )}

                  {/* Photographer note textarea — only for non-cancelled */}
                  {req.status !== 'cancelled' && (
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
                          // hard-stop: ignore input beyond cap
                        }}
                        maxLength={PLATFORM_CONFIG.max_photographer_response_length}
                        placeholder="Add a message for the client — confirm details, ask questions, or explain a rejection…"
                        className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink resize-none transition-all"
                        disabled={req.status !== 'pending'}
                      />
                    </div>
                  )}

                  {/* Already responded note */}
                  {req.status !== 'pending' && req.status !== 'cancelled' && req.photographerNote && (
                    <div className="bg-ink-50 rounded-xl px-4 py-3">
                      <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest mb-1">Your response</p>
                      <p className="text-sm text-ink-500 leading-relaxed">{req.photographerNote}</p>
                    </div>
                  )}

                  {/* Actions — only for non-cancelled */}
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
                  {req.status === 'approved' || req.status === 'declined' || req.status === 'completed' ? (
                    <button
                      onClick={() => openMessage(req)}
                      className="w-full flex items-center justify-center gap-2 text-sm font-medium border border-ink-100 text-ink-500 py-2.5 rounded-xl hover:bg-ink-50 hover:text-ink transition-colors"
                    >
                      <MessageSquare className="w-4 h-4" /> Message {req.clientName.split(' ')[0]}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
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
  googleUrl: string
  instagramUrl: string
  yelpUrl: string
  websiteUrl: string
  hasPortfolio: boolean
  availabilitySet: boolean
  email: string
  avatarUrl: string
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

function computeScore(p: ProfileData) {
  const sections = [
    { key: 'name', label: 'Display name', done: !!p.displayName, weight: 10, href: '#settings', cta: 'Add your name' },
    { key: 'bio', label: 'Bio written', done: p.bio.length >= 20, weight: 15, href: '#settings', cta: 'Write your bio' },
    { key: 'area', label: 'Location set', done: !!p.area, weight: 10, href: '#settings', cta: 'Set your area' },
    { key: 'rate', label: 'Rate added', done: !!p.rate, weight: 10, href: '#settings', cta: 'Add your rate' },
    { key: 'specialties', label: 'Specialties chosen', done: p.specialties.length > 0, weight: 15, href: '#settings', cta: 'Pick specialties' },
    { key: 'google', label: 'Google reviews linked', done: !!p.googleUrl, weight: 15, href: '#settings', cta: 'Connect Google' },
    { key: 'instagram', label: 'Instagram linked', done: !!p.instagramUrl, weight: 10, href: '#settings', cta: 'Link Instagram' },
    { key: 'portfolio', label: 'Portfolio photos', done: p.hasPortfolio, weight: 15, href: '/dashboard/photographer/portfolio', cta: 'Upload photos' },
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
    setGroups(prev => {
      if (!g) return prev
      // Already left — remove from UI (DELETE called below)
      if (g.isLeft) return prev.filter(x => x.id !== groupId)
      // Cover groups and owner/removed — always hard-remove from view
      if (g.isCoverGroup || g.ownerId === 'me' || g.isRemoved) return prev.filter(x => x.id !== groupId)
      return prev.map(x => x.id === groupId ? { ...x, isLeft: true, memberIds: x.memberIds.filter(id => id !== 'me') } : x)
    })
    setActiveGroupId(null)
    fetch(`/api/photographer/groups?id=${groupId}`, { method: 'DELETE' }).catch(() => {})
  }

  const totalUnread = groups.reduce((acc, g) => acc + (g.unread ?? 0), 0)

  return (
    <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)', minHeight: 520 }}>
      <div className="flex h-[600px]">
        {/* Thread list */}
        <div className={`${(activeThread || activeGroupId) ? 'hidden sm:flex' : 'flex'} flex-col w-full sm:w-72 border-r border-ink-50 flex-shrink-0`}>
          <div className="px-4 py-3.5 border-b border-ink-50 flex items-center justify-between">
            <p className="font-semibold text-ink text-sm">Messages</p>
            {totalUnread > 0 && (
              <span className="text-[10px] font-bold bg-ink text-white rounded-full px-1.5 py-0.5">{totalUnread}</span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-ink-50">
            {(() => {
              // Merge client DMs and groups into one list sorted by most recent activity
              type ListItem =
                | { kind: 'dm'; id: string; sortKey: string }
                | { kind: 'group'; id: string; sortKey: string }

              const items: ListItem[] = [
                ...messages.map(m => ({ kind: 'dm' as const, id: m.id, sortKey: m.time || '0' })),
                ...groups.map(g => ({ kind: 'group' as const, id: g.id, sortKey: g.lastActivityAt || '0' })),
              ].sort((a, b) => b.sortKey.localeCompare(a.sortKey))

              if (items.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10">
                    <MessageSquare className="w-8 h-8 text-ink-200 mb-2" />
                    <p className="text-sm text-ink-400 font-medium">No messages yet</p>
                    <p className="text-xs text-ink-300 mt-1">Client conversations and group chats will appear here</p>
                  </div>
                )
              }

              return items.map(item => {
                if (item.kind === 'dm') {
                  const m = messages.find(x => x.id === item.id)!
                  return (
                    <button
                      key={`dm-${m.id}`}
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
                  )
                }

                const g = groups.find(x => x.id === item.id)!
                const lastMsg = g.messages[g.messages.length - 1]
                const lastMsgPreview = lastMsg
                  ? lastMsg.attachmentUrl && !lastMsg.text
                    ? `${lastMsg.senderName}: 📎 Attachment`
                    : `${lastMsg.senderName}: ${lastMsg.text}`
                  : 'No messages yet'
                const timeStr = g.lastActivityAt
                  ? new Date(g.lastActivityAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
                  : ''
                return (
                  <button
                    key={`group-${g.id}`}
                    onClick={() => openGroup(g.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3.5 hover:bg-ink-50 transition-colors text-left ${activeGroupId === g.id ? 'bg-ink-50' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center text-lg flex-shrink-0">
                      {g.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className={`text-sm truncate ${g.unread > 0 ? 'font-semibold text-ink' : 'text-ink-500'}`}>{g.name}</p>
                          {g.isCoverGroup
                            ? <span className="text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Cover</span>
                            : <span className="text-[9px] font-bold bg-ink-100 text-ink-400 border border-ink-200 px-1.5 py-0.5 rounded-full flex-shrink-0">Group</span>
                          }
                        </div>
                        <span className="text-[10px] text-ink-300 flex-shrink-0 ml-1">{timeStr}</span>
                      </div>
                      <p className="text-xs text-ink-400 truncate">{lastMsgPreview}</p>
                    </div>
                    {g.unread > 0 && <span className="w-2 h-2 rounded-full bg-ink flex-shrink-0 mt-1.5" />}
                  </button>
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
            <div className="text-center">
              <MessageSquare className="w-10 h-10 text-ink-200 mx-auto mb-3" />
              <p className="text-ink-400 text-sm font-medium">Select a conversation</p>
              <p className="text-ink-300 text-xs mt-1">Choose a message from the left</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Support widget ───────────────────────────────────────────────────────────

function PhotographerSupportWidget() {
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [sent, setSent] = useState(false)

  function submit() {
    if (!message.trim()) return
    setSent(true)
    setTimeout(() => { setSent(false); setMessage(''); setCategory('') }, 2500)
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
            <select value={category} onChange={e => setCategory(e.target.value)}
              className="w-full border border-ink-100 rounded-xl px-4 py-2.5 text-sm text-ink bg-white outline-none focus:border-ink transition-all"
            >
              <option value="">Select a topic…</option>
              <option value="profile">Profile / visibility issue</option>
              <option value="trust">Trust score question</option>
              <option value="client">Client behaviour concern</option>
              <option value="account">Account / login</option>
              <option value="payout">Payout question</option>
              <option value="bug">Bug report</option>
              <option value="other">Something else</option>
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
          <button onClick={submit} disabled={!message.trim()}
            className="flex items-center gap-2 text-sm font-semibold bg-ink text-white px-4 py-2.5 rounded-xl hover:bg-ink-800 disabled:opacity-40 transition-all"
          >
            <Send className="w-3.5 h-3.5" /> Send to support
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
    basics: 'idle', specialties: 'idle', links: 'idle', account: 'idle',
  })
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      }
    } else if (key === 'specialties') {
      body = { section: 'specialties', specialties: local.specialties }
    } else if (key === 'links') {
      body = {
        section: 'links',
        google_url: local.googleUrl.trim(),
        instagram_url: local.instagramUrl.trim(),
        yelp_url: local.yelpUrl.trim(),
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

      {/* Review links */}
      <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
            <Star className="w-4 h-4 text-ink-400" />
          </div>
          <h2 className="font-semibold text-ink">Review links</h2>
        </div>

        <p className="text-xs text-ink-300 mb-5">Paste links to your existing reviews — we pull in your rating to build your trust score.</p>
        <div className="space-y-4">
          {[
            { key: 'googleUrl', label: 'Google Business / Maps', icon: Globe, placeholder: 'https://maps.google.com/…', hint: 'Go to Google Business → Share → Copy link' },
            { key: 'instagramUrl', label: 'Instagram profile', icon: Instagram, placeholder: 'https://instagram.com/yourhandle', hint: null },
            { key: 'yelpUrl', label: 'Yelp business page', icon: Globe, placeholder: 'https://yelp.com/biz/…', hint: null },
            { key: 'websiteUrl', label: 'Personal website', icon: Globe, placeholder: 'https://yourwebsite.com', hint: null },
          ].map(field => {
            const Icon = field.icon
            const val = local[field.key as keyof typeof local] as string
            return (
              <div key={field.key}>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  <span className="flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-ink-300" />{field.label}</span>
                </label>
                <input
                  type="url" placeholder={field.placeholder} value={val}
                  onChange={e => setLocal(l => ({ ...l, [field.key]: e.target.value }))}
                  className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink focus:ring-2 focus:ring-ink/10 transition-all"
                />
                {val && <p className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600"><CheckCircle2 className="w-3 h-3" /> Connected</p>}
                {field.hint && !val && <p className="mt-1.5 text-xs text-ink-300">{field.hint}</p>}
              </div>
            )
          })}
        </div>
        <div className="flex justify-end mt-5"><SaveBtn section="links" /></div>
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
  const [showSignOut, setShowSignOut] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  function handleDelete() {
    if (confirmText !== 'DELETE') return
    setDeleting(true)
    setTimeout(() => { router.push('/login') }, 1500)
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-6 border border-red-100" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
        <h2 className="font-semibold text-ink mb-1">Danger zone</h2>
        <p className="text-xs text-ink-300 mb-4">These actions are permanent and cannot be undone.</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={() => setShowDelete(true)} className="text-sm font-medium text-red-600 border border-red-200 px-4 py-2 rounded-xl hover:bg-red-50 transition-colors">
            Delete account
          </button>
          <button onClick={() => setShowSignOut(true)} className="text-sm font-medium text-ink-400 border border-ink-100 px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors">
            Sign out
          </button>
        </div>
      </div>

      {/* Sign out modal */}
      {showSignOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-float-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
              <p className="font-semibold text-ink">Sign out</p>
              <button onClick={() => setShowSignOut(false)} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
            </div>
            <div className="px-5 py-4">
              <p className="text-sm text-ink-500 leading-relaxed">Are you sure you want to sign out of your TrueNorth Frames account?</p>
            </div>
            <div className="px-5 py-4 border-t border-ink-50 flex gap-3">
              <button onClick={() => setShowSignOut(false)} className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 hover:bg-ink-50 text-ink-400 transition-colors">Cancel</button>
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
              <div>
                <label className="block text-xs font-medium text-ink-500 mb-1.5">Type <span className="font-bold text-red-600">DELETE</span> to confirm</label>
                <input
                  type="text" value={confirmText} onChange={e => setConfirmText(e.target.value)}
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

// ─── Main Dashboard ───────────────────────────────────────────────────────────

function PhotographerDashboardInner() {
  const searchParams = useSearchParams()
  const isFresh = searchParams.get('fresh') === '1'
  const tabParam = searchParams.get('tab') as DashboardTab | null

  const [profile, setProfile] = useState<ProfileData>({
    displayName: '',
    bio: '',
    area: '',
    rate: '',
    rateUnit: 'hr',
    specialties: [],
    googleUrl: '',
    instagramUrl: '',
    yelpUrl: '',
    websiteUrl: '',
    hasPortfolio: false,
    availabilitySet: false,
    email: '',
    avatarUrl: '',
  })

  // Load real profile from DB on mount
  useEffect(() => {
    fetch('/api/photographer/profile')
      .then(r => r.json())
      .then(data => {
        setProfile(prev => ({
          ...prev,
          displayName: data.display_name ?? '',
          bio: data.bio ?? '',
          area: data.location ?? '',
          rate: data.rate_amount ?? '',
          rateUnit: data.rate_unit ?? 'hr',
          specialties: data.specialties ?? [],
          googleUrl: data.google_url ?? '',
          instagramUrl: data.instagram_url ?? '',
          yelpUrl: data.yelp_url ?? '',
          websiteUrl: data.website_url ?? '',
          avatarUrl: data.avatar_url ?? '',
        }))
      })
      .catch(() => {/* keep empty defaults */})
  }, [])

  const [messages, setMessages] = useState<Message[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [bookedDates, setBookedDates] = useState<Record<string, DayStatus>>({})
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule>({
    1: { slots: [] }, 2: { slots: [] }, 3: { slots: [] }, 4: { slots: [] }, 5: { slots: [] },
  })
  const [packages, setPackages] = useState<ProjectPackage[]>([])
  const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([])

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
          }
          setWeeklySchedule(schedule)
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
              clientName: b.clientName,
              clientInitials: b.clientInitials,
              clientBg: palette[code % palette.length],
              date: displayDate,
              dateKey,
              timeSlot: b.timeSlot,
              note: b.description,
              billingType: b.billingType,
              billingDetail: b.billingDetail,
              status: b.status,
              photographerNote: b.photographerNote,
              submittedAt: b.submittedAt,
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
              time: c.lastMessageAt ? new Date(c.lastMessageAt).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' }) : '',
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
            isRemoved: g.isRemoved ?? false,
            isLeft: g.isLeft ?? false,
          })))
        }
      })
      .catch(() => {})
  }, [])

  const [available, setAvailable] = useState(false)
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
  const [savingCaption, setSavingCaption] = useState(false)
  const [savedCaption, setSavedCaption] = useState<string | null>(null)
  const [editingVideoTitle, setEditingVideoTitle] = useState<{ videoId: string; isStandalone: boolean; albumId?: string } | null>(null)
  const [videoTitleDraft, setVideoTitleDraft] = useState('')
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
    const res = await fetch('/api/photographer/photos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingCaption.photoId, caption: captionDraft }) })
    if (res.ok) {
      if (editingCaption.albumId) {
        setPortfolioAlbums(prev => prev.map(a => a.id !== editingCaption.albumId ? a : { ...a, photos: a.photos.map(p => p.id === editingCaption.photoId ? { ...p, caption: captionDraft } : p) }))
      } else {
        setStandalonePhotos(prev => prev.map(p => p.id === editingCaption.photoId ? { ...p, caption: captionDraft } : p))
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
    const res = await fetch('/api/photographer/videos', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingVideoTitle.videoId, title: videoTitleDraft }) })
    if (res.ok) {
      if (editingVideoTitle.isStandalone) {
        setStandaloneVideos(prev => prev.map(v => v.id === editingVideoTitle.videoId ? { ...v, title: videoTitleDraft } : v))
      } else if (editingVideoTitle.albumId) {
        setPortfolioAlbums(prev => prev.map(a => a.id !== editingVideoTitle.albumId ? a : { ...a, videos: a.videos.map(v => v.id === editingVideoTitle.videoId ? { ...v, title: videoTitleDraft } : v) }))
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

  const validTabs: DashboardTab[] = ['overview','portfolio','messages','requests','availability','packages','reviews','network','faq','settings']
  const [activeTab, setActiveTab] = useState<DashboardTab>(
    tabParam && validTabs.includes(tabParam) ? tabParam : 'overview'
  )

  useEffect(() => {
    if (activeTab !== 'portfolio' || portfolioLoaded) return
    setPortfolioLoading(true)
    fetch('/api/photographer/albums')
      .then(r => r.json())
      .then(data => {
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          setPortfolioAlbums(data.albums ?? [])
          setStandalonePhotos(data.standalone_photos ?? [])
          setStandaloneVideos(data.standalone_videos ?? [])
        } else {
          // backwards compat: old array response
          setPortfolioAlbums(Array.isArray(data) ? data : [])
        }
      })
      .catch(() => {})
      .finally(() => { setPortfolioLoading(false); setPortfolioLoaded(true) })
  }, [activeTab, portfolioLoaded])

  const { sections, pct } = computeScore(profile)
  const incomplete = sections.filter(s => !s.done)
  const unreadCount = messages.filter(m => m.unread).length
  const groupUnreadCount = groups.reduce((acc, g) => acc + (g.unread ?? 0), 0)
  const totalUnreadMessages = unreadCount + groupUnreadCount
  const scoreColor = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-500' : 'text-red-500'

  const pendingBookings = bookingRequests.filter(r => r.status === 'pending').length

  // When a booking request comes in, mark the day as tentative on the calendar
  // (done at request creation — this ensures the state stays synced on load)
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'portfolio', label: 'Portfolio' },
    { key: 'messages', label: totalUnreadMessages > 0 ? `Messages (${totalUnreadMessages})` : 'Messages' },
    { key: 'requests', label: pendingBookings > 0 ? `Requests (${pendingBookings})` : 'Requests' },
    { key: 'availability', label: 'Availability' },
    { key: 'packages', label: 'Packages' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'network', label: 'Network' },
    { key: 'faq', label: 'FAQ' },
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
              {/* Availability toggle */}
              <button
                onClick={() => setAvailable(v => !v)}
                className={`hidden sm:flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all ${
                  available ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-ink-100 text-ink-400 hover:border-ink-200'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-emerald-500' : 'bg-ink-300'}`} />
                {available ? 'Available today' : 'Set status'}
              </button>

              {/* View public profile */}
              <Link
                href="/photographers/your-profile"
                className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-ink-100 text-ink-400 hover:text-ink hover:border-ink-300 transition-all"
              >
                <Eye className="w-3.5 h-3.5" /> View profile
              </Link>

              {/* Notifications */}
              <div className="relative">
                <button onClick={() => setNotifOpen(v => !v)} className="relative p-2 rounded-lg hover:bg-ink-50 transition-colors">
                  <Bell className="w-4 h-4 text-ink-400" />
                  {(totalUnreadMessages + pendingBookings + notifications.filter(n => !n.read_at).length) > 0 && (
                    <span className="absolute top-1 right-1 min-w-[14px] h-3.5 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                      {totalUnreadMessages + pendingBookings + notifications.filter(n => !n.read_at).length}
                    </span>
                  )}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-ink-100 z-50 overflow-hidden"
                    style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 8px 32px rgba(0,0,0,0.12)' }}>
                    <div className="flex items-center justify-between px-4 py-3 border-b border-ink-50">
                      <p className="text-sm font-semibold text-ink">Notifications</p>
                      <button onClick={() => setNotifOpen(false)} className="text-ink-300 hover:text-ink"><X className="w-4 h-4" /></button>
                    </div>
                    <div className="divide-y divide-ink-50 max-h-96 overflow-y-auto">
                      {/* Pending booking requests */}
                      {bookingRequests.filter(r => r.status === 'pending').map(r => (
                        <button key={r.id} onClick={() => { setActiveTab('requests'); setNotifOpen(false) }}
                          className="w-full px-4 py-3 hover:bg-amber-50 transition-colors text-left">
                          <div className="flex items-start gap-2.5">
                            <div className={`w-8 h-8 rounded-lg ${r.clientBg} flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0`}>
                              {r.clientInitials}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                                <p className="text-xs font-semibold text-ink">New booking request</p>
                              </div>
                              <p className="text-xs text-ink-500 font-medium">{r.clientName} · {r.date}</p>
                              <p className="text-xs text-ink-400 truncate">{r.timeSlot}</p>
                              <p className="text-[10px] text-ink-300 mt-0.5">{r.submittedAt}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                      {/* Unread messages */}
                      {messages.filter(m => m.unread).map(m => (
                        <button key={m.id} onClick={() => { setActiveTab('messages'); setNotifOpen(false) }}
                          className="w-full px-4 py-3 hover:bg-ink-50 transition-colors text-left">
                          <div className="flex items-start gap-2.5">
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
                          </div>
                        </button>
                      ))}
                      {/* System notifications */}
                      {notifications.filter(n => !n.read_at).map(n => (
                        <div key={n.id} className="w-full px-4 py-3 bg-ink-50/50">
                          <div className="flex items-start gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0">
                              <Bell className="w-3.5 h-3.5 text-ink-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0" />
                                <p className="text-xs font-semibold text-ink truncate">{n.title}</p>
                              </div>
                              {n.body && <p className="text-xs text-ink-400 truncate">{n.body}</p>}
                              <p className="text-[10px] text-ink-300 mt-0.5">{new Date(n.created_at).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {(totalUnreadMessages + pendingBookings + notifications.filter(n => !n.read_at).length) === 0 && (
                        <div className="px-4 py-8 text-center">
                          <Bell className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                          <p className="text-xs text-ink-300">You're all caught up!</p>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 border-t border-ink-50 text-center">
                      <button
                        className="text-xs text-ink-400 hover:text-ink font-medium transition-colors"
                        onClick={() => {
                          setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
                          fetch('/api/photographer/notifications', { method: 'PATCH' }).catch(() => {})
                        }}
                      >
                        Mark all as read
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Avatar */}
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="Profile" className="w-8 h-8 rounded-full object-cover ml-1" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-ink flex items-center justify-center ml-1">
                  <span className="text-white text-xs font-bold">
                    {profile.displayName ? profile.displayName[0].toUpperCase() : 'P'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Welcome banner */}
        {isFresh && !welcomeDismissed && (
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
          <div className="lg:col-span-2 space-y-6">

            {/* Tab bar — scrollable on mobile */}
            <div className="flex gap-1 bg-white rounded-xl p-1 border border-ink-100 overflow-x-auto" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 whitespace-nowrap text-sm font-medium py-2 px-3 rounded-lg transition-all ${
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
                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Profile views', value: '—', change: 'Coming soon', icon: Eye },
                    { label: 'Messages', value: String(messages.length + groups.length), change: `${totalUnreadMessages} unread`, icon: MessageSquare },
                    { label: 'Trust score', value: '—', change: 'No reviews yet', icon: Star },
                    { label: 'Response rate', value: '—', change: 'No activity yet', icon: Zap },
                  ].map(s => {
                    const Icon = s.icon
                    return (
                      <div key={s.label} className="bg-white rounded-2xl p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                        <Icon className="w-4 h-4 text-ink-300 mb-2" />
                        <p className="font-bold text-ink text-xl">{s.value}</p>
                        <p className="text-ink-400 text-xs mt-0.5">{s.label}</p>
                        <p className="text-ink-300 text-[10px] mt-1">{s.change}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Completion card — inline in overview */}
                <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <p className="font-semibold text-ink text-sm">Profile completion</p>
                    <button onClick={() => setActiveTab('settings')} className="text-xs text-ink-400 hover:text-ink flex items-center gap-1 transition-colors">
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
                        {pct >= 80 ? 'You appear in client searches.' : `${incomplete.length} item${incomplete.length !== 1 ? 's' : ''} left`}
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
                          <button
                            onClick={() => s.href.startsWith('#') ? setActiveTab('settings') : undefined}
                            className="text-[10px] text-ink font-medium hover:underline"
                          >
                            {s.href.startsWith('/') ? (
                              <Link href={s.href}>Add →</Link>
                            ) : 'Add →'}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent messages preview */}
                <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
                    <p className="font-semibold text-ink text-sm">Recent messages</p>
                    <button onClick={() => setActiveTab('messages')} className="text-xs text-ink-400 hover:text-ink flex items-center gap-1 transition-colors">
                      View all <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="divide-y divide-ink-50">
                    {messages.slice(0, 3).map(m => (
                      <button key={m.id} onClick={() => setActiveTab('messages')}
                        className="w-full flex items-start gap-3 px-5 py-3.5 hover:bg-ink-50 transition-colors text-left">
                        <div className={`w-9 h-9 rounded-full ${m.bg} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{m.initials}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className={`text-sm ${m.unread ? 'font-semibold text-ink' : 'text-ink-500'}`}>{m.from}</p>
                            <span className="text-[10px] text-ink-300">{m.time}</span>
                          </div>
                          <p className="text-xs text-ink-400 truncate">{m.preview}</p>
                        </div>
                        {m.unread && <span className="w-2 h-2 bg-ink rounded-full mt-1.5 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Messages tab ─────────────────────────────────────── */}
            {activeTab === 'messages' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-ink-300">Showing recent conversations. For the full experience use the dedicated messaging view.</p>
                  <Link href="/messages/photographer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-ink border border-ink-100 px-3 py-1.5 rounded-lg hover:bg-ink-50 transition-colors flex-shrink-0">
                    <ExternalLink className="w-3 h-3" /> Open full view
                  </Link>
                </div>
                <MessagesTab messages={messages} setMessages={setMessages} groups={groups} setGroups={setGroups} />
              </div>
            )}

            {/* ── Booking requests tab ──────────────────────────────── */}
            {activeTab === 'requests' && (
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
                  setActiveTab={setActiveTab}
                />
              </div>
            )}

            {/* ── Availability tab ──────────────────────────────────── */}
            {activeTab === 'availability' && (
              <div className="space-y-5">
                {/* Day-level calendar */}
                <div className="bg-white rounded-2xl p-6" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 bg-ink-50 rounded-xl flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-ink-400" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-ink">Day availability</h2>
                      <p className="text-xs text-ink-300">Mark days as available, tentative, or busy</p>
                    </div>
                  </div>
                  <AvailabilityCalendar bookedDates={bookedDates} setBookedDates={setBookedDates} />
                </div>

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
                      body: JSON.stringify({ name: pkg.name, description: pkg.description, billing_type: pkg.billing_type, price: pkg.price || 0, deliverables: pkg.includes }),
                    })
                    if (!res.ok) return null
                    const data = await res.json()
                    return data.id ?? null
                  }}
                  onPersistUpdate={(pkg) => {
                    fetch('/api/photographer/packages', {
                      method: 'PATCH',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: pkg.id, name: pkg.name, description: pkg.description, billing_type: pkg.billing_type, price: pkg.price || 0, deliverables: pkg.includes, is_popular: pkg.popular }),
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

                  {/* Caption modal — works for both album photos and standalone photos */}
                  {editingCaption && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl w-full max-w-sm p-5" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <p className="text-sm font-semibold text-ink mb-3">Edit caption</p>
                        <input type="text" value={captionDraft} onChange={e => setCaptionDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') savePortfolioCaption() }}
                          placeholder="Add a caption…" autoFocus maxLength={MAX_CAPTION}
                          className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all mb-3" />
                        <div className="flex gap-2">
                          <button onClick={savePortfolioCaption} disabled={savingCaption}
                            className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50">
                            {savingCaption ? 'Saving…' : 'Save caption'}
                          </button>
                          <button onClick={() => setEditingCaption(null)}
                            className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">Cancel</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Video title modal */}
                  {editingVideoTitle && (
                    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                      <div className="bg-white rounded-2xl w-full max-w-sm p-5" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.18)' }}>
                        <p className="text-sm font-semibold text-ink mb-3">Edit video title</p>
                        <input type="text" value={videoTitleDraft} onChange={e => setVideoTitleDraft(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveVideoTitle() }}
                          placeholder="Add a title…" autoFocus maxLength={120}
                          className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all mb-3" />
                        <div className="flex gap-2">
                          <button onClick={saveVideoTitle} disabled={savingVideoTitle}
                            className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors disabled:opacity-50">
                            {savingVideoTitle ? 'Saving…' : 'Save title'}
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
                                  <button onClick={e => { e.stopPropagation(); setEditingCaption({ albumId: openAlbum.id, photoId: photo.id }); setCaptionDraft(photo.caption) }} className="w-full text-left">
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
                                <button onClick={() => { setEditingVideoTitle({ videoId: video.id, isStandalone: false, albumId: openAlbum.id }); setVideoTitleDraft(video.title || '') }}
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
                                <button onClick={() => { setEditingCaption({ albumId: null, photoId: photo.id }); setCaptionDraft(photo.caption) }}
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
                                <button onClick={() => { setEditingVideoTitle({ videoId: video.id, isStandalone: true }); setVideoTitleDraft(video.title || '') }}
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
                  </div>
                ))}
              </div>
              {incomplete.length > 0 && (
                <button
                  onClick={() => setActiveTab('settings')}
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
                  { label: 'Upload portfolio', onClick: () => setActiveTab('portfolio'), href: null, icon: ImagePlus, badge: null },
                  { label: pendingBookings > 0 ? `Booking requests (${pendingBookings})` : 'Booking requests', onClick: () => setActiveTab('requests'), href: null, icon: Inbox, badge: pendingBookings > 0 ? pendingBookings : null },
                  { label: 'Set availability', onClick: () => setActiveTab('availability'), href: null, icon: Calendar, badge: null },
                  { label: 'Packages & pricing', onClick: () => setActiveTab('packages'), href: null, icon: Package, badge: null },
                  { label: 'Manage reviews', onClick: () => setActiveTab('reviews'), href: null, icon: Star, badge: null },
                  { label: 'Photographer network', onClick: () => setActiveTab('network'), href: null, icon: Users, badge: null },
                  { label: 'Profile settings', onClick: () => setActiveTab('settings'), href: null, icon: Settings, badge: null },
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
                    Profiles with a Google review link get 2× more trust from clients.
                  </p>
                  <button
                    onClick={() => setActiveTab('settings')}
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
