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
import { OrderCard, statusConfig } from '@/features/orders/components/order-card'

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
import { CreateOrderDialog } from '@/features/orders/create-order-dialog'

const [isOpen, setIsOpen] = useState(false)

<CreateOrderDialog open={isOpen} onOpenChange={setIsOpen} />
```

**LocalStorage:**
- `pos-selected-location`: Persists the selected location ID

#### Customer Info Accordion

Customer name/phone/note fields live inside a memoized `CustomerInfoAccordion` that owns its own local state to prevent focus loss while typing. The dialog interacts with it via a `ref` exposing `getValues` / `resetValues`, so we can read data when submitting and clear it after placing an order:

```tsx
const customerInfoRef = useRef<CustomerInfoAccordionHandle | null>(null)

<CustomerInfoAccordion
  ref={customerInfoRef}
  t={t}
  isOpen={isCustomerInfoOpen}
  onToggle={setIsCustomerInfoOpen}
  initialValues={{ name: '', phone: '', notes: '' }}
/>

// Later during submission
const { name, phone, notes } = customerInfoRef.current?.getValues() ?? {
  name: '',
  phone: '',
  notes: '',
}
```

### `OrderLogsDialog.tsx`

Dialog for viewing order status change logs.

### `components/orders-kanban.tsx`

Animated kanban board for active orders. Each status column now uses a CSS grid layout with matching widths, powered by the exported `getKanbanGridTemplate` helper (see `components/orders-kanban.test.ts`).

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
- `useOfflineCreateOrder` from `@/lib/hooks/use-offline-orders`
- `useQuery` from `@tanstack/react-query`

---

## Offline Functionality

The orders feature fully supports offline mode. When the device loses connectivity:

### Order Creation
- Orders are queued in IndexedDB when created offline
- Optimistic UI shows the order immediately with an "Offline" badge
- Orders sync automatically when connectivity returns
- Toast notification informs user: "Order saved offline. Will sync when connected."

### Status Updates
- Status changes (via kanban drag-drop) work offline
- Changes are queued and synced when online
- "Pending Sync" badge shows on orders with unsynced status updates

### Sync Indicator
A floating sync indicator appears in the bottom-right when:
- Device is offline
- There are pending operations
- Sync is in progress

Users can:
- Manually trigger sync when online
- Retry failed operations
- Discard failed operations (with confirmation)

### Visual Indicators
- **OfflineBadge**: Amber badge shown on orders created offline
- **PendingSyncBadge**: Blue badge shown on orders with pending status updates

### Configuration
Queue size and retry settings are configurable in `/lib/offline/types.ts`:
```typescript
maxQueueSize: 100,  // Max pending operations
maxRetries: 3,      // Retry attempts
```

### Documentation
See `/lib/offline/README.md` for comprehensive offline module documentation.
