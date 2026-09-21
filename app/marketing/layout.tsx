import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'TrueNorth Frames — Demo',
  description: 'An interactive, click-through demo of the TrueNorth Frames platform, built for the product launch video.',
  robots: { index: false, follow: false },
}

// Each page brings its own shell — client pages use SiteNav + SiteFooter, the
// dashboard uses its own sidebar layout — exactly like production.
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return children
}
