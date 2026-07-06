'use client'

import Link from 'next/link'
import { useState } from 'react'
import { X, Flag, Ban, Check, ShieldAlert } from 'lucide-react'

export type SpamReason =
  | 'Unsolicited promotional content'
  | 'Harassing or threatening messages'
  | 'Fake photographer / scam'
  | 'Repeated unwanted contact'
  | 'Other'

export const SPAM_REASONS: SpamReason[] = [
  'Unsolicited promotional content',
  'Harassing or threatening messages',
  'Fake photographer / scam',
  'Repeated unwanted contact',
  'Other',
]

// ─── Conversation options menu ──────────────────────────────────────────────────

export function ConvMenu({
  name, isBlocked, profileHref, onBlock, onUnblock, onReport, onClose,
}: {
  name: string
  isBlocked: boolean
  profileHref?: string | null
  onBlock: () => void
  onUnblock: () => void
  onReport: () => void
  onClose: () => void
}) {
  const firstName = name.split(' ')[0]
  return (
    <div
      className="absolute right-0 top-full mt-1 w-52 bg-white rounded-2xl border border-ink-100 z-30 overflow-hidden py-1"
      style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)' }}
    >
      {profileHref && (
        <Link
          href={profileHref}
          onClick={onClose}
          className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-500 hover:bg-ink-50 transition-colors"
        >
          View profile
        </Link>
      )}
      <div className={profileHref ? 'border-t border-ink-50 mt-1 pt-1' : ''}>
        {isBlocked ? (
          <button
            onClick={onUnblock}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-emerald-600 hover:bg-emerald-50 transition-colors text-left"
          >
            <Ban className="w-3.5 h-3.5" /> Unblock {firstName}
          </button>
        ) : (
          <button
            onClick={onBlock}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-ink-500 hover:bg-ink-50 transition-colors text-left"
          >
            <Ban className="w-3.5 h-3.5" /> Block {firstName}
          </button>
        )}
        <button
          onClick={onReport}
          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
        >
          <Flag className="w-3.5 h-3.5" /> Report as spam
        </button>
      </div>
    </div>
  )
}

// ─── Block confirm modal ────────────────────────────────────────────────────────

export function BlockModal({ name, onConfirm, onClose }: { name: string; onConfirm: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        <div className="w-12 h-12 bg-ink-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Ban className="w-6 h-6 text-ink-400" />
        </div>
        <p className="font-semibold text-ink text-base text-center mb-2">Block {name}?</p>
        <p className="text-ink-400 text-sm text-center leading-relaxed mb-5">
          They won&apos;t be able to send you new messages. You can unblock them at any time.
        </p>
        <div className="flex gap-2.5">
          <button onClick={onConfirm} className="flex-1 bg-ink text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-ink-800 transition-colors">
            Block
          </button>
          <button onClick={onClose} className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Report modal ───────────────────────────────────────────────────────────────

export function ReportModal({
  name, onSubmit, onClose,
}: {
  name: string
  onSubmit: (reason: SpamReason, note: string, alsoBlock: boolean) => Promise<void> | void
  onClose: () => void
}) {
  const [reason, setReason] = useState<SpamReason | null>(null)
  const [note, setNote] = useState('')
  const [alsoBlock, setAlsoBlock] = useState(true)
  const [submitted, setSubmitted] = useState(false)

  async function submit() {
    if (!reason) return
    setSubmitted(true)
    await onSubmit(reason, note, alsoBlock)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden" style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
        {submitted ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-7 h-7 text-amber-500" />
            </div>
            <p className="font-semibold text-ink text-base mb-2">Report submitted</p>
            <p className="text-ink-400 text-sm leading-relaxed">
              Our team will review this conversation and take appropriate action. Thank you for keeping TrueNorth Frames safe.
            </p>
            <button onClick={onClose} className="mt-5 text-sm font-semibold text-ink border border-ink-100 px-4 py-2 rounded-xl hover:bg-ink-50 transition-colors">
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between px-5 py-4 border-b border-ink-50">
              <div className="flex items-center gap-2.5">
                <Flag className="w-4 h-4 text-red-500" />
                <p className="font-semibold text-ink text-sm">Report {name}</p>
              </div>
              <button onClick={onClose} className="text-ink-300 hover:text-ink transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2.5">Why are you reporting this conversation?</p>
                <div className="space-y-2">
                  {SPAM_REASONS.map(r => (
                    <button
                      key={r}
                      onClick={() => setReason(r)}
                      className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left text-sm transition-all ${
                        reason === r ? 'border-red-400 bg-red-50 text-red-700 font-medium' : 'border-ink-100 text-ink-500 hover:border-ink-200 hover:bg-ink-50'
                      }`}
                    >
                      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${reason === r ? 'border-red-500 bg-red-500' : 'border-ink-200'}`}>
                        {reason === r && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </span>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5">
                  Additional details <span className="font-normal text-ink-200 normal-case">(optional)</span>
                </p>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="Describe what happened…"
                  className="w-full border border-ink-100 rounded-xl px-3.5 py-2.5 text-sm text-ink outline-none focus:border-ink transition-all resize-none"
                />
              </div>
              <button
                onClick={() => setAlsoBlock(v => !v)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all ${alsoBlock ? 'border-ink bg-ink-50' : 'border-ink-100 hover:bg-ink-50'}`}
              >
                <span className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-colors ${alsoBlock ? 'bg-ink' : 'border-2 border-ink-200'}`}>
                  {alsoBlock && <Check className="w-3 h-3 text-white" />}
                </span>
                <div>
                  <p className="text-sm font-medium text-ink">Also block {name}</p>
                  <p className="text-xs text-ink-300">They won&apos;t be able to send you new messages</p>
                </div>
              </button>
            </div>
            <div className="px-5 pb-5 flex gap-2.5">
              <button
                onClick={submit}
                disabled={!reason}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-40"
              >
                Submit report
              </button>
              <button onClick={onClose} className="flex-1 border border-ink-100 text-ink-400 text-sm font-medium py-2.5 rounded-xl hover:bg-ink-50 transition-colors">
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
