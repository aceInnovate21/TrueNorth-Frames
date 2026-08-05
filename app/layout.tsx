import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { SITE_URL, SITE_NAME, absoluteUrl } from '@/lib/site'

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
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TrueNorth Frames — Edmonton Photographer Marketplace',
    template: '%s — TrueNorth Frames',
  },
  description:
    'Find, discover, and book talented Edmonton photographers. Real reviews from Google in one trusted profile. Free to browse and message.',
  keywords: ['Edmonton photographer', 'wedding photographer Edmonton', 'portrait photographer Edmonton', 'photography marketplace'],
  applicationName: SITE_NAME,
  // Default canonical is the site root; pages override with their own path.
  // This alone resolves "Duplicate without user-selected canonical" for the
  // pages that don't declare a more specific one.
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'TrueNorth Frames — Edmonton Photographer Marketplace',
    description: 'Find your perfect Edmonton photographer. Free to browse and message directly.',
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: 'en_CA',
    type: 'website',
    images: [{ url: absoluteUrl('/logo.png'), width: 1200, height: 630, alt: SITE_NAME }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TrueNorth Frames — Edmonton Photographer Marketplace',
    description: 'Find your perfect Edmonton photographer. Free to browse and message directly.',
    images: [absoluteUrl('/logo.png')],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: SITE_NAME,
              url: SITE_URL,
              logo: absoluteUrl('/logo.png'),
              description:
                'A marketplace to find, compare, and book trusted Edmonton photographers.',
              areaServed: { '@type': 'City', name: 'Edmonton' },
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-white antialiased">{children}</body>
    </html>
  )
}
