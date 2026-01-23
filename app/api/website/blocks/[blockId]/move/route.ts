import { NextRequest } from 'next/server'
import { mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ blockId: string }> }

// PATCH - Move block up or down
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { blockId } = await params

    const { direction } = body as { direction: 'up' | 'down' }

    if (!direction || !['up', 'down'].includes(direction)) {
      throw new Error('Invalid direction. Must be "up" or "down"')
    }

    // Verify ownership
    const { data: website } = await supabase
      .from('websites')
      .select('id')
      .eq('tenant_id', tenantId)
      .single()

    if (!website) {
      throw new Error('Website not found')
    }

    // Get current block with page info
    const { data: currentBlock } = await supabase
      .from('website_blocks')
      .select(`
        id,
        page_id,
        sort_order
      `)
      .eq('id', blockId)
      .single()

    if (!currentBlock) {
      throw new Error('Block not found')
    }

    // Verify page belongs to this website
    const { data: page } = await supabase
      .from('website_pages')
      .select('website_id')
      .eq('id', currentBlock.page_id)
      .single()

    if (!page || page.website_id !== website.id) {
      throw new Error('Block not found')
    }

    // Get all blocks on the same page
    const { data: allBlocks } = await supabase
      .from('website_blocks')
      .select('id, sort_order')
      .eq('page_id', currentBlock.page_id)
      .order('sort_order', { ascending: true })

    if (!allBlocks || allBlocks.length < 2) {
      return { success: true, message: 'No reordering needed' }
    }

    // Find current index
    const currentIndex = allBlocks.findIndex(b => b.id === blockId)
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // Check bounds
    if (targetIndex < 0 || targetIndex >= allBlocks.length) {
      return { success: true, message: 'Already at boundary' }
    }

    // Swap sort orders
    const targetBlock = allBlocks[targetIndex]
    const currentSortOrder = currentBlock.sort_order
    const targetSortOrder = targetBlock.sort_order

    // Update both blocks
    await supabase
      .from('website_blocks')
      .update({ sort_order: targetSortOrder })
      .eq('id', blockId)

    await supabase
      .from('website_blocks')
      .update({ sort_order: currentSortOrder })
      .eq('id', targetBlock.id)

    return { success: true }
  })
}
