import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Routes that don't require authentication at all
const PUBLIC_ROUTES = [
    '/site/',
    '/m/',
    '/api/public/',
    '/webhook',
    '/_next/',
    '/favicon.ico',
    '/api/auth/',
]

// Routes that should be accessible without auth (but may need session refresh)
const AUTH_ROUTES = [
    '/login',
    '/signup',
    '/auth',
    '/forgot-password',
]

function isPublicRoute(pathname: string): boolean {
    return PUBLIC_ROUTES.some(route => pathname.startsWith(route))
}

function isAuthRoute(pathname: string): boolean {
    return AUTH_ROUTES.some(route => pathname.startsWith(route))
}

export async function updateSession(request: NextRequest) {
    const pathname = request.nextUrl.pathname

    // Skip middleware entirely for truly public routes (no auth needed)
    if (isPublicRoute(pathname)) {
        return NextResponse.next()
    }

    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
                    cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.
    
    // This refreshes the session if expired - crucial for token refresh
    const { data: { user }, error } = await supabase.auth.getUser()

    // If there's an auth error (not just missing user), log it for debugging
    if (error) {
        console.error('Auth error in middleware:', error.message)
    }

    const url = request.nextUrl.clone()

    // Handle unauthenticated users trying to access protected routes
    if (!user && !isAuthRoute(pathname) && pathname !== '/') {
        url.pathname = '/login'
        // IMPORTANT: Copy cookies to redirect response to preserve any session updates
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
        })
        return redirectResponse
    }

    // Redirect authenticated users from landing page to dashboard
    if (user && pathname === '/') {
        url.pathname = '/dashboard'
        // IMPORTANT: Copy cookies to redirect response to preserve any session updates
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(cookie => {
            redirectResponse.cookies.set(cookie.name, cookie.value, cookie)
        })
        return redirectResponse
    }

    // IMPORTANT: You *must* return the supabaseResponse object as it is.
    // This ensures any refreshed session cookies are sent back to the browser.
    return supabaseResponse
}