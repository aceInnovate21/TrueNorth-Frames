import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Compare Photographers',
  description:
    'Compare Edmonton photographers side by side — packages, pricing, ratings, and verified reviews — to find the right fit for your session.',
  alternates: { canonical: '/compare' },
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children
}
