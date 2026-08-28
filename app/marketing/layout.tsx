import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'TrueNorth Frames — The Film',
  description:
    'A scroll-driven product film for TrueNorth Frames. Edmonton’s two-sided photographer marketplace — proof, and bookings.',
  robots: { index: false, follow: false },
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return children
}
