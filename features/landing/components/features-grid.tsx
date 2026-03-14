'use client'

import { useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import {
  QrCode,
  Zap,
  TrendingUp,
  Workflow,
  Radio,
  ArrowUpRight
} from 'lucide-react'
import Image from 'next/image'

const HERO_IMAGE_VERTICAL = '/screenshots/menu-mobile.jpg'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
}

export function FeaturesGrid() {
  const t = useTranslations('landing.features')
  const videoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(videoContainerRef, { once: false, margin: '-100px' })

  useEffect(() => {
    if (videoRef.current) {
      if (isInView) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isInView])

  const features = [
    {
      key: 'fastOrdering',
      icon: Zap,
      size: 'small',
    },
    {
      key: 'qrMenu',
      icon: QrCode,
      size: 'large',
      highlight: true,
    },
    {
      key: 'growBusiness',
      icon: TrendingUp,
      size: 'small',
    },
    {
      key: 'workflow',
      icon: Workflow,
      size: 'small',
    },
    {
      key: 'realtime',
      icon: Radio,
      size: 'small',
    },
  ]

  return (
    <section id="features" className="py-24 md:py-40 bg-background px-2">
      <div className="w-full max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
            {t('title')}
          </h2>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Bento Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {/* Fast Ordering - Small */}
          <motion.div
            variants={itemVariants}
            className="group bg-gradient-to-br from-card via-card to-primary/5 border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Zap className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              {t('fastOrdering.title')}
            </h3>
            <p className="text-base text-muted-foreground">
              {t('fastOrdering.description')}
            </p>
          </motion.div>

          {/* QR Menu - Large/Featured */}
          <motion.div
            variants={itemVariants}
            className="group overflow-hidden bg-primary border border-primary/20 rounded-2xl pb-0 md:row-span-2 hover:border-primary/50 transition-all duration-300"
          >
            <h3 className="text-2xl font-bold text-white mb-2 p-6">
              {t('qrMenu.title')}
            </h3>
            <p className="text-lg text-white p-6 pt-0">
              {t('qrMenu.description')}
            </p>

            {/* Phone Mockup - Slides up on scroll */}
            <motion.div
              ref={videoContainerRef}
              initial={{ y: 100, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative mx-auto w-full h-[670px] overflow-hidden rounded-t-2xl"
            >
              <video
                ref={videoRef}
                src="/videos/menu-ordering.mp4"
                loop
                muted
                playsInline
                className='absolute bottom-0 w-full h-full object-cover'
              />
              {/* <Image
                src={HERO_IMAGE_VERTICAL}
                alt="QR Menu Preview"
                width={650}
                height={650}
                className="w-full h-full object-cover"
              /> */}
            </motion.div>
          </motion.div>

          {/* Grow Business - Small */}
          <motion.div
            variants={itemVariants}
            className="group bg-gradient-to-bl from-card via-card to-primary/5 border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              {t('growBusiness.title')}
            </h3>
            <p className="text-base text-muted-foreground">
              {t('growBusiness.description')}
            </p>
          </motion.div>

          {/* Workflow - Small */}
          <motion.div
            variants={itemVariants}
            className="group bg-gradient-to-tr from-card via-card to-primary/5 border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Workflow className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              {t('workflow.title')}
            </h3>
            <p className="text-base text-muted-foreground">
              {t('workflow.description')}
            </p>
          </motion.div>

          {/* Real-time - Small */}
          <motion.div
            variants={itemVariants}
            className="group bg-gradient-to-tl from-card via-card to-primary/5 border border-border rounded-2xl p-8 hover:border-primary/50 transition-all duration-300"
          >
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
              <Radio className="w-7 h-7 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">
              {t('realtime.title')}
            </h3>
            <p className="text-base text-muted-foreground">
              {t('realtime.description')}
            </p>
          </motion.div>
        </motion.div>

        {/* View Demo Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-16 text-center"
        >
          <Button
            variant="outline"
            size="lg"
          >
            {t('viewDemo')}
            <ArrowUpRight className="ml-2 w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
