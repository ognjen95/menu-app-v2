'use client'

import { motion, useInView } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { CheckCircle2, Play } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'

export function WebsiteBuilderSection() {
  const t = useTranslations('landing.websiteBuilder')
  const videoRef = useRef<HTMLVideoElement>(null)
  const modalVideoRef = useRef<HTMLVideoElement>(null)
  const videoContainerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(videoContainerRef, { once: false, amount: 0.5 })
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    if (videoRef.current) {
      if (isInView && !isModalOpen) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isInView, isModalOpen])

  useEffect(() => {
    if (modalVideoRef.current) {
      if (isModalOpen) {
        modalVideoRef.current.play()
      } else {
        modalVideoRef.current.pause()
      }
    }
  }, [isModalOpen])

  const features = [
    { label: t('brandControl'), color: 'text-primary' },
    { label: t('translation'), color: 'text-primary' },
    { label: t('uptime'), color: 'text-amber-500' },
    { label: t('seo'), color: 'text-primary' },
  ]

  return (
    <section className=" py-24 md:py-40 bg-background px-2">
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
            <p className="mt-8 text-lg text-muted-foreground leading-relaxed">
              {t('subtitle')}
            </p>

            {/* Feature checklist */}
            <div className="mt-10 space-y-5">
              {features.map((feature, index) => (
                <motion.div
                  key={feature.label}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3"
                >
                  <CheckCircle2 className={`w-5 h-5 ${feature.color}`} />
                  <span className="font-medium text-foreground">{feature.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right - Video Mockup */}
          <motion.div
            ref={videoContainerRef}
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative">
              {/* Video mockup */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="rounded-2xl md:shadow-2xl overflow-hidden border border-border bg-card shadow shadow-primary relative group cursor-pointer w-full"
              >
                <video
                  ref={videoRef}
                  src="/videos/web-builder.mov"
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                />
                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 backdrop-blur flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary fill-primary ml-1" />
                  </div>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Fullscreen Video Modal */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogContent size="full" className="bg-black p-0">
              <div className="w-full h-full flex items-center justify-center">
                <video
                  ref={modalVideoRef}
                  src="/videos/web-builder.mov"
                  loop
                  muted
                  playsInline
                  controls
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </section>
  )
}
