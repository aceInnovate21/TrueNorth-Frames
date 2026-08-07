import { NextRequest, NextResponse } from 'next/server'
import { TNF_EMBLEM_DATA_URI } from '@/lib/tnf-emblem'

// GET /api/badge/[username]?theme=dark|light&style=featured|book
// Returns a self-contained SVG badge photographers can embed on their own site
// (Wix / Squarespace / WordPress). Real vector, themeable, no external assets.
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  await params // username not needed for rendering; the link lives in the embed snippet
  const theme = req.nextUrl.searchParams.get('theme') === 'light' ? 'light' : 'dark'
  const style = req.nextUrl.searchParams.get('style') === 'book' ? 'book' : 'featured'

  const label = style === 'book' ? 'Book me on' : 'Featured on'
  const brand = 'True North Frames'

  const c = theme === 'dark'
    ? { bg: '#171717', fg: '#ffffff', sub: '#a3a3a3', ring: '#2a2a2a', chipRing: 'rgba(255,255,255,0.12)' }
    : { bg: '#ffffff', fg: '#171717', sub: '#737373', ring: '#e5e5e5', chipRing: '#e5e5e5' }

  const W = 280, H = 64, R = 14
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label} ${brand}">
  <rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="${R}" fill="${c.bg}" stroke="${c.ring}"/>
  <circle cx="34" cy="32" r="18" fill="#ffffff" stroke="${c.chipRing}"/>
  <image href="${TNF_EMBLEM_DATA_URI}" x="20.5" y="18.5" width="27" height="27" preserveAspectRatio="xMidYMid meet"/>
  <text x="66" y="27" font-family="-apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" font-size="11" font-weight="600" letter-spacing="0.4" fill="${c.sub}">${label.toUpperCase()}</text>
  <text x="66" y="46" font-family="Georgia, 'Times New Roman', serif" font-size="18" font-weight="700" fill="${c.fg}">${brand}</text>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}
