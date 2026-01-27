import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Fetch translations by key prefix
export async function GET(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const keyPrefix = searchParams.get('key_prefix')
  const key = searchParams.get('key')

  // Get tenant ID
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id')
    .eq('user_id', user.id)
    .single()

  if (!tenantUser) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 404 })
  }

  let query = supabase
    .from('translations')
    .select('*')
    .eq('tenant_id', tenantUser.tenant_id)

  if (key) {
    query = query.eq('key', key)
  } else if (keyPrefix) {
    query = query.like('key', `${keyPrefix}%`)
  }

  const { data: translations, error } = await query.order('language_code')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { translations } })
}

// POST - Create or update a translation
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { key, language_code, value } = body

  if (!key || !language_code) {
    return NextResponse.json({ error: 'key and language_code are required' }, { status: 400 })
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

  // Upsert the translation
  const { data, error } = await supabase
    .from('translations')
    .upsert({
      tenant_id: tenantUser.tenant_id,
      key,
      language_code,
      value: value || '',
      is_auto_translated: false,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'tenant_id,key,language_code'
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { translation: data } })
}

// PUT - Bulk update translations
export async function PUT(request: NextRequest) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { translations } = body // Array of { key, language_code, value }

  if (!translations || !Array.isArray(translations)) {
    return NextResponse.json({ error: 'translations array is required' }, { status: 400 })
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

  // Prepare records for upsert
  const records = translations.map((t: { key: string; language_code: string; value: string }) => ({
    tenant_id: tenantUser.tenant_id,
    key: t.key,
    language_code: t.language_code,
    value: t.value || '',
    is_auto_translated: false,
    updated_at: new Date().toISOString()
  }))

  // Upsert all translations
  const { data, error } = await supabase
    .from('translations')
    .upsert(records, {
      onConflict: 'tenant_id,key,language_code'
    })
    .select()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data: { translations: data } })
}
