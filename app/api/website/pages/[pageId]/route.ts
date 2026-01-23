import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ pageId: string }> }

// GET - Get single page
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { pageId } = await params

    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (!website) {
      throw new Error('Website not found')
    }

    const { data: page, error } = await supabase
      .from('website_pages')
      .select('*')
      .eq('id', pageId)
      .eq('website_id', website.id)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { page }
  })
}

// PATCH - Update page
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { pageId } = await params

    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (!website) {
      throw new Error('Website not found')
    }

    const updateData = body as {
      title?: string
      slug?: string
      is_published?: boolean
      is_in_navigation?: boolean
      sort_order?: number
      meta_title?: string
      meta_description?: string
    }

    const { data: page, error } = await supabase
      .from('website_pages')
      .update(updateData)
      .eq('id', pageId)
      .eq('website_id', website.id)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { page }
  })
}

// DELETE - Delete page
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { pageId } = await params

    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (!website) {
      throw new Error('Website not found')
    }

    // Delete all blocks for this page first
    await supabase
      .from('website_blocks')
      .delete()
      .eq('page_id', pageId)

    // Delete the page
    const { error } = await supabase
      .from('website_pages')
      .delete()
      .eq('id', pageId)
      .eq('website_id', website.id)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
