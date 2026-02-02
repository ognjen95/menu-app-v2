import { notFound } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { cookies } from 'next/headers'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PublicMenuView } from '@/components/features/public-menu/public-menu-view'
import { PublicIntlProvider } from '@/components/providers/public-intl-provider'
import { locales, defaultLocale, type Locale } from '@/i18n/config'

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

  // Fetch all data in parallel since they all depend only on tenant.id
  // Using Promise.allSettled to handle partial failures gracefully
  const results = await Promise.allSettled([
    // Fetch website separately (RLS requires is_published = true for public access)
    supabase
      .from('websites')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_published', true)
      .single(),
    
    // Get active menus with categories and items
    supabase
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
      .order('sort_order', { ascending: true }),
    
    // Get locations
    supabase
      .from('locations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true),
    
    // Get allergens
    supabase
      .from('allergens')
      .select('*'),
    
    // Get tenant languages (enabled languages for this tenant)
    supabase
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
      .order('is_default', { ascending: false }),
    
    // Get translations for this tenant's menu content (items and categories)
    supabase
      .from('translations')
      .select('*')
      .eq('tenant_id', tenant.id)
      .or('key.like.menu_item.%,key.like.category.%')
  ])

  // Extract results with proper error handling
  const websiteResult = results[0].status === 'fulfilled' ? results[0].value : { data: null, error: null }
  const menusResult = results[1].status === 'fulfilled' ? results[1].value : { data: null, error: null }
  const locationsResult = results[2].status === 'fulfilled' ? results[2].value : { data: null, error: null }
  const allergensResult = results[3].status === 'fulfilled' ? results[3].value : { data: null, error: null }
  const languagesResult = results[4].status === 'fulfilled' ? results[4].value : { data: null, error: null }
  const translationsResult = results[5].status === 'fulfilled' ? results[5].value : { data: null, error: null }

  // Menus are critical - if they fail, return null (will show 404)
  if (menusResult.error || !menusResult.data) {
    console.error('Error fetching menus:', menusResult.error)
    return null
  }

  return {
    tenant,
    menus: menusResult.data || [],
    locations: locationsResult.data || [],
    allergens: allergensResult.data || [],
    website: websiteResult.data || null,
    languages: languagesResult.data?.map((tl: any) => ({
      code: tl.language_code,
      isDefault: tl.is_default,
      name: (tl.languages as any)?.name || tl.language_code,
      nativeName: (tl.languages as any)?.native_name || tl.language_code,
      flagEmoji: (tl.languages as any)?.flag_emoji || '',
    })) || [],
    translations: translationsResult.data || [],
  }
}

export default async function PublicMenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { table, location, lang } = await searchParams

  const data = await getTenantData(slug)
  if (!data) {
    notFound()
  }

  // Determine initial language priority:
  // 1. URL param (lang)
  // 2. PUBLIC_LOCALE cookie
  // 3. Tenant's default language
  // 4. Fallback to 'en'
  const cookieStore = await cookies()
  const cookieLocale = cookieStore.get('PUBLIC_LOCALE')?.value
  const tenantDefaultLang = data.languages.find(l => l.isDefault)?.code || data.languages[0]?.code || 'en'
  
  // Validate the language exists in tenant's enabled languages
  const getValidLanguage = (langCode: string | undefined) => {
    if (!langCode) return null
    return data.languages.some(l => l.code === langCode) ? langCode : null
  }

  const initialLanguage = getValidLanguage(lang) 
    || getValidLanguage(cookieLocale) 
    || tenantDefaultLang

  // Load public translations for the determined language
  // Check if the locale is valid, otherwise use default
  const publicLocale: Locale = locales.includes(initialLanguage as Locale) 
    ? (initialLanguage as Locale) 
    : defaultLocale
  
  const publicMessages = (await import(`@/messages/public/${publicLocale}.json`)).default

  return (
    <PublicIntlProvider locale={publicLocale} messages={publicMessages}>
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
    </PublicIntlProvider>
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
