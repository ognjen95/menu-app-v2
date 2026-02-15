# Tables Feature

Restaurant table management with QR code generation for ordering.

## Structure (DDD)

```
tables/
├── domains/                    # Business logic & types
│   └── types.ts                # Table, QrCode, form types
├── services/                   # API hooks & server functions
│   ├── use-tables.ts           # React Query hooks for CRUD
│   └── tables-server.ts        # Server-side data fetching
├── components/                 # Presentational (dumb) components
│   ├── create-table-dialog.tsx
│   ├── qr-preview-dialog.tsx
│   ├── qr-edit-dialog.tsx
│   ├── tables-page-header.tsx
│   ├── location-selector.tsx
│   ├── table-card.tsx
│   └── tables-grid.tsx
└── containers/                 # Smart components with logic
    ├── tables-dialogs.tsx      # Dialog state management
    └── tables-page-container.tsx # Main page orchestration
```

## Usage

### Server Page (SSR + Streaming)
```tsx
// app/dashboard/tables/page.tsx
import { getTablesPageData, TablesPageContainer } from '@/components/features/tables'

export default async function TablesPage() {
  const initialData = await getTablesPageData()
  return <TablesPageContainer initialData={initialData} />
}
```

### Client Hooks
```tsx
import {
  useTablesDialogs,
  useTables,
  useQrCodes,
  useGenerateQrCode,
} from '@/components/features/tables'
```

## Services

### Server
- **getTablesPageData()** - SSR data fetch (locations, tables, QR codes)

### Client (React Query)
- **useLocations()** - Fetch all locations
- **useTables(locationId)** - Fetch tables for location
- **useQrCodes(locationId)** - Fetch QR codes for location
- **useCreateTable(locationId, onSuccess)** - Create new table
- **useDeleteTable(locationId)** - Delete table
- **useGenerateQrCode(locationId)** - Generate QR code for table
- **useUpdateQrStyle(locationId, onSuccess)** - Update QR style

## Components

| Component | Purpose |
|-----------|---------|
| `TablesPageHeader` | Page title, description, export/add buttons |
| `LocationSelector` | Location tab buttons |
| `TablesGrid` | Grid layout with zone grouping |
| `TableCard` | Individual table card with QR preview |
| `CreateTableDialog` | Create table form with zone selection |
| `QrPreviewDialog` | QR preview with copy/download |
| `QrEditDialog` | QR style editor |

## Data Flow

1. **Server**: `getTablesPageData()` fetches initial data (SSR)
2. **Client**: `TablesPageContainer` receives `initialData`
3. **Streaming**: Location changes trigger `useTables`/`useQrCodes` (client-side)
4. **Mutations**: Create/delete/update invalidate queries

## Zone Management

Zones (areas) are derived from existing tables and shown as a select dropdown:

- **Existing zones** are extracted from `tables.zone` field
- **Select dropdown** shows all existing zones
- **"Create New Zone"** option allows entering custom zone name
- **Preselection**: Clicking "Add table" from a zone card preselects that zone

```tsx
// Zone derivation in container
const existingZones = useMemo(() => {
  const zones = new Set<string>()
  tables.forEach(table => {
    if (table.zone) zones.add(table.zone)
  })
  return Array.from(zones).sort()
}, [tables])

// Open dialog with preselected zone
const handleAddTable = (zone?: string) => {
  if (zone) setFormData(prev => ({ ...prev, zone }))
  setIsCreateOpen(true)
}
```

## Validation (Zod)

Form validation using Zod schema with duplicate name detection:

```typescript
import { validateTableForm, tableFormSchema } from '../domains/types'

// Schema validates:
// - name: required, max 50 chars
// - capacity: optional, 1-100
// - zone: optional, max 50 chars

// Duplicate check:
const result = validateTableForm(
  formData,
  existingTables,
  { duplicateName: t('duplicateTableName') }
)

if (!result.success) {
  setFormErrors(result.errors) // { name: "error message" }
}
```

**Validation rules:**
- **Name**: Required, max 50 characters
- **Capacity**: Must be between 1-100 (if provided)
- **Zone**: Max 50 characters
- **Duplicate check**: No two tables in same zone can have same name (case-insensitive)
