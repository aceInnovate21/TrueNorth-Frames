'use client'

import { Paperclip, X, FileVideo, File } from 'lucide-react'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatSize(bytes: number | null): string {
  if (bytes === null || bytes === undefined) return ''
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// ─── AttachmentBubble ─────────────────────────────────────────────────────────

interface AttachmentBubbleProps {
  url: string
  type: string
  name: string | null
  size: number | null
  fromMe: boolean
}

export function AttachmentBubble({ url, type, name, size, fromMe }: AttachmentBubbleProps) {
  if (type === 'image') {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name ?? 'attachment'}
        className="rounded-xl max-w-[260px] max-h-[200px] object-cover cursor-pointer mt-1"
        onClick={() => window.open(url, '_blank')}
      />
    )
  }

  if (type === 'video') {
    return (
      <video
        src={url}
        controls
        className="rounded-xl max-w-[260px] max-h-[200px] mt-1"
      />
    )
  }

  // PDF or any other file — pill download link
  return (
    <a
      href={url}
      download={name ?? true}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-xl border max-w-[260px] transition-colors ${
        fromMe
          ? 'border-white/20 bg-white/10 hover:bg-white/20 text-white'
          : 'border-ink-100 bg-ink-50 hover:bg-ink-100 text-ink'
      }`}
    >
      <Paperclip className="w-4 h-4 flex-shrink-0 opacity-70" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate">{name ?? 'File'}</p>
        {size !== null && <p className="text-[10px] opacity-60">{formatSize(size)}</p>}
      </div>
    </a>
  )
}

// ─── AttachmentPreview ────────────────────────────────────────────────────────

interface AttachmentPreviewProps {
  file: File
  onRemove: () => void
}

export function AttachmentPreview({ file, onRemove }: AttachmentPreviewProps) {
  const isImage = file.type.startsWith('image/')
  const isVideo = file.type.startsWith('video/')

  return (
    <div className="flex items-center gap-2 mb-2 px-3 py-2 bg-ink-50 rounded-xl border border-ink-100">
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={URL.createObjectURL(file)}
          alt={file.name}
          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
        />
      ) : isVideo ? (
        <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0">
          <FileVideo className="w-5 h-5 text-ink-400" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-ink-100 flex items-center justify-center flex-shrink-0">
          <File className="w-5 h-5 text-ink-400" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-ink truncate">{file.name}</p>
        <p className="text-[10px] text-ink-400">{formatSize(file.size)}</p>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="w-6 h-6 rounded-lg hover:bg-ink-200 flex items-center justify-center transition-colors flex-shrink-0"
        aria-label="Remove attachment"
      >
        <X className="w-3.5 h-3.5 text-ink-400" />
      </button>
    </div>
  )
}
