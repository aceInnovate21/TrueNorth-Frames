import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { DemoNav } from './demo-nav'

export const metadata: Metadata = {
  title: 'TrueNorth Frames — Demo',
  description: 'An interactive, click-through demo of the TrueNorth Frames platform, built for the product launch video.',
  robots: { index: false, follow: false },
}

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-ink antialiased">
      <DemoNav />
      {children}
    </div>
  )
}
