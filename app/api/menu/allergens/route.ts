import { NextRequest } from 'next/server'
import { queryHandler } from '@/lib/api/route-handlers'

// GET - List all allergens (public data, no tenant restriction)
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase) => {
    const { data: allergens, error } = await supabase
      .from('allergens')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { allergens: allergens || [] }
  })
}
