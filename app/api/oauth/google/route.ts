import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { exchangeGoogleCode } from '@/lib/trust/fetchers/google'

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/google`

export async function GET(request: NextRequest) {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (code) {
    const result = await exchangeGoogleCode(code, REDIRECT_URI)
    if ('error' in result) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_error=google&msg=${encodeURIComponent(result.error)}`
      )
    }

    const db = adminDb as any
    const { data: profile } = await db
      .from('photographer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      console.error('[oauth/google] No photographer profile for user', user.id)
      return serverError('Profile not found')
    }

    // Build upsert payload — only include refresh_token if present
    // (Google omits it on re-auth unless prompt=consent forces it)
    const tokenPayload: Record<string, any> = {
      photographer_id:   profile.id,
      platform:          'google',
      access_token:      result.accessToken,
      token_expires_at:  result.expiresAt.toISOString(),
      is_active:         true,
      connected_at:      new Date().toISOString(),
      last_refreshed_at: new Date().toISOString(),
    }
    if (result.refreshToken) tokenPayload.refresh_token = result.refreshToken

    const { error: upsertError } = await db
      .from('platform_oauth_tokens')
      .upsert(tokenPayload, { onConflict: 'photographer_id,platform' })

    if (upsertError) {
      console.error('[oauth/google] upsert error:', upsertError)
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_error=google&msg=${encodeURIComponent(upsertError.message)}`
      )
    }

    console.log('[oauth/google] token stored for photographer', profile.id)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_connected=google`
    )
  }

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_error=google&msg=${encodeURIComponent(error)}`
    )
  }

  const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
  authUrl.searchParams.set('client_id',     process.env.GOOGLE_CLIENT_ID!)
  authUrl.searchParams.set('redirect_uri',  REDIRECT_URI)
  authUrl.searchParams.set('response_type', 'code')
  authUrl.searchParams.set('scope',         'https://www.googleapis.com/auth/business.manage')
  authUrl.searchParams.set('access_type',   'offline')
  authUrl.searchParams.set('prompt',        'consent')   // force refresh_token

  return NextResponse.redirect(authUrl.toString())
}

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
    .eq('platform', 'google')

  return NextResponse.json({ success: true })
}
