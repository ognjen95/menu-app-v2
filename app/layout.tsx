import type { Metadata } from "next";
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
      { url: '/logo.png', sizes: 'any' },
      { url: '/logo.png', type: 'image/png' },
    ],
    apple: [
      { url: '/logo.png' },
    ],
    shortcut: ['/logo.png'],
  },
  manifest: '/manifest.json',
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
