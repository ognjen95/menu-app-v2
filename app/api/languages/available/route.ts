import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Fetch all available languages (public endpoint for onboarding)
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)

  const { data: languages, error } = await supabase
    .from('languages')
    .select('code, name, native_name, flag_emoji, is_rtl')
    .eq('is_active', true)
    .order('name')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { languages: languages || [] } })
}
