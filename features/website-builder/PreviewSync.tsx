'use client'

import { useEffect } from 'react'

interface PreviewSyncProps {
  pageSlug: string | null
}

/**
 * Client component that syncs the current page with the website builder
 * when the site is in preview mode (rendered in iframe)
 */
export function PreviewSync({ pageSlug }: PreviewSyncProps) {
  useEffect(() => {
    // Only send message if we're in an iframe (preview mode)
    if (window.parent !== window) {
      window.parent.postMessage({
        type: 'PAGE_NAVIGATION',
        slug: pageSlug || 'home'
      }, '*')
    }
  }, [pageSlug])

  return null
}
