import { Skeleton } from '@/components/ui/skeleton'
import { MenuSelectionGridSkeleton } from '@/components/ui/skeletons'

const Loading = () => {
  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1.5'>
          <Skeleton className='h-8 w-36' />
          <Skeleton className='h-4 w-56' />
        </div>
        <Skeleton className='h-9 w-32 rounded-md' />
      </div>

      <MenuSelectionGridSkeleton count={6} />
    </div>
  )
}

export default Loading