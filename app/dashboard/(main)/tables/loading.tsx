import { Skeleton } from '@/components/ui/skeleton'
import { TablesGridSkeleton } from '@/components/ui/skeletons'

const Loading = () => {
  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Header: title + export + add buttons */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-40' />
          <Skeleton className='h-4 w-64' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-8 rounded-md md:w-32' />
          <Skeleton className='h-8 w-8 rounded-md md:w-28' />
        </div>
      </div>

      {/* Location selector pills */}
      <div className='flex flex-wrap gap-2'>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className='h-9 w-28 rounded-md' />
        ))}
      </div>

      {/* Tables grid */}
      <TablesGridSkeleton count={8} />
    </div>
  )
}

export default Loading