// Core type definitions for Klopay.app SaaS

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Enums
export type TenantType = 'restaurant' | 'cafe' | 'bar' | 'shop' | 'salon' | 'carshop' | 'other'
export type SubscriptionPlan = 'basic' | 'pro'
export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'past_due' | 'unpaid'
export type TenantRole = 'owner' | 'manager' | 'staff' | 'kitchen' | 'waiter'
export type ServiceMode = 'dine_in' | 'takeaway' | 'delivery'
export type QrCodeType = 'menu' | 'table' | 'location'
export type OrderType = 'dine_in' | 'takeaway' | 'delivery'
export type OrderStatus = 'draft' | 'placed' | 'accepted' | 'preparing' | 'ready' | 'served' | 'completed' | 'cancelled'
export type OrderItemStatus = 'pending' | 'preparing' | 'ready'
export type PaymentProvider = 'stripe' | 'monri' | 'bank_psp' | 'cash' | 'card_pos'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
export type StockAdjustmentReason = 'purchase' | 'sale' | 'waste' | 'adjustment' | 'transfer'
export type WebsiteBlockType = 'hero' | 'gallery' | 'menu_preview' | 'about' | 'testimonials' | 'contact' | 'hours' | 'social' | 'custom'
export type Currency = 'EUR' | 'USD' | 'RSD' | 'BAM' | 'GBP'

// Core entities
export interface Tenant {
  id: string
  name: string
  slug: string
  type: TenantType
  logo_url: string | null
  description: string | null
  email: string | null
  phone: string | null
  timezone: string
  default_currency: Currency
  country: string
  vat_rate: number
  tax_id: string | null
  plan: SubscriptionPlan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_status: SubscriptionStatus
  trial_ends_at: string | null
  settings: Json
  created_at: string
  updated_at: string
}

export interface TenantUser {
  id: string
  tenant_id: string
  user_id: string
  role: TenantRole
  is_active: boolean
  invited_by: string | null
  invited_at: string | null
  joined_at: string | null
  created_at: string
}

export interface Location {
  id: string
  tenant_id: string
  name: string
  slug: string
  address: string | null
  city: string | null
  postal_code: string | null
  country: string
  latitude: number | null
  longitude: number | null
  phone: string | null
  email: string | null
  is_active: boolean
  service_modes: ServiceMode[]
  opening_hours: OpeningHours
  settings: Json
  created_at: string
  updated_at: string
}

export interface OpeningHours {
  monday: DayHours
  tuesday: DayHours
  wednesday: DayHours
  thursday: DayHours
  friday: DayHours
  saturday: DayHours
  sunday: DayHours
}

export interface DayHours {
  open: string
  close: string
  is_closed: boolean
}

export interface Table {
  id: string
  location_id: string
  tenant_id: string
  name: string
  zone: string | null
  capacity: number
  position_x: number | null
  position_y: number | null
  is_active: boolean
  status: 'available' | 'occupied' | 'reserved'
  current_order_id: string | null
  created_at: string
  updated_at: string
}

export interface QrCode {
  id: string
  tenant_id: string
  location_id: string | null
  table_id: string | null
  code: string
  type: QrCodeType
  url: string
  style: QrCodeStyle
  scans_count: number
  last_scanned_at: string | null
  created_at: string
}

export interface QrCodeStyle {
  color: string
  background: string
  logo: boolean
}

// Menu entities
export interface Menu {
  id: string
  tenant_id: string
  location_id: string | null
  name: string
  name_key: string | null
  description: string | null
  description_key: string | null
  is_active: boolean
  available_from: string | null
  available_until: string | null
  available_days: number[]
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  menu_id: string
  tenant_id: string
  name: string
  name_key: string | null
  description: string | null
  description_key: string | null
  image_url: string | null
  icon: string | null
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface MenuItem {
  id: string
  category_id: string
  tenant_id: string
  name: string
  name_key: string | null
  description: string | null
  description_key: string | null
  base_price: number
  compare_price: number | null
  image_urls: string[]
  is_active: boolean
  is_featured: boolean
  is_new: boolean
  is_sold_out: boolean
  preparation_time: number | null
  calories: number | null
  dietary_tags: string[]
  sort_order: number
  created_at: string
  updated_at: string
  // Relations (when fetched with joins)
  item_allergens?: {
    allergen_id: string
    allergens: Allergen
  }[]
}

export interface ItemVariant {
  id: string
  item_id: string
  name: string
  name_key: string | null
  price_modifier: number
  is_default: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface VariantCategory {
  id: string
  tenant_id: string
  name: string
  description: string | null
  is_required: boolean
  allow_multiple: boolean
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface MenuItemVariant {
  id: string
  tenant_id: string
  menu_item_id: string
  category_id: string
  name: string
  price_adjustment: number
  is_default: boolean
  is_available: boolean
  sort_order: number
  created_at: string
  updated_at: string
  // Relations
  category?: VariantCategory
}

export interface OptionGroup {
  id: string
  item_id: string
  tenant_id: string
  name: string
  name_key: string | null
  is_required: boolean
  min_selections: number
  max_selections: number
  sort_order: number
  created_at: string
}

export interface ItemOption {
  id: string
  group_id: string
  name: string
  name_key: string | null
  price: number
  is_default: boolean
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Allergen {
  id: string
  code: string
  name: string
  name_key: string | null
  icon: string | null
  description: string | null
}

// Order entities
export interface Order {
  id: string
  tenant_id: string
  location_id: string
  table_id: string | null
  order_number: string
  type: OrderType
  status: OrderStatus
  customer_name: string | null
  customer_phone: string | null
  customer_email: string | null
  customer_notes: string | null
  session_id: string | null
  subtotal: number
  tax_rate: number
  tax_amount: number
  discount_amount: number
  discount_code: string | null
  tip_amount: number
  delivery_fee: number
  total: number
  currency: Currency
  delivery_address: string | null
  delivery_city: string | null
  delivery_postal_code: string | null
  delivery_instructions: string | null
  scheduled_for: string | null
  estimated_ready_at: string | null
  placed_at: string | null
  accepted_at: string | null
  preparing_at: string | null
  ready_at: string | null
  served_at: string | null
  completed_at: string | null
  cancelled_at: string | null
  cancellation_reason: string | null
  accepted_by: string | null
  prepared_by: string | null
  served_by: string | null
  cancelled_by: string | null
  status_updated_by: string | null
  created_at: string
  updated_at: string
}

export interface SelectedVariant {
  id: string
  name: string
  price_adjustment: number
}

export interface OrderItem {
  id: string
  order_id: string
  menu_item_id: string
  variant_id: string | null
  item_name: string
  variant_name: string | null
  selected_variants: SelectedVariant[] | null // New variant system
  quantity: number
  unit_price: number
  options_price: number
  total_price: number
  selected_options: SelectedOption[]
  notes: string | null
  status: OrderItemStatus
  started_at: string | null
  completed_at: string | null
  created_at: string
}

export interface SelectedOption {
  option_id: string
  name: string
  price: number
}

export interface OrderPayment {
  id: string
  order_id: string
  tenant_id: string
  provider: PaymentProvider
  status: PaymentStatus
  amount: number
  currency: Currency
  provider_payment_id: string | null
  provider_data: Json
  paid_at: string | null
  failed_at: string | null
  refunded_at: string | null
  refund_amount: number | null
  refund_reason: string | null
  created_at: string
  updated_at: string
}

// Website entities
export interface Website {
  id: string
  tenant_id: string
  subdomain: string | null
  custom_domain: string | null
  is_published: boolean
  theme_id: string | null
  primary_color: string | null
  secondary_color: string | null
  background_color: string | null
  foreground_color: string | null
  accent_color: string | null
  font_heading: string | null
  font_body: string | null
  logo_url: string | null
  favicon_url: string | null
  seo_title: string | null
  seo_description: string | null
  seo_image_url: string | null
  social_links: SocialLinks
  google_analytics_id: string | null
  facebook_pixel_id: string | null
  settings: Json
  created_at: string
  updated_at: string
}

export interface SocialLinks {
  facebook?: string
  instagram?: string
  twitter?: string
  tiktok?: string
  youtube?: string
  linkedin?: string
}

export interface WebsitePage {
  id: string
  website_id: string
  tenant_id: string
  slug: string
  title: string
  title_key: string | null
  is_published: boolean
  is_in_navigation: boolean
  sort_order: number
  seo_title: string | null
  seo_description: string | null
  created_at: string
  updated_at: string
}

export interface WebsiteBlock {
  id: string
  page_id: string
  tenant_id: string
  type: WebsiteBlockType
  content: Json
  content_keys: Json
  settings: BlockSettings
  is_visible: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface BlockSettings {
  padding: 'none' | 'small' | 'normal' | 'large'
  background: 'default' | 'primary' | 'secondary' | 'accent' | 'muted'
  alignment: 'left' | 'center' | 'right'
}

export interface Theme {
  id: string
  name: string
  slug: string
  description: string | null
  preview_url: string | null
  is_pro: boolean
  is_active: boolean
  default_colors: ThemeColors
  default_fonts: ThemeFonts
  default_blocks: Json
  created_at: string
}

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  foreground: string
  accent: string
}

export interface ThemeFonts {
  heading: string
  body: string
}

// Inventory entities
export interface Ingredient {
  id: string
  tenant_id: string
  location_id: string | null
  name: string
  sku: string | null
  unit: string
  current_stock: number
  reorder_threshold: number
  cost_per_unit: number
  supplier: string | null
  is_tracked: boolean
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface StockAdjustment {
  id: string
  ingredient_id: string
  tenant_id: string
  user_id: string | null
  quantity_before: number
  quantity_change: number
  quantity_after: number
  reason: StockAdjustmentReason
  order_id: string | null
  notes: string | null
  created_at: string
}

// Translation entities
export interface Language {
  code: string
  name: string
  native_name: string
  flag_emoji: string | null
  is_rtl: boolean
  is_active: boolean
}

export interface Translation {
  id: string
  tenant_id: string
  key: string
  language_code: string
  value: string
  is_auto_translated: boolean
  created_at: string
  updated_at: string
}

// Analytics
export interface AnalyticsDaily {
  id: string
  tenant_id: string
  location_id: string | null
  date: string
  total_orders: number
  completed_orders: number
  cancelled_orders: number
  dine_in_orders: number
  takeaway_orders: number
  delivery_orders: number
  gross_revenue: number
  net_revenue: number
  tips_total: number
  average_order_value: number
  average_preparation_time: number | null
  average_service_time: number | null
  top_items: TopItem[]
  top_categories: TopCategory[]
  unique_customers: number
  repeat_customers: number
  created_at: string
  updated_at: string
}

export interface TopItem {
  item_id: string
  name: string
  quantity: number
  revenue: number
}

export interface TopCategory {
  category_id: string
  name: string
  quantity: number
  revenue: number
}

// Plan features
export interface PlanFeature {
  id: string
  plan: SubscriptionPlan
  feature_key: string
  is_enabled: boolean
  limit_value: number | null
}

// Extended types with relations
export interface MenuItemWithRelations extends MenuItem {
  category?: Category
  variants?: ItemVariant[]
  menu_item_variants?: MenuItemVariant[]
  option_groups?: OptionGroupWithOptions[]
  allergens?: Allergen[]
}

export interface OptionGroupWithOptions extends OptionGroup {
  options: ItemOption[]
}

export interface OrderWithRelations extends Order {
  items?: OrderItemWithRelations[]
  payments?: OrderPayment[]
  table?: Table
  location?: Location
  status_updated_by_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  assigned_to_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  accepted_by_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  prepared_by_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  served_by_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
  cancelled_by_profile?: {
    id: string
    full_name: string | null
    avatar_url: string | null
  }
}

export interface OrderItemWithRelations extends OrderItem {
  menu_item?: MenuItem
  variant?: ItemVariant
}

export interface CategoryWithItems extends Category {
  items: MenuItem[]
}

export interface MenuWithCategories extends Menu {
  categories: CategoryWithItems[]
}

export interface TenantWithRelations extends Tenant {
  locations?: Location[]
  users?: TenantUser[]
  website?: Website
}

// Translation entities
export interface Language {
  code: string
  name: string
  native_name: string
  flag_emoji: string | null
  is_rtl: boolean
}

export interface TenantLanguage {
  tenant_id: string
  language_code: string
  is_default: boolean
  is_enabled: boolean
  language?: Language
}

export interface Translation {
  id: string
  tenant_id: string
  key: string
  language_code: string
  value: string
  is_auto_translated: boolean
  created_at: string
  updated_at: string
}
