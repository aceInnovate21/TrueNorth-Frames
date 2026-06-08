import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/messages', '/admin']
const ADMIN_PUBLIC = ['/admin/login']

async function getUserInfo(userId: string) {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any

  const { data: userData } = await admin
    .from('users')
    .select('role')
    .eq('id', userId)
    .maybeSingle()

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
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
    return response
  }

  // ── Logged in ────────────────────────────────────────────────────────────────
  const { role, photographerStatus } = await getUserInfo(user.id)

  // No public.users row yet — still setting up.
  // Let them through to /onboarding, /auth, /api, /signup — block dashboard only.
  if (!role) {
    const allowed = ['/onboarding', '/auth', '/api', '/signup', '/login', '/signup/role-select', '/photographers', '/contact']
    const isRoot  = pathname === '/'
    if (!isRoot && !allowed.some(p => pathname.startsWith(p))) {
      // Send to onboarding so they can finish setup — never sign them out
      const isOAuth = user.app_metadata?.provider === 'google'
      const url = request.nextUrl.clone()
      if (isOAuth) {
        url.pathname = '/signup/role-select'
        url.searchParams.set('email', user.email ?? '')
        url.searchParams.set('full_name', user.user_metadata?.full_name ?? user.user_metadata?.name ?? '')
      } else {
        const meta = user.user_metadata ?? {}
        const fullName = meta.full_name ?? ''
        const [firstName, ...rest] = fullName.split(' ')
        url.pathname = '/onboarding'
        if (meta.role === 'photographer') url.pathname = '/onboarding/photographer'
        if (firstName) url.searchParams.set('firstName', firstName)
        if (rest.length) url.searchParams.set('lastName', rest.join(' '))
      }
      return NextResponse.redirect(url)
    }
    return response
  }

  // Rejected photographer — clear session
  if (role === 'photographer' && photographerStatus === 'rejected') {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('error', 'rejected')
    const res = NextResponse.redirect(url)
    request.cookies.getAll().forEach(({ name }) => {
      if (name.startsWith('sb-')) res.cookies.set(name, '', { maxAge: 0, path: '/' })
    })
    return res
  }

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
