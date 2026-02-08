// Server-side route handler utilities
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export type RouteContext = {
  params: Promise<Record<string, string>>
}

export type UserRoles = 'owner' | 'manager' | 'staff' | 'waiter' | 'kitchen';

export type AuthenticatedUser = {
  id: string
  email: string
  tenant_id: string | null
  role: UserRoles | null
}

// Standard API response type
export type ApiResponse<T> = {
  data?: T
  error?: string
  message?: string
}

// Query handler for GET requests
export async function queryHandler<T>(
  request: NextRequest,
  handler: (
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    user: AuthenticatedUser,
    params: URLSearchParams
  ) => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const supabase = await createServerSupabaseClient(request)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant info
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      tenant_id: tenantUser?.tenant_id || null,
      role: tenantUser?.role || null,
    }

    const params = request.nextUrl.searchParams
    const data = await handler(supabase, authenticatedUser, params)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Query handler error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Mutation handler for POST/PUT/PATCH/DELETE requests
export async function mutationHandler<T>(
  request: NextRequest,
  handler: (
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    user: AuthenticatedUser,
    body: unknown
  ) => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const supabase = await createServerSupabaseClient(request)

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant info
    const { data: tenantUser } = await supabase
      .from('tenant_users')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    const authenticatedUser: AuthenticatedUser = {
      id: user.id,
      email: user.email || '',
      tenant_id: tenantUser?.tenant_id || null,
      role: tenantUser?.role || null,
    }

    let body = null
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      const text = await request.text()
      if (text) {
        body = JSON.parse(text)
      }
    }

    const data = await handler(supabase, authenticatedUser, body)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Mutation handler error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Public query handler (no auth required)
export async function publicQueryHandler<T>(
  request: NextRequest,
  handler: (
    supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
    params: URLSearchParams
  ) => Promise<T>
): Promise<NextResponse<ApiResponse<T>>> {
  try {
    const supabase = await createServerSupabaseClient(request)
    const params = request.nextUrl.searchParams
    const data = await handler(supabase, params)

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Public query handler error:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// Role-based authorization helper
export function requireRole(user: AuthenticatedUser, allowedRoles: UserRoles[]): void {
  if (!user.role || !allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: insufficient permissions')
  }
}

// Tenant validation helper
export function requireTenant(user: AuthenticatedUser): string {
  if (!user.tenant_id) {
    throw new Error('No tenant associated with user')
  }
  return user.tenant_id
}
