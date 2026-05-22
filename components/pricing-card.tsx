'use client'

import { useState } from 'react'
import { CheckCircle2, CalendarClock } from 'lucide-react'
import { BookingRequestModal } from './booking-request-modal'

interface Props {
  p: {
    rate: string
    rateNote: string
    responseTime: string
    name: string
  }
  username: string
}

export function PricingCard({ p, username }: Props) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.05)' }}>
        <div className="mb-4 pb-4 border-b border-ink-50">
          <p className="text-2xl font-bold text-ink">{p.rate}</p>
          <p className="text-ink-400 text-xs mt-0.5">{p.rateNote}</p>
        </div>

        <div className="space-y-2.5 mb-5 text-sm text-ink-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ink flex-shrink-0" />
            No booking fees
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ink flex-shrink-0" />
            Direct communication
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ink flex-shrink-0" />
            {p.responseTime}
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="w-full bg-ink text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-ink-800 transition-colors text-sm"
        >
          <CalendarClock className="w-4 h-4" />
          Request a booking
        </button>
        <p className="text-center text-ink-300 text-xs mt-2">Free to request · No booking fees</p>
      </div>

      {showModal && (
        <BookingRequestModal
          photographerName={p.name}
          username={username}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  )
}
