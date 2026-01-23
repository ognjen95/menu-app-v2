import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

// GET - List QR codes
export async function GET(request: NextRequest) {
  return queryHandler(request, async (supabase, user, params) => {
    const tenantId = requireTenant(user)
    const locationId = params.get('location_id')
    const type = params.get('type')

    let query = supabase
      .from('qr_codes')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: qr_codes, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    return { qr_codes: qr_codes || [] }
  })
}

// POST - Generate new QR code
export async function POST(request: NextRequest) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])

    const qrData = body as {
      location_id?: string
      table_id?: string
      type: 'menu' | 'table' | 'location'
    }

    if (!qrData.type) {
      throw new Error('QR code type is required')
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    // Get tenant slug
    const { data: tenant } = await supabase
      .from('tenants')
      .select('slug')
      .eq('id', tenantId)
      .single()

    if (!tenant) {
      throw new Error('Tenant not found')
    }

    // Build URL based on type
    let url = `${baseUrl}/m/${tenant.slug}`
    if (qrData.table_id) {
      url += `?table=${qrData.table_id}`
    } else if (qrData.location_id) {
      url += `?location=${qrData.location_id}`
    }

    const { data: qr_code, error } = await supabase
      .from('qr_codes')
      .insert({
        tenant_id: tenantId,
        location_id: qrData.location_id,
        table_id: qrData.table_id,
        type: qrData.type,
        url,
      })
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { qr_code }
  })
}
