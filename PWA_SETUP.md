# PWA (Progressive Web App) Setup Guide

This document explains the PWA configuration and what you need to do to complete the setup.

## Current Implementation

### ✅ Completed
- **manifest.json** - App metadata, icons configuration, shortcuts
- **next-pwa** - Service worker generation with caching strategies
- **Meta tags** - PWA-specific meta tags in layout.tsx
- **Viewport** - Theme color support for light/dark modes
- **Caching strategies** - Configured for offline support

### 📱 Caching Strategies

| Resource | Strategy | Cache Duration |
|----------|----------|----------------|
| Orders API | NetworkFirst | 5 minutes |
| Locations API | StaleWhileRevalidate | 1 hour |
| Images | CacheFirst | 30 days |
| Fonts | CacheFirst | 1 year |
| JS/CSS | StaleWhileRevalidate | 7 days |
| Dashboard pages | NetworkFirst | 1 hour |

---

## 🔴 TODO: Required Actions

### 1. Create App Icons

You need to create icons in the following sizes and place them in `/public/icons/`:

```
/public/icons/
├── icon-72x72.png
├── icon-96x96.png
├── icon-128x128.png
├── icon-144x144.png
├── icon-152x152.png      (Required for iOS)
├── icon-192x192.png      (Required for Android)
├── icon-384x384.png
├── icon-512x512.png      (Required for splash screens)
├── orders-shortcut.png   (96x96, for app shortcuts)
└── kitchen-shortcut.png  (96x96, for app shortcuts)
```

**Tips:**
- Start with a 1024x1024 source icon
- Use a tool like https://realfavicongenerator.net/ or https://www.pwabuilder.com/imageGenerator
- Icons should have transparent backgrounds for maskable icons
- For maskable icons, keep important content in the center 80%

### 2. Create Screenshots (Optional but recommended)

For better install prompts, add screenshots:

```
/public/screenshots/
├── desktop.png    (1920x1080)
└── mobile.png     (390x844)
```

### 3. iOS Splash Screens (Optional)

For iOS devices, add splash screens. Uncomment the `startupImage` section in `app/layout.tsx`:

```
/public/splash/
├── apple-splash-2048-2732.png  (iPad Pro 12.9")
├── apple-splash-1668-2388.png  (iPad Pro 11")
├── apple-splash-1536-2048.png  (iPad 9.7")
├── apple-splash-1125-2436.png  (iPhone X/XS)
├── apple-splash-1242-2688.png  (iPhone XS Max)
└── ... (various other sizes)
```

---

## 🧪 Testing the PWA

### Development Mode
PWA is **disabled** in development mode to avoid caching issues.
To test PWA features, run a production build:

```bash
npm run build
npm run start
```

### Check PWA Installation
1. Open Chrome DevTools → Application tab
2. Check "Manifest" section for proper configuration
3. Check "Service Workers" section for registration
4. Look for install button in address bar

### Lighthouse Audit
1. Open Chrome DevTools → Lighthouse tab
2. Select "Progressive Web App" category
3. Run audit and fix any issues

---

## 🌐 Offline Support for Orders Page

### Current Behavior
- **Online**: Fetches fresh data from API
- **Slow Network**: Uses cached data while fetching fresh data (NetworkFirst with timeout)
- **Offline**: Shows cached orders data

### Enhancing Offline Experience

To fully support offline orders, consider these additional steps:

#### 1. IndexedDB for Order Queue
Store orders locally when offline and sync when back online:

```typescript
// lib/offline-orders.ts
import { openDB } from 'idb';

const dbPromise = openDB('orders-db', 1, {
  upgrade(db) {
    db.createObjectStore('pending-orders', { keyPath: 'id' });
    db.createObjectStore('cached-orders', { keyPath: 'id' });
  },
});

export async function addPendingOrder(order) {
  const db = await dbPromise;
  await db.put('pending-orders', order);
}

export async function syncPendingOrders() {
  const db = await dbPromise;
  const pendingOrders = await db.getAll('pending-orders');
  // Sync with server...
}
```

#### 2. Background Sync
Register for background sync when creating orders offline:

```typescript
if ('serviceWorker' in navigator && 'SyncManager' in window) {
  const registration = await navigator.serviceWorker.ready;
  await registration.sync.register('sync-orders');
}
```

#### 3. Offline Detection Hook
Create a hook to detect online/offline status:

```typescript
// lib/hooks/use-online-status.ts
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
```

#### 4. Offline UI Indicator
Show users when they're offline:

```tsx
const isOnline = useOnlineStatus();

{!isOnline && (
  <Alert variant="warning">
    <WifiOff className="h-4 w-4" />
    <AlertTitle>You're offline</AlertTitle>
    <AlertDescription>
      Some features may be limited. Orders will sync when you're back online.
    </AlertDescription>
  </Alert>
)}
```

---

## 📁 Files Modified/Created

```
/public/
├── manifest.json          # PWA manifest
├── icons/                 # App icons (TODO: add icons)
└── screenshots/           # App screenshots (TODO: add screenshots)

/app/
└── layout.tsx             # PWA meta tags and viewport

next.config.mjs            # PWA and service worker configuration
```

---

## 🚀 Production Deployment

After deploying to production:

1. The service worker will be generated at `/sw.js`
2. Workbox files will be generated at `/workbox-*.js`
3. Add these to `.gitignore` if not already:
   ```
   public/sw.js
   public/sw.js.map
   public/workbox-*.js
   public/workbox-*.js.map
   ```

4. Verify HTTPS is enabled (required for service workers)

---

## 📚 Resources

- [next-pwa Documentation](https://github.com/shadowwalker/next-pwa)
- [Workbox Strategies](https://developers.google.com/web/tools/workbox/modules/workbox-strategies)
- [PWA Builder](https://www.pwabuilder.com/)
- [Web.dev PWA Guide](https://web.dev/progressive-web-apps/)
