'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft, Monitor, Smartphone, Tablet, RefreshCw, ExternalLink,
  Loader2, PanelRightClose, PanelRight, Globe, UtensilsCrossed,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from '@/components/ui/animated'
import Link from 'next/link'

type Website = {
  subdomain: string | null
  is_published: boolean
  [key: string]: unknown
}

export type PreviewTarget = 'website' | 'menu'

type TopBarProps = {
  website: Website | null | undefined
  websiteUrl?: string | null
  previewMode: 'desktop' | 'tablet' | 'mobile'
  previewTarget: PreviewTarget
  sidebarOpen: boolean
  isPublishing: boolean
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void
  setPreviewTarget: (target: PreviewTarget) => void
  setSidebarOpen: (open: boolean) => void
  refreshPreview?: (immediate: boolean) => void
  onPublish: () => void
}

export function TopBar({
  website,
  websiteUrl,
  previewMode,
  previewTarget,
  sidebarOpen,
  isPublishing,
  setPreviewMode,
  setPreviewTarget,
  setSidebarOpen,
  refreshPreview,
  onPublish,
}: TopBarProps) {
  const t = useTranslations('websiteBuilder')

  return (
    <motion.div
      className="fixed top-3 left-3 right-3 h-16 z-50 flex items-center justify-between md:px-4 bg-background/95 backdrop-blur-xl  rounded-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <Link href="/dashboard/orders">
            <ChevronLeft className="h-4 w-4" />
            <span className='hidden md:block'>
              {t('exit')}
            </span>
          </Link>
        </Button>
        <div className='hidden md:block'>
          <h1 className="font-semibold">{t('title')}</h1>
          <p className="text-xs text-muted-foreground">
            {website?.subdomain || t('noSubdomain')}.klopay.app
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Preview Target Toggle: Website / Menu */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-muted">
          {([['website', Globe, t('website')], ['menu', UtensilsCrossed, t('menu')]] as const).map(([target, Icon, label]) => (
            <motion.div key={target} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 gap-1.5 px-3", previewTarget === target && "bg-primary text-primary-foreground")}
                onClick={() => setPreviewTarget(target)}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs font-medium hidden md:bloc">{label}</span>
              </Button>
            </motion.div>
          ))}
        </div>

        {/* Device Mode Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-full bg-muted hidden md:block">
          {([['desktop', Monitor], ['tablet', Tablet], ['mobile', Smartphone]] as const).map(([mode, Icon]) => (
            <motion.div key={mode} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="ghost"
                size="icon"
                className={cn("h-8 w-8", previewMode === mode && "bg-primary text-primary-foreground")}
                onClick={() => setPreviewMode(mode)}
              >
                <Icon className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>

        {refreshPreview && (
          <motion.div whileHover={{ scale: 1.05, rotate: 180 }} whileTap={{ scale: 0.95 }}>
            <Button variant="ghost" size="icon" onClick={() => refreshPreview(true)}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {websiteUrl && (
          <Button variant="ghost" size="icon" asChild>
            <a href={websiteUrl.replace('?preview=true', '')} target="_blank">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={onPublish}
            disabled={isPublishing}
            size="sm"
            className='relative'
            variant={website?.is_published ? "outline" : "default"}
          >

            {!website?.is_published && (
              <Badge variant={"secondary"} className="ml-2 absolute -top-3 -right-2 ">
                {t('draft')}
              </Badge>
            )}
            {isPublishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              website?.is_published ? t('unpublish') : t('publish')
            )}
          </Button>
        </motion.div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-2"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <PanelRightClose className="h-5 w-5" /> : <PanelRight className="h-5 w-5" />}
        </Button>
      </div>
    </motion.div>
  )
}
