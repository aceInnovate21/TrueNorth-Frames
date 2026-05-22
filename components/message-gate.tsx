'use client'

import Link from 'next/link'
import { useState } from 'react'
import { MessageSquare, X, Bell, Shield, Inbox, ArrowRight, CheckCircle2 } from 'lucide-react'

const PERKS = [
  {
    icon: Bell,
    title: 'Get notified instantly',
    desc: "We'll ping you the moment a photographer replies — no need to keep checking back.",
  },
  {
    icon: Inbox,
    title: 'Manage all your conversations',
    desc: 'Every enquiry in one place. Pick up where you left off, on any device.',
  },
  {
    icon: Shield,
    title: 'No spam. Ever.',
    desc: 'No newsletters, no marketing emails. We only send you messages that matter to your sessions.',
  },
]

export function MessageGate({
  photographerName,
  username,
  variant = 'header',
}: {
  photographerName: string
  username: string
  variant?: 'header' | 'sidebar' | 'package' | 'booking'
}) {
  const [open, setOpen] = useState(false)

  const buttonClass =
    variant === 'sidebar'
      ? 'w-full bg-white hover:bg-ink-50 text-ink font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm border border-white/20'
      : variant === 'package'
      ? 'w-full border border-ink-200 hover:border-ink text-ink font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors text-xs'
      : variant === 'booking'
      ? 'w-full bg-ink hover:bg-ink-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm'
      : 'inline-flex items-center justify-center gap-2 bg-ink hover:bg-ink-800 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0'

  const label =
    variant === 'sidebar' ? 'Send a message' :
    variant === 'package' ? 'Enquire about this package' :
    variant === 'booking' ? 'Request a booking' :
    'Message'

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={buttonClass}>
        <MessageSquare className="w-4 h-4" />
        {label}
      </button>

      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          {/* Panel */}
          <div
            className="bg-white rounded-3xl w-full max-w-md overflow-hidden"
            style={{ boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-ink-50">
              <div>
                <p className="font-semibold text-ink text-base leading-tight">
                  Message {photographerName}
                </p>
                <p className="text-ink-300 text-xs mt-0.5">Sign in free to start the conversation</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full bg-ink-50 hover:bg-ink-100 flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-ink-400" />
              </button>
            </div>

            {/* Perks */}
            <div className="px-6 py-5 space-y-4">
              {PERKS.map((p) => {
                const Icon = p.icon
                return (
                  <div key={p.title} className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-ink-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="w-4 h-4 text-ink" />
                    </div>
                    <div>
                      <p className="font-semibold text-ink text-sm leading-tight">{p.title}</p>
                      <p className="text-ink-300 text-xs leading-relaxed mt-0.5">{p.desc}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* No-spam reassurance strip */}
            <div className="mx-6 mb-5 bg-ink-50 rounded-xl px-4 py-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-ink flex-shrink-0" />
              <p className="text-ink-500 text-xs leading-relaxed">
                No newsletters · No marketing · Unsubscribe any time
              </p>
            </div>

            {/* CTAs */}
            <div className="px-6 pb-6 flex flex-col gap-2.5">
              <Link
                href={`/signup?redirect=/messages/new?to=${username}`}
                className="w-full bg-ink hover:bg-ink-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
              >
                Create free account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/login?redirect=/messages/new?to=${username}`}
                className="w-full border border-ink-100 hover:border-ink-300 text-ink font-medium py-3 rounded-xl flex items-center justify-center transition-colors text-sm"
              >
                Sign in to existing account
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
