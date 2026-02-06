# Orders Feature

This feature provides order management functionality for the dashboard, including viewing, tracking, and creating orders.

## Pages

### `/dashboard/waiter` - Waiter Mode (Mobile-First)

A dedicated mobile-optimized page for waiters to take orders on phones.

**UX Features:**
- **Bottom Tab Navigation**: Tables and Orders tabs, thumb-friendly
- **Large Touch Targets**: 44px+ buttons, easy to tap
- **Table Grid View**: Visual table layout with order status indicators
- **Quick Order Buttons**: Takeaway/Delivery shortcuts
- **Full-Screen Menu**: Swipe categories, large item rows with +/- controls
- **Bottom Sheet Cart**: Slide-up cart review
- **Location Persistence**: Saves selected location to localStorage

**Mobile-First Design:**
- Minimal header, maximum content area
- Rounded corners for modern feel
- Bottom sheets instead of modals
- Haptic-friendly button sizes
- Safe area padding for notch devices

**Access:** Sidebar → "Waiter Mode" or `/dashboard/waiter`

---

## Components

### `components/order-card.tsx`

A reusable card component for displaying order information in grid and kanban views.

**Features:**
- Status indicator bar with color coding
- Order number and type badge
- Time elapsed since order placed (color-coded urgency)
- Table info and notes indicator
- Expandable item list with variants, options, and allergens
- Customer notes display
- Total price and status badge

**Props:**
```typescript
interface OrderCardProps {
  order: OrderWithRelations
  onSelect: (order: OrderWithRelations) => void
}
```

**Exports:**
- `OrderCard` - The main component
- `statusConfig` - Order status configurations (colors, icons, labels)
- `typeIcons` - Order type icons (dine_in, takeaway, delivery)
- `formatTimeElapsed` - Utility to format time since order
- `getTimerColor` - Utility to get urgency color based on time

**Usage:**
```tsx
import { OrderCard, statusConfig } from '@/components/features/orders/components/order-card'

<OrderCard order={order} onSelect={(order) => setSelectedOrder(order)} />
```

### `create-order-dialog.tsx`

A POS-style dialog/sheet for creating new orders. Designed for waiters and staff to quickly create orders.

**Features:**
- **Location Selection**: Dropdown to select location, persisted to localStorage
- **Table Selection**: Dropdown filtered by selected location (only for dine-in orders)
- **Staff Selection**: Preselects the logged-in user
- **Order Type Toggle**: Dine In, Takeaway, or Delivery
- **Menu Items Grid**: Compact searchable grid with category filtering
- **Cart Management**: Add/remove items, adjust quantities
- **Customer Info**: Optional name, phone, and notes
- **Responsive Design**: Uses Sheet on mobile, Dialog on desktop

**Props:**
```typescript
interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}
```

**Usage:**
```tsx
import { CreateOrderDialog } from '@/components/features/orders/create-order-dialog'

const [isOpen, setIsOpen] = useState(false)

<CreateOrderDialog open={isOpen} onOpenChange={setIsOpen} />
```

**LocalStorage:**
- `pos-selected-location`: Persists the selected location ID

### `OrderLogsDialog.tsx`

Dialog for viewing order status change logs.

## Translations

Uses the following translation namespaces:
- `createOrder` - For the create order dialog
- `ordersPage` - For the main orders page

## API Dependencies

- `GET /api/locations` - Fetch locations
- `GET /api/tables?location_id=<id>` - Fetch tables for a location
- `GET /api/team` - Fetch team members
- `GET /api/profile` - Get current user profile
- `GET /api/menu/items` - Get all menu items
- `POST /api/orders` - Create new order

## Hooks Used

- `useCreateOrder` from `@/lib/hooks/use-orders`
- `useQuery` from `@tanstack/react-query`
