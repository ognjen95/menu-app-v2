import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PublicMenuView } from '@/components/features/public-menu/public-menu-view'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ table?: string; location?: string; lang?: string }>
}

async function getTenantData(slug: string) {
  noStore() // Disable caching to get fresh data
  const supabase = await createServerSupabaseClient()

  // Get tenant by slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .in('subscription_status', ['active', 'trialing'])
    .single()

  if (tenantError || !tenant) {
    return null
  }

  // Fetch website separately (RLS requires is_published = true for public access)
  const { data: website } = await supabase
    .from('websites')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_published', true)
    .single()

  // Get active menus with categories and items
  const { data: menus, error: menusError } = await supabase
    .from('menus')
    .select(`
      *,
      categories (
        *,
        items:menu_items (
          *,
          variants:item_variants (*),
          option_groups (
            *,
            options:item_options (*)
          ),
          item_allergens (
            allergen_id,
            allergens (*)
          )
        )
      )
    `)
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  if (menusError) {
    console.error('Error fetching menus:', menusError)
    return null
  }

  // Get locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('is_active', true)

  // Get allergens
  const { data: allergens } = await supabase
    .from('allergens')
    .select('*')

  // Get tenant languages (enabled languages for this tenant)
  const { data: tenantLanguages } = await supabase
    .from('tenant_languages')
    .select(`
      language_code,
      is_default,
      is_enabled,
      languages (
        code,
        name,
        native_name,
        flag_emoji
      )
    `)
    .eq('tenant_id', tenant.id)
    .eq('is_enabled', true)
    .order('is_default', { ascending: false })

  // Get translations for this tenant's menu content (items and categories)
  const { data: translations } = await supabase
    .from('translations')
    .select('*')
    .eq('tenant_id', tenant.id)
    .or('key.like.menu_item.%,key.like.category.%')

  return {
    tenant,
    menus: menus || [],
    locations: locations || [],
    allergens: allergens || [],
    website: website || null,
    languages: tenantLanguages?.map(tl => ({
      code: tl.language_code,
      isDefault: tl.is_default,
      name: (tl.languages as any)?.name || tl.language_code,
      nativeName: (tl.languages as any)?.native_name || tl.language_code,
      flagEmoji: (tl.languages as any)?.flag_emoji || '',
    })) || [],
    translations: translations || [],
  }
}

export default async function PublicMenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { table, location, lang } = await searchParams

  const data = await getTenantData(slug)
  if (!data) {
    notFound()
  }

  // Determine initial language (from URL, or default)
  const defaultLang = data.languages.find(l => l.isDefault)?.code || data.languages[0]?.code || 'en'
  const initialLanguage = lang && data.languages.some(l => l.code === lang) ? lang : defaultLang

  return (
    <PublicMenuView
      tenant={data.tenant}
      menus={data.menus}
      locations={data.locations}
      allergens={data.allergens}
      website={data.website}
      tableId={table}
      locationId={location}
      languages={data.languages}
      translations={data.translations}
      initialLanguage={initialLanguage}
      slug={slug}
    />
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createServerSupabaseClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, description')
    .eq('slug', slug)
    .single()

  if (!tenant) {
    return {
      title: 'Menu Not Found',
    }
  }

  return {
    title: `${tenant.name} - Menu`,
    description: tenant.description || `View the menu for ${tenant.name}`,
  }
}
