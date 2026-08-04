'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bell, X, Calendar, MessageSquare, Star, Users, Zap,
  CheckCheck, Shield, PartyPopper, Sparkles, Trash2,
} from 'lucide-react'

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

// ── Relative time ─────────────────────────────────────────────────────────────

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d === 1) return 'Yesterday'
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
}

function isToday(iso: string): boolean {
  const d = new Date(iso)
  const now = new Date()
  return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
}

// ── Type metadata: icon + colour per notification type ────────────────────────

const TYPE_META: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  booking_request:    { icon: Calendar,      color: 'text-amber-600',  bg: 'bg-amber-500' },
  booking_approved:   { icon: Calendar,      color: 'text-emerald-600',bg: 'bg-emerald-500' },
  booking_declined:   { icon: Calendar,      color: 'text-red-500',    bg: 'bg-red-400' },
  booking_cancelled:  { icon: Calendar,      color: 'text-red-500',    bg: 'bg-red-400' },
  booking_completed:  { icon: Calendar,      color: 'text-blue-600',   bg: 'bg-blue-500' },
  new_message:        { icon: MessageSquare, color: 'text-ink',        bg: 'bg-ink' },
  connection_request: { icon: Users,         color: 'text-violet-600', bg: 'bg-violet-500' },
  connection_accepted:{ icon: Users,         color: 'text-violet-600', bg: 'bg-violet-500' },
  group_invite:       { icon: Users,         color: 'text-violet-600', bg: 'bg-violet-500' },
  review_received:    { icon: Star,          color: 'text-amber-600',  bg: 'bg-amber-400' },
  review_reply:       { icon: Star,          color: 'text-amber-600',  bg: 'bg-amber-400' },
  trust_score_updated:{ icon: Zap,           color: 'text-sky-600',    bg: 'bg-sky-500' },
  welcome:            { icon: PartyPopper,   color: 'text-pink-600',   bg: 'bg-pink-500' },
  profile_approved:   { icon: Sparkles,      color: 'text-emerald-600',bg: 'bg-emerald-500' },
}

const DEFAULT_META = { icon: Bell, color: 'text-ink-400', bg: 'bg-ink-400' }

// ── Deep-link routing per notification type ───────────────────────────────────

function notifHref(n: Notification, role: 'client' | 'photographer'): string | null {
  switch (n.type) {
    case 'new_message':
      return role === 'client'
        ? (n.entity_id ? `/messages?conv=${n.entity_id}` : '/messages')
        : `/messages/photographer${n.entity_id ? `?conv=${n.entity_id}` : ''}`

    case 'booking_request':
    case 'booking_approved':
    case 'booking_declined':
    case 'booking_cancelled':
    case 'booking_completed':
      return role === 'client' ? '/dashboard/client' : '/dashboard/photographer?tab=requests'

    case 'connection_request':
    case 'connection_accepted':
    case 'group_invite':
      return role === 'photographer' ? '/dashboard/photographer?tab=network' : null

    case 'review_received':
      return '/dashboard/photographer?tab=reviews'

    case 'review_reply':
      return '/dashboard/client'

    case 'trust_score_updated':
      return '/dashboard/photographer?tab=trust'

    case 'profile_approved':
      return '/dashboard/photographer?tab=overview'

    case 'welcome':
      return role === 'photographer' ? '/dashboard/photographer?tab=overview' : '/dashboard/client'

    default:
      return null
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  apiEndpoint: string
  markReadEndpoint: string
  role: 'client' | 'photographer'
  pollIntervalMs?: number
  /** Open the panel above the bell instead of below — for bottom-anchored placements (e.g. the sidebar rail footer). */
  dropUp?: boolean
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NotificationCentre({ apiEndpoint, markReadEndpoint, role, pollIntervalMs = 60000, dropUp }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [dismissing, setDismissing] = useState<Set<string>>(new Set())
  const [prevUnread, setPrevUnread] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read_at).length
  // Pulse bell when new unread arrives
  const [bellPulse, setBellPulse] = useState(false)
  useEffect(() => {
    if (unread > prevUnread) {
      setBellPulse(true)
      setTimeout(() => setBellPulse(false), 1200)
    }
    setPrevUnread(unread)
  }, [unread]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNotifications = useCallback(async () => {
    const res = await fetch(apiEndpoint)
    if (res.ok) setNotifications(await res.json())
    setLoading(false)
  }, [apiEndpoint])

  // Initial fetch + polling (slower — 60s default, was 30s)
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, pollIntervalMs)
    return () => clearInterval(interval)
  }, [fetchNotifications, pollIntervalMs])

  // Mark all read when dropdown opens (if there are unread)
  // This gives the "you saw them" signal without requiring a manual click
  useEffect(() => {
    if (open && unread > 0) {
      // Delay slightly so the unread dot is visible for a moment
      const t = setTimeout(() => markAllRead(), 1500)
      return () => clearTimeout(t)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  async function markAllRead() {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    if (role === 'client') {
      await fetch(markReadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
    } else {
      await fetch(markReadEndpoint, { method: 'PATCH' })
    }
  }

  async function markOneRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: n.read_at ?? new Date().toISOString() } : n))
    if (role === 'photographer') {
      await fetch(`/api/photographer/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
    } else {
      await fetch(markReadEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] }),
      })
    }
  }

  async function dismissOne(id: string, e: React.MouseEvent) {
    e.stopPropagation()
    setDismissing(prev => new Set(prev).add(id))
    // Animate out then remove
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
      setDismissing(prev => { const s = new Set(prev); s.delete(id); return s })
    }, 220)
    // Server delete
    if (role === 'photographer') {
      await fetch(`/api/photographer/notifications/${id}`, { method: 'DELETE' })
    } else {
      await fetch(`${markReadEndpoint}?id=${id}`, { method: 'DELETE' })
    }
  }

  function handleNotifClick(n: Notification) {
    markOneRead(n.id)
    const href = notifHref(n, role)
    setOpen(false)
    if (href) router.push(href)
  }

  // Group into Today / Earlier
  const todayNotifs   = notifications.filter(n =>  isToday(n.created_at))
  const earlierNotifs = notifications.filter(n => !isToday(n.created_at))
  const hasAny = notifications.length > 0

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all relative ${
          open ? 'border-ink bg-ink-50' : 'border-ink-100 hover:bg-ink-50'
        }`}
        aria-label="Notifications"
      >
        <Bell className={`w-4 h-4 transition-colors ${bellPulse ? 'text-ink animate-bounce' : 'text-ink-500'}`} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-ink rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1 leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className={`absolute w-80 sm:w-96 bg-white rounded-2xl overflow-hidden z-50 ${dropUp ? 'bottom-full mb-2 left-0' : 'top-full mt-2 right-0'}`}
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.06), 0 12px 40px rgba(0,0,0,0.14)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-50">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink text-sm">Notifications</p>
              {unread > 0 && (
                <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {unread} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-ink-400 hover:text-ink font-medium transition-colors"
                >
                  <CheckCheck className="w-3 h-3" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-ink-300 hover:text-ink transition-colors ml-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[460px] overflow-y-auto overscroll-contain">
            {loading ? (
              <div className="px-4 py-5 space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-ink-100 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-ink-100 rounded w-2/5" />
                      <div className="h-2.5 bg-ink-100 rounded w-full" />
                      <div className="h-2 bg-ink-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !hasAny ? (
              <div className="px-4 py-12 text-center">
                <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-5 h-5 text-ink-200" />
                </div>
                <p className="text-sm font-medium text-ink-400">All caught up</p>
                <p className="text-xs text-ink-300 mt-1 leading-relaxed max-w-[200px] mx-auto">
                  Bookings, messages, and reviews will appear here.
                </p>
              </div>
            ) : (
              <>
                {todayNotifs.length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Today</p>
                    {todayNotifs.map(n => <NotifRow key={n.id} n={n} dismissing={dismissing.has(n.id)} onDismiss={dismissOne} onClick={handleNotifClick} />)}
                  </>
                )}
                {earlierNotifs.length > 0 && (
                  <>
                    <p className="px-4 pt-3 pb-1 text-[10px] font-semibold text-ink-300 uppercase tracking-wider">Earlier</p>
                    {earlierNotifs.map(n => <NotifRow key={n.id} n={n} dismissing={dismissing.has(n.id)} onDismiss={dismissOne} onClick={handleNotifClick} />)}
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer — only when there are read notifications to clear */}
          {hasAny && notifications.every(n => n.read_at) && (
            <div className="px-4 py-2.5 border-t border-ink-50 flex items-center justify-between">
              <p className="text-[11px] text-ink-300">All caught up</p>
              <button
                onClick={() => fetchNotifications()}
                className="text-[11px] text-ink-400 hover:text-ink transition-colors font-medium"
              >
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Single notification row ───────────────────────────────────────────────────

function NotifRow({ n, dismissing, onDismiss, onClick }: {
  n: Notification
  dismissing: boolean
  onDismiss: (id: string, e: React.MouseEvent) => void
  onClick: (n: Notification) => void
}) {
  const meta = TYPE_META[n.type] ?? DEFAULT_META
  const Icon = meta.icon
  const isUnread = !n.read_at
  const href = notifHref(n, 'photographer') // used only for cursor hint, actual nav handled by onClick

  return (
    <div
      className={`transition-all duration-200 ${dismissing ? 'opacity-0 scale-95 h-0 overflow-hidden' : 'opacity-100'}`}
    >
      <button
        type="button"
        onClick={() => onClick(n)}
        className={`group w-full flex items-start gap-3 px-4 py-3 border-b border-ink-50 last:border-0 transition-colors text-left relative
          ${isUnread ? 'bg-ink-50/50 hover:bg-ink-50' : 'hover:bg-ink-50/40'}
        `}
      >
        {/* Icon */}
        <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
          <Icon className="w-3.5 h-3.5 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex items-start gap-1.5 mb-0.5">
            <p className={`text-xs leading-snug flex-1 ${isUnread ? 'font-semibold text-ink' : 'font-medium text-ink-500'}`}>
              {n.title}
            </p>
            {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0 mt-1" />}
          </div>
          {n.body && (
            <p className="text-ink-400 text-xs leading-relaxed line-clamp-2">{n.body}</p>
          )}
          <p className="text-ink-300 text-[10px] mt-1">{relTime(n.created_at)}</p>
        </div>

        {/* Dismiss button — visible on hover */}
        <button
          type="button"
          onClick={(e) => onDismiss(n.id, e)}
          className="absolute right-3 top-3 w-5 h-5 rounded-md flex items-center justify-center text-ink-300 hover:text-red-400 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all"
          aria-label="Dismiss"
        >
          <X className="w-3 h-3" />
        </button>
      </button>
    </div>
  )
}

// Re-export notifHref so it's available if needed elsewhere
export { notifHref }
