import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Fetch tenant languages with language details
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get tenant ID
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  // Get tenant languages with language details
  const { data: tenantLanguages, error } = await supabase
    .from('tenant_languages')
    .select(`
      tenant_id,
      language_code,
      is_default,
      is_enabled,
      languages (
        code,
        name,
        native_name,
        flag_emoji,
        is_rtl
      )
    `)
    .eq('tenant_id', tenantUser.tenant_id)
    .eq('is_enabled', true)
    .order('is_default', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Transform data to flatten language object
  const languages = tenantLanguages?.map(tl => ({
    ...tl,
    language: tl.languages
  })) || []

  return NextResponse.json({ data: { languages } })
}

// POST - Enable/disable a language for the tenant
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { language_code, is_enabled, is_default } = body

  // Get tenant ID
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  // If setting as default, unset other defaults first
  if (is_default) {
    await supabase
      .from('tenant_languages')
      .update({ is_default: false })
      .eq('tenant_id', tenantUser.tenant_id)
  }

  // Upsert the tenant language
  const { data, error } = await supabase
    .from('tenant_languages')
    .upsert({
      tenant_id: tenantUser.tenant_id,
      language_code,
      is_enabled: is_enabled ?? true,
      is_default: is_default ?? false
    }, {
      onConflict: 'tenant_id,language_code'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { language: data } })
}
