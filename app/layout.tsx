import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Klopay - POS Light for Restaurants",
    template: "%s | Klopay.app"
  },
  description: "Modern point-of-sale system designed for restaurants. Manage orders, inventory, and payments with ease.",
  keywords: ["POS", "restaurant", "point of sale", "menu management", "order management", "inventory"],
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
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
      { url: '/logo.png', sizes: 'any' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152' },
      { url: '/icons/icon-192x192.png', sizes: '192x192' },
    ],
    shortcut: ['/icons/icon-192x192.png'],
  },
  manifest: '/manifest.json',
  // PWA theme color (should match manifest.json)
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#3b82f6',
    'msapplication-tap-highlight': 'no',
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
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
          <Toaster position="top-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
