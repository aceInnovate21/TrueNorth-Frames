'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// The standalone thread page has been merged into the unified /messages inbox.
// This route now redirects to /messages?conv={id} so existing links, bookmarks,
// and notification deep-links continue to work.
export default function LegacyThreadRedirect() {
  const params = useParams()
  const router = useRouter()
  const conversationId = typeof params.slug === 'string' ? params.slug : ''

  useEffect(() => {
    router.replace(conversationId ? `/messages?conv=${conversationId}` : '/messages')
  }, [conversationId, router])

  return (
    <div className="h-screen flex items-center justify-center bg-white">
      <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
    </div>
  )
}
