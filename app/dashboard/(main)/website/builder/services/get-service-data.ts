import { redirect } from 'next/navigation'
import { unstable_noStore as noStore } from 'next/cache'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { Website, WebsitePage } from '../containers/preview-and-editor.'

export async function getWebsiteData(): Promise<{ website: Website | null; pages: WebsitePage[] }> {
  noStore()
  const supabase = await createServerSupabaseClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Single query with join: tenant_users → tenants → websites → website_pages
  const { data } = await supabase
    .from('tenant_users')
    .select(`
      tenant_id,
      tenants!tenant_users_tenant_id_fkey (
        id,
        websites (
          id,
          tenant_id,
          subdomain,
          custom_domain,
          is_published,
          primary_color,
          secondary_color,
          background_color,
          foreground_color,
          accent_color,
          font_heading,
          font_body,
          logo_url,
          mobile_header_image_url,
          seo_title,
          seo_description,
          social_links,
          website_pages (
            id,
            slug,
            title,
            is_published,
            is_in_navigation,
            sort_order
          )
        )
      )
    `)
    .eq('user_id', user.id)
    .single()

  if (!data?.tenants) {
    redirect('/login')
  }

  // Extract website and pages from joined result (tenant_users → tenants → websites)
  const tenantData = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants
  const websiteData = tenantData?.websites ? (Array.isArray(tenantData.websites) ? tenantData.websites[0] : tenantData.websites) : null
  const website = websiteData ? {
    id: websiteData.id,
    tenant_id: websiteData.tenant_id,
    subdomain: websiteData.subdomain,
    custom_domain: websiteData.custom_domain,
    is_published: websiteData.is_published,
    primary_color: websiteData.primary_color,
    secondary_color: websiteData.secondary_color,
    background_color: websiteData.background_color,
    foreground_color: websiteData.foreground_color,
    accent_color: websiteData.accent_color,
    font_heading: websiteData.font_heading,
    font_body: websiteData.font_body,
    logo_url: websiteData.logo_url,
    mobile_header_image_url: websiteData.mobile_header_image_url,
    seo_title: websiteData.seo_title,
    seo_description: websiteData.seo_description,
    social_links: websiteData.social_links,
  } as Website : null

  const pages = (websiteData?.website_pages || [])
    .sort((a: WebsitePage, b: WebsitePage) => a.sort_order - b.sort_order) as WebsitePage[]

  return { website, pages }
}