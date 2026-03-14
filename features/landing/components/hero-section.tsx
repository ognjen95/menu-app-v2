'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const HERO_IMAGE_HORIZONTAL = '/screenshots/orders-desktop.png'
const HERO_IMAGE_VERTICAL = '/screenshots/menu-mobile.jpg'

export function HeroSection() {
  const t = useTranslations('landing.hero')

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="hero" className="relative min-h-screen flex items-center pt-20 overflow-hidden px-3">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/50" />

      {/* Animated background elements - smaller circles */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-20 right-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl"
        />
      </div>

      <div className="relative w-full">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Free badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 mb-8"
            >
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('freeBadge')}</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight"
            >
              <span className="text-primary">{t('titlePart1')}</span> & <br/><span className="text-primary">{t('titlePart2')}</span>{' '}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-8 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0"
            >
              {t('subtitle')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-10 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
            >
              <Link href="/login" prefetch>
                <Button
                  size="lg"
                  className='w-full'
                >
                  {t('cta')}
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                onClick={() => scrollToSection('pricing')}
              >
                {t('viewPricing')}
              </Button>
            </motion.div>

            {/* Mobile Images - visible only on small screens */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="mt-12 md:hidden relative"
            >
              <div className="relative mx-auto max-w-sm">
                {/* Dashboard Image */}
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="rounded-2xl overflow-hidden border border-border bg-card"
                >
                  <Image
                    src={HERO_IMAGE_HORIZONTAL}
                    alt="Dashboard Preview"
                    width={600}
                    height={400}
                    priority
                    className="w-full h-auto "
                  />
                </motion.div>

                {/* Mobile Mockup */}
                <motion.div
                  animate={{ y: [0, 8, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute -right-4 -bottom-8 w-24 sm:w-32 rounded-xl shadow-2xl shadow-primary overflow-hidden border border-border bg-card"
                >
                  <Image
                    src={HERO_IMAGE_VERTICAL}
                    alt="Mobile App"
                    width={128}
                    height={256}
                    className="w-full h-auto"
                    priority
                  />
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Placeholder for grid alignment */}
          <div className="hidden lg:block" />
          </div>
        </div>

        {/* Right Content - Device Mockups - Overflows right edge only */}
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="hidden md:flex items-center absolute inset-y-0 right-0 md:-right-[30%] lg:-right-[10%]"
        >
          <div className="relative" style={{ width: 'clamp(550px, 60vw, 1000px)' }}>
            {/* Main Dashboard Mockup */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="rounded-2xl shadow-2xl overflow-hidden border border-border bg-card shadow shadow-primary"
            >
              <Image
                src={HERO_IMAGE_HORIZONTAL}
                alt="Dashboard Preview"
                width={1200}
                height={800}
                className="w-full h-auto"
                priority
              />
            </motion.div>

            {/* Mobile Mockup - Overlapping on left side */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute -left-16 lg:-left-30 top-1/3 -translate-y-1/2 w-36 lg:w-48 xl:w-56 rounded-2xl shadow-2xl overflow-hidden border border-border bg-card"
            >
              <Image
                src={HERO_IMAGE_VERTICAL}
                alt="Mobile App"
                width={240}
                height={480}
                className="w-full h-auto"
                priority
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
