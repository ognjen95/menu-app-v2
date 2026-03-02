'use client'

import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Users, ShoppingBag, DollarSign, Activity } from 'lucide-react'
import { useRef, useEffect } from 'react'

export function StatisticsSection() {
  const t = useTranslations('landing.statistics')
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(videoContainerRef, { once: false, amount: 0.5 })

  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isInView])

  const stats = [
    { icon: Users, title: t('bestWaiter'), desc: t('bestWaiterDesc'), color: 'bg-blue-500' },
    { icon: ShoppingBag, title: t('mostSold'), desc: t('mostSoldDesc'), color: 'bg-primary' },
    { icon: DollarSign, title: t('revenue'), desc: t('revenueDesc'), color: 'bg-amber-500' },
    { icon: Activity, title: t('realtime'), desc: t('realtimeDesc'), color: 'bg-purple-500' },
  ]

  return (
    <section className="px-2 py-24 md:py-40 bg-card">
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left - Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
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

            {/* Stats list */}
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-4"
                >
                  <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                    <stat.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-foreground">{stat.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{stat.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Video */}
          <motion.div
            ref={videoContainerRef}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="rounded-2xl shadow shadow-primary overflow-hidden border border-border bg-card">
              <video
                ref={videoRef}
                src="/videos/dashboard-stats.mov"
                loop
                muted
                playsInline
                className="w-full h-auto"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
