# Website Builder Features & Architecture

## Server-Side Rendering

The website builder page (`page.tsx`) is **server-side rendered**. Initial data is fetched on the server and passed to client components.

### Data Flow

```
page.tsx (Server)
  ↓ fetches website & pages via Supabase
  ↓
WebsiteBuilderClient (Client)
  ↓ hydrates react-query cache
  ├── TopBarContainer (Client) - publish mutation
  ├── PreviewAndEditorFeature (Client) - pages/blocks CRUD
  └── TemplateModal (Client) - template selection
```

---

## Containers

### `containers/website-builder.client.tsx`

Main client shell that:
- Receives server-fetched `initialWebsite` and `initialPages`
- Hydrates react-query cache on mount
- Manages layout state (sidebar, panels, preview mode)
- Handles template modal logic

### `containers/top-bar.container.tsx`

TopBar with publish/unpublish mutation logic.

---

## PreviewAndEditorFeature

**Location:** `preview-and-editor.feature.tsx`

### Purpose

Encapsulates all state, queries, mutations, and logic related to:
- Website preview (iframe-based live preview)
- Page management (create, delete, publish/unpublish, translate)
- Block management (create, edit, delete, move, toggle visibility)
- Sidebar panel coordination

### Props

```typescript
type PreviewAndEditorFeatureProps = {
  website: Website | null | undefined  // Current website data
  sidebarOpen: boolean                  // Controls sidebar visibility
  previewMode: 'desktop' | 'tablet' | 'mobile'  // Preview device mode
  activePanel: 'design' | 'pages' | 'blocks' | 'settings'  // Active sidebar tab
  setActivePanel: (panel: ...) => void  // Change sidebar tab
  setShowTemplateModal: (show: boolean) => void  // Control template modal
}
```

### Exported Types

- `Website` - Full website data type
- `WebsitePage` - Page data type
- `WebsiteBlock` - Block data type

### Internal State

The feature manages:
- `selectedPageId` - Currently selected page
- `isAddPageOpen` / `isAddBlockOpen` - Dialog visibility
- `editingBlock` / `editingPageTranslation` - Edit dialog state
- `deletePageConfirm` / `deleteBlockConfirm` - Delete confirmation state
- `isSubdomainUpdating` - Loading state for subdomain changes

### Mutations (with optimistic updates)

- `updateWebsite` - Update website settings
- `createPage` / `deletePage` - Page CRUD
- `togglePagePublish` - Toggle page publish status
- `createBlock` / `updateBlock` / `deleteBlock` - Block CRUD
- `moveBlock` - Reorder blocks

### Child Components

- `PreviewContent` - Live website preview iframe
- `Sidebar` - Side panel with design/pages/blocks/settings tabs

---

## Usage Example

```tsx
// Server Component (page.tsx)
export default async function WebsiteBuilderPage() {
  const { website, pages } = await getWebsiteData()

  return (
    <WebsiteBuilderClient
      initialWebsite={website}
      initialPages={pages}
    />
  )
}
```

### Dependencies

- `@tanstack/react-query` - Data fetching and caching
- `sonner` - Toast notifications
- `@/lib/supabase-server` - Server-side Supabase client
- Internal API functions (`apiGet`, `apiPatch`, `apiPost`, `apiDelete`)
