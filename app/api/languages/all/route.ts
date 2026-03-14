import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Fetch all available languages (for settings page)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)

  const { searchParams } = new URL(request.url)
  const isPublicActive = searchParams.get('is_public_active') === 'true'

  // Get all active languages
  let query = supabase
    .from('languages')
    .select('*')

  if (isPublicActive) {
    query = query.eq('is_public_active', true)
  } else {
    query = query.eq('is_active', true)
  }

  const { data: languages, error } = await query.order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { languages } })
}
