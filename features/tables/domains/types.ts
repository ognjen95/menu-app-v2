import { z } from 'zod'
import type { Table, QrCode } from '@/lib/types'

export type { Table, QrCode }

export interface TableFormData {
  name: string
  capacity: string
  zone: string
}

export interface QrStyle {
  color: string
  background: string
}

export const DEFAULT_TABLE_FORM: TableFormData = {
  name: '',
  capacity: '4',
  zone: '',
}

export const DEFAULT_QR_STYLE: QrStyle = {
  color: '#000000',
  background: '#ffffff',
}

// Zod schema for table form validation
export const tableFormSchema = z.object({
  name: z.string().min(1, 'Table name is required').max(50, 'Table name too long'),
  capacity: z.string().refine((val: string) => !val || (parseInt(val) >= 1 && parseInt(val) <= 100), {
    message: 'Capacity must be between 1 and 100',
  }),
  zone: z.string().max(50, 'Zone name too long').optional(),
})

export type TableFormSchema = z.infer<typeof tableFormSchema>

// Validation function that checks for duplicate names in same zone
export function validateTableForm(
  data: TableFormData,
  existingTables: Table[],
  translations: { duplicateName: string },
  editingTableId?: string
): { success: true } | { success: false; errors: Record<string, string> } {
  // First validate with Zod schema
  const result = tableFormSchema.safeParse(data)
  
  if (!result.success) {
    const errors: Record<string, string> = {}
    result.error.issues.forEach((issue) => {
      if (issue.path[0]) {
        errors[issue.path[0] as string] = issue.message
      }
    })
    return { success: false, errors }
  }

  // Check for duplicate name in same zone
  const duplicateExists = existingTables.some(table => {
    if (editingTableId && table.id === editingTableId) return false
    const sameZone = (table.zone || '') === (data.zone || '')
    const sameName = table.name.toLowerCase().trim() === data.name.toLowerCase().trim()
    return sameZone && sameName
  })

  if (duplicateExists) {
    return {
      success: false,
      errors: { name: translations.duplicateName },
    }
  }

  return { success: true }
}
