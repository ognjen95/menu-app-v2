'use client'

import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { ShoppingCart, Footprints, Monitor, WifiOff } from 'lucide-react'
import Image from 'next/image'

const POS_DESKTOP = '/screenshots/pos-desktop.png'
const POS_MOBILE_WAITER = '/hero-vertical.png'

export function ReimaginedSection() {
  const t = useTranslations('landing.reimagined')

  const features = [
    { 
      icon: ShoppingCart, 
      label: 'Easy Order & Pay', 
      description: 'Intuitive interface for quick order creation. Accept payments seamlessly.',
      color: 'bg-primary' 
    },
    { 
      icon: Footprints, 
      label: 'Waiter Ordering App', 
      description: 'No more walking back and forth! Orders go directly to kitchen. Save your waiters\' feet.',
      color: 'bg-amber-500' 
    },
    { 
      icon: Monitor, 
      label: 'Works on Any Device', 
      description: 'iOS, Android, or Browser. Use any device you already have.',
      color: 'bg-blue-500' 
    },
    { 
      icon: WifiOff, 
      label: 'Offline Mode', 
      description: 'Lost internet? Keep working. Data syncs automatically when you\'re back online.',
      color: 'bg-purple-500' 
    },
  ]

  return (
    <section className=" py-24 md:py-40 bg-card px-2">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left - Device Mockup */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative">
              {/* Main mockup */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="rounded-2xl overflow-hidden border border-border bg-card md:shadow-2xl shadow-primary"
              >
                <Image
                  src={POS_DESKTOP}
                  alt="POS Dashboard Preview"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                />
              </motion.div>
              
              {/* Floating phone mockup - on left side */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
                className="absolute -left-40 shadow shadow-primary  top-5 -translate-y-1/2 w-32 sm:w-40 lg:w-48 rounded-2xl shadow-2xl overflow-hidden border border-border bg-card"
              >
                <Image
                  src={POS_MOBILE_WAITER}
                  alt="Mobile App"
                  width={192}
                  height={384}
                  className="w-full h-auto"
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Right - Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {t('title')}
            </h2>
            <p className="mt-8 text-lg text-muted-foreground">
              {t('subtitle')}
            </p>

            {/* Feature list */}
            <div className="mt-10 space-y-6">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-10 h-10 ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{feature.label}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
