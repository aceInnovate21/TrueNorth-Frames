import { NextRequest, NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truenorthframes.vercel.app'

// Supabase redirects here after email confirmation.
// We pass the code to a client-side page that calls exchangeCodeForSession
// in the browser — this is the only way to properly set the session cookie.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const type  = searchParams.get('type') ?? ''

  if (!code) {
    return NextResponse.redirect(`${APP_URL}/login?error=missing_code`)
  }

  // Hand off to the client-side confirm page with the code intact
  const params = new URLSearchParams({ code, type })
  return NextResponse.redirect(`${APP_URL}/auth/confirm?${params.toString()}`)
}
