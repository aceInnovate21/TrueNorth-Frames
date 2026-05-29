import { NextRequest, NextResponse } from 'next/server'
import { getServerSession, unauthorized, serverError } from '@/lib/api-helpers'
import { exchangeFacebookCode } from '@/lib/trust/fetchers/facebook'

const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/facebook`

export async function GET(request: NextRequest) {
  const { user, adminDb } = await getServerSession()
  if (!user) return unauthorized()

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (code) {
    const result = await exchangeFacebookCode(code, REDIRECT_URI)
    if ('error' in result) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_error=facebook&msg=${encodeURIComponent(result.error)}`
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
      platform:          'facebook',
      access_token:      result.accessToken,
      platform_user_id:  result.pageId ?? result.userId,
      is_active:         true,
      connected_at:      new Date().toISOString(),
    }, { onConflict: 'photographer_id,platform' })

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_connected=facebook`
    )
  }

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/photographer?trust_error=facebook&msg=${encodeURIComponent(error)}`
    )
  }

  const authUrl = new URL('https://www.facebook.com/v19.0/dialog/oauth')
  authUrl.searchParams.set('client_id',     process.env.FACEBOOK_APP_ID!)
  authUrl.searchParams.set('redirect_uri',  REDIRECT_URI)
  authUrl.searchParams.set('scope',         'pages_show_list,pages_read_engagement,pages_read_user_content,business_management')
  authUrl.searchParams.set('response_type', 'code')

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
    .eq('platform', 'facebook')

  return NextResponse.json({ success: true })
}
