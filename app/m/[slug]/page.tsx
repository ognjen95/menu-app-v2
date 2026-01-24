import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { PublicMenuView } from '@/components/features/public-menu/public-menu-view'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ table?: string; location?: string }>
}

async function getTenantData(slug: string) {
  const supabase = await createServerSupabaseClient()

  // Get tenant by slug
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select(`
      *,
      website:websites(*)
    `)
    .eq('slug', slug)
    .in('subscription_status', ['active', 'trialing'])
    .single()

  if (tenantError || !tenant) {
    return null
  }

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

  return {
    tenant,
    menus: menus || [],
    locations: locations || [],
    allergens: allergens || [],
    website: tenant.website?.[0] || null,
  }
}

export default async function PublicMenuPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { table, location } = await searchParams

  const data = await getTenantData(slug)

  if (!data) {
    notFound()
  }

  return (
    <PublicMenuView
      tenant={data.tenant}
      menus={data.menus}
      locations={data.locations}
      allergens={data.allergens}
      website={data.website}
      tableId={table}
      locationId={location}
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
