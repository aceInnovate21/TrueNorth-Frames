import { NextRequest, NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truenorthframes.vercel.app'

// Supabase redirects here after:
//   - Email confirmation (type=signup or type=recovery)
//   - Google OAuth login (no type param, has code)
// We hand off to the client-side confirm page which calls exchangeCodeForSession
// in the browser — the only way to properly set the session cookie.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const type  = searchParams.get('type') ?? ''
  const next  = searchParams.get('next') ?? ''

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/login?error=missing_code`)
  }

  // Hand off to the client-side confirm page with all params intact
  const params = new URLSearchParams({ code, type })
  if (next) params.set('next', next)
  return NextResponse.redirect(`${APP_URL}/auth/confirm?${params.toString()}`)
}
