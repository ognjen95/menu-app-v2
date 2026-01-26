import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler } from '@/lib/api/route-handlers'

// GET - Get current user's profile
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw new Error(error.message)
    }

    return { profile: profile || null }
  })
}

// PATCH - Update current user's profile
export async function PATCH(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const profileData = body as {
      full_name?: string
      avatar_url?: string
      phone?: string
      location?: string
      bio?: string
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        ...profileData,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { profile }
  })
}
