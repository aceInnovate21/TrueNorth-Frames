'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'

const DEFAULT_SAVED = new Set(['sarah-chen', 'marcus-wright'])

export function SaveButton({ slug }: { slug: string }) {
  const [saved, setSaved] = useState(() => DEFAULT_SAVED.has(slug))
  const [pop, setPop] = useState(false)

  function toggle() {
    const next = !saved
    setSaved(next)
    if (next) {
      DEFAULT_SAVED.add(slug)
      setPop(true)
      setTimeout(() => setPop(false), 800)
    } else {
      DEFAULT_SAVED.delete(slug)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={toggle}
        aria-label={saved ? 'Remove from saved' : 'Save photographer'}
        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all ${
          saved
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-white border-ink-200 text-ink-500 hover:border-ink hover:text-ink'
        }`}
      >
        <Heart className={`w-4 h-4 transition-all ${saved ? 'fill-red-500 text-red-500' : ''}`} />
        {saved ? 'Saved' : 'Save'}
      </button>

      {/* Pop confirmation */}
      {pop && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-ink text-white text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap pointer-events-none animate-fade-in-up">
          Added to saved ✓
        </div>
      )}
    </div>
  )
}
