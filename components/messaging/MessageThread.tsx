'use client'

import { useEffect, useRef } from 'react'
import { Loader2 } from 'lucide-react'
import { AttachmentBubble } from '@/components/message-attachment'
import { Avatar, BookingBubble, Tick } from './ui'
import { formatMsgTime, isBookingMessage } from './helpers'
import type { UIMessage, ThreadPeer } from './types'

// Shared scrollable thread body used by client and photographer alike.
// Renders booking cards, grouped bubbles, per-sender labels (groups) and attachments.

export function MessageThread({
  messages, peer, loading, emptyState, showTicks = true,
}: {
  messages: UIMessage[]
  peer: ThreadPeer
  loading?: boolean
  emptyState?: React.ReactNode
  showTicks?: boolean
}) {
  const endRef = useRef<HTMLDivElement>(null)
  const paneRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (paneRef.current) paneRef.current.scrollTop = paneRef.current.scrollHeight
  }, [messages.length])

  return (
    <div ref={paneRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 bg-ink-50/30 space-y-1">
      {loading && (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-5 h-5 animate-spin text-ink-300" />
        </div>
      )}

      {!loading && messages.length === 0 && (emptyState ?? (
        <p className="text-center text-xs text-ink-300 pt-8">No messages yet</p>
      ))}

      {!loading && messages.map((msg, i) => {
        if (msg.isSystem && isBookingMessage(msg.text)) {
          return (
            <div key={msg.id} className="flex justify-center my-3">
              <BookingBubble text={msg.text} />
            </div>
          )
        }
        if (msg.isSystem) {
          return (
            <div key={msg.id} className="flex justify-center py-2 mt-4">
              <span className="text-[11px] text-ink-400 bg-ink-50 border border-ink-100 px-3 py-1.5 rounded-full text-center max-w-xs">
                {msg.text}
              </span>
            </div>
          )
        }

        const fromMe = msg.from === 'me'
        const prev = messages[i - 1]
        const next = messages[i + 1]
        // Group consecutive bubbles from the same sender.
        const sameAsPrev = prev && !prev.isSystem && prev.from === msg.from &&
          (msg.senderName ? prev.senderName === msg.senderName : true)
        const sameAsNext = next && !next.isSystem && next.from === msg.from &&
          (msg.senderName ? next.senderName === msg.senderName : true)
        const isLastInGroup = !sameAsNext

        // "them" avatar identity — per-message (groups) or the thread peer (1:1)
        const themInitials = msg.senderInitials ?? peer.initials
        const themBg = msg.senderBg ?? peer.bg
        const themAvatar = msg.senderInitials ? null : peer.avatarUrl

        return (
          <div
            key={msg.id}
            className={`flex items-end gap-2 ${fromMe ? 'justify-end' : 'justify-start'} ${sameAsPrev ? 'mt-0.5' : 'mt-4'}`}
          >
            {!fromMe && (
              <div className="w-7 h-7 flex-shrink-0 mb-1">
                {isLastInGroup && (
                  <Avatar avatarUrl={themAvatar} initials={themInitials} bg={themBg} size={28} rounded="rounded-lg" />
                )}
              </div>
            )}

            <div className={`flex flex-col ${fromMe ? 'items-end' : 'items-start'} max-w-[72%] sm:max-w-[60%]`}>
              {/* group sender name at the start of a run */}
              {!fromMe && msg.senderName && !sameAsPrev && (
                <p className="text-[10px] text-ink-400 mb-0.5 px-1">{msg.senderName}</p>
              )}
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  fromMe ? 'bg-ink text-white rounded-br-sm' : 'bg-white text-ink border border-ink-100 rounded-bl-sm'
                }`}
                style={{ boxShadow: fromMe ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}
              >
                {msg.text}
                {msg.attachmentUrl && (
                  <AttachmentBubble
                    url={msg.attachmentUrl}
                    type={msg.attachmentType ?? ''}
                    name={msg.attachmentName}
                    size={msg.attachmentSize}
                    fromMe={fromMe}
                  />
                )}
              </div>
              {isLastInGroup && (
                <div className={`flex items-center gap-1 mt-1.5 ${fromMe ? 'flex-row-reverse' : ''}`}>
                  <span className="text-[10px] text-ink-200">{formatMsgTime(msg.time)}</span>
                  {fromMe && showTicks && <Tick status={msg.status ?? 'sent'} />}
                </div>
              )}
            </div>
          </div>
        )
      })}
      <div ref={endRef} />
    </div>
  )
}
