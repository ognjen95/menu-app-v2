'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiPatch } from '@/lib/api'
import { TopBar } from '../components/top-bar'
import type { Website } from './preview-and-editor.'

type WebsiteCache = { data: { website: Website | null } }

type TopBarContainerProps = {
  website: Website | null | undefined
  previewMode: 'desktop' | 'tablet' | 'mobile'
  sidebarOpen: boolean
  setPreviewMode: (mode: 'desktop' | 'tablet' | 'mobile') => void
  setSidebarOpen: (open: boolean) => void
}

export function TopBarContainer({
  website,
  previewMode,
  sidebarOpen,
  setPreviewMode,
  setSidebarOpen,
}: TopBarContainerProps) {
  const queryClient = useQueryClient()

  const publishWebsite = useMutation({
    mutationFn: () => apiPatch('/website', { is_published: !website?.is_published }),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['website'] })
      const prev = queryClient.getQueryData<WebsiteCache>(['website'])
      queryClient.setQueryData<WebsiteCache>(['website'], (old) =>
        old?.data?.website
          ? { data: { website: { ...old.data.website, is_published: !old.data.website.is_published } } }
          : old
      )
      return { prev }
    },
    onError: (_, __, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['website'], ctx.prev)
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['website'] }),
  })

  return (
    <TopBar
      website={website}
      previewMode={previewMode}
      sidebarOpen={sidebarOpen}
      isPublishing={publishWebsite.isPending}
      setPreviewMode={setPreviewMode}
      setSidebarOpen={setSidebarOpen}
      onPublish={() => publishWebsite.mutate()}
    />
  )
}
