'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

const HERO_IMAGE_VERTICAL = '/hero-vertical.png'

export function TranslationsSection() {
  const t = useTranslations('landing.translations')

  return (
    <section className=" py-24 md:py-40 bg-primary/5">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-primary">
              {t('title')}
            </h2>
            <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
              {t('subtitle')}
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="mt-10"
            >
              <Button
                variant="outline"
                size="lg"
              >
                {t('tryNow')}
              </Button>
            </motion.div>
          </motion.div>

          {/* Right - Device Mockups */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative flex justify-center">
              {/* Phone mockup 1 */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="w-40 rounded-3xl shadow-2xl overflow-hidden z-10"
              >
                <Image
                  src={HERO_IMAGE_VERTICAL}
                  alt="Menu Preview"
                  width={160}
                  height={284}
                  className="w-full h-auto"
                />
              </motion.div>

              {/* Phone mockup 2 - offset */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="w-40 rounded-3xl shadow-2xl overflow-hidden -ml-8 mt-12"
              >
                <Image
                  src={HERO_IMAGE_VERTICAL}
                  alt="Translations Preview"
                  width={160}
                  height={284}
                  className="w-full h-auto"
                />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
