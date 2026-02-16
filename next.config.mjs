import createNextIntlPlugin from 'next-intl/plugin';
import withPWAInit from '@ducanh2912/next-pwa';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  // Workbox options for @ducanh2912/next-pwa
  workboxOptions: {
    disableDevLogs: true,
    // Exclude app-build-manifest.json from precaching
    exclude: [/app-build-manifest\.json$/],
  },
  // Cache strategies for different routes
  extendDefaultRuntimeCaching: true,
  runtimeCaching: [
    // Cache tenant/user info for offline auth (network first with longer cache)
    {
      urlPattern: /^https?:\/\/.*\/api\/tenant\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'tenant-api-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 5,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache profile/user data for offline access
    {
      urlPattern: /^https?:\/\/.*\/api\/profile.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'profile-api-cache',
        expiration: {
          maxEntries: 5,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 5,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache API calls for orders (network first, fallback to cache)
    {
      urlPattern: /^https?:\/\/.*\/api\/orders\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'orders-api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 5, // 5 minutes
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache API calls for locations
    {
      urlPattern: /^https?:\/\/.*\/api\/locations.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'locations-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    // Cache static assets
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        },
      },
    },
    // Cache fonts
    {
      urlPattern: /\.(?:woff|woff2|ttf|otf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-fonts-cache',
        expiration: {
          maxEntries: 20,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        },
      },
    },
    // Cache JS and CSS
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-js-css-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
        },
      },
    },
    // Cache dashboard pages (network first for fresh data)
    {
      urlPattern: /^https?:\/\/.*\/dashboard\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'dashboard-pages-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        networkTimeoutSeconds: 5,
      },
    },
    // Default: cache everything else with network first
    {
      urlPattern: /.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'others-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24, // 24 hours
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'zupbdxfegathqacckath.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default withPWA(withNextIntl(nextConfig));
