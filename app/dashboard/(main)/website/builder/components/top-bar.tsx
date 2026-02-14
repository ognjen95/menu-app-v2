'use client'

import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft, Monitor, Smartphone, Tablet, RefreshCw, ExternalLink,
  Loader2, PanelRightClose, PanelRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion } from '@/components/ui/animated'

type Website = {
  subdomain: string | null
  is_published: boolean
  [key: string]: unknown
}

type TopBarProps = {
  website: Website | null | undefined
  websiteUrl?: string | null
  previewMode: 'desktop' | 'tablet' | 'mobile'
  sidebarOpen: boolean
  isPublishing: boolean
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void
  setSidebarOpen: (open: boolean) => void
  refreshPreview?: (immediate: boolean) => void
  onPublish: () => void
}

export function TopBar({
  website,
  websiteUrl,
  previewMode,
  sidebarOpen,
  isPublishing,
  setPreviewMode,
  setSidebarOpen,
  refreshPreview,
  onPublish,
}: TopBarProps) {
  const t = useTranslations('websiteBuilder')

  return (
    <motion.div 
      className="fixed top-3 left-3 right-3 h-16 z-50 flex items-center justify-between px-4 bg-background/95 backdrop-blur-xl  rounded-xl"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="gap-1">
          <a href="/dashboard">
            <ChevronLeft className="h-4 w-4" />
            {t('exit')}
          </a>
        </Button>
        <div>
          <h1 className="font-semibold">{t('title')}</h1>
          <p className="text-xs text-muted-foreground">
            {website?.subdomain || t('noSubdomain')}.klopay.app
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
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
        
        <Badge variant={website?.is_published ? "default" : "secondary"} className="ml-2">
          {website?.is_published ? t('live') : t('draft')}
        </Badge>
        
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button 
            onClick={onPublish} 
            disabled={isPublishing} 
            size="sm" 
            variant={website?.is_published ? "outline" : "default"}
          >
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
