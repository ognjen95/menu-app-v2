import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for Client Components
 * Use this in any client-side component or hook
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
