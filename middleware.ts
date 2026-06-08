import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/messages', '/admin']
const ADMIN_PUBLIC = ['/admin/login']

const ROLE_ROUTES: Record<string, string> = {
  '/dashboard/photographer': 'photographer',
  '/dashboard/client': 'client',
  '/admin': 'admin',
}

interface UserInfo {
  role: string | null
  photographerStatus: string | null  // 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'banned'
}

async function getUserInfo(userId: string): Promise<UserInfo> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  ) as any
  const { data: userData } = await admin.from('users').select('role').eq('id', userId).single()
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

async function getUserRole(userId: string): Promise<string | null> {
  const { role } = await getUserInfo(userId)
  return role
}

// Returns a response that clears the Supabase auth cookies, effectively signing the user out server-side.
// The client will be redirected to /login with a reason param.
function forceSignOut(request: NextRequest, reason: string): NextResponse {
  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.searchParams.set('error', reason)

  const response = NextResponse.redirect(url)

  // Clear all Supabase session cookies
  const cookiesToClear = ['sb-access-token', 'sb-refresh-token']
  request.cookies.getAll().forEach(({ name }) => {
    if (name.startsWith('sb-') || cookiesToClear.includes(name)) {
      response.cookies.set(name, '', { maxAge: 0, path: '/' })
    }
  })

  return response
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session — must call getUser() to validate
  const { data: { user } } = await supabase.auth.getUser()

  const isAdminPublic = ADMIN_PUBLIC.some(p => pathname.startsWith(p))
  const isAdminRoute  = pathname.startsWith('/admin') && !isAdminPublic
  const isProtected   = PROTECTED_PREFIXES.some(p => pathname.startsWith(p)) && !isAdminPublic
  const isAuthPage    = pathname === '/login' || pathname === '/signup'

  // Unauthenticated on admin route → /admin/login
  if (isAdminRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  // Authenticated on /admin/login → /admin
  if (isAdminPublic && user) {
    const role = await getUserRole(user.id)
    if (role === 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
  }

  // Unauthenticated non-admin protected route → /login
  if (isProtected && !isAdminRoute && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Authenticated user — check for rejected photographers before anything else.
  // A rejected photographer should not have an active session anywhere.
  if (user) {
    const { role, photographerStatus } = await getUserInfo(user.id)

    // ── Limbo state: authenticated but no public.users row yet ──────────────
    // Google OAuth: user closed tab on role-select → send back to role-select to finish.
    // Email/password: should never happen (confirm page creates the row), but if it
    // does (e.g. register API failed), send to login so they can try again cleanly.
    const limboPassthrough = [
      '/signup/role-select',
      '/onboarding',
      '/api',
      '/auth',
      '/login',
      '/signup',
      '/photographers',
      '/contact',
    ]
    const isRoot     = pathname === '/'
    const isOAuth    = user.app_metadata?.provider === 'google'

    if (!role && !isRoot && !limboPassthrough.some(p => pathname.startsWith(p))) {
      const url = request.nextUrl.clone()
      if (isOAuth) {
        // Google user — send to role-select to pick client/photographer
        url.pathname = '/signup/role-select'
        const googleEmail = user.email ?? ''
        const googleName  = user.user_metadata?.full_name ?? user.user_metadata?.name ?? ''
        if (googleEmail) url.searchParams.set('email', googleEmail)
        if (googleName)  url.searchParams.set('full_name', googleName)
      } else {
        // Email/password user — something went wrong in confirm flow, sign out and restart
        url.pathname = '/login'
        url.searchParams.set('error', 'setup_incomplete')
      }
      return NextResponse.redirect(url)
    }

    if (role === 'photographer' && photographerStatus === 'rejected') {
      // Kill their session and bounce to login with an error message
      return forceSignOut(request, 'rejected')
    }

    // Authenticated on auth page → redirect to correct dashboard
    if (isAuthPage) {
      let dest: string
      if (role === 'photographer') {
        // pending and approved both go to the dashboard — pending sees a banner there
        dest = '/dashboard/photographer'
      } else if (role === 'admin') {
        dest = '/admin'
      } else {
        dest = '/dashboard/client'
      }
      const url = request.nextUrl.clone()
      url.pathname = dest
      return NextResponse.redirect(url)
    }

    // Role gate — wrong role gets redirected to their correct dashboard
    if (isProtected) {
      const matchedRoute = Object.keys(ROLE_ROUTES).find(p => pathname.startsWith(p))
      if (matchedRoute && role !== ROLE_ROUTES[matchedRoute]) {
        const url = request.nextUrl.clone()
        if (role === 'photographer') {
          url.pathname = '/dashboard/photographer'
        } else if (role === 'admin') {
          url.pathname = '/admin'
        } else {
          url.pathname = '/dashboard/client'
        }
        return NextResponse.redirect(url)
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.png|public).*)',
  ],
}
