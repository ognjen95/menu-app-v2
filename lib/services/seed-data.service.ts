import { z } from 'zod'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getSeedDataForType } from '@/lib/seed-data'
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

// =============================================================================
// Types derived from schemas
// =============================================================================

export type CategoryInsert = z.input<typeof CategoryInsertSchema>
export type MenuItemInsert = z.input<typeof MenuItemInsertSchema>
export type VariantCategoryInsert = z.input<typeof VariantCategoryInsertSchema>
export type MenuItemVariantInsert = z.input<typeof MenuItemVariantInsertSchema>

// =============================================================================
// Seed Result Types
// =============================================================================

export type SeedResult = {
  success: boolean
  categories: { id: string; name: string }[]
  menuItems: { id: string; name: string; categoryId: string }[]
  variantCategories: { id: string; name: string }[]
  variants: { id: string; name: string; categoryId: string }[]
  errors: string[]
}

// =============================================================================
// Seed Data Service
// =============================================================================

export class SeedDataService {
  private supabaseAdmin: SupabaseClient
  private tenantId: string
  private menuId: string
  private errors: string[] = []

  constructor(tenantId: string, menuId: string) {
    this.supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    this.tenantId = tenantId
    this.menuId = menuId
  }

  async seedForBusinessType(type: TenantType): Promise<SeedResult> {
    const seedData = getSeedDataForType(type)
    const result: SeedResult = {
      success: true,
      categories: [],
      menuItems: [],
      variantCategories: [],
      variants: [],
      errors: [],
    }

    try {
      // Step 1: Create categories and their items
      for (const category of seedData.categories) {
        const categoryResult = await this.createCategory({
          tenant_id: this.tenantId,
          menu_id: this.menuId,
          name: category.name,
          description: category.description || null,
          sort_order: category.sort_order,
          is_active: true,
        })

        if (!categoryResult) continue

        result.categories.push({ id: categoryResult.id, name: categoryResult.name })

        // Create items for this category
        for (const item of category.items) {
          const itemResult = await this.createMenuItem({
            tenant_id: this.tenantId,
            category_id: categoryResult.id,
            name: item.name,
            description: item.description || null,
            base_price: item.price,
            sort_order: item.sort_order,
            is_active: true,
          })

          if (itemResult) {
            result.menuItems.push({
              id: itemResult.id,
              name: itemResult.name,
              categoryId: categoryResult.id,
            })
          }
        }
      }

      // Step 2: Create variant categories and variants
      if (seedData.variantCategories.length > 0 && result.menuItems.length > 0) {
        const firstItemId = result.menuItems[0].id

        for (const variantCat of seedData.variantCategories) {
          const variantCatResult = await this.createVariantCategory({
            tenant_id: this.tenantId,
            name: variantCat.name,
            description: variantCat.description || null,
            is_required: variantCat.is_required,
            allow_multiple: variantCat.allow_multiple,
            is_active: true,
          })

          if (!variantCatResult) continue

          result.variantCategories.push({
            id: variantCatResult.id,
            name: variantCatResult.name,
          })

          // Create variants for this category
          for (let idx = 0; idx < variantCat.variants.length; idx++) {
            const variant = variantCat.variants[idx]
            const variantResult = await this.createMenuItemVariant({
              tenant_id: this.tenantId,
              menu_item_id: firstItemId,
              category_id: variantCatResult.id,
              name: variant.name,
              price_adjustment: variant.price_adjustment,
              sort_order: idx,
              is_available: true,
            })

            if (variantResult) {
              result.variants.push({
                id: variantResult.id,
                name: variantResult.name,
                categoryId: variantCatResult.id,
              })
            }
          }
        }
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

  private async createCategory(data: CategoryInsert): Promise<{ id: string; name: string } | null> {
    const validation = CategoryInsertSchema.safeParse(data)
    
    if (!validation.success) {
      this.errors.push(`Category validation failed: ${validation.error.message}`)
      return null
    }

    const { data: result, error } = await this.supabaseAdmin
      .from('categories')
      .insert(validation.data)
      .select('id, name')
      .single()

    if (error) {
      this.errors.push(`Category creation failed (${data.name}): ${error.message}`)
      return null
    }

    return result
  }

  private async createMenuItem(data: MenuItemInsert): Promise<{ id: string; name: string } | null> {
    const validation = MenuItemInsertSchema.safeParse(data)
    
    if (!validation.success) {
      this.errors.push(`MenuItem validation failed: ${validation.error.message}`)
      return null
    }

    const { data: result, error } = await this.supabaseAdmin
      .from('menu_items')
      .insert(validation.data)
      .select('id, name')
      .single()

    if (error) {
      this.errors.push(`MenuItem creation failed (${data.name}): ${error.message}`)
      return null
    }

    return result
  }

  private async createVariantCategory(data: VariantCategoryInsert): Promise<{ id: string; name: string } | null> {
    const validation = VariantCategoryInsertSchema.safeParse(data)
    
    if (!validation.success) {
      this.errors.push(`VariantCategory validation failed: ${validation.error.message}`)
      return null
    }

    const { data: result, error } = await this.supabaseAdmin
      .from('variant_categories')
      .insert(validation.data)
      .select('id, name')
      .single()

    if (error) {
      this.errors.push(`VariantCategory creation failed (${data.name}): ${error.message}`)
      return null
    }

    return result
  }

  private async createMenuItemVariant(data: MenuItemVariantInsert): Promise<{ id: string; name: string } | null> {
    const validation = MenuItemVariantInsertSchema.safeParse(data)
    
    if (!validation.success) {
      this.errors.push(`MenuItemVariant validation failed: ${validation.error.message}`)
      return null
    }

    const { data: result, error } = await this.supabaseAdmin
      .from('menu_item_variants')
      .insert(validation.data)
      .select('id, name')
      .single()

    if (error) {
      this.errors.push(`MenuItemVariant creation failed (${data.name}): ${error.message}`)
      return null
    }

    return result
  }
}

// =============================================================================
// Convenience function for seeding
// =============================================================================

export async function seedTenantData(
  tenantId: string,
  menuId: string,
  businessType: TenantType
): Promise<SeedResult> {
  const service = new SeedDataService(tenantId, menuId)
  return service.seedForBusinessType(businessType)
}
