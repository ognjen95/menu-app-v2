import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a service role client for public access (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Get active orders for a specific table (no auth required)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableId = searchParams.get('table_id')

    if (!tableId) {
      return NextResponse.json({ error: 'Table ID is required' }, { status: 400 })
    }

    // Fetch orders for this table that are not completed or cancelled
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        type,
        subtotal,
        tax_amount,
        total,
        currency,
        placed_at,
        created_at,
        items:order_items(
          id,
          item_name,
          variant_name,
          selected_variants,
          quantity,
          unit_price,
          options_price,
          total_price,
          selected_options
        )
      `)
      .eq('table_id', tableId)
      .not('status', 'in', '("completed","cancelled")')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Table history error:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    return NextResponse.json({ data: { orders: orders || [] } })

  } catch (error) {
    console.error('Table history error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
