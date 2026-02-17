import { createClient } from '@/utils/supabase/server'
import type { Table, QrCode } from '../domains/types'
import type { Location } from '@/lib/types'

export interface TablesPageData {
  locations: Location[]
  tables: Table[]
  qrCodes: QrCode[]
  initialLocationId: string | null
}

export async function getTablesPageData(): Promise<TablesPageData> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { locations: [], tables: [], qrCodes: [], initialLocationId: null }
  }

  // Get tenant via tenant_users junction table
  const { data: tenantUser } = await supabase
    .from('tenant_users')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .single()

  const tenantId = tenantUser?.tenant_id

  if (!tenantId) {
    return { locations: [], tables: [], qrCodes: [], initialLocationId: null }
  }

  // Fetch locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true })


  const locationList = locations || []
  const initialLocationId = locationList[0]?.id || null

  if (!initialLocationId) {
    return { locations: locationList, tables: [], qrCodes: [], initialLocationId: null }
  }

  // Fetch tables and QR codes for first location
  const [tablesResult, qrCodesResult] = await Promise.all([
    supabase
      .from('tables')
      .select('*')
      .eq('location_id', initialLocationId)
      .order('name', { ascending: true }),
    supabase
      .from('qr_codes')
      .select('*')
      .eq('location_id', initialLocationId),
  ])


  return {
    locations: locationList,
    tables: tablesResult.data || [],
    qrCodes: qrCodesResult.data || [],
    initialLocationId,
  }
}
