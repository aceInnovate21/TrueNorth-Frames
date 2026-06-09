import { NextRequest, NextResponse } from 'next/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truenorthframes.vercel.app'

// Handles email confirmation links only (token_hash + type=signup).
// Google OAuth uses /auth/google/callback instead.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type      = searchParams.get('type') ?? ''

  if (!tokenHash) {
    return NextResponse.redirect(`${APP_URL}/login?error=missing_token`)
  }

  const params = new URLSearchParams()
  params.set('token_hash', tokenHash)
  if (type) params.set('type', type)

  return NextResponse.redirect(`${APP_URL}/auth/confirm?${params.toString()}`)
}
