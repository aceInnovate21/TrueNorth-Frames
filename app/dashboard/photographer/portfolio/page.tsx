'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

// Portfolio management now lives solely in the dashboard's Portfolio tab.
// This standalone route redirects there so there is a single upload surface.
export default function PortfolioRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/dashboard/photographer?tab=portfolio')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-ink-50">
      <Loader2 className="w-6 h-6 animate-spin text-ink-300" />
    </div>
  )
}
