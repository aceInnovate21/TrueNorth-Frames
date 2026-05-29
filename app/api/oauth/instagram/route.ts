import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { exchangeInstagramCode } from '@/lib/trust/fetchers/instagram'

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram`

// GET — initiates OAuth flow (redirect to Instagram) OR handles callback
export async function GET(request: NextRequest) {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  // ── Callback from Instagram ──────────────────────────────────────────────
  if (code) {
    const result = await exchangeInstagramCode(code, REDIRECT_URI)
    if ('error' in result) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_error=instagram&msg=${encodeURIComponent(result.error)}`
      )
    }

    const db = adminDb as any
    const { data: profile } = await db
      .from('photographer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) return serverError('Profile not found')

    await db.from('platform_oauth_tokens').upsert({
      photographer_id:   profile.id,
      platform:          'instagram',
      access_token:      result.accessToken,
      platform_user_id:  result.userId,
      is_active:         true,
      connected_at:      new Date().toISOString(),
      // Instagram long-lived tokens last 60 days
      token_expires_at:  new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    }, { onConflict: 'photographer_id,platform' })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_connected=instagram`
    )
  }

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_error=instagram&msg=${encodeURIComponent(error)}`
    )
  }

  // ── Initiate OAuth flow ──────────────────────────────────────────────────
  const authUrl = new URL('https://api.instagram.com/oauth/authorize')
  authUrl.searchParams.set('client_id',     process.env.INSTAGRAM_APP_ID!)
  authUrl.searchParams.set('redirect_uri',  REDIRECT_URI)
  authUrl.searchParams.set('scope',         'instagram_basic,instagram_manage_insights')
  authUrl.searchParams.set('response_type', 'code')

  return NextResponse.redirect(authUrl.toString())
}

// DELETE — disconnect Instagram
export async function DELETE() {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()
  const db = adminDb as any

  const { data: profile } = await db
    .from('photographer_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!profile) return serverError('Profile not found')

  await db.from('platform_oauth_tokens')
    .update({ is_active: false })
    .eq('photographer_id', profile.id)
    .eq('platform', 'instagram')

  return NextResponse.json({ success: true })
}
