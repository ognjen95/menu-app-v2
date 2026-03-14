import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch all available enabled tenant languages by tenant ID (public route)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tenantId: string }> }
) {
  const { tenantId } = await params

  // Use admin client to bypass RLS on tenant_users table
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Get all languages
  const { data: allLanguages, error: languagesError } = await supabaseAdmin
    .from('languages')
    .select('*')

  if (languagesError) {
    return NextResponse.json({ error: languagesError.message }, { status: 500 })
  }

  // Get tenant languages configuration
  const { data: tenantLanguages, error: tenantError } = await supabaseAdmin
    .from('tenant_languages')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_enabled', true)
    .order('is_default', { ascending: false })

  if (tenantError) {
    return NextResponse.json({ error: tenantError.message }, { status: 500 })
  }

  // Map tenant enabled languages with full language details
  const languages = tenantLanguages?.map(tl => {
    const langDetails = allLanguages?.find(l => l.code === tl.language_code)
    return {
      ...tl,
      language: langDetails
    }
  }) || []

  return NextResponse.json({ data: { languages } })
}
