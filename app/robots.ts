import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

// Serves /robots.txt. Public marketing + profile pages are crawlable; anything
// auth-gated (which 301s to /login for Googlebot and shows up as "Page with
// redirect" in Search Console) or API-only is disallowed so Google never wastes
// crawl budget on it.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard',
          '/admin',
          '/messages',
          '/onboarding',
          '/auth/',
          '/login',
          '/signup',
          '/error',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
