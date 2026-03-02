'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'

const planFeatures = {
  free: ['Unlimited orders', 'QR code menus', 'Basic analytics', '1 location', 'Email support'],
  basic: ['Everything in Free', 'Website builder', 'Advanced analytics', 'Priority support', 'Custom branding'],
  pro: ['Everything in Basic', 'Multiple locations', 'AI features', 'API access', 'Dedicated support'],
}

export function PricingSection() {
  const t = useTranslations('landing.pricing')

  const plans = [
    { key: 'free' as const, featured: false },
    { key: 'pro' as const, featured: true },
    { key: 'basic' as const, featured: false },
  ]

  return (
    <section id="pricing" className="px-2 py-24 md:py-40 bg-card">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('title')}
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan, index) => {
            const features = planFeatures[plan.key]
            
            return (
              <motion.div
                key={plan.key}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-background border rounded-2xl p-8 ${
                  plan.featured
                    ? 'border-primary shadow-xl scale-105 z-10'
                    : 'border-border'
                }`}
              >
                {/* Popular badge */}
                {plan.featured && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                      {t(`${plan.key}.popular`)}
                    </span>
                  </div>
                )}

                <div className="text-center">
                  <h3 className="text-xl font-semibold text-foreground">
                    {t(`${plan.key}.title`)}
                  </h3>
                  <div className="mt-4 flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      {t(`${plan.key}.price`)}
                    </span>
                    <span className="text-muted-foreground">
                      {t(`${plan.key}.period`)}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="mt-8 space-y-4">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  className="w-full mt-8"
                  size="lg"
                  variant={plan.featured ? 'default' : 'secondary'}
                >
                  {t(`${plan.key}.cta`)}
                </Button>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
