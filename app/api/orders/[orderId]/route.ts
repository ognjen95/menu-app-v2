import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// GET - Fetch single order with relations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const supabase = await createServerSupabaseClient(request)
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's tenant
  const { data: profile } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('id', user.id)
    .single()

  if (!profile?.tenant_id) {
    return NextResponse.json({ error: 'No tenant found' }, { status: 403 })
  }

  const { orderId } = await params

  const { data: order, error } = await supabase
    .from('orders')
    .select(`
      *,
      table:tables!orders_table_id_fkey(id, name, zone),
      location:locations(id, name),
      items:order_items(
        *,
        menu_item:menu_items(id, name, image_urls)
      )
    `)
    .eq('id', orderId)
    .eq('tenant_id', profile.tenant_id)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  // Transform items to include item_name
  const transformedOrder = {
    ...order,
    items: order.items?.map((item: any) => ({
      ...item,
      item_name: item.menu_item?.name || item.item_name || 'Unknown Item',
    })) || [],
  }

  return NextResponse.json({ data: { order: transformedOrder } })
}
