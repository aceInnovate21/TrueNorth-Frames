'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Loader2, XCircle } from 'lucide-react'

// Collects a required reason when an admin rejects a photographer. The reason is
// stored on the profile (status_note) and included in the rejection email so the
// photographer knows exactly what to fix before resubmitting.
export function RejectReasonModal({
  photographerName,
  busy,
  onConfirm,
  onClose,
}: {
  photographerName?: string | null
  busy: boolean
  onConfirm: (reason: string) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const canSubmit = reason.trim().length >= 5

  const content = (
    <div className="fixed inset-0 z-[10000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-semibold text-ink">Reject photographer</p>
            {photographerName && <p className="text-xs text-ink-400">{photographerName}</p>}
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-ink-50 hover:bg-ink-100 flex items-center justify-center">
            <X className="w-4 h-4 text-ink-400" />
          </button>
        </div>

        <p className="text-sm text-ink-500 mb-2">
          Tell them what needs fixing. This is emailed to the photographer so they can update their profile and resubmit for review.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          autoFocus
          placeholder="e.g. Portfolio is empty — please add at least 5 sample photos, and set a clear session rate."
          className="w-full border border-ink-100 rounded-xl px-3 py-2.5 text-sm text-ink placeholder-ink-300 focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent resize-none"
        />

        <div className="flex items-center gap-2 mt-4">
          <button onClick={onClose} className="flex-1 text-sm font-medium border border-ink-100 rounded-xl py-2.5 text-ink-500 hover:bg-ink-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={() => canSubmit && onConfirm(reason.trim())}
            disabled={!canSubmit || busy}
            className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold bg-red-600 text-white rounded-xl py-2.5 hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            Reject & notify
          </button>
        </div>
      </div>
    </div>
  )

  if (!mounted) return null
  return createPortal(content, document.body)
}
