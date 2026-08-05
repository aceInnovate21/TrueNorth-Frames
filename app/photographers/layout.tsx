import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Browse Edmonton Photographers',
  description:
    'Browse and compare trusted Edmonton photographers by specialty, rating, price, and availability. Real Google reviews in one profile. Free to browse and book.',
  alternates: { canonical: '/photographers' },
  openGraph: {
    title: 'Browse Edmonton Photographers',
    description: 'Compare trusted Edmonton photographers by specialty, rating, and price.',
    url: '/photographers',
    type: 'website',
  },
}

export default function PhotographersLayout({ children }: { children: React.ReactNode }) {
  return children
}
