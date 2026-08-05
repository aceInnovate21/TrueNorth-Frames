import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/messages', '/admin']
const ADMIN_PUBLIC = ['/admin/login']

function forceSignOut(request: NextRequest, reason: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('error', reason)
  const res = NextResponse.redirect(url)
  // Clear all Supabase auth cookies
  for (const cookie of request.cookies.getAll()) {
    if (cookie.name.startsWith('sb-')) {
      res.cookies.set(cookie.name, '', { maxAge: 0, path: '/' })
    }
  }
  return res
}

async function getUserInfo(userId: string) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any

  const { data: userData } = await admin
    .from('users')
    .select('role, account_status')
    .eq('id', userId)
    .maybeSingle()

  // Suspended or deactivated accounts are treated as signed-out
  if (userData?.account_status === 'suspended' || userData?.account_status === 'deactivated') {
    return { role: '__suspended__', photographerStatus: null }
  }

  const role = userData?.role ?? null

  let photographerStatus: string | null = null
  if (role === 'photographer') {
    const { data: profileData } = await admin
      .from('photographer_profiles')
      .select('profile_status')
      .eq('user_id', userId)
      .maybeSingle()
    photographerStatus = profileData?.profile_status ?? null
  }

  return { role, photographerStatus }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAdminPublic = ADMIN_PUBLIC.some(p => pathname.startsWith(p))
  const isAdminRoute  = pathname.startsWith('/admin') && !isAdminPublic
  const isProtected   = PROTECTED_PREFIXES.some(p => pathname.startsWith(p)) && !isAdminPublic
  const isAuthPage    = pathname === '/login' || pathname === '/signup'

  // ── Not logged in ────────────────────────────────────────────────────────────
  if (!user) {
    if (isAdminRoute) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    if (isProtected) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      // Preserve the full path + query so deep links (e.g. a review-request
      // link with ?review=&rating=) survive the login round-trip.
      url.searchParams.set('redirect', pathname + request.nextUrl.search)
      return NextResponse.redirect(url)
    }
    return response
  }

  // ── Logged in ────────────────────────────────────────────────────────────────
  const { role } = await getUserInfo(user.id)

  // No public.users row yet — user is logged in but hasn't completed setup.
  // Login page handles creating the row and routing to onboarding.
  // Just block dashboard access; let everything else through.
  if (!role) {
    const isDashboard = PROTECTED_PREFIXES.some(p => pathname.startsWith(p))
    if (isDashboard) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('error', 'setup_incomplete')
      return NextResponse.redirect(url)
    }
    return response
  }

  // Suspended or deactivated account — force sign out
  if (role === '__suspended__') {
    return forceSignOut(request, 'suspended')
  }

  // Rejected photographers are NOT signed out — they keep access to their own
  // dashboard/onboarding so they can fix their profile and resubmit for review.
  // Their public profile stays hidden because public routes gate on
  // profile_status = 'approved'.

  // Already logged in — bounce off auth pages to dashboard
  if (isAuthPage) {
    const url = request.nextUrl.clone()
    url.pathname = role === 'photographer' ? '/dashboard/photographer'
      : role === 'admin' ? '/admin'
      : '/dashboard/client'
    return NextResponse.redirect(url)
  }

  // Wrong dashboard for role — redirect to correct one
  if (isProtected) {
    const expected = pathname.startsWith('/dashboard/photographer') ? 'photographer'
      : pathname.startsWith('/dashboard/client') ? 'client'
      : pathname.startsWith('/admin') ? 'admin'
      : null
    if (expected && role !== expected) {
      const url = request.nextUrl.clone()
      url.pathname = role === 'photographer' ? '/dashboard/photographer'
        : role === 'admin' ? '/admin'
        : '/dashboard/client'
      return NextResponse.redirect(url)
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|logo.png|public).*)'],
}
