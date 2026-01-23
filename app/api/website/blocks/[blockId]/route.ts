import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ blockId: string }> }

// Helper to verify block ownership
async function verifyBlockOwnership(supabase: any, tenantId: string, blockId: string) {
  const { data: website } = await supabase
    .from('websites')
    .select('id')
    .eq('tenant_id', tenantId)
    .single()

  if (!website) {
    throw new Error('Website not found')
  }

  const { data: block } = await supabase
    .from('website_blocks')
    .select(`
      id,
      page:website_pages!inner(
        website_id
      )
    `)
    .eq('id', blockId)
    .single()

  if (!block || block.page?.website_id !== website.id) {
    throw new Error('Block not found')
  }

  return block
}

// GET - Get single block
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { blockId } = await params

    await verifyBlockOwnership(supabase, tenantId, blockId)

    const { data: block, error } = await supabase
      .from('website_blocks')
      .select('*')
      .eq('id', blockId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { block }
  })
}

// PATCH - Update block
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { blockId } = await params

    await verifyBlockOwnership(supabase, tenantId, blockId)

    const updateData = body as {
      content?: Record<string, unknown>
      settings?: {
        padding?: string
        background?: string
        alignment?: string
      }
      is_visible?: boolean
      sort_order?: number
    }

    const { data: block, error } = await supabase
      .from('website_blocks')
      .update(updateData)
      .eq('id', blockId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { block }
  })
}

// DELETE - Delete block
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { blockId } = await params

    await verifyBlockOwnership(supabase, tenantId, blockId)

    const { error } = await supabase
      .from('website_blocks')
      .delete()
      .eq('id', blockId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
