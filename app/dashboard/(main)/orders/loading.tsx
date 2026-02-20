import { Skeleton } from '@/components/ui/skeleton'
import { OrdersGridSkeleton, KanbanLayoutSkeleton } from '@/components/ui/skeletons'

const Loading = () => {
  return (
    <div className='space-y-6 h-full'>
      {/* Page header */}
      <div className='flex items-center justify-between flex-wrap gap-4'>
        <div className='space-y-1.5'>
          <Skeleton className='h-9 w-32' />
          <Skeleton className='h-4 w-52' />
        </div>
        <div className='flex items-center gap-2'>
          {/* Location select */}
          <Skeleton className='h-9 w-[180px] rounded-md' />
          {/* LIVE button - hidden on mobile */}
          <Skeleton className='hidden md:block h-9 w-20 rounded-md' />
          {/* List/Kanban toggle - hidden on mobile */}
          <Skeleton className='hidden md:block h-9 w-[72px] rounded-full' />
          {/* Refresh */}
          <Skeleton className='h-9 w-9 rounded-md' />
          {/* New Order */}
          <Skeleton className='h-9 w-9 rounded-md md:w-32' />
        </div>
      </div>

      {/* Status filter pills */}
      <div className='flex flex-wrap gap-2 md:gap-3'>
        {/* All + 5 statuses */}
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className='h-9 w-16 rounded-md md:h-14 md:w-28' />
        ))}
      </div>

      {/* Content: list on mobile, kanban on desktop */}
      <div className='md:hidden'>
        <OrdersGridSkeleton count={6} />
      </div>
      <div className='hidden md:block overflow-x-auto -mx-6 px-6'>
        <KanbanLayoutSkeleton columns={5} />
      </div>
    </div>
  )
}

export default Loading