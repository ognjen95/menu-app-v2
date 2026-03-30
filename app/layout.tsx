import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Toaster } from 'sonner';
import { SwRegister } from '@/components/providers/sw-register'
import { TrackingProvider, CookieBanner } from '@/lib/services/tracking'
import { GoogleAnalytics } from '@/components/GoogleAnalytics'

// Force dynamic rendering to ensure locale cookie is read on every request
export const dynamic = 'force-dynamic'

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Klopay - POS Light for Restaurants",
    template: "%s | Klopay.app"
  },
  description: "Modern point-of-sale system designed for restaurants. Manage orders, inventory, and payments with ease.",
  keywords: ["POS", 'qr code menu', 'qr menu', "restaurant", "point of sale", "menu management", "order management", "inventory"],
  authors: [{ name: "Klopay.app" }],
  creator: "Klopay.app",
  publisher: "Klopay.app",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://klopay.app'),
  alternates: {
    canonical: '/',
  },
  // PWA Configuration
  applicationName: 'KloPay',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KloPay',
    // TODO: Add startup images for iOS devices
    // startupImage: [
    //   { url: '/splash/apple-splash-2048-2732.png', media: '(device-width: 1024px) and (device-height: 1366px)' },
    // ],
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'Klopay.app - POS Light for Restaurants',
    description: 'Modern point-of-sale system designed for restaurants. Manage orders, inventory, and payments with ease.',
    siteName: 'Klopay.app',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Klopay.app Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Klopay.app - POS Light for Restaurants',
    description: 'Modern point-of-sale system designed for restaurants. Manage orders, inventory, and payments with ease.',
    images: ['/logo.png'],
  },
  icons: {
    icon: [
      { url: '/icon1.png', sizes: '96x96', type: 'image/png' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180' },
      { url: '/icon1.png', sizes: '96x96' },
    ],
    shortcut: [
      '/logo.png',
      '/favicon.ico',
    ],
    other: [
      { rel: 'mask-icon', url: '/icon0.svg', color: '#0a0a0a' },
    ],
  },
  manifest: '/manifest.json',
  themeColor: '#0a0a0a',
  // PWA theme color (should match manifest.json)
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#0a0a0a',
    'msapplication-tap-highlight': 'no',
    'msapplication-config': '/icons/browserconfig.xml',
    'apple-mobile-web-app-title': 'KloPay',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
};

// PWA Viewport configuration
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zoom on iOS for app-like experience
  viewportFit: 'cover', // For notched devices
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [locale, messages] = await Promise.all([
    getLocale(),
    getMessages()
  ]);

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <GoogleAnalytics />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <TrackingProvider debug={process.env.NODE_ENV !== 'production'}>
            <SwRegister>
              <Providers>{children}</Providers>
              <Toaster position="top-right" richColors />
              <CookieBanner />
            </SwRegister>
          </TrackingProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
