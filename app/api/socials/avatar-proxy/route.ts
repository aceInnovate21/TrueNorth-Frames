import { NextRequest, NextResponse } from 'next/server'

// GET /api/socials/avatar-proxy?url=<remote avatar>
// Same-origin proxy for the photographer avatar so html-to-image can embed it
// in downloaded QR graphics without hitting cross-origin/tainted-canvas issues.
// Locked to our known image hosts so it can't be used as an open proxy.
const ALLOWED_HOST_SUFFIXES = ['.r2.dev', '.cloudflare.com', 'r2.cloudflarestorage.com']

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  let host: string
  try {
    host = new URL(url).hostname
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  const allowed = ALLOWED_HOST_SUFFIXES.some((s) => host === s.replace(/^\./, '') || host.endsWith(s))
  if (!allowed) return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })

  const upstream = await fetch(url, { cache: 'no-store' }).catch(() => null)
  if (!upstream || !upstream.ok) return NextResponse.json({ error: 'Fetch failed' }, { status: 502 })

  const contentType = upstream.headers.get('content-type') ?? 'image/jpeg'
  const buf = await upstream.arrayBuffer()
  return new NextResponse(buf, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
    },
  })
}
