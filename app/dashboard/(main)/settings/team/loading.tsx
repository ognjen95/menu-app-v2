import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { TeamMembersGridSkeleton } from '@/components/ui/skeletons'

const Loading = () => {
  return (
    <div className='space-y-4 md:space-y-6'>
      {/* Header */}
      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
        <div className='space-y-1.5'>
          <Skeleton className='h-8 w-48' />
          <Skeleton className='h-4 w-72' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-8 rounded-md sm:w-32' />
          <Skeleton className='h-8 w-8 rounded-md sm:w-36' />
        </div>
      </div>

      {/* Pending Invitations Card */}
      <Card>
        <CardHeader>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-5 w-5 rounded' />
            <Skeleton className='h-5 w-40' />
          </div>
          <Skeleton className='h-4 w-32' />
        </CardHeader>
        <CardContent className='space-y-3'>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className='flex items-center justify-between p-3 rounded-lg border bg-muted/50'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-4 w-4 rounded' />
                <div className='space-y-1'>
                  <Skeleton className='h-4 w-48' />
                  <Skeleton className='h-3 w-40' />
                </div>
              </div>
              <Skeleton className='h-8 w-8 rounded-md' />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Team members grid */}
      <TeamMembersGridSkeleton count={6} />
    </div>
  )
}

export default Loading