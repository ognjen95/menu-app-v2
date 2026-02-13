import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Menu',
  description: 'Browse our menu and order online',
}

export default function MenuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {/* Preconnect to Supabase storage for images */}
      <link rel="preconnect" href="https://zupbdxfegathqacckath.supabase.co" />
      <link rel="dns-prefetch" href="https://zupbdxfegathqacckath.supabase.co" />
      {children}
    </>
  )
}
