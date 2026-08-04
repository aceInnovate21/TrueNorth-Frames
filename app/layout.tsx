import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'TrueNorth Frames — Edmonton Photographer Marketplace',
  description:
    'Find, discover, and book talented Edmonton photographers. Real reviews from Google in one trusted profile. Completely free.',
  keywords: ['Edmonton photographer', 'wedding photographer Edmonton', 'portrait photographer Edmonton', 'photography marketplace'],
  openGraph: {
    title: 'TrueNorth Frames — Edmonton Photographer Marketplace',
    description: 'Find your perfect Edmonton photographer. Free to browse, free to book.',
    locale: 'en_CA',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  )
}
