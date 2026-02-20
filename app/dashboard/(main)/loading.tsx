import { Skeleton } from '@/components/ui/skeleton'

const Loading = () => {
  return (
    <div className='space-y-6'>
      {/* Page title + action button row */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
        <div className='space-y-2'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-9 w-32 rounded-md' />
      </div>

      {/* Stats / summary row */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='rounded-xl border bg-card p-5 space-y-3'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-4 rounded' />
            </div>
            <Skeleton className='h-7 w-28' />
            <Skeleton className='h-3 w-20' />
          </div>
        ))}
      </div>

      {/* Two-column content row */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='rounded-xl border bg-card p-5 space-y-4'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-[220px] w-full rounded-lg' />
        </div>
        <div className='rounded-xl border bg-card p-5 space-y-4'>
          <Skeleton className='h-5 w-32' />
          <Skeleton className='h-[220px] w-full rounded-lg' />
        </div>
      </div>

      {/* Full-width content block */}
      <div className='rounded-xl border bg-card p-5 space-y-4'>
        <Skeleton className='h-5 w-40' />
        <div className='space-y-3'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3'>
              <Skeleton className='h-9 w-9 rounded-full flex-shrink-0' />
              <div className='flex-1 space-y-1.5'>
                <Skeleton className='h-4 w-1/3' />
                <Skeleton className='h-3 w-1/2' />
              </div>
              <Skeleton className='h-4 w-16' />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Loading