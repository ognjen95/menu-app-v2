import { Skeleton } from '@/components/ui/skeleton'

interface WebsiteBlocksSkeletonProps {
  theme: {
    primary: string
    secondary: string
    background: string
    foreground: string
  }
}

export function WebsiteBlocksSkeleton({ theme }: WebsiteBlocksSkeletonProps) {
  return (
    <main>
      {/* Hero skeleton */}
      <section 
        className="relative overflow-hidden"
        style={{ backgroundColor: theme.secondary, minHeight: '60vh' }}
      >
        <div className="container mx-auto px-4 py-20">
          <div className="max-w-2xl space-y-6">
            <Skeleton className="h-12 w-3/4" style={{ backgroundColor: `${theme.foreground}15` }} />
            <Skeleton className="h-6 w-full" style={{ backgroundColor: `${theme.foreground}10` }} />
            <Skeleton className="h-6 w-2/3" style={{ backgroundColor: `${theme.foreground}10` }} />
            <div className="flex gap-4 pt-4">
              <Skeleton className="h-12 w-32 rounded-lg" style={{ backgroundColor: `${theme.primary}30` }} />
              <Skeleton className="h-12 w-32 rounded-lg" style={{ backgroundColor: `${theme.foreground}10` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Features/Content section skeleton */}
      <section className="py-16 px-4" style={{ backgroundColor: theme.background }}>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-64 mx-auto mb-4" style={{ backgroundColor: `${theme.foreground}10` }} />
            <Skeleton className="h-4 w-96 mx-auto" style={{ backgroundColor: `${theme.foreground}08` }} />
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center space-y-4">
                <Skeleton 
                  className="h-16 w-16 rounded-full mx-auto" 
                  style={{ backgroundColor: `${theme.primary}20` }} 
                />
                <Skeleton className="h-6 w-32 mx-auto" style={{ backgroundColor: `${theme.foreground}10` }} />
                <Skeleton className="h-4 w-full" style={{ backgroundColor: `${theme.foreground}08` }} />
                <Skeleton className="h-4 w-3/4 mx-auto" style={{ backgroundColor: `${theme.foreground}08` }} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Menu preview skeleton */}
      <section className="py-16 px-4" style={{ backgroundColor: theme.secondary }}>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-8 w-48 mx-auto mb-4" style={{ backgroundColor: `${theme.foreground}10` }} />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: theme.background }}
              >
                <Skeleton className="h-40 w-full" style={{ backgroundColor: `${theme.foreground}10` }} />
                <div className="p-4 space-y-3">
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-32" style={{ backgroundColor: `${theme.foreground}10` }} />
                    <Skeleton className="h-5 w-16" style={{ backgroundColor: `${theme.primary}20` }} />
                  </div>
                  <Skeleton className="h-4 w-full" style={{ backgroundColor: `${theme.foreground}08` }} />
                  <Skeleton className="h-10 w-full rounded-lg" style={{ backgroundColor: `${theme.primary}20` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
