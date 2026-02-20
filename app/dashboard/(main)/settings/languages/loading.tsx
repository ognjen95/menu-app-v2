import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { LanguagesGridSkeleton } from '@/components/ui/skeletons'

const Loading = () => {
  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1.5'>
          <Skeleton className='h-8 w-40' />
          <Skeleton className='h-4 w-72' />
        </div>
      </div>

      {/* Info card */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-5 rounded' />
            <Skeleton className='h-5 w-32' />
          </div>
        </CardHeader>
        <CardContent className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </CardContent>
      </Card>

      {/* Languages grid */}
      <LanguagesGridSkeleton count={6} />
    </div>
  )
}

export default Loading