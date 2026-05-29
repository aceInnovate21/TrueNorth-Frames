'use client'

import { useState, useEffect } from 'react'
import {
  ChevronDown, ChevronUp, ExternalLink, Flag, Globe,
  Instagram, MessageSquare, Star, Send, CheckCircle2, AlertTriangle,
} from 'lucide-react'

import { PLATFORM_CONFIG } from '@/lib/platform-config'

// ─── Types ────────────────────────────────────────────────────────────────────

type ReviewSource = 'google' | 'instagram' | 'yelp' | 'internal'
type ReviewFlag = 'none' | 'flagged' | 'flag_resolved'

export interface Review {
  id: string
  source: ReviewSource
  author: string
  rating: number
  text: string
  date: string
  publicReply: string       // photographer's public reply (visible on profile)
  privateNote: string       // private internal note (only photographer sees)
  flag: ReviewFlag
  flagReason: string
  communicationRating?: number | null
  qualityRating?: number | null
  valueRating?: number | null
  punctualityRating?: number | null
}


// ─── Helpers ─────────────────────────────────────────────────────────────────

const SOURCE_META: Record<ReviewSource, { label: string; color: string; Icon: React.ElementType }> = {
  google:    { label: 'Google',    color: 'text-blue-600 bg-blue-50 border-blue-100',   Icon: Globe     },
  instagram: { label: 'Instagram', color: 'text-pink-600 bg-pink-50 border-pink-100',   Icon: Instagram },
  yelp:      { label: 'Yelp',      color: 'text-red-600 bg-red-50 border-red-100',      Icon: Globe     },
  internal:  { label: 'TrueNorth', color: 'text-ink-600 bg-ink-50 border-ink-100',      Icon: Star      },
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= rating ? 'text-amber-400 fill-amber-400' : 'text-ink-200'}`} />
      ))}
    </div>
  )
}

// ─── ReviewCard ───────────────────────────────────────────────────────────────

function ReviewCard({
  review,
  onSaveReply,
  onSaveNote,
  onFlag,
  onResolveFlag,
}: {
  review: Review
  onSaveReply: (reply: string) => void
  onSaveNote: (note: string) => void
  onFlag: (reason: string) => void
  onResolveFlag: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [replyDraft, setReplyDraft] = useState(review.publicReply)
  const [noteDraft, setNoteDraft] = useState(review.privateNote)
  const [flagDraft, setFlagDraft] = useState('')
  const [showFlagInput, setShowFlagInput] = useState(false)
  const [replySaved, setReplySaved] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)

  const meta = SOURCE_META[review.source]
  const Icon = meta.Icon
  const isLowRating = review.rating <= 2

  function saveReply() {
    onSaveReply(replyDraft)
    setReplySaved(true)
    setTimeout(() => setReplySaved(false), 2000)
  }

  function saveNote() {
    onSaveNote(noteDraft)
    setNoteSaved(true)
    setTimeout(() => setNoteSaved(false), 2000)
  }

  function submitFlag() {
    if (!flagDraft.trim()) return
    onFlag(flagDraft.trim())
    setShowFlagInput(false)
    setFlagDraft('')
  }

  return (
    <div className={`bg-white rounded-2xl overflow-hidden border transition-all ${
      review.flag === 'flagged' ? 'border-amber-200' :
      review.flag === 'flag_resolved' ? 'border-ink-100' :
      isLowRating ? 'border-red-100' : 'border-ink-100'
    }`}>
      {/* Header — always visible */}
      <div className="flex items-start gap-3 p-4">
        <div className="w-9 h-9 rounded-full bg-ink-100 flex items-center justify-center text-ink-500 text-xs font-bold flex-shrink-0">
          {review.author[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-sm font-semibold text-ink">{review.author}</p>
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border flex items-center gap-1 ${meta.color}`}>
              <Icon className="w-2.5 h-2.5" /> {meta.label}
            </span>
            {/* Always-public badge */}
            <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-2.5 h-2.5" /> Public
            </span>
            {review.flag === 'flagged' && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                <Flag className="w-2.5 h-2.5" /> Flagged for admin
              </span>
            )}
            {review.flag === 'flag_resolved' && (
              <span className="text-[10px] text-ink-300 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> Flag resolved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <Stars rating={review.rating} />
            <span className="text-[10px] text-ink-300">{review.date}</span>
          </div>
          <p className="text-sm text-ink-500 leading-relaxed line-clamp-2">{review.text}</p>
          {/* Public reply preview when collapsed */}
          {!expanded && review.publicReply && (
            <p className="text-xs text-ink-400 mt-1.5 italic line-clamp-1">
              Your reply: {review.publicReply}
            </p>
          )}
        </div>

        <button
          onClick={() => setExpanded(v => !v)}
          className="p-1.5 rounded-lg hover:bg-ink-50 transition-colors text-ink-300 flex-shrink-0"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-ink-50 pt-4">
          {/* Full review */}
          <p className="text-sm text-ink-500 leading-relaxed">{review.text}</p>

          {/* Sub-ratings from client */}
          {(() => {
            const subs = [
              { label: 'Communication', value: review.communicationRating },
              { label: 'Quality',       value: review.qualityRating },
              { label: 'Punctuality',   value: review.punctualityRating },
              { label: 'Value',         value: review.valueRating },
            ].filter(s => s.value != null)
            if (!subs.length) return null
            return (
              <div className="bg-ink-50/60 rounded-xl px-3 py-3 space-y-2">
                {subs.map(s => (
                  <div key={s.label} className="flex items-center gap-3">
                    <span className="text-[11px] text-ink-400 w-24 flex-shrink-0">{s.label}</span>
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} className={`w-3 h-3 ${n <= (s.value ?? 0) ? 'text-amber-400 fill-amber-400' : 'text-ink-200'}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-ink-300 ml-0.5">
                      {['','Poor','Fair','Good','Great','Excellent'][s.value ?? 0]}
                    </span>
                  </div>
                ))}
              </div>
            )
          })()}

          {/* Low-rating nudge */}
          {isLowRating && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 leading-relaxed">
                This review is <strong>always visible publicly.</strong> A professional reply lets clients see your side of the story.
              </p>
            </div>
          )}

          {/* Public reply */}
          <div>
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-ink-400" />
                <p className="text-xs font-semibold text-ink">Public reply <span className="text-ink-300 font-normal">(shown on your profile below the review)</span></p>
              </div>
              {replyDraft.length > PLATFORM_CONFIG.max_review_reply_length - 100 && (
                <span className={`text-xs flex-shrink-0 ${replyDraft.length >= PLATFORM_CONFIG.max_review_reply_length ? 'text-red-500' : 'text-amber-500'}`}>
                  {replyDraft.length}/{PLATFORM_CONFIG.max_review_reply_length}
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={replyDraft}
              onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_review_reply_length) setReplyDraft(e.target.value) }}
              maxLength={PLATFORM_CONFIG.max_review_reply_length}
              placeholder="Write a professional reply visible to all clients viewing your profile…"
              className="w-full border border-ink-100 rounded-xl px-4 py-3 text-sm text-ink placeholder-ink-200 outline-none focus:border-ink resize-none transition-all"
            />
            <div className="flex items-center justify-between mt-2">
              <p className="text-[10px] text-ink-300">Replies appear publicly under the review — keep it professional</p>
              <button
                onClick={saveReply}
                disabled={replyDraft === review.publicReply}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                  replySaved
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-ink text-white hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <Send className="w-3 h-3" />
                {replySaved ? 'Saved' : 'Save reply'}
              </button>
            </div>
          </div>

          {/* Private note */}
          <div className="bg-ink-50 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-ink-400 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" /> Private note — only you see this
              </p>
              {noteDraft.length > PLATFORM_CONFIG.max_review_private_note_length - 80 && (
                <span className={`text-[10px] ${noteDraft.length >= PLATFORM_CONFIG.max_review_private_note_length ? 'text-red-500' : 'text-amber-500'}`}>
                  {noteDraft.length}/{PLATFORM_CONFIG.max_review_private_note_length}
                </span>
              )}
            </div>
            <textarea
              rows={2}
              value={noteDraft}
              onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_review_private_note_length) setNoteDraft(e.target.value) }}
              maxLength={PLATFORM_CONFIG.max_review_private_note_length}
              placeholder="Add context for your own records…"
              className="w-full text-xs border border-ink-100 rounded-lg px-3 py-2 outline-none focus:border-ink resize-none bg-white text-ink-500 placeholder-ink-200"
            />
            <button
              onClick={saveNote}
              disabled={noteDraft === review.privateNote}
              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${
                noteSaved
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-ink text-white hover:bg-ink-800 disabled:opacity-40 disabled:cursor-not-allowed'
              }`}
            >
              {noteSaved ? '✓ Saved' : 'Save note'}
            </button>
          </div>

          {/* Flag for admin */}
          {review.flag === 'none' && (
            <div>
              {showFlagInput ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-ink-400">Why are you flagging this review?</p>
                    {flagDraft.length > PLATFORM_CONFIG.max_flag_reason_length - 80 && (
                      <span className={`text-[10px] ${flagDraft.length >= PLATFORM_CONFIG.max_flag_reason_length ? 'text-red-500' : 'text-amber-500'}`}>
                        {flagDraft.length}/{PLATFORM_CONFIG.max_flag_reason_length}
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={2}
                    value={flagDraft}
                    onChange={e => { if (e.target.value.length <= PLATFORM_CONFIG.max_flag_reason_length) setFlagDraft(e.target.value) }}
                    maxLength={PLATFORM_CONFIG.max_flag_reason_length}
                    placeholder="e.g. Fake review, defamatory content, wrong business…"
                    className="w-full text-xs border border-amber-200 rounded-xl px-3 py-2.5 outline-none focus:border-amber-400 resize-none text-ink placeholder-ink-200"
                  />
                  <div className="flex gap-2">
                    <button onClick={submitFlag} disabled={!flagDraft.trim()}
                      className="text-xs font-semibold bg-amber-500 text-white px-3 py-1.5 rounded-lg hover:bg-amber-600 disabled:opacity-40 transition-colors"
                    >
                      Submit flag to admin
                    </button>
                    <button onClick={() => { setShowFlagInput(false); setFlagDraft('') }}
                      className="text-xs text-ink-400 hover:text-ink px-2"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowFlagInput(true)}
                  className="flex items-center gap-1.5 text-xs text-ink-300 hover:text-amber-600 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Flag as fake or inappropriate — send to admin
                </button>
              )}
            </div>
          )}

          {review.flag === 'flagged' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 space-y-1.5">
              <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5"><Flag className="w-3.5 h-3.5" /> Flagged — admin review pending</p>
              <p className="text-[10px] text-amber-600">{review.flagReason}</p>
              <p className="text-[10px] text-amber-500">The review remains public until admin makes a decision. You'll be notified of the outcome.</p>
              <button onClick={onResolveFlag}
                className="text-[10px] font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900"
              >
                Withdraw flag
              </button>
            </div>
          )}

          {review.flag === 'flag_resolved' && (
            <p className="text-[10px] text-ink-300 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Flag resolved by admin
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────

type FilterType = 'all' | 'low_rating' | 'replied' | 'flagged' | 'no_reply'

export function ReviewManager() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/photographer/reviews')
      .then(r => r.ok ? r.json() : [])
      .then((data: Review[]) => setReviews(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function saveReply(id: string, reply: string) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, publicReply: reply } : r))
    fetch('/api/photographer/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'reply', public_reply: reply }),
    }).catch(() => {})
  }

  function saveNote(id: string, note: string) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, privateNote: note } : r))
    fetch('/api/photographer/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'note', private_note: note }),
    }).catch(() => {})
  }

  function flagReview(id: string, reason: string) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, flag: 'flagged', flagReason: reason } : r))
    fetch('/api/photographer/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'flag', flag_reason: reason }),
    }).catch(() => {})
  }

  function resolveFlag(id: string) {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, flag: 'none', flagReason: '' } : r))
    fetch('/api/photographer/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'unflag' }),
    }).catch(() => {})
  }

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  const lowCount = reviews.filter(r => r.rating <= 2).length
  const noReplyCount = reviews.filter(r => !r.publicReply).length
  const flaggedCount = reviews.filter(r => r.flag === 'flagged').length

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all',        label: `All (${reviews.length})` },
    { key: 'no_reply',   label: `No reply (${noReplyCount})` },
    { key: 'low_rating', label: `Low rating (${lowCount})` },
    { key: 'flagged',    label: `Flagged (${flaggedCount})` },
    { key: 'replied',    label: `Replied (${reviews.filter(r => !!r.publicReply).length})` },
  ]

  const visible = filter === 'all' ? reviews
    : filter === 'low_rating' ? reviews.filter(r => r.rating <= 2)
    : filter === 'replied'    ? reviews.filter(r => !!r.publicReply)
    : filter === 'flagged'    ? reviews.filter(r => r.flag === 'flagged')
    : reviews.filter(r => !r.publicReply)

  return (
    <div className="space-y-5">

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total reviews', value: reviews.length.toString() },
          { label: 'Avg rating',    value: `★ ${avgRating}` },
          { label: 'Need reply',    value: noReplyCount.toString() },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl px-4 py-3 text-center border border-ink-100">
            <p className="font-bold text-ink text-lg">{s.value}</p>
            <p className="text-ink-300 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Policy notice */}
      <div className="bg-ink-50 rounded-xl px-4 py-3 text-xs text-ink-500 leading-relaxed border border-ink-100">
        <strong className="text-ink">All reviews are always public.</strong> You can reply publicly to give clients your perspective — especially useful for low ratings. Flag a review to send it to admin if you believe it violates our guidelines.
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-ink-100 overflow-x-auto">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 text-xs font-medium py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
              filter === f.key ? 'bg-ink text-white' : 'text-ink-400 hover:text-ink'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Review list */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse bg-ink-50 rounded-2xl h-28" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <p className="text-sm text-ink-300 text-center py-8">
            {reviews.length === 0 ? 'No reviews yet — link your Google, Instagram or Yelp profiles to get started.' : 'No reviews in this category.'}
          </p>
        ) : (
          visible.map(r => (
            <ReviewCard
              key={r.id}
              review={r}
              onSaveReply={reply => saveReply(r.id, reply)}
              onSaveNote={note => saveNote(r.id, note)}
              onFlag={reason => flagReview(r.id, reason)}
              onResolveFlag={() => resolveFlag(r.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}
