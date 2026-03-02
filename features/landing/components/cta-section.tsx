'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

export function CtaSection() {
  const t = useTranslations('landing.cta')

  return (
    <section className=" py-24 md:py-40 bg-primary/5 px-2">
      <div className="w-full max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('title')}
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="mt-12"
          >
            <Link href="/login" prefetch>
              <Button
                size="lg"
              >
                {t('button')}
                <ArrowRight className="ml-2 w-5 h-5" />

              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
