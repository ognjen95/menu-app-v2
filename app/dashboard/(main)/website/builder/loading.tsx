import { Skeleton } from '@/components/ui/skeleton'

const Loading = () => {
  return (
    <div className="fixed inset-0 flex overflow-hidden bg-background">
      {/* Top bar skeleton - mirrors fixed top-3 left-3 right-3 h-16 */}
      <div className="fixed top-3 left-3 right-3 h-16 z-50 flex items-center justify-between px-4 bg-background/95 backdrop-blur-xl rounded-xl border border-border/40">
        {/* Left: exit + title */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16 rounded-md" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        {/* Right: device toggles + badge + publish button + panel toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full ml-2" />
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md ml-2" />
        </div>
      </div>

      {/* Preview area - offset below top bar and right of sidebar space */}
      <div className="flex-1 pt-[76px] pr-3 pb-3 pl-3">
        <Skeleton className="h-full w-full rounded-xl" />
      </div>

      {/* Right sidebar panel skeleton - matches actual sidebar: fixed top-[76px] right-3 bottom-3 w-[420px] */}
      <div className="fixed top-[76px] right-3 bottom-3 w-[420px] z-40 rounded-xl border border-border/40 bg-background flex flex-col overflow-hidden">
        {/* Tab bar: Design / Pages / Blocks / Settings */}
        <div className="grid grid-cols-4 border-b border-border">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5 py-4">
              <Skeleton className="h-5 w-5 rounded" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>

        {/* Panel content */}
        <div className="flex-1 p-5 space-y-6 overflow-hidden">
          {/* Section: Theme */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-20" />
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-xl" />
              ))}
            </div>
          </div>

          {/* Section: Colors */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-16" />
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-10 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Section: Typography */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>

          {/* Section: Logo */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Loading
