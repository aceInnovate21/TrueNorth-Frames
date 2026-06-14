import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://truenorthframes.vercel.app'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code  = searchParams.get('code')
  const error = searchParams.get('error')

  if (error || !code) {
    return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
  }

  // Use a temporary response to collect the cookies Supabase wants to set
  const cookieStore: { name: string; value: string; options: any }[] = []

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(c => cookieStore.push(c))
        },
      },
    }
  )

  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError || !data.session) {
    return NextResponse.redirect(`${APP_URL}/login?error=oauth_failed`)
  }

  const user = data.session.user

  // Check if this Google user already has a public.users row
  const adminDb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any

  const { data: existingUser } = await adminDb
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  // Determine if the user has actually completed onboarding by checking for a profile.
  // The DB trigger creates a public.users row immediately on auth signup (role defaults
  // to 'client'), so we cannot use the users row alone to decide — we must verify a
  // profile record exists, which only happens after onboarding is finished.
  let hasProfile = false
  if (existingUser?.role === 'photographer') {
    const { data: pp } = await adminDb
      .from('photographer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    hasProfile = !!pp
  } else if (existingUser?.role === 'client') {
    const { data: cp } = await adminDb
      .from('client_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    hasProfile = !!cp
  } else if (existingUser?.role === 'admin') {
    hasProfile = true
  }

  // Decide destination before building the response
  let destination: string
  if (existingUser && hasProfile) {
    destination = existingUser.role === 'photographer' ? `${APP_URL}/dashboard/photographer`
      : existingUser.role === 'admin' ? `${APP_URL}/admin`
      : `${APP_URL}/dashboard/client`
  } else {
    // New user or onboarding incomplete — send to role-select
    const fullName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
    const email    = user.email ?? ''
    const qs = new URLSearchParams({ email, full_name: fullName })
    destination = `${APP_URL}/signup/role-select?${qs}`
  }

  // Build the final redirect response and stamp all session cookies onto it
  const response = NextResponse.redirect(destination)
  cookieStore.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options)
  })

  return response
}
