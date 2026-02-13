import type { Menu } from '@/lib/types'

export type OverlapInfo = {
  menuName: string
  overlappingDays: number[]
  timeRange: string
}

/**
 * Check if two time ranges overlap
 * Handles both normal ranges (09:00-17:00) and overnight ranges (22:00-06:00)
 */
export function timeRangesOverlap(
  from1: string | null | undefined,
  until1: string | null | undefined,
  from2: string | null | undefined,
  until2: string | null | undefined
): boolean {
  // If either menu has no time restriction, they can overlap
  const noRestriction1 = !from1 && !until1
  const noRestriction2 = !from2 && !until2
  
  if (noRestriction1 || noRestriction2) return true

  // Default values for partial restrictions
  const start1 = from1 || '00:00'
  const end1 = until1 || '23:59'
  const start2 = from2 || '00:00'
  const end2 = until2 || '23:59'

  // Check if ranges overlap (simple string comparison works for HH:MM format)
  return start1 < end2 && start2 < end1
}

/**
 * Find menus that have overlapping schedules with the given menu data
 */
export function findOverlappingMenus(
  menus: Menu[],
  menuData: {
    is_active: boolean
    available_days: number[]
    available_from: string | null
    available_until: string | null
    location_id: string | null
  },
  excludeMenuId?: string
): OverlapInfo[] {
  // Only check if the new/edited menu is active
  if (!menuData.is_active) return []

  const overlaps: OverlapInfo[] = []

  for (const menu of menus) {
    // Skip the menu being edited
    if (excludeMenuId && menu.id === excludeMenuId) continue
    // Skip inactive menus
    if (!menu.is_active) continue
    // Skip menus at different locations (unless one has no location - applies to all)
    if (menuData.location_id && menu.location_id && menuData.location_id !== menu.location_id) continue

    // Find overlapping days
    const formDays = menuData.available_days.length > 0 ? menuData.available_days : [0, 1, 2, 3, 4, 5, 6]
    const menuDays = menu.available_days?.length > 0 ? menu.available_days : [0, 1, 2, 3, 4, 5, 6]
    const overlappingDays = formDays.filter(d => menuDays.includes(d))

    if (overlappingDays.length === 0) continue

    // Check time overlap
    const hasTimeOverlap = timeRangesOverlap(
      menuData.available_from,
      menuData.available_until,
      menu.available_from,
      menu.available_until
    )

    if (hasTimeOverlap) {
      overlaps.push({
        menuName: menu.name,
        overlappingDays,
        timeRange: menu.available_from || menu.available_until
          ? `${menu.available_from || '00:00'} - ${menu.available_until || '23:59'}`
          : 'All day',
      })
    }
  }

  return overlaps
}

/**
 * Validate menu schedule and throw error if overlaps exist
 * For use in API routes
 */
export function validateMenuSchedule(
  menus: Menu[],
  menuData: {
    is_active?: boolean
    available_days?: number[]
    available_from?: string | null
    available_until?: string | null
    location_id?: string | null
  },
  excludeMenuId?: string
): void {
  const overlaps = findOverlappingMenus(
    menus,
    {
      is_active: menuData.is_active ?? true,
      available_days: menuData.available_days || [0, 1, 2, 3, 4, 5, 6],
      available_from: menuData.available_from || null,
      available_until: menuData.available_until || null,
      location_id: menuData.location_id || null,
    },
    excludeMenuId
  )

  if (overlaps.length > 0) {
    const overlapDetails = overlaps
      .map(o => `"${o.menuName}" (${o.timeRange})`)
      .join(', ')
    throw new Error(`Schedule overlaps with existing menus: ${overlapDetails}`)
  }
}
