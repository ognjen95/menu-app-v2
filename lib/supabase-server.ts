import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

type CookieToSet = {
  name: string
  value: string
  options: CookieOptions
}

/**
 * Creates a Supabase client for Server Components, Server Actions, and Route Handlers
 * This function accepts a NextRequest to properly handle cookies
 * 
 * Usage in Route Handlers:
 * const supabase = await createServerSupabaseClient(request)
 * 
 * Usage in Server Components/Actions (no request available):
 * const supabase = await createServerSupabaseClient()
 */
export async function createServerSupabaseClient(request?: NextRequest) {
  if (request) {
    // Route Handler context - use request cookies
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              request.cookies.set(name, value)
            )
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )

    return supabase
  } else {
    // Server Component/Action context - use cookies()
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: CookieToSet[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }: CookieToSet) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )

    return supabase
  }
}
