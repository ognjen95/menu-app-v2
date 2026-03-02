import { z } from 'zod'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getSeedDataForType, defaultZonesAndTables } from '@/lib/seed-data'
import type { TenantType } from '@/lib/types'

// =============================================================================
// Zod Schemas - Based on actual database schema
// =============================================================================

// Categories table insert schema
const CategoryInsertSchema = z.object({
  tenant_id: z.string().uuid(),
  menu_id: z.string().uuid(),
  name: z.string().min(1),
  name_key: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  description_key: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().default(0),
})

// Menu items table insert schema
const MenuItemInsertSchema = z.object({
  tenant_id: z.string().uuid(),
  category_id: z.string().uuid(),
  name: z.string().min(1),
  name_key: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  description_key: z.string().nullable().optional(),
  base_price: z.number().nonnegative(),
  compare_price: z.number().nullable().optional(),
  image_urls: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_new: z.boolean().default(false),
  is_sold_out: z.boolean().default(false),
  preparation_time: z.number().int().nullable().optional(),
  calories: z.number().int().nullable().optional(),
  dietary_tags: z.array(z.string()).optional(),
  sort_order: z.number().int().default(0),
})

// Variant categories table insert schema
const VariantCategoryInsertSchema = z.object({
  tenant_id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  is_required: z.boolean().default(false),
  allow_multiple: z.boolean().default(false),
  sort_order: z.number().int().default(0),
  is_active: z.boolean().default(true),
})

// Menu item variants table insert schema
const MenuItemVariantInsertSchema = z.object({
  tenant_id: z.string().uuid(),
  menu_item_id: z.string().uuid(),
  category_id: z.string().uuid(),
  name: z.string().min(1),
  price_adjustment: z.number().default(0),
  is_default: z.boolean().default(false),
  is_available: z.boolean().default(true),
  sort_order: z.number().int().default(0),
})

// Tables insert schema
const TableInsertSchema = z.object({
  tenant_id: z.string().uuid(),
  location_id: z.string().uuid(),
  name: z.string().min(1),
  zone: z.string().nullable().optional(),
  capacity: z.number().int().default(4),
  is_active: z.boolean().default(true),
  status: z.string().default('available'),
})

// =============================================================================
// Types derived from schemas
// =============================================================================

export type CategoryInsert = z.input<typeof CategoryInsertSchema>
export type MenuItemInsert = z.input<typeof MenuItemInsertSchema>
export type VariantCategoryInsert = z.input<typeof VariantCategoryInsertSchema>
export type MenuItemVariantInsert = z.input<typeof MenuItemVariantInsertSchema>
export type TableInsert = z.input<typeof TableInsertSchema>

// =============================================================================
// Seed Result Types
// =============================================================================

export type SeedResult = {
  success: boolean
  categories: { id: string; name: string }[]
  menuItems: { id: string; name: string; categoryId: string }[]
  variantCategories: { id: string; name: string }[]
  variants: { id: string; name: string; categoryId: string }[]
  tables: { id: string; name: string; zone: string }[]
  errors: string[]
}

// =============================================================================
// Seed Data Service
// =============================================================================

export class SeedDataService {
  private supabaseAdmin: SupabaseClient
  private tenantId: string
  private menuId: string
  private locationId: string | null
  private errors: string[] = []

  constructor(tenantId: string, menuId: string, locationId?: string) {
    this.supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.tenantId = tenantId
    this.menuId = menuId
    this.locationId = locationId || null
  }

  async seedForBusinessType(type: TenantType): Promise<SeedResult> {
    const seedData = getSeedDataForType(type)
    const result: SeedResult = {
      success: true,
      categories: [],
      menuItems: [],
      variantCategories: [],
      variants: [],
      tables: [],
      errors: [],
    }

    try {
      // Step 1: Bulk create categories
      const categoryInserts: CategoryInsert[] = seedData.categories.map((cat) => ({
        tenant_id: this.tenantId,
        menu_id: this.menuId,
        name: cat.name,
        description: cat.description || null,
        sort_order: cat.sort_order,
        is_active: true,
      }))

      const categories = await this.bulkCreateCategories(categoryInserts)
      result.categories = categories.map((c) => ({ id: c.id, name: c.name }))

      // Step 2: Bulk create menu items for all categories
      const menuItemInserts: MenuItemInsert[] = []
      for (const category of seedData.categories) {
        const createdCat = categories.find((c) => c.name === category.name)
        if (!createdCat) continue

        for (const item of category.items) {
          menuItemInserts.push({
            tenant_id: this.tenantId,
            category_id: createdCat.id,
            name: item.name,
            description: item.description || null,
            base_price: item.price,
            sort_order: item.sort_order,
            is_active: true,
          })
        }
      }

      const menuItems = await this.bulkCreateMenuItems(menuItemInserts)
      result.menuItems = menuItems.map((m) => ({
        id: m.id,
        name: m.name,
        categoryId: m.category_id,
      }))

      // Step 3: Bulk create variant categories and their variants
      if (seedData.variantCategories.length > 0 && result.menuItems.length > 0) {
        const firstItemId = result.menuItems[0].id

        const variantCatInserts: VariantCategoryInsert[] = seedData.variantCategories.map((vc, idx) => ({
          tenant_id: this.tenantId,
          name: vc.name,
          description: vc.description || null,
          is_required: vc.is_required,
          allow_multiple: vc.allow_multiple,
          sort_order: idx,
          is_active: true,
        }))

        const variantCategories = await this.bulkCreateVariantCategories(variantCatInserts)
        result.variantCategories = variantCategories.map((vc) => ({ id: vc.id, name: vc.name }))

        // Bulk create variants for all variant categories
        const variantInserts: MenuItemVariantInsert[] = []
        for (const variantCat of seedData.variantCategories) {
          const createdVarCat = variantCategories.find((vc) => vc.name === variantCat.name)
          if (!createdVarCat) continue

          for (let idx = 0; idx < variantCat.variants.length; idx++) {
            const variant = variantCat.variants[idx]
            variantInserts.push({
              tenant_id: this.tenantId,
              menu_item_id: firstItemId,
              category_id: createdVarCat.id,
              name: variant.name,
              price_adjustment: variant.price_adjustment,
              sort_order: idx,
              is_available: true,
            })
          }
        }

        const variants = await this.bulkCreateMenuItemVariants(variantInserts)
        result.variants = variants.map((v) => ({
          id: v.id,
          name: v.name,
          categoryId: v.category_id,
        }))
      }

      // Step 4: Bulk create tables
      if (this.locationId) {
        const tableInserts: TableInsert[] = defaultZonesAndTables.map((t) => ({
          tenant_id: this.tenantId,
          location_id: this.locationId!,
          name: t.name,
          zone: t.zone,
          capacity: t.capacity,
          is_active: true,
        }))

        const tables = await this.bulkCreateTables(tableInserts)
        result.tables = tables.map((t) => ({
          id: t.id,
          name: t.name,
          zone: t.zone || '',
        }))
      }

      result.errors = this.errors
      result.success = this.errors.length === 0
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      result.errors.push(`Seed process failed: ${errorMessage}`)
      result.success = false
    }

    return result
  }

  private async bulkCreateCategories(data: CategoryInsert[]): Promise<{ id: string; name: string }[]> {
    if (data.length === 0) return []

    const validated = data.map((d) => CategoryInsertSchema.parse(d))
    const { data: result, error } = await this.supabaseAdmin
      .from('categories')
      .insert(validated)
      .select('id, name')

    if (error) {
      this.errors.push(`Bulk category creation failed: ${error.message}`)
      return []
    }

    return result || []
  }

  private async bulkCreateMenuItems(data: MenuItemInsert[]): Promise<{ id: string; name: string; category_id: string }[]> {
    if (data.length === 0) return []

    const validated = data.map((d) => MenuItemInsertSchema.parse(d))
    const { data: result, error } = await this.supabaseAdmin
      .from('menu_items')
      .insert(validated)
      .select('id, name, category_id')

    if (error) {
      this.errors.push(`Bulk menu item creation failed: ${error.message}`)
      return []
    }

    return result || []
  }

  private async bulkCreateVariantCategories(data: VariantCategoryInsert[]): Promise<{ id: string; name: string }[]> {
    if (data.length === 0) return []

    const validated = data.map((d) => VariantCategoryInsertSchema.parse(d))
    const { data: result, error } = await this.supabaseAdmin
      .from('variant_categories')
      .insert(validated)
      .select('id, name')

    if (error) {
      this.errors.push(`Bulk variant category creation failed: ${error.message}`)
      return []
    }

    return result || []
  }

  private async bulkCreateMenuItemVariants(data: MenuItemVariantInsert[]): Promise<{ id: string; name: string; category_id: string }[]> {
    if (data.length === 0) return []

    const validated = data.map((d) => MenuItemVariantInsertSchema.parse(d))
    const { data: result, error } = await this.supabaseAdmin
      .from('menu_item_variants')
      .insert(validated)
      .select('id, name, category_id')

    if (error) {
      this.errors.push(`Bulk menu item variant creation failed: ${error.message}`)
      return []
    }

    return result || []
  }

  private async bulkCreateTables(data: TableInsert[]): Promise<{ id: string; name: string; zone: string | null }[]> {
    if (data.length === 0) return []

    const validated = data.map((d) => TableInsertSchema.parse(d))
    const { data: result, error } = await this.supabaseAdmin
      .from('tables')
      .insert(validated)
      .select('id, name, zone')

    if (error) {
      this.errors.push(`Bulk table creation failed: ${error.message}`)
      return []
    }

    return result || []
  }
}

// =============================================================================
// Convenience function for seeding
// =============================================================================

export async function seedTenantData(
  tenantId: string,
  menuId: string,
  businessType: TenantType,
  locationId?: string
): Promise<SeedResult> {
  const service = new SeedDataService(tenantId, menuId, locationId)
  return service.seedForBusinessType(businessType)
}
