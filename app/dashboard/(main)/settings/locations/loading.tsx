import { Skeleton } from '@/components/ui/skeleton'
import { LocationsGridSkeleton } from '@/components/ui/skeletons'

const Loading = () => {
  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1.5'>
          <Skeleton className='h-8 w-36' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-8 w-8 rounded-md sm:w-32 self-start md:self-auto' />
      </div>

      {/* Locations grid */}
      <LocationsGridSkeleton count={6} />
    </div>
  )
}

export default Loading