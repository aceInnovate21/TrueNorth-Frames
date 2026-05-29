'use client'

import { useState, useEffect } from 'react'
import { Heart, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  slug: string
  photographerId: string
}

export function SaveButton({ slug, photographerId }: Props) {
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pop, setPop] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const meRes = await fetch('/api/client/me')
      if (!meRes.ok) { setLoading(false); return }
      setIsClient(true)

      const savedRes = await fetch('/api/client/saved')
      if (savedRes.ok) {
        const data: { photographer_id: string }[] = await savedRes.json()
        setSaved(data.some((s) => s.photographer_id === photographerId))
      }
      setLoading(false)
    }
    check()
  }, [photographerId])

  async function toggle() {
    if (busy || loading) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      window.location.href = `/login?redirect=/photographers/${slug}`
      return
    }

    setBusy(true)
    if (saved) {
      const res = await fetch(`/api/client/saved?photographer_id=${photographerId}`, { method: 'DELETE' })
      if (res.ok) setSaved(false)
    } else {
      const res = await fetch('/api/client/saved', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photographer_id: photographerId }),
      })
      if (res.ok) {
        setSaved(true)
        setPop(true)
        setTimeout(() => setPop(false), 1500)
      }
    }
    setBusy(false)
  }

  // Hide for non-clients (photographers viewing another profile)
  if (!loading && !isClient) return null

  return (
    <div className="relative">
      <button
        onClick={toggle}
        disabled={loading || busy}
        aria-label={saved ? 'Remove from saved' : 'Save photographer'}
        className={`flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border transition-all disabled:opacity-60 ${
          saved
            ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
            : 'bg-white border-ink-200 text-ink-500 hover:border-ink hover:text-ink'
        }`}
      >
        {busy
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <Heart className={`w-4 h-4 transition-all ${saved ? 'fill-red-500 text-red-500' : ''}`} />
        }
        {saved ? 'Saved' : 'Save'}
      </button>

      {pop && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 bg-ink text-white text-[11px] font-medium px-3 py-1.5 rounded-full whitespace-nowrap pointer-events-none">
          Added to saved ✓
        </div>
      )}
    </div>
  )
}
