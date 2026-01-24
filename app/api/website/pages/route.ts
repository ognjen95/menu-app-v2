import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// GET - List all website pages
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)

    // First get website
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (!website) {
      return { pages: [] }
    }

    const { data: pages, error } = await supabase
      .from('website_pages')
      .select('*')
      .eq('website_id', website.id)
      .order('sort_order', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { pages: pages || [] }
  })
}

// POST - Create new page
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const { title, slug } = body as { title: string; slug: string }

    if (!title || !slug) {
      throw new Error('Title and slug are required')
    }

    // Get or create website
    let websiteId: string
    const { data: existingWebsite } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (!existingWebsite) {
      const { data: newWebsite, error: websiteError } = await supabase
        .from('websites')
        .insert({ tenant_id: tenantId })
        .select()
        .single()

      if (websiteError || !newWebsite) throw new Error(websiteError?.message || 'Failed to create website')
      websiteId = newWebsite.id
    } else {
      websiteId = existingWebsite.id
    }

    // Get max sort order
    const { data: lastPage } = await supabase
      .from('website_pages')
      .select('sort_order')
      .eq('website_id', websiteId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const sortOrder = (lastPage?.sort_order || 0) + 1

    // Create page
    const { data: page, error } = await supabase
      .from('website_pages')
      .insert({
        tenant_id: tenantId,
        website_id: websiteId,
        title,
        slug,
        sort_order: sortOrder,
        is_published: true,
        is_in_navigation: true,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { page }
  })
}
