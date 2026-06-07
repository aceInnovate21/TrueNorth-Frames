import { NextRequest, NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truenorthframes.vercel.app'

// Supabase redirects here after:
//   - Email confirmation (token_hash + type=signup)
//   - Google OAuth login (code param, no type)
//   - Password recovery (token_hash + type=recovery)
// We forward ALL params to the client-side confirm page which handles each case.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code       = searchParams.get('code')
  const tokenHash  = searchParams.get('token_hash')
  const type       = searchParams.get('type') ?? ''
  const next       = searchParams.get('next') ?? ''

  // Must have at least one auth token
  if (!code && !tokenHash) {
    return NextResponse.redirect(`${APP_URL}/login?error=missing_token`)
  }

  // Forward everything to the client confirm page
  const params = new URLSearchParams()
  if (code)      params.set('code', code)
  if (tokenHash) params.set('token_hash', tokenHash)
  if (type)      params.set('type', type)
  if (next)      params.set('next', next)

  return NextResponse.redirect(`${APP_URL}/auth/confirm?${params.toString()}`)
}
