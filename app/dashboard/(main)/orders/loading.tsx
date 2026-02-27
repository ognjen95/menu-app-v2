import { Skeleton } from '@/components/ui/skeleton'
import { OrdersGridSkeleton, KanbanLayoutSkeleton } from '@/components/ui/skeletons'

const Loading = () => {
  return (
    <div className='h-full'>
      {/* Page header */}
      <div className='flex items-center justify-between flex-wrap gap-4 w-full pb-5 md:pb-3'>
        <div className='space-y-1.5'>
          <Skeleton className='h-8 w-24 md:h-9 md:w-32' />
          <Skeleton className='h-4 w-40 md:w-52' />
        </div>
        <div className='flex items-center gap-1 md:gap-2 flex-1'>
          {/* Location select */}
          <Skeleton className='h-9 w-24 md:w-[180px] rounded-md' />
          {/* Sound toggle - hidden on mobile */}
          <Skeleton className='hidden md:flex h-9 w-9 rounded-md' />
          {/* LIVE button - hidden on mobile */}
          <Skeleton className='hidden md:flex h-9 w-20 rounded-md' />
          {/* List/Kanban toggle - hidden on mobile */}
          <Skeleton className='hidden md:flex h-9 w-[72px] rounded-full' />
          {/* Refresh - hidden on mobile */}
          <Skeleton className='hidden md:flex h-9 w-9 rounded-md' />
          {/* New Order - hidden on mobile (FAB instead) */}
          <Skeleton className='hidden md:flex h-10 w-32 rounded-md' />
        </div>
      </div>

      {/* Status filter pills - inline on mobile */}
      <div className='flex flex-wrap gap-2 md:gap-3 pb-3 items-center justify-between md:justify-start'>
        {/* All + 5 statuses */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-9 px-3 w-12 rounded-md md:h-14 md:w-28' />
        ))}
      </div>

      {/* Content: cards on mobile, kanban on desktop */}
      <div className='pt-5'>
        <div className='md:hidden'>
          <OrdersGridSkeleton count={6} />
        </div>
        <div className='hidden md:block overflow-x-auto -mx-6 px-6'>
          <KanbanLayoutSkeleton columns={5} />
        </div>
      </div>

      {/* Mobile FAB skeleton */}
      <div className='md:hidden fixed bottom-[100px] right-4 z-10'>
        <Skeleton className='h-10 w-32 rounded-md' />
      </div>
    </div>
  )
}

export default Loading