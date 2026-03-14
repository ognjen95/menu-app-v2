import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase-middleware'
import { RESERVED_SUBDOMAINS, ROOT_DOMAIN } from './lib/constants/domains'

/**
 * Extract subdomain from hostname
 * Examples:
 * - clientslug.klopay.app → clientslug
 * - www.klopay.app → www (reserved, not a tenant)
 * - klopay.app → null (root domain)
 * - localhost:3000 → null
 * - clientslug.localhost:3000 → clientslug (for local dev)
 */
function getSubdomain(hostname: string, request?: NextRequest): string | null {
    // Remove port if present
    const host = hostname.split(':')[0]
    
    // For local development: check for x-subdomain header or subdomain.localhost
    if (host === 'localhost' || host === '127.0.0.1') {
        // Check for custom header (useful for testing)
        const headerSubdomain = request?.headers.get('x-subdomain')
        if (headerSubdomain) {
            return headerSubdomain
        }
        return null
    }
    
    // Handle subdomain.localhost for local development
    if (host.endsWith('.localhost')) {
        const subdomain = host.replace('.localhost', '')
        if (subdomain && !RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
            return subdomain
        }
        return null
    }
    
    // Check if it's the root domain or www
    if (host === ROOT_DOMAIN || host === `www.${ROOT_DOMAIN}`) {
        return null
    }
    
    // Extract subdomain
    const parts = host.split('.')
    
    // For klopay.app domain structure: subdomain.klopay.app
    if (host.endsWith(`.${ROOT_DOMAIN}`)) {
        const subdomain = parts[0]
        
        // Check if it's a reserved subdomain
        if (RESERVED_SUBDOMAINS.includes(subdomain.toLowerCase())) {
            return null
        }
        
        return subdomain
    }
    
    return null
}

export async function middleware(request: NextRequest) {
    const url = request.nextUrl.clone()
    const hostname = request.headers.get('host') || ''
    const pathname = url.pathname

    // Allow service worker + manifest + workbox files to bypass middleware
    if (
        pathname === '/sw.js' ||
        pathname === '/manifest.json' ||
        /^\/workbox-\w+\.js$/.test(pathname)
    ) {
        return NextResponse.next()
    }

    // Allow Next.js internal assets to bypass middleware entirely
    if (pathname.startsWith('/_next')) {
        return NextResponse.next()
    }
    
    // Debug logging (check Vercel Runtime Logs)
    console.log('[Middleware] Host:', hostname, '| Path:', pathname, '| ROOT_DOMAIN:', ROOT_DOMAIN)
    
    // Get subdomain from hostname
    const subdomain = getSubdomain(hostname, request)
    
    // Debug logging
    console.log('[Middleware] Detected subdomain:', subdomain)
    
    // If we have a tenant subdomain, handle the routing
    if (subdomain) {
        // Skip static files and API routes
        if (
            pathname.startsWith('/_next') ||
            pathname.startsWith('/api') ||
            pathname.startsWith('/favicon') ||
            pathname.match(/\.(svg|png|jpg|jpeg|gif|webp|ico)$/)
        ) {
            return NextResponse.next()
        }
        
        // Route: subdomain.klopay.app/m → /m/[subdomain]
        if (pathname === '/m' || pathname.startsWith('/m/')) {
            // Rewrite /m to /m/subdomain, keeping any additional path segments
            url.pathname = `/m/${subdomain}`
            
            // Preserve query params (like table, location, lang)
            return NextResponse.rewrite(url)
        }
        
        // Route: subdomain.klopay.app/ or subdomain.klopay.app/any-page → /site/[subdomain]
        // The page query param is used by the site page to determine which page to show
        if (pathname === '/') {
            url.pathname = `/site/${subdomain}`
            return NextResponse.rewrite(url)
        }
        
        // Route: subdomain.klopay.app/about → /site/[subdomain]?page=about
        // Strip leading slash and use as page slug
        const pageSlug = pathname.slice(1)
        if (pageSlug && !pageSlug.includes('/')) {
            url.pathname = `/site/${subdomain}`
            url.searchParams.set('page', pageSlug)
            return NextResponse.rewrite(url)
        }
        
        // For nested paths, just rewrite to site
        url.pathname = `/site/${subdomain}`
        return NextResponse.rewrite(url)
    }
    
    // No subdomain - continue with normal auth middleware
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/|favicon.ico|sw\\.js|manifest\.json|workbox-.*\.js|sounds/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp3|wav|ogg)$).*)',
    ],
}

