import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Fetch all available languages (for settings page)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get all active languages
  const { data: languages, error } = await supabase
    .from('languages')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { languages } })
}
