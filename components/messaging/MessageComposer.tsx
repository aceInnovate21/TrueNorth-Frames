'use client'

import { useRef } from 'react'
import { Send, Smile, Paperclip, Loader2, Clock } from 'lucide-react'
import { AttachmentPreview } from '@/components/message-attachment'
import { EmojiPicker } from './ui'

// Shared message composer: textarea + emoji + attachment + optional rate-limit meter.
// When `disabledNode` is provided it replaces the input entirely (blocked/frozen states).

export function MessageComposer({
  value, onChange, onSend, maxLength, placeholder,
  sending = false, uploading = false,
  showEmoji, onToggleEmoji,
  pendingFile, onPickFile, onRemoveFile,
  rateRemaining, rateWarnThreshold, atRateLimit = false,
  disabledNode,
}: {
  value: string
  onChange: (v: string) => void
  onSend: () => void
  maxLength: number
  placeholder: string
  sending?: boolean
  uploading?: boolean
  showEmoji: boolean
  onToggleEmoji: (v: boolean) => void
  pendingFile: File | null
  onPickFile: (f: File) => void
  onRemoveFile: () => void
  rateRemaining?: number
  rateWarnThreshold?: number
  atRateLimit?: boolean
  disabledNode?: React.ReactNode
}) {
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const charsLeft = maxLength - value.length
  const nearLimit = charsLeft <= 100
  const showRateWarning =
    rateRemaining !== undefined && rateWarnThreshold !== undefined && rateRemaining <= rateWarnThreshold

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend()
    }
  }

  if (disabledNode) {
    return <div className="bg-white border-t border-ink-100 px-4 sm:px-5 py-3 flex-shrink-0">{disabledNode}</div>
  }

  return (
    <div className="bg-white border-t border-ink-100 px-4 sm:px-5 py-3 flex-shrink-0">
      {showRateWarning && (
        <div className="flex items-center gap-1.5 mb-2.5 px-1">
          <Clock className="w-3 h-3 text-amber-500 flex-shrink-0" />
          <p className="text-[11px] text-amber-600">
            {atRateLimit
              ? 'Hourly message limit reached. Reset in under an hour.'
              : `${rateRemaining} message${rateRemaining === 1 ? '' : 's'} remaining this hour`}
          </p>
        </div>
      )}

      {pendingFile && <AttachmentPreview file={pendingFile} onRemove={onRemoveFile} />}

      <div className="flex items-end gap-2.5">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-9 h-9 rounded-xl border border-ink-100 flex items-center justify-center hover:bg-ink-50 transition-colors flex-shrink-0 mb-0.5"
        >
          <Paperclip className="w-4 h-4 text-ink-400" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*,.pdf"
          className="hidden"
          onChange={e => {
            const f = e.target.files?.[0]
            if (f) onPickFile(f)
            e.target.value = ''
          }}
        />

        <div className="flex-1 relative">
          {showEmoji && (
            <EmojiPicker
              onPick={e => {
                if (value.length < maxLength) onChange(value + e)
                inputRef.current?.focus()
              }}
              onClose={() => onToggleEmoji(false)}
            />
          )}
          <div
            className={`flex items-end gap-2 border rounded-2xl px-4 py-2.5 focus-within:ring-2 transition-all ${
              atRateLimit
                ? 'border-amber-200 bg-amber-50/50 focus-within:ring-amber-100'
                : 'border-ink-100 focus-within:border-ink focus-within:ring-ink/10'
            }`}
            style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
          >
            <textarea
              ref={inputRef}
              rows={1}
              value={value}
              disabled={atRateLimit}
              onChange={e => {
                if (e.target.value.length > maxLength) return
                onChange(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKey}
              placeholder={atRateLimit ? 'Hourly limit reached — try again shortly' : placeholder}
              className="flex-1 bg-transparent text-ink text-sm placeholder-ink-300 outline-none resize-none leading-relaxed disabled:cursor-not-allowed"
              style={{ minHeight: 24, maxHeight: 120 }}
            />
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {nearLimit && (
                <span className={`text-[10px] font-medium tabular-nums ${charsLeft <= 0 ? 'text-red-500' : 'text-amber-500'}`}>
                  {charsLeft}
                </span>
              )}
              <button
                type="button"
                onClick={() => onToggleEmoji(!showEmoji)}
                className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
                  showEmoji ? 'bg-ink-100 text-ink' : 'text-ink-300 hover:text-ink hover:bg-ink-50'
                }`}
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={(!value.trim() && !pendingFile) || atRateLimit || sending || uploading}
          className="w-9 h-9 rounded-xl bg-ink hover:bg-ink-800 flex items-center justify-center transition-colors flex-shrink-0 mb-0.5 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {sending || uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  )
}
