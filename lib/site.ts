// Central SEO / site-URL config.
//
// SITE_URL is the single canonical origin for the site. Every canonical tag,
// sitemap URL, and absolute OG URL derives from this value so Google only ever
// sees one host — fixing the "Duplicate without user-selected canonical" issue
// that arises when www and apex both resolve without a declared canonical.
//
// Precedence: explicit NEXT_PUBLIC_APP_URL wins (set it in prod), otherwise we
// fall back to the production www host. Trailing slashes are stripped so paths
// concatenate cleanly.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || 'https://www.thetruenorthframes.com'
).replace(/\/+$/, '')

export const SITE_NAME = 'TrueNorth Frames'

/** Build an absolute URL for a site-relative path. */
export function absoluteUrl(path = '/'): string {
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
