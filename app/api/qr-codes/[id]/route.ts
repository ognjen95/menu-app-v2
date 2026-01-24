import { NextRequest } from 'next/server'
import { queryHandler, mutationHandler, requireTenant, requireRole } from '@/lib/api/route-handlers'

type RouteParams = { params: Promise<{ id: string }> }

// GET - Get single QR code
export async function GET(request: NextRequest, { params }: RouteParams) {
  return queryHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    const { id } = await params

    const { data: qr_code, error } = await supabase
      .from('qr_codes')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { qr_code }
  })
}

// PUT - Update QR code style
export async function PUT(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user, body) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { id } = await params

    const updateData = body as {
      style?: {
        color?: string
        background?: string
        logo?: boolean
      }
    }

    const { data: qr_code, error } = await supabase
      .from('qr_codes')
      .update({
        style: updateData.style,
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return { qr_code }
  })
}

// DELETE - Delete QR code
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  return mutationHandler(request, async (supabase, user) => {
    const tenantId = requireTenant(user)
    requireRole(user, ['owner', 'manager'])
    const { id } = await params

    const { error } = await supabase
      .from('qr_codes')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true }
  })
}
