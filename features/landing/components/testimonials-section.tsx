'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Quote } from 'lucide-react'

const testimonialItems = [
  {
    quote: "Klopay transformed how we handle orders. Our customers love scanning QR codes and ordering directly from their phones!",
    author: "Marko P.",
    role: "Restaurant Owner"
  },
  {
    quote: "The analytics helped us identify our best-selling dishes. We increased revenue by 30% in just 2 months.",
    author: "Ana S.",
    role: "Cafe Manager"
  },
  {
    quote: "Finally, a POS system that doesn't require expensive hardware. Setup took 15 minutes and we were live!",
    author: "Stefan M.",
    role: "Bar Owner"
  }
]

export function TestimonialsSection() {
  const t = useTranslations('landing.testimonials')

  return (
    <section className="px-2 py-24 md:py-40 bg-background">
      <div className="w-full max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            {t('title')}
          </h2>
          {/* <Button
            size="lg"
          >
            Download App
          </Button> */}
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {testimonialItems.map((item, index) => (
            <motion.div
              key={item.author}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-2xl p-8 hover:border-primary/30 transition-all duration-300"
            >
              <Quote className="w-10 h-10 text-primary/30 mb-4" />
              <p className="text-foreground leading-relaxed mb-6">
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold text-muted-foreground">
                    {item.author.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{item.author}</p>
                  <p className="text-sm text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
