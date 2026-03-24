'use client'

import {
  Header,
  HeroSection,
  FeaturesGrid,
  ReimaginedSection,
  WebsiteBuilderSection,
  TranslationsSection,
  StatisticsSection,
  AiSection,
  PricingSection,
  TestimonialsSection,
  CtaSection,
  Footer,
} from '@/features/landing/components'

export function LandingPageClient() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className=''>
        <HeroSection />
        <FeaturesGrid />
        <ReimaginedSection />
        <WebsiteBuilderSection />
        {/* <TranslationsSection /> */}
        <StatisticsSection />
        <AiSection />
        {/* <PricingSection /> */}
        <TestimonialsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
}
