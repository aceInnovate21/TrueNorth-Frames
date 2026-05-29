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

async function getUserRole(userId: string): Promise<string | null> {
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  const { data } = await (admin as any).from('users').select('role').eq('id', userId).single()
  return data?.role ?? null
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

  // Authenticated on auth page → redirect to their dashboard
  if (isAuthPage && user) {
    const role = await getUserRole(user.id)
    const dest = role === 'photographer'
      ? '/dashboard/photographer'
      : role === 'admin'
      ? '/admin'
      : '/dashboard/client'
    const url = request.nextUrl.clone()
    url.pathname = dest
    return NextResponse.redirect(url)
  }

  // Role gate — wrong role gets redirected to their correct dashboard
  if (user && isProtected) {
    const matchedRoute = Object.keys(ROLE_ROUTES).find(p => pathname.startsWith(p))
    if (matchedRoute) {
      const role = await getUserRole(user.id)
      if (role && role !== ROLE_ROUTES[matchedRoute]) {
        const url = request.nextUrl.clone()
        url.pathname = role === 'photographer'
          ? '/dashboard/photographer'
          : role === 'admin'
          ? '/admin'
          : '/dashboard/client'
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
