import type { TenantType } from '@/lib/types'

export type SeedCategory = {
  name: string
  description?: string
  sort_order: number
  items: SeedMenuItem[]
}

export type SeedMenuItem = {
  name: string
  description?: string
  price: number
  sort_order: number
}

export type SeedVariantCategory = {
  name: string
  description?: string
  is_required: boolean
  allow_multiple: boolean
  variants: { name: string; price_adjustment: number }[]
}

export type SeedTable = {
  name: string
  zone: string
  capacity: number
}

export type SeedData = {
  menuName: string
  categories: SeedCategory[]
  variantCategories: SeedVariantCategory[]
}

// Default zones and tables seed data
export const defaultZonesAndTables: SeedTable[] = [
  // Indoor zone - 3 tables
  { name: 'Table 1', zone: 'Indoor', capacity: 4 },
  { name: 'Table 2', zone: 'Indoor', capacity: 4 },
  { name: 'Table 3', zone: 'Indoor', capacity: 4 },
  // Outdoor zone - 3 tables
  { name: 'Table 1', zone: 'Outdoor', capacity: 4 },
  { name: 'Table 2', zone: 'Outdoor', capacity: 4 },
  { name: 'Table 3', zone: 'Outdoor', capacity: 4 },
]

// Restaurant seed data
const restaurantSeedData: SeedData = {
  menuName: 'Main Menu',
  categories: [
    {
      name: 'Starters',
      description: 'Appetizers and small plates',
      sort_order: 0,
      items: [
        { name: 'Bruschetta', description: 'Toasted bread with tomatoes and basil', price: 6.50, sort_order: 0 },
        { name: 'Soup of the Day', description: 'Ask your server for today\'s selection', price: 5.00, sort_order: 1 },
        { name: 'Caesar Salad', description: 'Romaine lettuce, croutons, parmesan', price: 8.50, sort_order: 2 },
      ]
    },
    {
      name: 'Main Courses',
      description: 'Our signature dishes',
      sort_order: 1,
      items: [
        { name: 'Grilled Chicken', description: 'Served with seasonal vegetables', price: 14.90, sort_order: 0 },
        { name: 'Beef Steak', description: '200g beef with fries', price: 18.90, sort_order: 1 },
        { name: 'Grilled Fish', description: 'Fresh catch of the day', price: 16.90, sort_order: 2 },
        { name: 'Pasta Carbonara', description: 'Creamy pasta with bacon', price: 12.90, sort_order: 3 },
      ]
    },
    {
      name: 'Desserts',
      description: 'Sweet treats',
      sort_order: 2,
      items: [
        { name: 'Tiramisu', description: 'Classic Italian dessert', price: 6.50, sort_order: 0 },
        { name: 'Chocolate Cake', description: 'Rich chocolate layer cake', price: 5.50, sort_order: 1 },
        { name: 'Ice Cream', description: 'Three scoops of your choice', price: 4.50, sort_order: 2 },
      ]
    },
    {
      name: 'Beverages',
      description: 'Drinks and refreshments',
      sort_order: 3,
      items: [
        { name: 'Soft Drinks', description: 'Coca-Cola, Fanta, Sprite', price: 2.50, sort_order: 0 },
        { name: 'Fresh Juice', description: 'Orange, Apple, or Mixed', price: 3.50, sort_order: 1 },
        { name: 'Coffee', description: 'Espresso, Americano, or Cappuccino', price: 2.00, sort_order: 2 },
        { name: 'Water', description: 'Still or Sparkling', price: 1.50, sort_order: 3 },
      ]
    },
  ],
  variantCategories: [
    {
      name: 'Size',
      description: 'Choose your portion size',
      is_required: false,
      allow_multiple: false,
      variants: [
        { name: 'Small', price_adjustment: -2.00 },
        { name: 'Regular', price_adjustment: 0 },
        { name: 'Large', price_adjustment: 3.00 },
      ]
    },
    {
      name: 'Cooking Level',
      description: 'How would you like it cooked?',
      is_required: false,
      allow_multiple: false,
      variants: [
        { name: 'Rare', price_adjustment: 0 },
        { name: 'Medium Rare', price_adjustment: 0 },
        { name: 'Medium', price_adjustment: 0 },
        { name: 'Well Done', price_adjustment: 0 },
      ]
    },
  ]
}

// Cafe seed data
const cafeSeedData: SeedData = {
  menuName: 'Cafe Menu',
  categories: [
    {
      name: 'Hot Drinks',
      description: 'Freshly brewed beverages',
      sort_order: 0,
      items: [
        { name: 'Espresso', description: 'Single shot of espresso', price: 1.80, sort_order: 0 },
        { name: 'Americano', description: 'Espresso with hot water', price: 2.20, sort_order: 1 },
        { name: 'Cappuccino', description: 'Espresso with steamed milk foam', price: 2.80, sort_order: 2 },
        { name: 'Latte', description: 'Espresso with steamed milk', price: 3.00, sort_order: 3 },
        { name: 'Hot Chocolate', description: 'Rich chocolate drink', price: 3.20, sort_order: 4 },
        { name: 'Tea', description: 'Selection of premium teas', price: 2.00, sort_order: 5 },
      ]
    },
    {
      name: 'Cold Drinks',
      description: 'Refreshing cold beverages',
      sort_order: 1,
      items: [
        { name: 'Iced Coffee', description: 'Cold brew or iced espresso', price: 3.50, sort_order: 0 },
        { name: 'Iced Latte', description: 'Espresso with cold milk', price: 3.80, sort_order: 1 },
        { name: 'Frappe', description: 'Blended ice coffee drink', price: 4.00, sort_order: 2 },
        { name: 'Fresh Lemonade', description: 'Freshly squeezed lemons', price: 3.00, sort_order: 3 },
        { name: 'Smoothie', description: 'Mixed fruit smoothie', price: 4.50, sort_order: 4 },
      ]
    },
    {
      name: 'Pastries',
      description: 'Freshly baked goods',
      sort_order: 2,
      items: [
        { name: 'Croissant', description: 'Buttery French pastry', price: 2.50, sort_order: 0 },
        { name: 'Chocolate Croissant', description: 'Croissant with chocolate filling', price: 3.00, sort_order: 1 },
        { name: 'Muffin', description: 'Blueberry or Chocolate chip', price: 2.80, sort_order: 2 },
        { name: 'Cinnamon Roll', description: 'Sweet cinnamon pastry', price: 3.50, sort_order: 3 },
      ]
    },
    {
      name: 'Light Bites',
      description: 'Sandwiches and snacks',
      sort_order: 3,
      items: [
        { name: 'Club Sandwich', description: 'Classic triple-decker sandwich', price: 7.50, sort_order: 0 },
        { name: 'Avocado Toast', description: 'Smashed avocado on sourdough', price: 6.50, sort_order: 1 },
        { name: 'Caesar Salad', description: 'Fresh romaine with dressing', price: 8.00, sort_order: 2 },
      ]
    },
  ],
  variantCategories: [
    {
      name: 'Milk Type',
      description: 'Choose your milk',
      is_required: false,
      allow_multiple: false,
      variants: [
        { name: 'Regular Milk', price_adjustment: 0 },
        { name: 'Oat Milk', price_adjustment: 0.50 },
        { name: 'Almond Milk', price_adjustment: 0.50 },
        { name: 'Soy Milk', price_adjustment: 0.50 },
      ]
    },
    {
      name: 'Size',
      description: 'Choose your cup size',
      is_required: false,
      allow_multiple: false,
      variants: [
        { name: 'Small', price_adjustment: 0 },
        { name: 'Medium', price_adjustment: 0.50 },
        { name: 'Large', price_adjustment: 1.00 },
      ]
    },
    {
      name: 'Extras',
      description: 'Add extras to your drink',
      is_required: false,
      allow_multiple: true,
      variants: [
        { name: 'Extra Shot', price_adjustment: 0.80 },
        { name: 'Whipped Cream', price_adjustment: 0.50 },
        { name: 'Vanilla Syrup', price_adjustment: 0.40 },
        { name: 'Caramel Syrup', price_adjustment: 0.40 },
      ]
    },
  ]
}

// Bar seed data
const barSeedData: SeedData = {
  menuName: 'Drinks Menu',
  categories: [
    {
      name: 'Beer',
      description: 'Draft and bottled beers',
      sort_order: 0,
      items: [
        { name: 'Draft Beer', description: 'Local draft beer 0.5L', price: 3.50, sort_order: 0 },
        { name: 'Craft Beer', description: 'Selection of craft beers', price: 5.00, sort_order: 1 },
        { name: 'Imported Beer', description: 'Premium imported beers', price: 4.50, sort_order: 2 },
      ]
    },
    {
      name: 'Wine',
      description: 'Red, white, and rosé wines',
      sort_order: 1,
      items: [
        { name: 'House Red', description: 'Glass of house red wine', price: 4.50, sort_order: 0 },
        { name: 'House White', description: 'Glass of house white wine', price: 4.50, sort_order: 1 },
        { name: 'Prosecco', description: 'Italian sparkling wine', price: 5.50, sort_order: 2 },
        { name: 'Champagne', description: 'Premium champagne by the glass', price: 12.00, sort_order: 3 },
      ]
    },
    {
      name: 'Cocktails',
      description: 'Signature and classic cocktails',
      sort_order: 2,
      items: [
        { name: 'Mojito', description: 'Rum, mint, lime, soda', price: 8.00, sort_order: 0 },
        { name: 'Margarita', description: 'Tequila, lime, triple sec', price: 8.50, sort_order: 1 },
        { name: 'Moscow Mule', description: 'Vodka, ginger beer, lime', price: 8.00, sort_order: 2 },
        { name: 'Old Fashioned', description: 'Bourbon, bitters, sugar', price: 9.00, sort_order: 3 },
        { name: 'Gin & Tonic', description: 'Premium gin with tonic', price: 7.50, sort_order: 4 },
      ]
    },
    {
      name: 'Spirits',
      description: 'Premium spirits',
      sort_order: 3,
      items: [
        { name: 'Vodka', description: 'Premium vodka', price: 5.00, sort_order: 0 },
        { name: 'Whiskey', description: 'Selection of whiskeys', price: 6.00, sort_order: 1 },
        { name: 'Rum', description: 'White or dark rum', price: 5.00, sort_order: 2 },
        { name: 'Tequila', description: 'Silver or gold tequila', price: 5.50, sort_order: 3 },
      ]
    },
    {
      name: 'Non-Alcoholic',
      description: 'Soft drinks and mocktails',
      sort_order: 4,
      items: [
        { name: 'Soft Drinks', description: 'Coca-Cola, Fanta, Sprite', price: 2.50, sort_order: 0 },
        { name: 'Juice', description: 'Orange, Apple, Cranberry', price: 3.00, sort_order: 1 },
        { name: 'Virgin Mojito', description: 'Mocktail without alcohol', price: 5.00, sort_order: 2 },
        { name: 'Water', description: 'Still or Sparkling', price: 2.00, sort_order: 3 },
      ]
    },
    {
      name: 'Snacks',
      description: 'Bar bites and snacks',
      sort_order: 5,
      items: [
        { name: 'Mixed Nuts', description: 'Assorted roasted nuts', price: 4.00, sort_order: 0 },
        { name: 'Nachos', description: 'Tortilla chips with cheese', price: 7.50, sort_order: 1 },
        { name: 'Chicken Wings', description: '6 pieces with sauce', price: 8.50, sort_order: 2 },
      ]
    },
  ],
  variantCategories: [
    {
      name: 'Size',
      description: 'Choose your serving size',
      is_required: false,
      allow_multiple: false,
      variants: [
        { name: 'Single', price_adjustment: 0 },
        { name: 'Double', price_adjustment: 4.00 },
      ]
    },
  ]
}

// Shop seed data (generic retail)
const shopSeedData: SeedData = {
  menuName: 'Product Catalog',
  categories: [
    {
      name: 'Featured Products',
      description: 'Our most popular items',
      sort_order: 0,
      items: [
        { name: 'Product 1', description: 'Description of product 1', price: 19.99, sort_order: 0 },
        { name: 'Product 2', description: 'Description of product 2', price: 29.99, sort_order: 1 },
        { name: 'Product 3', description: 'Description of product 3', price: 39.99, sort_order: 2 },
      ]
    },
    {
      name: 'New Arrivals',
      description: 'Latest additions to our store',
      sort_order: 1,
      items: [
        { name: 'New Item 1', description: 'Fresh new product', price: 24.99, sort_order: 0 },
        { name: 'New Item 2', description: 'Just arrived', price: 34.99, sort_order: 1 },
      ]
    },
  ],
  variantCategories: [
    {
      name: 'Size',
      description: 'Available sizes',
      is_required: false,
      allow_multiple: false,
      variants: [
        { name: 'Small', price_adjustment: 0 },
        { name: 'Medium', price_adjustment: 5.00 },
        { name: 'Large', price_adjustment: 10.00 },
      ]
    },
  ]
}

// Salon seed data
const salonSeedData: SeedData = {
  menuName: 'Services',
  categories: [
    {
      name: 'Haircuts',
      description: 'Professional haircut services',
      sort_order: 0,
      items: [
        { name: 'Men\'s Haircut', description: 'Classic men\'s cut and style', price: 25.00, sort_order: 0 },
        { name: 'Women\'s Haircut', description: 'Cut, wash, and blow-dry', price: 45.00, sort_order: 1 },
        { name: 'Kids Haircut', description: 'For children under 12', price: 18.00, sort_order: 2 },
        { name: 'Beard Trim', description: 'Beard shaping and trim', price: 15.00, sort_order: 3 },
      ]
    },
    {
      name: 'Coloring',
      description: 'Hair coloring services',
      sort_order: 1,
      items: [
        { name: 'Full Color', description: 'Single process all-over color', price: 80.00, sort_order: 0 },
        { name: 'Highlights', description: 'Partial or full highlights', price: 120.00, sort_order: 1 },
        { name: 'Balayage', description: 'Hand-painted highlights', price: 150.00, sort_order: 2 },
        { name: 'Root Touch-Up', description: 'Color roots only', price: 50.00, sort_order: 3 },
      ]
    },
    {
      name: 'Treatments',
      description: 'Hair treatments and care',
      sort_order: 2,
      items: [
        { name: 'Deep Conditioning', description: 'Intensive moisture treatment', price: 35.00, sort_order: 0 },
        { name: 'Keratin Treatment', description: 'Smoothing and straightening', price: 200.00, sort_order: 1 },
        { name: 'Scalp Treatment', description: 'Therapeutic scalp care', price: 40.00, sort_order: 2 },
      ]
    },
    {
      name: 'Styling',
      description: 'Special occasion styling',
      sort_order: 3,
      items: [
        { name: 'Blow-Dry', description: 'Professional blow-out', price: 35.00, sort_order: 0 },
        { name: 'Updo', description: 'Special occasion updo', price: 75.00, sort_order: 1 },
        { name: 'Bridal Hair', description: 'Wedding day styling', price: 150.00, sort_order: 2 },
      ]
    },
  ],
  variantCategories: [
    {
      name: 'Hair Length',
      description: 'Price may vary based on hair length',
      is_required: false,
      allow_multiple: false,
      variants: [
        { name: 'Short', price_adjustment: 0 },
        { name: 'Medium', price_adjustment: 10.00 },
        { name: 'Long', price_adjustment: 20.00 },
        { name: 'Extra Long', price_adjustment: 35.00 },
      ]
    },
  ]
}

// Car shop seed data
const carshopSeedData: SeedData = {
  menuName: 'Services',
  categories: [
    {
      name: 'Car Wash',
      description: 'Exterior and interior cleaning',
      sort_order: 0,
      items: [
        { name: 'Basic Wash', description: 'Exterior wash and dry', price: 15.00, sort_order: 0 },
        { name: 'Full Wash', description: 'Exterior wash, interior vacuum', price: 25.00, sort_order: 1 },
        { name: 'Premium Detail', description: 'Complete interior and exterior detail', price: 80.00, sort_order: 2 },
      ]
    },
    {
      name: 'Oil Change',
      description: 'Engine oil services',
      sort_order: 1,
      items: [
        { name: 'Standard Oil Change', description: 'Conventional oil change', price: 35.00, sort_order: 0 },
        { name: 'Synthetic Oil Change', description: 'Full synthetic oil', price: 65.00, sort_order: 1 },
        { name: 'High Mileage Oil Change', description: 'For vehicles over 75k miles', price: 55.00, sort_order: 2 },
      ]
    },
    {
      name: 'Tires',
      description: 'Tire services',
      sort_order: 2,
      items: [
        { name: 'Tire Rotation', description: 'Rotate all four tires', price: 25.00, sort_order: 0 },
        { name: 'Tire Balance', description: 'Balance all four tires', price: 40.00, sort_order: 1 },
        { name: 'Flat Repair', description: 'Repair punctured tire', price: 20.00, sort_order: 2 },
      ]
    },
    {
      name: 'Maintenance',
      description: 'General maintenance services',
      sort_order: 3,
      items: [
        { name: 'Brake Inspection', description: 'Check brake pads and rotors', price: 30.00, sort_order: 0 },
        { name: 'Battery Test', description: 'Test battery health', price: 15.00, sort_order: 1 },
        { name: 'Air Filter Replacement', description: 'Replace engine air filter', price: 25.00, sort_order: 2 },
      ]
    },
  ],
  variantCategories: [
    {
      name: 'Vehicle Size',
      description: 'Price varies by vehicle size',
      is_required: false,
      allow_multiple: false,
      variants: [
        { name: 'Sedan', price_adjustment: 0 },
        { name: 'SUV', price_adjustment: 10.00 },
        { name: 'Truck', price_adjustment: 15.00 },
      ]
    },
  ]
}

// Other/generic seed data
const otherSeedData: SeedData = {
  menuName: 'Services & Products',
  categories: [
    {
      name: 'Services',
      description: 'Our service offerings',
      sort_order: 0,
      items: [
        { name: 'Service 1', description: 'Description of service 1', price: 50.00, sort_order: 0 },
        { name: 'Service 2', description: 'Description of service 2', price: 75.00, sort_order: 1 },
        { name: 'Service 3', description: 'Description of service 3', price: 100.00, sort_order: 2 },
      ]
    },
    {
      name: 'Products',
      description: 'Our product offerings',
      sort_order: 1,
      items: [
        { name: 'Product 1', description: 'Description of product 1', price: 25.00, sort_order: 0 },
        { name: 'Product 2', description: 'Description of product 2', price: 35.00, sort_order: 1 },
      ]
    },
  ],
  variantCategories: []
}

// Map business type to seed data
export const seedDataByType: Record<TenantType, SeedData> = {
  restaurant: restaurantSeedData,
  cafe: cafeSeedData,
  bar: barSeedData,
  shop: shopSeedData,
  salon: salonSeedData,
  carshop: carshopSeedData,
  other: otherSeedData,
}

// Get seed data for a specific business type
export function getSeedDataForType(type: TenantType): SeedData {
  return seedDataByType[type] || otherSeedData
}

// Default working hours
export const defaultWorkingHours = {
  monday: { open: '09:00', close: '22:00', isOpen: true },
  tuesday: { open: '09:00', close: '22:00', isOpen: true },
  wednesday: { open: '09:00', close: '22:00', isOpen: true },
  thursday: { open: '09:00', close: '22:00', isOpen: true },
  friday: { open: '09:00', close: '23:00', isOpen: true },
  saturday: { open: '10:00', close: '23:00', isOpen: true },
  sunday: { open: '10:00', close: '21:00', isOpen: false },
}

export type WorkingHours = typeof defaultWorkingHours
