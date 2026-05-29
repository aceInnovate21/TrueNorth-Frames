'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, X, Calendar, MessageSquare, Star, Users, Zap, Check } from 'lucide-react'

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

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return d === 1 ? 'Yesterday' : `${d}d ago`
}

const TYPE_META: Record<string, { icon: React.ElementType; color: string }> = {
  booking_request:   { icon: Calendar,     color: 'bg-amber-500' },
  booking_approved:  { icon: Calendar,     color: 'bg-emerald-500' },
  booking_declined:  { icon: Calendar,     color: 'bg-red-400' },
  booking_cancelled: { icon: Calendar,     color: 'bg-red-400' },
  booking_completed: { icon: Calendar,     color: 'bg-blue-500' },
  new_message:       { icon: MessageSquare, color: 'bg-ink' },
  connection_request:{ icon: Users,        color: 'bg-violet-500' },
  connection_accepted:{ icon: Users,       color: 'bg-violet-500' },
  group_invite:      { icon: Users,        color: 'bg-violet-500' },
  review_received:   { icon: Star,         color: 'bg-amber-400' },
  review_reply:      { icon: Star,         color: 'bg-amber-400' },
  trust_score_updated:{ icon: Zap,         color: 'bg-sky-500' },
}

function notifHref(n: Notification, role: 'client' | 'photographer'): string | null {
  if (!n.entity_id) return null
  if (n.type === 'new_message') {
    return role === 'client' ? `/messages/${n.entity_id}` : `/dashboard/photographer?tab=messages&conv=${n.entity_id}`
  }
  if (n.type.startsWith('booking_')) {
    return role === 'client' ? '/dashboard/client' : '/dashboard/photographer?tab=requests'
  }
  if (n.type.startsWith('connection_') || n.type === 'group_invite') {
    return role === 'photographer' ? '/dashboard/photographer?tab=network' : null
  }
  if (n.type === 'review_reply') return '/dashboard/client'
  if (n.type === 'review_received') return '/dashboard/photographer?tab=reviews'
  if (n.type === 'trust_score_updated') return '/dashboard/photographer?tab=overview'
  return null
}

interface Props {
  apiEndpoint: string    // '/api/client/notifications' or '/api/photographer/notifications'
  markReadEndpoint: string  // '/api/client/notifications/read' or patches photographer endpoint
  role: 'client' | 'photographer'
  pollIntervalMs?: number
}

export function NotificationCentre({ apiEndpoint, markReadEndpoint, role, pollIntervalMs = 30000 }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.read_at).length

  const fetchNotifications = useCallback(async () => {
    const res = await fetch(apiEndpoint)
    if (res.ok) setNotifications(await res.json())
    setLoading(false)
  }, [apiEndpoint])

  // Initial fetch + polling
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, pollIntervalMs)
    return () => clearInterval(interval)
  }, [fetchNotifications, pollIntervalMs])

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
    // Optimistic
    setNotifications(prev => prev.map(n => ({ ...n, read_at: n.read_at ?? new Date().toISOString() })))
    // For client: POST with { all: true }; for photographer: PATCH
    if (role === 'client') {
      await fetch(markReadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
    } else {
      await fetch(markReadEndpoint, { method: 'PATCH' })
    }
  }

  async function markOneRead(id: string) {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    if (role === 'photographer') {
      await fetch(`/api/photographer/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) })
    } else {
      await fetch(markReadEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    }
  }

  function handleNotifClick(n: Notification) {
    markOneRead(n.id)
    const href = notifHref(n, role)
    if (href) router.push(href)
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-9 h-9 rounded-xl border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors relative"
      >
        <Bell className="w-4 h-4 text-ink-500" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-ink rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl overflow-hidden z-50"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.08), 0 8px 32px rgba(0,0,0,0.12)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-ink-50">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-ink text-sm">Notifications</p>
              {unread > 0 && (
                <span className="bg-ink text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">{unread} new</span>
              )}
            </div>
            <button onClick={() => setOpen(false)} className="text-ink-300 hover:text-ink transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto">
            {loading ? (
              <div className="px-4 py-6 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-ink-100 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-ink-100 rounded w-1/3" />
                      <div className="h-2.5 bg-ink-100 rounded w-full" />
                      <div className="h-2 bg-ink-100 rounded w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell className="w-7 h-7 text-ink-200 mx-auto mb-2" />
                <p className="text-sm text-ink-300 font-medium">You're all caught up</p>
                <p className="text-xs text-ink-200 mt-0.5">Notifications about bookings, messages, and reviews appear here.</p>
              </div>
            ) : (
              notifications.map(n => {
                const meta = TYPE_META[n.type] ?? { icon: Bell, color: 'bg-ink-400' }
                const Icon = meta.icon
                const isUnread = !n.read_at
                return (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => handleNotifClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 border-b border-ink-50 last:border-0 hover:bg-ink-50/60 transition-colors text-left ${isUnread ? 'bg-ink-50/40' : ''}`}
                  >
                    <div className={`w-8 h-8 rounded-lg ${meta.color} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <p className={`text-xs leading-tight ${isUnread ? 'font-semibold text-ink' : 'font-medium text-ink-500'}`}>{n.title}</p>
                        {isUnread && <span className="w-1.5 h-1.5 rounded-full bg-ink flex-shrink-0" />}
                      </div>
                      <p className="text-ink-400 text-xs leading-relaxed line-clamp-2">{n.body}</p>
                      <p className="text-ink-200 text-[10px] mt-1">{relTime(n.created_at)}</p>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-ink-50 flex items-center justify-between">
              <button onClick={markAllRead} disabled={unread === 0}
                className="text-xs text-ink-400 hover:text-ink font-medium transition-colors disabled:opacity-40 flex items-center gap-1">
                <Check className="w-3 h-3" /> Mark all read
              </button>
              <button onClick={() => { fetchNotifications(); setOpen(false) }}
                className="text-xs text-ink-300 hover:text-ink transition-colors">
                Refresh
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
