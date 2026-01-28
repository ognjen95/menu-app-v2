import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// GET - List tables for a location
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user, params) => {
    const tenantId = requireTenant(user)
    const locationId = params.get('location_id')

    // Return empty array if no location ID provided
    if (!locationId) {
      return { tables: [] }
    }

    const { data: tables, error } = await supabase
      .from('tables')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('location_id', locationId)
      .order('zone', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      throw new Error(error.message)
    }

    return { tables: tables || [] }
  })
}

// POST - Create new table
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const tableData = body as {
      location_id: string
      name: string
      zone?: string
      capacity?: number
    }

    if (!tableData.location_id || !tableData.name) {
      throw new Error('Location ID and table name are required')
    }

    const { data: table, error } = await supabase
      .from('tables')
      .insert({
        tenant_id: tenantId,
        location_id: tableData.location_id,
        name: tableData.name,
        zone: tableData.zone,
        capacity: tableData.capacity || 4,
        is_active: true,
        status: 'available',
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    // Generate QR code for the table
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Get tenant slug
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', tenantId)
      .single()

    if (tenant) {
      await supabase.from('qr_codes').insert({
        tenant_id: tenantId,
        location_id: tableData.location_id,
        table_id: table.id,
        type: 'table',
        url: `${baseUrl}/m/${tenant.slug}?table=${table.id}`,
      })
    }

    return { table }
  })
}
